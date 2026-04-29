import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Tracker from "./pages/Tracker";
import FleetMap from "./pages/FleetMap";
import Login from "./pages/Login";
import MFASetup from "./pages/MFASetup";
import Unit from "./pages/Unit";
import Personnel from "./pages/Personnel";
import Schedule from "./pages/Schedule";
import Vehicle from "./pages/Vehicle";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<Login />} />
        <Route path="/mfa-setup" element={<MFASetup />} />

        {/* PROTECTED ROUTES */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/track-all"
          element={
            <ProtectedRoute>
              <FleetMap />
            </ProtectedRoute>
          }
        />

        <Route
          path="/track/:vehicleId"
          element={
            <ProtectedRoute>
              <Tracker />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manage/units"
          element={
            <ProtectedRoute>
              <Unit />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manage/personnel"
          element={
            <ProtectedRoute>
              <Personnel />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manage/schedule"
          element={
            <ProtectedRoute>
              <Schedule />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manage/vehicles"
          element={
            <ProtectedRoute>
              <Vehicle />
            </ProtectedRoute>
          }
        />

        {/* CATCH ALL: Redirect unknown paths to Dashboard (which will trigger auth check) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
