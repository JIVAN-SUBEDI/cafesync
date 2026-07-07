import axios from "../lib/axios";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  country: string;
}

export interface AdminLoginPayload {
  email: string;
  password: string;
}

export const authService = {
  login: async (data: LoginPayload) => {
    const res = await axios.post("/auth/login", data);
    return res.data;
  },

  register: async (data: RegisterPayload) => {
    const res = await axios.post("/auth/register", data);
    return res.data;
  },
  adminLogin : async (data: AdminLoginPayload) => {
    const res= await axios.post('/api/auth/login', data)
    return res.data
  }
};
