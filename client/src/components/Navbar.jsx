// src/components/Navbar.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (isMenuOpen && !event.target.closest(".user-menu-container")) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isMenuOpen]);

  return (
    <nav
      className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-[#1e1e1e]" : "bg-[#1e1e1e]"
      } text-white py-4 px-6`}
    >
      <div className="container mx-auto flex justify-between items-center">
        <Link
          to={isAuthenticated ? "/dashboard" : "/"}
          className="text-2xl font-extrabold tracking-wide text-[#C0F562]"
        >
          hAI-Buddy
        </Link>

        <div className="flex items-center space-x-6">
          <Link to="/" className="hover:text-[#38BDF8] font-medium transition">
            Home
          </Link>
          <Link
            to="/services"
            className="hover:text-[#38BDF8] font-medium transition"
          >
            Services
          </Link>
          <Link
            to="/contact"
            className="hover:text-[#38BDF8] font-medium transition"
          >
            Contact
          </Link>
          <Link
            to="/about"
            className="hover:text-[#38BDF8] font-medium transition"
          >
            About
          </Link>
          {isAuthenticated ? ( // This now relies on the global context state
            <div className="relative user-menu-container">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 bg-[#2a2a2a] text-white hover:bg-[#333333] transition rounded-full"
              >
                <User className="w-6 h-6 text-[#ffd85c]" />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-[#2a2a2a] text-white rounded shadow-lg overflow-hidden z-20">
                  <Link
                    to="/dashboard"
                    className="block px-4 py-3 hover:bg-[#333333] transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="block px-4 py-3 hover:bg-[#333333] transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-red-500 hover:bg-[#333333] transition"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 bg-[#C0F562] text-[#1e1e1e] font-semibold hover:bg-[#ffd85c] transition rounded"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
