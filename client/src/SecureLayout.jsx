// src/Layout.jsx
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

const SecureLayout = () => {
  const { isAuthenticated, isValidating } = useAuth();

  if (isValidating) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#1e1e1e] text-white">
        <p>Loading authentication...</p>
      </div>
    );
  }

  // Layout's job is to protect routes; if not authenticated, navigate away
  return isAuthenticated ? (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  ) : (
    <Navigate to="/login" />
  );
};

export default SecureLayout;
