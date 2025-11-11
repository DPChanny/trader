import { useMutation } from "@tanstack/react-query";
import { ADMIN_API_URL } from "@/config";
import { setAuthToken, getAuthToken } from "@/lib/auth";

interface AdminLoginResponse {
  token: string;
  message: string;
}

interface TokenRefreshResponse {
  token: string;
  message: string;
}

async function adminLogin(password: string): Promise<AdminLoginResponse> {
  const response = await fetch(`${ADMIN_API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Login failed");
  }

  return response.json();
}

async function refreshToken(): Promise<TokenRefreshResponse> {
  const token = getAuthToken();
  if (!token) {
    throw new Error("No token available");
  }

  const response = await fetch(`${ADMIN_API_URL}/refresh`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Token refresh failed");
  }

  return response.json();
}

export function useAdminLogin() {
  return useMutation({
    mutationFn: (password: string) => adminLogin(password),
    onSuccess: (data: AdminLoginResponse) => {
      setAuthToken(data.token);
    },
  });
}

export function useTokenRefresh() {
  return useMutation({
    mutationFn: () => refreshToken(),
    onSuccess: (data: TokenRefreshResponse) => {
      setAuthToken(data.token);
    },
  });
}
