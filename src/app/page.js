'use client'

import { useEffect, useState, useRef } from 'react';
import mqtt from 'mqtt';
import dynamic from 'next/dynamic';

// Dynamically import the map component
const DashboardMapWithNoSSR = dynamic(
  () => import('@/components/DashboardMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[400px] flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }
);

export default function Dashboard() {
  const [sensorData, setSensorData] = useState({
    SOIL_SENSOR_1: { npk: { nitrogen: 0, phosphorous: 0, potassium: 0 }, moisture: 0, temperature: 0 },
    SOIL_SENSOR_2: { npk: { nitrogen: 0, phosphorous: 0, potassium: 0 }, moisture: 0, temperature: 0 },
    SOIL_SENSOR_3: { npk: { nitrogen: 0, phosphorous: 0, potassium: 0 }, moisture: 0, temperature: 0 }
  });
  const [sensorLocations, setSensorLocations] = useState([]);
  const [newSensor, setNewSensor] = useState({ name: '', latitude: '', longitude: '' });
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const clientRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const client = mqtt.connect(
      "wss://55bad6254a054c01ab7834d94ae5c3a0.s1.eu.hivemq.cloud:8884/mqtt",
      {
        username: "bombardilo",
        password: "Bombardilo1",
        reconnectPeriod: 1000,
      }
    );

    clientRef.current = client;

    const sensorIds = ['SOIL_SENSOR_1', 'SOIL_SENSOR_2', 'SOIL_SENSOR_3'];
    const topics = sensorIds.map(id => [
      `sensors/${id}/npk`,
      `sensors/${id}/moisture`,
      `sensors/${id}/temperature`
    ]).flat();

    client.on('connect', () => {
      console.log('Connected to MQTT broker');
      setConnected(true);
      
      client.subscribe(topics, (err) => {
        if (err) {
          console.error('Subscription error:', err);
          setError('Failed to subscribe to sensor topics');
        } else {
          console.log('Successfully subscribed to topics:', topics);
        }
      });
    });

    client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        console.log(`Raw message received on ${topic}:`, payload);
        
        // Extract sensor ID and type from topic
        const [, sensorId, dataType] = topic.split('/');
        
        setSensorData(prev => ({
          ...prev,
          [sensorId]: {
            ...prev[sensorId],
            [dataType]: dataType === 'npk' ? {
              nitrogen: payload.nitrogen,
              phosphorous: payload.phosphorous,
              potassium: payload.potassium
            } : dataType === 'moisture' ? 
              payload.moisture :
              payload.temperature
          }
        }));
      } catch (err) {
        console.error('Error processing message:', err);
        console.error('Topic:', topic);
        console.error('Raw message:', message.toString());
      }
    });

    client.on('error', (err) => {
      console.error('MQTT Error:', err.message);
      setError(`Connection error: ${err.message}`);
    });

    return () => {
      if (clientRef.current && clientRef.current.connected) {
        clientRef.current.unsubscribe(topics, () => {
          clientRef.current.end(true);
        });
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = JSON.parse(localStorage.getItem("sensorLocations") || "[]");
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

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-red-600 mb-4">
          <h2 className="text-xl font-bold">Connection Error</h2>
        </div>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="p-8 text-center bg-white rounded-lg shadow">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">
          Connecting to sensor system...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Soil Parameters Dashboard</h1>

      {/* Existing Sensor Data Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(sensorData).map(([sensorId, data]) => (
          <div key={sensorId} className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">{sensorId}</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-medium mb-2">NPK Values</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div>N: {data.npk?.nitrogen || 0}</div>
                  <div>P: {data.npk?.phosphorous || 0}</div>
                  <div>K: {data.npk?.potassium || 0}</div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-medium mb-2">Moisture</h3>
                <div>{data.moisture || 0}%</div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-medium mb-2">Temperature</h3>
                <div>{data.temperature || 0}°C</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
       {/* Add Sensor Form */}
       <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Add New Sensor Location</h2>
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
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Add Sensor
          </button>
        </form>
      </div>

       {/* Map Section */}
       <div className="mb-6 h-[400px] rounded-lg overflow-hidden shadow-lg">
        <DashboardMapWithNoSSR 
          sensorLocations={sensorLocations} 
          sensorData={sensorData} 
        />
      </div>
    </div>
  );
}
