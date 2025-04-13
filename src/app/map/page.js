"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";

export default function MapPage() {
  const [sensorLocations, setSensorLocations] = useState([]);

  useEffect(() => {
    // Only access localStorage after component mounts
    if (typeof window !== "undefined") {
      const stored = JSON.parse(
        localStorage.getItem("sensorLocations") || "[]"
      );
      setSensorLocations(stored);
    }
  }, []);

  const customIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  return (
    <div className="h-screen w-full">
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {sensorLocations.map((sensor, index) => (
          <Marker
            key={index}
            position={[sensor.latitude, sensor.longitude]}
            icon={customIcon}
          >
            <Popup>{sensor.name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
