const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';
const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const SESSION_EVENT = 'simulador-session-change';

export type User = {
  id: string;
  name: string;
  email: string;
  createdAtUtc?: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type CreditDto = {
  id: string;
  userId: string;
  name: string;
  amount: number;
  annualInterestRate: number;
  termMonths: number;
  amortizationType: string;
  createdAtUtc: string;
};

export type AmortizationInstallmentDto = {
  period: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
};

export type SimulationDto = {
  id: string;
  userId: string;
  creditId?: string | null;
  amount: number;
  annualInterestRate: number;
  termMonths: number;
  amortizationType: string;
  totalInterest: number;
  totalPayment: number;
  schedule: AmortizationInstallmentDto[];
  createdAtUtc: string;
};

export type ApiResult<T> = {
  response: Response;
  body: T | string | null;
};

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function hasSession() {
  return Boolean(getToken());
}

export function getStoredUser(): User | null {
  const value = localStorage.getItem(USER_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as User;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function saveSession(auth: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, auth.token);
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
  notifySessionChanged();
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  notifySessionChanged();
}

export function subscribeToSessionChanges(listener: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === TOKEN_KEY || event.key === USER_KEY) {
      listener();
    }
  };

  window.addEventListener(SESSION_EVENT, listener);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(SESSION_EVENT, listener);
    window.removeEventListener('storage', handleStorage);
  };
}

export function getApiMessage(body: unknown, fallback: string) {
  if (typeof body === 'string' && body.trim()) return body;
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  const headers = new Headers(options.headers);
  const token = getToken();
  const hasJsonBody = Boolean(options.body) && !(options.body instanceof FormData);

  if (hasJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const contentType = response.headers.get('content-type') ?? '';
  let body: T | string | null = null;

  if (response.status !== 204) {
    body = contentType.includes('json')
      ? ((await response.json()) as T)
      : await response.text();
  }

  if (response.status === 401) {
    clearSession();
  }

  return { response, body };
}

function notifySessionChanged() {
  window.dispatchEvent(new Event(SESSION_EVENT));
}
