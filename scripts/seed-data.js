const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Device = require('../src/models/Device');
const SensorData = require('../src/models/SensorData');
const WeatherData = require('../src/models/WeatherData');

// Optimal ranges for rice cultivation
const RICE_PARAMS = {
  npk: {
    nitrogen: { min: 80, max: 120 }, // kg/ha
    phosphorous: { min: 40, max: 60 }, // kg/ha
    potassium: { min: 40, max: 80 }  // kg/ha
  },
  moisture: { min: 60, max: 85 }, // %
  temperature: { min: 20, max: 35 }, // °C
  humidity: { min: 60, max: 80 }, // %
  windSpeed: { min: 0, max: 15 }, // km/h
  precipitation: { min: 0, max: 25 } // mm/day
};

// Weather conditions for rice growing season
const WEATHER_CONDITIONS = [
  'Clear',
  'Partly Cloudy',
  'Cloudy',
  'Light Rain',
  'Moderate Rain',
  'Heavy Rain'
];

const WIND_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

// Function to generate random number within range
function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

// Function to generate realistic sensor data with some variation
function generateSensorData(baseData, variation = 0.1) {
  return {
    npk: {
      nitrogen: baseData.npk.nitrogen * (1 + (Math.random() - 0.5) * variation),
      phosphorous: baseData.npk.phosphorous * (1 + (Math.random() - 0.5) * variation),
      potassium: baseData.npk.potassium * (1 + (Math.random() - 0.5) * variation)
    },
    moisture: baseData.moisture * (1 + (Math.random() - 0.5) * variation),
    temperature: baseData.temperature * (1 + (Math.random() - 0.5) * variation)
  };
}

// Function to generate weather data
function generateWeatherData() {
  return {
    temperature: randomInRange(RICE_PARAMS.temperature.min, RICE_PARAMS.temperature.max),
    humidity: randomInRange(RICE_PARAMS.humidity.min, RICE_PARAMS.humidity.max),
    windSpeed: randomInRange(RICE_PARAMS.windSpeed.min, RICE_PARAMS.windSpeed.max),
    windDirection: WIND_DIRECTIONS[Math.floor(Math.random() * WIND_DIRECTIONS.length)],
    precipitation: Math.random() < 0.3 ? randomInRange(0.1, RICE_PARAMS.precipitation.max) : 0,
    weatherCondition: WEATHER_CONDITIONS[Math.floor(Math.random() * WEATHER_CONDITIONS.length)]
  };
}

// Base data for rice cultivation (optimal conditions)
const baseData = {
  npk: {
    nitrogen: 100,
    phosphorous: 50,
    potassium: 60
  },
  moisture: 75,
  temperature: 28
};

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Device.deleteMany({});
    await SensorData.deleteMany({});
    await WeatherData.deleteMany({});

    // Create two devices in different locations
    const devices = await Device.create([
      {
        deviceId: 'SOIL_SENSOR_1',
        name: 'Rice Field North',
        location: {
          latitude: 12.821921,
          longitude: 80.038187
        }
      },
      {
        deviceId: 'SOIL_SENSOR_2',
        name: 'Rice Field South',
        location: {
          latitude: 12.819876,
          longitude: 80.037654
        }
      }
    ]);

    // Generate 10 days of historical data with 3 readings per day
    const numberOfDays = 10;
    const readingsPerDay = 3;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - numberOfDays);

    for (const device of devices) {
      for (let day = 0; day < numberOfDays; day++) {
        for (let reading = 0; reading < readingsPerDay; reading++) {
          const timestamp = new Date(startDate);
          timestamp.setDate(timestamp.getDate() + day);
          timestamp.setHours(8 + reading * 6); // Readings at 8AM, 2PM, and 8PM

          // Generate sensor data
          const sensorDataValues = generateSensorData(baseData);
          const sensorData = await SensorData.create({
            deviceId: device._id,
            ...sensorDataValues,
            timestamp
          });

          // Generate weather data
          const weatherDataValues = generateWeatherData();
          await WeatherData.create({
            sensorDataId: sensorData._id,
            ...weatherDataValues,
            timestamp
          });
        }
      }
      console.log(`Generated data for device: ${device.deviceId}`);
    }

    console.log('Successfully seeded database');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedData();