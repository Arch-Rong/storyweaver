export const SESSION_COOKIE = "storyweaver_session";

export type SessionUser = {
  username: string;
  displayName: string;
};

export function parseSession(value: string | undefined | null): SessionUser | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as SessionUser;
    if (!parsed.username || !parsed.displayName) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function serializeSession(user: SessionUser): string {
  return encodeURIComponent(JSON.stringify(user));
}

export function readSessionFromStorage(): SessionUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_COOKIE);
  return parseSession(raw);
}

export function saveSession(user: SessionUser): void {
  const serialized = JSON.stringify(user);
  window.localStorage.setItem(SESSION_COOKIE, serialized);
  document.cookie = `${SESSION_COOKIE}=${serializeSession(user)}; path=/; max-age=2592000; samesite=lax`;
}

export function clearSession(): void {
  window.localStorage.removeItem(SESSION_COOKIE);
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
