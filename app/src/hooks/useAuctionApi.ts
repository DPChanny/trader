import { useMutation } from "@tanstack/react-query";
import type { AuctionDTO } from "@/types";

const API_URL = "http://localhost:8000";

interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

// 경매 생성
export function useCreateAuction() {
  return useMutation<ApiResponse<AuctionDTO>, Error, number>({
    mutationFn: async (presetId: number) => {
      const response = await fetch(`${API_URL}/api/auction/${presetId}`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to create auction");
      return response.json();
    },
  });
}
