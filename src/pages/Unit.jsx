import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Loader as Loader2,
} from "lucide-react";
import { getUnits, createUnit, updateUnit, deleteUnit } from "../api/crud";

export default function Unit() {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ unit_name: "" });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const loadUnits = async () => {
    setLoading(true);
    const { data, error } = await getUnits();
    if (!error && data) {
      setUnits(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUnits();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.unit_name.trim()) return;

    if (editingId) {
      const { error } = await updateUnit(editingId, formData);
      if (!error) {
        setEditingId(null);
        setFormData({ unit_name: "" });
        setShowForm(false);
        loadUnits();
      }
    } else {
      const { error } = await createUnit(formData);
      if (!error) {
        setFormData({ unit_name: "" });
        setShowForm(false);
        loadUnits();
      }
    }
  };

  const handleEdit = (unit) => {
    setFormData({ unit_name: unit.unit_name });
    setEditingId(unit.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this unit?")) {
      const { error } = await deleteUnit(id);
      if (!error) {
        loadUnits();
      }
    }
  };

  const handleCancel = () => {
    setFormData({ unit_name: "" });
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
          <h1 style={styles.title}>Unit Management</h1>
          <button
            onClick={() => setShowForm(true)}
            style={styles.addBtn}
            title="Add new unit"
          >
            <Plus size={18} />
            Add Unit
          </button>
        </header>

        {showForm && (
          <div style={styles.formContainer}>
            <form onSubmit={handleSubmit} style={styles.form}>
              <h2 style={styles.formTitle}>
                {editingId ? "Edit Unit" : "Add New Unit"}
              </h2>
              <input
                type="text"
                placeholder="Unit Name"
                value={formData.unit_name}
                onChange={(e) => setFormData({ unit_name: e.target.value })}
                style={styles.input}
              />
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
                  <th style={styles.th}>Unit Name</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => (
                  <tr key={unit.id} style={styles.row}>
                    <td style={styles.td}>{unit.unit_name}</td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleEdit(unit)}
                        style={styles.iconBtn}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(unit.id)}
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
    overflow: "x",
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
