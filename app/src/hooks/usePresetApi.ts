import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Preset, PresetDetail, ApiResponse } from "@/dtos";
import { PRESET_API_URL } from "@/config";
import { getAuthHeadersForMutation } from "@/lib/auth";
import { toCamelCase, toSnakeCase } from "@/lib/dtoMapper";

export const presetApi = {
  getAll: async (): Promise<Preset[]> => {
    const response = await fetch(`${PRESET_API_URL}`);
    if (!response.ok) throw new Error("Failed to fetch presets");
    const json: ApiResponse<any[]> = await response.json();
    return toCamelCase<Preset[]>(json.data);
  },

  getById: async (presetId: number): Promise<PresetDetail | null> => {
    if (!presetId) return null;
    const response = await fetch(`${PRESET_API_URL}/${presetId}`);
    if (!response.ok) throw new Error("Failed to fetch preset detail");
    const json: ApiResponse<any> = await response.json();
    return toCamelCase<PresetDetail>(json.data);
  },

  add: async (data: {
    name: string;
    points: number;
    time: number;
    pointScale?: number;
  }): Promise<Preset> => {
    const response = await fetch(`${PRESET_API_URL}`, {
      method: "POST",
      headers: getAuthHeadersForMutation(),
      body: JSON.stringify(toSnakeCase(data)),
    });
    if (!response.ok) throw new Error("Failed to add preset");
    const json: ApiResponse<any> = await response.json();
    return toCamelCase<Preset>(json.data);
  },

  update: async (
    presetId: number,
    data: {
      name?: string;
      points?: number;
      time?: number;
      pointScale?: number;
    }
  ): Promise<Preset> => {
    const response = await fetch(`${PRESET_API_URL}/${presetId}`, {
      method: "PATCH",
      headers: getAuthHeadersForMutation(),
      body: JSON.stringify(toSnakeCase(data)),
    });
    if (!response.ok) throw new Error("Failed to update preset");
    const json: ApiResponse<any> = await response.json();
    return toCamelCase<Preset>(json.data);
  },

  delete: async (presetId: number): Promise<void> => {
    const response = await fetch(`${PRESET_API_URL}/${presetId}`, {
      method: "DELETE",
      headers: getAuthHeadersForMutation(),
    });
    if (!response.ok) throw new Error("Failed to delete preset");
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
      point_scale?: number;
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
    onSuccess: (_, presetId) => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
      queryClient.removeQueries({ queryKey: ["preset", presetId] });
    },
  });
};
