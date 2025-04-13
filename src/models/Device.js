const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    // Ensure format like SOIL_SENSOR_X
    validate: {
      validator: function(v) {
        return /^SOIL_SENSOR_\d+$/.test(v);
      },
      message: props => `${props.value} is not a valid device ID format! Use SOIL_SENSOR_X where X is a number`
    }
  },
  name: {
    type: String,
    required: true
  },
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Device || mongoose.model('Device', deviceSchema);
