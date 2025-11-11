import { useMutation } from "@tanstack/react-query";
import type { Auction, ApiResponse } from "@/dtos";

const API_URL = "http://localhost:8000";

// 경매 생성
export function useCreateAuction() {
  return useMutation<ApiResponse<Auction>, Error, number>({
    mutationFn: async (presetId: number) => {
      const response = await fetch(`${API_URL}/api/auction/${presetId}`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to create auction");
      return response.json();
    },
  });
}
