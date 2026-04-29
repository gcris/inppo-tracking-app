import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Wifi,
  Activity,
  Clock,
  Search,
  Loader as Loader2,
  LogOut,
  Radio,
  TriangleAlert as AlertTriangle,
  MapPin,
  Gauge,
  RefreshCw,
  Car,
} from "lucide-react";
import { supabase } from "../api/supabase";

export default function Dashboard() {
  const navigate = useNavigate();
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastRefresh, setLastRefresh] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFleetStatus = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    const { data, error } = await supabase
      .from("vehicles")
      .select(
        `
        id,
        plate_number,
        personnel:personnel_id (
          rank,
          fullname
        ),
        vehicle_logs ( network_signal, captured_at, speed, latitude, longitude )
      `,
      )
      .order("captured_at", { foreignTable: "vehicle_logs", ascending: false })
      .limit(1, { foreignTable: "vehicle_logs" });

    if (!error && data) {
      const formatted = data.map((v) => {
        const log = v.vehicle_logs?.[0];
        const logDate = new Date(log.captured_at);
        const now = new Date();

        // Get the absolute difference in milliseconds
        const diff = Math.abs(now - logDate);

        // 1. If the difference is less than 10 minutes (600,000ms), it's Active.
        // 2. If the log is "from the future" (diff is negative/logDate > now),
        //    we usually treat it as Active because it means it was JUST sent.
        const isActive = log && diff < 600000;

        console.log("Log date: " + logDate);
        console.log("Date today: " + now);

        return {
          id: v.id,
          plate: v.plate_number,
          personnel: v.personnel
            ? `${v.personnel.rank} ${v.personnel.fullname}`
            : "",
          signal: log ? log.network_signal : 0,
          speed: log ? log.speed : 0,
          lastSeen: log
            ? new Date(log.captured_at).toLocaleString()
            : "No Signal",
          status: isActive ? "Active" : "Offline",
        };
      });
      setFleet(formatted);
    }

    setLastRefresh(new Date());
    setLoading(false);
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    fetchFleetStatus();
    const interval = setInterval(() => fetchFleetStatus(), 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredFleet = fleet.filter(
    (v) =>
      v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.personnel.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const activeCount = fleet.filter((v) => v.status === "Active").length;
  const offlineCount = fleet.length - activeCount;
  const lowSignalCount = fleet.filter(
    (v) => v.signal > 0 && v.signal < 20,
  ).length;

  return (
    <div style={styles.page}>
      <div style={styles.backgroundGlow} />

      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.branding}>
            <div style={styles.logoBox}>
              <Shield size={22} color="#3b82f6" />
            </div>
            <div>
              <h1 style={styles.title}>INPPO Tracking</h1>
              <div style={styles.badgeRow}>
                <span style={styles.regionBadge}>Laoag City Sector</span>
                <span
                  style={
                    activeCount > 0 ? styles.activeBadge : styles.offlineBadge
                  }
                >
                  <span
                    style={{
                      ...styles.dot,
                      backgroundColor: activeCount > 0 ? "#10b981" : "#64748b",
                      boxShadow: activeCount > 0 ? "0 0 6px #10b981" : "none",
                    }}
                  />
                  {activeCount > 0 ? "System Active" : "Standby"}
                </span>
              </div>
            </div>
          </div>

          <div style={styles.headerRight}>
            {lastRefresh && (
              <span style={styles.lastRefreshText}>
                Updated{" "}
                {lastRefresh.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            <button
              onClick={() => fetchFleetStatus(true)}
              style={styles.refreshBtn}
              disabled={refreshing}
              title="Refresh fleet data"
            >
              <RefreshCw
                size={14}
                style={{
                  animation: refreshing ? "spin 1s linear infinite" : "none",
                }}
              />
            </button>
            <button
              onClick={() => navigate("/track-all")}
              style={styles.navMapBtn}
              title="Track all vehicles on the map"
            >
              <MapPin size={14} />
              Fleet Map
            </button>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </header>

        <div style={styles.managementNav}>
          <button
            onClick={() => navigate("/manage/units")}
            style={styles.mgmtBtn}
            title="Manage units"
          >
            <Radio size={14} />
            Units
          </button>
          <button
            onClick={() => navigate("/manage/personnel")}
            style={styles.mgmtBtn}
            title="Manage personnel"
          >
            <Shield size={14} />
            Personnel
          </button>
          <button
            onClick={() => navigate("/manage/schedule")}
            style={styles.mgmtBtn}
            title="Manage schedules"
          >
            <Clock size={14} />
            Schedule
          </button>
          <button
            onClick={() => navigate("/manage/vehicles")}
            style={styles.mgmtBtn}
            title="Manage vehicles"
          >
            <Car size={14} />
            Vehicles
          </button>
        </div>

        {!loading && (
          <div style={styles.statGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Radio size={18} color="#3b82f6" />
              </div>
              <div>
                <p style={styles.statLabel}>Active Units</p>
                <p style={{ ...styles.statValue, color: "#3b82f6" }}>
                  {activeCount}
                </p>
              </div>
            </div>
            <div style={styles.statCard}>
              <div
                style={{
                  ...styles.statIcon,
                  background: "rgba(100,116,139,0.15)",
                }}
              >
                <MapPin size={18} color="#64748b" />
              </div>
              <div>
                <p style={styles.statLabel}>Offline Units</p>
                <p style={{ ...styles.statValue, color: "#64748b" }}>
                  {offlineCount}
                </p>
              </div>
            </div>
            <div style={styles.statCard}>
              <div
                style={{
                  ...styles.statIcon,
                  background: "rgba(16,185,129,0.12)",
                }}
              >
                <Activity size={18} color="#10b981" />
              </div>
              <div>
                <p style={styles.statLabel}>Total Fleet</p>
                <p style={{ ...styles.statValue, color: "#10b981" }}>
                  {fleet.length}
                </p>
              </div>
            </div>
            {lowSignalCount > 0 && (
              <div
                style={{
                  ...styles.statCard,
                  borderColor: "rgba(245,158,11,0.3)",
                }}
              >
                <div
                  style={{
                    ...styles.statIcon,
                    background: "rgba(245,158,11,0.12)",
                  }}
                >
                  <AlertTriangle size={18} color="#f59e0b" />
                </div>
                <div>
                  <p style={styles.statLabel}>Low Signal</p>
                  <p style={{ ...styles.statValue, color: "#f59e0b" }}>
                    {lowSignalCount}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={styles.searchRow}>
          <div style={styles.searchWrapper}>
            <Search size={16} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by plate or personnel..."
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {!loading && (
            <p style={styles.resultCount}>
              {filteredFleet.length} unit{filteredFleet.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {loading ? (
          <div style={styles.loaderArea} role="status" aria-live="polite">
            <div style={styles.loaderSpinner}>
              <Loader2
                size={28}
                color="#3b82f6"
                style={{ animation: "spin 1s linear infinite" }}
              />
            </div>
            <p style={styles.loaderText}>Syncing Fleet Data...</p>
          </div>
        ) : filteredFleet.length === 0 ? (
          <div style={styles.emptyState}>
            <MapPin size={40} color="#334155" />
            <p style={styles.emptyTitle}>No units found</p>
            <p style={styles.emptyText}>
              {searchTerm
                ? "Try a different search term."
                : "No vehicles are registered in the system."}
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {filteredFleet.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onClick={() => navigate(`/track/${vehicle.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        input::placeholder { color: #475569; }
        input:focus { border-color: #3b82f6 !important; outline: none; }
        .vehicle-card:hover { transform: translateY(-2px); border-color: rgba(59,130,246,0.3) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
        .vehicle-card:hover .track-btn { background-color: rgba(37,99,235,0.25) !important; color: #93c5fd !important; border-color: rgba(59,130,246,0.4) !important; }
        .refresh-btn:hover { border-color: #334155 !important; color: #94a3b8 !important; }
        .logout-btn:hover { border-color: rgba(239,68,68,0.4) !important; color: #fca5a5 !important; }
        button[style*="rgba(37,99,235,0.08)"]:hover { background-color: rgba(37,99,235,0.15) !important; border-color: rgba(59,130,246,0.4) !important; }
      `}</style>
    </div>
  );
}

function VehicleCard({ vehicle, onClick }) {
  const isActive = vehicle.status === "Active";
  const signalColor =
    vehicle.signal < 20
      ? "#ef4444"
      : vehicle.signal > 50
        ? "#10b981"
        : "#f59e0b";

  return (
    <div
      className="vehicle-card"
      style={cardStyles.card}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div style={cardStyles.cardHeader}>
        <div
          style={{
            ...cardStyles.statusBadge,
            backgroundColor: isActive
              ? "rgba(16,185,129,0.12)"
              : "rgba(100,116,139,0.08)",
            borderColor: isActive
              ? "rgba(16,185,129,0.25)"
              : "rgba(100,116,139,0.15)",
          }}
        >
          <span
            style={{
              ...cardStyles.statusDot,
              backgroundColor: isActive ? "#10b981" : "#475569",
              boxShadow: isActive ? "0 0 8px #10b981" : "none",
              animation: isActive ? "pulse 2s ease-in-out infinite" : "none",
            }}
          />
          <span
            style={{
              ...cardStyles.statusText,
              color: isActive ? "#10b981" : "#64748b",
            }}
          >
            {vehicle.status}
          </span>
        </div>
        <Radio size={14} color={isActive ? "#3b82f6" : "#334155"} />
      </div>

      <h2 style={cardStyles.plate}>{vehicle.plate}</h2>
      {vehicle.personnel && (
        <p style={cardStyles.personnel}>{vehicle.personnel}</p>
      )}

      <div style={cardStyles.divider} />

      <div style={cardStyles.metricsRow}>
        <div style={cardStyles.metric}>
          <Wifi size={14} color={signalColor} />
          <span style={{ ...cardStyles.metricValue, color: signalColor }}>
            {vehicle.signal}%
          </span>
        </div>
        <div style={cardStyles.metric}>
          <Gauge size={14} color="#3b82f6" />
          <span style={cardStyles.metricValue}>
            {Number(vehicle.speed).toFixed(1)} km/h
          </span>
        </div>
      </div>

      <div style={cardStyles.lastSeen}>
        <Clock size={11} color="#475569" />
        <span>Last ping: {vehicle.lastSeen}</span>
      </div>

      <button className="track-btn" style={cardStyles.trackBtn}>
        Open Tactical View
      </button>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#070d1a",
    color: "#f8fafc",
    fontFamily: "'Inter', system-ui, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  backgroundGlow: {
    position: "fixed",
    inset: 0,
    background:
      "radial-gradient(ellipse at 10% 20%, rgba(59,130,246,0.05) 0%, transparent 50%), radial-gradient(ellipse at 90% 80%, rgba(16,185,129,0.04) 0%, transparent 50%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "32px 24px",
    position: "relative",
    zIndex: 1,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    paddingBottom: "24px",
    borderBottom: "1px solid rgba(30,41,59,0.8)",
    flexWrap: "wrap",
    gap: "16px",
  },
  branding: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  logoBox: {
    backgroundColor: "rgba(37,99,235,0.12)",
    padding: "11px",
    borderRadius: "12px",
    border: "1px solid rgba(59,130,246,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    margin: "0 0 4px",
    fontSize: "22px",
    fontWeight: "700",
    color: "#f1f5f9",
    letterSpacing: "-0.3px",
  },
  badgeRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  regionBadge: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: "500",
  },
  activeBadge: {
    fontSize: "11px",
    color: "#10b981",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    backgroundColor: "rgba(16,185,129,0.08)",
    padding: "3px 8px",
    borderRadius: "20px",
    border: "1px solid rgba(16,185,129,0.2)",
  },
  offlineBadge: {
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    backgroundColor: "rgba(100,116,139,0.08)",
    padding: "3px 8px",
    borderRadius: "20px",
    border: "1px solid rgba(100,116,139,0.2)",
  },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    display: "inline-block",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  lastRefreshText: {
    fontSize: "11px",
    color: "#475569",
  },
  refreshBtn: {
    backgroundColor: "transparent",
    border: "1px solid #1e293b",
    color: "#64748b",
    width: "34px",
    height: "34px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    fontFamily: "inherit",
  },
  navMapBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "0 14px",
    height: "34px",
    borderRadius: "10px",
    border: "1px solid rgba(59,130,246,0.3)",
    backgroundColor: "rgba(37,99,235,0.12)",
    color: "#bfdbfe",
    cursor: "pointer",
    fontWeight: 600,
    transition: "all 0.2s",
    fontFamily: "inherit",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "transparent",
    color: "#94a3b8",
    border: "1px solid #1e293b",
    padding: "8px 14px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
    fontFamily: "inherit",
    letterSpacing: "0.2px",
  },
  statGrid: {
    display: "flex",
    gap: "16px",
    marginBottom: "28px",
    flexWrap: "wrap",
  },
  managementNav: {
    display: "flex",
    gap: "12px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  mgmtBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 14px",
    borderRadius: "8px",
    border: "1px solid rgba(59,130,246,0.2)",
    backgroundColor: "rgba(37,99,235,0.08)",
    color: "#93c5fd",
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "12px",
    transition: "all 0.2s",
    fontFamily: "inherit",
  },
  statCard: {
    backgroundColor: "#0f1f36",
    padding: "18px 22px",
    borderRadius: "14px",
    border: "1px solid rgba(59,130,246,0.12)",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flex: "1 1 160px",
    minWidth: "140px",
  },
  statIcon: {
    background: "rgba(59,130,246,0.12)",
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statLabel: {
    margin: "0 0 3px",
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  statValue: {
    margin: 0,
    fontSize: "28px",
    fontWeight: "700",
    letterSpacing: "-0.5px",
  },
  searchRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
    gap: "16px",
    flexWrap: "wrap",
  },
  searchWrapper: {
    position: "relative",
    flex: "1 1 300px",
    maxWidth: "500px",
  },
  searchIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#475569",
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    backgroundColor: "#0f1f36",
    border: "1px solid #1e293b",
    borderRadius: "10px",
    padding: "11px 14px 11px 42px",
    color: "#f1f5f9",
    fontSize: "14px",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
    fontFamily: "inherit",
  },
  resultCount: {
    fontSize: "13px",
    color: "#475569",
    margin: 0,
    whiteSpace: "nowrap",
  },
  loaderArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 0",
    gap: "16px",
  },
  loaderSpinner: {
    backgroundColor: "rgba(37,99,235,0.1)",
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(59,130,246,0.2)",
  },
  loaderText: {
    color: "#475569",
    fontSize: "13px",
    fontWeight: "500",
    letterSpacing: "0.5px",
    margin: 0,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "80px 0",
    gap: "12px",
  },
  emptyTitle: {
    color: "#94a3b8",
    fontSize: "18px",
    fontWeight: "600",
    margin: "8px 0 0",
  },
  emptyText: {
    color: "#475569",
    fontSize: "14px",
    margin: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
  },
};

const cardStyles = {
  card: {
    backgroundColor: "#0f1f36",
    borderRadius: "16px",
    border: "1px solid rgba(30,41,59,0.8)",
    padding: "24px",
    cursor: "pointer",
    transition: "transform 0.15s ease, border-color 0.2s, box-shadow 0.2s",
    outline: "none",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    borderRadius: "20px",
    border: "1px solid",
  },
  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    display: "inline-block",
    flexShrink: 0,
  },
  statusText: {
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  plate: {
    margin: "0 0 4px",
    fontSize: "24px",
    fontWeight: "700",
    color: "#f1f5f9",
    letterSpacing: "-0.3px",
  },
  unitName: {
    margin: "0 0 2px",
    fontSize: "13px",
    color: "#94a3b8",
    fontWeight: "500",
  },
  personnel: {
    margin: 0,
    fontSize: "12px",
    color: "#475569",
  },
  divider: {
    height: "1px",
    backgroundColor: "rgba(30,41,59,0.8)",
    margin: "16px 0",
  },
  metricsRow: {
    display: "flex",
    gap: "20px",
    marginBottom: "12px",
  },
  metric: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  metricValue: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#e2e8f0",
  },
  lastSeen: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    color: "#475569",
    marginBottom: "18px",
  },
  trackBtn: {
    width: "100%",
    padding: "11px",
    backgroundColor: "rgba(37,99,235,0.12)",
    color: "#60a5fa",
    border: "1px solid rgba(59,130,246,0.2)",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    letterSpacing: "0.3px",
    transition: "all 0.2s",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
};
