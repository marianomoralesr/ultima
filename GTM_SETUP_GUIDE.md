# Google Tag Manager Setup Guide for ConversionLandingPage Event

## Overview
The Financiamientos landing page now fires a custom `ConversionLandingPage` event when users submit the registration form. This guide shows you how to set up tracking in Google Tag Manager.

## Event Details
**Event Name:** `ConversionLandingPage`

**Data Layer Variables Available:**
- `event`: "ConversionLandingPage"
- `formType`: "financing_request"
- `monthlyIncome`: User's selected monthly income
- `source`: Lead source attribution (e.g., "financiamientos-facebook", "financiamientos-google-cpc-spring-campaign")
- `email`: User's email address
- `phone`: User's phone number

## Setup Instructions

### Step 1: Create Custom Event Trigger

1. Go to **Google Tag Manager** → **Triggers** → **New**
2. Click on **Trigger Configuration**
3. Select **Custom Event**
4. Configure:
   - **Event name:** `ConversionLandingPage`
   - **This trigger fires on:** All Custom Events
5. **Save** the trigger as "ConversionLandingPage - Form Submission"

### Step 2: Create Data Layer Variables (Optional but Recommended)

Create variables to capture the event data:

1. Go to **Variables** → **User-Defined Variables** → **New**
2. Choose **Data Layer Variable**
3. Create the following variables:

| Variable Name | Data Layer Variable Name |
|--------------|-------------------------|
| DLV - Form Type | formType |
| DLV - Monthly Income | monthlyIncome |
| DLV - Lead Source | source |
| DLV - User Email | email |
| DLV - User Phone | phone |

### Step 3: Create Google Analytics 4 Event Tag

1. Go to **Tags** → **New**
2. Click on **Tag Configuration**
3. Select **Google Analytics: GA4 Event**
4. Configure:
   - **Configuration Tag:** Select your GA4 Configuration tag
   - **Event Name:** `conversion_landing_page`
   - **Event Parameters:** (Add these)
     - `form_type`: {{DLV - Form Type}}
     - `monthly_income`: {{DLV - Monthly Income}}
     - `lead_source`: {{DLV - Lead Source}}
     - `user_email`: {{DLV - User Email}}
     - `user_phone`: {{DLV - User Phone}}
5. **Triggering:** Select "ConversionLandingPage - Form Submission"
6. **Save** the tag

### Step 4: Create Google Ads Conversion Tag (If Applicable)

1. Go to **Tags** → **New**
2. Select **Google Ads Conversion Tracking**
3. Configure:
   - **Conversion ID:** Your Google Ads Conversion ID
   - **Conversion Label:** Your Conversion Label
   - **Conversion Value:** {{DLV - Monthly Income}} (optional)
4. **Triggering:** Select "ConversionLandingPage - Form Submission"
5. **Save** the tag

### Step 5: Test in Preview Mode

1. Click **Preview** in GTM
2. Navigate to your Financiamientos page
3. Fill out and submit the form
4. In GTM Preview:
   - Verify the `ConversionLandingPage` event fires
   - Check that all data layer variables populate correctly
   - Confirm your tags fire on this trigger

### Step 6: Publish

1. Click **Submit** in GTM
2. Add a **Version Name:** "Add ConversionLandingPage tracking"
3. Add a **Version Description:** "Track form submissions on Financiamientos landing page"
4. Click **Publish**

## Facebook Pixel Setup

**No additional setup required!**

The Facebook Pixel events are already configured and firing automatically:
- **InitiateCheckout:** Fires when form is submitted
- **Lead:** Fires when OTP is verified and account is created

Both events include the `source` parameter for attribution tracking.

## Lead Source Attribution

The system automatically determines the lead source from:

1. **UTM Parameters:** `utm_source`, `utm_medium`, `utm_campaign`
   - Example: `financiamientos-google-cpc-spring-campaign`

2. **Ad Platform Click IDs:**
   - `fbclid` → `financiamientos-facebook`
   - `gclid` → `financiamientos-google`

3. **Custom Source Parameter:** `?source=instagram`
   - Example: `financiamientos-instagram`

4. **Referrer Domain:** If no other parameters present
   - Example: `financiamientos-referrer-instagram.com`

5. **Default:** `financiamientos-landing-direct` (for direct traffic)

## Verification

After setup, you can verify tracking is working by:

1. Checking **Real-Time** reports in Google Analytics
2. Viewing the **ConversionLandingPage** event in GA4 DebugView
3. Confirming conversions appear in Google Ads (if applicable)
4. Checking Facebook Events Manager for pixel events

## Support

If you need help with GTM setup, consult the [Google Tag Manager documentation](https://support.google.com/tagmanager) or contact your analytics team.
