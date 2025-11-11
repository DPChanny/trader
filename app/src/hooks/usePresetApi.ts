import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Preset, PresetDetail } from "@/dtos";
import { PRESET_API_URL } from "@/config";

export function usePresets() {
  return useQuery({
    queryKey: ["presets"],
    queryFn: async () => {
      const response = await fetch(`${PRESET_API_URL}`);
      if (!response.ok) throw new Error("Failed to fetch presets");
      const data = await response.json();
      return data.data as Preset[];
    },
  });
}

export function usePresetDetail(presetId: number | null) {
  return useQuery({
    queryKey: ["preset", presetId],
    queryFn: async () => {
      if (!presetId) return null;
      const response = await fetch(`${PRESET_API_URL}/${presetId}`);
      if (!response.ok) throw new Error("Failed to fetch preset detail");
      const data = await response.json();
      return data.data as PresetDetail;
    },
    enabled: !!presetId,
  });
}

export function useCreatePreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      points = 1000,
      time = 30,
    }: {
      name: string;
      points?: number;
      time?: number;
    }) => {
      const response = await fetch(`${PRESET_API_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, points, time }),
      });
      if (!response.ok) throw new Error("Failed to create preset");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
    },
  });
}

export function useUpdatePreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      presetId,
      name,
      points,
      time,
    }: {
      presetId: number;
      name?: string;
      points?: number;
      time?: number;
    }) => {
      const body: any = {};
      if (name !== undefined) body.name = name;
      if (points !== undefined) body.points = points;
      if (time !== undefined) body.time = time;

      const response = await fetch(`${PRESET_API_URL}/${presetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("Failed to update preset");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
}

export function useDeletePreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (presetId: number) => {
      const response = await fetch(`${PRESET_API_URL}/${presetId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete preset");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
    },
  });
}
