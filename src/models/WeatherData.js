const mongoose = require('mongoose');

const weatherDataSchema = new mongoose.Schema({
  sensorDataId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SensorData',
    required: true
  },
  temperature: {
    type: Number,
    required: true
  },
  humidity: {
    type: Number,
    required: true
  },
  windSpeed: {
    type: Number,
    required: true
  },
  windDirection: {
    type: String,
    required: true
  },
  precipitation: {
    type: Number,
    required: true,
    default: 0
  },
  weatherCondition: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
weatherDataSchema.index({ sensorDataId: 1, timestamp: -1 });

module.exports = mongoose.models.WeatherData || mongoose.model('WeatherData', weatherDataSchema);