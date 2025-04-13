import { NextResponse } from 'next/server';
import dbConnect from '@/utils/mongodb';
import Device from '@/models/Device';
import SensorData from '@/models/SensorData';

export async function GET() {
  try {
    await dbConnect();
    const devices = await Device.find({ isActive: true });
    return NextResponse.json(devices);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const data = await request.json();
    
    // Get the highest sensor number to create the next deviceId
    const lastDevice = await Device.findOne().sort({ deviceId: -1 });
    let nextNumber = 1;
    
    if (lastDevice) {
      const lastNumber = parseInt(lastDevice.deviceId.split('_')[2]);
      nextNumber = lastNumber + 1;
    }
    
    const deviceId = `SOIL_SENSOR_${nextNumber}`;
    
    const device = await Device.create({
      deviceId,
      name: data.name,
      location: {
        latitude: data.latitude,
        longitude: data.longitude
      }
    });
    
    return NextResponse.json(device);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}