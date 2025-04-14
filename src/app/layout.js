'use client'

import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import Script from 'next/script';
import 'leaflet/dist/leaflet.css';
import { FaLeaf, FaMap, FaMicroscope, FaDisease, FaChartLine, FaBars, FaTimes } from 'react-icons/fa';
import { useState } from 'react';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Cross-Origin-Opener-Policy" content="same-origin" />
        <meta httpEquiv="Cross-Origin-Embedder-Policy" content="require-corp" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <Script 
          src="/ort.wasm.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${inter.className} bg-[#1a1f1c]`}>
        <div className="flex min-h-screen relative">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#2a2f2c] text-green-400 hover:bg-[#343934] transition-colors"
          >
            {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>

          {/* Sidebar Navigation */}
          <nav className={`fixed top-0 left-0 h-screen w-72 bg-[#232823] text-gray-200 border-r border-green-900 
            flex flex-col z-40 transform transition-transform duration-300 ease-in-out
            lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-6 mt-12 lg:mt-0">
              <div className="flex items-center gap-3 mb-8">
                <FaLeaf className="text-2xl text-green-500" />
                <div className="text-2xl font-bold text-green-400">SoilTerra</div>
              </div>
              <ul className="space-y-2">
                <li>
                  <Link 
                    href="/" 
                    className="flex items-center gap-3 p-3 hover:bg-[#2a2f2c] rounded-lg transition-colors duration-200 group"
                  >
                    <FaLeaf className="text-lg text-green-500 group-hover:text-green-400" />
                    <span className="group-hover:text-green-400">Dashboard</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/soil-classification" 
                    className="flex items-center gap-3 p-3 hover:bg-[#2a2f2c] rounded-lg transition-colors duration-200 group"
                  >
                    <FaMicroscope className="text-lg text-green-500 group-hover:text-green-400" />
                    <span className="group-hover:text-green-400">Soil Classification</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/disease-classification" 
                    className="flex items-center gap-3 p-3 hover:bg-[#2a2f2c] rounded-lg transition-colors duration-200 group"
                  >
                    <FaDisease className="text-lg text-green-500 group-hover:text-green-400" />
                    <span className="group-hover:text-green-400">Disease Classification</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/predictions" 
                    className="flex items-center gap-3 p-3 hover:bg-[#2a2f2c] rounded-lg transition-colors duration-200 group"
                  >
                    <FaChartLine className="text-lg text-green-500 group-hover:text-green-400" />
                    <span className="group-hover:text-green-400">Predictions</span>
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="mt-auto p-6 border-t border-green-900">
              <div className="text-sm text-gray-400">
                <p className="mb-1">© 2025 SoilTerra</p>
                <p className="text-xs">Smart Agriculture Platform</p>
              </div>
            </div>
          </nav>

          {/* Backdrop for mobile menu */}
          {isMobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
          
          {/* Main Content */}
          <main className="flex-1 lg:ml-72 p-4 lg:p-8 bg-[#1a1f1c] min-h-screen pt-16 lg:pt-8">
            {children}
          </main>
        </div>
        <Script
          src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
          crossOrigin=""
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}