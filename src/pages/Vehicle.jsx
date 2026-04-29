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
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getUnits,
  getPersonnel,
} from "../api/crud";

export default function Vehicle() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [units, setUnits] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    plate_number: "",
    unit_id: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [v, u, p] = await Promise.all([
      getVehicles(),
      getUnits(),
      getPersonnel(),
    ]);
    if (v.data) setVehicles(v.data);
    if (u.data) setUnits(u.data);
    if (p.data) setPersonnel(p.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.plate_number.trim() || !formData.unit_id) return;

    const payload = {
      plate_number: formData.plate_number,
      unit_id: formData.unit_id,
    };

    if (editingId) {
      const { error } = await updateVehicle(editingId, payload);
      if (!error) {
        setEditingId(null);
        setFormData({ plate_number: "", unit_id: "" });
        setShowForm(false);
        loadData();
      }
    } else {
      const { error } = await createVehicle(payload);
      if (!error) {
        setFormData({ plate_number: "", unit_id: "" });
        setShowForm(false);
        loadData();
      }
    }
  };

  const handleEdit = (vehicle) => {
    setFormData({
      plate_number: vehicle.plate_number,
      unit_id: vehicle.unit_id || "",
    });
    setEditingId(vehicle.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this vehicle?")) {
      const { error } = await deleteVehicle(id);
      if (!error) {
        loadData();
      }
    }
  };

  const handleCancel = () => {
    setFormData({ plate_number: "", unit_id: "" });
    setEditingId(null);
    setShowForm(false);
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
          <h1 style={styles.title}>Vehicle Management</h1>
          <button
            onClick={() => setShowForm(true)}
            style={styles.addBtn}
            title="Add new vehicle"
          >
            <Plus size={18} />
            Add Vehicle
          </button>
        </header>

        {showForm && (
          <div style={styles.formContainer}>
            <form onSubmit={handleSubmit} style={styles.form}>
              <h2 style={styles.formTitle}>
                {editingId ? "Edit Vehicle" : "Add New Vehicle"}
              </h2>
              <input
                type="text"
                placeholder="Plate Number"
                value={formData.plate_number}
                onChange={(e) =>
                  setFormData({ ...formData, plate_number: e.target.value })
                }
                style={styles.input}
              />
              <select
                value={formData.unit_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    unit_id: e.target.value,
                  })
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
                  <th style={styles.th}>Plate</th>
                  <th style={styles.th}>Unit/Station</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} style={styles.row}>
                    <td style={styles.td}>{vehicle.plate_number}</td>
                    <td style={styles.td}>
                      {vehicle.unit ? `${vehicle.unit.unit_name}` : "N/A"}
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleEdit(vehicle)}
                        style={styles.iconBtn}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle.id)}
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
    maxWidth: "1000px",
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
