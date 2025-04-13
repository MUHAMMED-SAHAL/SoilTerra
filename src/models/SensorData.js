const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: true
  },
  npk: {
    nitrogen: {
      type: Number,
      default: 0,
      min: 0
    },
    phosphorous: {
      type: Number,
      default: 0,
      min: 0
    },
    potassium: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  moisture: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  temperature: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
sensorDataSchema.index({ deviceId: 1, timestamp: -1 });

module.exports = mongoose.models.SensorData || mongoose.model('SensorData', sensorDataSchema);
