import L from "leaflet";

export const getTacticalIcon = (isActive) =>
  L.divIcon({
    className: "tactical-node",
    html: `
      <div style="
        width: 20px;
        height: 12px;
        background-color: ${isActive ? "#00ff00" : "#ff4444"};
        border-radius: 2px;
        position: relative;
        border: 1px solid #fff;
        box-shadow: 0 0 5px ${isActive ? "#00ff00" : "#ff4444"};
      ">
        <div style="
          width: 4px;
          height: 4px;
          background-color: #333;
          border-radius: 50%;
          position: absolute;
          bottom: -2px;
          left: 2px;
        "></div>
        <div style="
          width: 4px;
          height: 4px;
          background-color: #333;
          border-radius: 50%;
          position: absolute;
          bottom: -2px;
          right: 2px;
        "></div>
      </div>
    `,
    iconSize: [20, 16],
    iconAnchor: [10, 8],
  });
