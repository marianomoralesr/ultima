# Dashboard Enhancements Implementation Plan

## Overview
This document outlines the plan to integrate existing dashboard components and add key events summaries to admin/sales dashboards.

## Components Found & Status

### ✅ Ready to Use
1. **CircularProgress** (`src/components/CircularProgress.tsx`)
   - Shows profile completion percentage with circular progress bar
   - Clean, production-ready component

2. **VerticalStepper** (`src/components/VerticalStepper.tsx`)
   - Step-by-step progress visualization
   - Shows: Profile Complete → Bank Profiling → Application → Documents

3. **DocumentUploadDashboardModule** (`src/components/DocumentUploadDashboardModule.tsx`)
   - Comprehensive document upload system
   - Already integrated into dashboard
   - Production-ready

### ✅ Created
4. **KeyEventsSummary** (`src/components/KeyEventsSummary.tsx`)
   - Real-time activity feed
   - Shows: new leads, applications, document uploads, status changes, follow-ups
   - With timestamps and links

## Implementation Tasks

### Task 1: Enhance User Dashboard (DashboardPage.tsx)

**Location**: `src/pages/DashboardPage.tsx`

**Changes**:
```typescript
// Add imports
import CircularProgress from '../components/CircularProgress';
import VerticalStepper from '../components/VerticalStepper';

// Calculate profile completeness
const calculateProfileCompleteness = (profile: Profile | null): number => {
  if (!profile) return 0;
  const requiredFields: (keyof Profile)[] = [
    'first_name', 'last_name', 'mother_last_name', 'phone', 'birth_date',
    'homoclave', 'fiscal_situation', 'civil_status', 'address', 'city',
    'state', 'zip_code', 'rfc'
  ];
  const completed = requiredFields.filter(field =>
    profile?.[field] && String(profile[field]).trim() !== ''
  ).length;
  return Math.round((completed / requiredFields.length) * 100);
};

// Inside component
const profileCompleteness = calculateProfileCompleteness(profile);
const hasApplications = applications.length > 0;
const hasDocuments = /* check if documents uploaded */;

// Add to sidebar (desktop) around line 462:
<aside className="hidden lg:block lg:col-span-1 space-y-8">
  {/* Profile Completeness Card */}
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <CircularProgress progress={profileCompleteness} />
    <div className="mt-4">
      <Link
        to="/escritorio/profile"
        className="text-sm font-semibold text-primary-600 hover:underline block text-center"
      >
        Completar Perfil
      </Link>
    </div>
  </div>

  {/* Vertical Stepper */}
  <VerticalStepper
    profileComplete={profileCompleteness === 100}
    bankProfileComplete={isBankProfileComplete}
    applicationComplete={hasApplications}
    documentsComplete={hasDocuments}
  />

  {/* Existing advisor card */}
  {profile?.asesor_asignado_id && <MiAsesor asesorId={profile.asesor_asignado_id} />}

  {/* ... rest of sidebar */}
</aside>
```

### Task 2: Add Key Events to Admin Dashboard

**Location**: `src/pages/AdminLeadsDashboardPage.tsx`

**Changes**:
```typescript
// Add import
import KeyEventsSummary, { KeyEvent } from '../components/KeyEventsSummary';

// Add query for recent events
const { data: recentEvents = [], isLoading: isLoadingEvents } = useQuery<KeyEvent[], Error>({
  queryKey: ['adminKeyEvents'],
  queryFn: AdminService.getRecentKeyEvents,
  refetchInterval: 30000, // Refresh every 30 seconds
});

// Add below stats cards (around line 54):
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Main content - 2/3 width */}
  <div className="lg:col-span-2 space-y-6">
    {/* Existing leads table */}
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      {/* ... existing table code ... */}
    </div>
  </div>

  {/* Sidebar - 1/3 width */}
  <div className="lg:col-span-1">
    <KeyEventsSummary events={recentEvents} loading={isLoadingEvents} maxEvents={15} />
  </div>
</div>
```

### Task 3: Add Key Events to Sales Dashboard

**Location**: `src/pages/SalesLeadsDashboardPage.tsx`

**Similar changes as Admin Dashboard**:
```typescript
// Add import
import KeyEventsSummary, { KeyEvent } from '../components/KeyEventsSummary';

// Add query for sales events (only assigned leads)
const { data: myEvents = [], isLoading: isLoadingEvents } = useQuery<KeyEvent[], Error>({
  queryKey: ['salesKeyEvents', user?.id],
  queryFn: () => {
    if (!user?.id) throw new Error("Usuario no autenticado");
    return SalesService.getMyRecentKeyEvents(user.id);
  },
  enabled: !!user?.id,
  refetchInterval: 30000,
});

// Add layout similar to admin dashboard
```

### Task 4: Create AdminService Methods

**Location**: `src/services/AdminService.ts`

**Add**:
```typescript
async getRecentKeyEvents(): Promise<KeyEvent[]> {
  const { data: applications, error: appsError } = await supabase
    .from('applications')
    .select(`
      id,
      status,
      created_at,
      updated_at,
      car_info,
      profiles:user_id (id, first_name, last_name)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (appsError) throw appsError;

  const events: KeyEvent[] = [];

  // Transform applications into events
  applications?.forEach(app => {
    const leadName = `${app.profiles?.first_name || ''} ${app.profiles?.last_name || ''}`.trim();

    // New application event
    if (app.status === 'submitted') {
      events.push({
        id: `app-${app.id}`,
        type: 'application_submitted',
        title: 'Nueva Solicitud',
        description: `${leadName || 'Cliente'} envió una solicitud`,
        timestamp: app.created_at,
        link: `/escritorio/admin/cliente/${app.profiles?.id}`,
        metadata: {
          leadName,
          leadId: app.profiles?.id,
          vehicleTitle: app.car_info?._vehicleTitle,
          status: app.status
        }
      });
    }

    // Status change events (if updated_at differs from created_at)
    if (new Date(app.updated_at) > new Date(app.created_at)) {
      events.push({
        id: `status-${app.id}`,
        type: 'status_change',
        title: 'Cambio de Estado',
        description: `${leadName}: ${app.status}`,
        timestamp: app.updated_at,
        link: `/escritorio/admin/cliente/${app.profiles?.id}`,
        metadata: {
          leadName,
          leadId: app.profiles?.id,
          status: app.status
        }
      });
    }
  });

  // Get new profiles (last 24h)
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: newProfiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, created_at')
    .gte('created_at', twentyFourHoursAgo)
    .order('created_at', { ascending: false });

  newProfiles?.forEach(profile => {
    events.push({
      id: `profile-${profile.id}`,
      type: 'new_lead',
      title: 'Nuevo Lead',
      description: `${profile.first_name} ${profile.last_name} se registró`,
      timestamp: profile.created_at,
      link: `/escritorio/admin/cliente/${profile.id}`,
      metadata: {
        leadName: `${profile.first_name} ${profile.last_name}`,
        leadId: profile.id
      }
    });
  });

  // Sort all events by timestamp
  return events.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}
```

### Task 5: Fix Airtable Config Page

**Location**: `src/pages/AdminAirtableConfigPage.tsx`

**Issues**:
1. Missing `config` import path
2. Form doesn't actually save to backend
3. Test connection is mocked

**Fix**:
```typescript
// Fix import
import { config } from '../config/config'; // Update path

// Replace onSubmit function
const onSubmit = async (data: any) => {
  try {
    // Save to Supabase config table
    const { error } = await supabase
      .from('config')
      .upsert([
        { key: 'airtable_valuation_api_key', value: data.valuationApiKey },
        { key: 'airtable_valuation_base_id', value: data.valuationBaseId },
        { key: 'airtable_valuation_table_id', value: data.valuationTableId },
        { key: 'airtable_lead_capture_api_key', value: data.leadCaptureApiKey },
        { key: 'airtable_lead_capture_base_id', value: data.leadCaptureBaseId },
        { key: 'airtable_lead_capture_table_id', value: data.leadCaptureTableId },
      ]);

    if (error) throw error;
    alert('Configuración guardada exitosamente');
  } catch (error: any) {
    console.error('Error saving config:', error);
    alert(`Error: ${error.message}`);
  }
};

// Fix test connection (actual API call)
const handleTestConnection = async () => {
  setTestStatus('testing');
  setTestMessage('');

  try {
    const apiKey = /* get from form or config */;
    const baseId = /* get from form or config */;

    const response = await fetch(
      `https://api.airtable.com/v0/${baseId}/meta/bases`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    if (response.ok) {
      setTestStatus('success');
      setTestMessage('¡Conexión exitosa con la API de Airtable!');
    } else {
      setTestStatus('error');
      setTestMessage('Falló la conexión. Verifica tu API Key y Base ID.');
    }
  } catch (error: any) {
    setTestStatus('error');
    setTestMessage(`Error: ${error.message}`);
  }
};
```

## Database Schema Additions

### Config Table (if doesn't exist)
```sql
CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin to manage config"
ON config FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);
```

## Testing Checklist

- [ ] CircularProgress shows correct percentage
- [ ] VerticalStepper reflects actual progress
- [ ] Key Events load on Admin Dashboard
- [ ] Key Events load on Sales Dashboard
- [ ] Events refresh every 30 seconds
- [ ] Event links navigate correctly
- [ ] Airtable config saves to database
- [ ] Airtable test connection works
- [ ] Mobile responsive for all new components
- [ ] Performance: no slowdowns with many events

## Deployment Steps

1. Commit all changes
2. Run build locally to check for TypeScript errors
3. Deploy to staging first
4. Test all features on staging
5. Deploy to production
6. Monitor for errors in production logs

## Future Enhancements

- **Real-time updates**: Use Supabase Realtime for live event updates
- **Event filtering**: Filter events by type, date range
- **Event notifications**: Push notifications for critical events
- **Event analytics**: Charts showing event trends over time
- **Customizable dashboard**: Let users choose which widgets to show
