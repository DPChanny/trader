const TOKEN_COOKIE_NAME = "admin_token";

export function setAuthToken(token: string): void {
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

export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }
  return {
    "Content-Type": "application/json",
  };
}

export function getAuthHeadersForMutation(): HeadersInit {
  const token = getAuthToken();
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }
  return {
    "Content-Type": "application/json",
  };
}

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = {
    ...getAuthHeadersForMutation(),
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });

  // Check for token refresh
  checkAndUpdateToken(response);

  return response;
}

export function getHeadersWithoutAuth(): HeadersInit {
  return {
    "Content-Type": "application/json",
  };
}

export function checkAndUpdateToken(response: Response): void {
  const newToken = response.headers.get("X-New-Token");
  if (newToken) {
    setAuthToken(newToken);
  }
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
      setAuthToken(data.token);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return false;
  }
}
