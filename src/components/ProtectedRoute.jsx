import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../api/supabase";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes (sign in/out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <Loader2 className="animate-spin" size={40} color="#3b82f6" />
        <p style={styles.loadingText}>VERIFYING CREDENTIALS...</p>
      </div>
    );
  }

  if (!session) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  return children;
}

const styles = {
  loadingScreen: {
    height: "100vh",
    width: "100vw",
    backgroundColor: "#0f172a",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "monospace",
    color: "#3b82f6",
  },
  loadingText: { marginTop: "20px", fontSize: "12px", letterSpacing: "2px" },
};
