import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("user@mail.com");
  const [password, setPassword] = useState("user_password");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated, login, isValidating } = useAuth();

  // Effect to handle redirection if already authenticated or validating
  useEffect(() => {
    if (!isValidating && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, isValidating, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Invalid credentials");
      }

      const data = await response.json();
      localStorage.setItem("token", data.access_token);

      login();
    } catch (err) {
      setError(err.message || "An unexpected error occurred. Try again.");
    }
  };

  // If currently validating the token on app load, show a loading message
  if (isValidating) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#1e1e1e] text-white">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      {/* Navbar will correctly show Login/User based on AuthContext */}
      <div className="flex items-center justify-center min-h-screen bg-[#1e1e1e]">
        <div className="w-full max-w-md p-8 bg-[#1e1e1e] border border-[#62BBC1] rounded-lg shadow-lg">
          {/* Added rounded and shadow for modern look */}
          <h2 className="text-3xl font-bold text-center text-[#FFFBFC] mb-8">
            {/* Increased text size and margin */}
            Login to hAI-Buddy
          </h2>
          {error && (
            <p className="text-red-400 text-base text-center mb-6 p-3 bg-red-900 bg-opacity-20 rounded">
              {/* Improved error styling */}
              {error} ❌
            </p>
          )}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Increased space */}
            <div>
              <label
                htmlFor="email"
                className="block text-[#FFFBFC] text-sm font-medium mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#2a2a2a] text-[#FFFBFC] border border-[#62BBC1] rounded focus:outline-none focus:ring-2 focus:ring-[#C0F562] transition duration-200" // Updated styling
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-[#FFFBFC] text-sm font-medium mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#2a2a2a] text-[#FFFBFC] border border-[#62BBC1] rounded focus:outline-none focus:ring-2 focus:ring-[#C0F562] transition duration-200" // Updated styling
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[#C0F562] text-[#1e1e1e] font-bold hover:bg-[#A9E34F] transition rounded-lg shadow-md" // Updated button styling
            >
              Login
            </button>
          </form>
          <p className="text-center text-[#FFFBFC] text-base mt-6">
            {/* Increased text size and margin */}
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-[#62BBC1] hover:underline font-semibold"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;
