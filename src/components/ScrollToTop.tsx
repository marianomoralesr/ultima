import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 *
 * Automatically scrolls to the top of the page when:
 * - Navigation occurs (pathname changes)
 * - URL search params change (filters, pagination, etc.)
 *
 * This ensures users always start at the top when:
 * - Changing pages
 * - Applying filters
 * - Changing pagination
 * - Being redirected
 */
function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Scroll to top immediately and smoothly
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Instant scroll for better UX
    });

    // Also scroll the document element for better compatibility
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search]); // Trigger on both pathname AND search params changes

  return null;
}

export default ScrollToTop;