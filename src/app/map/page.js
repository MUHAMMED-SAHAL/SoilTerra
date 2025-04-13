"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from "react";

// Dynamically import the map component to avoid SSR issues
const MapWithNoSSR = dynamic(
  () => import('../components/MapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }
);

export default function MapPage() {
  const [sensorLocations, setSensorLocations] = useState([]);
  const [newSensor, setNewSensor] = useState({ name: '', latitude: '', longitude: '' });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = JSON.parse(
        localStorage.getItem("sensorLocations") || "[]"
      );
      setSensorLocations(stored);
    }
  }, []);

  const handleAddSensor = (e) => {
    e.preventDefault();
    const updatedLocations = [...sensorLocations, newSensor];
    setSensorLocations(updatedLocations);
    localStorage.setItem("sensorLocations", JSON.stringify(updatedLocations));
    setNewSensor({ name: '', latitude: '', longitude: '' });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sensor Locations Map</h1>
        <div className="bg-white p-4 rounded-lg shadow">
          <form onSubmit={handleAddSensor} className="flex gap-4">
            <input
              type="text"
              placeholder="Sensor Name"
              value={newSensor.name}
              onChange={(e) => setNewSensor({...newSensor, name: e.target.value})}
              className="border p-2 rounded"
              required
            />
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={newSensor.latitude}
              onChange={(e) => setNewSensor({...newSensor, latitude: parseFloat(e.target.value)})}
              className="border p-2 rounded"
              required
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={newSensor.longitude}
              onChange={(e) => setNewSensor({...newSensor, longitude: parseFloat(e.target.value)})}
              className="border p-2 rounded"
              required
            />
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Add Sensor
            </button>
          </form>
        </div>
      </div>

      <div className="h-[calc(100vh-12rem)] w-full rounded-lg overflow-hidden shadow-lg">
        <MapWithNoSSR sensorLocations={sensorLocations} />
      </div>
    </div>
  );
}
