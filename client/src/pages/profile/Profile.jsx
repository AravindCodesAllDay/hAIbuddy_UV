import { useEffect, useState } from "react";
import axios from "axios";
import Select from "react-select";
import { domains } from "../../context/domains.json";

const Profile = () => {
  const [activeTab, setActiveTab] = useState("Profile Details");
  const [user, setUser] = useState({
    username: "",
    email: "",
    role: "",
    domain_preferences: [],
  });
  const [backupUser, setBackupUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const token = localStorage.getItem("token");

  const tabs = ["Profile Details", "Performances", "Appearance", "Sessions"];

  const roleOptions = [
    { value: "student", label: "Student" },
    { value: "teacher", label: "Teacher" },
    { value: "employee", label: "Employee" },
    { value: "other", label: "Other" },
  ];

  const domainOptions = domains.map((domain) => ({
    label: domain,
    value: domain,
  }));

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

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        console.warn("No token found. Cannot fetch profile.");
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API}/users/profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUser(response.data);
        setBackupUser(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching profile", error);
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleChange = (e) => {
    if (e && e.target) {
      setUser({ ...user, [e.target.name]: e.target.value });
    }
  };

  const handleRoleChange = (selectedOption) => {
    setUser((prev) => ({
      ...prev,
      role: selectedOption ? selectedOption.value : "",
    }));
  };

  const handleDomainChange = (selectedOptions) => {
    setUser((prev) => ({
      ...prev,
      domain_preferences: selectedOptions.map((opt) => opt.value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    try {
      await axios.put(`${import.meta.env.VITE_API}/users/update`, user, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Profile updated successfully!");
      setBackupUser(user);
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile", error);
      setMessage("Failed to update profile.");
    }
  };

  const handleCancel = () => {
    setUser(backupUser);
    setMessage("Changes reverted.");
    setEditMode(false);
  };

  if (loading)
    return (
      <p className="text-center mt-10 text-[#C0F562]">Loading profile...</p>
    );

  return (
    <div className="min-h-screen bg-[#1e1e1e] px-6 py-28 text-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold mb-8 text-center text-[#C0F562]">
          Profile
        </h2>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-6 border-b border-[#ffd85c] mb-10">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`py-3 px-5 font-semibold uppercase tracking-wide ${
                activeTab === tab
                  ? "text-[#38BDF8] border-b-2 border-[#38BDF8]"
                  : "text-[#C0F562] hover:text-[#ffd85c]"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Profile Details */}
        {activeTab === "Profile Details" && (
          <form
            onSubmit={handleSubmit}
            className="bg-[#121212] p-10 rounded-xl shadow-lg space-y-8 border border-[#2a2a2a]"
          >
            {message && (
              <p className="text-center text-[#ffd85c] font-medium tracking-wide">
                {message}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="mb-1 font-medium text-[#C0F562]">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={user.username}
                  onChange={handleChange}
                  disabled={!editMode}
                  className={`p-3 rounded-md focus:outline-none ${
                    editMode
                      ? "bg-[#1a1a1a] border border-[#38BDF8] text-white focus:border-[#ffd85c]"
                      : "bg-transparent border border-[#2a2a2a] text-[#C0F562]"
                  }`}
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium text-[#C0F562]">Email</label>
                <input
                  type="email"
                  name="email"
                  value={user.email}
                  disabled
                  className="p-3 bg-transparent border border-[#2a2a2a] text-[#C0F562] rounded-md"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="mb-1 font-medium text-[#C0F562]">Role</label>
              {editMode ? (
                <Select
                  options={roleOptions}
                  value={
                    roleOptions.find((option) => option.value === user.role) ||
                    null
                  }
                  onChange={handleRoleChange}
                  styles={selectStyles}
                  classNamePrefix="react-select"
                  placeholder="Select Role"
                />
              ) : (
                <p className="p-3 border border-[#2a2a2a] rounded-md text-[#C0F562] bg-transparent">
                  {user.role || "—"}
                </p>
              )}
            </div>

            <div className="flex flex-col">
              <label className="mb-2 font-medium text-[#C0F562]">
                Domain Preferences
              </label>
              {editMode ? (
                <Select
                  isMulti
                  options={domainOptions}
                  value={domainOptions.filter((opt) =>
                    user.domain_preferences.includes(opt.value)
                  )}
                  onChange={handleDomainChange}
                  styles={selectStyles}
                  classNamePrefix="react-select"
                  placeholder="Search and select domains..."
                />
              ) : (
                <div className="flex flex-wrap gap-2 border border-[#2a2a2a] p-3 rounded-md">
                  {user.domain_preferences.length > 0 ? (
                    user.domain_preferences.map((domain) => (
                      <span
                        key={domain}
                        className="bg-[#38BDF8] text-black px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {domain}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">No domains selected</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 pt-4">
              {!editMode ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setEditMode(true);
                  }}
                  className="bg-[#38BDF8] text-black py-3 px-6 rounded-md font-bold uppercase tracking-wide hover:bg-[#ffd85c] transition"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    className="bg-[#38BDF8] text-black py-3 px-6 rounded-md font-bold uppercase tracking-wide hover:bg-[#ffd85c] transition"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-[#2a2a2a] text-[#C0F562] py-3 px-6 rounded-md font-semibold hover:bg-[#3a3a3a] transition"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </form>
        )}

        {/* Other tabs */}
        {activeTab === "Performances" && (
          <div className="p-8 bg-[#121212] shadow-md text-center">
            <h3 className="text-2xl font-semibold text-[#38BDF8] mb-4">
              Performance Metrics
            </h3>
            <p className="text-gray-400">
              Your performance analytics will appear here soon!
            </p>
          </div>
        )}
        {activeTab === "Appearance" && (
          <div className="p-8 bg-[#121212] shadow-md text-center">
            <h3 className="text-2xl font-semibold text-[#38BDF8] mb-4">
              Customize Appearance
            </h3>
            <p className="text-gray-400">
              Avatar and theme customization coming soon!
            </p>
          </div>
        )}
        {activeTab === "Sessions" && (
          <div className="p-8 bg-[#121212] shadow-md text-center">
            <h3 className="text-2xl font-semibold text-[#38BDF8] mb-4">
              Session History
            </h3>
            <p className="text-gray-400">
              View all your past sessions and activities here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
