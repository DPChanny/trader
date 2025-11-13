import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { User, ApiResponse } from "@/dtos";
import { USER_API_URL } from "@/config";
import { getAuthHeadersForMutation } from "@/lib/auth";
import { toCamelCase, toSnakeCase } from "@/lib/dtoMapper";

export const userApi = {
  getAll: async (): Promise<User[]> => {
    const response = await fetch(`${USER_API_URL}/`);
    if (!response.ok) throw new Error("Failed to fetch users");
    const json: ApiResponse<any[]> = await response.json();
    return toCamelCase<User[]>(json.data);
  },

  getById: async (userId: number): Promise<User> => {
    const response = await fetch(`${USER_API_URL}/${userId}`);
    if (!response.ok) throw new Error("Failed to fetch user");
    const json: ApiResponse<any> = await response.json();
    return toCamelCase<User>(json.data);
  },

  add: async (data: {
    name: string;
    riotId: string;
    discordId: string;
  }): Promise<User> => {
    const response = await fetch(`${USER_API_URL}/`, {
      method: "POST",
      headers: getAuthHeadersForMutation(),
      body: JSON.stringify(toSnakeCase(data)),
    });
    if (!response.ok) throw new Error("Failed to add user");
    const json: ApiResponse<any> = await response.json();
    return toCamelCase<User>(json.data);
  },

  update: async (
    userId: number,
    data: Partial<{
      name: string;
      riotId: string;
      discordId: string;
    }>
  ): Promise<User> => {
    const response = await fetch(`${USER_API_URL}/${userId}`, {
      method: "PATCH",
      headers: getAuthHeadersForMutation(),
      body: JSON.stringify(toSnakeCase(data)),
    });
    if (!response.ok) throw new Error("Failed to update user");
    const json: ApiResponse<any> = await response.json();
    return toCamelCase<User>(json.data);
  },

  delete: async (userId: number): Promise<void> => {
    const response = await fetch(`${USER_API_URL}/${userId}`, {
      method: "DELETE",
      headers: getAuthHeadersForMutation(),
    });
    if (!response.ok) throw new Error("Failed to delete user");
  },
};

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

export const useAddUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.add,
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
        riotId: string;
        discordId: string;
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
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.removeQueries({ queryKey: ["users", userId] });
      queryClient.invalidateQueries({ queryKey: ["preset"] });
    },
  });
};
