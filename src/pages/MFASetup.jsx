import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../api/supabase";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, Loader as Loader2, CircleAlert as AlertCircle, CircleCheck as CheckCircle2 } from "lucide-react";

export default function MFASetup() {
  const navigate = useNavigate();
  const [factorId, setFactorId] = useState(null);
  const [qrCodeData, setQrCodeData] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startEnrollment = async () => {
    setError(null);
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      issuer: "PNP Fleet Command",
      friendlyName: "Admin Authenticator",
    });

    if (enrollError) {
      setError(enrollError.message);
      return;
    }

    if (data) {
      setFactorId(data.id);
      setQrCodeData(data.totp.qr_code);
    }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      setError("Please enter a 6-digit code.");
      return;
    }
    setLoading(true);
    setError(null);

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: verifyCode,
    });

    if (verifyError) {
      setError("Verification failed: " + verifyError.message);
      setLoading(false);
    } else {
      navigate("/", { replace: true });
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.backdrop} />
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconBox}>
            <ShieldCheck size={28} color="#3b82f6" />
          </div>
          <h2 style={styles.title}>Two-Factor Authentication</h2>
          <p style={styles.subtitle}>Secure your account with Google Authenticator</p>
        </div>

        {error && (
          <div style={styles.errorBox} role="alert">
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {!qrCodeData ? (
          <div style={styles.section}>
            <p style={styles.description}>
              You need to set up two-factor authentication before accessing the system.
              Click below to begin enrollment.
            </p>
            <button onClick={startEnrollment} style={styles.primaryBtn}>
              Begin MFA Enrollment
            </button>
          </div>
        ) : (
          <div style={styles.section}>
            <div style={styles.steps}>
              <div style={styles.step}>
                <span style={styles.stepNum}>1</span>
                <span style={styles.stepText}>Open Google Authenticator on your phone</span>
              </div>
              <div style={styles.step}>
                <span style={styles.stepNum}>2</span>
                <span style={styles.stepText}>Tap "+" and scan the QR code below</span>
              </div>
              <div style={styles.step}>
                <span style={styles.stepNum}>3</span>
                <span style={styles.stepText}>Enter the 6-digit code to activate</span>
              </div>
            </div>

            <div style={styles.qrWrapper}>
              <QRCodeSVG value={qrCodeData} size={160} bgColor="#fff" fgColor="#0f172a" />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="verify-code" style={styles.label}>Verification Code</label>
              <input
                id="verify-code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                style={styles.input}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                autoComplete="one-time-code"
              />
            </div>

            <button
              onClick={handleVerify}
              style={{ ...styles.primaryBtn, backgroundColor: "#059669", opacity: loading ? 0.7 : 1 }}
              disabled={loading || verifyCode.length !== 6}
            >
              {loading ? (
                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <CheckCircle2 size={14} />
              )}
              {loading ? "Verifying..." : "Verify & Activate"}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #475569; }
        input:focus { border-color: #3b82f6 !important; outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,0.15) !important; }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#070d1a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: "20px",
    position: "relative",
    overflow: "hidden",
  },
  backdrop: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(ellipse at 50% 30%, rgba(59,130,246,0.08) 0%, transparent 60%)",
    pointerEvents: "none",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "#0f1f36",
    padding: "40px",
    borderRadius: "20px",
    border: "1px solid rgba(59,130,246,0.2)",
    boxShadow: "0 32px 64px rgba(0,0,0,0.6)",
    position: "relative",
    zIndex: 1,
  },
  header: {
    textAlign: "center",
    marginBottom: "28px",
  },
  iconBox: {
    background: "linear-gradient(135deg, #1e3a5f, #0f2340)",
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
    border: "1px solid rgba(59,130,246,0.3)",
    boxShadow: "0 4px 20px rgba(59,130,246,0.2)",
  },
  title: {
    color: "#f1f5f9",
    fontSize: "20px",
    fontWeight: "700",
    margin: "0 0 6px",
    letterSpacing: "-0.3px",
  },
  subtitle: {
    color: "#64748b",
    fontSize: "13px",
    margin: 0,
  },
  errorBox: {
    backgroundColor: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.3)",
    color: "#fca5a5",
    padding: "12px 14px",
    borderRadius: "10px",
    fontSize: "13px",
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    marginBottom: "20px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  description: {
    color: "#94a3b8",
    fontSize: "14px",
    lineHeight: "1.6",
    margin: 0,
    textAlign: "center",
  },
  steps: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  step: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  stepNum: {
    backgroundColor: "rgba(37,99,235,0.15)",
    color: "#60a5fa",
    width: "22px",
    height: "22px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "700",
    flexShrink: 0,
    border: "1px solid rgba(59,130,246,0.25)",
  },
  stepText: {
    fontSize: "13px",
    color: "#94a3b8",
    lineHeight: "1.5",
    paddingTop: "3px",
  },
  qrWrapper: {
    backgroundColor: "#fff",
    padding: "16px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    color: "#94a3b8",
    fontSize: "12px",
    fontWeight: "600",
    letterSpacing: "0.4px",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    backgroundColor: "#0a1628",
    border: "1px solid #1e3a5f",
    borderRadius: "10px",
    padding: "13px 14px",
    color: "#f1f5f9",
    fontSize: "22px",
    fontWeight: "700",
    letterSpacing: "12px",
    textAlign: "center",
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "monospace",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  primaryBtn: {
    width: "100%",
    padding: "14px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontFamily: "inherit",
    transition: "opacity 0.2s",
    letterSpacing: "0.2px",
  },
};
