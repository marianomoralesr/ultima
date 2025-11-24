# Cloudflare Google Tag Gateway Setup Guide

## What is Google Tag Gateway?

Cloudflare Google Tag Gateway is a powerful feature that serves Google tags (GTM, Google Analytics, Google Ads) from your own domain (`trefa.mx`) instead of from Google's domains. This provides:

- **11% uplift in data signals** (average from early testers)
- **Better privacy compliance** (first-party cookies)
- **Bypasses ad blockers** (requests appear to come from your domain)
- **Free at all Cloudflare plan levels**

## Prerequisites

✅ Your domain (`trefa.mx`) must be proxied through Cloudflare (Orange Cloud enabled)
✅ You have access to your Cloudflare dashboard
✅ GTM Container ID: `GTM-KDVDMB4X` (already configured in your site)

## Step 1: Enable Google Tag Gateway in Cloudflare

### Option A: Via Cloudflare Dashboard

1. **Go to your Cloudflare dashboard**
   - Navigate to https://dash.cloudflare.com/
   - Select your domain: `trefa.mx`

2. **Navigate to Google Tag Gateway**
   - Go to **Speed** → **Optimization** → **Content Optimization**
   - Or search for "Google Tag Gateway" in the dashboard

3. **Enable the feature**
   - Click "Enable Google Tag Gateway"
   - It's free on all Cloudflare plans!

4. **Verify the configuration**
   - Zone ID: `aacada2c4c8bca55be5a06fbcff2f5e8`
   - Check the API endpoint to see your configuration (requires auth):
     ```bash
     curl -H "X-Auth-Email: your-email@example.com" \
          -H "X-Auth-Key: your-api-key" \
          "https://api.cloudflare.com/client/v4/zones/aacada2c4c8bca55be5a06fbcff2f5e8/settings/google-tag-gateway/config"
     ```

### Option B: Via Google Tag Manager

1. **Go to Google Tag Manager**
   - Navigate to https://tagmanager.google.com/
   - Select container: `GTM-KDVDMB4X`

2. **Configure Google tag**
   - Go to **Tags** → **Configuration**
   - Find your Google tag (GA4/Ads configuration tag)
   - Look for "Server Container URL" setting

3. **Enable Cloudflare Tag Gateway**
   - Click "Set up first-party tracking with Cloudflare"
   - Follow the prompts to enable Tag Gateway

## Step 2: Verify Your Site is Ready

Your site (`trefa.mx`) is already configured to support Google Tag Gateway with:

1. ✅ **GTM Container ID**: `GTM-KDVDMB4X` (configured in `/src/services/MarketingConfigService.ts`)
2. ✅ **Content Security Policy**: Allows first-party requests
3. ✅ **Detection Logic**: Automatically detects when Tag Gateway is active
4. ✅ **Server Container URL support**: Added in MarketingConfigService

## Step 3: Configure Server-Side GTM (Optional but Recommended)

For enhanced tracking and server-side processing:

1. **Create a Server Container in GTM**
   - In GTM, go to **Admin** → **Container** → **Create Server Container**
   - Platform: Select "Cloudflare Workers" or "Google Cloud"

2. **Get your Server Container URL**
   - After creating, you'll get a URL like: `https://server-gtm.trefa.mx`
   - Or if using Cloudflare Workers: automatically configured

3. **Add to Marketing Config**
   - Go to your site's Marketing Config page: `https://trefa.mx/escritorio/admin/marketing`
   - Add the **Server Container URL** in the configuration form
   - This URL will be automatically sent to GTM via dataLayer

## Step 4: Test the Integration

1. **Deploy the latest code**
   ```bash
   git add .
   git commit -m "feat: Add Cloudflare Google Tag Gateway support"
   git push origin main
   ./docs/deployment/deploy.sh production
   ```

2. **Open browser console on your site**
   - Navigate to: https://trefa.mx
   - Open Developer Tools (F12) → Console
   - Look for:
     ```
     ✅ Cloudflare Google Tag Gateway detected - using first-party tracking
     GTM initialized with container: GTM-KDVDMB4X
     ```

3. **Verify requests are first-party**
   - In Network tab, filter by "gtm"
   - GTM requests should appear to come from `trefa.mx` instead of `googletagmanager.com`
   - Look for `x-cf-worker` or `cf-ray` headers (indicates Cloudflare proxy)

4. **Test with Google Tag Assistant**
   - Install: https://chrome.google.com/webstore/detail/tag-assistant-legacy-by-g/kejbdjndbnbjgmefkgdddjlbokphdefk
   - Navigate to your site
   - Verify GTM container loads successfully
   - All tags should fire normally

## Step 5: Monitor Performance

After enabling Google Tag Gateway, monitor your analytics for:

### Expected Improvements:
- **11% increase in conversion tracking** (average)
- **Reduced data loss** from ad blockers
- **Better cookie persistence** (first-party cookies)
- **Improved load times** (Cloudflare edge caching)

### How to Check:
1. **Google Analytics**
   - Go to: **Conversions** → **Events**
   - Compare event counts before/after Tag Gateway
   - Look for increase in tracked events

2. **Facebook Pixel**
   - Check **Events Manager** → **Test Events**
   - Verify events are being received
   - Look for increased event match quality

3. **Google Ads**
   - Go to **Tools** → **Conversions**
   - Check conversion count and value
   - Verify improved attribution

## Architecture Overview

```
User Browser (trefa.mx)
    ↓
    ├─→ GTM Request to trefa.mx/gtm.js
    │   ↓
    │   Cloudflare Edge (Tag Gateway)
    │   ↓
    │   Proxies to Google Tag Manager
    │   ↓
    │   Returns GTM script (appears first-party)
    │
    ├─→ Analytics Events to trefa.mx/collect
    │   ↓
    │   Cloudflare Edge (Tag Gateway)
    │   ↓
    │   Forwards to Google Analytics
    │   ↓
    │   ✅ First-party tracking, better data recovery
```

## Troubleshooting

### GTM not loading
- **Check**: Cloudflare proxy enabled (Orange Cloud icon)
- **Verify**: DNS records for `trefa.mx` are proxied
- **Test**: Clear browser cache and try again

### Console shows "Cloudflare Google Tag Gateway detected" but no uplift
- **Wait**: Changes may take 24-48 hours to show in analytics
- **Verify**: Tag Gateway is actually enabled in Cloudflare dashboard
- **Check**: No browser extensions blocking requests

### Server Container URL not working
- **Verify**: URL is correct (no trailing slash)
- **Check**: Server container is deployed and active
- **Test**: Visit server container URL directly (should return 200 OK)

### Data discrepancies
- **Normal**: Expect small fluctuations during transition
- **Monitor**: Compare week-over-week data, not day-over-day
- **Check**: No configuration changes in GTM during testing period

## Advanced Configuration

### Custom Server Domain

If you want a custom subdomain for server-side GTM:

1. **Add CNAME record in Cloudflare DNS**
   ```
   Type: CNAME
   Name: gtm
   Target: your-server-container-url.com
   Proxy: Enabled (Orange Cloud)
   ```

2. **Update Marketing Config**
   - Server Container URL: `https://gtm.trefa.mx`

3. **Configure in GTM**
   - Admin → Container Settings
   - Server Container URL: `https://gtm.trefa.mx`

## API Access (For Automation)

To fetch your Google Tag Gateway configuration programmatically:

```bash
# Set your Cloudflare credentials
export CF_EMAIL="your-email@example.com"
export CF_API_KEY="your-api-key"

# Fetch configuration
curl -H "X-Auth-Email: $CF_EMAIL" \
     -H "X-Auth-Key: $CF_API_KEY" \
     "https://api.cloudflare.com/client/v4/zones/aacada2c4c8bca55be5a06fbcff2f5e8/settings/google-tag-gateway/config"
```

Or using API Token:

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
     "https://api.cloudflare.com/client/v4/zones/aacada2c4c8bca55be5a06fbcff2f5e8/settings/google-tag-gateway/config"
```

## Resources

- **Cloudflare Docs**: https://developers.cloudflare.com/google-tag-gateway/
- **Google Setup Guide**: https://support.google.com/tagmanager/answer/16061641
- **Announcement Blog**: https://blog.cloudflare.com/google-tag-gateway-for-advertisers/
- **Analytics Mania Guide**: https://www.analyticsmania.com/post/google-tag-gateway/

## Next Steps

1. ✅ Enable Google Tag Gateway in Cloudflare dashboard
2. ✅ Test and verify first-party tracking is working
3. ✅ Monitor analytics for performance improvements
4. 📊 Set up server-side GTM for advanced tracking (optional)
5. 📈 Review and optimize based on improved data signals

---

**Support**: If you have issues, check the Cloudflare Community or contact Cloudflare support (free at all plan levels)
