import axios from "axios";

let url;
if (process.env.NEXT_PUBLIC_STATE === "production") {
  url = process.env.NEXT_PUBLIC_PRO_BASE_URL;
} else {
  url = process.env.NEXT_PUBLIC_BASE_URL;
}

export const api = axios.create({
  // baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  // baseURL: "http://localhost:4000",

  baseURL: url,
  // baseURL: "https://cafe-management-system-b9fa.onrender.com",

  withCredentials: true, // ✅ SEND/RECEIVE COOKIES
  headers: { "Content-Type": "application/json" },
});

// Optional: normalize errors
export function getApiError(err: any, fallback = "Request failed") {
  return err?.response?.data?.message || err?.message || fallback;
}
