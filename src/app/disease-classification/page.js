'use client';
import { useState, useRef } from 'react';
import * as ort from 'onnxruntime-web';
import { preprocessImage } from '@/utils/imageProcessing';
import { getDiseaseRecommendations } from '@/utils/recommendations';
import { FaLeaf, FaUpload, FaBug, FaCheck, FaInfoCircle } from 'react-icons/fa';

const DISEASE_LABELS = ["curl", "healthy", "slug", "spot"];

export default function DiseaseClassification() {
  const [image, setImage] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      classifyDisease(file);
    }
  };

  const classifyDisease = async (file) => {
    try {
      setLoading(true);
      
      // Convert file to base64
      const base64Image = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
      
      // Preprocess image for model
      const imageData = await preprocessImage(file, 'NHWC');
      
      // Configure ONNX session with optimized settings
      const sessionOptions = {
        logSeverityLevel: 3,
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
        executionMode: 'sequential',
        enableCpuMemArena: false,
        enableMemPattern: false,
        enableProfiling: false
      };

      // Create session with error handling
      let session;
      try {
        session = await ort.InferenceSession.create('/plant_disease_model.onnx', sessionOptions);
      } catch (sessionError) {
        throw new Error(`Failed to load model: ${sessionError.message}`);
      }

      // Create tensor silently
      const tensor = new ort.Tensor(
        'float32', 
        imageData, 
        [1, 224, 224, 3]
      );

      // Run inference with minimal logging
      const feeds = { [session.inputNames[0]]: tensor };
      const results = await session.run(feeds);
      const output = results[session.outputNames[0]].data;

      // Process results
      const predictionArray = Array.from(output);
      const maxValue = Math.max(...predictionArray);
      const maxIndex = predictionArray.indexOf(maxValue);
      const confidence = (maxValue * 100).toFixed(2);

      const predictionResult = {
        diseaseStatus: confidence > 20 ? DISEASE_LABELS[maxIndex] : 'Uncertain',
        confidence: confidence,
        error: confidence <= 20 ? 'Low confidence prediction' : null
      };

      setPrediction(predictionResult);

      // Only upload to Cloudinary and save to MongoDB if confidence is high enough
      if (confidence > 20) {
        try {
          const response = await fetch('/api/disease-images', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: base64Image,
              prediction: predictionResult
            })
          });

          if (!response.ok) {
            throw new Error('Failed to save image and prediction');
          }
        } catch (saveError) {
          console.error('Failed to save results:', saveError);
          // Don't throw here - we still want to show the prediction even if saving fails
        }
      }

    } catch (error) {
      console.error('Classification error:', error.message);
      setPrediction({
        diseaseStatus: 'Error',
        confidence: 0,
        error: 'Failed to process image'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1f1c] text-gray-200 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 sm:mb-8">
        <FaLeaf className="text-2xl sm:text-3xl text-green-500" />
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          Plant Disease Classification
        </h1>
      </div>

      <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
        {/* Upload Section */}
        <div className="bg-black/20 backdrop-blur-lg p-4 sm:p-6 rounded-xl shadow-2xl border border-green-900/30">
          <div className="mb-4 sm:mb-6 flex justify-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-green-500/20 flex items-center justify-center gap-2 text-sm sm:text-base"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 sm:h-5 sm:w-5 animate-spin rounded-full border-2 border-green-400 border-r-transparent" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <FaUpload className="text-base sm:text-lg" />
                  <span>Upload Plant Image</span>
                </>
              )}
            </button>
          </div>

          {image && (
            <div className="mb-4 sm:mb-6">
              <div className="relative aspect-video">
                <img 
                  src={image} 
                  alt="Uploaded plant" 
                  className="absolute inset-0 w-full h-full object-contain rounded-lg border-2 border-green-900/30" 
                />
              </div>
            </div>
          )}
        </div>

        {prediction && (
          <div className="space-y-4 sm:space-y-6">
            {/* Results Card */}
            <div className="bg-black/20 backdrop-blur-lg p-4 sm:p-6 rounded-xl shadow-2xl border border-green-900/30">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-green-400 flex items-center gap-2">
                {prediction.diseaseStatus === 'healthy' ? (
                  <FaCheck className="text-green-500" />
                ) : (
                  <FaBug className="text-red-500" />
                )}
                Classification Results
              </h2>
              <div className="space-y-2">
                <p className="text-sm sm:text-base text-gray-300">
                  Plant Status: <span className={`${prediction.diseaseStatus === 'healthy' ? 'text-green-400' : 'text-red-400'}`}>
                    {prediction.diseaseStatus}
                  </span>
                </p>
                <p className="text-sm sm:text-base text-gray-300">
                  Confidence: <span className="text-green-400">{prediction.confidence}%</span>
                </p>
                {prediction.error && (
                  <p className="text-sm sm:text-base text-rose-400 bg-rose-900/20 p-3 rounded-lg border border-rose-900/30">
                    <FaInfoCircle className="inline mr-2" />
                    {prediction.error}
                  </p>
                )}
              </div>
            </div>

            {/* Recommendations Section */}
            {prediction.diseaseStatus && !prediction.error && getDiseaseRecommendations(prediction.diseaseStatus) && (
              <RecommendationsCard 
                status={prediction.diseaseStatus} 
                recommendations={getDiseaseRecommendations(prediction.diseaseStatus)} 
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for recommendations
const RecommendationsCard = ({ status, recommendations }) => (
  <div className="bg-black/20 backdrop-blur-lg p-4 sm:p-6 rounded-xl shadow-2xl border border-green-900/30">
    <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-green-400 flex items-center gap-2">
      <FaLeaf className="text-green-500" />
      Plant Care Recommendations
    </h2>
    <div className="grid gap-4 sm:gap-6">
      <InfoSection title="Description" content={recommendations.description} />
      
      {status !== 'healthy' && (
        <>
          <InfoSection title="Causes" items={recommendations.causes} />
          <InfoSection title="Treatment" items={recommendations.treatment} />
        </>
      )}
      
      <InfoSection 
        title={status === 'healthy' ? 'Maintenance' : 'Prevention'} 
        items={recommendations[status === 'healthy' ? 'maintenance' : 'prevention']} 
      />
    </div>
  </div>
);

// Helper component for info sections
const InfoSection = ({ title, content, items }) => (
  <div className="bg-black/20 p-3 sm:p-4 rounded-lg border border-green-900/20">
    <h3 className="font-semibold text-base sm:text-lg mb-2 text-emerald-400">{title}</h3>
    {content ? (
      <p className="text-sm sm:text-base text-gray-300">{content}</p>
    ) : (
      <ul className="list-disc list-inside text-sm sm:text-base text-gray-300 space-y-1 ml-2">
        {items?.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    )}
  </div>
);