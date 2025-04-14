import { NextResponse } from 'next/server';
import dbConnect from '@/utils/mongodb';
import Device from '@/models/Device';
import SensorData from '@/models/SensorData';

export async function POST(request) {
  try {
    await dbConnect();
    const { predictionType } = await request.json();

    // Get all active devices
    const devices = await Device.find({ isActive: true });
    
    // Get latest sensor data for all devices
    const allSensorData = await Promise.all(
      devices.map(async (device) => {
        const latestData = await SensorData.findOne({ deviceId: device._id })
          .sort({ timestamp: -1 });
        return latestData;
      })
    );

    // Filter out null values and calculate averages
    const validSensorData = allSensorData.filter(data => data !== null);
    
    if (validSensorData.length === 0) {
      return NextResponse.json({ error: 'No sensor data available' }, { status: 404 });
    }

    // Calculate aggregated metrics
    const aggregatedData = {
      averageTemp: validSensorData.reduce((sum, data) => sum + (data.temperature || 0), 0) / validSensorData.length,
      averageMoisture: validSensorData.reduce((sum, data) => sum + (data.moisture || 0), 0) / validSensorData.length,
      averageNpk: {
        nitrogen: validSensorData.reduce((sum, data) => sum + (data.npk?.nitrogen || 0), 0) / validSensorData.length,
        phosphorous: validSensorData.reduce((sum, data) => sum + (data.npk?.phosphorous || 0), 0) / validSensorData.length,
        potassium: validSensorData.reduce((sum, data) => sum + (data.npk?.potassium || 0), 0) / validSensorData.length
      }
    };

    // Generate predictions based on aggregated data
    let predictions = {};
    
    switch (predictionType) {
      case 'crop':
        predictions = generateCropPredictions(aggregatedData);
        break;
      case 'irrigation':
        predictions = generateIrrigationPredictions(aggregatedData);
        break;
      case 'fertilizer':
        predictions = generateFertilizerPredictions(aggregatedData);
        break;
      default:
        return NextResponse.json({ error: 'Invalid prediction type' }, { status: 400 });
    }

    return NextResponse.json({ 
      aggregatedData,
      predictions
    });

  } catch (error) {
    console.error('Predictions error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateCropPredictions(data) {
  const { averageTemp, averageMoisture, averageNpk } = data;
  const crops = [];

  // High temperature crops (typical Tamil Nadu summer conditions)
  if (averageTemp > 30) {
    crops.push('Paddy (நெல்)', 'Groundnut (நிலக்கடலை)', 'Cotton (பருத்தி)', 'Black Gram (உளுந்து)');
  }
  // Moderate temperature crops
  else if (averageTemp > 25) {
    crops.push('Sugarcane (கரும்பு)', 'Turmeric (மஞ்சள்)', 'Green Gram (பச்சைப்பயிறு)', 'Finger Millet (கேழ்வரகு)');
  }
  // Cool season crops
  else {
    crops.push('Mustard (கடுகு)', 'Coriander (கொத்தமல்லி)', 'Fenugreek (வெந்தயம்)', 'Pearl Millet (கம்பு)');
  }

  // High moisture crops (wetland crops)
  if (averageMoisture > 60) {
    crops.push('Banana (வாழைப்பழம்)', 'Betel (வெற்றிலை)', 'Water Spinach (வள்ளிக்கீரை)');
  }
  // Medium moisture crops
  else if (averageMoisture > 40) {
    crops.push('Tomato (தக்காளி)', 'Brinjal (கத்திரிக்காய்)', 'Chilli (மிளகாய்)');
  }
  // Drought resistant crops
  else {
    crops.push('Sorghum (சோளம்)', 'Horse Gram (கொள்ளு)', 'Sesame (எள்ளு)');
  }

  // High nitrogen loving crops
  if (averageNpk.nitrogen > 60) {
    crops.push('Coconut (தென்னை)', 'Mango (மாம்பழம்)', 'Guava (கொய்யா)');
  }

  // High phosphorus loving crops
  if (averageNpk.phosphorous > 60) {
    crops.push('Drumstick (முருங்கை)', 'Lady\'s Finger (வெண்டைக்காய்)', 'Cluster Beans (கொத்தவரங்காய்)');
  }

  // High potassium loving crops
  if (averageNpk.potassium > 60) {
    crops.push('Tapioca (மரவள்ளி)', 'Sweet Potato (சர்க்கரைவள்ளி)', 'Curry Leaves (கருவேப்பிலை)');
  }

  return {
    recommendedCrops: [...new Set(crops)], // Remove duplicates
    confidence: calculateConfidence(data)
  };
}

function generateIrrigationPredictions(data) {
  const { averageMoisture, averageTemp } = data;
  
  // Calculate water needs based on moisture and temperature
  const moistureDeficit = 60 - averageMoisture; // Assuming 60% is optimal
  const evaporationFactor = averageTemp / 30; // Normalized temperature factor
  
  const waterNeeded = Math.max(0, moistureDeficit * evaporationFactor);
  
  return {
    needsWater: waterNeeded > 5,
    recommendedAmount: Math.round(waterNeeded * 10) / 10, // L/m²
    frequency: waterNeeded > 15 ? 'immediate' : waterNeeded > 10 ? 'today' : 'this week',
    confidence: calculateConfidence(data)
  };
}

function generateFertilizerPredictions(data) {
  const { averageNpk } = data;
  
  const recommendations = {
    nitrogen: averageNpk.nitrogen < 40 ? 'high' : averageNpk.nitrogen < 60 ? 'moderate' : 'low',
    phosphorous: averageNpk.phosphorous < 40 ? 'high' : averageNpk.phosphorous < 60 ? 'moderate' : 'low',
    potassium: averageNpk.potassium < 40 ? 'high' : averageNpk.potassium < 60 ? 'moderate' : 'low'
  };

  return {
    recommendations,
    confidence: calculateConfidence(data)
  };
}

function calculateConfidence(data) {
  // Simple confidence calculation based on data completeness
  const { averageTemp, averageMoisture, averageNpk } = data;
  let confidence = 100;

  if (!averageTemp || !averageMoisture) confidence -= 30;
  if (!averageNpk.nitrogen || !averageNpk.phosphorous || !averageNpk.potassium) confidence -= 30;

  return Math.max(0, confidence);
}