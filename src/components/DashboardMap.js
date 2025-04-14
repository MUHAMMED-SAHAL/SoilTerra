"use client";

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, LayersControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { markerIcon, shadowIcon } from './CustomMarker';

// Create custom green marker icon
const customIcon = new L.Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(markerIcon)}`,
  shadowUrl: shadowIcon,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Create a separate component for map updates to avoid hydration issues
const MapUpdater = ({ bounds }) => {
  const map = useMap();
  
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds);
    }
  }, [bounds, map]);
  
  return null;
};

const DashboardMap = ({ sensorLocations, sensorData, weatherData }) => {
  const defaultCenter = [20.5937, 78.9629];
  const defaultZoom = 5;

  const bounds = useMemo(() => {
    if (sensorLocations.length > 0) {
      return L.latLngBounds(
        sensorLocations.map(sensor => [
          sensor.location.latitude,
          sensor.location.longitude
        ])
      );
    }
    return null;
  }, [sensorLocations]);

  return (
    <MapContainer
      key="map-container"
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
    >
      {bounds && <MapUpdater bounds={bounds} />}
      <ZoomControl position="bottomright" />
      
      <LayersControl position="topright">
        <LayersControl.BaseLayer name="OpenStreetMap">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            maxZoom={19}
          />
        </LayersControl.BaseLayer>
        
        <LayersControl.BaseLayer checked name="Satellite">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP'
            maxZoom={19}
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      {sensorLocations.map((sensor) => (
        <Marker
          key={sensor._id}
          position={[sensor.location.latitude, sensor.location.longitude]}
          icon={customIcon}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-gray-800">{sensor.name}</h3>
              <div className="text-sm text-gray-500 mb-2">{sensor.deviceId}</div>
              {sensorData[sensor.deviceId] && (
                <div className="text-sm space-y-1">
                  <div className="grid grid-cols-2 gap-2">
                    <p>Temperature: {sensorData[sensor.deviceId].temperature}°C</p>
                    <p>Moisture: {sensorData[sensor.deviceId].moisture}%</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <p>N: {sensorData[sensor.deviceId].npk?.nitrogen}</p>
                    <p>P: {sensorData[sensor.deviceId].npk?.phosphorous}</p>
                    <p>K: {sensorData[sensor.deviceId].npk?.potassium}</p>
                  </div>
                </div>
              )}
              {weatherData[sensor.deviceId] && (
                <div className="border-t border-gray-200 mt-2 pt-2">
                  <p className="font-semibold text-gray-700">Weather:</p>
                  <div className="grid grid-cols-2 gap-1 text-sm text-gray-600">
                    <p>{weatherData[sensor.deviceId].weatherCondition}</p>
                    <p>{weatherData[sensor.deviceId].humidity}% Humidity</p>
                    <p>{weatherData[sensor.deviceId].windSpeed} m/s</p>
                    <p>{weatherData[sensor.deviceId].precipitation} mm</p>
                  </div>
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