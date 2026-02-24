import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, ResponsiveContainer, Legend, Area, AreaChart
} from "recharts";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const INTEL = "http://127.0.0.1:8000/intelligence";
const INC   = "http://127.0.0.1:8000/incidents";
const OPS   = "http://127.0.0.1:8000/operations";

const TABS = ["Overview", "Intelligence", "Map", "Explorer", "Operations"];

const SEV_COLOR = {
  critical: "#ff2d55",
  high: "#ff6b35",
  medium: "#ffd60a",
  low: "#30d158",
};

const CAT_COLORS = ["#6366f1","#8b5cf6","#ec4899","#f97316","#eab308","#22c55e","#14b8a6","#3b82f6"];

const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#0d1117", border:"1px solid #30363d", borderRadius:8, padding:"10px 14px" }}>
      <div style={{ color:"#8b949e", fontSize:11, marginBottom:4 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color, fontSize:13, fontWeight:700 }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

function MetricCard({ icon, label, value, color, trend }) {
  return (
    <div style={{
      flex:1, minWidth:160,
      background:"#0d1117", border:"1px solid " + color + "44", borderRadius:10,
      padding:"18px 20px", position:"relative", overflow:"hidden", transition:"transform 0.15s"
    }}>
      <div style={{ position:"absolute", top:0, right:0, width:90, height:90, background:color+"18", borderRadius:"0 10px 0 90px" }} />
      <div style={{ fontSize:22, marginBottom:6 }}>{icon}</div>
      <div style={{ color:"#6e7681", fontSize:11, textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>{label}</div>
      <div style={{ fontFamily:"monospace", fontSize:38, fontWeight:800, lineHeight:1, color:color }}>
        {value !== undefined ? value : 0}
      </div>
      {trend && <div style={{ color:"#484f58", fontSize:11, marginTop:4 }}>{trend}</div>}
    </div>
  );
}

function SevBadge({ level }) {
  const c = SEV_COLOR[level?.toLowerCase()] || "#8b949e";
  return (
    <span style={{ background:c+"22", color:c, border:"1px solid "+c+"44", padding:"2px 8px", borderRadius:4, fontSize:10, fontWeight:800, letterSpacing:1, textTransform:"uppercase" }}>
      {level || "unknown"}
    </span>
  );
}

function Panel({ title, dot, children, style }) {
  dot = dot || "#6366f1";
  style = style || {};
  return (
    <div style={{ background:"#0d1117", border:"1px solid #21262d", borderRadius:10, padding:"16px 18px", ...style }}>
      {title && (
        <div style={{ display:"flex", alignItems:"center", gap:8, fontFamily:"monospace", fontSize:11, fontWeight:700, letterSpacing:1.5, color:"#6e7681", textTransform:"uppercase", marginBottom:14 }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:dot, flexShrink:0 }} />
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

function AlertBanner({ spikes }) {
  if (!spikes || !spikes.length) return null;
  const msg = spikes.map(s => (s.incident_type || "").replace(/_/g," ").toUpperCase() + " (+" + Math.round(s.growth_rate*100) + "%)").join(" | ");
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:12,
      background:"#7f1d1d", border:"1px solid #ff2d5550",
      borderRadius:8, padding:"10px 18px", marginBottom:20
    }}>
      <span style={{ fontSize:16 }}>!</span>
      <span style={{ color:"#fca5a5", fontWeight:700, fontSize:12, flex:1 }}>
        ALERT: SPIKE DETECTED -- {msg}
      </span>
      <span style={{ color:"#f87171", fontWeight:700, fontSize:18 }}>{">>>"}</span>
    </div>
  );
}

function TopThreats({ threats }) {
  return (
    <Panel title="Top Threats" dot="#ff2d55">
      <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
        <thead>
          <tr>
            {["ID","Type","Risk Score","Cluster"].map(h => (
              <th key={h} style={{ padding:"8px 10px", color:"#484f58", fontSize:10, textAlign:"left", letterSpacing:1, textTransform:"uppercase", borderBottom:"1px solid #21262d" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {threats && threats.slice(0,8).map((t,i) => {
            const score = t.risk_score ? Math.round(t.risk_score*30) : null;
            const sc = score > 75 ? "#ff2d55" : score > 50 ? "#ff6b35" : "#ffd60a";
            return (
              <tr key={t.id} style={{ background: i%2===0 ? "#0d111750":"transparent" }}>
                <td style={{ padding:"8px 10px", color:"#484f58" }}>#{t.id}</td>
                <td style={{ padding:"8px 10px", color:"#e6edf3" }}>{(t.incident_type || "").replace(/_/g," ") || "--"}</td>
                <td style={{ padding:"8px 10px" }}>
                  <span style={{ color:sc, fontWeight:800, fontFamily:"monospace", fontSize:14 }}>{score || "--"}</span>
                </td>
                <td style={{ padding:"8px 10px" }}>
                  {t.cluster_id != null
                    ? <span style={{ color:"#6366f1", background:"#6366f120", padding:"2px 6px", borderRadius:4, fontSize:11 }}>C{t.cluster_id}</span>
                    : <span style={{ color:"#484f58" }}>--</span>}
                </td>
              </tr>
            );
          })}
          {(!threats || !threats.length) && (
            <tr><td colSpan={4} style={{ color:"#484f58", textAlign:"center", padding:24 }}>No threat data yet</td></tr>
          )}
        </tbody>
      </table>
    </Panel>
  );
}

function AlertsList({ alerts }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {alerts && alerts.slice(0,6).map((a,i) => (
        <div key={i} style={{
          display:"flex", alignItems:"flex-start", gap:10, padding:"10px 12px",
          background:"#161b22", borderLeft:"3px solid " + (SEV_COLOR[a.alert_level?.toLowerCase()] || "#30363d"),
          borderRadius:"0 6px 6px 0"
        }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:SEV_COLOR[a.alert_level?.toLowerCase()]||"#8b949e", marginTop:3, flexShrink:0 }} />
          <div>
            <span style={{ color:SEV_COLOR[a.alert_level?.toLowerCase()]||"#8b949e", fontSize:10, fontWeight:800, letterSpacing:1, marginRight:8 }}>{(a.alert_level||"").toUpperCase()}</span>
            <span style={{ color:"#8b949e", fontSize:13 }}>{a.message}</span>
          </div>
        </div>
      ))}
      {(!alerts || !alerts.length) && <div style={{ color:"#484f58", fontSize:13, padding:"10px 0" }}>No active alerts</div>}
    </div>
  );
}

function WorldMap({ incidents, height }) {
  height = height || 420;
  const geo = (incidents || []).filter(i => i.latitude && i.longitude);
  return (
    <div style={{ height:height, borderRadius:10, overflow:"hidden", border:"1px solid #21262d" }}>
      <MapContainer center={[20,10]} zoom={2} style={{ height:"100%", width:"100%" }} scrollWheelZoom={true}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_matter_no_labels/{z}/{x}/{y}{r}.png" attribution="CartoDB" />
        {geo.map(inc => {
          const color = SEV_COLOR[inc.severity?.toLowerCase()] || "#ff6b35";
          const score = inc.risk_score ? Math.round(inc.risk_score*30) : 50;
          const radius = Math.max(6, Math.min(18, score/6));
          return (
            <CircleMarker key={inc.id} center={[inc.latitude, inc.longitude]} radius={radius}
              pathOptions={{ color:color, fillColor:color, fillOpacity:0.75, weight:1.5 }}>
              <Popup>
                <div style={{ fontFamily:"monospace", minWidth:150 }}>
                  <div style={{ fontWeight:700, textTransform:"uppercase", fontSize:12, marginBottom:4 }}>{(inc.incident_type||"").replace(/_/g," ")}</div>
                  <div style={{ fontSize:11 }}>Risk: <b>{score}</b></div>
                  <div style={{ fontSize:11 }}>Cluster: <b>{inc.cluster_id != null ? inc.cluster_id : "--"}</b></div>
                  <div style={{ fontSize:11 }}>Source: <b>{inc.source}</b></div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

function IncidentFeed({ incidents }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {incidents && incidents.map(inc => (
        <div key={inc.id} style={{
          background:"#0d1117", border:"1px solid #21262d",
          borderLeft:"4px solid " + (SEV_COLOR[inc.severity?.toLowerCase()]||"#30363d"),
          borderRadius:"0 8px 8px 0", padding:"14px 16px"
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8, flexWrap:"wrap" }}>
            <SevBadge level={inc.severity} />
            <span style={{ color:"#6366f1", fontSize:12 }}>{(inc.incident_type||"unclassified").replace(/_/g," ")}</span>
            <span style={{ color:"#484f58", fontSize:11 }}>{inc.source}</span>
            <span style={{ color:"#30363d", fontSize:11, marginLeft:"auto" }}>{inc.collected_at ? new Date(inc.collected_at).toLocaleString() : ""}</span>
          </div>
          <p style={{ color:"#8b949e", fontSize:13, margin:0, lineHeight:1.6 }}>{inc.content}</p>
          {inc.url && <a href={inc.url} target="_blank" rel="noreferrer" style={{ color:"#6366f1", fontSize:12, marginTop:6, display:"inline-block", textDecoration:"none" }}>View source</a>}
        </div>
      ))}
      {(!incidents || !incidents.length) && <div style={{ color:"#484f58", textAlign:"center", padding:40 }}>No incidents loaded</div>}
    </div>
  );
}

function OperationsPanel({ schedulerStatus }) {
  const [ingRunning, setIngRunning] = useState(false);
  const [aiRunning, setAiRunning] = useState(false);
  const [log, setLog] = useState([{ msg:"system ready", type:"info", time:new Date().toLocaleTimeString() }]);

  const addLog = (msg, type) => {
    setLog(prev => [...prev.slice(-19), { msg:msg, type:type||"info", time:new Date().toLocaleTimeString() }]);
  };

  const runIngestion = async () => {
    setIngRunning(true);
    addLog("Starting ingestion...", "info");
    try {
      await axios.post(OPS + "/run-ingestion");
      addLog("Ingestion completed", "success");
    } catch(e) {
      addLog("Ingestion failed -- check backend", "error");
    }
    setIngRunning(false);
  };

  const runAI = async () => {
    setAiRunning(true);
    addLog("Running AI pipeline...", "info");
    try {
      await axios.post(OPS + "/run-ai");
      addLog("AI processing completed", "success");
    } catch(e) {
      addLog("AI pipeline failed -- check backend", "error");
    }
    setAiRunning(false);
  };

  return (
    <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
      <Panel title="Controls" dot="#30d158" style={{ flex:1, minWidth:260 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <button onClick={runIngestion} disabled={ingRunning} style={{
            padding:"10px 16px", borderRadius:8, cursor:ingRunning?"not-allowed":"pointer",
            background:ingRunning?"#21262d":"#0a84ff18", color:ingRunning?"#6e7681":"#0a84ff",
            border:"1px solid " + (ingRunning?"#30363d":"#0a84ff44"),
            fontFamily:"monospace", fontSize:12, fontWeight:700, textAlign:"left"
          }}>{ingRunning ? "Running..." : "Run Ingestion"}</button>
          <button onClick={runAI} disabled={aiRunning} style={{
            padding:"10px 16px", borderRadius:8, cursor:aiRunning?"not-allowed":"pointer",
            background:aiRunning?"#21262d":"#6366f118", color:aiRunning?"#6e7681":"#6366f1",
            border:"1px solid " + (aiRunning?"#30363d":"#6366f144"),
            fontFamily:"monospace", fontSize:12, fontWeight:700, textAlign:"left"
          }}>{aiRunning ? "Processing..." : "Run AI Analysis"}</button>
          <div style={{ padding:"12px 14px", background:"#161b22", borderRadius:8, border:"1px solid #21262d", marginTop:4 }}>
            <div style={{ color:"#484f58", fontSize:10, letterSpacing:1, textTransform:"uppercase", marginBottom:6 }}>Scheduler Status</div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ width:8, height:8, borderRadius:"50%", background:schedulerStatus?.running?"#30d158":"#ff2d55" }} />
              <span style={{ color:schedulerStatus?.running?"#30d158":"#ff2d55", fontWeight:700, fontSize:13, fontFamily:"monospace" }}>
                {schedulerStatus?.running ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
          </div>
        </div>
      </Panel>
      <Panel title="System Log" dot="#ffd60a" style={{ flex:2, minWidth:300 }}>
        <div style={{ background:"#161b22", borderRadius:8, padding:12, fontFamily:"monospace", fontSize:12, height:200, overflowY:"auto", border:"1px solid #21262d" }}>
          {log.map((l,i) => (
            <div key={i} style={{ color:l.type==="success"?"#30d158":l.type==="error"?"#ff2d55":"#8b949e", marginBottom:4 }}>
              [{l.time}] {l.msg}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("Overview");
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [threats, setThreats] = useState([]);
  const [mapData, setMapData] = useState([]);
  const [spikes, setSpikes] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [schedulerStatus, setSchedulerStatus] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const r = await Promise.allSettled([
      axios.get(INTEL + "/summary"),
      axios.get(INTEL + "/trends"),
      axios.get(INTEL + "/alerts"),
      axios.get(INTEL + "/top-threats"),
      axios.get(INC + "/map"),
      axios.get(INTEL + "/spikes"),
      axios.get(INC + "/?limit=30"),
      axios.get(OPS + "/status"),
    ]);
    const d = i => r[i].status === "fulfilled" ? r[i].value.data : null;
    if (d(0)) setSummary(d(0));
    if (d(1)) setTrends(d(1).hourly_trends || []);
    if (d(2)) setAlerts(d(2).alerts || []);
    if (d(3)) setThreats(d(3).top_threats || []);
    if (d(4)) setMapData(d(4).incidents || []);
    if (d(5)) setSpikes(d(5).spikes || []);
    if (d(6)) setIncidents(d(6) || []);
    if (d(7)) setSchedulerStatus(d(7));
    setLastUpdate(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 30000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const trendData = trends.map(t => ({
    time: t.hour ? new Date(t.hour).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : "",
    total: t.incident_count,
    high: Math.round((t.incident_count||0)*0.38),
  }));

  const sevData = summary && summary.severity_breakdown
    ? Object.entries(summary.severity_breakdown).map(([k,v]) => ({ name:k, count:v }))
    : [];

  const catData = summary && summary.top_incident_types
    ? summary.top_incident_types.map((t,i) => ({
        name: (t.incident_type||"other").replace(/_/g," "),
        count: t.count,
        fill: CAT_COLORS[i % CAT_COLORS.length]
      }))
    : [];

  const isActive = schedulerStatus && schedulerStatus.running;

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:"#010409", flexDirection:"column", gap:16 }}>
      <div style={{ width:36, height:36, border:"3px solid #21262d", borderTopColor:"#6366f1", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      <div style={{ color:"#6e7681", fontFamily:"monospace", letterSpacing:2, fontSize:12 }}>LOADING OSNIT SHIELD...</div>
      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#010409", color:"#e6edf3", fontFamily:"sans-serif", fontSize:14 }}>

      <header style={{ display:"flex", alignItems:"center", gap:16, padding:"0 24px", height:56, background:"#0d1117", borderBottom:"1px solid #21262d", position:"sticky", top:0, zIndex:200, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:22 }}>Shield</span>
          <span style={{ fontFamily:"monospace", fontSize:16, letterSpacing:1 }}>
            OSNIT <strong style={{ color:"#6366f1" }}>Shield</strong>
          </span>
        </div>
        <div style={{ display:"flex", gap:8, marginLeft:8 }}>
          <button onClick={fetchAll} style={{ padding:"6px 14px", borderRadius:6, cursor:"pointer", background:"#0a84ff18", color:"#0a84ff", border:"1px solid #0a84ff44", fontFamily:"monospace", fontSize:11, fontWeight:700 }}>START INGESTION</button>
          <button onClick={fetchAll} style={{ padding:"6px 14px", borderRadius:6, cursor:"pointer", background:"#30d15818", color:"#30d158", border:"1px solid #30d15844", fontFamily:"monospace", fontSize:11, fontWeight:700 }}>RUN AI ANALYSIS</button>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:8 }}>
          <span style={{ width:8, height:8, borderRadius:"50%", background:isActive?"#30d158":"#ff2d55" }} />
          <span style={{ color:"#8b949e", fontSize:12 }}>Scheduler: <strong style={{ color:isActive?"#30d158":"#ff2d55" }}>{isActive?"ACTIVE":"INACTIVE"}</strong></span>
        </div>
        <div style={{ color:"#484f58", fontSize:12, marginLeft:"auto" }}>Last Update: {lastUpdate ? lastUpdate.toLocaleTimeString() : "--"}</div>
      </header>

      <nav style={{ display:"flex", background:"#0d1117", borderBottom:"1px solid #21262d", padding:"0 24px" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background:"transparent", border:"none",
            borderBottom: tab===t ? "2px solid #6366f1":"2px solid transparent",
            color: tab===t ? "#e6edf3":"#6e7681",
            padding:"12px 18px", cursor:"pointer", fontFamily:"sans-serif", fontSize:13,
            fontWeight: tab===t ? 700:400
          }}>{t}</button>
        ))}
      </nav>

      <div style={{ padding:24, maxWidth:1600, margin:"0 auto" }}>

        <AlertBanner spikes={spikes} />

        {tab === "Overview" && (
          <div>
            <div style={{ display:"flex", gap:14, marginBottom:18, flexWrap:"wrap" }}>
              <MetricCard icon="Fire" label="High Incidents" value={summary && summary.severity_breakdown ? (summary.severity_breakdown.high||0) : 0} color="#ff2d55" trend={"Critical: " + (summary && summary.severity_breakdown ? (summary.severity_breakdown.critical||0) : 0)} />
              <MetricCard icon="!" label="Active Alerts" value={summary ? (summary.total_alerts||0) : 0} color="#ffd60a" trend="last 24h" />
              <MetricCard icon="^" label="Avg Risk Score" value={summary && summary.average_risk_score ? Math.round(summary.average_risk_score*30) : 0} color="#30d158" trend="0-100" />
              <MetricCard icon="DB" label="Total Records (24h)" value={summary ? (summary.incidents_last_24h||0) : 0} color="#0a84ff" trend={"Total: " + (summary ? (summary.total_incidents||0) : 0)} />
            </div>

            <div style={{ display:"flex", gap:16, marginBottom:18, flexWrap:"wrap" }}>
              <Panel title="Incident Trend (Last 24 Hours)" dot="#30d158" style={{ flex:2, minWidth:300 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#30d158" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#30d158" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gH" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ff6b35" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                    <XAxis dataKey="time" tick={{ fill:"#484f58", fontSize:10 }} />
                    <YAxis tick={{ fill:"#484f58", fontSize:10 }} />
                    <Tooltip content={<DarkTooltip />} />
                    <Legend wrapperStyle={{ fontSize:11, color:"#8b949e" }} />
                    <Area type="monotone" dataKey="total" stroke="#30d158" fill="url(#gT)" strokeWidth={2} dot={{ r:3 }} name="Total Incidents" />
                    <Area type="monotone" dataKey="high" stroke="#ff6b35" fill="url(#gH)" strokeWidth={2} dot={{ r:3 }} name="High Severity" />
                  </AreaChart>
                </ResponsiveContainer>
              </Panel>
              <Panel title="Severity Breakdown" dot="#ff2d55" style={{ flex:1, minWidth:240 }}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sevData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                    <XAxis dataKey="name" tick={{ fill:"#484f58", fontSize:11 }} />
                    <YAxis tick={{ fill:"#484f58", fontSize:11 }} />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar dataKey="count" name="Count" radius={[5,5,0,0]} fill="#ff6b35" />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </div>

            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              <div style={{ flex:2, minWidth:300 }}>
                <Panel title="Global Incident Map" dot="#0a84ff" style={{ padding:0, overflow:"hidden" }}>
                  <WorldMap incidents={mapData} height={340} />
                  <div style={{ padding:"14px 18px", borderTop:"1px solid #21262d" }}>
                    <div style={{ fontFamily:"monospace", fontSize:11, fontWeight:700, letterSpacing:1.5, color:"#6e7681", textTransform:"uppercase", marginBottom:10 }}>Recent Alerts</div>
                    <AlertsList alerts={alerts} />
                  </div>
                </Panel>
              </div>
              <div style={{ flex:1, minWidth:260 }}>
                <TopThreats threats={threats} />
              </div>
            </div>
          </div>
        )}

        {tab === "Intelligence" && (
          <div>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:18 }}>
              <div style={{ flex:1, minWidth:300 }}><TopThreats threats={threats} /></div>
              <Panel title="Incident Categories" dot="#6366f1" style={{ flex:1, minWidth:300 }}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={catData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" horizontal={false} />
                    <XAxis type="number" tick={{ fill:"#484f58", fontSize:10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill:"#8b949e", fontSize:11 }} width={110} />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar dataKey="count" name="Count" radius={[0,5,5,0]} fill="#6366f1" />
                  </BarChart>
                </ResponsiveContainer>
              </Panel>
            </div>
            <Panel title="Active Alerts" dot="#ffd60a">
              <AlertsList alerts={alerts} />
            </Panel>
          </div>
        )}

        {tab === "Map" && (
          <div>
            <Panel title="Global Incident Map" dot="#0a84ff" style={{ padding:0, overflow:"hidden", marginBottom:16 }}>
              <WorldMap incidents={mapData} height={560} />
            </Panel>
            <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
              <Panel title="Map Legend" dot="#6e7681" style={{ flex:1 }}>
                <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"center" }}>
                  {Object.entries(SEV_COLOR).map(([k,v]) => (
                    <div key={k} style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ width:12, height:12, borderRadius:"50%", background:v, display:"inline-block" }} />
                      <span style={{ color:"#8b949e", fontSize:12, textTransform:"capitalize" }}>{k}</span>
                    </div>
                  ))}
                </div>
              </Panel>
              <Panel title="Recent Alerts" dot="#ffd60a" style={{ flex:1 }}>
                <AlertsList alerts={alerts} />
              </Panel>
            </div>
          </div>
        )}

        {tab === "Explorer" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <span style={{ fontFamily:"monospace", fontSize:11, fontWeight:700, letterSpacing:2, color:"#6e7681", textTransform:"uppercase" }}>Live Incident Feed</span>
              <span style={{ color:"#484f58", fontSize:12 }}>{incidents.length} incidents</span>
            </div>
            <IncidentFeed incidents={incidents} />
          </div>
        )}

        {tab === "Operations" && (
          <div>
            <div style={{ fontFamily:"monospace", fontSize:11, fontWeight:700, letterSpacing:2, color:"#6e7681", textTransform:"uppercase", marginBottom:12 }}>System Controls</div>
            <OperationsPanel schedulerStatus={schedulerStatus} />
            <div style={{ fontFamily:"monospace", fontSize:11, fontWeight:700, letterSpacing:2, color:"#6e7681", textTransform:"uppercase", margin:"24px 0 12px" }}>Spike Detection</div>
            <Panel title="" dot="">
              {spikes && spikes.length ? spikes.map((s,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:16, padding:"10px 14px", background:"#ff2d5510", border:"1px solid #ff2d5530", borderRadius:8, marginBottom:8 }}>
                  <span style={{ color:"#ff2d55", fontWeight:800, textTransform:"uppercase" }}>{(s.incident_type||"").replace(/_/g," ")}</span>
                  <span style={{ color:"#8b949e" }}>{s.previous_count} to {s.current_count} incidents</span>
                  <span style={{ color:"#ffd60a", marginLeft:"auto", fontWeight:700 }}>+{Math.round(s.growth_rate*100)}%</span>
                </div>
              )) : <div style={{ color:"#484f58", fontSize:13 }}>No spikes detected in the last hour.</div>}
            </Panel>
            <div style={{ fontFamily:"monospace", fontSize:11, fontWeight:700, letterSpacing:2, color:"#6e7681", textTransform:"uppercase", margin:"24px 0 12px" }}>System Summary</div>
            <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
              <MetricCard icon="DB" label="Total Incidents" value={summary ? (summary.total_incidents||0) : 0} color="#6366f1" />
              <MetricCard icon="!" label="Total Alerts" value={summary ? (summary.total_alerts||0) : 0} color="#ffd60a" />
              <MetricCard icon="^" label="Avg Risk" value={summary && summary.average_risk_score ? Math.round(summary.average_risk_score*30) : 0} color="#30d158" />
              <MetricCard icon="@" label="Last 24h" value={summary ? (summary.incidents_last_24h||0) : 0} color="#0a84ff" />
            </div>
          </div>
        )}

      </div>

      <style>{"* { box-sizing: border-box; } body { margin: 0; } @keyframes spin { to { transform: rotate(360deg); } } ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: #0d1117; } ::-webkit-scrollbar-thumb { background: #21262d; border-radius: 3px; } .leaflet-container { background: #010409 !important; } .leaflet-popup-content-wrapper { background: #0d1117 !important; border: 1px solid #21262d !important; color: #e6edf3 !important; border-radius: 8px !important; } .leaflet-popup-tip { background: #0d1117 !important; }"}</style>
    </div>
  );
}
