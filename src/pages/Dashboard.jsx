import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Battery,
  Activity,
  Clock,
  ChevronRight,
  Search,
  Loader2,
  Monitor,
} from "lucide-react";
import { supabase } from "../api/supabase";

export default function Dashboard() {
  const navigate = useNavigate();
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchFleetStatus = async () => {
    setLoading(true);
    // Querying only existing columns: id and plate_number
    const { data, error } = await supabase
      .from("vehicles")
      .select(
        `
        id, 
        plate_number,
        vehicle_logs ( battery_level, captured_at, speed )
      `,
      )
      .order("captured_at", { foreignTable: "vehicle_logs", ascending: false })
      .limit(1, { foreignTable: "vehicle_logs" });

    if (!error && data) {
      const formatted = data.map((v) => {
        const log = v.vehicle_logs?.[0];
        return {
          id: v.id,
          plate: v.plate_number,
          battery: log ? log.battery_level : 0,
          speed: log ? log.speed : 0,
          lastSeen: log
            ? new Date(log.captured_at).toLocaleString()
            : "No Signal",
          status:
            log && new Date() - new Date(log.captured_at) < 600000
              ? "Active"
              : "Offline",
        };
      });
      setFleet(formatted);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  useEffect(() => {
    fetchFleetStatus();
    const interval = setInterval(fetchFleetStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredFleet = fleet.filter((v) =>
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <header style={styles.header}>
          <div style={styles.branding}>
            <div style={styles.iconCircle}>
              <Shield size={24} color="#3b82f6" />
            </div>
            <div>
              <h1 style={styles.title}>INPPO Tracking </h1>
              <div style={styles.badgeRow}>
                <span style={styles.regionBadge}>LAOAG SECTOR</span>
                <span style={styles.statusBadge}>SYSTEM READY</span>
              </div>
            </div>
            <div>
              <button
                onClick={handleLogout}
                style={styles.logoutBtn}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = "#ef4444"; // Red border on hover
                  e.target.style.color = "#ef4444";
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = "#334155";
                  e.target.style.color = "#94a3b8";
                }}
              >
                Log out
              </button>
            </div>
          </div>

          <div style={styles.searchWrapper}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search Plate Number..."
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </header>

        {loading ? (
          <div style={styles.loaderArea}>
            <Loader2 className="animate-spin" size={32} color="#3b82f6" />
            <p
              style={{
                fontSize: "11px",
                letterSpacing: "2px",
                marginTop: "10px",
              }}
            >
              REFRESHING ASSET DATA...
            </p>
          </div>
        ) : (
          <>
            <div style={styles.statGrid}>
              <div style={styles.statBox}>
                <p style={styles.statLabel}>ACTIVE UNITS</p>
                <p style={styles.statValue}>
                  {fleet.filter((v) => v.status === "Active").length}
                </p>
              </div>
              <div style={styles.statBox}>
                <p style={styles.statLabel}>TOTAL ASSETS</p>
                <p style={styles.statValue}>{fleet.length}</p>
              </div>
            </div>

            <div style={styles.grid}>
              {filteredFleet.map((vehicle) => (
                <div
                  key={vehicle.id}
                  style={styles.card}
                  onClick={() => navigate(`/track/${vehicle.id}`)}
                >
                  <div style={styles.cardHeader}>
                    <div style={styles.plateGroup}>
                      <div
                        style={{
                          ...styles.dot,
                          backgroundColor:
                            vehicle.status === "Active" ? "#10b981" : "#ef4444",
                          boxShadow:
                            vehicle.status === "Active"
                              ? "0 0 8px #10b981"
                              : "none",
                        }}
                      />
                      <h2 style={styles.plateText}>{vehicle.plate}</h2>
                    </div>
                    <Monitor size={16} color="#475569" />
                  </div>

                  <div style={styles.divider} />

                  <div style={styles.dataRow}>
                    <div style={styles.dataItem}>
                      <Battery
                        size={14}
                        color={vehicle.battery < 20 ? "#ef4444" : "#10b981"}
                      />
                      <span style={styles.dataText}>{vehicle.battery}%</span>
                    </div>
                    <div style={styles.dataItem}>
                      <Activity size={14} color="#3b82f6" />
                      <span style={styles.dataText}>
                        {vehicle.speed.toFixed(1)} km/h
                      </span>
                    </div>
                  </div>

                  <div style={styles.timeRow}>
                    <Clock size={12} color="#64748b" />
                    <span>LAST PING: {vehicle.lastSeen}</span>
                  </div>

                  <button style={styles.trackBtn}>OPEN TACTICAL VIEW</button>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    fontFamily: "monospace",
    padding: "0 20px",
  },
  main: { maxWidth: "1600px", margin: "0 auto", padding: "40px 0" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px",
    borderBottom: "1px solid #1e293b",
    paddingBottom: "30px",
  },
  branding: { display: "flex", alignItems: "center", gap: "20px" },
  iconCircle: {
    backgroundColor: "#1e293b",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid #334155",
  },
  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "bold",
    letterSpacing: "1px",
  },
  badgeRow: { display: "flex", gap: "12px", marginTop: "4px" },
  regionBadge: { fontSize: "10px", color: "#64748b" },
  statusBadge: { fontSize: "10px", color: "#10b981" },
  searchWrapper: { position: "relative" },
  searchIcon: {
    position: "absolute",
    left: "15px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#64748b",
  },
  searchInput: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "6px",
    padding: "12px 15px 12px 45px",
    color: "#fff",
    fontSize: "14px",
    width: "300px",
  },
  statGrid: { display: "flex", gap: "20px", marginBottom: "40px" },
  statBox: {
    backgroundColor: "#1e293b",
    padding: "24px",
    borderRadius: "12px",
    border: "1px solid #334155",
    flex: 1,
  },
  statLabel: {
    margin: "0 0 8px 0",
    fontSize: "11px",
    color: "#64748b",
    fontWeight: "bold",
  },
  statValue: {
    margin: 0,
    fontSize: "36px",
    fontWeight: "bold",
    color: "#3b82f6",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "25px",
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    border: "1px solid #334155",
    padding: "24px",
    cursor: "pointer",
    transition: "transform 0.2s",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },
  plateGroup: { display: "flex", alignItems: "center", gap: "12px" },
  dot: { width: "10px", height: "10px", borderRadius: "50%" },
  plateText: { margin: 0, fontSize: "22px", fontWeight: "bold" },
  divider: { height: "1px", backgroundColor: "#334155", margin: "0 0 20px 0" },
  dataRow: { display: "flex", gap: "25px", marginBottom: "15px" },
  dataItem: { display: "flex", alignItems: "center", gap: "8px" },
  dataText: { fontSize: "15px", fontWeight: "bold" },
  timeRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "10px",
    color: "#64748b",
    marginBottom: "20px",
  },
  trackBtn: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    letterSpacing: "1px",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "transparent",
    color: "#94a3b8", // Slate gray
    border: "1px solid #334155",
    padding: "8px 15px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "bold",
    letterSpacing: "1px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontFamily: "monospace",
  },
};
