import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Select from "react-select";

import Navbar from "../../components/Navbar";
import { domains } from "../../context/domains.json";

const Register = () => {
  const [username, setUsername] = useState("User");
  const [email, setEmail] = useState("user@mail.com");
  const [password, setPassword] = useState("user_password");
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [selectedDomains, setSelectedDomains] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          await axios.get(`${import.meta.env.VITE_API}/users/verify-token`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          navigate("/");
        } catch (err) {
          localStorage.removeItem("token");
        }
      }
    };
    verifyToken();
  }, [navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await axios.post(`${import.meta.env.VITE_API}/users/register`, {
        username,
        email,
        password,
        role: role === "Other" ? customRole : role,
        domain_preferences: selectedDomains,
      });

      navigate("/login");
    } catch (err) {
      setError("Registration failed. Try again.");
    }
  };

  const domainOptions = domains.map((domain) => ({
    label: domain,
    value: domain,
  }));

  const handleDomainChange = (selectedOptions) => {
    setSelectedDomains(selectedOptions.map((opt) => opt.value));
  };

  const selectStyles = {
    control: (provided, { isFocused }) => ({
      ...provided,
      backgroundColor: "#1a1a1a",
      borderColor: isFocused ? "#ffd85c" : "#38BDF8",
      boxShadow: isFocused ? "0 0 0 1px #ffd85c" : "none",
      color: "white",
      "&:hover": { borderColor: "#ffd85c" },
      minHeight: "48px",
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "#121212",
      border: "1px solid #38BDF8",
      zIndex: 10,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#38BDF8"
        : state.isFocused
        ? "#2a2a2a"
        : "#121212",
      color: state.isSelected ? "black" : "white",
      "&:active": { backgroundColor: "#38BDF8" },
    }),
    singleValue: (provided) => ({ ...provided, color: "white" }),
    placeholder: (provided) => ({ ...provided, color: "#9ca3af" }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: "#38BDF8",
      color: "black",
    }),
    multiValueLabel: (provided) => ({ ...provided, color: "black" }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: "black",
      "&:hover": { backgroundColor: "#ffd85c", color: "black" },
    }),
    indicatorSeparator: (provided) => ({
      ...provided,
      backgroundColor: "#38BDF8",
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: "#38BDF8",
      "&:hover": { color: "#ffd85c" },
    }),
  };

  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen bg-[#1e1e1e]">
        <div className="w-full max-w-md p-8 bg-[#1e1e1e] border border-[#62BBC1] rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-center text-[#FFFBFC] mb-6">
            Register
          </h2>

          {error && (
            <p className="text-red-400 text-sm text-center mb-4">{error}</p>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 bg-[#1e1e1e] text-[#FFFBFC] border border-[#62BBC1] focus:outline-none focus:ring-2 focus:ring-[#62BBC1]"
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-[#1e1e1e] text-[#FFFBFC] border border-[#62BBC1] focus:outline-none focus:ring-2 focus:ring-[#62BBC1]"
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-[#1e1e1e] text-[#FFFBFC] border border-[#62BBC1] focus:outline-none focus:ring-2 focus:ring-[#62BBC1]"
            />

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="w-full px-4 py-2 bg-[#1e1e1e] text-[#FFFBFC] border border-[#62BBC1] focus:outline-none focus:ring-2 focus:ring-[#62BBC1]"
            >
              <option value="">Select Role</option>
              <option value="Student">Student</option>
              <option value="Teacher">Teacher</option>
              <option value="Employee">Employee</option>
              <option value="Other">Other</option>
            </select>

            {role === "Other" && (
              <input
                type="text"
                placeholder="Enter your role"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                required
                className="w-full px-4 py-2 bg-[#1e1e1e] text-[#FFFBFC] border border-[#62BBC1] focus:outline-none focus:ring-2 focus:ring-[#62BBC1]"
              />
            )}

            <div className="flex flex-col">
              <Select
                isMulti
                options={domainOptions}
                value={domainOptions.filter((opt) =>
                  selectedDomains.includes(opt.value)
                )}
                onChange={handleDomainChange}
                styles={selectStyles}
                classNamePrefix="react-select"
                placeholder="Search and select domains..."
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#C0F562] text-[#1e1e1e] font-bold hover:bg-[#A9E34F] transition rounded-lg shadow-md" // Updated button styling
            >
              Register
            </button>
          </form>

          <p className="text-center text-[#FFFBFC] text-sm mt-4">
            Already have an account?{" "}
            <a href="/login" className="text-[#62BBC1] hover:underline">
              Login here
            </a>
          </p>
        </div>
      </div>
    </>
  );
};

export default Register;
