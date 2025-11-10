import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AuctionDTO, AuctionDetailDTO } from "@/types";

const API_URL = "http://localhost:8000";

interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
}

// 경매 리스트 조회
export function useGetAuctions() {
  return useQuery<ApiResponse<AuctionDTO[]>>({
    queryKey: ["auctions"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/auction/`);
      if (!response.ok) throw new Error("Failed to fetch auctions");
      return response.json();
    },
  });
}

// 경매 상세 조회
export function useGetAuctionDetail(sessionId: string | null) {
  return useQuery<ApiResponse<AuctionDetailDTO>>({
    queryKey: ["auction", sessionId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/auction/${sessionId}`);
      if (!response.ok) throw new Error("Failed to fetch auction detail");
      return response.json();
    },
    enabled: !!sessionId,
  });
}

// 경매 생성
export function useCreateAuction() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<AuctionDTO>, Error, number>({
    mutationFn: async (presetId: number) => {
      const response = await fetch(`${API_URL}/api/auction/${presetId}`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to create auction");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
    },
  });
}

// 경매 삭제
export function useDeleteAuction() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<null>, Error, string>({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`${API_URL}/api/auction/${sessionId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete auction");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auctions"] });
    },
  });
}
