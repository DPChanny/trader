import { useQuery } from "@tanstack/react-query";
import type { LolDto, ApiResponse } from "@/dtos";
import { LOL_API_URL } from "@/config";
import { toCamelCase } from "@/lib/dtoMapper";

export const lolApi = {
  getByUserId: async (userId: number): Promise<LolDto | null> => {
    try {
      const response = await fetch(`${LOL_API_URL}/${userId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch LOL info");
      }
      const json: ApiResponse<any> = await response.json();
      if (!json.data) return null;
      const result = toCamelCase<LolDto>(json.data);
      return result ?? null;
    } catch (error) {
      console.error("Error fetching LOL info:", error);
      return null;
    }
  },
};

export const useLolInfo = (userId: number | null) => {
  return useQuery({
    queryKey: ["lol", userId],
    queryFn: async () => {
      if (!userId) return null;
      return await lolApi.getByUserId(userId);
    },
    enabled: !!userId,
    retry: false,
  });
};
