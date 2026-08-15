# NagarSeva / CivicFix — Project Documentation

**NagarSeva** (powered by **CivicFix**) is a Next.js full-stack civic complaint reporting and resolution platform designed for citizens and municipal government officials.

It combines an Indian citizen-focused public complaint feed, interactive map tracking, and municipal official dashboard with a serverless backend engine and session authentication system.

---

## 📌 Project Overview & Live Links

- **Live Website URL**: [civic-fix-complete.vercel.app](https://civic-fix-complete.vercel.app)
- **Local Source Directory**: [civic-fix-complete](file:///C:/Users/Lenovo/Downloads/civic-fix-complete)
- **Downloadable ZIP Archive**: [civic-fix-complete.zip](file:///C:/Users/Lenovo/Downloads/civic-fix-complete.zip)

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 16.3 (App Router, Turbopack) |
| **Frontend UI** | React 19, Tailwind CSS v4, Lucide Icons, Sonner |
| **Backend Engine** | Next.js API Routes (Serverless Node.js Functions) |
| **Database & Persistence** | Local JSON Store (`data/db.json`) + Vercel Serverless `/tmp` Fallback + In-Memory Caching |
| **Authentication** | Cookie-Based Session Storage (`civic_user`, 30 days max-age) |
| **Deployment** | Vercel Cloud Platform |

---

## 🏗️ System Architecture & Data Flow

```mermaid
flowchart TD
    A[Citizen User] -->|Browses / File Report| B[NagarSeva Frontend UI]
    C[Municipal Official] -->|Updates Progress| B
    B -->|REST Requests| D[Next.js App Router API Routes]
    D -->|/api/auth/signup| E[Auth Engine]
    D -->|/api/reports| F[Reports & Issues Engine]
    E -->|Read / Write| G[lib/db.ts]
    F -->|Read / Write| G
    G -->|Production Serverless| H[/tmp/civic_db.json + In-Memory Cache]
    G -->|Local Dev| I[data/db.json]
```

---

## 🚀 Key Modules & Features

### 1. 🔐 Sign Up & Authentication System
- **Routes**: `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`
- **UI Modal**: `components/auth-modal.tsx`
- **Behavior**:
  - Allows citizens to register using Full Name and Phone Number without password hoops.
  - Automatically generates user initials and assigns a 50-point welcome bonus.
  - Sets HTTP cookie (`civic_user`) active for 30 days.

### 2. 📋 Public Complaint Feed (`/public-complaint-feed`)
- **UI Component**: `app/public-complaint-feed/page.tsx`
- **Features**:
  - **Category Filtering**: Roads 🛣️, Water 💧, Sanitation 🗑️, Electricity ⚡, Parks 🌳, Drainage 🌊, Street Light 💡, Other 📌.
  - **Status Filtering**: All, Submitted, Acknowledged, In Progress, Resolved.
  - **Sorting**: Most Upvoted, Newest First, Most Discussed.
  - **Live Search Bar**: Filters complaints instantaneously by title, description, or address.
  - **Upvote Counter**: Citizens can upvote complaints with real-time feedback.

### 3. 🏢 Official Municipal Dashboard (`/official-dashboard`)
- **UI Component**: `app/official-dashboard/page.tsx`
- **Features**:
  - Metrics banner displaying Total Complaints, Acknowledged, In Progress, and Resolved counts.
  - Departmental filters (Roads & Highways, Street Lighting, Sanitation, Water Utility, Parks).
  - Status update triggers: Municipal officers can transition complaints to `Work In Progress` or `Mark Resolved`.

### 4. 🗺️ Interactive Map View (`/explore`)
- **UI Component**: `app/explore/page.tsx`
- **Features**:
  - Visual pin map with color-coded status indicators (Red: Pending/Submitted, Amber: In Progress, Green: Resolved).
  - Detailed side drawer showing report photos, AI confidence score (94%), location, and timeline audit trail.

### 5. 📸 Issue Reporting Form (`/report`)
- **UI Component**: `app/report/page.tsx`
- **Features**:
  - Photo upload preview with automatic AI category detection.
  - Location auto-fill with ward assignment.
  - Instant posting to the database (+100 Civic points awarded to user).

---

## 🔌 API Reference Guide

### Authentication API

#### `POST /api/auth/signup`
Creates a new citizen account and sets session cookie.
- **Request Body**:
  ```json
  {
    "name": "Alex Morgan",
    "phone": "9876543210"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "user": {
      "id": "user-1723624800000",
      "name": "Alex Morgan",
      "phone": "9876543210",
      "initials": "AM",
      "tier": "Bronze",
      "points": 50,
      "reports": 0,
      "resolved": 0
    }
  }
  ```

#### `POST /api/auth/login`
Logs in existing user by phone number or creates new account if missing.

#### `GET /api/auth/me`
Returns current authenticated user from session cookie.

---

### Reports & Complaints API

#### `GET /api/reports`
Returns list of all civic complaints.

#### `POST /api/reports`
Submits a new civic complaint.
- **Request Body**:
  ```json
  {
    "category": "Sanitation",
    "description": "Overflowing garbage bin near station",
    "address": "Andheri Station East",
    "photo": "/issues/trash.png"
  }
  ```

#### `PATCH /api/reports/[id]`
Updates an existing complaint's status or department (used by Official Dashboard).
- **Request Body**:
  ```json
  {
    "status": "resolved"
  }
  ```

---

## 🗄️ Database Schema Specification (`lib/db.ts`)

```typescript
export interface UserRecord {
  id: string
  name: string
  phone: string
  initials: string
  tier: 'Bronze' | 'Silver' | 'Gold'
  points: number
  reports: number
  resolved: number
}

export interface Issue {
  id: string
  title: string
  category: Category
  description: string
  photo: string
  afterPhoto: string | null
  status: 'reported' | 'assigned' | 'in-progress' | 'resolved'
  severity: 'Low' | 'Medium' | 'High'
  upvotes: number
  confirmations: number
  reporter: string
  reporterId: string
  ward: string
  department: string
  address: string
  createdAt: string
  updatedAt: string
  timeline: TimelineEntry[]
  comments: Comment[]
}
```

---

## 💻 Local Setup & Deployment Instructions

### 1. Run Locally
```bash
# Install dependencies
npm install

# Launch development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Build for Production
```bash
npm run build
```

### 3. Deploy to Vercel
```bash
npx vercel --prod
```
