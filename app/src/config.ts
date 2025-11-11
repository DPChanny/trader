const API_HTTP_URL = "http://" + import.meta.env.VITE_API_HOST + ":8000";
const API_WS_URL = "ws://" + import.meta.env.VITE_API_HOST + ":8000";

export const API_BASE_URL = `${API_HTTP_URL}/api`;
export const WS_BASE_URL = `${API_WS_URL}/ws`;

export const AUCTION_API_URL = `${API_BASE_URL}/auction`;
export const USER_API_URL = `${API_BASE_URL}/user`;
export const PRESET_API_URL = `${API_BASE_URL}/preset`;
export const TIER_API_URL = `${API_BASE_URL}/tier`;
export const POSITION_API_URL = `${API_BASE_URL}/position`;
export const PRESET_USER_API_URL = `${API_BASE_URL}/preset-user`;
export const PRESET_LEADER_API_URL = `${API_BASE_URL}/preset-leader`;

export const AUCTION_WS_URL = `${WS_BASE_URL}/auction`;
