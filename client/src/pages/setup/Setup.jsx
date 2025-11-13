import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Setup = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [step, setStep] = useState(1);
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const videoRef = useRef(null);

  // You can easily enable Step 2 by uncommenting the second object
  const stepLabels = [
    {
      id: 1,
      name: "Upload Resume",
    },
    // To enable Step 2, uncomment the block below:
    // {
    //   id: 2,
    //   name: "Setup Devices",
    // },
  ];

  const startSession = async () => {
    if (!pdfFile) return null;

    setIsStartingSession(true);

    localStorage.removeItem("session_id");

    const formData = new FormData();
    formData.append("pdf", pdfFile);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API}/interview/start`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      if (response.data?.session_id) {
        localStorage.setItem("session_id", response.data.session_id);
        return response.data.session_id;
      } else {
        throw new Error("No session_id received from server");
      }
    } catch (error) {
      console.error("Session start failed:", error);
      // You might want to show an error message to the user here
      throw error;
    } finally {
      setIsStartingSession(false);
    }
  };

  const nextStep = async () => {
    // Check if the current step is the LAST step defined in stepLabels
    if (step === stepLabels.length && pdfFile) {
      try {
        const sessionId = await startSession();

        if (sessionId) {
          navigate(`/stage?&session_id=${sessionId}`);
        } else {
          console.error("Failed to create new session.");
        }
      } catch (error) {
        console.error("Failed to start session:", error);
      }
    } else {
      // If not the last step, move to the next step
      setStep((prev) => (prev < stepLabels.length ? prev + 1 : prev));
    }
  };

  const prevStep = () => setStep((prev) => (prev > 1 ? prev - 1 : prev));

  const handlePdfUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
      setPdfPreview(URL.createObjectURL(file));
    }
  };

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setWebcamEnabled(true);
      setMicEnabled(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing devices:", error);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#1e1e1e] flex flex-col items-center justify-center p-6 text-white">
      <div className="flex space-x-4 mb-10">
        {stepLabels.map((item) => (
          <div
            key={item.id}
            className={`flex flex-col items-center cursor-pointer transition ${
              step === item.id ? "text-[#C0F562]" : "text-gray-400"
            }`}
          >
            <div
              className={`w-12 h-12 flex items-center justify-center rounded-full border-4 text-lg font-bold mb-2 transition ${
                step === item.id
                  ? "border-[#C0F562] bg-[#1e1e1e]"
                  : "border-gray-600 bg-[#2c2c2c]"
              }`}
            >
              {item.id}
            </div>
            <span className="text-sm font-medium">{item.name}</span>
          </div>
        ))}
      </div>
      <div className="w-full max-w-3xl border border-gray-700 p-10 bg-[#2b2b2b] rounded-none flex flex-col gap-8">
        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold text-[#FFD85C] text-center">
              Upload and Preview PDF
            </h2>
            {!pdfPreview && (
              <div
                className="flex flex-col items-center gap-3 border-2 border-dashed border-gray-600 p-8 w-full cursor-pointer hover:border-[#FFD85C] rounded-none"
                onClick={() => document.getElementById("pdfInput").click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handlePdfUpload({ target: { files: e.dataTransfer.files } });
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-gray-400 size-16"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M12 2l.117 .007a1 1 0 0 1 .876 .876l.007 .117v4l.005 .15a2 2 0 0 0 1.838 1.844l.157 .006h4l.117 .007a1 1 0 0 1 .876 .876l.007 .117v9a3 3 0 0 1 -2.824 2.995l-.176 .005h-10a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-14a3 3 0 0 1 2.824 -2.995l.176 -.005zm0 9l-.09 .004l-.058 .007l-.118 .025l-.105 .035l-.113 .054l-.111 .071a1 1 0 0 0 -.112 .097l-2.5 2.5a1 1 0 0 0 0 1.414l.094 .083a1 1 0 0 0 1.32 -.083l.793 -.793v3.586a1 1 0 0 0 2 0v-3.585l.793 .792a1 1 0 0 0 1.414 -1.414l-2.5 -2.5l-.082 -.073l-.104 -.074l-.098 -.052l-.11 -.044l-.112 -.03l-.126 -.017z" />
                  <path d="M19 7h-4l-.001 -4.001z" />
                </svg>
                <p className="text-gray-400">
                  Drag & Drop or Click to Upload PDF
                </p>
                <input
                  id="pdfInput"
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                />
              </div>
            )}

            {pdfPreview && (
              <iframe
                src={pdfPreview}
                className="w-full h-96 border border-gray-700 mt-6"
                title="PDF Preview"
              />
            )}

            <div className="flex gap-4 mt-6">
              <button
                onClick={prevStep}
                className="w-full py-4 bg-gray-700 hover:bg-gray-600 rounded-none transition"
                disabled={step === 1}
              >
                Previous
              </button>
              <button
                onClick={nextStep}
                disabled={!pdfFile || isStartingSession}
                className="w-full py-4 bg-[#FFD85C] hover:bg-[#f5c53d] text-black font-semibold rounded-none transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {/* Dynamically adjust button text */}
                {stepLabels.length > 1
                  ? "Next"
                  : isStartingSession
                  ? "Starting Interview..."
                  : "Start Interview"}
              </button>
            </div>
          </>
        )}

        {/* This block is still present but will only show if stepLabels has more than 1 item */}
        {step === 2 && (
          <>
            <h2 className="text-2xl font-bold text-[#FFD85C] text-center">
              Webcam & Microphone Setup
            </h2>
            <video
              ref={videoRef}
              autoPlay
              muted
              className="w-72 h-48 bg-gray-700 mx-auto mb-6"
            />
            <button
              onClick={requestPermissions}
              disabled={isStartingSession}
              className="w-full py-4 bg-[#C0F562] hover:bg-[#a8e651] font-semibold text-black rounded-none mb-4 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Enable Webcam & Microphone
            </button>
            <button
              onClick={nextStep}
              disabled={!webcamEnabled || !micEnabled || isStartingSession}
              className="w-full py-4 bg-[#FFD85C] hover:bg-[#f5c53d] font-semibold text-black rounded-none transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStartingSession ? "Starting Interview..." : "Start Interview"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Setup;
