import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PRESET_LEADER_API_URL } from "@/config";

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
      const response = await fetch(`${PRESET_LEADER_API_URL}`, {
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
    }: {
      presetLeaderId: number;
      presetId: number;
    }) => {
      const response = await fetch(
        `${PRESET_LEADER_API_URL}/${presetLeaderId}`,
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
