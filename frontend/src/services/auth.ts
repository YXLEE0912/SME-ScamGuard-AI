export interface AuthUser {
  email: string;
  name: string;
  mode: "google" | "demo";
  picture?: string;
}

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  "1049283748291-exampleclientid12345.apps.googleusercontent.com";

export function getGoogleOAuthUrl(): string {
  const redirectUri =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/auth/callback/google`
      : "http://localhost:3000/api/auth/callback/google";

  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: redirectUri,
    client_id: GOOGLE_CLIENT_ID,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "openid",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/gmail.readonly",
    ].join(" "),
  };

  const qs = new URLSearchParams(options).toString();
  return `${rootUrl}?${qs}`;
}

export function initiateGoogleOAuth(): void {
  if (typeof window !== "undefined") {
    window.location.href = getGoogleOAuthUrl();
  }
}

export function setDemoAuthSession(): AuthUser {
  const demoUser: AuthUser = {
    email: "ap-audit@target-sme.com.my",
    name: "AP Lead Auditor",
    mode: "demo",
  };
  if (typeof window !== "undefined") {
    localStorage.setItem("scamguard_auth_mode", "demo");
    localStorage.setItem("scamguard_user", JSON.stringify(demoUser));
  }
  return demoUser;
}

export function getActiveAuthSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const storedUser = localStorage.getItem("scamguard_user");
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  }
  const mode = localStorage.getItem("scamguard_auth_mode");
  if (mode === "demo") {
    return {
      email: "ap-audit@target-sme.com.my",
      name: "AP Lead Auditor",
      mode: "demo",
    };
  }
  if (mode === "google") {
    return {
      email: "finance.controller@corporate.com.my",
      name: "Finance Controller",
      mode: "google",
    };
  }
  return null;
}

export function clearAuthSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("scamguard_auth_mode");
    localStorage.removeItem("scamguard_user");
  }
}
