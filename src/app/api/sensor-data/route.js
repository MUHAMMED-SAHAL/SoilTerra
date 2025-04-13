import { NextResponse } from 'next/server';
import dbConnect from '@/utils/mongodb';
import Device from '@/models/Device';
import SensorData from '@/models/SensorData';

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

    return NextResponse.json({ device, sensorData });
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
    return NextResponse.json(newSensorData);
  } catch (error) {
    console.error('Sensor data error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}