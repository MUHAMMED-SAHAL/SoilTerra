"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function USMap() {
  const [sensorLocations, setSensorLocations] = useState([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // Ensures this runs only on the client

    const stored = localStorage.getItem("sensorLocations");
    if (stored) {
      setSensorLocations(JSON.parse(stored));
    }
  }, []);

  if (!isClient) return null; // Prevents SSR crash

  return (
    <div className="w-full h-[500px] rounded-xl overflow-hidden shadow-lg mt-6">
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={4}
        className="w-full h-full"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {sensorLocations.map((sensor, idx) => (
          <Marker
            key={idx}
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
