import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@/types";
import type { ApiResponse } from "@/dtos";

const API_BASE_URL = "http://localhost:8000/api";

// User API functions
export const userApi = {
  getAll: async (): Promise<ApiResponse<User[]>> => {
    const response = await fetch(`${API_BASE_URL}/user/`);
    if (!response.ok) throw new Error("Failed to fetch users");
    return response.json();
  },

  getById: async (userId: number): Promise<ApiResponse<User>> => {
    const response = await fetch(`${API_BASE_URL}/user/${userId}`);
    if (!response.ok) throw new Error("Failed to fetch user");
    return response.json();
  },

  create: async (data: {
    name: string;
    riot_id: string;
    discord_id: string;
  }): Promise<ApiResponse<User>> => {
    const response = await fetch(`${API_BASE_URL}/user/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create user");
    return response.json();
  },

  update: async (
    userId: number,
    data: Partial<{
      name: string;
      riot_id: string;
      discord_id: string;
    }>
  ): Promise<ApiResponse<User>> => {
    const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update user");
    return response.json();
  },

  delete: async (userId: number): Promise<ApiResponse<null>> => {
    const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete user");
    return response.json();
  },
};

// React Query hooks
export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: userApi.getAll,
  });
};

export const useUser = (userId: number) => {
  return useQuery({
    queryKey: ["users", userId],
    queryFn: () => userApi.getById(userId),
    enabled: !!userId,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: number;
      data: Partial<{
        name: string;
        riot_id: string;
        discord_id: string;
      }>;
    }) => userApi.update(userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", variables.userId] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
