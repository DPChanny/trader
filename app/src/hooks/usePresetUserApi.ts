import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PRESET_USER_API_URL } from "@/config";
import { getAuthHeadersForMutation } from "@/lib/auth";
import { toSnakeCase } from "@/lib/dtoMapper";

export const presetUserApi = {
  add: async (data: {
    presetId: number;
    userId: number;
    tierId: number | null;
    isLeader?: boolean;
  }): Promise<any> => {
    const response = await fetch(`${PRESET_USER_API_URL}`, {
      method: "POST",
      headers: getAuthHeadersForMutation(),
      body: JSON.stringify(toSnakeCase(data)),
    });
    if (!response.ok) throw new Error("Failed to add preset user");
    return response.json();
  },

  update: async (
    presetUserId: number,
    data: { tierId: number | null; isLeader?: boolean }
  ): Promise<any> => {
    const response = await fetch(`${PRESET_USER_API_URL}/${presetUserId}`, {
      method: "PATCH",
      headers: getAuthHeadersForMutation(),
      body: JSON.stringify(toSnakeCase(data)),
    });
    if (!response.ok) throw new Error("Failed to update preset user");
    return response.json();
  },

  delete: async (presetUserId: number): Promise<any> => {
    const response = await fetch(`${PRESET_USER_API_URL}/${presetUserId}`, {
      method: "DELETE",
      headers: getAuthHeadersForMutation(),
    });
    if (!response.ok) throw new Error("Failed to remove preset user");
    return response.json();
  },
};

export const useAddPresetUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: presetUserApi.add,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["presets"],
      });
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
};

export const useUpdatePresetUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      presetUserId,
      tierId,
      isLeader,
    }: {
      presetUserId: number;
      presetId: number;
      tierId: number | null;
      isLeader?: boolean;
    }) => presetUserApi.update(presetUserId, { tierId, isLeader }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["presets"],
      });
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
};

export const useRemovePresetUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      presetUserId,
    }: {
      presetUserId: number;
      presetId: number;
    }) => presetUserApi.delete(presetUserId),
    onSuccess: (_, variables) => {
      // Invalidate both presets list and specific preset detail
      queryClient.invalidateQueries({
        queryKey: ["presets"],
      });
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
};
