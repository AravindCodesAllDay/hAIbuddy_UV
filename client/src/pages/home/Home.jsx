import { Link, useNavigate } from "react-router-dom";
import Lottie from "react-lottie";

import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";

import animationData from "../../assets/animeOne.json";
import about from "/pics/about.png";

const Home = () => {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#1e1e1e] text-white">
      <Navbar />

      <section className="flex flex-col lg:flex-row items-center justify-between px-10 lg:px-40 py-24 gap-10">
        <div className="max-w-2xl space-y-6">
          <p className="uppercase tracking-widest text-sm text-[#6CFF5C]">
            Unlock Your Interview Potential
          </p>
          <h1 className="text-5xl font-extrabold leading-tight">
            Avatar-Based <span className="text-[#38BDF8]">Skill Training</span>
            <br />
            For Future Leaders
          </h1>
          <p className="text-lg text-gray-400">
            Simulate real-world interviews, practice interpersonal and technical
            skills, and grow with AI-driven feedback.
          </p>
          <ul className="flex flex-col sm:flex-row gap-4 text-sm text-[#ffd85c] mt-4">
            <li>No Credit Card Required</li>
            <li>Real-time 3D Avatar Simulations</li>
            <li>Boost Confidence and Communication</li>
          </ul>
          {token && (
            <Link
              to="/dashboard"
              className="mt-6 inline-block border-2 rounded-2xl border-[#6CFF5C] text-[#6CFF5C] px-6 py-2 hover:bg-[#6CFF5C] hover:text-[#1e1e1e] transition duration-500"
            >
              Get Started
            </Link>
          )}
        </div>
        <Lottie options={defaultOptions} height={400} width={400} />
      </section>

      <section className="flex justify-around py-20 px-10 lg:px-40 border-t border-b">
        <div className="flex flex-col space-y-2 max-w-sm">
          <p className="uppercase text-lg font-semibold tracking-wider text-[#38BDF8]">
            About Our Platform
          </p>
          <p className="leading-relaxed text-gray-400">
            Our avatar-based training platform combines advanced AI with
            immersive 3D avatars to simulate interviews, assess performance, and
            provide real-time feedback. Whether it's technical know-how or
            leadership communication, we're here to help you shine.
          </p>
        </div>

        <img
          src={about}
          alt="about"
          className="w-24 h-24 object-contain my-auto"
        />

        <div className="flex flex-col space-y-6 max-w-2xl">
          <h2 className="uppercase text-lg text-[#6CFF5C] tracking-widest">
            Why Choose Us?
          </h2>
          <ul className="list-disc ml-5 space-y-2 text-gray-400 text-left">
            <li>Cutting-edge 3D Avatar Experience</li>
            <li>Real-time Lip Sync and Viseme Integration</li>
            <li>Skill-Focused Simulations with Feedback</li>
            <li>User-Centric and Easy to Use</li>
          </ul>
        </div>
      </section>

      <section className="py-20 px-10 lg:px-40">
        <div className="max-w-7xl mx-auto text-center space-y-12">
          <h2 className="text-3xl font-bold text-[#6CFF5C] uppercase">
            Core Modules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-10">
            {/* Existing Cards */}
            <div className="bg-[#2a2a2a] text-white p-6 hover:bg-[#333333] transition">
              <h3 className="text-xl font-semibold text-[#38BDF8] mb-4">
                Reume Creation
              </h3>
              <p className="text-sm text-gray-400">
                Provide your information and get instantly an AI driven
                generated resume with more customization option
              </p>
            </div>
            <div className="bg-[#2a2a2a] text-white p-6 hover:bg-[#333333] transition">
              <h3 className="text-xl font-semibold text-[#38BDF8] mb-4">
                Skill Training
              </h3>
              <p className="text-sm text-gray-400">
                Choose between technical and interpersonal training paths to
                sharpen your skills for the real world.
              </p>
            </div>
            <div className="bg-[#2a2a2a] text-white p-6 hover:bg-[#333333] transition">
              <h3 className="text-xl font-semibold text-[#38BDF8] mb-4">
                Interview Simulation
              </h3>
              <p className="text-sm text-gray-400">
                Enter a simulated interview stage where avatars respond, react,
                and assess your performance dynamically.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
