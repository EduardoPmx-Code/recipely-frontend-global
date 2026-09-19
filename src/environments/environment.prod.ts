const getApiUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).__ENV__?.API_URL) {
    return (window as any).__ENV__.API_URL;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3003/api/`;
  }
  throw new Error('API_URL not configured');
};

const getWaiterApiUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).__ENV__?.WAITER_API_URL) {
    return (window as any).__ENV__.WAITER_API_URL;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/waiter-api/api/`;
  }
  throw new Error('WAITER_API_URL not configured');
};

export const environment = {
  production: true,
  apiUrl: getApiUrl(),
  waiterApiUrl: getWaiterApiUrl(),
  enableLogging: false,
};
