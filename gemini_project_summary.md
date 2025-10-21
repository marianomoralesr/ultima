# Gemini Project Summary: TREFA Web Application

This document provides a comprehensive overview of the TREFA web application, its architecture, and the recent fixes that have been implemented. It is intended to be a guide for future development and to ensure a smooth and efficient workflow.

## Project Overview

The TREFA web application is a comprehensive platform for buying and selling used cars. It includes a public-facing inventory, a user dashboard for managing applications and favorites, and an admin section for managing leads and content.

## Key Technologies

*   **Frontend:** React, Vite, TypeScript
*   **Backend:** Supabase (Authentication, Database, Edge Functions)
*   **Styling:** Tailwind CSS
*   **Data Fetching:** TanStack Query (React Query)

## Core User Flows

### 1. Authentication & Roles

*   **Login:** Users log in via a one-time password (OTP) sent to their email or through Google OAuth. The login page is at `/acceder`.
*   **Role Assignment:** Upon registration, a user's role is determined by their email address. A specific list of emails in `AuthContext.tsx` are assigned the `admin` role, while all other users default to the `user` role.
*   **Agent Assignment:** New users are automatically assigned a sales agent in a round-robin fashion via the `get_next_sales_agent` Supabase function.
*   **Route Protection:**
    *   `PublicRoute.tsx`: Protects routes that should only be accessible to unauthenticated users (e.g., `/acceder`).
    *   `ProtectedRoute.tsx`: Protects routes that require a user to be logged in (e.g., `/escritorio`).
    *   `AdminRoute.tsx`: Protects routes that are only accessible to users with the `admin` or `sales` role.
*   **Logout:** The `signOut` function from the `useAuth` hook should be used. **Crucially, do not call `navigate` immediately after `signOut`.** The `AuthProvider` will automatically handle the redirection when the session state changes.

### 2. Vehicle Data

*   **Centralized Fetching:** All vehicle data is fetched and managed through the `VehicleContext.tsx`. This context uses TanStack Query to fetch data from a Supabase Edge Function and provides it to the entire application.
*   **Data Source:** The primary data source is a Supabase Edge Function, which is more reliable than the previous WordPress API and proxy setup.
*   **Usage:** Any component that needs access to vehicle data should use the `useVehicles` hook. **Do not fetch vehicle data directly from any other service.**

### 3. "Vender mi Auto" (Sell My Car) Flow

This is a two-step process:

1.  **Public Valuation:** The public `/vender-mi-auto` route renders the `GetAQuotePage.tsx`, which contains the `Valuation/App.tsx` component. This allows any user (authenticated or not) to get a quote for their car.
2.  **Protected Submission:** The protected `/escritorio/vende-tu-auto` route renders the `SellMyCarPage.tsx`. This page has two states:
    *   If the user has just completed a valuation, it will show the seller's dashboard to upload photos and add more details.
    *   If the user navigates to this page directly, it will render the `Valuation/App.tsx` component, allowing them to start the process from within the dashboard.

### 4. Application Flow

*   **Profile First:** The user is required to complete their profile on the `/escritorio/profile` page before they can start a new application. The system will automatically redirect them if their profile is incomplete.
*   **Bank Profiling Next:** After completing their personal profile, they are guided to the `/escritorio/perfilacion-bancaria` page.
*   **New Application:** The `/escritorio/aplicacion` route allows a user to start a new application.
*   **Viewing & Editing Applications:**
    *   The "Mis Solicitudes" page is `/escritorio/seguimiento`, which renders the `SeguimientoPage.tsx` component to list all past and draft applications.
    *   Clicking on an application from the list takes the user to `/escritorio/aplicacion/:id`, which renders the `Application.tsx` component, allowing them to continue a draft or view a submitted application.
*   **Flexible Document Upload:** The financing application form allows users to submit their application *before* uploading all their documents. The `documents_pending` flag is set on the backend to track this.

### 5. CRM & Access Control

*   **Lead Source Tracking:** The application captures `utm_`, `rfdm`, and `ordencompra` parameters from the URL and stores them in a `metadata` field in the user's profile upon registration.
*   **Secure Data Access:** The CRM's client profile page uses a secure Supabase function (`get_secure_client_profile`) to fetch data. This function enforces access control on the backend:
    *   **Admins** can view any user's profile.
    *   **Sales agents** can only view the profiles of users who have explicitly granted them permission via the `asesor_autorizado_acceso` flag in their profile.

## Recent Actions & Fixes (October 2025)

### Phase 1: Stability and Core Functionality

*   **"Stack Depth Limit Exceeded" Error:** This critical bug was caused by an infinite redirect loop. The **definitive fix** was removing the incorrect dependency array from the `useEffect` hook in `AuthHandler.tsx`, which was the root cause of the application-wide instability.
*   **Blank Homepage & Data Fetching Failures:** The homepage was blank because the `WordPressService.ts` was configured to use an incorrect and unreliable proxy. This has been corrected to use the robust Supabase Edge Function, and all components have been refactored to use the central `VehicleContext`.
*   **Broken `/acceder` Route:** The login page was crashing due to a conflict between the `PublicRoute.tsx` and `AuthPage.tsx` components. The faulty logic in `AuthPage.tsx` has been removed.
*   **Logout Issues:** The logout buttons were not working due to a race condition caused by calling `navigate` immediately after `signOut`. This has been fixed by removing the manual navigation calls.
*   **Supabase Connection & RLS Policies:** The application was failing to connect to Supabase due to an invalid API key and was receiving "unauthorized" errors due to missing Row Level Security (RLS) policies. The API key has been corrected, and a comprehensive RLS policy script has been provided and applied.

### Phase 2: Feature Enhancement and UI Polish

*   **Admin Role Assignment:** Logic was added to `AuthContext.tsx` to automatically assign the `admin` role to a predefined list of email addresses upon registration.
*   **Footer Link Correction:** Broken links in the footer for vehicle categories were fixed to point to the correct `/carroceria/...` routes.
*   **Mobile UI Improvements:**
    *   The "Outlet" link was removed from the mobile menu.
    *   Padding and spacing on the homepage's CTA cards were adjusted for a better mobile layout.
    *   The "Why Choose Trefa" section was made responsive to stack correctly on mobile devices.
*   **Corrected "Vender mi Auto" Flow:** The routing and navigation for this feature were completely overhauled to use a public valuation page (`GetAQuotePage`) and a separate, protected page (`SellMyCarPage`) for submitting details post-quote.
*   **Application Form Enhancements:** The form logic was updated to allow submission without requiring documents to be uploaded first, and a success toast message was added.
*   **CRM & Lead Source Enhancements:**
    *   The application now captures and stores lead source parameters (UTM, rfdm, etc.).
    *   The CRM dashboard was enhanced with new statistical cards for key metrics.
    *   The CRM client profile page now displays the captured lead source information and the user's uploaded documents.
*   **Security & UI for Agent Access:**
    *   A secure Supabase function was created to enforce user permission for sales agent access.
    *   The profile page was updated to show the assigned agent's name and restyle the permission checkbox into a prominent alert box for better visibility.
*   **Application Flow Correction (Final):** Resolved the critical confusion between `DashboardPage`, `SeguimientoPage`, and `Application.tsx` by correcting the routes in `App.tsx`. `SeguimientoPage` is now the list view for "Mis Solicitudes," and `Application.tsx` is used for both new applications and editing existing ones.

## Key Points for Future Development

*   **Context is King:** Always use the `useAuth` and `useVehicles` hooks to access authentication state and vehicle data. Do not bypass these contexts.
*   **Handle Navigation with Care:** When performing actions that change the authentication state (like login or logout), let the `AuthProvider` and `AuthHandler` manage the redirection. Avoid calling `navigate` directly in the same function.
*   **RLS is Your Friend:** If you add new tables or features that interact with the database, remember to add the corresponding Row Level Security policies in Supabase to prevent "unauthorized" errors.
*   **Secure Functions for CRM:** When adding new data to the CRM, use secure Supabase RPC functions to enforce access control on the backend, rather than relying on client-side checks.
*   **This File is Your Guide:** Refer to this document before starting any new work to ensure you understand the current state of the application and its core architectural patterns.