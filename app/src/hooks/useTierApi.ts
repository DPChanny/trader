import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TIER_API_URL } from "@/config";
import { getAuthHeadersForMutation } from "@/lib/auth";
import { toSnakeCase } from "@/lib/dtoMapper";

export const tierApi = {
  add: async (data: { presetId: number; name: string }): Promise<any> => {
    const response = await fetch(`${TIER_API_URL}`, {
      method: "POST",
      headers: getAuthHeadersForMutation(),
      body: JSON.stringify(toSnakeCase(data)),
    });
    if (!response.ok) throw new Error("Failed to add tier");
    return response.json();
  },

  update: async (tierId: number, data: { name: string }): Promise<any> => {
    const response = await fetch(`${TIER_API_URL}/${tierId}`, {
      method: "PATCH",
      headers: getAuthHeadersForMutation(),
      body: JSON.stringify(toSnakeCase(data)),
    });
    if (!response.ok) throw new Error("Failed to update tier");
    return response.json();
  },

  delete: async (tierId: number): Promise<any> => {
    const response = await fetch(`${TIER_API_URL}/${tierId}`, {
      method: "DELETE",
      headers: getAuthHeadersForMutation(),
    });
    if (!response.ok) throw new Error("Failed to delete tier");
    return response.json();
  },
};

export const useAddTier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { presetId: number; name: string }) => tierApi.add(data),
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

export const useUpdateTier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tierId,
      name,
    }: {
      tierId: number;
      presetId: number;
      name: string;
    }) => tierApi.update(tierId, { name }),
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

export const useDeleteTier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tierId }: { tierId: number; presetId: number }) =>
      tierApi.delete(tierId),
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
