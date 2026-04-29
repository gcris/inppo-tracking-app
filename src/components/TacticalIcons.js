import L from "leaflet";

export const getTacticalIcon = (isActive) =>
  L.divIcon({
    className: "tactical-node",
    html: `<div style="background-color: ${isActive ? "#00ff00" : "#ff4444"}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 15px ${isActive ? "#00ff00" : "#ff4444"};"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
