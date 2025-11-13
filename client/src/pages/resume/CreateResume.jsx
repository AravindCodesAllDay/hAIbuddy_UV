// src/components/CreateResume.js
import React, { useState } from "react";

const CreateResume = () => {
  const [data, setData] = useState({
    name: "",
    title: "",
    summary: "",
    experience: [],
    skills: [],
    education: [],
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async () => {
    const { name, title, summary, experience, skills, education } = data;

    if (!name || !title || !summary) {
      alert("Please fill in all required fields.");
      return;
    }
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:8000/resume/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create resume");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resume.pdf";
      document.body.appendChild(a);
      a.click();
    } catch (error) {
      console.error(error);
      alert("Error creating resume");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Create Resume</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium">Name</label>
        <input
          type="text"
          name="name"
          value={data.name}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium">Title</label>
        <input
          type="text"
          name="title"
          value={data.title}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium">Summary</label>
        <textarea
          name="summary"
          value={data.summary}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium">Experience</label>
        <textarea
          name="experience"
          value={data.experience.join("\n")}
          onChange={(e) =>
            setData({
              ...data,
              experience: e.target.value.split("\n"),
            })
          }
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium">Skills</label>
        <input
          type="text"
          name="skills"
          value={data.skills.join(", ")}
          onChange={(e) =>
            setData({
              ...data,
              skills: e.target.value.split(",").map((skill) => skill.trim()),
            })
          }
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium">Education</label>
        <textarea
          name="education"
          value={data.education.join("\n")}
          onChange={(e) =>
            setData({
              ...data,
              education: e.target.value.split("\n"),
            })
          }
          className="w-full p-2 border rounded"
        />
      </div>
      <button
        onClick={handleSubmit}
        className="w-full bg-green-500 text-white p-2 rounded"
      >
        Create Resume
      </button>
    </div>
  );
};

export default CreateResume;
