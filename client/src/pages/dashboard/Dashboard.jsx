import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import Lottie from "react-lottie";

import interview from "../../assets/interview.json";
import education from "../../assets/education.json";

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      toast.info("Please login to access the dashboard!", {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
      navigate("/login");
    }
  }, [token, navigate]);

  const services = [
    {
      title: "AI Interview",
      animation: interview,
      description:
        "Simulate real interviews with our AI avatars — practice, learn, and excel.",
      color: "#C0F562",
      path: "/session",
    },
    {
      title: "Skill Training",
      animation: education,
      description:
        "Master technical and interpersonal skills through engaging AI-led modules.",
      color: "#38BDF8",
      path: "/skill",
    },
  ];

  const assistants = [
    {
      title: "Startup Assistant",
      description:
        "Fuel your entrepreneurial dreams — plan, validate, and grow smarter with AI guidance.",
    },
    {
      title: "Resume Generator",
      description:
        "Generate professional resumes instantly, based on your inputs and AI expertise.",
    },
    {
      title: "Coding Assistant",
      description:
        "Solve coding problems, debug, and develop faster with your intelligent code partner.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#1e1e1e] text-white">
      <ToastContainer />
      <main className="flex-grow px-6 py-20 max-w-7xl mx-auto">
        <section className="text-center mb-16">
          <h2 className="text-4xl font-extrabold mb-4">
            Ready to <span className="text-[#38BDF8]">Evolve?</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Get started today — upskill yourself, polish your career, and
            prepare for the future.
          </p>
        </section>

        <section className="text-center mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2  gap-10">
            {services.map((service, index) => (
              <Link
                key={index}
                to={service.path}
                className="bg-[#121212] flex gap-2 items-center p-3 rounded-xl border-l-4 shadow-md hover:shadow-lg cursor-pointer hover:scale-105 transition-transform duration-300"
                style={{ borderColor: service.color }}
              >
                <Lottie
                  options={{
                    loop: true,
                    autoplay: true,
                    animationData: service.animation,
                    rendererSettings: {
                      preserveAspectRatio: "xMidYMid slice",
                    },
                  }}
                  height={200}
                  width={200}
                />
                <div>
                  <h3
                    className="text-2xl font-bold mb-2"
                    style={{ color: service.color }}
                  >
                    {service.title}
                  </h3>
                  <p className="text-gray-400">{service.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-24">
          <h2 className="text-3xl font-bold text-[#C0F562] text-center mb-10 uppercase">
            Upcoming Assistants
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {assistants.map((assistant, index) => (
              <div
                key={index}
                className="bg-[#121212] border-dotted border-2 border-[#ffd85c] p-6 rounded-lg relative shadow-md hover:shadow-lg transition"
              >
                <span className="absolute top-4 right-4 bg-[#ffd85c] text-black text-xs font-semibold px-3 py-1 rounded">
                  Coming Soon
                </span>
                <h3 className="text-xl font-bold text-[#38BDF8] mb-2 text-center">
                  {assistant.title}
                </h3>
                <p className="text-gray-400 text-center">
                  {assistant.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
