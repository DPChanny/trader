import { useMutation, useQueryClient } from "@tanstack/react-query";
import { POSITION_API_URL } from "@/config";
import { getAuthHeadersForMutation } from "@/lib/auth";
import { toSnakeCase } from "@/lib/dtoMapper";

export const positionApi = {
  add: async (data: {
    presetId: number;
    name: string;
    iconUrl?: string;
  }): Promise<any> => {
    const response = await fetch(`${POSITION_API_URL}`, {
      method: "POST",
      headers: getAuthHeadersForMutation(),
      body: JSON.stringify(toSnakeCase(data)),
    });
    if (!response.ok) throw new Error("Failed to add position");
    return response.json();
  },

  update: async (data: {
    positionId: number;
    name?: string;
    iconUrl?: string;
  }): Promise<any> => {
    const { positionId, ...rest } = data;
    const response = await fetch(`${POSITION_API_URL}/${positionId}`, {
      method: "PUT",
      headers: getAuthHeadersForMutation(),
      body: JSON.stringify(toSnakeCase(rest)),
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
    mutationFn: (data: { presetId: number; name: string; iconUrl?: string }) =>
      positionApi.add(data),
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

export const useUpdatePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      positionId: number;
      presetId: number;
      name?: string;
      iconUrl?: string;
    }) =>
      positionApi.update({
        positionId: data.positionId,
        name: data.name,
        iconUrl: data.iconUrl,
      }),
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

export const useDeletePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ positionId }: { positionId: number; presetId: number }) =>
      positionApi.delete(positionId),
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
