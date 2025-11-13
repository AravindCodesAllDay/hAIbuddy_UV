import { Link } from "react-router-dom";
import Lottie from "react-lottie";

import communication from "../../assets/voicemail.json";
import pcAnimation from "../../assets/pc_coding.json";

const SkillsDashboard = () => {
  const skillCards = [
    {
      to: "/interpersonal",
      title: "Interpersonal Skills",
      animation: communication,
      colorClass: "text-[#C0F562]",
    },
    {
      to: "/technical",
      title: "Technical Skills",
      animation: pcAnimation,
      colorClass: "text-[#ffd85c]",
    },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#1e1e1e] p-6 text-white">
      <h1 className="text-4xl font-extrabold mb-16 text-[#C0F562] text-center tracking-wide">
        Skill Training
      </h1>

      <div className="flex flex-col md:flex-row gap-12 max-w-4xl w-full justify-center">
        {skillCards.map((card) => (
          <Link
            key={card.to}
            // to={card.to}
            className="flex flex-col items-center p-6 rounded-xl shadow-2xl bg-[#282828] hover:bg-[#333333] transition duration-500 transform hover:scale-[1.03] w-full md:w-1/2 cursor-pointer border-4 border-transparent hover:border-white/20"
          >
            <div className="mb-6">
              <Lottie
                options={{
                  loop: true,
                  autoplay: true,
                  animationData: card.animation,
                  rendererSettings: {
                    preserveAspectRatio: "xMidYMid slice",
                  },
                }}
                height={300}
                width={300}
              />
            </div>
            <h2 className={`text-2xl font-bold ${card.colorClass} text-center`}>
              {card.title}
            </h2>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SkillsDashboard;
