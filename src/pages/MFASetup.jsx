import React, { useState, useEffect } from "react";
import { supabase } from "../api/supabase";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, Smartphone, Loader2 } from "lucide-react";

export default function MFASetup() {
  const [factorId, setFactorId] = useState(null);
  const [qrCodeData, setQrCodeData] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1: Create the MFA Factor
  const startEnrollment = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      issuer: "PNP Fleet Command",
      friendlyName: "Admin Authenticator",
    });

    if (data) {
      setFactorId(data.id);
      setQrCodeData(data.totp.qr_code); // This is the SVG/URI for the QR
    }
  };

  // Step 2: Verify the first code to "Activate" it
  const handleVerify = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: factorId,
      code: verifyCode,
    });

    if (error) {
      alert("Verification Failed: " + error.message);
    } else {
      alert("MFA Activated Successfully!");
      window.location.href = "/";
    }
    setLoading(false);
  };

  return (
    <div style={styles.setupCard}>
      <div style={styles.header}>
        <ShieldCheck size={32} color="#3b82f6" />
        <h2 style={styles.title}>Two-Factor Authentication</h2>
      </div>

      {!qrCodeData ? (
        <button onClick={startEnrollment} style={styles.primaryBtn}>
          BEGIN MFA ENROLLMENT
        </button>
      ) : (
        <div style={styles.qrSection}>
          <p style={styles.instruction}>Scan this with Google Authenticator:</p>
          <div style={styles.qrWrapper}>
            <QRCodeSVG
              value={qrCodeData}
              size={180}
              bgColor="#1e293b"
              fgColor="#fff"
            />
          </div>

          <input
            type="text"
            placeholder="Enter 6-digit code"
            style={styles.input}
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value)}
          />

          <button
            onClick={handleVerify}
            style={styles.primaryBtn}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              "VERIFY & ACTIVATE"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  setupCard: {
    backgroundColor: "#1e293b",
    padding: "30px",
    borderRadius: "12px",
    border: "1px solid #334155",
    textAlign: "center",
    maxWidth: "400px",
    margin: "40px auto",
  },
  title: { color: "#fff", fontSize: "18px", marginTop: "15px" },
  instruction: { color: "#94a3b8", fontSize: "12px", marginBottom: "20px" },
  qrWrapper: {
    backgroundColor: "#fff",
    padding: "15px",
    borderRadius: "8px",
    display: "inline-block",
    marginBottom: "20px",
  },
  input: {
    width: "100%",
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    padding: "12px",
    color: "#fff",
    borderRadius: "8px",
    textAlign: "center",
    letterSpacing: "4px",
    fontSize: "18px",
    marginBottom: "15px",
  },
  primaryBtn: {
    width: "100%",
    padding: "14px",
    backgroundColor: "#3b82f6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
