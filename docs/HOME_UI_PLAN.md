# SahiJob Home Page UI Modernization — Implementation Plan

> **Role & Objective:** Senior Frontend/MERN Architect plan for transitioning the SahiJob Home experience (Guest Landing, Logged-in Job Feed, Headers, Search Modal, Details Drawer, Support, Toast, and Admin Master Colors) to the new modern design token theme from `SahiJob_com___Orange__2_.html`.
> **Execution Strategy:** Phase-by-phase execution by a fast AI model (Gemini Flash). Every phase is atomic, explicit, and backed by a strict "DO NOT TOUCH" boundary and a manual acceptance checklist.

---

## 1. Executive Summary & Non-Negotiable Rules

### A. Architectural Guardrails
1. **Zero Source Destruction:** Old UI is not deleted. The new UI lives entirely isolated inside `client/src/components/sj-home/`.
2. **Feature Toggle:** Controlled by an explicit toggle flag `USE_NEW_HOME_UI` in `client/src/config/themeConfig.js` (or environment variable `VITE_USE_NEW_HOME_UI`). When `false`, the platform behaves exactly as it does today.
3. **Scoped CSS Only:** All styles must live inside a `.sj-theme` wrapper or CSS Modules. Under no circumstances should global element selectors (`body`, `input`, `button`, `*`) be overridden in `index.css`.
4. **Backend & Logic Preservation:** Zero changes to existing authentication logic, JWT token keys, API endpoints, payload contracts, validation logic, URL routes, Mongoose query filters, or admin capabilities outside the additive theme schema in Phase H7.
5. **No Native HTML Demo Data / Vanilla JS:** The raw JavaScript and inline arrays (`jobs = [...]`, vanilla DOM selectors `$("#...")`) in the HTML mockup must NOT be copied. Everything must be implemented idiomatic to React 18+ hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`).
6. **No External Library Bloat:** No new npm libraries (e.g. no new modal or toast libraries). We leverage existing React hooks and clean CSS/Tailwind animations.

---

## 2. Repo Audit Findings

| Component / Concern | Existing File Path | Current Implementation Details |
| :--- | :--- | :--- |
| **Tailwind Config** | `client/tailwind.config.js` | Extends `fontFamily` (Plus Jakarta Sans) and `colors.palette` (`100`, `200`, `400`, `900`). Needs CSS variable linkage. |
| **Global Stylesheet** | `client/src/index.css` | Imports `@tailwind base, components, utilities`. Defines `:root` CSS variables (`--brand`, `--text`, `--line`, etc.) and sets global `input:focus { outline: none !important }`. |
| **Routing Setup** | `client/src/App.jsx` | React Router v6. Route `/` hosts the Guest Landing inline; Route `/employee` hosts `EmployeeHomepage.jsx`. |
| **Guest Home Page** | `client/src/App.jsx` (L671–968) | Inline JSX containing Nav, Hero, Search bar, and `filteredHomepageJobs` grid. |
| **Logged-In Home Feed** | `client/src/components/employee/EmployeeHomepage.jsx` | Rich feed with job match algorithm, tabs, filters, and salary formatting. |
| **Guest Header** | `client/src/App.jsx` (L674–743) | Inline `<nav>` with brand logo and 3 login triggers (Employee, Employer, Consultant). |
| **Logged-In Header** | `client/src/components/common/EmployeeNavbar.jsx` | Sticky navbar with profile avatar, saved jobs counter, notification triggers, and dropdown. |
| **Footer** | `client/src/components/common/Footer.jsx` & `Footer.css` | Dynamic footer fetching CMS links, columns, and social icons from `/api/footer`. |
| **Support Widget** | `client/src/components/common/SupportWidget.jsx` & `SupportWidget.css` | Floating launcher button and multi-step issue reporting modal connected to socket.io and `/api/support`. |
| **Modals** | `client/src/components/employee/EmployeeLoginModal.jsx`<br>`client/src/components/employee/EmployeeRegisterModal.jsx`<br>`client/src/components/employer/EmployerLoginModal.jsx`<br>`client/src/components/employer/EmployerRegisterModal.jsx` | Portals/fixed modals triggered via boolean state in `App.jsx`. |
| **Public Jobs API** | `server/routes/employeeRoutes.js` (`GET /api/employee/jobs`) | Returns active verified job listings. Connected in `App.jsx` and `EmployeeHomepage.jsx`. |
| **CMS Config API** | `server/routes/homepageRoutes.js` (`GET /api/homepage`, `PUT /api/homepage`) | Backed by `server/models/HomepageConfig.js`. Stores logo, typography, hero copy, and banner configs. |
| **Auth Detection** | `client/src/App.jsx` | Evaluates `localStorage.getItem('employeeToken')` and `localStorage.getItem('employerToken')`. |

---

## 3. Risk & Clash Assessment

### Risk 1: Circular `--soft: var(--soft)` in Mockup
* **Issue:** In `SahiJob_com___Orange__2_.html` line 10, `:root { --soft: var(--soft) }` is invalid and circular.
* **Analysis:** Throughout the mockup, `--soft` is used for subtle container backgrounds: `.sc` (search pill), `.ib:hover` (icon button hover), `.row:hover` (job list hover), `.cb` (chat background), `.fi` (document file box), and readonly inputs. In the theme switcher array (line 768), `--soft` is defined as `#F4F5F7` (or `#F7F7F4` for Orange).
* **Mitigation:** In our theme token definition, `--soft` is explicitly set to `#F4F5F7` by default (or `#F7F7F4` in orange preset). It must never reference itself.

### Risk 2: Global CSS Conflicts in `index.css`
* **Issue:** `client/src/index.css` has `input:focus { outline: none !important; box-shadow: none !important; }`. The mockup relies on `:focus-visible { outline: 2px solid var(--acc); outline-offset: 3px; }` and `.f input:focus { box-shadow: 0 0 0 3px var(--accS); }`.
* **Mitigation:** Wrap all new UI components inside `.sj-theme`. Within `.sj-theme`, apply CSS rules with higher specificity (e.g. `.sj-theme input:focus`, `.sj-theme :focus-visible`) without touching existing global rules that employee/employer dashboard pages depend on.

### Risk 3: Body Class Mutators (`body.lock`, `body.dopen`, `body.so`)
* **Issue:** The mockup modifies `document.body.classList` (`dopen` for drawer, `so` for search overlay, `lock` for modal scroll freeze). In a React single-page application, unhandled body classes cause persistent background freezing or layout shifting.
* **Mitigation:** Create a custom React hook `useBodyLock([isOpen])` that attaches the class on mount and guarantees cleanup on unmount or route change.

### Risk 4: Font Loading & Flicker
* **Issue:** The project currently uses `Plus Jakarta Sans` via Google Fonts. The new theme uses `Manrope` (weight 400, 500, 600, 700, 800) and `Playfair Display` for serif accents.
* **Mitigation:** Preload `Manrope` in `index.html` or inject via link tag without removing `Plus Jakarta Sans`, keeping fallbacks intact.

---

## 4. Component Mapping Table

| Mockup Element (HTML / CSS Selector) | New React Component Path | Target Connected Prop / API / Handler | What MUST NOT Change |
| :--- | :--- | :--- | :--- |
| **Logged-In Header (`#mh`, `.nav`, `.sc`)** | `client/src/components/sj-home/SjLoggedInHeader.jsx` | Props: `onOpenSearchModal`, `userProfile`, `savedCount`, `unreadCount`, `onSignOut` | Route transitions (`/profile`, `/my-jobs`, `/employee/messages`), auth clearing logic. |
| **Guest Header (`#gh`, `.gnv`)** | `client/src/components/sj-home/SjGuestHeader.jsx` | Props: `onOpenEmployeeLogin`, `onOpenEmployerLogin`, `onOpenConsultantLogin` | Modal open handlers in `App.jsx`. |
| **Search Dialog (`#smw`, `.sp`, `.sen`)** | `client/src/components/sj-home/SjSearchModal.jsx` | Props: `isOpen`, `onClose`, `onSearch(query, exp, loc)`. Triggered by `/` key and `.sc` click. | Existing search state variables (`searchJobTitle`, `searchLocation`) in `App.jsx`. |
| **Search Heading & Filter Bar (`#h1`, `#bar`, `.fl`)** | `client/src/components/sj-home/SjJobFilterBar.jsx` | Props: `filters`, `activeFilters`, `onToggleFilter`, `totalCount`, `matchedCount`, `roleTitle` | Category and location filter logic in `EmployeeHomepage.jsx`. |
| **Job List & Row Item (`#list`, `.row`, `.lt`)** | `client/src/components/sj-home/SjJobList.jsx`<br>`client/src/components/sj-home/SjJobCard.jsx` | Props: `jobs`, `onSelectJob(id)`, `onSaveJob(id)`, `onApplyJob(id)`. Connected to `GET /api/employee/jobs`. | Application submission payload, job `_id` structure, saved job toggle handler. |
| **Job Details Drawer (`#dr`, `.dv`, `.db`)** | `client/src/components/sj-home/SjJobDetailsDrawer.jsx` | Props: `jobId`, `isOpen`, `onClose`, `onApply`, `onSave`. Supports `↑`/`↓` keyboard navigation. | `JobApplicationModal.jsx` submission logic, screening question answers flow. |
| **Guest Landing Hero (`.hero`, `.sbar`)** | `client/src/components/sj-home/SjGuestHero.jsx` | Props: `onSearch(query, loc)`, `cmsHeroConfig` | Search autocomplete & location matcher (`LocationAutocomplete`). |
| **Guest Latest Grid (`.gw`, `.gg`, `.gc2`)** | `client/src/components/sj-home/SjGuestGrid.jsx` | Props: `jobs`, `onJobClick` (opens employee login) | Login modal prompt on guest card interaction. |
| **Guest Footer (`.gfo`, `.gfg`, `.soc`)** | `client/src/components/sj-home/SjFooter.jsx` | Props: Dynamic data from `Footer.jsx` or direct CMS config | Footer API data binding (`/api/footer`), SEO canonical links. |
| **Toast System (`#toast`)** | `client/src/components/sj-home/SjToast.jsx` | Props: `message`, `type` (`info`, `err`, `ok`), `isVisible`, `onDismiss` | Auto-dismiss timer (2600ms), standard status notification behavior. |
| **Support Floating Button & Panel (`#sfab`, `#sup`)** | `client/src/components/sj-home/SjSupportWidget.jsx` | Wraps existing logic of `client/src/components/common/SupportWidget.jsx` | Socket events, backend ticket submission API (`/api/support`), country code dropdown. |

---

## 5. Implementation Phases (H1 to H7)

---

### Phase H1: Foundation & Design Tokens
* **Goal:** Set up CSS design tokens, typography, `.sj-theme` wrapper, and the global `USE_NEW_HOME_UI` feature switch without changing any current UI visuals.
* **Files to Create:**
  * `client/src/config/themeConfig.js`
  * `client/src/styles/sjThemeTokens.css`
* **Files to Edit:**
  * `client/tailwind.config.js`
  * `client/src/index.css`
  * `client/index.html`
* **Tasks:**
  1. Create `client/src/config/themeConfig.js` exporting:
     ```js
     export const USE_NEW_HOME_UI = false; // default false for safety
     ```
  2. Create `client/src/styles/sjThemeTokens.css` with default tokens:
     ```css
     :root {
       --sj-f: "Manrope", system-ui, -apple-system, sans-serif;
       --sj-fh: "Manrope", system-ui, -apple-system, sans-serif;
       --sj-ink: #111111;
       --sj-mute: #6b7280;
       --sj-line: #e6e7ea;
       --sj-soft: #f4f5f7;
       --sj-acc: #ff4f2b; /* Original Orange default; or #c8ff3d for Neon */
       --sj-accS: #fff0ec;
       --sj-accD: #d63a17;
       --sj-accL: #ff8a6b;
       --sj-onacc: #ffffff;
       --sj-mk: #ffd3c7;
       --sj-bg: #ffffff;
       --sj-ok: #0a7a4b;
     }
     ```
  3. Add Manrope Google Font link in `client/index.html` (`<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">`).
  4. In `client/tailwind.config.js`, extend `colors` and `fontFamily` with `sj` prefixes mapping to `var(--sj-*)`.
  5. In `client/src/index.css`, import `./styles/sjThemeTokens.css` and define the scoping wrapper `.sj-theme { font-family: var(--sj-f); color: var(--sj-ink); }`.
* **HTML Reference:**
  * Lines 8–10 (`<link href="...Manrope..." rel="stylesheet">`, `:root { ... }`)
  * Lines 759–769 (theme presets)
* **DO NOT Touch:** Existing `palette-*` tailwind colors, existing `body` styles in `index.css`, any route in `App.jsx`.
* **Acceptance Checklist:**
  1. App compiles with zero errors (`npm run build` or Vite HMR).
  2. With `USE_NEW_HOME_UI = false`, the website looks and functions 100% identically to production.
  3. Inspecting `:root` in DevTools shows `--sj-acc`, `--sj-soft`, `--sj-ink` defined properly without circular references.
* **Commit Suggestion:** `feat(theme): add sj-theme foundation tokens, manrope font, and feature flag`

---

### Phase H2: UI Primitives (Buttons, Inputs, Pills, Badges)
* **Goal:** Build the isolated primitive components used across the new theme, matching the exact radius, padding, hover transforms, and focus outlines of the mockup.
* **Files to Create:**
  * `client/src/components/sj-home/primitives/SjButton.jsx`
  * `client/src/components/sj-home/primitives/SjInput.jsx`
  * `client/src/components/sj-home/primitives/SjPill.jsx`
  * `client/src/components/sj-home/primitives/SjAvatar.jsx`
  * `client/src/components/sj-home/primitives/primitives.css`
* **Files to Edit:** None.
* **Tasks:**
  1. Build `SjButton.jsx` supporting variants:
     * `primary` (`.go`, `.btn.p`, `.b2.p`): Background `var(--sj-ink)`, text white, pill radius `999px`, hover: background `var(--sj-acc)`, color `var(--sj-onacc)`.
     * `outline` (`.b2`, `.ol`): Border `1.5px solid var(--sj-ink)`, background white, hover shadow `3px 3px 0 var(--sj-ink)`, translate `-2px, -2px`.
     * `ghost` (`.ghost`, `.tl2`): Background transparent, hover background `var(--sj-soft)`.
     * `disabled`: Opacity 0.5, cursor not-allowed.
  2. Build `SjInput.jsx` supporting:
     * Minimal underline variant (`.sen input`): Border 0, border-bottom `2px solid var(--sj-line)`, focus border-color `var(--sj-acc)`.
     * Pill search variant (`.sf input`, `.srch`): Height 46px/44px, border `1.5px solid var(--sj-ink)` or `var(--sj-line)`.
  3. Build `SjPill.jsx` (`.pill`, `.pill.a`): Default white with line border; accent variant with background `var(--sj-accS)` and border transparent.
  4. Build `SjAvatar.jsx` (`.lt`, `.lg`, `.av`): Rounded-2xl (16px radius) or 50% circle, background `var(--sj-ink)`, font bold, letter-spacing lining-nums.
* **HTML Reference:**
  * Lines 46–47 (`.pill`, `.pill.a`)
  * Lines 60–64 (`.sen input`, `.sen select`)
  * Lines 66–68 (`.go`, `.ghost`)
  * Lines 84–86 (`.btn.p`, `.btn.d`)
  * Lines 116–118 (`.lt`, `.lt.big`)
  * Lines 148–150 (`.b2`, `.b2.p`, `.b2.dg`)
* **DO NOT Touch:** Existing form inputs in modals or admin panel.
* **Acceptance Checklist:**
  1. Create a quick visual test or Storybook/preview showing each button variant.
  2. Primary button hover matches exact transition (`0.15s ease`) and color shift to `--sj-acc`.
  3. Keyboard navigation focuses properly with outline `2px solid var(--sj-acc)`.
* **Commit Suggestion:** `feat(sj-home): implement reusable UI primitives with new theme styles`

---

### Phase H3: Headers (Guest & Logged-In)
* **Goal:** Create pixel-perfect headers for both guest and authenticated states with sticky blur backdrop, logo, interactive search trigger pill, and profile dropdown menu.
* **Files to Create:**
  * `client/src/components/sj-home/SjGuestHeader.jsx`
  * `client/src/components/sj-home/SjLoggedInHeader.jsx`
  * `client/src/components/sj-home/SjProfileDropdown.jsx`
  * `client/src/components/sj-home/headers.css`
* **Files to Edit:** None (wiring occurs in Phase H6).
* **Tasks:**
  1. Implement `SjGuestHeader.jsx` (`#gh`):
     * Logo with badge `Sahi<b>Job</b>.com` where `b` has background `var(--sj-acc)` and text `var(--sj-onacc)`.
     * 3 Pill Buttons: "Employee Login" (`.tl2`), "Employer Login" (`.ol`), "Consultant Login" (`.bk2`).
     * Call props `onEmployeeLogin`, `onEmployerLogin`, `onConsultantLogin`.
  2. Implement `SjLoggedInHeader.jsx` (`#mh`):
     * Logo on left.
     * Center Search Pill (`.sc`): Displays search text or "Search jobs here", with `<kbd>/</kbd>` shortcut pill. On click, fires `onOpenSearch`.
     * Right Icon Actions (`.ic`):
       * Bookmark button (`#svb`): Navigates to `/my-jobs?tab=saved`.
       * Messages button (`#msg`): Navigates to `/employee/messages`, shows unread red/accent dot `.pd`.
       * Profile Avatar button: Toggles `SjProfileDropdown`.
  3. Implement `SjProfileDropdown.jsx` (`.dm`):
     * Floating dropdown menu with border `1.5px solid var(--sj-ink)`, box shadow `6px 6px 0 var(--sj-ink)`.
     * Shows user email, "Profile" link, "Security & Password" link, and "Sign out" button.
     * Closes on outside click or Escape key.
* **HTML Reference:**
  * Lines 17–27 (`header`, `.nav`, `.logo`, `.sc`, `.ic`, `.ib`, `.pd`)
  * Lines 209–211 (`.dm`, `.dm .em`, `.dm button`, `.dm .so2`)
  * Lines 243–246 (`#gh`, `.gnv`, `.tl2`, `.ol`, `.bk2`)
  * Lines 443–457 (HTML structure for `#mh` and `#gh`)
* **DO NOT Touch:** `EmployeeNavbar.jsx` (preserved for rollback and non-theme views).
* **Acceptance Checklist:**
  1. Sticky header remains fixed on scroll with `backdrop-filter: blur(10px)`.
  2. Search pill hover triggers box shadow `4px 4px 0 var(--sj-ink)` and translate `-2px, -2px`.
  3. Pressing `/` key triggers `onOpenSearch`.
  4. Outside click cleanly closes `SjProfileDropdown`.
* **Commit Suggestion:** `feat(sj-home): add guest and logged-in headers with keyboard shortcut and dropdown`

---

### Phase H4: Search Modal, Filter Bar, and Job Feed
* **Goal:** Build the dynamic "Show me ___ jobs for ___ in ___" modal, reactive filter pill bar, and the high-performance job card list connected to the real public jobs API.
* **Files to Create:**
  * `client/src/components/sj-home/SjSearchModal.jsx`
  * `client/src/components/sj-home/SjJobFilterBar.jsx`
  * `client/src/components/sj-home/SjJobCard.jsx`
  * `client/src/components/sj-home/SjJobList.jsx`
  * `client/src/components/sj-home/jobFeed.css`
* **Files to Edit:** None.
* **Tasks:**
  1. Implement `SjSearchModal.jsx` (`#smw`, `.sp`, `.sen`):
     * Fixed backdrop overlay with `pop` scale/opacity animation (0.25s ease).
     * Sentence form: "Show me [Keyword input] jobs for [Experience select] in [Location input]."
     * "Show jobs →" submit button and "Clear" link button.
     * Closes on `Escape`, close `×` button, or backdrop click.
  2. Implement `SjJobFilterBar.jsx` (`.bar`, `.fl`):
     * Top border `1.5px solid var(--sj-ink)`.
     * Filter buttons: "Remote", "Matched for [Role]", "Not applied yet", "Salary shown".
     * Active state: `border-color: var(--sj-ink); font-weight: 700;`.
     * Right counter: `Showing X of Y jobs`.
  3. Implement `SjJobCard.jsx` (`.row`):
     * Grid columns: `60px 1fr auto 40px`.
     * Column 1: Company Logo box (`.lt`) with first letter or image.
     * Column 2: Job title (`.ct`), company name with verified badge (`.ver`), location, "Easily apply" pill, and "◎ Matched for [Role]" badge if matched.
     * Column 3: Formatted salary (`.pay`), openings count, and "✓ Already applied" status if applicable.
     * Column 4: Bookmark icon button (`.bk`) toggling saved state.
     * Hover state: Background `var(--sj-soft)`, padding-left transitions to `20px` (desktop).
     * Click on row opens job detail drawer.
  4. Implement `SjJobList.jsx`:
     * Groups jobs into "Matched for [Role]" and "More jobs" sections with headers (`.lbl.m`, `.lbl`).
     * Renders loading skeletons and empty state (`.empty`) when 0 results match.
* **HTML Reference:**
  * Lines 31–36 (`.bar`, `.fl`, `.cnt`, `.lbl`)
  * Lines 38–54 (`.row`, `.num`, `.ct`, `.sub`, `.pill`, `.rt`, `.pay`, `.st`, `.bk`, `.empty`)
  * Lines 55–69 (`.smw`, `.sp`, `.sen`, `#q`, `#loc`, `.sa`, `.go`, `.ghost`, `.x`)
  * Lines 517–535 (Row rendering, filter logic)
* **DO NOT Touch:** Matching algorithms in `EmployeeHomepage.jsx` (we import the pure matching functions from `utils/experienceMatcher` and `data/preferredLocations`).
* **Acceptance Checklist:**
  1. Pressing `/` opens the search modal; typing filters query, location, experience correctly.
  2. Clicking filters ("Remote", "Salary shown") reactively updates the list.
  3. Clicking bookmark updates saved status without triggering row click (proper `e.stopPropagation()`).
  4. Responsive view (<760px) shifts row to 3-column stacked layout per mockup lines 104–110.
* **Commit Suggestion:** `feat(sj-home): add search modal, filter bar, and job list feed`

---

### Phase H5: Job Details Drawer, Modals, Toast, and Support
* **Goal:** Implement the slide-out job details drawer (`#dr`), keyboard navigation (`↑`/`↓`), status toast, and support floating action button & panel.
* **Files to Create:**
  * `client/src/components/sj-home/SjJobDetailsDrawer.jsx`
  * `client/src/components/sj-home/SjToast.jsx`
  * `client/src/components/sj-home/SjSupportPanel.jsx`
  * `client/src/components/sj-home/drawerAndSupport.css`
* **Files to Edit:** None.
* **Tasks:**
  1. Implement `SjJobDetailsDrawer.jsx` (`.dr`, `.dv`):
     * Slide-in from right (`translateX(104%)` to `none`, `0.32s cubic-bezier(0.2, 0.8, 0.2, 1)`).
     * Sticky top bar with pagination `↑` (Previous) and `↓` (Next) job buttons, plus Close `×`.
     * Body sections: Company branding, Title, Tag pills, "Apply now" / "✓ Already applied", Recruiter info ("Posted by" who card + views/applications stats), Skills list, Role description, Responsibilities ordered list (`ol.rl` with numbered counters), and Company details key-value grid (`.kv`).
     * Hook up "Apply now" button to existing `applyToJob` prop.
  2. Implement `SjToast.jsx` (`.toast`, `.toast.show`, `.toast.err`):
     * Centered bottom pill (`bottom: 24px`, `border-radius: 999px`, background `var(--sj-ink)`, text white).
     * Icon circle (`.ti2`) with green check or red alert icon.
     * Auto-dismiss after 2600ms with fade-down exit.
  3. Implement `SjSupportPanel.jsx` (`#sfab`, `#sup`):
     * Floating Action Button (`#sfab`): Fixed right-bottom (`right: 24px, bottom: 24px`), 62px circle, background `var(--sj-ink)`, accent indicator dot.
     * Panel (`#sup`): Tabs for "New request" (2-step form) and "Updates & chat".
     * Hooked into existing backend support API `/api/support` or socket.
* **HTML Reference:**
  * Lines 70–103 (`.dv`, `.dr`, `.dt`, `.db`, `.who`, `.stt`, `.sk`, `.kv`, `ol.rl`, `.toast`)
  * Lines 281–287 (`#sfab`, `#sup`, `.sph`, `.stb`, `.spb`, `.sfo`)
  * Lines 538–556 (`openD`, `closeD`, `step`, `detail` functions)
  * Lines 741–755 (support widget logic)
* **DO NOT Touch:** Backend `/api/support` or `/api/employee/jobs/:id/apply` endpoints.
* **Acceptance Checklist:**
  1. Clicking any job card opens the drawer smoothly from the right.
  2. Pressing `ArrowUp` or `ArrowDown` switches to adjacent jobs; pressing `Escape` closes the drawer.
  3. "Apply now" triggers the application flow and shows the styled toast notification.
  4. Support FAB toggles the support panel without UI conflicts.
* **Commit Suggestion:** `feat(sj-home): implement job details drawer, toast, and support widget`

---

### Phase H6: Guest Landing, Footer, and Router Integration
* **Goal:** Build the guest hero section and opportunity grid, assemble the full `SjHomePage` component, and connect the `USE_NEW_HOME_UI` flag in `App.jsx`.
* **Files to Create:**
  * `client/src/components/sj-home/SjGuestHero.jsx`
  * `client/src/components/sj-home/SjGuestGrid.jsx`
  * `client/src/components/sj-home/SjHomeView.jsx` (Main orchestrator)
* **Files to Edit:**
  * `client/src/App.jsx`
* **Tasks:**
  1. Implement `SjGuestHero.jsx` (`.hero`, `.sbar`):
     * Radial gradient glow circles (`::before`, `::after`) using `color-mix(in srgb, var(--sj-acc) 38%, transparent)`.
     * Title: `Find Your <em>Dream</em> Job` with highlight underline gradient.
     * Pill Search Bar (`.sbar`): Job title input, divider, location input, and "Search Jobs →" button.
  2. Implement `SjGuestGrid.jsx` (`.gw`, `.gg`, `.gc2`):
     * "Latest Opportunities" heading with sparkle icon.
     * Card grid with hover translate `-3px`, shadow `0 14px 30px rgba(0,0,0,0.08)`.
     * Card displays company initial, title, location & full-time pills, and "Apply Now →" button.
     * Clicking any card triggers `onOpenLogin`.
  3. Assemble `SjHomeView.jsx`:
     * Evaluates `isLoggedIn` and `userRole`.
     * If guest: renders `SjGuestHeader`, `SjGuestHero`, `SjGuestGrid`, and `SjFooter`.
     * If logged-in employee: renders `SjLoggedInHeader`, `SjJobFilterBar`, `SjJobList`, `SjSearchModal`, `SjJobDetailsDrawer`, and `SjToast`.
     * Connects all existing auth modals (`EmployeeLoginModal`, `EmployerLoginModal`, etc.).
  4. In `client/src/App.jsx`:
     * Import `USE_NEW_HOME_UI` from `./config/themeConfig`.
     * In the `/` route render block:
       ```jsx
       {USE_NEW_HOME_UI ? (
         <SjHomeView
           isLoggedIn={isLoggedIn}
           userRole={userRole}
           jobs={homepageJobs.length > 0 ? homepageJobs : jobs}
           applyToJob={applyToJob}
           onOpenEmployeeLogin={() => setIsEmployeeLoginOpen(true)}
           onOpenEmployerLogin={() => { setIsConsultantMode(false); setIsEmployerLoginOpen(true); }}
           onOpenConsultantLogin={() => { setIsConsultantMode(true); setIsEmployerLoginOpen(true); }}
         />
       ) : (
         /* EXACT EXISTING LEGACY JSX UNTOUCHED */
       )}
       ```
* **HTML Reference:**
  * Lines 247–263 (`.hero`, `.sbar`, `.gw`, `.gg`, `.gc2`, `.sal`, `.ap`)
  * Lines 264–268 (`.gfo`, `.gfg`, `.soc`, `.gcp`)
  * Lines 700–705 (`rG()` guest rendering)
* **DO NOT Touch:** Routes `/employer/*`, `/profile`, `/my-jobs`, or legacy home JSX.
* **Acceptance Checklist:**
  1. Toggle `USE_NEW_HOME_UI = false` -> Original site displays with zero changes.
  2. Toggle `USE_NEW_HOME_UI = true` -> Brand new modern home experience renders.
  3. Clicking login buttons opens existing functional login modals without any regression.
  4. Logging in immediately transitions the view into the logged-in job feed with search pill and drawer.
* **Commit Suggestion:** `feat(sj-home): integrate full new home experience behind USE_NEW_HOME_UI flag`

---

### Phase H7: Master Colors & Live Admin CMS
* **Goal:** Give administrators the ability to dynamically configure theme master colors from the Admin Panel, preview changes live, save to MongoDB, and inject them into the frontend via CSS variables with zero hardcoded values remaining.
* **Files to Create:**
  * `admin/src/pages/homepage-cms/components/ThemeMasterColorsEditor.jsx`
  * `client/src/utils/themeInjector.js`
* **Files to Edit:**
  * `server/models/HomepageConfig.js`
  * `server/routes/homepageRoutes.js`
  * `admin/src/pages/homepage-cms/HomepageCMS.jsx`
  * `client/src/App.jsx`
* **Tasks:**
  1. **Backend Schema Update (`server/models/HomepageConfig.js`):**
     * Add `themeTokens` object to `homepageConfigSchema`:
       ```js
       themeTokens: {
         acc: { type: String, default: '#ff4f2b' },
         accS: { type: String, default: '#fff0ec' },
         accD: { type: String, default: '#d63a17' },
         accL: { type: String, default: '#ff8a6b' },
         onacc: { type: String, default: '#ffffff' },
         mk: { type: String, default: '#ffd3c7' },
         bg: { type: String, default: '#ffffff' },
         ink: { type: String, default: '#111111' },
         mute: { type: String, default: '#6b7280' },
         line: { type: String, default: '#e6e7ea' },
         soft: { type: String, default: '#f4f5f7' },
         ok: { type: String, default: '#0a7a4b' }
       }
       ```
     * Additive change only.
  2. **Backend Route Sync (`server/routes/homepageRoutes.js`):**
     * Ensure `GET /api/homepage` returns `themeTokens`.
     * `PUT /api/homepage` saves updated `themeTokens` seamlessly.
  3. **Admin Panel UI (`ThemeMasterColorsEditor.jsx`):**
     * Embed inside `admin/src/pages/homepage-cms/HomepageCMS.jsx`.
     * Color pickers with hex inputs for all 12 tokens.
     * Preset Theme Selector buttons matching the HTML demo:
       * "Original Orange" (`acc: #FF4F2B`, `ink: #111111`, etc.)
       * "Black + Neon" (`acc: #C8FF3D`, `ink: #111111`, etc.)
       * "Ink + Emerald" (`acc: #059669`, `ink: #0F172A`, etc.)
       * "Midnight + Indigo" (`acc: #4F46E5`, `ink: #111827`, etc.)
       * "Navy + Coral" (`acc: #E8503C`, `ink: #0B1F3A`, etc.)
     * Interactive Contrast Checker: Displays WCAG AA contrast ratio between `--acc` and `--onacc`, and `--ink` and `--bg`.
     * "Reset to Default" button.
     * Live mini-preview card showcasing button, badge, header pill, and search box.
  4. **Frontend Injection (`client/src/utils/themeInjector.js`):**
     * Create function `injectThemeTokens(tokens)`:
       ```js
       export const injectThemeTokens = (tokens) => {
         if (!tokens) return;
         const root = document.documentElement.style;
         Object.entries(tokens).forEach(([key, val]) => {
           if (val) root.setProperty(`--sj-${key}`, val);
         });
       };
       ```
     * In `client/src/App.jsx`, call `injectThemeTokens(homepageConfig?.themeTokens)` inside the existing `fetchHomepageConfig` `useEffect`.
* **HTML Reference:**
  * Lines 759–779 (Preset themes array `TH`, dynamic variable assignment `document.documentElement.style.setProperty`)
* **DO NOT Touch:** Admin authentication, other CMS sub-editors (`HeroSectionEditor`, `JobCardsEditor`, etc.).
* **Acceptance Checklist:**
  1. Admin opens Homepage CMS -> "Theme / Master Colors" section is visible.
  2. Selecting "Black + Neon" preset immediately updates the preview and contrast check.
  3. Clicking "Save Changes" updates MongoDB via `PUT /api/homepage`.
  4. Refreshing the main client site loads and applies the custom colors instantly from the API with fallback to CSS defaults if offline.
* **Commit Suggestion:** `feat(cms): add dynamic master theme colors editor and runtime css injection`

---

## 6. Open Questions for User Approval

Before execution begins, please confirm:

1. **Routing Strategy for Home:**
   * Currently, guests browse on `/` and logged-in candidates browse on `/employee`.
   * **Question:** Should `/` automatically display the logged-in job feed (`SjLoggedInHeader` + filter bar + job list) when `isLoggedIn === true`, OR should candidates always be redirected to `/employee`?
   * *Recommendation:* Keep `/employee` as the primary route, but also allow `/` to render the authenticated feed if `isLoggedIn` is true.

2. **Default Theme Color Palette:**
   * The HTML demo file is named `SahiJob_com___Orange__2_.html` with an orange preset (`#FF4F2B`) and a neon green theme (`#C8FF3D`).
   * **Question:** Which color should be the default out-of-the-box before admin customization: **Brand Orange (`#FF4F2B`)** or **Neon Green (`#C8FF3D`)**?
   * *Recommendation:* Default to **Brand Orange (`#FF4F2B`)** as it matches the standard SahiJob brand, with Black + Neon available as a 1-click admin preset.

3. **Search Bar on Mobile:**
   * In the mockup, mobile displays a compact header with the search bar accessible via modal.
   * **Question:** Should the hero search bar on guest landing remain inline on mobile, or collapse into a search pill?
   * *Recommendation:* Keep the hero search bar inline on guest landing for all screen sizes, and use the search pill for the job results page.

---

## 7. Ready-to-Paste Executor Prompt (For Gemini Flash)

```markdown
You are executing Phase [PHASE_NUMBER, e.g. H1] of the SahiJob Home Page UI Modernization Plan.

FIRST: Read `docs/HOME_UI_PLAN.md` carefully.
YOUR TASK: Implement ONLY Phase [PHASE_NUMBER]. Do not implement any other phase.

CRITICAL RULES:
1. DO NOT touch, modify, or delete any files outside the "Files to Create / Files to Edit" list for this phase.
2. Observe all items in the "DO NOT Touch" list for this phase.
3. Keep the old UI intact; respect the `USE_NEW_HOME_UI` flag.
4. Do not copy vanilla JS or mockup demo data; write clean, idiomatic React 18+ code.
5. All CSS must be scoped to `.sj-theme` or component-specific CSS. Do not override global element selectors in `index.css`.
6. Ensure pixel-perfect adherence to mockup sizes, paddings, shadows, and transitions specified in the HTML reference.

WHEN FINISHED:
1. List all files created and modified with exact paths.
2. Provide a concise summary of tasks completed.
3. Run through the "Acceptance Checklist" for this phase and report the verification status.
4. STOP and wait for review before moving to the next phase.
```

