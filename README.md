# Erdosteine RCPA — Medical Representative & Doctor Reporting Portal

**Erdosteine RCPA** is a full-stack Next.js application designed for pharmaceutical field representatives (MRs) and managers. It streamlines doctor prescription audit (RCPA) reporting, doctor master setup, and field performance tracking.

---

## 🚀 Key Features & Flow

### 1. Dual-Role Authentication & Access
- **MR Field Portal (`/`)**:
  - Clean, mobile-optimized sign-in screen.
  - Quick autofill button for sample MR credentials (`mr@erdosteine.com` / `mr123`).
  - Redirects directly to the Doctor Visit logging interface.
- **Admin Control Center (`/admin`)**:
  - Secure management login.
  - Quick autofill button for sample Admin credentials (`admin@erdosteine.com` / `admin123`).
  - Grants access to Doctor Master management, live visits monitoring, and export.

### 2. Doctor Master Setup (Admin)
- Located at `/admin/doctors`.
- **Search & Filter**: Search doctor directory by name, specialty, clinic/hospital, and city location.
- **Single Doctor Creation**: Quickly register new healthcare professionals with full contact and clinic details.
- **Bulk CSV / Excel Import**:
  - Drag-and-drop or select `.csv` or `.xlsx` files.
  - Automatically parses column headers (`Name`, `Specialty`, `ClinicHospital`, `CityLocation`, `Phone`).
  - Provides a one-click **"Download Sample Template"** button.

### 3. MR Doctor Visit & RCPA Reporting (MR)
- Located at `/mr/new-visit`.
- **Doctor Auto-Complete**: Real-time search across the entire master doctor database.
- **Up to 5 Brand/Unit Entries**:
  - Dynamic rows (add/remove) capped at 5 entries per visit.
  - Suggested dropdown for primary brands (*Erdosteine 300mg Capsules*, *Erdosteine Suspension*, *Competitors*) with support for custom brand inputs.
  - Reported unit quantities for RCPA tracking.
- **Feedback / Remarks**: Capture doctor responses, sample requests, and clinical notes.
- **Instant Save**: Immediate submission without waiting for end-of-day batch reporting.
- **Visit History (`/mr/history`)**: Allows the MR to review all past recorded visits and units.

### 4. Visits Monitoring & Export (Admin)
- Located at `/admin/dashboard`.
- **KPI Metrics Cards**: Total Doctor Visits, Doctors Reached, Total RCPA Units, and Primary Brand Focus Units.
- **Multi-Filter Engine**: Filter records by Field Person (MR), Date Range, Brand keyword, or Doctor/Hospital.
- **One-Click Export**:
  - **Export to Excel (`.xlsx`)**: Structured spreadsheet formatted with visit details, MR info, doctor credentials, brand promotion, units, and remarks.
  - **Export to CSV**: Plain flat CSV for direct import into analytics or CRM platforms.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Styling**: Tailwind CSS v4 + Lucide Icons
- **Database & ORM**: MongoDB with Mongoose
- **Authentication**: Role-based session tokens with `jose` (JWT) & HTTP-only cookies
- **Spreadsheet / File Engine**: `xlsx` (Excel & CSV parsing and generation)

---

## 🔑 Default Credentials (Auto-Seeded)

The database automatically initializes these demo accounts on first launch:

| Role | Identifier / Email | Password | Description |
|---|---|---|---|
| **Admin** | `admin@erdosteine.com` | `Erdosteine!2026--` | Full access to Doctor Master & RCPA Entries Dashboard |
| **MR / Field Rep** | `EMP-ID` (e.g. `149893`) | *None required* | Direct access to assigned doctor call list |

---

## ⚙️ Environment Variables

Create or update `.env.local` in the project root:

```env
MONGODB_URI=mongodb://localhost:27017/erdosteine_rcpa
JWT_SECRET=erdosteine_rcpa_super_secret_jwt_key_2026
NEXT_PUBLIC_APP_NAME="Erdosteine RCPA"
```

---

## 📦 Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Open the portal:
   - **MR Field Reps**: [http://localhost:3000](http://localhost:3000)
   - **Admin Management**: [http://localhost:3000/admin](http://localhost:3000/admin)
