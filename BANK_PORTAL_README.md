# Bank Portal Documentation

## Overview

The Bank Portal is a comprehensive system that allows bank representatives to review, approve, and manage financing applications. It includes login, dashboard, lead management, and notification systems.

## Features

### For Bank Representatives
- **Secure OTP Login**: Passwordless authentication with bank selection
- **Dashboard**: View all assigned leads with statistics
- **Lead Details**: Complete client profiles with documents and banking information
- **Actions**: Approve, reject, or request additional documents
- **Feedback**: Provide comments visible only to sales agents

### For Sales Agents
- **Send to Bank**: Assign applications to bank representatives
- **Recommended Banks**: Based on client banking profile
- **Notifications**: Receive updates when banks take action

### For Admins
- **Approve Bank Reps**: Manage bank representative accounts
- **View Analytics**: Monitor bank portal usage and performance

## Architecture

### Database Tables

#### `bank_representative_profiles`
Stores bank representative user information.
- `id`: User ID (references auth.users)
- `email`: Email address
- `bank_affiliation`: Bank name (enum)
- `is_approved`: Admin approval status
- `is_active`: Account status

#### `lead_bank_assignments`
Maps leads to bank representatives.
- `lead_id`: Reference to profiles
- `application_id`: Reference to financing_applications
- `bank_rep_id`: Reference to bank_representative_profiles
- `status`: Assignment status (pending, reviewing, approved, rejected, etc.)

#### `bank_feedback`
Stores feedback from bank reps (visible to sales only).
- `assignment_id`: Reference to lead_bank_assignments
- `message`: Feedback text
- `feedback_type`: Type of feedback
- `visible_to_sales`: Visibility flag

#### `application_status_history`
Tracks all status changes for applications.
- `application_id`: Reference to financing_applications
- `old_status` / `new_status`: Status change
- `changed_by_type`: Who made the change (admin, sales, bank_rep, system)

### Routes

#### Public Routes
- `/bancos` - Bank login page

#### Protected Routes (Bank Representatives)
- `/escritorio/bancos/clientes` - Dashboard with assigned leads
- `/escritorio/bancos/cliente/:id` - Lead profile page

#### Admin Routes
- `/escritorio/admin/bancos` - Bank representative management

## Usage Guide

### 1. Apply Database Migration

First, apply the database migration to create all necessary tables and functions:

```bash
# Navigate to Supabase migrations directory
cd supabase/migrations

# Apply the migration (via Supabase CLI or dashboard)
supabase db push
```

### 2. Integrating SendToBankButton in Sales Pages

To add the "Send to Bank" functionality to the Sales Client Profile Page:

```tsx
import SendToBankButton from '../components/SendToBankButton';
import { getRecommendedBankFromProfile } from '../utils/bankNameMapping';

// In your component:
const recommendedBank = getRecommendedBankFromProfile(bankProfile);

<SendToBankButton
  leadId={clientId}
  applicationId={application?.id}
  recommendedBank={recommendedBank}
  bankProfile={bankProfile}
  onSent={() => {
    toast.success('Solicitud enviada al banco');
    // Reload client data if needed
  }}
/>
```

### 3. Bank Representative Registration Flow

1. **Bank rep visits** `/bancos`
2. **Selects their bank** from the list
3. **Enters email** and receives OTP
4. **Verifies OTP** and account is created
5. **Status**: Account is pending admin approval
6. **Admin approves** via `/escritorio/admin/bancos`
7. **Bank rep can now access** dashboard at `/escritorio/bancos/clientes`

### 4. Sending Applications to Banks (Sales Agent Flow)

1. **Sales agent** opens client profile
2. **Reviews banking profile** to see recommended bank
3. **Clicks** "Enviar solicitud a [banco]"
4. **Modal opens** with:
   - Client's banking profile score
   - Recommended bank highlighted
   - Option to select different bank
   - List of available bank representatives
5. **Selects bank rep** and confirms
6. **Notifications sent** to:
   - Bank representative (new assignment)
   - Sales agent (confirmation)

### 5. Bank Representative Workflow

1. **Login** at `/bancos`
2. **Dashboard** shows:
   - Statistics (total, pending, approved, rejected)
   - List of assigned leads
   - Search and filter options
3. **Click** on lead to view details
4. **Review**:
   - Client information
   - Vehicle details
   - Banking profile
   - Uploaded documents
5. **Take action**:
   - Aprobar (Approve)
   - Rechazar (Reject)
   - Faltan documentos (Request docs)
6. **Add feedback** (optional, visible to sales only)
7. **Notifications sent** to:
   - Sales agent (status update + feedback)
   - Client (decision)

## Notifications

The system automatically sends email notifications for:

### Bank Representatives
- New application assigned

### Sales Agents
- Application sent to bank confirmation
- Bank status update (with feedback)
- Bank decision (approved/rejected)

### Clients
- Application sent to bank
- Bank decision (approved/rejected/docs required)

### Admins
- New bank representative registration

## Supported Banks

- Scotiabank
- BBVA
- Banregio
- Banorte
- AFIRME
- Hey Banco
- BanBajío
- Santander
- HSBC

## API Functions

### RPC Functions

#### `get_bank_rep_assigned_leads(bank_rep_uuid)`
Returns all leads assigned to a bank representative with full details.

#### `get_bank_rep_dashboard_stats(bank_rep_uuid)`
Returns statistics for the bank rep's dashboard.

#### `bank_rep_update_application_status(assignment_id, bank_rep_id, new_status, feedback_message)`
Updates application status and adds feedback.

#### `get_bank_rep_lead_details(bank_rep_id, lead_id)`
Returns complete lead details for a specific lead.

#### `admin_approve_bank_rep(admin_id, bank_rep_id, approved)`
Approves or revokes approval for a bank representative.

## TypeScript Types

All types are defined in `src/types/bank.ts`:

```typescript
import type { BankName, BankRepresentativeProfile, BankRepAssignedLead } from '../types/bank';
```

## Services

### BankService
Located at `src/services/BankService.ts`

Key methods:
- `getBankRepProfile()` - Get current bank rep's profile
- `getDashboardStats()` - Get dashboard statistics
- `getAssignedLeads()` - Get assigned leads
- `getLeadDetails(leadId)` - Get lead details
- `updateApplicationStatus(assignmentId, newStatus, feedback)` - Update status
- `getAllBankReps()` - Admin: Get all bank reps
- `approveBankRep(bankRepId, approved)` - Admin: Approve bank rep
- `assignLeadToBank(leadId, applicationId, bankRepId, bankName)` - Admin: Assign lead

### BrevoEmailService
Extended with bank notification methods:
- `notifyBankRepNewAssignment()` - Notify bank rep of new assignment
- `notifySalesAboutBankUpdate()` - Notify sales of bank update
- `notifyClientBankDecision()` - Notify client of bank decision
- `notifyAdminsNewBankRep()` - Notify admins of new bank rep

## Security

### Row Level Security (RLS)
All tables have RLS enabled with policies:

- Bank reps can only view their assigned leads
- Sales agents can view leads assigned to them
- Admins can view everything
- Bank reps cannot modify other reps' assignments

### Authentication
- Bank representatives use OTP authentication
- Accounts must be approved by admin before access
- Session management via Supabase Auth

## Customization

### Adding New Banks

1. Add to `BankName` enum in `src/types/bank.ts`:
```typescript
export type BankName = 'new_bank' | ...;
```

2. Add to `BANKS` constant:
```typescript
export const BANKS: Record<BankName, BankInfo> = {
  new_bank: {
    id: 'new_bank',
    name: 'New Bank',
    logo: '/banks/new-bank.svg',
    color: '#000000'
  },
  ...
};
```

3. Add to `bank_name` enum in migration:
```sql
ALTER TYPE bank_name ADD VALUE 'new_bank';
```

4. Add to `bankNameMapping.ts` for Spanish name mapping.

### Customizing Notification Templates

Edit `BrevoEmailService.ts` and update the template data or create new Edge Functions for custom email templates.

## Troubleshooting

### Bank Rep Can't Login
- Check if account is approved: `/escritorio/admin/bancos`
- Verify email is correct in database
- Check if account is active

### Lead Not Visible to Bank Rep
- Verify assignment exists in `lead_bank_assignments`
- Check bank rep ID matches assignment
- Verify bank rep is approved and active

### Notifications Not Sending
- Check Brevo API key in environment variables
- Verify Edge Function `send-brevo-email` is deployed
- Check email logs in Supabase

## Next Steps

Potential enhancements:
1. Add bulk document download (ZIP)
2. Add real-time notifications (WebSockets)
3. Add analytics dashboard for banks
4. Add SLA tracking for bank responses
5. Add multi-bank assignment support
6. Add document annotation/markup tools

## Support

For issues or questions, contact the development team or check the main project documentation.
