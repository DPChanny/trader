const API_BASE_URL = "http://localhost:8000/api";

export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

// User API
export const userApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/user/`);
    return response.json();
  },

  getById: async (userId: number) => {
    const response = await fetch(`${API_BASE_URL}/user/${userId}`);
    return response.json();
  },

  create: async (data: {
    nickname: string;
    riot_nickname: string;
    access_code: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/user/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  update: async (
    userId: number,
    data: Partial<{
      nickname: string;
      riot_nickname: string;
      access_code: string;
    }>
  ) => {
    const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  delete: async (userId: number) => {
    const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
      method: "DELETE",
    });
    return response.json();
  },
};
