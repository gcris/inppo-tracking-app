import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { latLngBounds } from "leaflet";
import { supabase } from "../api/supabase";
import { getTacticalIcon } from "../components/TacticalIcons";
import { ArrowLeft, Wifi, Gauge, Clock } from "lucide-react";

function AutoFitBounds({ markers }) {
  const map = useMap();

  useEffect(() => {
    if (!markers.length) return;
    const bounds = latLngBounds(
      markers.map((marker) => [marker.lat, marker.lng]),
    );
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 });
  }, [markers, map]);

  return null;
}

export default function FleetMap() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFleet = async () => {
    const { data, error } = await supabase
      .from("vehicles")
      .select(
        `id, plate_number, unit_name, assigned_officer, vehicle_logs (latitude, longitude, captured_at, network_signal, speed)`,
      )
      .order("captured_at", { foreignTable: "vehicle_logs", ascending: false })
      .limit(1, { foreignTable: "vehicle_logs" });

    if (!error && data) {
      const formatted = data
        .map((vehicle) => {
          const log = vehicle.vehicle_logs?.[0];
          if (!log || !log.latitude || !log.longitude) return null;
          const logDate = new Date(log.captured_at);
          const now = new Date();

          // Get the absolute difference in milliseconds
          const diff = Math.abs(now - logDate);

          // 1. If the difference is less than 10 minutes (600,000ms), it's Active.
          // 2. If the log is "from the future" (diff is negative/logDate > now),
          //    we usually treat it as Active because it means it was JUST sent.
          const isActive = log && diff < 600000;

          return {
            id: vehicle.id,
            plate: vehicle.plate_number,
            unitName: vehicle.unit_name || "",
            officer: vehicle.assigned_officer || "",
            lat: log.latitude,
            lng: log.longitude,
            signal: log.network_signal,
            speed: log.speed,
            capturedAt: log.captured_at,
            status: isActive ? "Active" : "Offline",
          };
        })
        .filter(Boolean);

      setVehicles(formatted);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadFleet();
    const interval = setInterval(loadFleet, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("fleet-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "vehicle_logs" },
        (payload) => {
          const record = payload.new;
          if (!record.latitude || !record.longitude) return;

          let found = false;
          setVehicles((prev) =>
            prev.map((vehicle) => {
              if (vehicle.id === record.vehicle_id) {
                found = true;
                return {
                  ...vehicle,
                  lat: record.latitude,
                  lng: record.longitude,
                  signal: record.network_signal,
                  speed: record.speed,
                  capturedAt: record.captured_at,
                  status: "Active",
                };
              }
              return vehicle;
            }),
          );

          if (!found) {
            loadFleet();
          } else {
            setLastRefresh(new Date());
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const center = vehicles.length
    ? [vehicles[0].lat, vehicles[0].lng]
    : [18.196, 120.592];

  return (
    <div style={styles.page}>
      <style>{`
        .leaflet-container { background: #0f172a; }
      `}</style>

      <button
        onClick={() => navigate("/")}
        style={styles.backBtn}
        title="Back to Fleet"
      >
        <ArrowLeft size={16} />
      </button>

      <div style={styles.mapPanel}>
        <MapContainer
          center={center}
          zoom={12}
          style={styles.map}
          scrollWheelZoom
          zoomControl={false}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <AutoFitBounds markers={vehicles} />
          {vehicles.map((vehicle) => (
            <Marker
              key={vehicle.id}
              position={[vehicle.lat, vehicle.lng]}
              icon={getTacticalIcon(vehicle.status === "Active")}
            >
              <Popup>
                <div style={styles.popup}>
                  <div style={styles.popupTitle}>{vehicle.plate}</div>
                  <div style={styles.popupText}>
                    {vehicle.unitName || "No unit name"}
                  </div>
                  <div style={styles.popupText}>
                    {vehicle.officer || "No assigned officer"}
                  </div>
                  <div style={styles.popupText}>
                    <strong>Status:</strong> {vehicle.status}
                  </div>
                  <div style={styles.popupStats}>
                    <span>
                      <Wifi size={12} /> {vehicle.signal}%
                    </span>
                    <span>
                      <Gauge size={12} /> {Number(vehicle.speed).toFixed(1)}{" "}
                      km/h
                    </span>
                  </div>
                  <div style={styles.popupText}>
                    <Clock size={12} />{" "}
                    {new Date(vehicle.capturedAt).toLocaleString()}
                  </div>
                  <button
                    style={styles.popupBtn}
                    onClick={() => navigate(`/track/${vehicle.id}`)}
                  >
                    View Vehicle Track
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: "100vh",
    width: "100vw",
    margin: 0,
    padding: 0,
    backgroundColor: "#070d1a",
    color: "#f8fafc",
    fontFamily: "'Inter', system-ui, sans-serif",
    overflow: "hidden",
    position: "relative",
  },
  backBtn: {
    backgroundColor: "#0f1f36",
    color: "#f1f5f9",
    border: "1px solid rgba(59,130,246,0.2)",
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
    flexShrink: 0,
    position: "absolute",
    top: "20px",
    left: "20px",
    zIndex: 20,
  },
  mapPanel: {
    position: "absolute",
    inset: 0,
    zIndex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  popup: {
    minWidth: "180px",
    fontSize: "13px",
    lineHeight: 1.4,
    color: "#0f172a",
  },
  popupTitle: {
    fontWeight: 700,
    marginBottom: "6px",
  },
  popupText: {
    marginBottom: "4px",
  },
  popupStats: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "4px",
    color: "#0f172a",
  },
  popupBtn: {
    width: "100%",
    padding: "10px 12px",
    marginTop: "10px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 700,
    textAlign: "center",
  },
};
