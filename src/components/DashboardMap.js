"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const DashboardMap = ({ sensorLocations, sensorData }) => {
  const customIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  return (
    <MapContainer
      center={[12.821921, 80.038187]}
      zoom={15}
      className="h-full w-full"
      zoomControl={false}
    >
      <ZoomControl position="bottomright" />
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="OpenStreetMap">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; Esri"
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      {sensorLocations.map((sensor, index) => (
        <Marker
          key={index}
          position={[sensor.latitude, sensor.longitude]}
          icon={customIcon}
        >
          <Popup>
            <div>
              <h3 className="font-bold">{sensor.name}</h3>
              {sensorData[sensor.name] && (
                <div className="text-sm">
                  <p>Temperature: {sensorData[sensor.name].temperature}°C</p>
                  <p>Moisture: {sensorData[sensor.name].moisture}%</p>
                  <p>N: {sensorData[sensor.name].npk?.nitrogen}</p>
                  <p>P: {sensorData[sensor.name].npk?.phosphorous}</p>
                  <p>K: {sensorData[sensor.name].npk?.potassium}</p>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default DashboardMap;