import { useMutation } from "@tanstack/react-query";
import type { Auction, ApiResponse } from "@/dtos";
import { AUCTION_API_URL } from "@/config";

// 경매 생성
export function useCreateAuction() {
  return useMutation<ApiResponse<Auction>, Error, number>({
    mutationFn: async (presetId: number) => {
      const response = await fetch(`${AUCTION_API_URL}/${presetId}`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to create auction");
      return response.json();
    },
  });
}
