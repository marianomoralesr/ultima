# Customer Journeys - Auto-Tracking Setup System

## Overview
Customer Journeys is an automated tracking configuration system that allows you to define complete user funnels and automatically set up tracking for PageViews, ConversionLandingPage, and custom events across GTM and Facebook Pixel.

## Database Setup

### 1. Run the Migration
Execute the migration in your Supabase dashboard or via CLI:

```bash
# Using Supabase CLI
supabase db push

# Or manually in SQL Editor
```

Copy and paste the contents of:
`/supabase/migrations/20251117000000_create_customer_journeys.sql`

### 2. Tables Created

#### `customer_journeys`
Main table storing journey configurations:
- `id` - UUID primary key
- `name` - Journey name (e.g., "Financiamientos")
- `route` - Main route (e.g., "/financiamientos")
- `landing_page` - Landing page URL
- `description` - Optional description
- `status` - 'active' | 'draft' | 'paused'
- `auto_tracking_enabled` - Auto-configure tracking
- `gtm_enabled` - Track with GTM
- `facebook_pixel_enabled` - Track with Facebook Pixel
- `created_by` - User who created it
- Timestamps

#### `journey_steps`
Individual funnel steps with detailed event configuration:
- `id` - UUID primary key
- `journey_id` - Foreign key to customer_journeys
- `step_order` - Step sequence number
- `step_name` - Display name
- `step_description` - Optional description
- `page_route` - Page where this step occurs
- `page_title` - Page title
- `event_type` - GTM event type (e.g., "PageView", "ConversionLandingPage")
- `event_name` - Event display name
- `event_description` - Event description
- `trigger_type` - 'pageview' | 'button_click' | 'form_submit' | 'custom'
- `trigger_selector` - CSS selector for clicks
- `trigger_conditions` - JSONB for advanced conditions
- `event_metadata` - JSONB for additional data
- Timestamps

## Features

### Automatic Tracking Configuration
When you create a customer journey with `auto_tracking_enabled: true`, the system will:

1. **Register Events** - Auto-configure events in `ConversionTrackingService`
2. **GTM Integration** - Push events to `dataLayer` with proper structure
3. **Facebook Pixel** - Fire pixel events with `content_name` and metadata
4. **Supabase Tracking** - Store events in `tracking_events` table

### Pre-configured Journey: Financiamientos

The migration includes a complete **Financiamientos** journey:

**Steps:**
1. **Visitas Landing Page** - PageView at /financiamientos
2. **Registro Completado** - ConversionLandingPage (form submit)
3. **Información Personal** - PersonalInformationComplete (/escritorio/profile)
4. **Aplicación Iniciada** - ComienzaSolicitud (/escritorio/aplicacion)
5. **Solicitud Enviada** - LeadComplete (form submit)

## Usage

### Admin Panel
Navigate to: **Administración** → **Customer Journeys**

### Creating a New Journey

1. **Click "Nuevo Customer Journey"**

2. **Step 1: Basic Information**
   - Journey name
   - Route (main page)
   - Landing page URL
   - Description

3. **Step 2: Configure Funnel Steps**
   For each step:
   - **Step Name** - Display name
   - **Page Route** - Where it occurs
   - **Event Type** - GTM event type
   - **Event Name** - Display name for tracking
   - **Trigger Type** - How it's triggered
   - **Description** - Optional context

4. **Step 3: Tracking Configuration**
   - Enable/disable auto-tracking
   - Toggle GTM tracking
   - Toggle Facebook Pixel tracking

5. **Review & Create**
   - Preview all configuration
   - Confirm to create

### Managing Journeys

- **Activate/Pause** - Toggle journey status
- **Edit** - Modify configuration
- **Delete** - Remove journey (with confirmation)
- **View Analytics** - See funnel performance

## Service Layer

### CustomerJourneyService

```typescript
import { CustomerJourneyService } from '@/services/CustomerJourneyService';

// Get all journeys
const journeys = await CustomerJourneyService.getAllJourneys();

// Get active journeys only
const active = await CustomerJourneyService.getActiveJourneys();

// Create new journey
const newJourney = await CustomerJourneyService.createJourney(
  {
    name: 'Compra de Auto',
    route: '/compra',
    landing_page: '/compra',
    status: 'draft',
    auto_tracking_enabled: true
  },
  [
    {
      step_order: 1,
      step_name: 'Landing Page Visit',
      page_route: '/compra',
      event_type: 'PageView',
      event_name: 'PageView',
      trigger_type: 'pageview'
    }
    // ... more steps
  ]
);

// Update journey
await CustomerJourneyService.updateJourney(journeyId, {
  status: 'active'
});

// Delete journey
await CustomerJourneyService.deleteJourney(journeyId);
```

## Event Tracking Integration

### Auto-Configuration
When a journey is marked as `active` with `auto_tracking_enabled: true`:

1. **ConversionTrackingService** automatically registers all event types
2. Events fire when triggers are met:
   - `pageview` - On page load
   - `form_submit` - On form submission
   - `button_click` - On button click (uses CSS selector)
   - `custom` - Custom implementation

### Manual Tracking
You can also track events manually:

```typescript
import { conversionTracking } from '@/services/ConversionTrackingService';

// Track a journey step event
conversionTracking.trackEvent('ComienzaSolicitud', 'Comienza Solicitud', {
  userId: user.id,
  journeyId: 'financiamientos',
  stepOrder: 4
});
```

## Analytics & Reporting

### Funnel Visualization
Each active journey appears in:
- `/escritorio/admin/marketing-analytics` - Funnel tab
- `/escritorio/admin/customer-journeys` - Journey cards

### Metrics Tracked
- **PageViews** per step
- **Unique Users** per step
- **Conversion Rate** between steps
- **Drop-off Rate** at each stage
- **Time to Conversion**

## Security

### Row Level Security (RLS)
- **Admins** have full access to create/edit/delete
- **All users** can view active journeys (for tracking)
- Journey steps inherit journey permissions

### Permissions
```sql
-- Admins can do everything
ALTER TABLE customer_journeys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins have full access" ...

-- Users can view active journeys
CREATE POLICY "Users can view active journeys" ...
```

## Best Practices

### 1. Journey Naming
- Use clear, descriptive names
- Match the business process
- Example: "Financiamientos", "Compra de Auto", "Venta de Auto"

### 2. Event Types
- Follow GTM naming conventions
- Use PascalCase: `PageView`, `ConversionLandingPage`
- Be consistent across journeys

### 3. Step Ordering
- Start with landing page (step 1)
- Follow logical user flow
- Each step should be a clear milestone

### 4. Trigger Configuration
- Use `pageview` for automatic page tracking
- Use `form_submit` for form completions
- Use `button_click` with CSS selectors for specific interactions

### 5. Testing
- Start with `status: 'draft'`
- Test tracking in browser console
- Activate only when verified

## Troubleshooting

### Events Not Tracking
1. Check journey status is 'active'
2. Verify `auto_tracking_enabled: true`
3. Check browser console for errors
4. Verify GTM/Facebook Pixel IDs in marketing config

### Steps Not Appearing
1. Verify `step_order` is unique within journey
2. Check RLS policies allow viewing
3. Confirm journey_id is correct

### Database Errors
1. Ensure migration ran successfully
2. Check RLS policies are enabled
3. Verify user has admin role

## Example: Creating a "Venta de Auto" Journey

```typescript
const ventaJourney = await CustomerJourneyService.createJourney(
  {
    name: 'Venta de Auto',
    route: '/vende-tu-auto',
    landing_page: '/vende-tu-auto',
    description: 'Journey for users selling their cars',
    status: 'draft',
    auto_tracking_enabled: true,
    gtm_enabled: true,
    facebook_pixel_enabled: true
  },
  [
    {
      step_order: 1,
      step_name: 'Landing Page Visit',
      page_route: '/vende-tu-auto',
      event_type: 'PageView',
      event_name: 'Venta Landing Page',
      trigger_type: 'pageview'
    },
    {
      step_order: 2,
      step_name: 'Form Started',
      page_route: '/vende-tu-auto',
      event_type: 'SellFormStarted',
      event_name: 'Sell Form Started',
      trigger_type: 'button_click',
      trigger_selector: '#start-sell-form'
    },
    {
      step_order: 3,
      step_name: 'Car Details Submitted',
      page_route: '/vende-tu-auto',
      event_type: 'CarDetailsComplete',
      event_name: 'Car Details Complete',
      trigger_type: 'form_submit'
    },
    {
      step_order: 4,
      step_name: 'Quote Generated',
      page_route: '/vende-tu-auto/cotizacion',
      event_type: 'QuoteGenerated',
      event_name: 'Quote Generated',
      trigger_type: 'pageview'
    },
    {
      step_order: 5,
      step_name: 'Sale Completed',
      page_route: '/vende-tu-auto/confirmacion',
      event_type: 'SaleComplete',
      event_name: 'Sale Complete',
      trigger_type: 'pageview'
    }
  ]
);

// Activate after testing
await CustomerJourneyService.activateJourney(ventaJourney.id);
```

## API Reference

See `src/services/CustomerJourneyService.ts` for complete API documentation.

## Support

For issues or questions:
1. Check this documentation
2. Review browser console logs
3. Check Supabase logs in dashboard
4. Contact development team
