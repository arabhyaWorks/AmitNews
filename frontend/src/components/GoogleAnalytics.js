import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Replace G-XXXXXXXXXX with your actual Google Analytics Measurement ID
 */
const GA_MEASUREMENT_ID = 'G-90YRN94Z0H';

export default function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    // Check if gtag is defined (injected via index.html)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  return null; // This component doesn't render anything
}
