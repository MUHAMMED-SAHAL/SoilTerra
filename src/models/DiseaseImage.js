const mongoose = require('mongoose');

const diseaseImageSchema = new mongoose.Schema({
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
    enum: ['curl', 'healthy', 'slug', 'spot']
  },
  confidence: {
    type: Number
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.DiseaseImage || mongoose.model('DiseaseImage', diseaseImageSchema);
