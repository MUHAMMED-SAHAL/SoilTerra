import * as ort from 'onnxruntime-web';

const MODEL_PATHS = {
  xgboost: '/xgb_model.onnx',
  soil: '/soil_model.onnx',
  disease: '/plant_disease_model.onnx'
};

// Session cache to avoid reloading models
const sessionCache = new Map();

export const ModelType = {
  XGBOOST: 'xgboost',
  SOIL: 'soil',
  DISEASE: 'disease'
};

// Crop names matching model output indices
export const CROP_NAMES = [
  'Wheat',
  'Rice',
  'Corn',
  'Sugarcane',
  'Cotton',
  'Potato',
  'Tomato',
  'Soybean'
];

// NPK optimization ranges
export const NPK_RANGES = {
  nitrogen: { min: 20, optimal: 80, max: 140 },
  phosphorous: { min: 10, optimal: 55, max: 125 },
  potassium: { min: 15, optimal: 90, max: 200 }
};

// Default ONNX session options for web
const defaultSessionOptions = {
  executionProviders: ['wasm'],
  graphOptimizationLevel: 'all',
  executionMode: 'sequential',
  enableCpuMemArena: false,
  enableMemPattern: false,
  enableProfiling: false
};

// Add yield range constants
const YIELD_RANGE = {
  min: 0,
  max: 100 // maximum expected yield in quintals/hectare
};

// Add confidence normalization function
function normalizeConfidence(value) {
  return Math.min(Math.max(value * 100, 0), 100);
}

// Default values for predictions when data is insufficient
const DEFAULT_VALUES = {
  npk: {
    nitrogen: 40,
    phosphorous: 30,
    potassium: 45
  },
  moisture: 50,
  temperature: 25,
  humidity: 60,
  rainfall: 5,
  ph: 7,
  soilQuality: 65
};

// Historical averages for crop yields (quintals/hectare)
const AVERAGE_YIELDS = {
  'Wheat': 35,
  'Rice': 40,
  'Corn': 45,
  'Sugarcane': 550,
  'Cotton': 25,
  'Potato': 200,
  'Tomato': 250,
  'Soybean': 30
};

export function getDefaultPredictionData(predictionType) {
  switch (predictionType) {
    case 'yield':
      return {
        prediction: [AVERAGE_YIELDS['Wheat'] * 0.15], // Conservative estimate
        confidence: 30 // Low confidence for default data
      };
    
    case 'crop':
      return {
        prediction: [0.3, 0.2, 0.15, 0.1, 0.1, 0.05, 0.05, 0.05], // Distributed probabilities
        confidence: 30,
        cropScores: CROP_NAMES.map((crop, index) => ({
          crop,
          suitability: [30, 25, 20, 15, 15, 10, 10, 10][index]
        }))
      };
    
    case 'soil':
      return {
        prediction: [0.65], // Moderate soil health
        confidence: 30,
        currentQuality: 65,
        recommendations: [
          'Maintain regular soil testing',
          'Consider adding organic matter',
          'Monitor moisture levels'
        ]
      };
    
    case 'climate':
      return {
        prediction: [0.4], // Moderate risk
        confidence: 30
      };
  }
}

export async function getModelSession(modelType) {
  if (sessionCache.has(modelType)) {
    return sessionCache.get(modelType);
  }

  try {
    const session = await ort.InferenceSession.create(
      MODEL_PATHS[modelType],
      defaultSessionOptions
    );
    sessionCache.set(modelType, session);
    return session;
  } catch (error) {
    console.error(`Failed to load ${modelType} model:`, error);
    throw new Error(`Failed to load ${modelType} model: ${error.message}`);
  }
}

export async function runXGBoostPrediction(features, hasEnoughData = true) {
  try {
    const session = await getModelSession(ModelType.XGBOOST);
    
    // Define the exact 12 required features in specific order
    const orderedFeatures = [
      features.nitrogen || 0,
      features.phosphorous || 0,
      features.potassium || 0,
      features.temperature || 25,
      features.humidity || 50,
      features.rainfall || 0,
      features.ph || 7,
      features.moisture || 0,
      features.soilQuality || 0,
      features.season || 0,
      features.soil_type || 0,
      features.crop_type || 0
    ];

    // Create input tensor with exactly 12 features
    const inputTensor = new ort.Tensor(
      'float32',
      new Float32Array(orderedFeatures),
      [1, 12]
    );

    const feeds = { [session.inputNames[0]]: inputTensor };
    const results = await session.run(feeds);
    const predictions = Array.from(results[session.outputNames[0]].data);

    // Normalize predictions
    const normalizedPredictions = predictions.map(pred => 
      Math.min(Math.max(pred, 0), YIELD_RANGE.max)
    );

    // Adjust confidence based on data availability
    const baseConfidence = Math.min(Math.max(Math.max(...predictions) * 100, 0), 100);
    const adjustedConfidence = hasEnoughData ? baseConfidence : Math.min(baseConfidence, 60);

    return {
      prediction: normalizedPredictions,
      confidence: adjustedConfidence
    };
  } catch (error) {
    console.error('XGBoost prediction error:', error);
    throw error;
  }
}

export async function aggregateAndPredictYield(sensorData, weatherData, hasEnoughData = true) {
  const currentDate = new Date();
  const season = Math.floor(((currentDate.getMonth() + 1) % 12) / 3); // 0-3 for spring, summer, fall, winter

  // Provide features in exact order expected by the model
  return await runXGBoostPrediction({
    nitrogen: sensorData.npk.nitrogen,
    phosphorous: sensorData.npk.phosphorous,
    potassium: sensorData.npk.potassium,
    temperature: weatherData.temperature,
    humidity: weatherData.humidity,
    rainfall: weatherData.precipitation,
    ph: 7, // Default pH if not available
    moisture: sensorData.moisture,
    soilQuality: calculateSoilQuality(sensorData.npk),
    season: season,
    soil_type: 0, // Will be updated based on soil classification
    crop_type: 0  // Will be updated based on current crop
  }, hasEnoughData);
}

export function calculateSoilQuality(npkValues) {
  const { nitrogen, phosphorous, potassium } = npkValues;
  
  // Ideal NPK ranges
  const maxN = 140; // Maximum ideal Nitrogen value
  const maxP = 125; // Maximum ideal Phosphorus value
  const maxK = 200; // Maximum ideal Potassium value

  // Calculate individual nutrient indices (0-1 scale)
  const nIndex = Math.min(nitrogen / maxN, 1);
  const pIndex = Math.min(phosphorous / maxP, 1);
  const kIndex = Math.min(potassium / maxK, 1);

  // Calculate overall soil quality (0-100 scale)
  return Math.round(((nIndex + pIndex + kIndex) / 3) * 100);
}

export async function predictCropSuitability(sensorData, weatherData, hasEnoughData = true) {
  const currentDate = new Date();
  const season = Math.floor(((currentDate.getMonth() + 1) % 12) / 3);

  const prediction = await runXGBoostPrediction({
    nitrogen: sensorData.npk.nitrogen,
    phosphorous: sensorData.npk.phosphorous,
    potassium: sensorData.npk.potassium,
    temperature: weatherData.temperature,
    humidity: weatherData.humidity,
    rainfall: weatherData.precipitation,
    ph: 7,
    moisture: sensorData.moisture,
    soilQuality: calculateSoilQuality(sensorData.npk),
    season: season,
    soil_type: 0,
    crop_type: 0
  }, hasEnoughData);
  
  // Normalize crop scores to sum to 100%
  const scores = prediction.prediction;
  const sum = scores.reduce((a, b) => a + b, 0);
  const normalizedScores = scores.map(score => (score / sum) * 100);
  
  return {
    ...prediction,
    cropScores: CROP_NAMES.map((crop, index) => ({
      crop,
      suitability: Math.min(Math.max(normalizedScores[index], 0), 100)
    }))
  };
}

export async function predictSoilOptimization(sensorData, hasEnoughData = true) {
  const currentQuality = calculateSoilQuality(sensorData.npk);
  const recommendations = getNPKRecommendations(sensorData.npk);
  
  const prediction = await runXGBoostPrediction({
    nitrogen: sensorData.npk.nitrogen,
    phosphorous: sensorData.npk.phosphorous,
    potassium: sensorData.npk.potassium,
    moisture: sensorData.moisture,
    quality: currentQuality,
    temperature: 25,
    humidity: 50,
    rainfall: 0,
    ph: 7,
    soilQuality: currentQuality,
    season: 0,
    soil_type: 0,
    crop_type: 0
  }, hasEnoughData);

  return {
    ...prediction,
    recommendations,
    currentQuality
  };
}

export function getNPKRecommendations(npkValues) {
  const recommendations = [];
  
  Object.entries(npkValues).forEach(([nutrient, value]) => {
    const range = NPK_RANGES[nutrient];
    if (value < range.min) {
      const increase = Math.min(range.optimal - value, range.max - value);
      recommendations.push(`Low ${nutrient}: Increase by ${increase.toFixed(1)} units`);
    } else if (value > range.max) {
      const reduction = Math.min(value - range.optimal, value - range.min);
      recommendations.push(`High ${nutrient}: Reduce by ${reduction.toFixed(1)} units`);
    }
  });
  
  return recommendations;
}

export async function assessClimateImpact(weatherHistory, sensorHistory, hasEnoughData = true) {
  // Aggregate historical data for climate impact assessment
  const features = weatherHistory.map((weather, index) => ({
    temperature: weather.temperature,
    humidity: weather.humidity,
    windSpeed: weather.windSpeed,
    precipitation: weather.precipitation,
    soilQuality: calculateSoilQuality(sensorHistory[index].npk),
    nitrogen: sensorHistory[index].npk.nitrogen,
    phosphorous: sensorHistory[index].npk.phosphorous,
    potassium: sensorHistory[index].npk.potassium,
    ph: 7,
    moisture: sensorHistory[index].moisture,
    season: 0,
    soil_type: 0,
    crop_type: 0
  }));

  // Average the features
  const avgFeatures = features.reduce((acc, curr) => ({
    temperature: acc.temperature + curr.temperature,
    humidity: acc.humidity + curr.humidity,
    windSpeed: acc.windSpeed + curr.windSpeed,
    precipitation: acc.precipitation + curr.precipitation,
    soilQuality: acc.soilQuality + curr.soilQuality,
    nitrogen: acc.nitrogen + curr.nitrogen,
    phosphorous: acc.phosphorous + curr.phosphorous,
    potassium: acc.potassium + curr.potassium,
    ph: acc.ph + curr.ph,
    moisture: acc.moisture + curr.moisture,
    season: acc.season + curr.season,
    soil_type: acc.soil_type + curr.soil_type,
    crop_type: acc.crop_type + curr.crop_type
  }), {
    temperature: 0,
    humidity: 0,
    windSpeed: 0,
    precipitation: 0,
    soilQuality: 0,
    nitrogen: 0,
    phosphorous: 0,
    potassium: 0,
    ph: 0,
    moisture: 0,
    season: 0,
    soil_type: 0,
    crop_type: 0
  });

  Object.keys(avgFeatures).forEach(key => {
    avgFeatures[key] /= features.length;
  });

  const prediction = await runXGBoostPrediction(avgFeatures, hasEnoughData);
  
  // Normalize risk level to be between 0-100%
  const riskLevel = Math.min(Math.max(prediction.prediction[0] * 100, 0), 100);
  
  return {
    prediction: [riskLevel / 100], // Convert back to 0-1 range for consistency
    confidence: normalizeConfidence(prediction.confidence)
  };
}

// Add sensor data aggregation function
export function calculateAggregatedSensorData(sensorDataArray) {
  if (!sensorDataArray || sensorDataArray.length === 0) {
    return {
      npk: DEFAULT_VALUES.npk,
      moisture: DEFAULT_VALUES.moisture,
      temperature: DEFAULT_VALUES.temperature
    };
  }

  const total = {
    nitrogen: 0,
    phosphorous: 0,
    potassium: 0,
    moisture: 0,
    temperature: 0,
    count: sensorDataArray.length
  };

  sensorDataArray.forEach(data => {
    if (data.npk) {
      total.nitrogen += data.npk.nitrogen || 0;
      total.phosphorous += data.npk.phosphorous || 0;
      total.potassium += data.npk.potassium || 0;
    }
    total.moisture += data.moisture || 0;
    total.temperature += data.temperature || 0;
  });

  return {
    npk: {
      nitrogen: Math.round(total.nitrogen / total.count),
      phosphorous: Math.round(total.phosphorous / total.count),
      potassium: Math.round(total.potassium / total.count)
    },
    moisture: Math.round(total.moisture / total.count),
    temperature: Math.round(total.temperature / total.count)
  };
}

// Add this export function
export async function getModelInfo() {
  try {
    const modelInfo = {
      xgboost: {
        name: 'XGBoost + Random Forest',
        type: 'Regression',
        purpose: 'Crop recommendations & irrigation scheduling',
        inputFeatures: ['npk', 'moisture', 'temperature', 'weather']
      },
      mobilenet: {
        name: 'MobileNet v2',
        type: 'Image Classification',
        purpose: ['Soil type identification', 'Plant disease detection'],
        inputSize: [224, 224, 3]
      }
    };
    return modelInfo;
  } catch (error) {
    console.error('Error getting model info:', error);
    throw error;
  }
}