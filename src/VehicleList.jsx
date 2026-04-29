import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { createClient } from '@supabase/supabase-js';
import L from 'leaflet';
import { Shield, Battery, Zap, Activity, Calendar, List, Play, RotateCcw, Loader2, ChevronRight, Truck } from 'lucide-react';

// --- CONFIGURATION ---
const supabase_url = "https://cfqzteyvvjxtojutzyur.supabase.co";
const supabase_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmcXp0ZXl2dmp4dG9qdXR6eXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3ODA2MTksImV4cCI6MjA4ODM1NjYxOX0.b1Q7e9cqgZ93o6pk5CiEuEP12bVy0ZVViZer2o4xPgM";
const supabase = createClient(supabase_url, supabase_key);

// --- SHARED STYLES ---
const theme = { bg: '#050505', panel: 'rgba(10,10,10,0.9)', accent: '#0088ff', success: '#00ff00', danger: '#ff4444', border: '#333', text: '#eee' };

// --- PAGE 1: VEHICLE LIST ---
const VehicleList = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([
    { id: 'ZAR-366', status: 'Active', battery: 100 },
    { id: 'ZAR-367', status: 'Offline', battery: 85 },
    { id: 'ZAR-368', status: 'Active', battery: 42 }
  ]);

  return (
    <div style={{ padding: '40px', backgroundColor: theme.bg, minHeight: '100vh', color: theme.text, fontFamily: 'monospace' }}>
      <h1 style={{ color: theme.accent, marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Shield size={32} /> FLEET COMMAND CENTER
      </h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {vehicles.map(v => (
          <div key={v.id} onClick={() => navigate(`/track/${v.id}`)} style={vehicleCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Truck size={24} color={v.status === 'Active' ? theme.success : '#555'} />
                <h2 style={{ margin: 0 }}>{v.id}</h2>
              </div>
              <ChevronRight size={20} color="#555" />
            </div>
            <div style={{ marginTop: '15px', fontSize: '12px', color: '#888' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>STATUS:</span>
                <span style={{ color: v.status === 'Active' ? theme.success : theme.danger }}>{v.status.toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>BATTERY:</span>
                <span>{v.battery}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};