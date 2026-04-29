import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Loader as Loader2,
} from "lucide-react";
import {
  getSchedules,
  createSchedule,
  createSchedules,
  updateSchedule,
  deleteSchedule,
  getUnits,
  getPersonnel,
} from "../api/crud";

export default function Schedule() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [units, setUnits] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: "",
    time_from: "",
    time_to: "",
    sector: "",
    unit_id: "",
    personnel_id: "",
  });
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSchedules, setBulkSchedules] = useState([
    {
      date: new Date().toISOString().split("T")[0],
      time_from: "08:00:00",
      time_to: "10:00:00",
      sector: "",
      unit_id: "",
      personnel_id: "",
    },
  ]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [s, u, p] = await Promise.all([
      getSchedules(),
      getUnits(),
      getPersonnel(),
    ]);
    if (s.data) setSchedules(s.data);
    if (u.data) setUnits(u.data);
    if (p.data) setPersonnel(p.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.date ||
      !formData.time_from ||
      !formData.time_to ||
      !formData.sector ||
      !formData.unit_id ||
      !formData.personnel_id
    )
      return;

    if (editingId) {
      const { error } = await updateSchedule(editingId, formData);
      if (!error) {
        setEditingId(null);
        setFormData({
          date: new Date().toISOString().split("T")[0],
          time_from: "8:00:00",
          time_to: "10:00:00",
          sector: "",
          unit_id: "",
          personnel_id: "",
        });
        setShowForm(false);
        loadData();
      }
    } else {
      const { error } = await createSchedule(formData);
      if (!error) {
        setFormData({
          date: new Date().toISOString().split("T")[0],
          time_from: "08:00:00",
          time_to: "10:00:00",
          sector: "",
          unit_id: "",
          personnel_id: "",
        });
        setShowForm(false);
        loadData();
      }
    }
  };

  const handleEdit = (s) => {
    setFormData({
      date: s.date,
      time_from: s.time_from,
      time_to: s.time_to,
      sector: s.sector,
      unit_id: s.unit_id,
      personnel_id: s.personnel_id,
    });
    setEditingId(s.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this schedule?")) {
      const { error } = await deleteSchedule(id);
      if (!error) {
        loadData();
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      time_from: "08:00:00",
      time_to: "10:00:00",
      sector: "",
      unit_id: "",
      personnel_id: "",
    });
    setBulkMode(false);
    setBulkSchedules([
      {
        date: new Date().toISOString().split("T")[0],
        time_from: "08:00:00",
        time_to: "10:00:00",
        sector: "",
        unit_id: "",
        personnel_id: "",
      },
    ]);
    setEditingId(null);
    setShowForm(false);
  };

  const addBulkScheduleRow = () => {
    setBulkSchedules((prev) => [
      ...prev,
      {
        date: new Date().toISOString().split("T")[0],
        time_from: "08:00:00",
        time_to: "10:00:00",
        sector: "",
        unit_id: "",
        personnel_id: "",
      },
    ]);
  };

  const removeBulkScheduleRow = (index) => {
    setBulkSchedules((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateBulkScheduleRow = (index, field, value) => {
    setBulkSchedules((prev) =>
      prev.map((row, idx) =>
        idx === index ? { ...row, [field]: value } : row,
      ),
    );
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    const invalid = bulkSchedules.some(
      (row) =>
        !row.date ||
        !row.time_from ||
        !row.time_to ||
        !row.sector.trim() ||
        !row.unit_id ||
        !row.personnel_id,
    );
    if (invalid) return;

    const { error } = await createSchedules(bulkSchedules);
    if (!error) {
      setBulkMode(false);
      setBulkSchedules([
        {
          date: new Date().toISOString().split("T")[0],
          time_from: "08:00:00",
          time_to: "10:00:00",
          sector: "",
          unit_id: "",
          personnel_id: "",
        },
      ]);
      setShowForm(false);
      loadData();
    } else {
      console.log("Error creating schedules:", error);
    }
  };

  const getUnitName = (unit_id) => {
    return units.find((u) => u.id === unit_id)?.unit_name || "N/A";
  };

  const getPersonnelName = (personnel_id) => {
    return personnel.find((p) => p.id === personnel_id)?.fullname || "N/A";
  };

  const formatTime = (iso) => {
    if (!iso) return "--:--";
    let parsedDate = new Date(iso);
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date().toISOString().split("T")[0];
      parsedDate = new Date(`${parsedDate}T${iso}`);
    }

    return parsedDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <button
            onClick={() => navigate("/")}
            style={styles.backBtn}
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 style={styles.title}>Schedule Management</h1>
          <button
            onClick={() => {
              setBulkMode(false);
              setEditingId(null);
              setShowForm(true);
            }}
            style={styles.addBtn}
            title="Add new schedule"
          >
            <Plus size={18} />
            Add Schedule
          </button>
          <button
            onClick={() => {
              setBulkMode(true);
              setEditingId(null);
              setShowForm(true);
            }}
            style={styles.addBtn}
            title="Add multiple schedules"
          >
            <Plus size={18} />
            Bulk Add
          </button>
        </header>

        {showForm && (
          <div style={styles.formContainer}>
            {bulkMode ? (
              <form onSubmit={handleBulkSubmit} style={styles.form}>
                <h2 style={styles.formTitle}>Add Multiple Schedules</h2>
                {bulkSchedules.map((row, index) => (
                  <div key={index} style={styles.bulkRow}>
                    <div style={styles.bulkFieldGroup}>
                      <label style={styles.bulkLabel}>Date</label>
                      <input
                        type="date"
                        value={row.date}
                        onChange={(e) =>
                          updateBulkScheduleRow(index, "date", e.target.value)
                        }
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.bulkFieldGroup}>
                      <label style={styles.bulkLabel}>From</label>
                      <input
                        type="time"
                        value={row.time_from}
                        onChange={(e) =>
                          updateBulkScheduleRow(
                            index,
                            "time_from",
                            e.target.value,
                          )
                        }
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.bulkFieldGroup}>
                      <label style={styles.bulkLabel}>To</label>
                      <input
                        type="time"
                        value={row.time_to}
                        onChange={(e) =>
                          updateBulkScheduleRow(
                            index,
                            "time_to",
                            e.target.value,
                          )
                        }
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.bulkFieldGroup}>
                      <label style={styles.bulkLabel}>Sector</label>
                      <input
                        type="text"
                        placeholder="Sector"
                        value={row.sector}
                        onChange={(e) =>
                          updateBulkScheduleRow(index, "sector", e.target.value)
                        }
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.bulkFieldGroup}>
                      <label style={styles.bulkLabel}>Unit</label>
                      <select
                        value={row.unit_id}
                        onChange={(e) =>
                          updateBulkScheduleRow(
                            index,
                            "unit_id",
                            e.target.value,
                          )
                        }
                        style={styles.input}
                      >
                        <option value="">Select Unit</option>
                        {units.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.unit_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={styles.bulkFieldGroup}>
                      <label style={styles.bulkLabel}>Personnel</label>
                      <select
                        value={row.personnel_id}
                        onChange={(e) =>
                          updateBulkScheduleRow(
                            index,
                            "personnel_id",
                            e.target.value,
                          )
                        }
                        style={styles.input}
                      >
                        <option value="">Select Personnel</option>
                        {personnel.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.fullname}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBulkScheduleRow(index)}
                      style={styles.removeRowBtn}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addBulkScheduleRow}
                  style={styles.secondaryBtn}
                >
                  Add another row
                </button>
                <div style={styles.formButtons}>
                  <button type="submit" style={styles.submitBtn}>
                    Save all schedules
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} style={styles.form}>
                <h2 style={styles.formTitle}>
                  {editingId ? "Edit Schedule" : "Add New Schedule"}
                </h2>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  style={styles.input}
                />
                <input
                  type="time"
                  value={formData.time_from}
                  onChange={(e) =>
                    setFormData({ ...formData, time_from: e.target.value })
                  }
                  style={styles.input}
                />
                <input
                  type="time"
                  value={formData.time_to}
                  onChange={(e) =>
                    setFormData({ ...formData, time_to: e.target.value })
                  }
                  style={styles.input}
                />
                <input
                  type="text"
                  placeholder="Sector"
                  value={formData.sector}
                  onChange={(e) =>
                    setFormData({ ...formData, sector: e.target.value })
                  }
                  style={styles.input}
                />
                <select
                  value={formData.unit_id}
                  onChange={(e) =>
                    setFormData({ ...formData, unit_id: e.target.value })
                  }
                  style={styles.input}
                >
                  <option value="">Select Unit</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.unit_name}
                    </option>
                  ))}
                </select>
                <select
                  value={formData.personnel_id}
                  onChange={(e) =>
                    setFormData({ ...formData, personnel_id: e.target.value })
                  }
                  style={styles.input}
                >
                  <option value="">Select Personnel</option>
                  {personnel.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.fullname}
                    </option>
                  ))}
                </select>
                <div style={styles.formButtons}>
                  <button type="submit" style={styles.submitBtn}>
                    {editingId ? "Update" : "Create"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {loading ? (
          <div style={styles.loaderArea}>
            <Loader2
              size={28}
              style={{ animation: "spin 1s linear infinite" }}
            />
          </div>
        ) : (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.headerRow}>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Time From</th>
                  <th style={styles.th}>Time To</th>
                  <th style={styles.th}>Sector</th>
                  <th style={styles.th}>Unit</th>
                  <th style={styles.th}>Personnel</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id} style={styles.row}>
                    <td style={styles.td}>{s.date}</td>
                    <td style={styles.td}>{formatTime(s.time_from)}</td>
                    <td style={styles.td}>{formatTime(s.time_to)}</td>
                    <td style={styles.td}>{s.sector}</td>
                    <td style={styles.td}>{getUnitName(s.unit_id)}</td>
                    <td style={styles.td}>
                      {getPersonnelName(s.personnel_id)}
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleEdit(s)}
                        style={styles.iconBtn}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        style={{ ...styles.iconBtn, color: "#ef4444" }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#070d1a",
    color: "#f8fafc",
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: "24px",
  },
  container: {
    maxWidth: "1400px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "32px",
    paddingBottom: "24px",
    borderBottom: "1px solid rgba(30,41,59,0.8)",
  },
  backBtn: {
    width: "40px",
    height: "40px",
    borderRadius: "8px",
    border: "1px solid rgba(148,163,184,0.2)",
    color: "#f8fafc",
    background: "rgba(15,23,42,0.95)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: 700,
    flex: 1,
  },
  addBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    borderRadius: "8px",
    border: "1px solid rgba(59,130,246,0.3)",
    background: "rgba(37,99,235,0.12)",
    color: "#bfdbfe",
    cursor: "pointer",
    fontWeight: 600,
  },
  formContainer: {
    marginBottom: "32px",
    padding: "20px",
    background: "rgba(15,23,42,0.95)",
    borderRadius: "12px",
    border: "1px solid rgba(148,163,184,0.12)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  formTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 700,
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid rgba(148,163,184,0.2)",
    backgroundColor: "rgba(30,41,59,0.5)",
    color: "#f1f5f9",
    fontSize: "14px",
  },
  formButtons: {
    display: "flex",
    gap: "12px",
  },
  submitBtn: {
    flex: 1,
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid rgba(59,130,246,0.3)",
    background: "rgba(37,99,235,0.12)",
    color: "#bfdbfe",
    cursor: "pointer",
    fontWeight: 600,
  },
  cancelBtn: {
    flex: 1,
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid rgba(148,163,184,0.2)",
    background: "transparent",
    color: "#94a3b8",
    cursor: "pointer",
    fontWeight: 600,
  },
  bulkRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid rgba(148,163,184,0.12)",
    backgroundColor: "rgba(15,23,42,0.85)",
    marginBottom: "14px",
  },
  bulkFieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  bulkLabel: {
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: 600,
    letterSpacing: "0.4px",
    textTransform: "uppercase",
  },
  removeRowBtn: {
    gridColumn: "1 / -1",
    justifySelf: "flex-end",
    border: "1px solid rgba(239,68,68,0.25)",
    backgroundColor: "rgba(239,68,68,0.12)",
    color: "#fecaca",
    borderRadius: "8px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 600,
  },
  secondaryBtn: {
    width: "fit-content",
    border: "1px solid rgba(59,130,246,0.3)",
    background: "rgba(37,99,235,0.12)",
    color: "#bfdbfe",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
    marginBottom: "14px",
  },
  loaderArea: {
    display: "flex",
    justifyContent: "center",
    padding: "60px 20px",
  },
  tableContainer: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  headerRow: {
    borderBottom: "1px solid rgba(148,163,184,0.12)",
  },
  th: {
    padding: "16px",
    textAlign: "left",
    fontSize: "12px",
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  row: {
    borderBottom: "1px solid rgba(148,163,184,0.08)",
  },
  td: {
    padding: "16px",
    fontSize: "14px",
  },
  iconBtn: {
    background: "none",
    border: "none",
    color: "#60a5fa",
    cursor: "pointer",
    marginRight: "12px",
    padding: 0,
  },
};
