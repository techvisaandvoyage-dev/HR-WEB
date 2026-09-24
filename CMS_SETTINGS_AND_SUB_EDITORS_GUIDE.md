# CMS Settings & Sub-Editor Modals Architecture Guide

Yeh guide HR Project ke Admin Panel CMS me bane sabhi settings, unke **"Edit" buttons**, aur unke andar khulne wale **Sub-Editor Modals (Add / Remove / Edit Options)** ke architecture, workflow aur implementation patterns ko explain karta hai taaki aage bhi koi bhi naya setting ya option manager banana ho to isi standard pattern ko follow kiya ja sake.

---

## 1. System Architecture & Data Flow

Admin CMS se lekar Frontend Modal tak ka complete end-to-end data flow:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Admin Panel (EmployersTab.jsx / EmployeesTab.jsx)        │
│    - Trigger Button ("Edit Hiring For", "Edit Industries")  │
│    - Sub-Editor Modal (Add / Remove / Inline Edit / Reset)  │
│    - Instant "Save & Apply" or main "Save Changes" button   │
└──────────────────────────────┬──────────────────────────────┘
                               │ PUT /api/homepage
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Backend Server (server.js & HomepageConfig Model)        │
│    - Schema type: mongoose.Schema.Types.Mixed (flexible)    │
│    - Automatically persists any nested JSON structure       │
└──────────────────────────────┬──────────────────────────────┘
                               │ GET /api/homepage
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Client Frontend (EmployerRegisterModal.jsx)              │
│    - Fetches cmsConfig on modal open                        │
│    - Reads dynamic options array with fallback defaults     │
│    - Renders dynamic Radio Choices / Dropdown Selectors     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Pattern 1: Flat Options Manager ("Edit Hiring For" Pattern)

Yeh pattern simple 1-level option lists ke liye use hota hai (jaise Radio Buttons, Simple Dropdowns, Badges).

### A. Data Structure
```javascript
// Default Options array
export const DEFAULT_EMPLOYER_HIRING_FOR_OPTIONS = [
  { id: 'your_company', value: 'your_company', label: 'Your Company' },
  { id: 'consultant', value: 'consultant', label: 'Consultant / Staffing Agency' }
];

// Inside DEFAULT_EMPLOYER_REGISTER_CONFIG
export const DEFAULT_EMPLOYER_REGISTER_CONFIG = {
  // ... other fields
  hiringForLabel: 'Hiring For',
  hiringForOptions: DEFAULT_EMPLOYER_HIRING_FOR_OPTIONS,
};
```

### B. Admin States Required
```javascript
const [isHiringForModalOpen, setIsHiringForModalOpen] = useState(false);
const [modalHiringForLabel, setModalHiringForLabel] = useState('Hiring For');
const [hiringForModalList, setHiringForModalList] = useState([]);
const [newHiringForLabel, setNewHiringForLabel] = useState('');
const [hiringForModalError, setHiringForModalError] = useState('');
```

### C. Admin Helper Handlers
```javascript
// 1. Open Modal & clone current state
const handleOpenHiringForModal = () => {
  const current = registerConfig.hiringForOptions && registerConfig.hiringForOptions.length > 0
    ? registerConfig.hiringForOptions
    : DEFAULT_EMPLOYER_HIRING_FOR_OPTIONS;
  setModalHiringForLabel(registerConfig.hiringForLabel || 'Hiring For');
  setHiringForModalList(JSON.parse(JSON.stringify(current)));
  setNewHiringForLabel('');
  setHiringForModalError('');
  setIsHiringForModalOpen(true);
};

// 2. Add New Option
const handleAddHiringForOption = () => {
  const trimmed = newHiringForLabel.trim();
  if (!trimmed) {
    setHiringForModalError('Please enter an option label');
    return;
  }
  if (hiringForModalList.some(opt => opt.label.trim().toLowerCase() === trimmed.toLowerCase())) {
    setHiringForModalError('An option with this label already exists');
    return;
  }
  const slugVal = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || `opt_${Date.now()}`;
  const newOpt = {
    id: `hf_${Date.now()}`,
    value: slugVal,
    label: trimmed
  };
  setHiringForModalList(prev => [...prev, newOpt]);
  setNewHiringForLabel('');
  setHiringForModalError('');
};

// 3. Delete Option (Protected against 0 items)
const handleDeleteHiringForOption = (indexToDelete) => {
  if (hiringForModalList.length <= 1) {
    setHiringForModalError('At least one hiring option is required');
    return;
  }
  setHiringForModalList(prev => prev.filter((_, idx) => idx !== indexToDelete));
  setHiringForModalError('');
};

// 4. Inline Edit Label
const handleEditHiringForLabel = (index, newLabel) => {
  setHiringForModalList(prev => prev.map((opt, idx) => idx === index ? { ...opt, label: newLabel } : opt));
};

// 5. Reset to Factory Defaults
const handleResetHiringForOptions = () => {
  setModalHiringForLabel('Hiring For');
  setHiringForModalList(JSON.parse(JSON.stringify(DEFAULT_EMPLOYER_HIRING_FOR_OPTIONS)));
  setHiringForModalError('');
};

// 6. Save & Directly Publish to API
const handleSaveHiringForModal = async () => {
  if (hiringForModalList.length === 0) {
    setHiringForModalError('Please have at least one option.');
    return;
  }
  const updatedConfig = {
    ...registerConfig,
    hiringForLabel: modalHiringForLabel.trim() || 'Hiring For',
    hiringForOptions: hiringForModalList
  };
  setRegisterConfig(updatedConfig);
  setIsHiringForModalOpen(false);

  try {
    setSaving(true);
    const res = await fetch(`${API_URL}/api/homepage`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employerRegister: updatedConfig,
        employerLogin: loginConfig
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Hiring For settings saved & published successfully!');
    }
  } catch (err) {
    console.error('Error saving hiring for options:', err);
  } finally {
    setSaving(false);
  }
};
```

### D. Admin UI Component (Section Card with Title Input, "Edit" Button & Tags)
```jsx
<div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100/80 space-y-3">
  <div className="flex items-center justify-between">
    <div>
      <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider">
        "Hiring For" Radio Choices & Field Label
      </label>
      <p className="text-[11px] text-purple-700/80 mt-0.5">
        Configure heading text and choices shown to employers in Step 2
      </p>
    </div>
    <button
      type="button"
      onClick={handleOpenHiringForModal}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-extrabold transition-all cursor-pointer shadow-2xs hover:scale-105"
    >
      <SlidersHorizontal className="w-3.5 h-3.5" />
      <span>Edit Hiring For</span>
    </button>
  </div>

  {/* Field Title / Label Input */}
  <div>
    <label className="block text-[11px] font-semibold text-purple-900 mb-1">
      Section Title / Field Label
    </label>
    <input
      type="text"
      value={registerConfig.hiringForLabel || 'Hiring For'}
      onChange={(e) => setRegisterConfig(prev => ({ ...prev, hiringForLabel: e.target.value }))}
      placeholder="e.g. Hiring For"
      className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs font-semibold text-gray-900 focus:outline-none focus:border-purple-500"
    />
  </div>

  {/* Active Options Tags Preview */}
  <div>
    <span className="block text-[11px] font-semibold text-purple-900/80 mb-1.5">
      Active Radio Options ({(registerConfig.hiringForOptions || DEFAULT_EMPLOYER_HIRING_FOR_OPTIONS).length}):
    </span>
    <div className="flex flex-wrap items-center gap-2">
      {(registerConfig.hiringForOptions || DEFAULT_EMPLOYER_HIRING_FOR_OPTIONS).map((opt, idx) => (
        <span
          key={opt.id || opt.value || idx}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-purple-200 text-purple-900 rounded-lg text-xs font-bold shadow-2xs"
        >
          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
          <span>{opt.label}</span>
        </span>
      ))}
    </div>
  </div>
</div>
```

### E. Sub-Editor Modal Popup UI
```jsx
{isHiringForModalOpen && (
  <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
      
      {/* Header */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-white to-purple-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 text-base">Manage "Hiring For" Options</h3>
            <p className="text-xs text-gray-500">Add, edit, or remove radio choices</p>
          </div>
        </div>
        <button onClick={() => setIsHiringForModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 overflow-y-auto space-y-5">
        {/* Section Heading Text Input */}
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-1.5">
          <label className="block text-xs font-bold text-gray-800">
            Section Title / Field Label Text
          </label>
          <input
            type="text"
            placeholder="e.g. Hiring For"
            value={modalHiringForLabel}
            onChange={(e) => setModalHiringForLabel(e.target.value)}
            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold"
          />
        </div>

        {/* Add Box */}
        <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-2">
          <label className="block text-xs font-bold text-purple-950">Add New Hiring Option</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Consultant / Staffing Agency"
              value={newHiringForLabel}
              onChange={(e) => setNewHiringForLabel(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-white border border-purple-200 rounded-xl text-xs font-medium"
            />
            <button
              type="button"
              onClick={handleAddHiringForOption}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Option</span>
            </button>
          </div>
          {hiringForModalError && <p className="text-xs text-red-600 font-semibold">{hiringForModalError}</p>}
        </div>

        {/* Existing List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 uppercase">Current Options ({hiringForModalList.length})</span>
            <button onClick={handleResetHiringForOptions} className="text-xs text-purple-700 font-bold flex items-center gap-1">
              <RotateCcw className="w-3 h-3" /> Reset to Defaults
            </button>
          </div>

          {hiringForModalList.map((opt, idx) => (
            <div key={opt.id || idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                {idx + 1}
              </span>
              <input
                type="text"
                value={opt.label}
                onChange={(e) => handleEditHiringForLabel(idx, e.target.value)}
                className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
              />
              <button
                type="button"
                onClick={() => handleDeleteHiringForOption(idx)}
                disabled={hiringForModalList.length <= 1}
                className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg disabled:opacity-30"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-500">Click "Save & Apply" to publish.</span>
        <div className="flex gap-2">
          <button onClick={() => setIsHiringForModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded-xl">
            Cancel
          </button>
          <button onClick={handleSaveHiringForModal} className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5" />
            <span>Save & Apply</span>
          </button>
        </div>
      </div>

    </div>
  </div>
)}
```

### F. Frontend Consumer (`EmployerRegisterModal.jsx`)
```jsx
{/* Dynamic Hiring For Radio Choice */}
<div className="space-y-1.5">
  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
    {cmsConfig?.hiringForLabel || 'Hiring For'}
  </label>
  <div className="flex flex-wrap gap-4">
    {(cmsConfig?.hiringForOptions && cmsConfig.hiringForOptions.length > 0
      ? cmsConfig.hiringForOptions
      : [
          { id: 'your_company', value: 'your_company', label: cmsConfig?.hiringForCompanyLabel || 'Company / Business' },
          { id: 'consultant', value: 'consultant', label: cmsConfig?.hiringForConsultantLabel || 'Individual / Proprietor' }
        ]
    ).map((opt) => {
      const optVal = opt.value || opt.id;
      return (
        <label key={optVal} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="hiringFor"
            value={optVal}
            checked={hiringFor === optVal}
            onChange={(e) => {
              const val = e.target.value;
              setHiringFor(val);
              setAccountType(val.toLowerCase().includes('company') || val.toLowerCase().includes('business') ? 'company' : 'individual');
            }}
            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 accent-emerald-600"
          />
          <span className="text-sm font-medium text-gray-700">{opt.label}</span>
        </label>
      );
    })}
  </div>
</div>
```

---

## 3. Pattern 2: Hierarchical Category & Roles Manager ("Edit Industries & Roles" Pattern)

Yeh pattern tab use hota hai jab **Category select karne par uske specific Sub-Roles** dynamically change hote hain.

### A. Data Structure
```javascript
export const DEFAULT_EMPLOYER_INDUSTRIES_DATA = {
  'Information Technology': [
    'CTO (Chief Technology Officer)',
    'VP of Engineering',
    'Technical Lead',
    'HR Manager – Tech',
    'Other'
  ],
  'Finance & Banking': [
    'CFO (Chief Financial Officer)',
    'Finance Manager',
    'Accounts Manager',
    'Other'
  ],
  'Healthcare & Pharma': [
    'Medical Director',
    'Hospital Administrator',
    'Pharmacy Manager',
    'Other'
  ]
  // ...
};
```

### B. Admin States Required
```javascript
const [isIndustriesModalOpen, setIsIndustriesModalOpen] = useState(false);
const [selectedIndustry, setSelectedIndustry] = useState('Information Technology');
const [newIndustryName, setNewIndustryName] = useState('');
const [newRoleName, setNewRoleName] = useState('');
const [draggedIndustryIndex, setDraggedIndustryIndex] = useState(null);
const [dragOverIndustryIndex, setDragOverIndustryIndex] = useState(null);
```

### C. Admin Helper Handlers
1. **`handleAddIndustryModal`**: Naya parent category (Industry) create karta hai empty roles array ke saath.
2. **`handleDeleteIndustryModal`**: Selected industry ko delete karke next available industry ko select karta hai.
3. **`handleAddRoleModal`**: Currently selected parent category ke andar naya role/designation add karta hai.
4. **`handleDeleteRoleModal`**: Selected industry se specific index wala role remove karta hai.
5. **`handleIndustryDragStart / handleIndustryDrop`**: Categories ko drag & drop karke reorder karne ki functionality.
6. **`handleResetIndustriesModal`**: Default 16 standard industries aur unke predefined roles par reset karta hai.

### D. Admin UI Component
Industry field row ke andar right side par button:
```jsx
{item.key === 'industry' && (
  <button
    type="button"
    onClick={() => {
      const allIndustries = Object.keys(registerConfig.step2?.industriesData || DEFAULT_EMPLOYER_INDUSTRIES_DATA);
      if (!allIndustries.includes(selectedIndustry)) {
        setSelectedIndustry(allIndustries[0] || '');
      }
      setIsIndustriesModalOpen(true);
    }}
    className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full text-[11px] font-extrabold transition-all cursor-pointer shadow-2xs hover:scale-105"
  >
    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
    <span>Edit Industries & Roles</span>
  </button>
)}
```

### E. Frontend Dynamic Linking (`EmployerRegisterModal.jsx`)
```javascript
// 1. Dynamic Industry list from CMS
const industryOptions = useMemo(() => {
  if (cmsConfig?.step2?.industriesData && Object.keys(cmsConfig.step2.industriesData).length > 0) {
    return Object.keys(cmsConfig.step2.industriesData).map(ind => ({ value: ind, label: ind }));
  }
  return EMPLOYER_INDUSTRIES.map(ind => ({ value: ind, label: ind }));
}, [cmsConfig]);

// 2. Dynamic Designation roles list linked to selected Industry
const designationOptions = useMemo(() => {
  if (!industry) return [];
  if (cmsConfig?.step2?.industriesData && cmsConfig.step2.industriesData[industry]) {
    return cmsConfig.step2.industriesData[industry].map(r => ({ value: r, label: r }));
  }
  return getDesignationsForIndustry(industry).map(r => ({ value: r, label: r }));
}, [industry, cmsConfig]);
```

---

## 4. Key Rules & Best Practices for Future Settings

Jab bhi koi naya setting ya option manager banana ho, in 6 rules ko follow karein:

1. **Always provide Safe Fallbacks**: Agar database empty ho ya initial load par koi field missing ho, toh frontend crash nahi hona chahiye. `(cmsConfig?.myOptionList || DEFAULT_OPTIONS)` pattern use karein.
2. **Instant "Save & Apply"**: Sub-Editor Modal ke footer me "Save & Apply" button se state update hone ke saath-saath direct `PUT /api/homepage` call karein taaki user ko modal band karke dobara main page ka Save button na dabana pade.
3. **Duplicate Prevention**: Add button par duplicate values check karein (`.some(...)`).
4. **Minimum 1 Item Protection**: Delete button par `list.length <= 1` condition lagayein taaki user galti se saare options delete karke form break na kar de.
5. **Non-destructive Reset**: Hamesha ek "Reset to Defaults" button de jisse agar admin se koi galat configuration ho jaye to woh 1-click me default par aa sake.
6. **Consistent Aesthetics**:
   - Purple theme for Hiring/Auth controls (`bg-purple-50`, `text-purple-700`, `border-purple-200`)
   - Emerald theme for Industry/Category/Roles controls (`bg-emerald-50`, `text-emerald-700`, `border-emerald-300`)
   - Blue theme for Mandatory/Optional field badges.
