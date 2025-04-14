'use client';

import { useState, useEffect } from 'react';
import { FaLeaf, FaWater, FaFlask } from 'react-icons/fa';

export default function PredictionsPanel() {
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('crop');

  useEffect(() => {
    fetchPredictions(activeTab);
  }, [activeTab]);

  const fetchPredictions = async (type) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ predictionType: type })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch predictions');
      }

      const data = await response.json();
      setPredictions(data);
    } catch (err) {
      console.error('Predictions error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderCropPredictions = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-3 text-green-400">Recommended Crops</h3>
        <ul className="space-y-2">
          {predictions.predictions?.recommendedCrops?.map((crop, index) => (
            <li key={index} className="p-3 bg-black/30 rounded-lg backdrop-blur-sm text-gray-200">
              {crop}
            </li>
          )) || (
            <li className="p-3 bg-black/30 rounded-lg backdrop-blur-sm text-gray-400">
              No crop recommendations available
            </li>
          )}
        </ul>
      </div>
      <div className="text-sm text-green-400">
        Confidence: {predictions.predictions?.confidence || 0}%
      </div>
    </div>
  );

  const renderIrrigationPredictions = () => (
    <div className="space-y-4">
      <div className={`p-3 bg-black/30 rounded-lg backdrop-blur-sm ${
        predictions.predictions?.needsWater ? 'text-amber-400' : 'text-green-400'
      }`}>
        {predictions.predictions?.needsWater ? 'Irrigation Needed' : 'Soil Moisture Adequate'}
      </div>
      {predictions.predictions?.needsWater && (
        <div className="grid gap-2">
          <div className="p-3 bg-black/30 rounded-lg backdrop-blur-sm text-gray-200">
            <span className="text-green-400">Amount: </span>
            {predictions.predictions.recommendedAmount} L/m²
          </div>
          <div className="p-3 bg-black/30 rounded-lg backdrop-blur-sm text-gray-200">
            <span className="text-green-400">Schedule: </span>
            {predictions.predictions.frequency}
          </div>
        </div>
      )}
      <div className="text-sm text-green-400">
        Confidence: {predictions.predictions?.confidence || 0}%
      </div>
    </div>
  );

  const renderFertilizerPredictions = () => {
    const recommendations = predictions.predictions?.recommendations || {};
    const confidence = predictions.predictions?.confidence || 0;

    const getNeedColor = (level) => {
      if (!level) return 'gray-400';
      return level === 'high' ? 'rose-400' : level === 'moderate' ? 'amber-400' : 'green-400';
    };

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium mb-3 text-green-400">Fertilizer Needs</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {['nitrogen', 'phosphorous', 'potassium'].map((nutrient) => (
            <div key={nutrient} className="p-3 bg-black/30 rounded-lg backdrop-blur-sm">
              <h4 className="font-medium text-green-400 mb-1">
                {nutrient.charAt(0).toUpperCase() + nutrient.slice(1)}
              </h4>
              <div className={`text-${getNeedColor(recommendations[nutrient])}`}>
                {recommendations[nutrient] || 'unknown'} need
              </div>
            </div>
          ))}
        </div>
        <div className="text-sm text-green-400">
          Confidence: {confidence}%
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          Smart Predictions
        </h2>
      </div>
      
      <div className="mb-6 border-b border-green-900/30">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('crop')}
            className={`pb-2 px-1 flex items-center gap-2 transition-colors ${
              activeTab === 'crop' 
                ? 'border-b-2 border-green-500 text-green-400' 
                : 'text-gray-500 hover:text-green-400'
            }`}
          >
            <FaLeaf className="text-sm" />
            Crop Recommendations
          </button>
          <button
            onClick={() => setActiveTab('irrigation')}
            className={`pb-2 px-1 flex items-center gap-2 transition-colors ${
              activeTab === 'irrigation' 
                ? 'border-b-2 border-green-500 text-green-400' 
                : 'text-gray-500 hover:text-green-400'
            }`}
          >
            <FaWater className="text-sm" />
            Irrigation
          </button>
          <button
            onClick={() => setActiveTab('fertilizer')}
            className={`pb-2 px-1 flex items-center gap-2 transition-colors ${
              activeTab === 'fertilizer' 
                ? 'border-b-2 border-green-500 text-green-400' 
                : 'text-gray-500 hover:text-green-400'
            }`}
          >
            <FaFlask className="text-sm" />
            Fertilizer
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-r-transparent"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-900/20 border border-rose-900/30 rounded-lg text-rose-400">
          {error}
        </div>
      ) : (
        <div className="py-4">
          {activeTab === 'crop' && renderCropPredictions()}
          {activeTab === 'irrigation' && renderIrrigationPredictions()}
          {activeTab === 'fertilizer' && renderFertilizerPredictions()}

          {predictions.aggregatedData && (
            <div className="mt-6 pt-4 border-t border-green-900/30">
              <h3 className="text-lg font-medium text-green-400 mb-3">Current Conditions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Temperature', value: `${(predictions.aggregatedData.averageTemp || 0).toFixed(1)}°C` },
                  { label: 'Moisture', value: `${(predictions.aggregatedData.averageMoisture || 0).toFixed(1)}%` },
                  { label: 'Nitrogen', value: (predictions.aggregatedData.averageNpk?.nitrogen || 0).toFixed(1) },
                  { label: 'Phosphorous', value: (predictions.aggregatedData.averageNpk?.phosphorous || 0).toFixed(1) },
                  { label: 'Potassium', value: (predictions.aggregatedData.averageNpk?.potassium || 0).toFixed(1) }
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 bg-black/30 rounded-lg backdrop-blur-sm">
                    <span className="text-green-400">{label}: </span>
                    <span className="text-gray-200">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}