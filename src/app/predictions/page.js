'use client';

import PredictionsPanel from '@/components/PredictionsPanel';
import { FaChartLine } from 'react-icons/fa';

export default function PredictionsPage() {
  return (
    <div className="min-h-screen bg-[#1a1f1c] text-gray-200 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 sm:mb-8">
        <FaChartLine className="text-2xl sm:text-3xl text-green-500" />
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
          Smart Predictions
        </h1>
      </div>

      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="bg-black/20 backdrop-blur-lg p-4 sm:p-6 rounded-xl shadow-2xl border border-green-900/30">
          <PredictionsPanel />
        </div>
      </div>
    </div>
  );
}