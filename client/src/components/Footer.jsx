const Footer = () => {
  return (
    <footer className="flex justify-between items-center mt-auto bg-[#1e1e1e] text-gray-400 py-6 px-10 border-t border-[#2a2a2a]">
      <p className="text-sm">
        &copy; {new Date().getFullYear()} hAI-Buddy. All Rights Reserved.
      </p>
    </footer>
  );
};

export default Footer;
