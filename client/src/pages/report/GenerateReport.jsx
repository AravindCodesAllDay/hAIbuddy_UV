import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function GenerateReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const sessionId = new URLSearchParams(window.location.search).get(
    "session_id"
  );

  useEffect(() => {
    const fetchReport = async () => {
      if (!sessionId || !token) {
        setError("Session ID or authentication token is missing.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API}/interview/get_report/${sessionId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            withCredentials: true,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to fetch report.");
        }

        const data = await response.json();
        setReport(data);
      } catch (err) {
        console.error("Error fetching report:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [sessionId, token]); // Re-run effect if sessionId or token changes

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-white">Loading report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-red-400">Error: {error}</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl text-blue-500">
          No report found for this session.
        </p>
      </div>
    );
  }

  return (
    <div className="font-sans max-w-4xl mx-auto mb-8 mt-24  p-8 rounded-xl shadow-2xl bg-white/20 text-gray-800 leading-relaxed">
      <button
        className="absolute top-28 right-16 text-white bg-green-400/70 hover:bg-green-600/70 py-1.5 px-2 rounded"
        onClick={() => navigate("/dashboard")}
      >
        Return to Dashboard
      </button>
      <h1 className="text-3xl font-extrabold text-center text-blue-500 mb-6 pb-4 border-b-2 border-gray-200">
        Interview Performance Report
      </h1>
      <p className="text-sm text-white/75 text-right mb-4">
        Generated On: {new Date(report.timestamp).toLocaleString()}
      </p>

      {report.summary && (
        <div className="mb-8 p-6 bg-blue-50 rounded-lg border-l-4 border-blue-500 shadow-sm">
          <h2 className="text-2xl font-semibold text-blue-700 mb-3 border-b border-blue-200 pb-2">
            Summary
          </h2>
          <p className="text-gray-700">{report.summary}</p>
        </div>
      )}

      <div className="flex justify-center mb-8">
        <div className="bg-green-500 text-white p-6 rounded-lg text-center shadow-lg transform hover:scale-105 transition-transform duration-300">
          <h3 className="text-lg font-medium">Overall Score</h3>
          <p className="text-6xl font-bold mt-2">
            {report.overall_score ? report.overall_score.toFixed(1) : "N/A"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b border-gray-200 pb-2">
            Key Metrics
          </h2>
          <ul className="list-none p-0 m-0 space-y-2">
            <li>
              <strong className="text-gray-900">Clarity:</strong>{" "}
              {report.clarity_score ? report.clarity_score.toFixed(1) : "N/A"}
            </li>
            <li>
              <strong className="text-gray-900">Relevance:</strong>{" "}
              {report.relevance_score
                ? report.relevance_score.toFixed(1)
                : "N/A"}
            </li>
            <li>
              <strong className="text-gray-900">Coherence:</strong>{" "}
              {report.coherence_score
                ? report.coherence_score.toFixed(1)
                : "N/A"}
            </li>
            <li>
              <strong className="text-gray-900">Engagement:</strong>{" "}
              {report.engagement_score
                ? report.engagement_score.toFixed(1)
                : "N/A"}
            </li>
            <li>
              <strong className="text-gray-900">Total User Messages:</strong>{" "}
              {report.total_user_messages ?? "N/A"}
            </li>
            <li>
              <strong className="text-gray-900">Avg. Response Time:</strong>{" "}
              {report.average_response_time_sec
                ? `${report.average_response_time_sec.toFixed(2)} sec`
                : "N/A"}
            </li>
            <li>
              <strong className="text-gray-900">
                Avg. Words per Response:
              </strong>{" "}
              {report.avg_words_per_response
                ? report.avg_words_per_response.toFixed(2)
                : "N/A"}
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b border-gray-200 pb-2">
            Strengths
          </h2>
          {report.strengths && report.strengths.length > 0 ? (
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {report.strengths.map((strength, index) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No specific strengths identified.</p>
          )}
        </div>

        <div className="bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b border-gray-200 pb-2">
            Weaknesses
          </h2>
          {report.weaknesses && report.weaknesses.length > 0 ? (
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              {report.weaknesses.map((weakness, index) => (
                <li key={index}>{weakness}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">No specific weaknesses identified.</p>
          )}
        </div>
      </div>
    </div>
  );
}
