/**
 * Web Analytics Tracker Script
 * 
 * Usage:
 * 1. Add this script to your website with your website ID
 * 2. The tracker will automatically collect page views and basic info
 * 
 * Example:
 * <script src="https://your-analytics-domain.com/tracker.js" data-website-id="your-website-id"></script>
 */

(function() {
  'use strict';

  const SCRIPT = document.currentScript;
  const WEBSITE_ID = SCRIPT?.getAttribute('data-website-id');
  const API_URL = SCRIPT?.getAttribute('data-api-url') || 'http://localhost:3001';
  const TRACKER_VERSION = '1.0.0';

  if (!WEBSITE_ID) {
    console.warn('[Analytics] Website ID is required');
    return;
  }

  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = generateUUID();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  function getBrowser() {
    const ua = navigator.userAgent;
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('SamsungBrowser') > -1) return 'Samsung Browser';
    if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
    if (ua.indexOf('Edge') > -1) return 'Edge';
    if (ua.indexOf('Edg') > -1) return 'Edge';
    if (ua.indexOf('Chrome') > -1) return 'Chrome';
    if (ua.indexOf('Safari') > -1) return 'Safari';
    if (ua.indexOf('MSIE') > -1 || ua.indexEvent('Trident/') > -1) return 'IE';
    return 'Unknown';
  }

  function getOS() {
    const ua = navigator.userAgent;
    if (ua.indexOf('Win') > -1) return 'Windows';
    if (ua.indexOf('Mac') > -1) return 'MacOS';
    if (ua.indexOf('Linux') > -1) return 'Linux';
    if (ua.indexOf('Android') > -1) return 'Android';
    if (ua.indexOf('like Mac') > -1) return 'iOS';
    return 'Unknown';
  }

  async function sendBeacon(data) {
    try {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon(`${API_URL}/api/analytics/track/pageview`, blob);
    } catch (e) {
      console.error('[Analytics] Failed to send beacon:', e);
    }
  }

  function trackPageView() {
    const data = {
      websiteId: WEBSITE_ID,
      page: window.location.pathname,
      referrer: document.referrer || '',
      userAgent: navigator.userAgent,
      device: getDeviceType(),
      browser: getBrowser(),
      os: getOS(),
      screenSize: `${window.screen.width}x${window.screen.height}`,
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
    };

    fetch(`${API_URL}/api/analytics/track/pageview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      keepalive: true,
    }).catch(err => console.error('[Analytics] Track error:', err));
  }

  window.analytics = {
    track: function(eventName, eventData) {
      fetch(`${API_URL}/api/analytics/track/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteId: WEBSITE_ID,
          name: eventName,
          data: eventData,
          sessionId: sessionId,
        }),
      }).catch(err => console.error('[Analytics] Event error:', err));
    },
    identify: function(userId, userData) {
      sessionStorage.setItem('analytics_user_id', userId);
      if (userData) {
        sessionStorage.setItem('analytics_user_data', JSON.stringify(userData));
      }
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackPageView);
  } else {
    trackPageView();
  }

  let lastPath = window.location.pathname;
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      trackPageView();
    }
  });

  history.pushState = (function(original) {
    return function() {
      original.apply(this, arguments);
      trackPageView();
    };
  })(history.pushState);

  history.replaceState = (function(original) {
    return function() {
      original.apply(this, arguments);
      trackPageView();
    };
  })(history.replaceState);

  window.addEventListener('popstate', trackPageView);

  console.log(`[Analytics] Tracker v${TRACKER_VERSION} initialized for website ${WEBSITE_ID}`);
})();
