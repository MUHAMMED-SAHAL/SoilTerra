"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, LayersControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const DashboardMap = ({ sensorLocations, sensorData, weatherData }) => {
  // Debug logging
  useEffect(() => {
    console.log('Sensor Locations:', sensorLocations);
    console.log('Sensor Data:', sensorData);
    console.log('Weather Data:', weatherData);
  }, [sensorLocations, sensorData, weatherData]);

  const customIcon = new L.Icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  // Calculate center and bounds if there are sensors
  const defaultCenter = [12.821921, 80.038187];
  const defaultZoom = 15;
  
  const bounds = sensorLocations.length > 0 
    ? L.latLngBounds(sensorLocations.map(sensor => [sensor.location.latitude, sensor.location.longitude]))
    : null;

  const UpdateMapView = ({ bounds }) => {
    const map = useMap();
    useEffect(() => {
      if (bounds) {
        map.fitBounds(bounds);
      }
    }, [map, bounds]);
    return null;
  };

  return (
    <MapContainer
      center={bounds ? bounds.getCenter() : defaultCenter}
      zoom={defaultZoom}
      className="h-full w-full"
      zoomControl={false}
      {...(bounds && { bounds: bounds })}
    >
      {bounds && <UpdateMapView bounds={bounds} />}
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
      {sensorLocations.map((sensor) => (
        <Marker
          key={sensor._id}
          position={[sensor.location.latitude, sensor.location.longitude]}
          icon={customIcon}
        >
          <Popup>
            <div>
              <h3 className="font-bold">{sensor.name}</h3>
              <div className="text-sm text-gray-500 mb-2">{sensor.deviceId}</div>
              {sensorData[sensor.deviceId] && (
                <div className="text-sm space-y-2">
                  <div>
                    <p>Temperature: {sensorData[sensor.deviceId].temperature}°C</p>
                    <p>Moisture: {sensorData[sensor.deviceId].moisture}%</p>
                    <p>N: {sensorData[sensor.deviceId].npk?.nitrogen}</p>
                    <p>P: {sensorData[sensor.deviceId].npk?.phosphorous}</p>
                    <p>K: {sensorData[sensor.deviceId].npk?.potassium}</p>
                  </div>
                  {weatherData && weatherData[sensor.deviceId] && (
                    <div className="border-t pt-2 mt-2">
                      <p className="font-semibold">Weather Conditions:</p>
                      <p>{weatherData[sensor.deviceId].weatherCondition}</p>
                      <p>Humidity: {weatherData[sensor.deviceId].humidity}%</p>
                      <p>Wind: {weatherData[sensor.deviceId].windSpeed} m/s {weatherData[sensor.deviceId].windDirection}</p>
                      <p>Precipitation: {weatherData[sensor.deviceId].precipitation} mm</p>
                    </div>
                  )}
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