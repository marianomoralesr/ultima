import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Profile } from '../types/types';

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

  useEffect(() => {
    // Wait until the authentication status is fully resolved.
    if (loading) {
      return;
    }

    const redirectPath = localStorage.getItem('loginRedirect');

    // Only act if there's a session, a profile, AND a redirect path is stored.
    if (session && profile && redirectPath) {
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
    }
  }, [session, profile, loading, navigate]);

  return null;
};

export default AuthHandler;