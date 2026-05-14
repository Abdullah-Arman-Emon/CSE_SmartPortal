// src/context/AuthContext.jsx
import { createContext, useEffect, useState } from "react";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(
    localStorage.getItem("token") || sessionStorage.getItem("token") || ""
  );
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  
useEffect(() => {
  if (!token) {
    setUser(null);
    setLoading(false);
    return;
  }

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/v1/auth/get/user/from-token`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser({
        id: res.data.id,
        email: res.data.email,
        role: res.data.role,
        isAuthenticated: true,
      });
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false); // crucial!
    }
  };

  fetchUser();
}, [token]);

  return (
    <AuthContext.Provider value={{ token, setToken, user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
