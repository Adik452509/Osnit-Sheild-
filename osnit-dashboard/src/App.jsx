import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar
} from "recharts";
import IncidentMap from "./components/IncidentMap";

const API = "http://127.0.0.1:8000/intelligence";

function App() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [topThreats, setTopThreats] = useState([]);
  const [mapData, setMapData] = useState([]);

  useEffect(() => {
    axios.get(`${API}/summary`).then(res => setSummary(res.data));
    axios.get(`${API}/trends`).then(res => setTrends(res.data.hourly_trends));
    axios.get(`${API}/alerts`).then(res => setAlerts(res.data.alerts));
    axios.get(`${API}/top-threats`).then(res => setTopThreats(res.data.top_threats));
    axios.get(`${API}/map`).then(res => setMapData(res.data.incidents));
  }, []);

  if (!summary) return <div style={{ padding: 40 }}>Loading Dashboard...</div>;

  const severityData = Object.entries(summary.severity_breakdown).map(
    ([key, value]) => ({ severity: key, count: value })
  );

  return (
    <div
      style={{
        padding: 30,
        fontFamily: "Inter, sans-serif",
        background: "#f5f7fa",
        minHeight: "100vh"
      }}
    >
      <h1 style={{ marginBottom: 30 }}>OSNIT Shield Dashboard</h1>

      {/* KPI CARDS */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <Card title="Total Incidents" value={summary.total_incidents} />
        <Card title="Total Alerts" value={summary.total_alerts} />
        <Card title="Avg Risk Score" value={summary.average_risk_score} />
        <Card title="Incidents (24h)" value={summary.incidents_last_24h} />
      </div>

      {/* SEVERITY CHART */}
      <h2 style={{ marginTop: 50 }}>Severity Breakdown</h2>
      <div style={{ background: "white", padding: 20, borderRadius: 12 }}>
        <BarChart width={500} height={300} data={severityData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="severity" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#6366f1" />
        </BarChart>
      </div>

      {/* TREND CHART */}
      <h2 style={{ marginTop: 50 }}>Hourly Trend (Last 24h)</h2>
      <div style={{ background: "white", padding: 20, borderRadius: 12 }}>
        <LineChart width={700} height={300} data={trends}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="incident_count" stroke="#10b981" />
        </LineChart>
      </div>

      {/* MAP */}
      <h2 style={{ marginTop: 50 }}>Global Incident Map</h2>
      <div style={{ background: "white", padding: 20, borderRadius: 12 }}>
        <IncidentMap incidents={mapData} />
      </div>

      {/* TOP THREATS */}
      <h2 style={{ marginTop: 50 }}>Top Threats</h2>
      <div style={{ background: "white", padding: 20, borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              <th style={tableHeader}>ID</th>
              <th style={tableHeader}>Incident Type</th>
              <th style={tableHeader}>Risk Score</th>
              <th style={tableHeader}>Cluster</th>
            </tr>
          </thead>
          <tbody>
            {topThreats.map(t => (
              <tr key={t.id}>
                <td style={tableCell}>{t.id}</td>
                <td style={tableCell}>{t.incident_type}</td>
                <td style={tableCell}>{t.risk_score}</td>
                <td style={tableCell}>{t.cluster_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ALERTS */}
      <h2 style={{ marginTop: 50 }}>Recent Alerts</h2>
      <div style={{ background: "white", padding: 20, borderRadius: 12 }}>
        <ul>
          {alerts.map(a => (
            <li key={a.id} style={{ marginBottom: 10 }}>
              <strong style={{ color: "#ef4444" }}>
                {a.alert_level}
              </strong>{" "}
              — {a.message}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div
      style={{
        padding: 20,
        background: "white",
        borderRadius: 12,
        boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
        minWidth: 200
      }}
    >
      <h4 style={{ color: "#64748b" }}>{title}</h4>
      <h2>{value}</h2>
    </div>
  );
}

const tableHeader = {
  padding: 10,
  textAlign: "left",
  borderBottom: "1px solid #ddd"
};

const tableCell = {
  padding: 10,
  borderBottom: "1px solid #eee"
};

export default App;
