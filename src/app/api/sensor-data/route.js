import { NextResponse } from 'next/server';
import dbConnect from '@/utils/mongodb';
import Device from '@/models/Device';
import SensorData from '@/models/SensorData';
import WeatherData from '@/models/WeatherData';
import { getWeatherData } from '@/utils/weather';

// GET handler
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    const device = await Device.findOne({ deviceId });
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    const sensorData = await SensorData.findOne({ deviceId: device._id }).sort({ timestamp: -1 });

    let weatherData = null;
    if (sensorData) {
      weatherData = await WeatherData.findOne({ sensorDataId: sensorData._id });
    }

    return NextResponse.json({ device, sensorData, weatherData });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST handler
export async function POST(request) {
  try {
    await dbConnect();
    const data = await request.json();
    // console.log('Incoming Data:', data); // debug log

    const { deviceId, type, payload } = data;

    if (!deviceId || !type || !payload) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const device = await Device.findOne({ deviceId });
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    // Build sensor document dynamically
    const sensorDoc = {
      deviceId: device._id,
      timestamp: new Date()
    };

    if (type === 'npk') {
      sensorDoc.npk = payload;
    } else if (type === 'moisture') {
      sensorDoc.moisture = payload.moisture;
    } else if (type === 'temperature') {
      sensorDoc.temperature = payload.temperature;
    } else {
      return NextResponse.json({ error: 'Invalid sensor data type' }, { status: 400 });
    }

    const newSensorData = new SensorData(sensorDoc);
    await newSensorData.save();

    // Fetch and save weather data
    try {
      const weather = await getWeatherData(
        device.location.latitude,
        device.location.longitude
      );

      const newWeatherData = new WeatherData({
        sensorDataId: newSensorData._id,
        ...weather,
        timestamp: newSensorData.timestamp
      });

      await newWeatherData.save();

      return NextResponse.json({
        sensorData: newSensorData,
        weatherData: newWeatherData
      });
    } catch (weatherError) {
      console.error('Weather data error:', weatherError);
      return NextResponse.json({
        sensorData: newSensorData,
        weatherError: 'Failed to fetch weather data'
      });
    }

  } catch (error) {
    console.error('Sensor data error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
