import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import {
  Shield,
  Battery,
  Zap,
  Activity,
  Play,
  RotateCcw,
  Loader2,
  ArrowLeft,
} from "lucide-react";

import { supabase } from "../api/supabase";
import { getTacticalIcon } from "../components/TacticalIcons";

function AutoCenter({ pos, isLive }) {
  const map = useMap();
  useEffect(() => {
    if (isLive) map.setView(pos, map.getZoom());
  }, [pos, isLive, map]);
  return null;
}

export default function Tracker() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();

  // --- NEW STATE FOR PLATE NUMBER ---
  const [plateNumber, setPlateNumber] = useState("Loading...");

  const [history, setHistory] = useState([]);
  const [current, setCurrent] = useState({
    lat: 18.196,
    lng: 120.592,
    bat: 0,
    speed: 0,
    time: "",
  });
  const [isActive, setIsActive] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [availableSessions, setAvailableSessions] = useState([]);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // --- 1. FETCH VEHICLE DETAILS (PLATE NUMBER) ---
  useEffect(() => {
    const fetchVehicleInfo = async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("plate_number")
        .eq("id", vehicleId)
        .single();

      if (data) {
        setPlateNumber(data.plate_number);
      } else {
        setPlateNumber(vehicleId); // Fallback to ID if not found
      }
    };
    fetchVehicleInfo();
  }, [vehicleId]);

  // --- 2. DISCOVER SESSIONS ---
  const discoverSessions = useCallback(
    async (date) => {
      setLoadingSessions(true);
      const { data } = await supabase
        .from("vehicle_logs")
        .select("captured_at")
        .eq("vehicle_id", vehicleId)
        .gte("captured_at", `${date}T00:00:00Z`)
        .lte("captured_at", `${date}T23:59:59Z`)
        .order("captured_at", { ascending: true });

      if (data && data.length > 1) {
        const found = [];
        let sStart = data[0].captured_at;
        for (let i = 1; i < data.length; i++) {
          const diff =
            new Date(data[i].captured_at) - new Date(data[i - 1].captured_at);
          if (diff > 20 * 60 * 1000) {
            found.push({ start: sStart, end: data[i - 1].captured_at });
            sStart = data[i].captured_at;
          }
        }
        found.push({ start: sStart, end: data[data.length - 1].captured_at });
        setAvailableSessions(found);
      } else {
        setAvailableSessions([]);
      }
      setLoadingSessions(false);
    },
    [vehicleId],
  );

  useEffect(() => {
    discoverSessions(selectedDate);
  }, [selectedDate, discoverSessions]);

  // --- 3. PLAYBACK LOGIC ---
  const playSession = async () => {
    if (selectedSessionIndex === "" || isPlaying) return;
    setIsPlaying(true);
    setIsLive(false);
    const session = availableSessions[selectedSessionIndex];
    const { data } = await supabase
      .from("vehicle_logs")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .gte("captured_at", session.start)
      .lte("captured_at", session.end)
      .order("captured_at", { ascending: true });

    if (data) {
      setHistory([]);
      let i = 0;
      const timer = setInterval(() => {
        if (i >= data.length) {
          clearInterval(timer);
          setIsPlaying(false);
          return;
        }
        const p = data[i];
        setCurrent({
          lat: p.latitude,
          lng: p.longitude,
          bat: p.battery_level,
          speed: p.speed,
          time: p.captured_at,
        });
        setHistory((prev) => [...prev, [p.latitude, p.longitude]]);
        i++;
      }, 200);
    }
  };

  // --- 4. REAL-TIME UPDATES ---
  useEffect(() => {
    const channel = supabase
      .channel(`live-${vehicleId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "vehicle_logs",
          filter: `vehicle_id=eq.${vehicleId}`,
        },
        (payload) => {
          if (!isLive) return;
          const n = payload.new;
          if (n.latitude === 0 || n.longitude === 0) return;
          setIsActive(true);
          setCurrent({
            lat: n.latitude,
            lng: n.longitude,
            bat: n.battery_level,
            speed: n.speed,
            time: n.captured_at,
          });
          setHistory((prev) =>
            [...prev, [n.latitude, n.longitude]].slice(-200),
          );
        },
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [isLive, vehicleId]);

  return (
    <div style={styles.mainLayout}>
      <style>{`
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } 
      .animate-spin { animation: spin 1s linear infinite; }
    `}</style>

      {/* FLOATING TOP BAR */}
      <div style={styles.topBar}>
        <button onClick={() => navigate("/")} style={styles.backBtn}>
          <ArrowLeft size={18} />
        </button>
        <div style={styles.titleGroup}>
          <div style={styles.titleHeader}>
            <h2 style={styles.plateTitle}>{plateNumber}</h2>
            <div
              style={{
                ...styles.liveDot,
                backgroundColor: isActive ? "#10b981" : "#64748b",
                boxShadow: isActive ? "0 0 8px #10b981" : "none",
              }}
            />
          </div>
          <span style={styles.sectorTag}>LAOAG SECTOR • TACTICAL VIEW</span>
        </div>
      </div>

      {/* FLOATING LEFT PANEL: TELEMETRY */}
      <div style={styles.hudLeft}>
        <div style={styles.panelHeader}>UNIT TELEMETRY</div>
        <div style={styles.statusRow}>
          <Activity size={14} color={isActive ? "#10b981" : "#ef4444"} />
          <span style={{ color: isActive ? "#10b981" : "#94a3b8" }}>
            {isActive ? "SIGNAL STABLE" : "CONNECTION LOST"}
          </span>
        </div>
        <div style={styles.statusRow}>
          <Battery size={14} color={current.bat > 20 ? "#10b981" : "#ef4444"} />
          <span>{current.bat}% POWER</span>
        </div>
        <div style={styles.statusRow}>
          <Zap size={14} color="#3b82f6" />
          <span>{current.speed.toFixed(1)} KM/H</span>
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          style={{
            ...styles.btnBase,
            borderColor: isLive ? "#ef4444" : "#10b981",
            color: isLive ? "#ef4444" : "#10b981",
            marginTop: "15px",
          }}
        >
          {isLive ? "RELEASE CAMERA" : "RE-LOCK ON UNIT"}
        </button>
      </div>

      {/* FLOATING RIGHT PANEL: ARCHIVE */}
      <div style={styles.hudRight}>
        <div style={styles.panelHeader}>LOG ARCHIVE</div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={styles.input}
        />
        <select
          value={selectedSessionIndex}
          onChange={(e) => setSelectedSessionIndex(e.target.value)}
          style={styles.input}
          disabled={isPlaying}
        >
          <option value="">
            -- {loadingSessions ? "SYNCING..." : "SELECT TRIP"} --
          </option>
          {availableSessions.map((s, idx) => (
            <option key={idx} value={idx}>
              TRIP{" "}
              {new Date(s.start).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              -
              {new Date(s.end).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </option>
          ))}
        </select>
        <button
          onClick={playSession}
          style={styles.btnPrimary}
          disabled={selectedSessionIndex === "" || isPlaying}
        >
          {isPlaying ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Play size={14} />
          )}
          {isPlaying ? "PLAYING..." : "REPLAY PATH"}
        </button>
      </div>

      <MapContainer
        center={[current.lat, current.lng]}
        zoom={16}
        zoomControl={false}
        style={styles.mapStyle}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <Polyline
          positions={history}
          color="#10b981"
          weight={3}
          opacity={0.7}
          lineJoin="round"
        />
        <Marker
          position={[current.lat, current.lng]}
          icon={getTacticalIcon(isActive)}
        />
        <AutoCenter pos={[current.lat, current.lng]} isLive={isLive} />
      </MapContainer>
    </div>
  );
}

const styles = {
  mainLayout: {
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#0f172a",
  },
  mapStyle: {
    height: "100vh",
    width: "100vw",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
  },

  topBar: {
    position: "absolute",
    top: "25px",
    left: "25px",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  backBtn: {
    backgroundColor: "#1e293b",
    color: "#fff",
    border: "1px solid #334155",
    width: "50px",
    height: "50px",
    borderRadius: "12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  titleGroup: {
    backgroundColor: "#1e293b",
    padding: "10px 20px",
    borderRadius: "12px",
    border: "1px solid #334155",
    minWidth: "200px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
  },
  titleHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
  },
  plateTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#fff",
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  liveDot: { width: "8px", height: "8px", borderRadius: "50%" },
  sectorTag: {
    fontSize: "10px",
    color: "#64748b",
    fontWeight: "bold",
    marginTop: "4px",
    display: "block",
  },

  hudLeft: {
    position: "absolute",
    bottom: "30px",
    left: "25px",
    zIndex: 1000,
    backgroundColor: "#1e293b",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #334155",
    width: "220px",
    color: "#f8fafc",
    fontFamily: "monospace",
    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
  },
  hudRight: {
    position: "absolute",
    bottom: "30px",
    right: "25px",
    zIndex: 1000,
    backgroundColor: "#1e293b",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #334155",
    width: "220px", // Fixed width for the panel
    color: "#f8fafc",
    fontFamily: "monospace",
    display: "flex",
    flexDirection: "column",
    gap: "10px", // Automatically handles spacing between items
  },

  panelHeader: {
    fontSize: "11px",
    color: "#3b82f6",
    fontWeight: "bold",
    letterSpacing: "1px",
    marginBottom: "15px",
    borderBottom: "1px solid #334155",
    paddingBottom: "8px",
  },
  statusRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "10px",
    fontSize: "13px",
    fontWeight: "bold",
  },
  label: {
    fontSize: "9px",
    color: "#64748b",
    marginBottom: "5px",
    display: "block",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    boxSizing: "border-box", // CRITICAL: Ensures padding doesn't add to width
    backgroundColor: "#0f172a",
    color: "#fff",
    border: "1px solid #334155",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontFamily: "monospace",
    outline: "none",
    appearance: "none", // Removes default browser styling
  },
  btnBase: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "11px",
    textTransform: "uppercase",
    backgroundColor: "transparent",
    border: "1px solid",
  },
  btnPrimary: {
    width: "100%",
    boxSizing: "border-box", // CRITICAL: Matches the input width logic
    padding: "14px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "11px",
    fontWeight: "bold",
    cursor: "pointer",
    letterSpacing: "1px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginTop: "5px",
  },
};
