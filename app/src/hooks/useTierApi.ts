import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TIER_API_URL } from "@/config";

export function useCreateTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      presetId,
      name,
    }: {
      presetId: number;
      name: string;
    }) => {
      const response = await fetch(`${TIER_API_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset_id: presetId, name }),
      });
      if (!response.ok) throw new Error("Failed to create tier");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
}

export function useUpdateTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tierId,
      name,
    }: {
      tierId: number;
      presetId: number;
      name: string;
    }) => {
      const response = await fetch(`${TIER_API_URL}/${tierId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error("Failed to update tier");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
}

export function useDeleteTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tierId }: { tierId: number; presetId: number }) => {
      const response = await fetch(`${TIER_API_URL}/${tierId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete tier");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
}
