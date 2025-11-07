import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Profile } from '../types/types';
import { conversionTracking } from '../services/ConversionTrackingService';

export const checkApplicationProfileCompleteness = (p: Profile | null): boolean => {
    if (!p) return false;
    // Address fields (address, city, state, zip_code) are now part of the application form, not profile requirements
    const requiredApplicationFields: (keyof Profile)[] = ['first_name', 'last_name', 'mother_last_name', 'phone', 'birth_date', 'homoclave', 'fiscal_situation', 'civil_status', 'rfc'];
    return requiredApplicationFields.every(field => {
        const value = p[field];
        return value !== null && value !== undefined && String(value).trim() !== '';
    });
};

const AuthHandler: React.FC = () => {
  const { session, profile, loading } = useAuth();
  const navigate = useNavigate();
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    // Wait until the authentication status is fully resolved.
    if (loading) {
      return;
    }

    const redirectPath = localStorage.getItem('loginRedirect');

    // Only act if there's a session, a profile, AND a redirect path is stored.
    if (session && profile && redirectPath) {
      // Check if this is a new user coming from OAuth (Google)
      // We check if the user was created within the last 10 seconds and if they came from OAuth
      const isNewUser = session.user?.created_at &&
                        new Date(session.user.created_at).getTime() > (Date.now() - 10000);

      const isOAuthUser = session.user?.app_metadata?.provider === 'google' ||
                          session.user?.app_metadata?.providers?.includes('google');

      // Track InitialRegistration for new OAuth users (only once)
      if (isNewUser && isOAuthUser && !hasTrackedRef.current) {
        console.log('🎉 New Google OAuth user detected - tracking InitialRegistration');
        conversionTracking.trackAuth.googleSignIn({
          userId: session.user.id,
          email: session.user.email
        });
        hasTrackedRef.current = true;
      }

      // Small delay to ensure tracking event is sent before redirect
      const redirectDelay = (isNewUser && isOAuthUser) ? 500 : 0;

      setTimeout(() => {
        localStorage.removeItem('loginRedirect');

        // If the user was trying to get to the application page, check if their profile is complete first.
        if (redirectPath.startsWith('/escritorio/aplicacion')) {
          if (!checkApplicationProfileCompleteness(profile)) {
            // If not complete, force them to the profile page first.
            navigate('/escritorio/profile', { replace: true });
            return;
          }
        }

        // Perform the redirect.
        navigate(redirectPath, { replace: true });
      }, redirectDelay);
    }
  }, [session, profile, loading, navigate]);

  return null;
};

export default AuthHandler;