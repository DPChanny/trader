import { useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL = "http://localhost:8000/api";

export function useAddPresetUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      presetId,
      userId,
      tierId,
    }: {
      presetId: number;
      userId: number;
      tierId: number | null;
    }) => {
      const response = await fetch(`${API_URL}/preset-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preset_id: presetId,
          user_id: userId,
          tier_id: tierId,
        }),
      });
      if (!response.ok) throw new Error("Failed to add preset user");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
}

export function useUpdatePresetUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      presetUserId,
      tierId,
    }: {
      presetUserId: number;
      presetId: number;
      tierId: number | null;
    }) => {
      const response = await fetch(`${API_URL}/preset-user/${presetUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier_id: tierId }),
      });
      if (!response.ok) throw new Error("Failed to update preset user");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
}

export function useRemovePresetUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      presetUserId,
    }: {
      presetUserId: number;
      presetId: number;
    }) => {
      const response = await fetch(`${API_URL}/preset-user/${presetUserId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to remove preset user");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
}
