const TOKEN_COOKIE_NAME = "admin_token";

export function setAuthToken(token: string): void {
  console.log("[Auth] Setting token:", token.substring(0, 20) + "...");
  const expires = new Date();
  expires.setTime(expires.getTime() + 24 * 60 * 60 * 1000);
  document.cookie = `${TOKEN_COOKIE_NAME}=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

export function getAuthToken(): string | null {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === TOKEN_COOKIE_NAME) {
      return value;
    }
  }
  return null;
}

export function removeAuthToken(): void {
  document.cookie = `${TOKEN_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

export function getAuthHeadersForMutation(): HeadersInit {
  const token = getAuthToken();
  console.log(
    "[Auth] Getting token for mutation:",
    token ? `${token.substring(0, 20)}...` : "null"
  );
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }
  console.warn("[Auth] No token found for mutation");
  return {
    "Content-Type": "application/json",
  };
}

export async function refreshAuthToken(): Promise<boolean> {
  const token = getAuthToken();
  if (!token) {
    return false;
  }

  try {
    const response = await fetch("http://localhost:8000/api/admin/refresh", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.token) {
        setAuthToken(data.token);
        return true;
      }
      console.error("Token refresh response missing token");
      return false;
    }
    console.error("Token refresh failed with status:", response.status);
    return false;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return false;
  }
}
