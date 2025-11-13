// src/context/AuthProvider.jsx

import { useState, useEffect } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContext"; // Import the context

// The AuthProvider component
export default function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  // ... (The rest of your logic remains here)

  useEffect(() => {
    const validateToken = async () => {
      // ... (Your token validation logic)
      const token = localStorage.getItem("token");

      if (!token) {
        setIsAuthenticated(false);
        setIsValidating(false);
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API}/users/verify-token`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Token validation failed:", error);
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, []);

  const login = () => {
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  const authContextValue = {
    isAuthenticated,
    isValidating,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}
