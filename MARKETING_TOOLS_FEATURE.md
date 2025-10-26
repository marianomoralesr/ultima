# Marketing Tools Feature

## Overview

This feature introduces comprehensive marketing analytics and image management tools for the TREFA platform. It includes event tracking, campaign analytics, and a powerful R2 image manager for vehicle photos.

## Features

### 1. Marketing Events Tracking Service

**File**: `src/services/MarketingEventsService.ts`

Automatically tracks and stores marketing events including:
- **UTM Parameters**: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`
- **Ad Platform Tracking**: Facebook (`fbclid`), Google Ads (`gclid`), Microsoft Ads (`msclkid`)
- **Custom Parameters**: `rfdm` and any custom tracking parameters
- **Event Types**:
  - `page_view` - Page visits
  - `button_click` - Button interactions
  - `form_submit` - Form submissions
  - `lead_capture` - Lead captures
  - `custom` - Custom events

**Usage Example**:
```typescript
import marketingEvents from '../services/MarketingEventsService';

// Track a page view
await marketingEvents.trackPageView('Home Page');

// Track a button click
await marketingEvents.trackButtonClick('CTA - Solicitar Crédito', {
  vehicleId: 123,
  position: 'hero'
});

// Track form submission
await marketingEvents.trackFormSubmit('Contact Form', {
  formId: 'contact-us'
});

// Track lead capture
await marketingEvents.trackLeadCapture({
  source: 'landing-page',
  vehicleId: 456
});
```

### 2. Marketing Analytics Dashboard

**File**: `src/pages/MarketingAnalyticsDashboardPage.tsx`
**Route**: `/escritorio/admin/marketing-analytics`

Comprehensive analytics dashboard featuring:
- **Real-time Statistics**:
  - Total Events
  - Unique Sessions
  - Conversions
  - Click-through Rates

- **Filtering Options**:
  - Date range selection
  - Event type filtering
  - UTM source/medium/campaign filtering

- **Visualizations**:
  - Events by type (bar chart)
  - Events over time (timeline chart)
  - Top 10 traffic sources
  - Top 10 campaigns

- **Data Export**:
  - CSV export functionality
  - Real-time data refresh

### 3. R2 Image Manager

**File**: `src/pages/R2ImageManagerPage.tsx`
**Route**: `/escritorio/admin/r2-images`

Full-featured image management system for Cloudflare R2:

#### Upload Features:
- **Vehicle Selection**: Choose which vehicle to upload images for
- **Drag & Drop**: Intuitive drag-and-drop interface
- **Batch Upload**: Upload multiple images at once
- **Upload Queue**: Track upload progress for each file
- **File Validation**: Automatic validation for image types and sizes

#### Gallery Features:
- **Grid View**: Beautiful grid layout for browsing images
- **Search**: Search by filename or vehicle title
- **Filter**: Filter by specific vehicle
- **Image Actions**:
  - View full-size image (opens in new tab)
  - Delete image (removes from R2 and database)
- **Metadata Display**: Shows filename, vehicle, upload date

## Database Schema

### `marketing_events` Table

Stores all marketing events for analytics.

```sql
CREATE TABLE public.marketing_events (
  id UUID PRIMARY KEY,
  event_type TEXT CHECK (event_type IN ('page_view', 'button_click', 'form_submit', 'lead_capture', 'custom')),
  event_name TEXT NOT NULL,
  page_url TEXT NOT NULL,
  referrer TEXT,

  -- UTM Parameters
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,

  -- Ad Platform Tracking
  fbclid TEXT,
  gclid TEXT,
  msclkid TEXT,
  rfdm TEXT,

  -- User Context
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  ip_address INET,

  -- Geographic Data
  country TEXT,
  city TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes**:
- `idx_marketing_events_created_at` - For time-based queries
- `idx_marketing_events_event_type` - For filtering by event type
- `idx_marketing_events_session_id` - For session tracking
- `idx_marketing_events_user_id` - For user-specific analytics
- `idx_marketing_events_utm_source` - For source analysis
- `idx_marketing_events_utm_campaign` - For campaign analysis

**RLS Policies**:
- Anyone can insert events (public tracking)
- Only admins can read/delete events

### `r2_images` Table

Tracks vehicle images stored in Cloudflare R2.

```sql
CREATE TABLE public.r2_images (
  id UUID PRIMARY KEY,
  vehicle_id INTEGER NOT NULL,
  vehicle_title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Optional Metadata
  width INTEGER,
  height INTEGER,
  tags TEXT[],
  metadata JSONB DEFAULT '{}'
);
```

**Indexes**:
- `idx_r2_images_vehicle_id` - For vehicle-specific queries
- `idx_r2_images_uploaded_at` - For chronological sorting
- `idx_r2_images_uploaded_by` - For user uploads

**RLS Policies**:
- Authenticated users can insert images
- Admins can read all images
- Admin or uploader can delete images

## Setup Instructions

### 1. Apply Database Migration

Run the migration file via Supabase SQL Editor:

```bash
# File: supabase/migrations/20251026000000_create_marketing_tools_tables.sql
```

Or manually execute the SQL in the Supabase dashboard.

### 2. Configure Environment Variables

Ensure these R2 variables are set (already configured):

```env
VITE_CLOUDFLARE_ACCOUNT_ID=your_account_id
VITE_CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key
VITE_CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_key
VITE_CLOUDFLARE_R2_PUBLIC_URL=https://your-bucket.r2.cloudflarestorage.com
```

### 3. Access the Features

- **Marketing Analytics**: Navigate to `/escritorio/admin/marketing-analytics`
- **R2 Image Manager**: Navigate to `/escritorio/admin/r2-images`

Both are accessible only to admin users.

## Integration Examples

### Track Events Automatically

Add to route components to track page views:

```typescript
import { useEffect } from 'react';
import marketingEvents from '../services/MarketingEventsService';

function MyPage() {
  useEffect(() => {
    marketingEvents.trackPageView('My Page Name');
  }, []);

  return <div>...</div>;
}
```

### Track Button Clicks

```typescript
<button
  onClick={() => {
    marketingEvents.trackButtonClick('Apply Now Button');
    // ... rest of logic
  }}
>
  Aplicar Ahora
</button>
```

### Attribution Tracking

The service automatically extracts UTM parameters from URLs and stores them for attribution:

```
https://trefa.mx?utm_source=facebook&utm_medium=cpc&utm_campaign=summer-sale
```

All subsequent events in that session will include the attribution data.

## Performance Considerations

### Event Tracking
- Events are fire-and-forget (no blocking)
- Failed tracking doesn't affect user experience
- Batching can be implemented for high-volume scenarios

### R2 Storage
- Zero egress fees (unlike S3)
- Fast global CDN distribution
- Automatic cache headers set (1 year)

### Database Indexes
- All critical query paths are indexed
- RLS policies are optimized for performance

## Future Enhancements

### Planned Features
1. **Funnel Analysis**: Track user journey through conversion funnel
2. **A/B Testing**: Built-in A/B test tracking and analysis
3. **Heat Maps**: Click and scroll heat map generation
4. **Attribution Models**: First-touch, last-touch, and multi-touch attribution
5. **Real-time Dashboards**: WebSocket-based real-time analytics
6. **Bulk Image Operations**: Batch delete, move, and tag images
7. **Image Optimization**: Automatic resizing and format conversion
8. **CDN Analytics**: Image view counts and bandwidth usage

### Integration Opportunities
- **Google Analytics**: Export events to GA4
- **Facebook Pixel**: Sync with Facebook Conversion API
- **Email Marketing**: Integrate with Brevo for campaign tracking
- **CRM**: Connect events to lead scoring in CRM

## API Reference

### MarketingEventsService

#### Methods

**`trackEvent(eventType, eventName, metadata)`**
- Tracks a custom event
- Parameters:
  - `eventType`: 'page_view' | 'button_click' | 'form_submit' | 'lead_capture' | 'custom'
  - `eventName`: string
  - `metadata`: Record<string, any>

**`trackPageView(pageName?)`**
- Tracks a page view
- Auto-captures URL and referrer

**`trackButtonClick(buttonName, metadata?)`**
- Tracks a button click event

**`trackFormSubmit(formName, metadata?)`**
- Tracks a form submission

**`trackLeadCapture(metadata?)`**
- Tracks a lead capture event

**`getEvents(filters?, limit?)`**
- Retrieves events with optional filtering
- Returns: `Promise<MarketingEvent[]>`

**`getEventStats(filters?)`**
- Calculates event statistics
- Returns: `Promise<EventStats>`

**`storeAttribution()`**
- Stores current URL parameters for attribution

**`getStoredAttribution()`**
- Retrieves stored attribution data

### R2StorageService

#### Methods

**`uploadFile(file, path, contentType?)`**
- Uploads a file to R2
- Returns: `Promise<string>` (public URL)

**`deleteFile(path)`**
- Deletes a file from R2
- Returns: `Promise<void>`

**`generatePath(folder, filename)`**
- Generates a unique file path
- Returns: `string`

**`isAvailable()`**
- Checks if R2 is configured
- Returns: `boolean`

## Troubleshooting

### Migration Issues
If the migration fails:
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the migration SQL
4. Execute manually

### R2 Upload Failures
Check:
1. R2 credentials are correct in env variables
2. R2 bucket exists and is accessible
3. CORS is properly configured on the bucket
4. File size is within limits

### Analytics Not Showing Data
1. Verify migration was applied successfully
2. Check browser console for tracking errors
3. Ensure RLS policies allow your user role
4. Confirm events are being inserted (check Supabase dashboard)

## License

This feature is part of the TREFA platform.

## Contributors

- Developed using Claude Code
- Based on AdminAirtableConfigPage foundation
- Integrates with existing TREFA infrastructure

---

**Last Updated**: October 26, 2025
**Version**: 1.0.0
**Status**: Ready for Testing
