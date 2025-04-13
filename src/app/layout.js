import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SoilTerra',
  description: 'Soil and Plant Disease Analysis Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="Cross-Origin-Opener-Policy" content="same-origin" />
        <meta httpEquiv="Cross-Origin-Embedder-Policy" content="require-corp" />
      </head>
      <body className={inter.className}>
        <div className="flex min-h-screen">
          {/* Sidebar Navigation */}
          <nav className="w-64 bg-gray-800 text-white p-4">
            <div className="text-xl font-bold mb-8">SoilTerra</div>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="block p-2 hover:bg-gray-700 rounded">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/soil-classification" className="block p-2 hover:bg-gray-700 rounded">
                  Soil Classification
                </Link>
              </li>
              <li>
                <Link href="/disease-classification" className="block p-2 hover:bg-gray-700 rounded">
                  Disease Classification
                </Link>
              </li>
            </ul>
          </nav>
          
          {/* Main Content */}
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}