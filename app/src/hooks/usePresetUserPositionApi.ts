import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PRESET_USER_POSITION_API_URL } from "../config";

interface AddPresetUserPositionData {
  presetUserId: number;
  positionId: number;
}

interface DeletePresetUserPositionData {
  presetUserPositionId: number;
}

export function useAddPresetUserPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddPresetUserPositionData) => {
      const response = await fetch(`${PRESET_USER_POSITION_API_URL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preset_user_id: data.presetUserId,
          position_id: data.positionId,
        }),
      });
      if (!response.ok) throw new Error("Failed to add position to user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
    },
  });
}

export function useDeletePresetUserPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DeletePresetUserPositionData) => {
      const response = await fetch(`${PRESET_USER_POSITION_API_URL}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preset_user_position_id: data.presetUserPositionId,
        }),
      });
      if (!response.ok) throw new Error("Failed to remove position from user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presets"] });
    },
  });
}
