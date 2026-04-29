import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import {
  Wifi,
  Zap,
  Activity,
  Play,
  Loader as Loader2,
  ArrowLeft,
  Lock,
  Clock as Unlock,
  Calendar,
  Clock,
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

  const [plateNumber, setPlateNumber] = useState("Loading...");
  const [unit_id, setUnitId] = useState(0);
  const [unitName, setUnitName] = useState("");
  const [history, setHistory] = useState([]);
  const [current, setCurrent] = useState({
    lat: 18.196,
    lng: 120.592,
    signal: 0,
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
  const [vehicleSchedule, setVehicleSchedule] = useState([]);
  const [loadingVehicleSchedule, setLoadingVehicleSchedule] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const playTimerRef = useRef(null);

  const fetchVehicleInfo = useCallback(
    async (id) => {
      const { data } = await supabase
        .from("vehicles")
        .select(
          `plate_number, 
          unit_id, 
          unit!inner (unit_name)`,
        )
        .eq("id", id)
        .maybeSingle();

      console.log("Fetched vehicle info:", data);

      if (data) {
        setPlateNumber(data.plate_number);
        setUnitId(data.unit_id || 0);
        setUnitName(data.unit.unit_name || "");
      } else {
        setPlateNumber(id);
      }
    },
    [vehicleId],
  );

  const loadVehicleSchedule = useCallback(
    async (date) => {
      setLoadingVehicleSchedule(true);
      console.log(`Loading schedule for unit_id=${unit_id} on date=${date}...`);

      const { data: scheduleData } = await supabase
        .from("schedule")
        .select("*")
        .eq("unit_id", unit_id)
        .eq("date", date)
        .order("time_from", { ascending: true });

      console.log("Fetched vehicle schedule:", scheduleData);

      setVehicleSchedule(scheduleData || []);
      setLoadingVehicleSchedule(false);
    },
    [unit_id],
  );

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
    fetchVehicleInfo(vehicleId);
    discoverSessions(selectedDate);
    loadVehicleSchedule(selectedDate);
  }, [vehicleId, selectedDate, discoverSessions, loadVehicleSchedule]);

  // Cleanup playback timer on unmount
  useEffect(() => {
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, []);

  const playSession = async () => {
    if (selectedSessionIndex === "" || isPlaying) return;
    setIsPlaying(true);
    if (!isLive) setIsLive(true);
    setPlayProgress(0);

    const session = availableSessions[selectedSessionIndex];
    const { data } = await supabase
      .from("vehicle_logs")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .gte("captured_at", session.start)
      .lte("captured_at", session.end)
      .order("captured_at", { ascending: true });

    if (data && data.length > 0) {
      setHistory([]);
      let i = 0;
      const total = data.length;
      playTimerRef.current = setInterval(() => {
        if (i >= total) {
          clearInterval(playTimerRef.current);
          playTimerRef.current = null;
          setIsPlaying(false);
          setPlayProgress(100);
          return;
        }
        const p = data[i];
        setCurrent({
          lat: p.latitude,
          lng: p.longitude,
          signal: p.network_signal,
          speed: p.speed,
          time: p.captured_at,
        });
        setHistory((prev) => [...prev, [p.latitude, p.longitude]]);
        setPlayProgress(Math.round(((i + 1) / total) * 100));
        i++;
      }, 200);
    } else {
      setIsPlaying(false);
    }
  };

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
            signal: n.network_signal,
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

  const formatTime = (iso) => {
    if (!iso) return "--:--";
    let parsedDate = new Date(iso);
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date(`${selectedDate}T${iso}`);
    }

    console.log("Formatting time:", iso);
    return parsedDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div style={styles.root}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .leaflet-container { background: #0f172a; }
        select option { background: #0f1f36; color: #f1f5f9; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
      `}</style>

      {/* TOP BAR */}
      <div style={styles.topBar}>
        <button
          onClick={() => navigate("/")}
          style={styles.backBtn}
          title="Back to Fleet"
        >
          <ArrowLeft size={16} />
        </button>
        <div style={styles.titleCard}>
          <div style={styles.titleMain}>
            <span style={styles.plateName}>{plateNumber}</span>
            <div
              style={{
                ...styles.livePill,
                backgroundColor: isActive
                  ? "rgba(16,185,129,0.15)"
                  : "rgba(100,116,139,0.1)",
                borderColor: isActive
                  ? "rgba(16,185,129,0.3)"
                  : "rgba(100,116,139,0.2)",
              }}
            >
              <span
                style={{
                  ...styles.liveDot,
                  backgroundColor: isActive ? "#10b981" : "#475569",
                  boxShadow: isActive ? "0 0 8px #10b981" : "none",
                  animation: isActive
                    ? "pulse 2s ease-in-out infinite"
                    : "none",
                }}
              />
              <span
                style={{
                  color: isActive ? "#10b981" : "#64748b",
                  fontSize: "11px",
                  fontWeight: "700",
                }}
              >
                {isActive ? "LIVE" : "OFFLINE"}
              </span>
            </div>
          </div>
          {unit_id && <span style={styles.unitNameTag}>{unitName}</span>}
        </div>
      </div>

      {/* LEFT PANEL: TELEMETRY */}
      <div style={styles.hudLeft}>
        <div style={styles.panelTitle}>
          <Activity size={13} color="#3b82f6" />
          <span>Telemetry</span>
        </div>

        <div style={styles.telemetryGrid}>
          <div style={styles.telemetryItem}>
            <span
              style={{
                ...styles.telemetryValue,
                color: isActive ? "#10b981" : "#ef4444",
                fontSize: "13px",
              }}
            >
              {isActive ? "Signal OK" : "No Signal"}
            </span>
          </div>
          <div style={styles.telemetryItem}>
            <Wifi
              size={14}
              color={current.signal > 20 ? "#10b981" : "#ef4444"}
            />
            <span
              style={{
                ...styles.telemetryValue,
                color: current.signal > 20 ? "#e2e8f0" : "#ef4444",
              }}
            >
              {current.signal}%
            </span>
          </div>
          <div style={styles.telemetryItem}>
            <Zap size={14} color="#3b82f6" />
            <span style={styles.telemetryValue}>
              {Number(current.speed).toFixed(1)} km/h
            </span>
          </div>
        </div>

        <div style={styles.divider} />

        <button
          onClick={() => setIsLive(!isLive)}
          style={{
            ...styles.toggleBtn,
            borderColor: isLive
              ? "rgba(59,130,246,0.4)"
              : "rgba(100,116,139,0.3)",
            color: isLive ? "#60a5fa" : "#94a3b8",
            backgroundColor: isLive
              ? "rgba(37,99,235,0.1)"
              : "rgba(100,116,139,0.08)",
          }}
        >
          {isLive ? <Lock size={13} /> : <Unlock size={13} />}
          {isLive ? "Camera Locked" : "Lock Camera"}
        </button>
      </div>

      {/* RIGHT PANEL: ARCHIVE */}
      <div style={styles.hudRight}>
        <div style={styles.hudSchedule}>
          <div style={styles.panelTitle}>
            <Clock size={13} color="#3b82f6" />
            <span>Scheduled Patrolling</span>
          </div>
          {loadingVehicleSchedule ? (
            <div style={styles.scheduleEmpty}>Loading schedule...</div>
          ) : vehicleSchedule.length === 0 ? (
            <div style={styles.scheduleEmpty}>
              No schedule found for selected date.
            </div>
          ) : (
            <div style={styles.scheduleList}>
              {vehicleSchedule.map((item) => (
                <div key={item.id} style={styles.scheduleItem}>
                  <div style={styles.scheduleTime}>
                    {formatTime(item.time_from)} - {formatTime(item.time_to)}
                  </div>
                  <div style={styles.scheduleSector}>{item.sector}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.panelTitle}>
          <Calendar size={13} color="#3b82f6" />
          <span>Log Archive</span>
        </div>

        <div style={styles.archiveField}>
          <label style={styles.fieldLabel}>Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedSessionIndex("");
            }}
            style={styles.input}
          />

          <div style={styles.archiveField}>
            <label style={styles.fieldLabel}>Patrol Session</label>
            <select
              value={selectedSessionIndex}
              onChange={(e) => setSelectedSessionIndex(e.target.value)}
              style={styles.input}
              disabled={isPlaying}
            >
              <option value="">
                {loadingSessions
                  ? "Syncing..."
                  : availableSessions.length === 0
                    ? "No trips found"
                    : "Select a trip"}
              </option>
              {availableSessions.map((s, idx) => (
                <option key={idx} value={idx}>
                  Patrol {idx + 1} &mdash;&nbsp;
                  {formatTime(s.start)} - {formatTime(s.end)}
                </option>
              ))}
            </select>
          </div>

          {isPlaying && (
            <div style={styles.progressBar}>
              <div
                style={{ ...styles.progressFill, width: `${playProgress}%` }}
              />
            </div>
          )}

          <button
            onClick={playSession}
            style={{
              ...styles.replayBtn,
              opacity: selectedSessionIndex === "" || isPlaying ? 0.5 : 1,
              cursor:
                selectedSessionIndex === "" || isPlaying
                  ? "not-allowed"
                  : "pointer",
            }}
            disabled={selectedSessionIndex === "" || isPlaying}
          >
            {isPlaying ? (
              <Loader2
                size={13}
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              <Play size={13} />
            )}
            {isPlaying ? `Replaying... ${playProgress}%` : "Replay Path"}
          </button>
        </div>
      </div>

      <MapContainer
        center={[current.lat, current.lng]}
        zoom={16}
        zoomControl={false}
        style={styles.map}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <Polyline
          positions={history}
          color="#3b82f6"
          weight={3}
          opacity={0.8}
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
  root: {
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#070d1a",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  map: {
    height: "100vh",
    width: "100vw",
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 1,
  },
  topBar: {
    position: "absolute",
    top: "20px",
    left: "20px",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    gap: "12px",
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
  },
  titleCard: {
    backgroundColor: "#0f1f36",
    padding: "10px 18px",
    borderRadius: "12px",
    border: "1px solid rgba(59,130,246,0.2)",
    boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
  },
  titleMain: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  plateName: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#f1f5f9",
    letterSpacing: "-0.2px",
  },
  livePill: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "3px 9px",
    borderRadius: "20px",
    border: "1px solid",
  },
  liveDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    display: "inline-block",
    flexShrink: 0,
  },
  unitNameTag: {
    display: "block",
    fontSize: "11px",
    color: "#475569",
    marginTop: "3px",
    fontWeight: "500",
  },
  hudLeft: {
    position: "absolute",
    bottom: "24px",
    left: "20px",
    zIndex: 1000,
    backgroundColor: "#0f1f36",
    padding: "18px",
    borderRadius: "16px",
    border: "1px solid rgba(59,130,246,0.2)",
    width: "210px",
    color: "#f8fafc",
    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
  },
  hudRight: {
    position: "absolute",
    bottom: "24px",
    right: "20px",
    zIndex: 1000,
    backgroundColor: "#0f1f36",
    padding: "18px",
    borderRadius: "16px",
    border: "1px solid rgba(59,130,246,0.2)",
    width: "220px",
    color: "#f8fafc",
    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  panelTitle: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#3b82f6",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: "14px",
  },
  telemetryGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  telemetryItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  telemetryLabel: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "500",
    minWidth: "45px",
  },
  telemetryValue: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#e2e8f0",
  },
  divider: {
    height: "1px",
    backgroundColor: "rgba(30,41,59,0.8)",
    margin: "14px 0",
  },
  toggleBtn: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "12px",
    border: "1px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    transition: "all 0.2s",
    fontFamily: "inherit",
    letterSpacing: "0.2px",
    boxSizing: "border-box",
  },
  archiveField: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  hudSchedule: {
    backgroundColor: "rgba(15,23,42,0.98)",
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid rgba(59,130,246,0.15)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  scheduleList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  scheduleItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "10px",
    backgroundColor: "rgba(10,25,40,0.9)",
    borderRadius: "10px",
    border: "1px solid rgba(30,41,59,0.75)",
  },
  scheduleTime: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#e2e8f0",
  },
  scheduleSector: {
    fontSize: "12px",
    color: "#94a3b8",
  },
  scheduleEmpty: {
    fontSize: "12px",
    color: "#94a3b8",
    lineHeight: 1.6,
  },
  fieldLabel: {
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    backgroundColor: "#0a1628",
    color: "#f1f5f9",
    border: "1px solid rgba(30,41,59,0.8)",
    padding: "10px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontFamily: "inherit",
    outline: "none",
    appearance: "none",
    transition: "border-color 0.2s",
  },
  progressBar: {
    height: "4px",
    backgroundColor: "rgba(59,130,246,0.15)",
    borderRadius: "2px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: "2px",
    transition: "width 0.15s ease",
  },
  replayBtn: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    letterSpacing: "0.3px",
    fontFamily: "inherit",
    transition: "opacity 0.2s",
  },
};
