import { useMutation, useQueryClient } from "@tanstack/react-query";

const API_URL = "http://localhost:8000/api";

export function useAddPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      presetUserId,
      name,
    }: {
      presetUserId: number;
      presetId: number;
      name: string;
    }) => {
      const response = await fetch(`${API_URL}/position`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset_user_id: presetUserId, name }),
      });
      if (!response.ok) throw new Error("Failed to add position");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
}

export function useDeletePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      positionId,
    }: {
      positionId: number;
      presetId: number;
    }) => {
      const response = await fetch(`${API_URL}/position/${positionId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete position");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
}
