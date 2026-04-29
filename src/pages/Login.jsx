import React, { useState } from "react";
import { supabase } from "../api/supabase";
import {
  Shield,
  Lock,
  User,
  Loader2,
  AlertCircle,
  Smartphone,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

export default function Login() {
  // UI States
  const [isMfaStep, setIsMfaStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");

  // --- STEP 1: INITIAL PASSWORD LOGIN ---
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // --- THE LOGIC CHECK ---
    // 1. Check if the user already has an MFA factor enrolled
    const { data: factors } = await supabase.auth.mfa.listFactors();

    console.log(factors);

    if (factors && factors.totp.length > 0) {
      // User is enrolled -> Show the "Enter 6-digit code" screen
      setIsMfaStep(true);
    } else {
      // User is NOT enrolled -> Redirect to a special Setup page
      // OR show a "Set up MFA" button
      window.location.href = "/mfa-setup";
    }
    setLoading(false);
  };

  // --- STEP 2: VERIFY GOOGLE AUTHENTICATOR CODE ---
  const handleMfaVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Get the list of factors for the user
    const { data: factors, error: factorsError } =
      await supabase.auth.mfa.listFactors();
    if (factorsError) {
      setError(factorsError.message);
      setLoading(false);
      return;
    }

    const totpFactor = factors.totp[0]; // Get the Google Authenticator factor
    if (!totpFactor) {
      setError("No Authenticator found for this account.");
      setLoading(false);
      return;
    }

    // 2. Challenge and Verify the 6-digit code
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: totpFactor.id,
      code: mfaCode,
    });

    if (verifyError) {
      setError("Invalid Authenticator Code");
      setLoading(false);
    } else {
      // MFA Success
      window.location.href = "/";
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        {/* HEADER */}
        <div style={styles.header}>
          <div style={styles.iconCircle}>
            {isMfaStep ? (
              <Smartphone size={32} color="#10b981" />
            ) : (
              <Shield size={32} color="#3b82f6" />
            )}
          </div>
          <h1 style={styles.title}>INPPO Tactical GPS Command Center</h1>
          <p style={styles.subtitle}>
            {isMfaStep
              ? "MULTI-FACTOR AUTHENTICATION"
              : "LAOAG CITY SECTOR • SECURE ACCESS"}
          </p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* --- PHASE 1: EMAIL & PASSWORD --- */}
        {!isMfaStep ? (
          <form onSubmit={handlePasswordLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <User size={18} style={styles.inputIcon} />
                <input
                  type="email"
                  placeholder="name@pnp.gov.ph"
                  style={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={18} style={styles.inputIcon} />
                <input
                  type="password"
                  placeholder="••••••••"
                  style={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" style={styles.loginBtn} disabled={loading}>
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Log in"
              )}
            </button>
          </form>
        ) : (
          /* --- PHASE 2: MFA CODE --- */
          <form onSubmit={handleMfaVerify} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>6-DIGIT AUTHENTICATOR CODE</label>
              <div style={styles.inputWrapper}>
                <Smartphone size={18} style={styles.inputIcon} />
                <input
                  type="text"
                  maxLength="6"
                  placeholder="000 000"
                  style={{
                    ...styles.input,
                    textAlign: "center",
                    letterSpacing: "8px",
                    fontSize: "20px",
                  }}
                  value={mfaCode}
                  onChange={(e) =>
                    setMfaCode(e.target.value.replace(/\D/g, ""))
                  }
                  autoFocus
                  required
                />
              </div>
              <p style={styles.mfaHint}>
                Open Google Authenticator on your mobile device.
              </p>
            </div>

            <button
              type="submit"
              style={{ ...styles.loginBtn, backgroundColor: "#10b981" }}
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "VERIFY & GRANT ACCESS"
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsMfaStep(false)}
              style={styles.backLink}
            >
              <ArrowLeft size={12} /> BACK TO PASSWORD
            </button>
          </form>
        )}

        <div style={styles.footer}>AUTHORIZED PERSONNEL ONLY</div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    width: "100vw",
    backgroundColor: "#0f172a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "monospace",
  },
  loginBox: {
    width: "100%",
    maxWidth: "400px",
    backgroundColor: "#1e293b",
    padding: "40px",
    borderRadius: "16px",
    border: "1px solid #334155",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
  },
  header: { textAlign: "center", marginBottom: "35px" },
  iconCircle: {
    backgroundColor: "#0f172a",
    width: "64px",
    height: "64px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
    border: "1px solid #334155",
  },
  title: {
    color: "#fff",
    fontSize: "22px",
    margin: "0 0 5px 0",
    letterSpacing: "2px",
    fontWeight: "bold",
  },
  subtitle: {
    color: "#64748b",
    fontSize: "10px",
    fontWeight: "bold",
    letterSpacing: "1px",
  },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { color: "#94a3b8", fontSize: "11px", fontWeight: "bold" },
  inputWrapper: { position: "relative" },
  inputIcon: {
    position: "absolute",
    left: "15px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#475569",
  },
  input: {
    width: "100%",
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "8px",
    padding: "12px 15px 12px 45px",
    color: "#fff",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.2s",
  },
  loginBtn: {
    marginTop: "10px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "14px",
    fontSize: "13px",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid #ef4444",
    color: "#ef4444",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "20px",
  },
  mfaHint: {
    fontSize: "10px",
    color: "#475569",
    textAlign: "center",
    marginTop: "5px",
  },
  backLink: {
    backgroundColor: "transparent",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "11px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    marginTop: "10px",
  },
  footer: {
    textAlign: "center",
    marginTop: "30px",
    color: "#475569",
    fontSize: "9px",
    letterSpacing: "1px",
  },
};
