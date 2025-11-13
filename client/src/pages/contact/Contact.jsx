import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

import contactHeader from "/pics/contactHeader.png";

const Contact = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#1e1e1e] text-white">
      <Navbar />
      <div className="w-full h-96 relative overflow-hidden mt-24">
        <img
          src={contactHeader}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <h1 className="text-5xl font-extrabold text-[#C0F562] uppercase tracking-widest">
            Contact Us
          </h1>
        </div>
      </div>
      <div className="flex-grow px-6 py-20 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold text-[#38BDF8] mb-6">
              Send a Message
            </h2>
            <form className="space-y-6">
              <div>
                <label className="block text-sm mb-1 text-gray-300">Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full p-3 rounded bg-[#2a2a2a] text-white border border-[#444] focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  className="w-full p-3 rounded bg-[#2a2a2a] text-white border border-[#444] focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-300">
                  Message
                </label>
                <textarea
                  rows="5"
                  placeholder="Your message..."
                  className="w-full p-3 rounded bg-[#2a2a2a] text-white border border-[#444] focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                ></textarea>
              </div>
              <button
                type="submit"
                className="bg-[#C0F562] text-black font-semibold px-6 py-3 rounded hover:bg-[#b5e959] transition"
              >
                Send Message
              </button>
            </form>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-[#ffd85c] mb-6">Reach Us</h2>
            <p className="text-gray-400 mb-6">
              Whether you have a question, feedback, or just want to say hello —
              we'd love to hear from you. Use the form or reach us via the info
              below.
            </p>

            <div className="space-y-4 text-gray-300">
              <div>
                <h4 className="font-semibold text-[#38BDF8]">Email</h4>
                <p>support@aiplatform.com</p>
              </div>
              <div>
                <h4 className="font-semibold text-[#38BDF8]">Phone</h4>
                <p>+1 (800) 123-4567</p>
              </div>
              <div>
                <h4 className="font-semibold text-[#38BDF8]">Address</h4>
                <p>
                  123 AI Avenue
                  <br />
                  Silicon City, CA 94016
                  <br />
                  USA
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
