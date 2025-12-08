import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, {
      duration: 1.5,
    });
  }, [center, zoom, map]);
  return null;
};

const MapDisplay = ({ position }) => {
  if (!position || !position[0] || !position[1]) {
    return null;
  }

  const zoomLevel = 15;

  return (
    <div className="relative z-10 mt-4 border rounded-lg overflow-hidden shadow-md">
      <MapContainer
        center={position}
        zoom={zoomLevel}
        style={{ height: "400px", width: "100%" }}
      >
        <ChangeView center={position} zoom={zoomLevel} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>Vị trí của công ty.</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default MapDisplay;
