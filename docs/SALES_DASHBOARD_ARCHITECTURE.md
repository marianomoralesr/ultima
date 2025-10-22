# Sales Dashboard - Architecture Documentation

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐      ┌──────────────────────┐       │
│  │ Sales Dashboard      │      │ Client Profile       │       │
│  │ /ventas/leads        │─────▶│ /ventas/cliente/:id  │       │
│  └──────────────────────┘      └──────────────────────┘       │
│           │                              │                      │
│           │                              │                      │
└───────────┼──────────────────────────────┼──────────────────────┘
            │                              │
            ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AUTHORIZATION LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ SalesRoute Component                                     │  │
│  │ - Checks user.role === 'sales' OR 'admin'               │  │
│  │ - Redirects unauthorized users to /escritorio           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ SalesService                                             │  │
│  │ ┌────────────────────────────────────────────────────┐   │  │
│  │ │ getMyAssignedLeads(salesUserId)                   │   │  │
│  │ │ getMyLeadsStats(salesUserId)                      │   │  │
│  │ │ getClientProfile(clientId, salesUserId)           │   │  │
│  │ │ updateLeadTags(leadId, tagIds, salesUserId)       │   │  │
│  │ │ createReminder(reminder, salesUserId)             │   │  │
│  │ └────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ RPC Functions (SECURITY DEFINER)                         │  │
│  │                                                           │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ get_sales_assigned_leads(sales_user_id)           │  │  │
│  │  │ → Returns: leads where asesor_asignado_id = $1    │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ get_sales_dashboard_stats(sales_user_id)          │  │  │
│  │  │ → Returns: aggregated statistics                  │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ get_sales_client_profile(client_id, sales_user_id)│  │  │
│  │  │ → Checks: asesor_asignado_id = $2                 │  │  │
│  │  │ → Checks: autorizar_asesor_acceso = true          │  │  │
│  │  │ → Returns: profile + apps + tags + reminders      │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │ verify_sales_access_to_lead(lead_id, sales_user_id│  │  │
│  │  │ → Returns: boolean                                │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA STORAGE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   profiles    │  │ applications │  │  lead_tags   │        │
│  ├───────────────┤  ├──────────────┤  ├──────────────┤        │
│  │ - id          │  │ - id         │  │ - id         │        │
│  │ - email       │  │ - user_id    │  │ - tag_name   │        │
│  │ - role        │  │ - status     │  │ - color      │        │
│  │ - asesor_id   │  │ - car_info   │  └──────────────┘        │
│  │ - auth_access │  └──────────────┘                           │
│  └───────────────┘                                             │
│                                                                 │
│  ┌──────────────────┐  ┌────────────────┐                     │
│  │  lead_reminders  │  │   documents    │                     │
│  ├──────────────────┤  ├────────────────┤                     │
│  │ - id             │  │ - id           │                     │
│  │ - lead_id        │  │ - user_id      │                     │
│  │ - agent_id       │  │ - file_name    │                     │
│  │ - reminder_text  │  │ - url          │                     │
│  │ - reminder_date  │  └────────────────┘                     │
│  │ - is_completed   │                                          │
│  └──────────────────┘                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Viewing Assigned Leads

```
User navigates to /escritorio/ventas/leads
    ↓
SalesRoute verifies role = 'sales' or 'admin'
    ↓
SalesLeadsDashboardPage mounts
    ↓
useQuery calls SalesService.getMyAssignedLeads(user.id)
    ↓
SalesService calls supabase.rpc('get_sales_assigned_leads', { sales_user_id })
    ↓
Database function filters:
    - WHERE asesor_asignado_id = sales_user_id
    - AND role = 'user'
    ↓
Returns array of leads with latest application info
    ↓
Component renders table with filters and search
```

### 2. Accessing Client Profile

```
User clicks "Ver Perfil" on authorized lead
    ↓
Navigate to /escritorio/ventas/cliente/:id
    ↓
SalesRoute verifies role = 'sales' or 'admin'
    ↓
SalesClientProfilePage mounts
    ↓
useEffect calls SalesService.getClientProfile(id, user.id)
    ↓
SalesService calls supabase.rpc('get_sales_client_profile', { client_id, sales_user_id })
    ↓
Database function checks:
    1. Does asesor_asignado_id = sales_user_id?
    2. Does autorizar_asesor_acceso = true?
    ↓
If YES: Returns { profile, applications, tags, reminders, documents }
If NO: Returns NULL
    ↓
Frontend handles:
    - Success: Render profile page
    - Null/Error: Show "Access Denied" message
```

### 3. Managing Tags

```
User clicks "Editar" on Tags section
    ↓
User selects/deselects tags
    ↓
User clicks "Guardar Cambios"
    ↓
Component calls SalesService.updateLeadTags(leadId, tagIds, user.id)
    ↓
Service calls supabase.rpc('verify_sales_access_to_lead', { lead_id, sales_user_id })
    ↓
If access verified:
    1. DELETE existing tag associations
    2. INSERT new tag associations
    ↓
Component refreshes tags display
```

## Security Model

### Multi-Layer Defense

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Route Guard (Frontend)                        │
├─────────────────────────────────────────────────────────┤
│ SalesRoute Component                                    │
│ - Prevents unauthorized navigation                      │
│ - Improves UX by early redirect                        │
│ - NOT a security boundary (client-side)                │
└─────────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Service Logic (Frontend)                      │
├─────────────────────────────────────────────────────────┤
│ SalesService                                            │
│ - Validates input parameters                           │
│ - Handles errors gracefully                            │
│ - Provides consistent API interface                    │
│ - NOT a security boundary (client-side)                │
└─────────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 3: RPC Functions (Backend) ★ SECURITY BOUNDARY   │
├─────────────────────────────────────────────────────────┤
│ Database Functions with SECURITY DEFINER                │
│ - Runs with elevated privileges                        │
│ - Enforces business rules server-side                  │
│ - Validates asesor_asignado_id                         │
│ - Checks autorizar_asesor_acceso                       │
│ - Returns filtered data only                           │
│ - THIS IS THE REAL SECURITY ENFORCEMENT                │
└─────────────────────────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│ Layer 4: Row Level Security (Optional Enhancement)     │
├─────────────────────────────────────────────────────────┤
│ Supabase RLS Policies                                  │
│ - Additional database-level protection                 │
│ - Can be added for extra security                      │
│ - Not strictly necessary with RPC functions            │
└─────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App
└── Routes
    └── /escritorio (ProtectedRoute)
        └── DashboardLayout
            └── SalesRoute ← Guards sales routes
                ├── /ventas/leads
                │   └── SalesLeadsDashboardPage
                │       ├── StatsCard × 4
                │       ├── Search Input
                │       ├── Filter Dropdowns
                │       └── Leads Table
                │           └── Link to Client Profile (if authorized)
                │
                └── /ventas/cliente/:id
                    └── SalesClientProfilePage
                        ├── Client Info Card
                        │   ├── Profile Data
                        │   └── Sync to Kommo Button
                        ├── LeadSourceInfo
                        ├── TagsManager
                        │   ├── Tag Display
                        │   └── Tag Editor
                        ├── RemindersManager
                        │   ├── Reminder List
                        │   ├── Add Reminder Form
                        │   └── Toggle/Delete Actions
                        ├── ApplicationManager
                        │   ├── Application List
                        │   ├── Status Dropdown
                        │   └── View Modal
                        └── DocumentViewer
                            └── Document Links
```

## State Management

### React Query Cache Keys

```javascript
// Sales leads list
['salesLeads', userId]

// Sales dashboard stats
['salesDashboardStats', userId]

// Individual client profile (not cached to ensure fresh data)
// Fetched on-demand when navigating to profile page
```

### Component State

```javascript
// SalesLeadsDashboardPage
{
  searchTerm: string,          // Search filter
  filterStatus: string,        // Application status filter
  filterContactado: string,    // Contact status filter
}

// SalesClientProfilePage
{
  clientData: {
    profile: Profile,
    applications: Application[],
    tags: Tag[],
    reminders: Reminder[],
    documents: Document[]
  },
  loading: boolean,
  error: string | null,
  isSyncing: boolean,
  syncMessage: string
}

// TagsManager
{
  assignedTags: Tag[],
  availableTags: Tag[],
  isEditing: boolean,
  selectedTagIds: string[],
  error: string | null
}

// RemindersManager
{
  reminders: Reminder[],
  isAdding: boolean,
  newReminderText: string,
  newReminderDate: string,
  error: string | null
}
```

## Performance Considerations

### Optimizations Implemented

1. **Lazy Loading**: Sales components only loaded when needed
2. **React Query Caching**: Prevents redundant API calls
3. **Memoization**: `useMemo` for filtered leads list
4. **Debounced Search**: (Can be added) for search input
5. **Pagination**: (Can be added) for large lead lists

### Database Optimizations Needed

```sql
-- Add indexes for common queries
CREATE INDEX idx_profiles_asesor_asignado
ON profiles(asesor_asignado_id)
WHERE role = 'user';

CREATE INDEX idx_profiles_autorizar_acceso
ON profiles(asesor_asignado_id, autorizar_asesor_acceso)
WHERE role = 'user';

CREATE INDEX idx_applications_user_created
ON applications(user_id, created_at DESC);

CREATE INDEX idx_lead_reminders_lead_date
ON lead_reminders(lead_id, reminder_date DESC);
```

## Error Handling Strategy

```
┌────────────────────────────────────────┐
│ Error Occurs                           │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│ Where did it happen?                   │
├────────────────────────────────────────┤
│ ┌────────────┐  ┌─────────────────┐   │
│ │ RPC Call   │  │ Component Logic │   │
│ └──────┬─────┘  └────────┬────────┘   │
└────────┼──────────────────┼────────────┘
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌──────────────────┐
│ Network Error   │  │ Validation Error │
│ - Retry logic   │  │ - Show inline    │
│ - Toast message │  │ - Keep user data │
└─────────────────┘  └──────────────────┘
         │                  │
         ▼                  ▼
┌────────────────────────────────────────┐
│ User-Friendly Error Message            │
├────────────────────────────────────────┤
│ - Clear explanation                    │
│ - Actionable next steps               │
│ - Link back to safe location          │
└────────────────────────────────────────┘
```

## Future Enhancements

### Phase 2
- [ ] Real-time updates with Supabase subscriptions
- [ ] Email notifications when lead authorizes access
- [ ] Bulk actions (tag multiple leads at once)
- [ ] Export leads to CSV/Excel

### Phase 3
- [ ] Advanced analytics dashboard
- [ ] Conversion funnel visualization
- [ ] Lead scoring system
- [ ] Automated follow-up suggestions

### Phase 4
- [ ] Mobile app for sales users
- [ ] WhatsApp/SMS integration
- [ ] Call logging
- [ ] Meeting scheduler integration
