export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
export const DEFAULT_IMAGE_URL = `${BASE_URL}/assets/placeholder.png`;
/** AI itinerary generation can take 1–3 minutes */
export const AI_REQUEST_TIMEOUT_MS = 300000;
