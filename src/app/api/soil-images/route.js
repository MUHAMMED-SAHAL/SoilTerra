import { NextResponse } from 'next/server';
import cloudinary from '@/utils/cloudinary';
import dbConnect from '@/utils/mongodb';
import SoilImage from '@/models/SoilImage';

export async function POST(request) {
  try {
    await dbConnect();

    const { image, prediction } = await request.json();
    
    // Upload image to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: 'soil_images',
    });

    // Create new soil image document
    const soilImage = new SoilImage({
      url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
      prediction: prediction.soilType,
      confidence: prediction.confidence
    });

    await soilImage.save();
    return NextResponse.json(soilImage);
  } catch (error) {
    console.error('Soil image upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}