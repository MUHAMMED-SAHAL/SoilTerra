'use client';
import { useState, useRef } from 'react';
import * as ort from 'onnxruntime-web';
import { preprocessImage } from '@/utils/imageProcessing';
import { getDiseaseRecommendations } from '@/utils/recommendations';

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
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Plant Disease Classification</h1>
      
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Upload Plant Image'}
          </button>
        </div>

        {image && (
          <div className="mb-6">
            <img src={image} alt="Uploaded plant" className="max-w-full h-auto rounded" />
          </div>
        )}

        {loading && <div className="text-center">Analyzing plant...</div>}

        {prediction && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded shadow">
              <h2 className="text-xl font-semibold mb-2">Classification Results</h2>
              <p className="mb-2">Plant Status: {prediction.diseaseStatus}</p>
              <p className="mb-2">Confidence: {prediction.confidence}%</p>
              {prediction.error && (
                <p className="text-red-500">{prediction.error}</p>
              )}
            </div>

            {prediction.diseaseStatus && !prediction.error && getDiseaseRecommendations(prediction.diseaseStatus) && (
              <div className="bg-white p-6 rounded shadow">
                <h2 className="text-xl font-semibold mb-4">Plant Care Recommendations</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Description</h3>
                    <p className="text-gray-700">{getDiseaseRecommendations(prediction.diseaseStatus).description}</p>
                  </div>

                  {prediction.diseaseStatus !== 'healthy' && (
                    <>
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Causes</h3>
                        <ul className="list-disc list-inside text-gray-700 space-y-1">
                          {getDiseaseRecommendations(prediction.diseaseStatus).causes.map((cause, index) => (
                            <li key={index}>{cause}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h3 className="font-semibold text-lg mb-2">Treatment</h3>
                        <ul className="list-disc list-inside text-gray-700 space-y-1">
                          {getDiseaseRecommendations(prediction.diseaseStatus).treatment.map((treatment, index) => (
                            <li key={index}>{treatment}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      {prediction.diseaseStatus === 'healthy' ? 'Maintenance' : 'Prevention'}
                    </h3>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      {getDiseaseRecommendations(prediction.diseaseStatus)[
                        prediction.diseaseStatus === 'healthy' ? 'maintenance' : 'prevention'
                      ].map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}