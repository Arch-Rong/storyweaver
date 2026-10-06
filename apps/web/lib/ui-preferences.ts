export const SIDEBAR_COLLAPSED_KEY = "sw-sidebar-collapsed";

export function getSidebarCollapsed(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
}

export function setSidebarCollapsed(collapsed: boolean) {
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
}
