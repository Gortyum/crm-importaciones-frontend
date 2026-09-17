const TOKEN_KEY = "crm_token";
const USER_KEY = "crm_user";
const DEMO_KEY = "crm_demo";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUsername(): string | null {
  return localStorage.getItem(USER_KEY);
}

export function isDemo(): boolean {
  return localStorage.getItem(DEMO_KEY) === "true";
}

export function setSession(token: string, username: string, demo = false): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, username);
  if (demo) localStorage.setItem(DEMO_KEY, "true");
  else localStorage.removeItem(DEMO_KEY);
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(DEMO_KEY);
}
