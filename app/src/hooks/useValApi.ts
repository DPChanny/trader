import { useQuery } from "@tanstack/react-query";
import type { ValDto, ApiResponse } from "@/dtos";
import { VAL_API_URL } from "@/config";
import { toCamelCase } from "@/lib/dtoMapper";

export const valApi = {
  getByUserId: async (userId: number): Promise<ValDto | null> => {
    try {
      const response = await fetch(`${VAL_API_URL}/${userId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch VAL info");
      }
      const json: ApiResponse<any> = await response.json();
      if (!json.data) return null;
      const result = toCamelCase<ValDto>(json.data);
      return result ?? null;
    } catch (error) {
      console.error("Error fetching VAL info:", error);
      return null;
    }
  },
};

export const useValInfo = (userId: number | null, useCache: boolean = true) => {
  return useQuery({
    queryKey: ["val", userId],
    queryFn: async () => {
      if (!userId) return null;
      return await valApi.getByUserId(userId);
    },
    enabled: !!userId,
    retry: false,
    staleTime: useCache ? 5 * 60 * 1000 : 0,
    gcTime: useCache ? 10 * 60 * 1000 : 0,
  });
};
