# Comprehensive Codebase Analysis: User Authentication, Leads, and Admin Systems

## Executive Summary

This is a Next.js/React application (Trefa) managing an automotive marketplace with a sophisticated CRM system. It uses Supabase for authentication and database, with a role-based access control system supporting three user types: **user**, **admin**, and **sales**.

---

## 1. AUTHENTICATION & USER SYSTEM

### 1.1 Authentication System Overview

**Location**: `/src/context/AuthContext.tsx`

**How it Works**:
- Uses Supabase Auth (JWT-based authentication)
- Creates user profiles on signup via `handle_new_user` trigger
- User profiles stored in `profiles` table with role-based access control
- Session cached in `sessionStorage` for performance

**Key Components**:
```
- AuthProvider: Central auth context provider
- useAuth(): Hook for accessing auth state
- Session Management: Automatic token refresh via Supabase
- Profile Caching: sessionStorage + Supabase
```

### 1.2 Role Assignment on Signup

**Location**: `/supabase/migrations/20251023200000_fix_application_insert_and_advisor_assignment.sql`

**Logic**:
1. User signs up via Supabase
2. `handle_new_user` trigger fires automatically
3. Hardcoded admin email list determines role:
   - Admin emails get `role = 'admin'`
   - All others get `role = 'user'`
4. If user is regular user: **Round-robin sales advisor assignment** is triggered

**Admin Email List**:
```
'marianomorales@outlook.com'
'mariano.morales@autostrefa.mx'
'genauservices@gmail.com'
'alejandro.trevino@autostrefa.mx'
'evelia.castillo@autostrefa.mx'
'fernando.trevino@autostrefa.mx'
```

### 1.3 Profile Table Schema

**Location**: `/supabase/migrations/20251020121153_remote_schema.sql`

**Key Fields**:
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  email text,
  first_name text,
  last_name text,
  mother_last_name text,
  phone text,
  birth_date date,
  rfc text,
  
  -- ROLE SYSTEM
  role user_role ('user' | 'admin' | 'sales'), -- DEFAULT: 'user'
  
  -- CRM FIELDS
  contactado boolean (default: false),
  asesor_asignado_id uuid REFERENCES profiles(id),
  source text,
  tags text[],
  
  -- SOURCE TRACKING
  metadata jsonb,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  rfdm text,
  referrer text,
  landing_page text,
  
  -- TIMESTAMPS
  created_at timestamptz,
  updated_at timestamptz,
  last_sign_in_at timestamptz,
  first_visit_at timestamptz,
  last_assigned_at timestamptz (for round-robin)
);
```

**Role Enum**:
```sql
CREATE TYPE user_role AS ENUM ('user', 'admin', 'sales');
```

---

## 2. ROUND-ROBIN LEADS ASSIGNMENT

### 2.1 Assignment Function

**Location**: `/supabase/migrations/20251020121153_remote_schema.sql`

**Function**: `assign_advisor(user_id_to_assign uuid) -> uuid`

```plpgsql
CREATE OR REPLACE FUNCTION public.assign_advisor(user_id_to_assign uuid)
RETURNS uuid AS $$
DECLARE
    available_advisor_id uuid;
BEGIN
    -- Find sales advisor with oldest last_assigned_at timestamp
    SELECT id INTO available_advisor_id
    FROM public.profiles
    WHERE role = 'sales'
    ORDER BY last_assigned_at ASC NULLS FIRST
    LIMIT 1;

    -- Assign the advisor
    IF available_advisor_id IS NOT NULL THEN
        UPDATE public.profiles
        SET asesor_asignado_id = available_advisor_id
        WHERE id = user_id_to_assign;

        -- Update last_assigned_at timestamp (for round-robin)
        UPDATE public.profiles
        SET last_assigned_at = now()
        WHERE id = available_advisor_id;
    END IF;

    RETURN available_advisor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2.2 How Round-Robin Works

1. **Finds next advisor**: Queries all profiles with `role = 'sales'`
2. **Sorts by last assignment**: Orders by `last_assigned_at` ASC (oldest first)
3. **Handles new advisors**: NULLS FIRST means new advisors without assignments get priority
4. **Updates timestamp**: Sets `last_assigned_at = now()` for the assigned advisor
5. **Result**: Each new user is assigned to the least-recently-used sales rep

### 2.3 Trigger Activation

**Location**: `/supabase/migrations/20251023200000_fix_application_insert_and_advisor_assignment.sql`

```plpgsql
-- In handle_new_user trigger:
IF user_role = 'user' THEN
    PERFORM public.assign_advisor(NEW.id);
END IF;
```

**When**: Automatically when new user profile is created
**Who**: Only triggered for users with `role = 'user'`

---

## 3. ROLE SYSTEM

### 3.1 Three User Roles

| Role | Purpose | Can See | Special Access |
|------|---------|---------|-----------------|
| **user** | Regular customer | Own profile, own applications | Gets assigned a sales advisor |
| **admin** | Full system access | All users, CRM, config, inspections | Can manage everything |
| **sales** | Sales representative | Assigned leads only | Can only access leads assigned to them |

### 3.2 Role Detection

**Location**: `/src/context/AuthContext.tsx`

```typescript
const isAdmin = profile?.role === 'admin';
const isSales = profile?.role === 'sales';
```

**AuthContext provides**:
```typescript
interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    isAdmin: boolean;       // For admin-only pages
    isSales: boolean;       // For sales-only pages
    signOut: () => Promise<void>;
    reloadProfile: () => Promise<Profile | null>;
}
```

### 3.3 Role-Based Routing

**Location**: `/src/App.tsx`

**AdminRoute Component** (`/src/components/AdminRoute.tsx`):
```typescript
// Only allows isAdmin = true, otherwise redirects to /escritorio
if (!isAdmin && !isSales) {
    return <Navigate to="/escritorio" replace />;
}
```

**SalesRoute Component** (`/src/components/SalesRoute.tsx`):
```typescript
// Allows both sales and admin roles
if (!isSales && !isAdmin) {
    return <Navigate to="/escritorio" replace />;
}
```

**Protected Routes**:
```
/escritorio/admin/*  → AdminRoute (admin only)
/escritorio/ventas/* → SalesRoute (sales + admin)
```

---

## 4. SALES ROLE & LEADS ACCESS

### 4.1 Sales User Capabilities

Sales users are a special type of admin-lite role with restricted access:

| Capability | Allowed | Restricted To |
|-----------|---------|---------------|
| View leads | YES | Assigned leads only (asesor_asignado_id = their ID) |
| Edit lead tags | YES | Assigned leads only |
| Create reminders | YES | Assigned leads only |
| View client profiles | YES | Assigned leads only |
| Update status | YES | If authorized (autorizar_asesor_acceso = true) |

### 4.2 Sales Access RPC Functions

**Location**: `/supabase/migrations/sales_dashboard_functions.sql`

#### Function 1: `get_sales_assigned_leads(sales_user_id uuid)`

**What it returns**: All leads where `asesor_asignado_id = sales_user_id`

```plpgsql
CREATE OR REPLACE FUNCTION get_sales_assigned_leads(sales_user_id UUID)
RETURNS TABLE (...) AS $$
BEGIN
    RETURN QUERY
    SELECT p.*, asesor.first_name || ' ' || asesor.last_name as asesor_asignado
    FROM profiles p
    LEFT JOIN profiles asesor ON p.asesor_asignado_id = asesor.id
    WHERE p.asesor_asignado_id = sales_user_id
      AND p.role = 'user'  -- Only actual customers, not staff
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Function 2: `get_sales_dashboard_stats(sales_user_id uuid)`

**What it returns**: Aggregated stats for assigned leads:
- `total_leads`: Count of assigned leads
- `leads_with_active_app`: Count with active financing applications
- `leads_not_contacted`: Count where contactado = false
- `leads_needing_follow_up`: Combines not contacted + pending docs

#### Function 3: `get_sales_client_profile(client_id uuid, sales_user_id uuid)`

**What it returns**: Full profile data if sales user has access

```plpgsql
-- Only returns profile if:
-- 1. lead.asesor_asignado_id = sales_user_id
-- 2. lead.role = 'user'
```

#### Function 4: `verify_sales_access_to_lead(lead_id uuid, sales_user_id uuid)`

**What it returns**: Boolean - true if sales rep can access this lead

### 4.3 Authorization Check Field: autorizar_asesor_acceso

**Current Status**: Field exists in schema but checks are inconsistent
**Used in**: Some RLS policies but may not be enforced everywhere
**Meaning**: When true, sales rep can access this lead's documents and full profile

---

## 5. EXISTING ADMIN INTERFACES

### 5.1 Admin Pages (CRM & Management)

| Page | Path | Location | Purpose |
|------|------|----------|---------|
| **Admin Leads Dashboard** | `/escritorio/admin/leads` | `AdminLeadsDashboardPage.tsx` | List all leads with stats |
| **Admin Client Profile** | `/escritorio/admin/cliente/:id` | `AdminClientProfilePage.tsx` | View/edit single client |
| **Admin Compras** | `/escritorio/admin/compras` | `AdminComprasDashboardPage.tsx` | Buy/sell vehicles dashboard |
| **Admin Inspections** | `/escritorio/admin/inspections` | `AdminInspectionsListPage.tsx` | Vehicle inspections |
| **Admin Airtable Config** | `/escritorio/admin/airtable` | `AdminAirtableConfigPage.tsx` | Airtable sync config |
| **Admin Config** | `/escritorio/admin/config` | `AdminConfigPage.tsx` | App-wide configuration |
| **Marketing Hub** | `/escritorio/admin/marketing` | `MarketingHubPage.tsx` | Landing pages, campaigns |
| **Vacancies** | `/escritorio/admin/vacantes` | `AdminVacanciesPage.tsx` | Job listings |

### 5.2 Key Admin Functionality

**Location**: `/src/services/AdminService.ts`

```typescript
export const AdminService = {
    // Get all leads (for admin dashboard)
    getAllLeads(): Promise<any[]>
    
    // Get CRM statistics
    getDashboardStats(): Promise<any>
    
    // Get single client profile with all related data
    getClientProfile(userId: string): Promise<{
        profile: Profile
        applications: any[]
        tags: any[]
        reminders: any[]
        documents: any[]
    }>
    
    // Tag management
    getAvailableTags(): Promise<any[]>
    updateLeadTags(userId: string, tagIds: string[]): Promise<void>
    
    // Reminder management
    createReminder(reminder: {...}): Promise<void>
    updateReminder(reminderId: string, updates: {...}): Promise<void>
    deleteReminder(reminderId: string): Promise<void>
    
    // Document management
    updateDocumentStatus(documentId: string, status: string): Promise<void>
    
    // Configuration
    getAppConfig(): Promise<any[]>
    updateAppConfig(key: string, value: any): Promise<void>
}
```

### 5.3 Admin Dashboard Features (AdminLeadsDashboardPage)

**Displays**:
1. **Stats Cards**: Total leads, active apps, incomplete apps, follow-up needed
2. **Search**: Search by name or email
3. **Table**: All leads with columns:
   - Name (clickable to profile)
   - Email / Phone
   - Last vehicle of interest
   - Application status
   - Contact status (flag)
   - Assigned advisor

**Filter for Sales**: If user is sales role, automatically filters to show only their assigned leads

---

## 6. SALES ROLE INTERFACE

### 6.1 Sales Pages

| Page | Path | Location | Purpose |
|------|------|----------|---------|
| **Sales Leads Dashboard** | `/escritorio/ventas/leads` | `SalesLeadsDashboardPage.tsx` | List assigned leads |
| **Sales Client Profile** | `/escritorio/ventas/cliente/:id` | `SalesClientProfilePage.tsx` | View/edit assigned client |

### 6.2 Sales Service

**Location**: `/src/services/SalesService.ts`

```typescript
export const SalesService = {
    // Get only this sales rep's assigned leads
    getMyAssignedLeads(salesUserId: string): Promise<any[]>
    
    // Get stats for assigned leads only
    getMyLeadsStats(salesUserId: string): Promise<any>
    
    // Get client profile (with access check)
    getClientProfile(
        clientId: string,
        salesUserId: string
    ): Promise<{...}>
    
    // Tag, reminder, document management
    // (same as admin, but with access verification)
    updateLeadTags(userId: string, tagIds: string[], salesUserId: string)
    createReminder(reminder: {...}, salesUserId: string)
    updateReminder(reminderId: string, updates: {...})
    deleteReminder(reminderId: string)
}
```

### 6.3 Sales Dashboard Features (SalesLeadsDashboardPage)

**Displays**:
1. **Stats Cards**: My leads, with active apps, not contacted, follow-up needed
2. **Search**: By name, email, or phone
3. **Filters**:
   - Application status (all, draft, submitted, etc.)
   - Contact status (all, contacted, not contacted)
4. **Table**: Only assigned leads showing:
   - Name (clickable to profile)
   - Email / Phone
   - Application status
   - Contact status
   - Authorization indicator

---

## 7. LEAD MANAGEMENT & TAGGING

### 7.1 Lead Tags System

**Tables**:
```sql
-- Tag definitions
CREATE TABLE lead_tags (
    id uuid PRIMARY KEY,
    tag_name text NOT NULL,
    color text NOT NULL,
    created_at timestamptz
);

-- Tag associations
CREATE TABLE lead_tag_associations (
    lead_id uuid REFERENCES profiles(id),
    tag_id uuid REFERENCES lead_tags(id)
);
```

**Usage**:
- Admins can manage all lead tags
- Sales can manage tags on assigned leads only
- Tags visible on CRM dashboard and client profile

### 7.2 Lead Reminders

**Table**:
```sql
CREATE TABLE lead_reminders (
    id uuid PRIMARY KEY,
    lead_id uuid REFERENCES profiles(id),
    agent_id uuid REFERENCES profiles(id),
    reminder_text text,
    reminder_date timestamptz,
    is_completed boolean DEFAULT false,
    created_at timestamptz
);
```

**Usage**:
- Create reminders for follow-ups
- Mark as complete
- Visible in client profile

### 7.3 Lead Contact Tracking

**Fields in profiles table**:
- `contactado`: Boolean flag - has this lead been contacted?
- `source`: Where lead came from (utm_source, rfdm, etc.)
- `metadata`: Full source tracking data (UTM params, etc.)
- `created_at`: When lead was created
- `last_sign_in_at`: Last activity

---

## 8. FINANCING APPLICATIONS

### 8.1 Applications Table

**Location**: `/supabase/migrations/20251020121153_remote_schema.sql`

```sql
CREATE TABLE financing_applications (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES profiles(id),
    status text (draft|submitted|reviewing|approved|rejected|pending_docs),
    car_info jsonb,
    personal_info_snapshot jsonb,
    application_data jsonb,
    selected_banks text[],
    created_at timestamptz,
    updated_at timestamptz
);

CREATE TABLE uploaded_documents (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES profiles(id),
    application_id uuid REFERENCES financing_applications(id),
    document_type text,
    file_name text,
    file_path text,
    status text (reviewing|approved|rejected),
    created_at timestamptz
);
```

### 8.2 Application Access

**Who can see**:
- Owner (user_id) - can see own applications
- Admin - can see all applications
- Sales - can see applications of assigned leads only

---

## 9. DATABASE SCHEMA OVERVIEW

### 9.1 Core Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| **auth.users** | Supabase auth | id, email, created_at |
| **profiles** | User profiles & CRM | id, role, asesor_asignado_id, contactado |
| **financing_applications** | Loan applications | user_id, status, car_info |
| **uploaded_documents** | Document uploads | user_id, status, file_path |
| **lead_tags** | Tag definitions | tag_name, color |
| **lead_tag_associations** | Tag assignments | lead_id, tag_id |
| **lead_reminders** | Follow-up reminders | lead_id, reminder_text, reminder_date |

### 9.2 RLS (Row Level Security) Policies

**Key Security Model**:
1. **Admin**: Full access to all data
2. **Sales**: Access only to assigned leads + their documents
3. **User**: Access only to own data

**Files with RLS policies**:
- `/supabase/migrations/20251104000001_fix_sales_documents_access.sql`
- `/supabase/migrations/20251104000007_fix_sales_access_complete.sql`

---

## 10. FILE PATHS - QUICK REFERENCE

### Frontend Files

```
/src/
├── context/
│   └── AuthContext.tsx                    (Auth state management)
├── components/
│   ├── AdminRoute.tsx                     (Admin route guard)
│   ├── SalesRoute.tsx                     (Sales route guard)
│   └── ProtectedRoute.tsx                 (Login required)
├── services/
│   ├── AdminService.ts                    (Admin API calls)
│   ├── SalesService.ts                    (Sales API calls)
│   └── ApplicationService.ts              (Application management)
├── pages/
│   ├── AdminLeadsDashboardPage.tsx        (Admin leads list)
│   ├── AdminClientProfilePage.tsx         (Admin client detail)
│   ├── SalesLeadsDashboardPage.tsx        (Sales leads list)
│   ├── SalesClientProfilePage.tsx         (Sales client detail)
│   └── AdminConfigPage.tsx                (Settings)
├── types/
│   └── types.ts                           (Profile, Vehicle, etc.)
└── App.tsx                                (Routing configuration)
```

### Database Files

```
supabase/migrations/
├── 20251020121153_remote_schema.sql       (Main schema: profiles, tables)
├── 20251023200000_fix_application_insert_and_advisor_assignment.sql
│                                          (Round-robin assignment)
├── 20251024000000_fix_get_my_role_function.sql
│                                          (Role detection from profiles)
├── sales_dashboard_functions.sql          (Sales RPC functions)
├── 20251104000001_fix_sales_documents_access.sql
│                                          (Sales document access)
├── 20251104000007_fix_sales_access_complete.sql
│                                          (Complete sales access control)
└── [other migrations]                     (Various fixes and features)
```

---

## 11. KEY IMPLEMENTATION DETAILS

### 11.1 How a New User Flows Through the System

1. **User signs up** at `/acceder` page
2. **Supabase Auth** creates auth.users record
3. **handle_new_user trigger** fires:
   - Creates profiles record
   - Checks if email is in admin list
   - Sets role to 'admin' or 'user'
4. **If user (not admin)**:
   - Calls `assign_advisor(user_id)`
   - Finds least-recently-assigned sales rep
   - Sets `asesor_asignado_id`
5. **AuthContext** loads profile:
   - Checks role
   - Sets `isAdmin` or `isSales` flags
   - Routes user appropriately

### 11.2 How Sales Rep Views Their Leads

1. Sales rep logs in
2. **AuthContext** sees `role = 'sales'`
3. Routes to `/escritorio/ventas/leads`
4. **SalesLeadsDashboardPage** calls:
   ```typescript
   SalesService.getMyAssignedLeads(user.id)
   ```
5. **RPC function** `get_sales_assigned_leads` returns only:
   ```sql
   WHERE p.asesor_asignado_id = sales_user_id AND p.role = 'user'
   ```
6. Sales rep sees only their assigned leads

### 11.3 How Admin Manages All Leads

1. Admin logs in
2. **AuthContext** sees `role = 'admin'`
3. Routes to `/escritorio/admin/leads`
4. **AdminLeadsDashboardPage** calls:
   ```typescript
   AdminService.getAllLeads()
   ```
5. **RPC function** checks if user is admin/sales
6. Admin sees all leads in system
7. Can click any lead to view/edit full profile

---

## 12. IMPORTANT NOTES

### 12.1 Current Limitations

1. **User Management**: No UI for creating/promoting sales users
   - Must be done via direct database update
   - Admin email list is hardcoded (need to update code to add new admins)

2. **Sales Role Assignment**: Users cannot be manually reassigned
   - Only automatic round-robin on signup
   - Would require custom migration to change advisor

3. **Authorization Field** (`autorizar_asesor_acceso`):
   - Exists in schema
   - Inconsistently enforced across RLS policies
   - Some functions check it, others don't

### 12.2 Security Model

- **Primary security**: RLS policies on database
- **Secondary security**: Frontend route guards
- **Verification**: RPC functions with SECURITY DEFINER check roles

### 12.3 Missing Admin Features

Currently **NOT available**:
- User management interface (create/edit/delete users)
- Bulk user role assignment
- Bulk lead reassignment
- Sales rep performance metrics
- User activity logging/audit trail

---

## 13. MIGRATION TIMELINE & RECENT CHANGES

### Most Recent (Nov 4, 2025)
- Fixed sales access to leads and documents
- Added source tracking fields (utm_*, rfdm, referrer, etc.)
- Fixed column type issues (jsonb → text)

### Earlier (Oct 23-24)
- Implemented round-robin assignment
- Fixed role detection (from profiles table, not JWT)
- Created sales RPC functions
- Fixed RLS policies for sales access

### Base Schema (Oct 20)
- Initial schema with profiles, applications, documents
- Basic admin/user role system

---

## 14. TESTING THE SYSTEM

### Create Test Users

**Admin User**:
```sql
-- Add email to admin list, user signs up
-- Trigger assigns role = 'admin'
```

**Sales User** (Manual - no UI yet):
```sql
UPDATE profiles SET role = 'sales', last_assigned_at = NOW()
WHERE id = 'user-uuid';
```

**Regular User**:
```
Just sign up normally - gets role = 'user' and auto-assigned advisor
```

### Verify Round-Robin

```sql
-- Check who's getting assigned
SELECT 
  p.first_name,
  p.last_name,
  p.role,
  COUNT(leads.id) as assigned_leads,
  p.last_assigned_at
FROM profiles p
LEFT JOIN profiles leads ON leads.asesor_asignado_id = p.id
WHERE p.role = 'sales'
GROUP BY p.id
ORDER BY p.last_assigned_at ASC;
```

---

## 15. ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────┐
│                    REACT FRONTEND                       │
│  App.tsx → Routes → AdminRoute / SalesRoute / Protected │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴──────────┐
         │                      │
    AuthContext          Services Layer
    (role check)      (AdminService/SalesService)
         │                      │
         └───────────┬──────────┘
                     │
        ┌────────────▼──────────────┐
        │   SUPABASE (PostgreSQL)   │
        │                           │
        │  ┌──────────────────────┐ │
        │  │  auth.users          │ │
        │  │  (JWT tokens)        │ │
        │  └──────────────────────┘ │
        │                           │
        │  ┌──────────────────────┐ │
        │  │  profiles (RLS)      │ │
        │  │  - role: admin|sales │ │
        │  │  - asesor_asignado_id│ │
        │  │  - contactado        │ │
        │  └──────────────────────┘ │
        │                           │
        │  ┌──────────────────────┐ │
        │  │  RPC Functions:      │ │
        │  │  - assign_advisor()  │ │
        │  │  - get_my_role()     │ │
        │  │  - get_sales_*()     │ │
        │  │  - get_leads_*()     │ │
        │  └──────────────────────┘ │
        │                           │
        │  ┌──────────────────────┐ │
        │  │  Supporting Tables:  │ │
        │  │  - financing_apps    │ │
        │  │  - documents         │ │
        │  │  - lead_tags         │ │
        │  │  - lead_reminders    │ │
        │  └──────────────────────┘ │
        └───────────────────────────┘
```

