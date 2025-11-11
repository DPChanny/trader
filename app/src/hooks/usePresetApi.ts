import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Preset, PresetDetail } from "@/dtos";
import { PRESET_API_URL } from "@/config";

export const presetApi = {
  getAll: async (): Promise<Preset[]> => {
    const response = await fetch(`${PRESET_API_URL}`);
    if (!response.ok) throw new Error("Failed to fetch presets");
    const data = await response.json();
    return data.data as Preset[];
  },

  getById: async (presetId: number): Promise<PresetDetail | null> => {
    if (!presetId) return null;
    const response = await fetch(`${PRESET_API_URL}/${presetId}`);
    if (!response.ok) throw new Error("Failed to fetch preset detail");
    const data = await response.json();
    return data.data as PresetDetail;
  },

  add: async (data: {
    name: string;
    points?: number;
    time?: number;
  }): Promise<any> => {
    const response = await fetch(`${PRESET_API_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        points: data.points ?? 1000,
        time: data.time ?? 30,
      }),
    });
    if (!response.ok) throw new Error("Failed to add preset");
    return response.json();
  },

  update: async (
    presetId: number,
    data: {
      name?: string;
      points?: number;
      time?: number;
    }
  ): Promise<any> => {
    const body: any = {};
    if (data.name !== undefined) body.name = data.name;
    if (data.points !== undefined) body.points = data.points;
    if (data.time !== undefined) body.time = data.time;

    const response = await fetch(`${PRESET_API_URL}/${presetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("Failed to update preset");
    return response.json();
  },

  delete: async (presetId: number): Promise<any> => {
    const response = await fetch(`${PRESET_API_URL}/${presetId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete preset");
    return response.json();
  },
};

export const usePresets = () => {
  return useQuery({
    queryKey: ["presets"],
    queryFn: presetApi.getAll,
  });
};

export const usePresetDetail = (presetId: number | null) => {
  return useQuery({
    queryKey: ["preset", presetId],
    queryFn: () => presetApi.getById(presetId!),
    enabled: !!presetId,
  });
};

export const useAddPreset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: presetApi.add,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
    },
  });
};

export const useUpdatePreset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      presetId,
      ...data
    }: {
      presetId: number;
      name?: string;
      points?: number;
      time?: number;
    }) => presetApi.update(presetId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
};

export const useDeletePreset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: presetApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
    },
  });
};
