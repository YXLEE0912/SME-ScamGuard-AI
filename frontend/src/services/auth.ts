export interface AuthUser {
  name: string;
  email: string;
  role: string;
}

export const MOCK_USER: AuthUser = {
  name: "Operator",
  email: "finance@sme-corp.my",
  role: "AP Approver",
};

export function getActiveAuthSession(): AuthUser {
  return MOCK_USER;
}

export function setDemoAuthSession(): AuthUser {
  return MOCK_USER;
}

export function clearAuthSession(): void {
  // Purely static mock session, no-op
}

export function initiateGoogleOAuth(): void {
  // Completely bypassed
  if (typeof window !== "undefined") {
    window.location.href = "/queue";
  }
}

export function getGoogleOAuthUrl(): string {
  return "/queue";
}
