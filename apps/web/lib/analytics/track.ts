'use client';

import { type AnalyticsEventName, type AnalyticsEventPayload } from './events';

function trackingEnabled(): boolean {
  const flag = process.env.NEXT_PUBLIC_WEB_TRACKING_V1_ENABLED;
  return flag === '1' || flag === 'true' || flag === 'yes';
}

function hasConsent(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return window.localStorage.getItem('analytics-consent') === 'granted';
  } catch {
    return false;
  }
}

export function trackEvent(name: AnalyticsEventName, payload?: AnalyticsEventPayload): void {
  if (!trackingEnabled() || !hasConsent()) {
    return;
  }

  // v1 baseline: lightweight, non-blocking event sink for future analytics integration.
  window.dispatchEvent(
    new CustomEvent('web-analytics', {
      detail: {
        name,
        payload: payload ?? {},
        ts: Date.now(),
      },
    }),
  );
}
