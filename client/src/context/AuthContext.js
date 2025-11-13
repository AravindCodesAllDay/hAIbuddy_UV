// src/context/AuthContext.js

import { createContext, useContext } from "react";

// The context object
export const AuthContext = createContext(null);

// Custom hook to easily consume the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
