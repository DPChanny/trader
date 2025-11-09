import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const API_URL = "http://localhost:8000/api";

export interface Preset {
  preset_id: number;
  name: string;
}

export interface PresetUser {
  preset_user_id: number;
  preset_id: number;
  user_id: number;
  tier_id: number | null;
  user: {
    user_id: number;
    nickname: string;
    riot_nickname: string;
  };
  tier: {
    tier_id: number;
    name: string;
  } | null;
  positions: {
    position_id: number;
    name: string;
  }[];
}

export interface PresetLeader {
  preset_leader_id: number;
  preset_id: number;
  user_id: number;
  user: {
    user_id: number;
    nickname: string;
    riot_nickname: string;
  };
}

export interface Tier {
  tier_id: number;
  preset_id: number;
  name: string;
}

export interface PresetDetail {
  preset_id: number;
  name: string;
  leaders: PresetLeader[];
  preset_users: PresetUser[];
  tiers: Tier[];
}

export function usePresets() {
  return useQuery({
    queryKey: ["presets"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/preset`);
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
      const response = await fetch(`${API_URL}/preset/${presetId}`);
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
    mutationFn: async (name: string) => {
      const response = await fetch(`${API_URL}/preset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
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
    }: {
      presetId: number;
      name: string;
    }) => {
      const response = await fetch(`${API_URL}/preset/${presetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
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
      const response = await fetch(`${API_URL}/preset/${presetId}`, {
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
