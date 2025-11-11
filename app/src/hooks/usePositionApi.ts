import { useMutation, useQueryClient } from "@tanstack/react-query";
import { POSITION_API_URL } from "@/config";
import { getAuthHeadersForMutation } from "@/lib/auth";

export const positionApi = {
  add: async (data: { presetUserId: number; name: string }): Promise<any> => {
    const response = await fetch(`${POSITION_API_URL}`, {
      method: "POST",
      headers: getAuthHeadersForMutation(),
      body: JSON.stringify({
        preset_user_id: data.presetUserId,
        name: data.name,
      }),
    });
    if (!response.ok) throw new Error("Failed to add position");
    return response.json();
  },

  delete: async (positionId: number): Promise<any> => {
    const response = await fetch(`${POSITION_API_URL}/${positionId}`, {
      method: "DELETE",
      headers: getAuthHeadersForMutation(),
    });
    if (!response.ok) throw new Error("Failed to delete position");
    return response.json();
  },
};

export const useAddPosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      presetUserId: number;
      presetId: number;
      name: string;
    }) => positionApi.add({ presetUserId: data.presetUserId, name: data.name }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
};

export const useDeletePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ positionId }: { positionId: number; presetId: number }) =>
      positionApi.delete(positionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
};
