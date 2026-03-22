const LOCAL_API = 'http://localhost:3000/api';

export function resolveApiBase(): string {
  if (typeof window === 'undefined') {
    return '/api';
  }

  const host = window.location.hostname;
  const port = window.location.port;
  if (host === 'localhost' || host === '127.0.0.1') {
    if (port === '3000' || port === '3001') {
      return '/api';
    }
    return LOCAL_API;
  }

  return '/api';
}

export const API_BASE = resolveApiBase();