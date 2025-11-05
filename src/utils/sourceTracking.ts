/**
 * Source Tracking Utility
 * Captures URL parameters and referrer information when leads first arrive at the site
 */

export interface SourceTrackingData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  rfdm?: string;
  referrer?: string;
  landing_page?: string;
  first_visit_at?: string;
}

const SOURCE_TRACKING_KEY = 'strefa_source_tracking';

/**
 * Captures URL parameters and referrer on first visit
 * Should be called on app initialization
 */
export function captureSourceTracking(): void {
  // Check if we already have source tracking data
  const existing = getSourceTracking();
  if (existing && existing.first_visit_at) {
    // Already captured, don't overwrite
    return;
  }

  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);

  const sourceData: SourceTrackingData = {
    utm_source: urlParams.get('utm_source') || undefined,
    utm_medium: urlParams.get('utm_medium') || undefined,
    utm_campaign: urlParams.get('utm_campaign') || undefined,
    utm_term: urlParams.get('utm_term') || undefined,
    utm_content: urlParams.get('utm_content') || undefined,
    rfdm: urlParams.get('rfdm') || undefined,
    referrer: document.referrer || undefined,
    landing_page: window.location.href,
    first_visit_at: new Date().toISOString(),
  };

  // Remove undefined values
  const cleanedData = Object.fromEntries(
    Object.entries(sourceData).filter(([_, value]) => value !== undefined)
  ) as SourceTrackingData;

  // Store in sessionStorage (persists across page navigation but not browser close)
  try {
    sessionStorage.setItem(SOURCE_TRACKING_KEY, JSON.stringify(cleanedData));
  } catch (error) {
    console.error('Failed to store source tracking data:', error);
  }
}

/**
 * Retrieves stored source tracking data
 */
export function getSourceTracking(): SourceTrackingData | null {
  try {
    const stored = sessionStorage.getItem(SOURCE_TRACKING_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as SourceTrackingData;
  } catch (error) {
    console.error('Failed to retrieve source tracking data:', error);
    return null;
  }
}

/**
 * Clears source tracking data (used after successful save to database)
 */
export function clearSourceTracking(): void {
  try {
    sessionStorage.removeItem(SOURCE_TRACKING_KEY);
  } catch (error) {
    console.error('Failed to clear source tracking data:', error);
  }
}

/**
 * Checks if there are any source parameters in the URL
 */
export function hasSourceParameters(): boolean {
  const urlParams = new URLSearchParams(window.location.search);
  const sourceParams = [
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'rfdm'
  ];
  return sourceParams.some(param => urlParams.has(param));
}
