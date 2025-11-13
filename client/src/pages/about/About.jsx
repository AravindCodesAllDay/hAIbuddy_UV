import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

import aboutHeader from "/pics/aboutHeader.png";

const About = () => {
  return (
    <>
      <Navbar />
      <div className="flex flex-col min-h-screen bg-[#101010] text-white font-sans mt-24">
        <div className="relative h-96 w-full overflow-hidden">
          <img
            src={aboutHeader}
            className="absolute w-full h-full object-cover brightness-50"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-6xl font-extrabold text-[#C0F562] tracking-widest drop-shadow-lg">
              About Us
            </h1>
          </div>
        </div>

        <section className="py-20 px-6 md:px-20 bg-[#121212] text-center">
          <h2 className="text-4xl font-bold text-[#38BDF8] mb-6">Who We Are</h2>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
            We are a collective of educators, developers, and innovators
            committed to transforming professional growth through intelligent,
            human-centric tools.
          </p>
        </section>

        <section className="py-24 px-6 md:px-20 bg-[#121212]">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="bg-[#222] p-8 rounded-lg shadow-md border border-[#38BDF8]">
              <h3 className="text-3xl font-semibold text-[#C0F562] mb-4">
                Our Mission
              </h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                We democratize skill development through AI-driven simulations,
                empowering everyone to build soft and technical capabilities.
              </p>
            </div>
            <div className="bg-[#222] p-8 rounded-lg shadow-md border border-[#C0F562]">
              <h3 className="text-3xl font-semibold text-[#38BDF8] mb-4">
                Our Vision
              </h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                To be the global standard for immersive career development tools
                — accessible, adaptive, and impactful.
              </p>
            </div>
          </div>
        </section>

        <section className="py-24 bg-[#121212] px-6 md:px-20">
          <h3 className="text-4xl font-bold text-center text-white mb-16">
            What Drives Us
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
            {[
              {
                icon: "🚀",
                title: "Innovation",
                desc: "Always evolving with tech and user needs.",
              },
              {
                icon: "🌍",
                title: "Accessibility",
                desc: "Upskilling that reaches across the globe.",
              },
              {
                icon: "💡",
                title: "Creativity",
                desc: "We build with boldness and imagination.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-[#121212] p-8 rounded-xl border border-[#38BDF8] hover:shadow-xl transition"
              >
                <div className="text-5xl mb-4">{item.icon}</div>
                <h4 className="text-xl font-semibold text-[#ffd85c] mb-2">
                  {item.title}
                </h4>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default About;
