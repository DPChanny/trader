import { useMutation } from "@tanstack/react-query";
import type { Auction, ApiResponse } from "@/dtos";
import { AUCTION_API_URL } from "@/config";
import { getAuthHeadersForMutation } from "@/lib/auth";

export const auctionApi = {
  add: async (presetId: number): Promise<ApiResponse<Auction>> => {
    const response = await fetch(`${AUCTION_API_URL}/${presetId}`, {
      method: "POST",
      headers: getAuthHeadersForMutation(),
    });
    if (!response.ok) throw new Error("Failed to add auction");
    return response.json();
  },
};

export const useAddAuction = () => {
  return useMutation({
    mutationFn: auctionApi.add,
  });
};
