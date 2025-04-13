"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import USMap from "@/components/USMap";
import mqtt from "mqtt";

export default function Dashboard() {
  const [deviceId, setDeviceId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [npk, setNpk] = useState(null);
  const [moisture, setMoisture] = useState(null);
  const [temperature, setTemperature] = useState(null);
  const clientRef = useRef(null);
  const [sensorName, setSensorName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const router = useRouter();

  const saveSensorLocation = () => {
    if (!sensorName || !latitude || !longitude) return;

    const sensors = JSON.parse(localStorage.getItem("sensorLocations") || "[]");
    const newSensor = {
      name: sensorName,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    };
    sensors.push(newSensor);
    localStorage.setItem("sensorLocations", JSON.stringify(sensors));

    // Clear inputs
    setSensorName("");
    setLatitude("");
    setLongitude("");
  };
  const connectAndSubscribe = () => {
    if (!deviceId) return;

    const host =
      "wss://f8100f3ba7cf45558c79b58a122928fb.s1.eu.hivemq.cloud:8884/mqtt";
    const options = {
      username: "swiftadmin",
      password: "Hello@2004",
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    };

    const client = mqtt.connect(host, options);
    clientRef.current = client;

    client.on("connect", () => {
      setIsConnected(true);
      const baseTopic = `sensors/${deviceId}`;
      client.subscribe(`${baseTopic}/npk`);
      client.subscribe(`${baseTopic}/moisture`);
      client.subscribe(`${baseTopic}/temperature`);
    });

    client.on("message", (topic, message) => {
      const payload = JSON.parse(message.toString());
      if (topic.endsWith("/npk")) setNpk(payload);
      if (topic.endsWith("/moisture")) setMoisture(payload.moisture);
      if (topic.endsWith("/temperature")) setTemperature(payload.temperature);
    });

    client.on("error", (err) => {
      console.error("Connection error: ", err);
      client.end();
    });
  };

  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.end();
      }
    };
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Enter Device ID"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2"
        />
        <button
          onClick={connectAndSubscribe}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {isConnected ? "Connected" : "Connect"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-2">NPK</h2>
          {npk ? (
            <ul>
              <li>Nitrogen: {npk.nitrogen}</li>
              <li>Phosphorous: {npk.phosphorous}</li>
              <li>Potassium: {npk.potassium}</li>
            </ul>
          ) : (
            <p className="text-gray-500">No data</p>
          )}
        </div>

        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Moisture</h2>
          {moisture !== null ? (
            <p>{moisture}</p>
          ) : (
            <p className="text-gray-500">No data</p>
          )}
        </div>

        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Temperature</h2>
          {temperature !== null ? (
            <p>{temperature}</p>
          ) : (
            <p className="text-gray-500">No data</p>
          )}
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Add Sensor Location</h2>
        <div className="flex flex-col gap-2 md:flex-row">
          <input
            type="text"
            placeholder="Sensor Name"
            value={sensorName}
            onChange={(e) => setSensorName(e.target.value)}
            className="border px-3 py-2 rounded"
          />
          <input
            type="number"
            placeholder="Latitude"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            className="border px-3 py-2 rounded"
          />
          <input
            type="number"
            placeholder="Longitude"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            className="border px-3 py-2 rounded"
          />
          <button
            onClick={saveSensorLocation}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold">Sensor Map</h2>
        <USMap />
      </div>
    </div>
  );
}
