'use client'

import { useEffect, useState, useRef } from 'react';
import mqtt from 'mqtt';
import dynamic from 'next/dynamic';

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
  const [devices, setDevices] = useState([]);
  const [sensorData, setSensorData] = useState({});
  const [weatherData, setWeatherData] = useState({});
  const [newSensor, setNewSensor] = useState({ name: '', latitude: '', longitude: '' });
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [savingStates, setSavingStates] = useState({});
  const clientRef = useRef(null);

  // Fetch devices from MongoDB
  useEffect(() => {
    async function fetchDevices() {
      try {
        const response = await fetch('/api/sensors');
        if (!response.ok) throw new Error('Failed to fetch devices');
        const devices = await response.json();
        setDevices(devices);
        
        // Initialize sensor data structure
        const initialSensorData = {};
        devices.forEach(device => {
          initialSensorData[device.deviceId] = {
            npk: { nitrogen: 0, phosphorous: 0, potassium: 0 },
            moisture: 0,
            temperature: 0
          };
        });
        setSensorData(initialSensorData);
      } catch (err) {
        setError('Failed to load devices: ' + err.message);
      }
    }
    fetchDevices();
  }, []);

  // Handle MQTT connection and subscriptions
  useEffect(() => {
    if (devices.length === 0) return;

    const client = mqtt.connect(
      "wss://55bad6254a054c01ab7834d94ae5c3a0.s1.eu.hivemq.cloud:8884/mqtt",
      {
        username: "bombardilo",
        password: "Bombardilo1",
        reconnectPeriod: 1000,
      }
    );

    clientRef.current = client;

    // Create topics for all devices
    const topics = devices.flatMap(device => [
      `sensors/${device.deviceId}/npk`,
      `sensors/${device.deviceId}/moisture`,
      `sensors/${device.deviceId}/temperature`
    ]);

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

    client.on('message', async (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        const [, deviceId, dataType] = topic.split('/');
        
        // Store sensor data in MongoDB
        await fetch('/api/sensor-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            deviceId,
            type: dataType,
            payload
          })
        });

        // Update local state
        setSensorData(prev => ({
          ...prev,
          [deviceId]: {
            ...prev[deviceId],
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
  }, [devices]);

  const handleAddSensor = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/sensors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSensor)
      });

      if (!response.ok) {
        throw new Error('Failed to add sensor');
      }

      const device = await response.json();
      setDevices(prev => [...prev, device]);
      setNewSensor({ name: '', latitude: '', longitude: '' });
    } catch (err) {
      setError('Failed to add sensor: ' + err.message);
    }
  };

  const handleSaveData = async (device) => {
    try {
      setSavingStates(prev => ({ ...prev, [device.deviceId]: true }));
      
      const currentData = sensorData[device.deviceId];
      if (!currentData) {
        throw new Error('No data to save');
      }

      const response = await fetch('/api/sensor-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: device.deviceId,
          sensorData: currentData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save sensor data');
      }

      const { sensorData: savedSensorData, weatherData: savedWeatherData } = await response.json();
      
      // Update weather data state
      if (savedWeatherData) {
        setWeatherData(prev => ({
          ...prev,
          [device.deviceId]: savedWeatherData
        }));
      }

      setSavingStates(prev => ({ ...prev, [device.deviceId]: false }));
    } catch (err) {
      console.error('Failed to save sensor data:', err);
      setSavingStates(prev => ({ ...prev, [device.deviceId]: false }));
    }
  };

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="text-red-600 mb-4">
          <h2 className="text-xl font-bold">Error</h2>
        </div>
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          Retry
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

      {/* Sensor Data Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <div key={device._id} className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">{device.name}</h2>
                <div className="text-sm text-gray-500">ID: {device.deviceId}</div>
              </div>
              <button
                onClick={() => handleSaveData(device)}
                disabled={savingStates[device.deviceId]}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed"
              >
                {savingStates[device.deviceId] ? 'Saving...' : 'Save Data'}
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-medium mb-2">NPK Values</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div>N: {sensorData[device.deviceId]?.npk?.nitrogen || 0}</div>
                  <div>P: {sensorData[device.deviceId]?.npk?.phosphorous || 0}</div>
                  <div>K: {sensorData[device.deviceId]?.npk?.potassium || 0}</div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-medium mb-2">Moisture</h3>
                <div>{sensorData[device.deviceId]?.moisture || 0}%</div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-lg font-medium mb-2">Temperature</h3>
                <div>{sensorData[device.deviceId]?.temperature || 0}°C</div>
              </div>

              {weatherData[device.deviceId] && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-lg font-medium mb-2">Weather Conditions</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Condition: {weatherData[device.deviceId].weatherCondition}</div>
                    <div>Humidity: {weatherData[device.deviceId].humidity}%</div>
                    <div>Wind: {weatherData[device.deviceId].windSpeed} m/s {weatherData[device.deviceId].windDirection}</div>
                    <div>Precipitation: {weatherData[device.deviceId].precipitation} mm</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Add Sensor Form */}
      <div className="mt-8 mb-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Add New Sensor</h2>
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

      {/* Map */}
      <div className="h-[400px] rounded-lg overflow-hidden shadow-lg">
        <DashboardMapWithNoSSR 
          sensorLocations={devices} 
          sensorData={sensorData} 
          weatherData={weatherData}
        />
      </div>
    </div>
  );
}
