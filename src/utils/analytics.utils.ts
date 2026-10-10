/**
 * Google Analytics Utilities
 * Comprehensive tracking for pages, events, and user interactions
 * GA4 Property ID: G-L0LS146KZG
 */

export interface PageTrackingData {
  path: string;
  title: string;
  referrer?: string;
}

export interface EventTrackingData {
  action: string;
  category: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

export interface UserData {
  userId?: string;
  email?: string;
  role?: string;
  tier?: number;
  [key: string]: any;
}

/**
 * Track page views with full context
 * Called automatically on route changes
 */
export const trackPageView = (data: PageTrackingData) => {
  if (typeof window === 'undefined') return;

  const { path, title, referrer } = data;

  // Google Analytics 4 page view
  (window as any).gtag?.('event', 'page_view', {
    page_path: path,
    page_title: title,
    page_referrer: referrer || document.referrer,
    page_location: window.location.href,
    timestamp: new Date().toISOString(),
  });

  // Console logging for debugging (remove in production if desired)
  if (process.env.NEXT_PUBLIC_VERBOSE_API_LOGGING === 'true') {
    console.debug('[Analytics] Page View:', { path, title });
  }
};

/**
 * Track custom events (purchases, signups, clicks, etc.)
 */
export const trackEvent = (data: EventTrackingData) => {
  if (typeof window === 'undefined') return;

  const { action, category, label, value, ...customParams } = data;

  (window as any).gtag?.('event', action, {
    event_category: category,
    event_label: label,
    value: value,
    ...customParams,
    timestamp: new Date().toISOString(),
  });

  if (process.env.NEXT_PUBLIC_VERBOSE_API_LOGGING === 'true') {
    console.debug('[Analytics] Event:', { action, category, label });
  }
};

/**
 * Track user identification for authenticated users
 * Call this after login to identify sessions
 */
export const trackUserIdentification = (userData: UserData) => {
  if (typeof window === 'undefined') return;

  const { userId, email, role, tier, ...customData } = userData;

  // Set user ID for GA4
  if (userId) {
    (window as any).gtag?.('config', 'G-L0LS146KZG', {
      'user_id': userId,
    });
  }

  // Set user properties
  (window as any).gtag?.('set', {
    'user_properties': {
      'user_email': email,
      'user_role': role,
      'user_tier': tier,
      ...customData,
    }
  });

  if (process.env.NEXT_PUBLIC_VERBOSE_API_LOGGING === 'true') {
    console.debug('[Analytics] User Identified:', { userId, role, tier });
  }
};

/**
 * Clear user identification on logout
 */
export const trackUserLogout = () => {
  if (typeof window === 'undefined') return;

  (window as any).gtag?.('set', {
    'user_id': null,
  });

  trackEvent({
    action: 'logout',
    category: 'authentication',
    label: 'user_logout',
  });
};

/**
 * Track e-commerce transactions (bills, cards, etc.)
 */
export const trackTransaction = (data: {
  transactionId: string;
  type: 'bills' | 'card' | 'wallet';
  amount: number;
  currency?: string;
  provider?: string;
  status: 'success' | 'failed' | 'pending';
}) => {
  if (typeof window === 'undefined') return;

  const { transactionId, type, amount, currency = 'NGN', provider, status } = data;

  (window as any).gtag?.('event', 'purchase', {
    transaction_id: transactionId,
    value: amount,
    currency: currency,
    items: [{
      item_id: transactionId,
      item_name: `${type}_${provider || 'default'}`,
      item_category: type,
      price: amount,
      quantity: 1,
    }],
    transaction_type: type,
    provider: provider,
    status: status,
  });

  trackEvent({
    action: `transaction_${status}`,
    category: 'transactions',
    label: type,
    value: amount,
  });
};

/**
 * Track user engagement metrics
 */
export const trackEngagement = (data: {
  type: 'click' | 'scroll' | 'form_start' | 'form_submit' | 'error' | 'interaction';
  target?: string;
  value?: any;
}) => {
  if (typeof window === 'undefined') return;

  const { type, target, value } = data;

  (window as any).gtag?.('event', type, {
    engagement_type: type,
    target_element: target,
    value: value,
  });
};

/**
 * Track errors for debugging
 */
export const trackError = (error: {
  message: string;
  stack?: string;
  context?: string;
  severity?: 'low' | 'medium' | 'high';
}) => {
  if (typeof window === 'undefined') return;

  const { message, stack, context, severity = 'medium' } = error;

  (window as any).gtag?.('event', 'exception', {
    description: message,
    fatal: severity === 'high',
    error_context: context,
    error_stack: stack,
  });

  trackEvent({
    action: 'error',
    category: 'system',
    label: message,
    value: severity === 'low' ? 1 : severity === 'medium' ? 2 : 3,
  });
};

/**
 * Track breadcrumb navigation
 */
export const trackBreadcrumb = (breadcrumbs: Array<{ title: string; url: string }>) => {
  if (typeof window === 'undefined') return;

  const breadcrumbPath = breadcrumbs.map(b => b.title).join(' > ');

  trackEvent({
    action: 'breadcrumb_navigation',
    category: 'navigation',
    label: breadcrumbPath,
  });
};

/**
 * Track form interactions
 */
export const trackFormEvent = (data: {
  formName: string;
  action: 'start' | 'field_focus' | 'field_blur' | 'validation_error' | 'submit' | 'complete';
  fieldName?: string;
  errorMessage?: string;
}) => {
  if (typeof window === 'undefined') return;

  const { formName, action, fieldName, errorMessage } = data;

  (window as any).gtag?.('event', `form_${action}`, {
    form_name: formName,
    field_name: fieldName,
    error_message: errorMessage,
  });
};

/**
 * Track authentication flows
 */
export const trackAuthenticationEvent = (data: {
  action: 'login_start' | 'login_success' | 'login_failed' | 'signup_start' | 'signup_success' | 'signup_failed' | 'password_reset' | 'email_verified' | 'phone_verified' | 'pin_setup' | 'pin_verified' | 'pin_failed';
  method?: string;
  error?: string;
}) => {
  if (typeof window === 'undefined') return;

  trackEvent({
    action: data.action,
    category: 'authentication',
    label: data.method || 'default',
    value: data.error ? 0 : 1,
  });
};

/**
 * Track time on page
 */
export const trackTimeOnPage = (data: { path: string; seconds: number }) => {
  if (typeof window === 'undefined') return;

  trackEvent({
    action: 'time_on_page',
    category: 'engagement',
    label: data.path,
    value: data.seconds,
  });
};

/**
 * Track search/filter interactions
 */
export const trackSearch = (data: { query: string; type?: string; results_count?: number }) => {
  if (typeof window === 'undefined') return;

  (window as any).gtag?.('event', 'search', {
    search_term: data.query,
    search_type: data.type,
    results_count: data.results_count,
  });
};

/**
 * Enable GA debugging (use in development)
 */
export const enableGADebugView = () => {
  if (typeof window === 'undefined') return;

  (window as any).gtag?.('config', 'G-L0LS146KZG', {
    'debug_mode': true,
  });

  console.log('[Analytics] Debug mode enabled. GA events will appear in GA4 Debug View.');
};
