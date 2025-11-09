import { useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL = "http://localhost:8000/api";

export function useAddPresetLeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      presetId,
      userId,
    }: {
      presetId: number;
      userId: number;
    }) => {
      const response = await fetch(`${API_URL}/preset-leader`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset_id: presetId, user_id: userId }),
      });
      if (!response.ok) throw new Error("Failed to add preset leader");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
}

export function useRemovePresetLeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      presetLeaderId,
      presetId,
    }: {
      presetLeaderId: number;
      presetId: number;
    }) => {
      const response = await fetch(
        `${API_URL}/preset-leader/${presetLeaderId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("Failed to remove preset leader");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
}
