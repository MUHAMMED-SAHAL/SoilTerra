const mongoose = require('mongoose');

const soilImageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true
  },
  public_id: {
    type: String,
    required: true
  },
  prediction: {
    type: String,
    enum: ['Alluvial Soil', 'Black Soil', 'Clay Soil', 'Red Soil']
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.SoilImage || mongoose.model('SoilImage', soilImageSchema);
