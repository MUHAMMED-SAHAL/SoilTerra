'use client';
import { useState, useRef } from 'react';
import * as ort from 'onnxruntime-web';
import { preprocessImage } from '@/utils/imageProcessing';

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
      
      // Preprocess image
      const imageData = await preprocessImage(file, 'NHWC');
      
      // Configure ONNX session with optimized settings
      const sessionOptions = {
        logSeverityLevel: 3, // Only log critical errors
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

      // Set prediction with confidence threshold
      if (confidence > 20) {
        setPrediction({
          diseaseStatus: DISEASE_LABELS[maxIndex],
          confidence: confidence
        });
      } else {
        setPrediction({
          diseaseStatus: 'Uncertain',
          confidence: confidence,
          error: 'Low confidence prediction'
        });
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
          >
            Upload Plant Image
          </button>
        </div>

        {image && (
          <div className="mb-6">
            <img src={image} alt="Uploaded plant" className="max-w-full h-auto rounded" />
          </div>
        )}

        {loading && <div className="text-center">Analyzing plant...</div>}

        {prediction && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">Results</h2>
            <p>Plant Status: {prediction.diseaseStatus}</p>
            <p>Confidence: {prediction.confidence}%</p>
            {prediction.error && <p className="text-red-500">Error: {prediction.error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}