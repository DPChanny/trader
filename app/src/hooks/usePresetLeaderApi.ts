import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PRESET_LEADER_API_URL } from "@/config";
import { getAuthHeadersForMutation } from "@/lib/auth";

export const presetLeaderApi = {
  add: async (data: { presetId: number; userId: number }): Promise<any> => {
    const response = await fetch(`${PRESET_LEADER_API_URL}`, {
      method: "POST",
      headers: getAuthHeadersForMutation(),
      body: JSON.stringify({ preset_id: data.presetId, user_id: data.userId }),
    });
    if (!response.ok) throw new Error("Failed to add preset leader");
    return response.json();
  },

  delete: async (presetLeaderId: number): Promise<any> => {
    const response = await fetch(`${PRESET_LEADER_API_URL}/${presetLeaderId}`, {
      method: "DELETE",
      headers: getAuthHeadersForMutation(),
    });
    if (!response.ok) throw new Error("Failed to remove preset leader");
    return response.json();
  },
};

export const useAddPresetLeader = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: presetLeaderApi.add,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
};

export const useRemovePresetLeader = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      presetLeaderId,
    }: {
      presetLeaderId: number;
      presetId: number;
    }) => presetLeaderApi.delete(presetLeaderId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
};
