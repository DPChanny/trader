import { useMutation, useQueryClient } from "@tanstack/react-query";
import { POSITION_API_URL } from "@/config";
import { getAuthHeadersForMutation } from "@/lib/auth";

export const positionApi = {
  add: async (data: {
    presetId: number;
    name: string;
    icon_url?: string;
  }): Promise<any> => {
    const response = await fetch(`${POSITION_API_URL}`, {
      method: "POST",
      headers: getAuthHeadersForMutation(),
      body: JSON.stringify({
        preset_id: data.presetId,
        name: data.name,
        icon_url: data.icon_url,
      }),
    });
    if (!response.ok) throw new Error("Failed to add position");
    return response.json();
  },

  update: async (data: {
    positionId: number;
    name?: string;
    icon_url?: string;
  }): Promise<any> => {
    const response = await fetch(`${POSITION_API_URL}/${data.positionId}`, {
      method: "PUT",
      headers: getAuthHeadersForMutation(),
      body: JSON.stringify({
        name: data.name,
        icon_url: data.icon_url,
      }),
    });
    if (!response.ok) throw new Error("Failed to update position");
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
    mutationFn: (data: { presetId: number; name: string; icon_url?: string }) =>
      positionApi.add({
        presetId: data.presetId,
        name: data.name,
        icon_url: data.icon_url,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
};

export const useUpdatePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      positionId: number;
      presetId: number;
      name?: string;
      icon_url?: string;
    }) =>
      positionApi.update({
        positionId: data.positionId,
        name: data.name,
        icon_url: data.icon_url,
      }),
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
