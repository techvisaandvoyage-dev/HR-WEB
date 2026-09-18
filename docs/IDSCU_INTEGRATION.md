# IDSCU Public Education Directory Integration

This document outlines the architecture, configuration, endpoints, and usage of the **IDSCU Public Education Directory API** integration.

---

## 1. Overview
The IDSCU integration provides unified searching and autocomplete for educational institutions worldwide:
- **K–12 Schools** (Elementary, Middle, High School, Primary, Secondary)
- **Postsecondary Institutions** (Universities, Colleges, Higher Education Institutes, Vocational/Technical Institutes)
- **Geographic Coverage:** India (IN) and 200+ countries worldwide.

---

## 2. Architecture & Data Flow

```text
React Frontend (InstituteAutocomplete)
   │
   ▼  GET /api/education/search?q=&country=&sector=&cursor=
Express Backend Proxy (server/routes/educationRoutes.js & server/controllers/educationController.js)
   │
   ▼  In-Memory TTL Cache (5 min) / IDSCU Service (server/services/idscuService.js)
   │
   ▼  GET https://idscu.org/api/v1/search
IDSCU Public API (https://idscu.org)
```

---

## 3. Environment Variables

In `server/.env`:
```env
IDSCU_BASE_URL=https://idscu.org/api/v1
```

---

## 4. Backend Endpoints

### `GET /api/education/search`
Search schools and higher education institutions with optional filters and cursor pagination.

#### Query Parameters:
| Param | Type | Description |
| :--- | :--- | :--- |
| `q` | `string` | Search query (e.g., `Delhi University`, `Harvard`, `St Xavier`) |
| `country` | `string` | Country name or ISO code (e.g. `India`, `United States`, `IN`, `US`) |
| `sector` | `string` | `K12` for schools, `POSTSECONDARY` for colleges/universities |
| `type` | `string` | Specific institution type filter |
| `cursor` | `string` | Cursor token for retrieving the next page of results |

#### Normalized Response Format:
```json
{
  "success": true,
  "data": [
    {
      "id": "PS-6833",
      "name": "All India Institute of Ayurveda, New Delhi",
      "nameOfficial": "All India Institute of Ayurveda, New Delhi",
      "acronym": "AIIA",
      "slug": "all-india-institute-of-ayurveda-new-delhi",
      "country": "India",
      "countryCode": "IN",
      "region": "Delhi",
      "city": "New Delhi",
      "type": "Higher education institution",
      "sector": "POSTSECONDARY",
      "pathway": "Higher Education",
      "website": "https://aiia.gov.in",
      "logoUrl": null
    }
  ],
  "nextCursor": "YXJ1bmFjaGFsIHByYWRlc2ggdW5pdmVyc2l0eQBQUy0xNzQ2",
  "pagination": {
    "total": null,
    "next_cursor": "YXJ1bmFjaGFsIHByYWRlc2ggdW5pdmVyc2l0eQBQUy0xNzQ2"
  },
  "filters": {}
}
```

### `GET /api/education/meta`
Returns release metadata and total directory counts.

---

## 5. Frontend Component (`InstituteAutocomplete.jsx`)

Located at: `client/src/components/common/InstituteAutocomplete.jsx`

### Features:
- **350ms Debounced Input:** Avoids unnecessary network calls while candidate is typing.
- **Country Filter Selector:** Toggle between Worldwide / All Countries or specific countries (India, US, UK, Canada, etc.).
- **Sector Switcher:** Filter by Higher Ed/Universities (`POSTSECONDARY`) vs Schools (`K12`).
- **Cursor-based Pagination:** Includes "Load more institutions ↓" button when `nextCursor` exists.
- **Custom Name Fallback:** If an institution is not listed, candidates can type their exact institution name and continue.
- **Clean UI Badges:** Shows institution type (`University`, `College`, `School`), location pin (`City, Region, Country`), and official domain.

---

## 6. How to Test

### Automated Terminal Test:
```bash
# Search India universities
curl "http://localhost:5000/api/education/search?q=Delhi&country=India"

# Search worldwide universities
curl "http://localhost:5000/api/education/search?q=Harvard"

# Search K-12 schools
curl "http://localhost:5000/api/education/search?q=Delhi&sector=K12"

# Get metadata
curl "http://localhost:5000/api/education/meta"
```

### UI Testing:
1. Open the Candidate Onboarding or Profile screen (`/onboarding` or `/employee/profile`).
2. Go to **Step 2: Education**.
3. In the **University / Institute** input field, type `Delhi`, `IIT`, `Harvard`, or `Oxford`.
4. Observe the live suggestions with location and type badges.
5. Click **Load more institutions ↓** to test cursor pagination.
