'use client';

import { useState } from 'react';
import SimpleCitySearch from '@/components/SimpleCitySearch';
import TestCityComponent from '@/components/TestCityComponent';

export default function TestCitySearchPage() {
  const [simpleCity, setSimpleCity] = useState('');
  const [comprehensiveCity, setComprehensiveCity] = useState('');

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">City Search Comparison</h1>
      
      {/* Test Component */}
      <TestCityComponent />
      
      <div className="space-y-6">
        {/* Simple City Search (Current Implementation) */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            Simple City Search (Current - ~200 cities)
          </h2>
          <p className="text-gray-600 mb-4">
            Shows popular cities and supports state abbreviation search
          </p>
          <SimpleCitySearch
            value={simpleCity}
            onChange={setSimpleCity}
            placeholder="Type city name or state abbreviation..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          {simpleCity && (
            <p className="mt-2 text-sm text-gray-700">
              Selected: <span className="font-medium">{simpleCity}</span>
            </p>
          )}
        </div>

        {/* Comprehensive City Search (New Implementation) */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">
            Comprehensive City Search (New - ALL US cities)
          </h2>
          <p className="text-gray-600 mb-4">
            Includes every city in America with coordinates and lazy loading
          </p>
          <SimpleCitySearch
            value={comprehensiveCity}
            onChange={setComprehensiveCity}
            placeholder="Search any US city..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            useComprehensiveData={true}
          />
          {comprehensiveCity && (
            <p className="mt-2 text-sm text-gray-700">
              Selected: <span className="font-medium">{comprehensiveCity}</span>
            </p>
          )}
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Features Comparison:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-800">Simple (Current):</h4>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>~200 popular US cities</li>
              <li>Instant loading</li>
              <li>State abbreviation search</li>
              <li>Recent cities memory</li>
              <li>Lightweight (~10KB)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800">Comprehensive (New):</h4>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>ALL US cities (30,000+)</li>
              <li>Lazy loaded on demand</li>
              <li>State abbreviation search</li>
              <li>Recent cities memory</li>
              <li>Includes coordinates</li>
              <li>Debounced search</li>
              <li>Smart caching</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}