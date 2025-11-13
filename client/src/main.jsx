import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import AuthProvider from "./context/AuthProvider";

import Login from "./pages/login/Login";
import Register from "./pages/login/Register";
import Home from "./pages/home/Home";
import NotFound from "./pages/404/NotFound";
import SecureLayout from "./SecureLayout";
import Profile from "./pages/profile/Profile";
import Setup from "./pages/setup/Setup";
import SkillsDashboard from "./pages/skilltraining/SkillDashboard";
import Services from "./pages/services/Services";
import Analysis from "./pages/resume/Analysis";
import CreateResume from "./pages/resume/CreateResume";
import Contact from "./pages/contact/Contact";
import About from "./pages/about/About";
import Dashboard from "./pages/dashboard/Dashboard";
import GenerateReport from "./pages/report/GenerateReport";
import VoiceAssistant from "./pages/s2s/VoiceAssistant";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/resume/analyse" element={<Analysis />} />
          <Route path="/resume/create" element={<CreateResume />} />
          <Route element={<SecureLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/session" element={<Setup />} />
            <Route path="/stage" element={<VoiceAssistant />} />
            <Route path="/generate_report" element={<GenerateReport />} />
            <Route path="/skill" element={<SkillsDashboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
