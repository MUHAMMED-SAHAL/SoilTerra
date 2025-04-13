import { NextResponse } from 'next/server';
import dbConnect from '@/utils/mongodb';
import Device from '@/models/Device';
import SensorData from '@/models/SensorData';
import WeatherData from '@/models/WeatherData';
import { getWeatherData } from '@/utils/weather';

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

    // Get latest sensor data for the device
    const sensorData = await SensorData.findOne({ deviceId: device._id })
      .sort({ timestamp: -1 });

    // Get associated weather data if sensor data exists
    let weatherData = null;
    if (sensorData) {
      weatherData = await WeatherData.findOne({ sensorDataId: sensorData._id });
    }

    return NextResponse.json({ device, sensorData, weatherData });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const data = await request.json();
    const { deviceId, sensorData } = data;

    const device = await Device.findOne({ deviceId });
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    // Create new sensor data document
    const newSensorData = new SensorData({
      deviceId: device._id,
      npk: sensorData.npk,
      moisture: sensorData.moisture,
      temperature: sensorData.temperature,
      timestamp: new Date()
    });

    await newSensorData.save();

    // Fetch and save weather data
    try {
      const weatherData = await getWeatherData(
        device.location.latitude,
        device.location.longitude
      );

      const newWeatherData = new WeatherData({
        sensorDataId: newSensorData._id,
        ...weatherData,
        timestamp: newSensorData.timestamp
      });

      await newWeatherData.save();

      return NextResponse.json({
        sensorData: newSensorData,
        weatherData: newWeatherData
      });
    } catch (weatherError) {
      console.error('Weather data error:', weatherError);
      // Still return sensor data even if weather data fails
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