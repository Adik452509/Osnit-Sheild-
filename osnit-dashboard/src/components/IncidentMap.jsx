import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

function IncidentMap({ incidents }) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ height: "500px", width: "100%", borderRadius: "12px" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {incidents.map((incident) => (
        <Marker
          key={incident.id}
          position={[incident.latitude, incident.longitude]}
        >
          <Popup>
            <strong>{incident.incident_type}</strong>
            <br />
            Risk Score: {incident.risk_score}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default IncidentMap;
