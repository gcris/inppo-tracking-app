import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../api/supabase";
import { Shield, Lock, User, Loader as Loader2, CircleAlert as AlertCircle, Smartphone, ArrowLeft } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [isMfaStep, setIsMfaStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const { data: factors } = await supabase.auth.mfa.listFactors();

    if (factors && factors.totp.length > 0) {
      setIsMfaStep(true);
    } else {
      navigate("/mfa-setup", { replace: true });
    }
    setLoading(false);
  };

  const handleMfaVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) {
      setError(factorsError.message);
      setLoading(false);
      return;
    }

    const totpFactor = factors.totp[0];
    if (!totpFactor) {
      setError("No Authenticator found for this account.");
      setLoading(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: totpFactor.id,
      code: mfaCode,
    });

    if (verifyError) {
      setError("Invalid Authenticator Code. Please try again.");
      setLoading(false);
    } else {
      navigate("/", { replace: true });
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.backdrop} />

      <div style={styles.loginBox}>
        <div style={styles.header}>
          <div style={isMfaStep ? styles.iconCircleGreen : styles.iconCircle}>
            {isMfaStep ? (
              <Smartphone size={28} color="#10b981" />
            ) : (
              <Shield size={28} color="#3b82f6" />
            )}
          </div>
          <h1 style={styles.title}>
            {isMfaStep ? "Authenticator Verification" : "INPPO Command Center"}
          </h1>
          <p style={styles.subtitle}>
            {isMfaStep
              ? "Enter the 6-digit code from your authenticator app"
              : "Laoag City Sector — Secure Access Portal"}
          </p>
        </div>

        {error && (
          <div style={styles.errorBox} role="alert">
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {!isMfaStep ? (
          <form onSubmit={handlePasswordLogin} style={styles.form} noValidate>
            <div style={styles.inputGroup}>
              <label htmlFor="email" style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <User size={16} style={styles.inputIcon} aria-hidden="true" />
                <input
                  id="email"
                  type="email"
                  placeholder="officer@pnp.gov.ph"
                  style={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="password" style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={16} style={styles.inputIcon} aria-hidden="true" />
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  style={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" style={styles.loginBtn} disabled={loading}>
              {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMfaVerify} style={styles.form} noValidate>
            <div style={styles.inputGroup}>
              <label htmlFor="mfa-code" style={styles.label}>6-Digit Authenticator Code</label>
              <div style={styles.inputWrapper}>
                <Smartphone size={16} style={styles.inputIcon} aria-hidden="true" />
                <input
                  id="mfa-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  style={styles.mfaInput}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  autoFocus
                  autoComplete="one-time-code"
                  required
                />
              </div>
              <p style={styles.hint}>Open Google Authenticator on your mobile device.</p>
            </div>

            <button
              type="submit"
              style={{ ...styles.loginBtn, backgroundColor: "#059669" }}
              disabled={loading || mfaCode.length !== 6}
            >
              {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : "Verify & Grant Access"}
            </button>

            <button
              type="button"
              onClick={() => { setIsMfaStep(false); setError(null); setMfaCode(""); }}
              style={styles.backLink}
            >
              <ArrowLeft size={12} style={{ marginRight: 4 }} />
              Back to password
            </button>
          </form>
        )}

        <div style={styles.footer}>
          <div style={styles.footerDivider} />
          <span>Authorized Personnel Only</span>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #475569; }
        input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.15) !important; outline: none; }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    width: "100%",
    backgroundColor: "#070d1a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: "20px",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
  },
  backdrop: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(16,185,129,0.06) 0%, transparent 50%)",
    pointerEvents: "none",
  },
  loginBox: {
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "#0f1f36",
    padding: "40px",
    borderRadius: "20px",
    border: "1px solid rgba(59,130,246,0.2)",
    boxShadow: "0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03) inset",
    position: "relative",
    zIndex: 1,
  },
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  iconCircle: {
    background: "linear-gradient(135deg, #1e3a5f, #0f2340)",
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 18px",
    border: "1px solid rgba(59,130,246,0.3)",
    boxShadow: "0 4px 20px rgba(59,130,246,0.2)",
  },
  iconCircleGreen: {
    background: "linear-gradient(135deg, #0d3327, #071e17)",
    width: "60px",
    height: "60px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 18px",
    border: "1px solid rgba(16,185,129,0.3)",
    boxShadow: "0 4px 20px rgba(16,185,129,0.15)",
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
    lineHeight: "1.5",
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
    lineHeight: "1.4",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
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
  inputWrapper: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#475569",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    backgroundColor: "#0a1628",
    border: "1px solid #1e3a5f",
    borderRadius: "10px",
    padding: "13px 14px 13px 42px",
    color: "#f1f5f9",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "inherit",
  },
  mfaInput: {
    width: "100%",
    backgroundColor: "#0a1628",
    border: "1px solid #1e3a5f",
    borderRadius: "10px",
    padding: "14px 14px 14px 42px",
    color: "#f1f5f9",
    fontSize: "24px",
    fontWeight: "700",
    letterSpacing: "12px",
    textAlign: "center",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "monospace",
  },
  hint: {
    fontSize: "12px",
    color: "#475569",
    margin: "4px 0 0",
  },
  loginBtn: {
    marginTop: "6px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "14px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "background-color 0.2s, opacity 0.2s",
    letterSpacing: "0.2px",
    fontFamily: "inherit",
  },
  backLink: {
    backgroundColor: "transparent",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px",
    fontFamily: "inherit",
    transition: "color 0.2s",
  },
  footer: {
    textAlign: "center",
    marginTop: "28px",
    color: "#334155",
    fontSize: "11px",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    alignItems: "center",
  },
  footerDivider: {
    width: "40px",
    height: "1px",
    backgroundColor: "#1e293b",
  },
};
