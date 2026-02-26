import { useEffect, useState } from "react";
import {
  Flame,
  AlertTriangle,
  TrendingUp,
  Database
} from "lucide-react";

import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const API_BASE = "http://127.0.0.1:8000";
const REFRESH_INTERVAL = 30000;

export default function OSNITDashboard() {
  const [summary, setSummary] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [filter, setFilter] = useState(null);

  const [schedulerStatus, setSchedulerStatus] = useState(null);
  const [loadingOp, setLoadingOp] = useState(false);
  const [lastIngestion, setLastIngestion] = useState(null);
  const [lastAI, setLastAI] = useState(null);

  // -----------------------
  // FETCH SUMMARY
  // -----------------------
  const fetchSummary = () => {
    fetch(`${API_BASE}/intelligence/summary`)
      .then(res => res.json())
      .then(data => setSummary(data))
      .catch(err => console.error("Summary error:", err));
  };

  // -----------------------
  // FETCH INCIDENTS
  // -----------------------
  const fetchIncidents = (severity = null) => {
    let url = `${API_BASE}/incidents`;
    if (severity) url += `?severity=${severity}`;

    fetch(url)
      .then(res => res.json())
      .then(data => setIncidents(data))
      .catch(err => console.error("Incident error:", err));
  };

  // -----------------------
  // FETCH SCHEDULER STATUS
  // -----------------------
  const fetchSchedulerStatus = () => {
    fetch(`${API_BASE}/operations/status`)
      .then(res => res.json())
      .then(data => setSchedulerStatus(data.running))
      .catch(err => console.error("Scheduler error:", err));
  };

  // -----------------------
  // RUN INGESTION
  // -----------------------
  const runIngestion = async () => {
    setLoadingOp(true);
    await fetch(`${API_BASE}/operations/run-ingestion`, {
      method: "POST"
    });
    setLastIngestion(new Date().toLocaleTimeString());
    fetchSummary();
    setLoadingOp(false);
  };

  // -----------------------
  // RUN AI
  // -----------------------
  const runAI = async () => {
    setLoadingOp(true);
    await fetch(`${API_BASE}/operations/run-ai`, {
      method: "POST"
    });
    setLastAI(new Date().toLocaleTimeString());
    fetchSummary();
    setLoadingOp(false);
  };

  // -----------------------
  // INITIAL LOAD
  // -----------------------
  useEffect(() => {
    fetchSummary();
    fetchSchedulerStatus();
  }, []);

  // -----------------------
  // AUTO REFRESH
  // -----------------------
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSummary();
      fetchSchedulerStatus();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // -----------------------
  // SEVERITY CLICK
  // -----------------------
  const handleSeverityClick = (severity) => {
    setFilter(severity);
    setActiveTab("explorer");
    fetchIncidents(severity);
  };

  if (!summary) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-white p-10">
        Loading dashboard...
      </div>
    );
  }

  const severityData = [
    { name: "Low", value: summary.severity_breakdown.low },
    { name: "Medium", value: summary.severity_breakdown.medium },
    { name: "High", value: summary.severity_breakdown.high }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white p-6 space-y-6">

      {/* ===================== */}
      {/* TOP CONTROL PANEL */}
      {/* ===================== */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">

        <h1 className="text-2xl font-semibold">
          OSNIT <span className="text-indigo-400">Shield</span>
        </h1>

        <div className="flex items-center gap-4">

          <button
            onClick={runIngestion}
            disabled={loadingOp}
            className="bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-500 disabled:opacity-50"
          >
            Start Ingestion
          </button>

          <button
            onClick={runAI}
            disabled={loadingOp}
            className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-500 disabled:opacity-50"
          >
            Run AI Engine
          </button>

          <div className={`text-sm font-medium ${
            schedulerStatus ? "text-green-400" : "text-red-400"
          }`}>
            Scheduler: {schedulerStatus ? "ACTIVE" : "STOPPED"}
          </div>

          <div className="text-xs text-gray-400">
            Ingestion: {lastIngestion || "-"} | AI: {lastAI || "-"}
          </div>

        </div>
      </div>

      {/* ===================== */}
      {/* OVERVIEW */}
      {/* ===================== */}
      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <KPI
              title="High Incidents"
              value={summary.severity_breakdown.high}
              icon={<Flame />}
              color="red"
              onClick={() => handleSeverityClick("high")}
            />

            <KPI
              title="Active Alerts"
              value={summary.total_alerts}
              icon={<AlertTriangle />}
              color="yellow"
            />

            <KPI
              title="Average Risk"
              value={summary.average_risk_score.toFixed(2)}
              icon={<TrendingUp />}
              color="green"
            />

            <KPI
              title="Total Incidents"
              value={summary.total_incidents}
              icon={<Database />}
              color="blue"
            />
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
            <h2 className="mb-4 text-lg font-semibold">
              Severity Breakdown
            </h2>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={severityData}>
                <CartesianGrid stroke="#1f1f1f" />
                <XAxis dataKey="name" stroke="#888" />
                <YAxis stroke="#888" />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* ===================== */}
      {/* EXPLORER */}
      {/* ===================== */}
      {activeTab === "explorer" && (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">

          <button
            onClick={() => setActiveTab("overview")}
            className="mb-4 text-indigo-400"
          >
            ← Back
          </button>

          <h2 className="mb-4 text-lg font-semibold">
            Incidents ({filter})
          </h2>

          <table className="w-full text-sm">
            <thead className="text-gray-400 border-b border-gray-700">
              <tr>
                <th className="text-left py-2">ID</th>
                <th>Type</th>
                <th>Severity</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map(item => (
                <tr key={item.id} className="border-b border-gray-800">
                  <td className="py-2">{item.id}</td>
                  <td>{item.incident_type}</td>
                  <td>{item.severity}</td>
                  <td className="text-red-400 font-semibold">
                    {item.risk_score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      )}

    </div>
  );
}


// =====================
// KPI CARD COMPONENT
// =====================
function KPI({ title, value, icon, color, onClick }) {
  const colorMap = {
    red: "text-red-400",
    yellow: "text-yellow-400",
    green: "text-green-400",
    blue: "text-blue-400"
  };

  return (
    <div
      onClick={onClick}
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 flex justify-between items-center cursor-pointer hover:scale-[1.02] transition"
    >
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <h3 className="text-2xl font-semibold">{value}</h3>
      </div>
      <div className={`${colorMap[color]} opacity-80`}>
        {icon}
      </div>
    </div>
  );
}
