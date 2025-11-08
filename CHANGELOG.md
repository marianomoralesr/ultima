# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2025-11-08

### Fixed
- **Critical**: Redirect bug causing all authenticated users to be redirected to `/escritorio/dashboard` on every page load
  - Fixed AuthHandler.tsx to only redirect when `loginRedirect` exists in localStorage
  - Separated OAuth tracking logic from redirect logic for better clarity
- Video player on Financiamientos landing page not visible
  - Refactored to use same iframe embed code as homepage
  - Replaced `youtube-nocookie.com` with standard `youtube.com/embed`
  - Removed custom play button overlay and state management
- Email notification logs API key error
  - Added session verification before querying `email_notification_logs`
  - Improved error handling for RLS policy issues
  - Added specific error code detection (42P01, apikey errors)
- Hero heading typography on Financiamientos page
  - Reduced letter-spacing from -0.025em to -0.05em for tighter spacing
  - Added WebkitTextStroke for enhanced boldness appearance
  - Added xl:whitespace-nowrap to prevent unwanted line breaks
  - Optimized to fit in 2 lines instead of 3 on desktop

### Added
- **Cloudflare Google Tag Gateway support** for improved tracking
  - Added `gtm_server_container_url` field to MarketingConfig interface
  - Added `use_cloudflare_tag_gateway` flag
  - Automatic Tag Gateway detection with console logging
  - Server container URL support via dataLayer
  - Expected 11% average uplift in data signals (per Cloudflare)
  - First-party tracking that bypasses ad blockers
  - Comprehensive setup guide: `CLOUDFLARE_TAG_GATEWAY_SETUP.md`
- Marketing Configuration enhancements
  - Event URLs with clickable links for each event type
  - Data Layer Variable (DLV) parameters for GTM integration
  - Example: `formType = {{DLV - Form Type}}`, `source = {{DLV - Lead Source}}`
- Financiamientos page visual enhancements
  - Animated gradient border around video player (matching card design)
  - Extended margins for larger video display
- Enhanced error logging and diagnostics
  - Detailed logging for Cloudflare Tag Gateway detection
  - Better RLS/apikey error messages in email service

### Changed
- Marketing Config event label from "Tipo:" to "Evento:" for clarity
- Financiamientos video/form layout
  - Video: 60% width allocation (3/5ths) for better prominence
  - Form: 40% width allocation (2/5ths), more compact
  - Grid changed from `lg:grid-cols-2` to `lg:grid-cols-[3fr_2fr]`
  - Reduced gaps from `gap-8 lg:gap-12` to `gap-6 lg:gap-8 xl:gap-10`
- Event parameters format in Marketing Config
  - Converted from generic Facebook Pixel parameters to Data Layer Variable (DLV) format
  - All events now use GTM-compatible DLV syntax: `{{DLV - Variable Name}}`
- Code cleanup
  - Removed unused `Play` icon import from FinanciamientosPage
  - Removed unused `videoPlaying` state and `handleVideoPlay` function
  - Cleaner iframe implementation for video player

### Technical
- Updated `initializeGTM()` method signature to support server container URLs
- Added `detectCloudflareTagGateway()` private method for automatic detection
- Enhanced CSP headers compatibility (already configured with `"https:"` allowlist)
- Session verification added to email logs queries for better security

### Documentation
- Created `CLOUDFLARE_TAG_GATEWAY_SETUP.md` with:
  - Step-by-step Cloudflare dashboard setup instructions
  - Google Tag Manager configuration guide
  - Testing and verification procedures
  - Troubleshooting guide
  - API access examples for automation
  - Performance monitoring recommendations

## [1.0.0] - 2024-10-21

### Added
- Initial release
- Base marketing tracking system with GTM and Facebook Pixel
- User authentication and profile management
- Vehicle inventory management
- Application submission workflow
- Admin dashboard
- Sales dashboard
- Analytics and reporting

---

**Note**: For detailed commit history, see `git log` or GitHub releases.
