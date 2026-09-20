const getApiUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).__ENV__?.API_URL) {
    return (window as any).__ENV__.API_URL;
  }
  return 'http://localhost:3003/api/';
};

const getWaiterApiUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).__ENV__?.WAITER_API_URL) {
    return (window as any).__ENV__.WAITER_API_URL;
  }
  return 'http://localhost:3002/api/';
};

const getWsUrl = (): string => {
  if (typeof window !== 'undefined' && (window as any).__ENV__?.WS_URL) {
    return (window as any).__ENV__.WS_URL;
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
};

export const environment = {
  production: false,
  apiUrl: getApiUrl(),
  waiterApiUrl: getWaiterApiUrl(),
  wsUrl: getWsUrl(),
  enableLogging: true,
};
