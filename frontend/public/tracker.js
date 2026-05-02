(function() {
  'use strict';

  var API_URL = 'https://analytics.robintehofstee.com';
  var sessionId = null;
  var queuedEvents = [];

  function getSessionId() {
    if (sessionId) return sessionId;
    try {
      var stored = localStorage.getItem('_wa_sid');
      if (stored) { sessionId = stored; return sessionId; }
    } catch(e) {}
    sessionId = generateId();
    try { localStorage.setItem('_wa_sid', sessionId); } catch(e) {}
    return sessionId;
  }

  function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function getUTMParams() {
    var params = {};
    try {
      var search = window.location.search.substring(1);
      if (!search) return params;
      var pairs = search.split('&');
      for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        var key = decodeURIComponent(pair[0] || '');
        var val = decodeURIComponent(pair[1] || '');
        if (key === 'utm_source')   params.utmSource = val;
        if (key === 'utm_medium')   params.utmMedium = val;
        if (key === 'utm_campaign') params.utmCampaign = val;
        if (key === 'utm_term')     params.utmTerm = val;
        if (key === 'utm_content')  params.utmContent = val;
      }
    } catch(e) {}
    return params;
  }

  function getDeviceInfo() {
    try {
      var ua = navigator.userAgent;
      var device = 'Desktop';
      if (/mobile/i.test(ua)) device = 'Mobile';
      else if (/tablet/i.test(ua) || /ipad/i.test(ua)) device = 'Tablet';
      var browser = 'Unknown';
      if (/chrome/i.test(ua) && !/edge/i.test(ua)) browser = 'Chrome';
      else if (/firefox/i.test(ua)) browser = 'Firefox';
      else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
      else if (/edge/i.test(ua)) browser = 'Edge';
      var os = 'Unknown';
      if (/windows/i.test(ua)) os = 'Windows';
      else if (/mac/i.test(ua)) os = 'MacOS';
      else if (/linux/i.test(ua)) os = 'Linux';
      else if (/android/i.test(ua)) os = 'Android';
      else if (/ios|iphone|ipad/i.test(ua)) os = 'iOS';
      return { device: device, browser: browser, os: os };
    } catch(e) { return {}; }
  }

  function getScreenSize() {
    try { return window.screen.width + 'x' + window.screen.height; } catch(e) { return null; }
  }

  function sendBeacon(url, data) {
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, JSON.stringify(data));
        return;
      }
    } catch(e) {}
    fetch(url, { method: 'POST', body: JSON.stringify(data), keepalive: true })
      .catch(function() { queuedEvents.push(data); });
  }

  function trackPageview(websiteId) {
    if (!websiteId) return;
    var utm = getUTMParams();
    var info = getDeviceInfo();
    var data = {
      websiteId: websiteId,
      page: window.location.pathname + window.location.search,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent,
      device: info.device || null,
      browser: info.browser || null,
      os: info.os || null,
      screenSize: getScreenSize(),
      sessionId: getSessionId(),
    };
    Object.assign(data, utm);
    sendBeacon(API_URL + '/api/analytics/track/pageview', data);
    // Flush queued events
    while (queuedEvents.length > 0) {
      var evt = queuedEvents.shift();
      sendBeacon(API_URL + '/api/analytics/track/pageview', evt);
    }
  }

  function trackEvent(websiteId, name, category, data) {
    if (!websiteId || !name) return;
    sendBeacon(API_URL + '/api/analytics/track/event', {
      websiteId: websiteId,
      name: name,
      category: category || null,
      data: data || null,
      sessionId: getSessionId(),
    });
  }

  // Public API
  window.Viewly = {
    trackPageview: trackPageview,
    trackEvent: trackEvent,
  };

  // Auto-track pageview if data-website-id is set
  function autoTrack() {
    var script = document.currentScript || document.querySelector('script[data-website-id]');
    if (!script) return;
    var websiteId = script.getAttribute('data-website-id');
    if (websiteId) trackPageview(websiteId);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoTrack);
  } else {
    autoTrack();
  }

  // SPA: re-track on pushState/replaceState
  try {
    var originalPush = history.pushState;
    var originalReplace = history.replaceState;
    history.pushState = function() { originalPush.apply(this, arguments); setTimeout(autoTrack, 0); };
    history.replaceState = function() { originalReplace.apply(this, arguments); setTimeout(autoTrack, 0); };
  } catch(e) {}
})();
