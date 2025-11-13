import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

import headerImage from "/pics/serviceHeader.jpg";

const Services = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const services = [
    {
      title: "AI Interview",
      description:
        "Simulate real interviews with our AI avatars — practice, learn, and excel.",
      color: "#C0F562",
      path: "/session",
    },
    {
      title: "Skill Training",
      description:
        "Master technical and interpersonal skills through engaging AI-led modules.",
      color: "#38BDF8",
      path: "/skill",
    },
    {
      title: "Resume Generator",
      description:
        "Generate professional resumes instantly, based on your inputs and AI expertise.",
      color: "#ffd85c",
      path: "/resume",
    },
  ];

  const assistants = [
    {
      title: "Startup Assistant",
      description:
        "Fuel your entrepreneurial dreams — plan, validate, and grow smarter with AI guidance.",
    },
    {
      title: "Coding Assistant",
      description:
        "Solve coding problems, debug, and develop faster with your intelligent code partner.",
    },
  ];

  const moveTo = (path) => {
    if (token) {
      navigate(path);
    } else {
      toast.info("Please signup...!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  return (
    <>
      <div className="flex flex-col min-h-screen bg-[#1e1e1e] text-white">
        <ToastContainer />
        <Navbar />
        <div className="w-full h-96 relative overflow-hidden mt-24">
          <img
            src={headerImage}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <h1 className="text-5xl md:text-6xl font-extrabold text-[#C0F562] uppercase tracking-widest text-center">
              Discover AI Services
            </h1>
          </div>
        </div>

        <div className="flex-grow px-6 py-20 max-w-7xl mx-auto">
          {token && (
            <section className="text-center mb-16">
              <h2 className="text-4xl font-extrabold mb-4">
                Ready to <span className="text-[#38BDF8]">Evolve?</span>
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Get started today — upskill yourself, polish your career, and
                prepare for the future.
              </p>
            </section>
          )}
          <section className="text-center mb-20">
            <h2 className="text-4xl font-extrabold text-[#C0F562] mb-6 uppercase">
              Our Core Services
            </h2>
            <p className="text-gray-400 mb-12 max-w-2xl mx-auto">
              Empowering your journey with futuristic AI solutions tailored to
              skills, career growth, and entrepreneurship.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="bg-[#121212] p-8 flex flex-col gap-5 items-center rounded-xl border-l-4 shadow-md cursor-pointer hover:scale-105 transition-transform"
                  style={{ borderColor: service.color }}
                  // onClick={() => moveTo(service.path)}
                >
                  <div className="flex items-center gap-5">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-black font-bold text-xl"
                      style={{ backgroundColor: service.color }}
                    >
                      {service.title.charAt(0)}
                    </div>
                    <h3
                      className="text-2xl font-bold mb-2"
                      style={{ color: service.color }}
                    >
                      {service.title}
                    </h3>
                  </div>
                  <p className="text-gray-400">{service.description}</p>
                </div>
              ))}
            </div>
          </section>
          <section className="mb-24">
            <h2 className="text-3xl font-bold text-[#C0F562] text-center mb-10 uppercase">
              Upcoming Assistants
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assistants.map((assistant, index) => (
                <div
                  key={index}
                  className="bg-[#121212] border-dotted border-2 border-[#ffd85c] p-6 rounded-lg relative shadow hover:shadow-lg transition"
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
          <section className="mb-20">
            <h2 className="text-3xl font-bold text-[#C0F562] text-center mb-10 uppercase">
              How We Work
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              {[
                {
                  step: "01",
                  title: "Skill Mapping",
                  desc: "We assess and recommend the best learning paths.",
                },
                {
                  step: "02",
                  title: "Interactive Training",
                  desc: "Practice with real-time feedback from AI avatars.",
                },
                {
                  step: "03",
                  title: "Analyse",
                  desc: "Get every bit of data, to evaluate your skills through datasets.",
                },
                {
                  step: "04",
                  title: "Track & Improve",
                  desc: "Monitor your progress and sharpen your expertise.",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-[#1e1e1e] p-6 border border-[#38BDF8] rounded-md"
                >
                  <div className="text-[#ffd85c] text-3xl font-bold mb-2">
                    {item.step}
                  </div>
                  <h4 className="text-xl font-semibold text-[#38BDF8] mb-2">
                    {item.title}
                  </h4>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
          {!token && (
            <>
              <section className="text-center">
                <h2 className="text-3xl font-bold text-[#ffd85c] mb-4 uppercase">
                  Unlock Full Potential
                </h2>
                <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                  Sign up now to access personalized trainings, mock interviews,
                  and skill enhancements tailored just for you.
                </p>
                <button
                  onClick={() => navigate("/register")}
                  className="bg-[#38BDF8] text-black font-bold py-4 px-10 uppercase tracking-widest hover:bg-[#C0F562] rounded-md shadow-lg"
                >
                  Create Account
                </button>
              </section>
            </>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Services;
