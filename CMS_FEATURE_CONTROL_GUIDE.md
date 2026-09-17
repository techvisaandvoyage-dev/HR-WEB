# 🚀 CMS Feature & Text Control Architecture Guide
> **Standard Operating Blueprint for building dynamic CMS-controlled features across the HR Platform.**

---

## 📌 Architecture Overview

Every customizable section (e.g. Employee Login, Register, Employer Auth, Job Application, Homepage sections) follows a **single, unified 4-step pipeline**:

```
 ┌────────────────────────┐         ┌────────────────────────┐         ┌────────────────────────┐
 │   1. Admin CMS UI      │  ───►   │   2. Express Backend   │  ───►   │  3. MongoDB Database   │
 │ (Inputs + Live Preview)│ (PUT)   │  (/api/homepage route) │ (Save)  │ (HomepageConfig Model) │
 └────────────────────────┘         └────────────────────────┘         └────────────────────────┘
                                                │
                                                ▼ (GET /api/homepage)
                                    ┌────────────────────────┐
                                    │ 4. Client Web Platform │
                                    │ (Dynamic Modals/Pages) │
                                    └────────────────────────┘
```

---

## 🛠️ The 4-Step Standard Implementation Blueprint

---

### 1️⃣ Step 1: Database Model (`server/models/HomepageConfig.js`)

When adding a new customizable section or modal:
1. Define the section in `HomepageConfig.js` using `mongoose.Schema.Types.Mixed`.
2. Ensure the schema has `{ timestamps: true, strict: false }`.

```javascript
// server/models/HomepageConfig.js
const mongoose = require('mongoose');

const homepageConfigSchema = new mongoose.Schema({
  // ... existing sections ...

  // Example: Employee Register Config
  employeeRegister: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Example: Employee Login Config
  employeeLogin: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // ➕ NEW FEATURE: Add your new section here (e.g. employerAuth, jobDetailsConfig, etc.)
  newFeatureConfig: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  strict: false // Allows dynamic nested fields without rigid schema restrictions
});

module.exports = mongoose.model('HomepageConfig', homepageConfigSchema);
```

> **💡 Best Practice**: Using `mongoose.Schema.Types.Mixed` + `strict: false` guarantees that deeply nested fields (like labels, placeholders, toggles, subtext) are never stripped or rejected during Mongoose validation.

---

### 2️⃣ Step 2: Backend API Routes (`server/routes/homepageRoutes.js`)

In the PUT handler, add explicit mapping and `config.markModified()` for your new feature key:

```javascript
// server/routes/homepageRoutes.js

// PUT update homepage configuration
router.put('/', async (req, res) => {
  try {
    let config = await HomepageConfig.findOne();
    if (!config) {
      config = new HomepageConfig(req.body);
    } else {
      // Existing updates...
      if (req.body.employeeRegister !== undefined) {
        config.employeeRegister = req.body.employeeRegister;
        config.markModified('employeeRegister');
      }

      if (req.body.employeeLogin !== undefined) {
        config.employeeLogin = req.body.employeeLogin;
        config.markModified('employeeLogin');
      }

      // ➕ NEW FEATURE: Handle incoming data for new feature
      if (req.body.newFeatureConfig !== undefined) {
        config.newFeatureConfig = req.body.newFeatureConfig;
        config.markModified('newFeatureConfig');
      }
    }

    const updated = await config.save();
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});
```

---

### 3️⃣ Step 3: Admin CMS Page (`admin/src/pages/...`)

The Admin CMS page needs:
1. **Initial State with Defaults**
2. **`fetchConfig()` on mount**
3. **Change Handlers** (`handleFieldChange`)
4. **`handleSave()`** sending `PUT /api/homepage`
5. **Left Column**: Form Controls (Inputs, Placeholders, Toggles)
6. **Right Column**: Real-Time Live Preview

#### Standard Code Template:

```jsx
import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Sparkles, Lock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function FeatureTabEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 1. Feature State with robust defaults
  const [featureConfig, setFeatureConfig] = useState({
    title: 'Default Feature Title',
    subtitle: 'Default subtitle',
    buttonText: 'Submit',
    fields: {
      fieldOne: { label: 'Field One', placeholder: 'Enter value...', isRequired: true },
      fieldTwo: { label: 'Field Two', placeholder: 'Enter value...', isRequired: true }
    }
  });

  // 2. Fetch on mount
  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/homepage`);
      const data = await res.json();
      if (data.success && data.data?.newFeatureConfig) {
        setFeatureConfig(prev => ({
          ...prev,
          ...data.data.newFeatureConfig,
          fields: {
            ...prev.fields,
            ...(data.data.newFeatureConfig.fields || {})
          }
        }));
      }
    } catch (err) {
      console.error('Error loading config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // 3. Field change helper
  const handleFieldChange = (fieldKey, property, value) => {
    setFeatureConfig(prev => ({
      ...prev,
      fields: {
        ...prev.fields,
        [fieldKey]: {
          ...(prev.fields[fieldKey] || {}),
          [property]: value
        }
      }
    }));
  };

  // 4. Save to Backend
  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`${API_URL}/api/homepage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newFeatureConfig: featureConfig
        })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage('Settings saved successfully!');
        setTimeout(() => setToastMessage(''), 3000);
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left 7 Columns: Form Controls */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200">
          <label className="block text-xs font-bold text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={featureConfig.title || ''}
            onChange={(e) => setFeatureConfig(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg text-xs"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Right 5 Columns: Live Real-Time Preview */}
      <div className="lg:col-span-5">
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xl">
          <h3 className="font-bold text-lg">{featureConfig.title}</h3>
          <p className="text-xs text-gray-500">{featureConfig.subtitle}</p>
        </div>
      </div>
    </div>
  );
}
```

---

### 4️⃣ Step 4: Client Web Platform Component (`client/src/components/...`)

In the client component (e.g. Modal, Page, Card, Header):
1. Create a `cmsConfig` state.
2. In `useEffect`, fetch `/api/homepage` on component mount or modal open (`isOpen`).
3. Define the `getFieldConfig(key, defaultLabel, defaultPlaceholder, defaultRequired)` helper.
4. Render using fallbacks (`cmsConfig?.buttonText || 'Default Text'`).

```jsx
// client/src/components/feature/MyFeatureComponent.jsx
import React, { useState, useEffect } from 'react';

const MyFeatureComponent = ({ isOpen, onClose }) => {
  const [cmsConfig, setCmsConfig] = useState(null);

  // 1. Fetch CMS configuration on open / mount
  useEffect(() => {
    const fetchCmsConfig = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/homepage`);
        const data = await res.json();
        if (data.success && data.data?.newFeatureConfig) {
          setCmsConfig(data.data.newFeatureConfig);
        }
      } catch (err) {
        console.error('Error fetching CMS config:', err);
      }
    };

    if (isOpen) {
      fetchCmsConfig();
    }
  }, [isOpen]);

  // 2. Safe Field Config Resolver with Defaults
  const getFieldConfig = (key, defaultLabel, defaultPlaceholder, defaultRequired = true) => {
    const field = cmsConfig?.fields?.[key];
    return {
      label: field?.label || defaultLabel,
      placeholder: field?.placeholder || defaultPlaceholder,
      isRequired: field?.isRequired !== undefined ? field.isRequired : defaultRequired
    };
  };

  const fieldOneConfig = getFieldConfig('fieldOne', 'Field One Label', 'Enter field one', true);
  const fieldTwoConfig = getFieldConfig('fieldTwo', 'Field Two Label', 'Enter field two', false);

  if (!isOpen) return null;

  return (
    <div className="modal-container">
      {/* Title */}
      <h2>{cmsConfig?.title || 'Default Title'}</h2>

      {/* Inputs */}
      <div>
        <label>
          {fieldOneConfig.label}
          {fieldOneConfig.isRequired && <span className="text-red-500 font-bold ml-1">*</span>}
        </label>
        <input placeholder={fieldOneConfig.placeholder} />
      </div>

      {/* Button */}
      <button>
        {cmsConfig?.buttonText || 'Submit'}
      </button>
    </div>
  );
};

export default MyFeatureComponent;
```

---

## ⚡ Key Rules & Best Practices Checklist

| # | Rule | Why it matters |
|---|---|---|
| 1 | **Always provide fallback values in Client Components** (`cmsConfig?.title \|\| 'Default Title'`) | Guarantees the application never renders blank or crashes if backend API is offline. |
| 2 | **Use `mongoose.Schema.Types.Mixed` and `strict: false`** in `HomepageConfig.js` | Prevents Mongoose from discarding dynamic nested objects or properties. |
| 3 | **Call `config.markModified('featureKey')` before `config.save()`** in Express | Informs Mongoose that a Mixed/Object field has mutated so it writes to MongoDB. |
| 4 | **Add Live Preview in Admin UI** | Gives administrators instant real-time visual feedback before saving. |
| 5 | **Restart Node backend process when updating schemas** | Mongoose caches model definitions in memory at process startup. |

---

## 📂 Summary of Current Controlled Features

- **Candidate Register Modal** (`employeeRegister`) -> `EmployeesTab.jsx` > Register sub-tab
- **Candidate Login Modal** (`employeeLogin`) -> `EmployeesTab.jsx` > Login sub-tab
- **Candidate Onboarding 6-Step Flow** (`employeeOnboarding`) -> `EmployeesTab.jsx` > Onboarding tab (Step 1 to Step 6 + Dynamic Functions & Designations Manager)
- **Brand Logo & Favicon** (`logo`) -> `HomepageCMS` > Logo tab
- **Global Typography & Fonts** (`typography`) -> `HomepageCMS` > Typography tab
- **Hero & Search Bar** (`hero`, `searchBar`) -> `HomepageCMS` > Hero tab
