import { NextResponse } from 'next/server';
import cloudinary from '@/utils/cloudinary';
import dbConnect from '@/utils/mongodb';
import DiseaseImage from '@/models/DiseaseImage';

export async function POST(request) {
  try {
    await dbConnect();

    const { image, prediction } = await request.json();
    
    // Upload image to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(image, {
      folder: 'disease_images',
    });

    // Create new disease image document
    const diseaseImage = new DiseaseImage({
      url: uploadResponse.secure_url,
      public_id: uploadResponse.public_id,
      prediction: prediction.diseaseStatus,
      confidence: prediction.confidence
    });

    await diseaseImage.save();
    return NextResponse.json(diseaseImage);
  } catch (error) {
    console.error('Disease image upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}