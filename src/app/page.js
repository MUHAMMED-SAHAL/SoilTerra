'use client'

import { useEffect, useState, useRef } from 'react';
import mqtt from 'mqtt';
import dynamic from 'next/dynamic';
import { FaSeedling, FaThermometerHalf, FaTint, FaMapMarkerAlt, FaMapMarked, FaChartBar } from 'react-icons/fa';
import { GiGroundSprout, GiWheat } from 'react-icons/gi';

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
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'map'
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

    console.log('Attempting to connect to MQTT broker...');
    
    const client = mqtt.connect(
      "wss://55bad6254a054c01ab7834d94ae5c3a0.s1.eu.hivemq.cloud:8884/mqtt",
      {
        username: "bombardilo",
        password: "Bombardilo1",
        reconnectPeriod: 1000,
        keepalive: 60,
        connectTimeout: 4000,
        rejectUnauthorized: false
      }
    );

    clientRef.current = client;

    client.on('connecting', () => {
      console.log('Connecting to MQTT broker...');
    });

    client.on('connect', () => {
      console.log('Connected to MQTT broker successfully');
      setConnected(true);
      
      const topics = devices.flatMap(device => [
        `sensors/${device.deviceId}/npk`,
        `sensors/${device.deviceId}/moisture`,
        `sensors/${device.deviceId}/temperature`
      ]);
      
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
      console.error('MQTT Error:', err);
      setError(`MQTT Connection error: ${err.message}`);
      setConnected(false);
    });

    client.on('close', () => {
      console.log('MQTT connection closed');
      setConnected(false);
    });

    client.on('offline', () => {
      console.log('MQTT client is offline');
      setConnected(false);
    });

    return () => {
      if (clientRef.current) {
        console.log('Cleaning up MQTT connection...');
        clientRef.current.end(true, () => {
          console.log('MQTT connection cleaned up');
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
      <div className="min-h-screen bg-gradient-to-br from-[#1a1f1c] via-[#232823] to-[#1a1f1c] p-4 md:p-8">
        <div className="max-w-md mx-auto bg-black/20 backdrop-blur-lg rounded-xl shadow-2xl border border-green-900/30 p-8">
          <div className="text-red-400 mb-4">
            <h2 className="text-xl font-bold">Error</h2>
          </div>
          <p className="text-gray-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white rounded-lg transition-all duration-300 shadow-lg hover:shadow-green-500/20"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1f1c] via-[#232823] to-[#1a1f1c] p-4 md:p-8">
        <div className="max-w-md mx-auto bg-black/20 backdrop-blur-lg rounded-xl shadow-2xl border border-green-900/30 p-8 text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-green-500 border-r-transparent"></div>
          <p className="mt-4 text-green-400 font-medium">
            Connecting to sensor system...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1f1c] via-[#232823] to-[#1a1f1c] text-gray-200 p-4 md:p-6">
      {/* Header with View Toggle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <GiWheat className="text-3xl text-green-500" />
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            SoilTerra Dashboard
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
              view === 'dashboard'
                ? 'bg-green-600 text-white'
                : 'bg-black/30 text-green-400 hover:bg-black/40'
            }`}
          >
            <FaChartBar />
            Dashboard
          </button>
          <button
            onClick={() => setView('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
              view === 'map'
                ? 'bg-green-600 text-white'
                : 'bg-black/30 text-green-400 hover:bg-black/40'
            }`}
          >
            <FaMapMarked />
            Map View
          </button>
        </div>
      </div>

      {view === 'dashboard' ? (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-black/20 p-4 rounded-lg border border-green-900/20">
              <div className="text-2xl font-bold text-green-400">{devices.length}</div>
              <div className="text-sm text-gray-400">Active Sensors</div>
            </div>
            <div className="bg-black/20 p-4 rounded-lg border border-green-900/20">
              <div className="text-2xl font-bold text-green-400">
                {(Object.values(sensorData).reduce((acc, curr) => acc + (curr.moisture || 0), 0) / devices.length || 0).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Avg Moisture</div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-12 gap-8">
            {/* Sensor List */}
            <div className="col-span-12 xl:col-span-9">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {devices.map((device) => (
                  <div key={device._id} className="group">
                    <div className="bg-black/20 backdrop-blur-lg p-6 rounded-xl shadow-2xl border border-green-900/30 hover:border-green-800/50 transition-all duration-300">
                      {/* Sensor Header */}
                      <div className="flex justify-between items-start gap-4 mb-6">
                        <div>
                          <h2 className="text-xl font-semibold text-green-400 flex items-center gap-2 mb-1">
                            <FaSeedling className="text-green-500" />
                            {device.name}
                          </h2>
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                            Active • ID: {device.deviceId}
                          </div>
                        </div>
                        <button
                          onClick={() => handleSaveData(device)}
                          disabled={savingStates[device.deviceId]}
                          className="bg-black/30 hover:bg-black/40 text-green-400 px-3 py-1.5 rounded-lg text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {savingStates[device.deviceId] ? (
                            <>
                              <div className="w-3 h-3 border-2 border-green-400 border-r-transparent rounded-full animate-spin"></div>
                              Saving
                            </>
                          ) : 'Save Data'}
                        </button>
                      </div>

                      {/* Sensor Data */}
                      <div className="space-y-4">
                        {/* NPK Values */}
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: 'N', value: sensorData[device.deviceId]?.npk?.nitrogen || 0 },
                            { label: 'P', value: sensorData[device.deviceId]?.npk?.phosphorous || 0 },
                            { label: 'K', value: sensorData[device.deviceId]?.npk?.potassium || 0 }
                          ].map(({ label, value }) => (
                            <div key={label} className="bg-black/30 p-3 rounded-lg text-center">
                              <div className="text-green-400 text-lg font-semibold">{value}</div>
                              <div className="text-xs text-gray-400">{label}</div>
                            </div>
                          ))}
                        </div>

                        {/* Moisture & Temperature */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-black/30 p-3 rounded-lg text-center">
                            <div className="text-green-400 text-lg font-semibold">
                              {sensorData[device.deviceId]?.moisture || 0}%
                            </div>
                            <div className="text-xs text-gray-400">Moisture</div>
                          </div>
                          <div className="bg-black/30 p-3 rounded-lg text-center">
                            <div className="text-green-400 text-lg font-semibold">
                              {sensorData[device.deviceId]?.temperature || 0}°C
                            </div>
                            <div className="text-xs text-gray-400">Temperature</div>
                          </div>
                        </div>

                        {/* Weather Data */}
                        {weatherData[device.deviceId] && (
                          <div className="bg-black/30 p-3 rounded-lg">
                            <div className="text-xs text-gray-400 mb-2">Weather Conditions</div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="text-sm text-gray-300">{weatherData[device.deviceId].weatherCondition}</div>
                              <div className="text-sm text-gray-300">Humidity: {weatherData[device.deviceId].humidity}%</div>
                              <div className="text-sm text-gray-300">Wind: {weatherData[device.deviceId].windSpeed} m/s</div>
                              <div className="text-sm text-gray-300">Rain: {weatherData[device.deviceId].precipitation} mm</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Sensor Form - Sidebar */}
            <div className="col-span-12 xl:col-span-3">
              <div className="bg-black/20 backdrop-blur-lg p-6 rounded-xl shadow-2xl border border-green-900/30 sticky top-6">
                <h2 className="text-xl font-semibold mb-4 text-green-400 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-green-500" />
                  Add New Sensor
                </h2>
                <form onSubmit={handleAddSensor} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Sensor Name"
                    value={newSensor.name}
                    onChange={(e) => setNewSensor({...newSensor, name: e.target.value})}
                    className="w-full bg-black/30 border border-green-900/30 p-2.5 rounded-lg text-sm text-gray-200 focus:border-green-500/50 focus:outline-none placeholder-gray-500"
                    required
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={newSensor.latitude}
                    onChange={(e) => setNewSensor({...newSensor, latitude: parseFloat(e.target.value)})}
                    className="w-full bg-black/30 border border-green-900/30 p-2.5 rounded-lg text-sm text-gray-200 focus:border-green-500/50 focus:outline-none placeholder-gray-500"
                    required
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={newSensor.longitude}
                    onChange={(e) => setNewSensor({...newSensor, longitude: parseFloat(e.target.value)})}
                    className="w-full bg-black/30 border border-green-900/30 p-2.5 rounded-lg text-sm text-gray-200 focus:border-green-500/50 focus:outline-none placeholder-gray-500"
                    required
                  />
                  <button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white p-2.5 rounded-lg shadow-lg hover:shadow-green-500/20 transition-all duration-300 text-sm"
                  >
                    Add Sensor
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Map View */
        <div className="h-[calc(100vh-8rem)] rounded-xl overflow-hidden shadow-2xl border border-green-900/30">
          <DashboardMapWithNoSSR 
            sensorLocations={devices} 
            sensorData={sensorData} 
            weatherData={weatherData}
          />
        </div>
      )}
    </div>
  );
}
