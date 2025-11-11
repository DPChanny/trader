import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PRESET_USER_API_URL } from "@/config";

export const presetUserApi = {
  add: async (data: {
    presetId: number;
    userId: number;
    tierId: number | null;
  }): Promise<any> => {
    const response = await fetch(`${PRESET_USER_API_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preset_id: data.presetId,
        user_id: data.userId,
        tier_id: data.tierId,
      }),
    });
    if (!response.ok) throw new Error("Failed to add preset user");
    return response.json();
  },

  update: async (
    presetUserId: number,
    data: { tierId: number | null }
  ): Promise<any> => {
    const response = await fetch(`${PRESET_USER_API_URL}/${presetUserId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier_id: data.tierId }),
    });
    if (!response.ok) throw new Error("Failed to update preset user");
    return response.json();
  },

  delete: async (presetUserId: number): Promise<any> => {
    const response = await fetch(`${PRESET_USER_API_URL}/${presetUserId}`, {
      method: "DELETE",
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
    }: {
      presetUserId: number;
      presetId: number;
      tierId: number | null;
    }) => presetUserApi.update(presetUserId, { tierId }),
    onSuccess: (_, variables) => {
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
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
};
