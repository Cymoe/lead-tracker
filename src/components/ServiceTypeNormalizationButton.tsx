'use client';

import React, { useState } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function ServiceTypeNormalizationButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  
  const checkStats = async () => {
    try {
      const response = await fetch('/api/normalize-service-types');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error checking stats:', error);
    }
  };
  
  const runNormalization = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/normalize-service-types', {
        method: 'POST',
      });
      
      const data = await response.json();
      setResult(data);
      
      // Refresh stats after normalization
      await checkStats();
    } catch (error) {
      console.error('Error running normalization:', error);
      setResult({ error: 'Failed to run normalization' });
    } finally {
      setLoading(false);
    }
  };
  
  // Check stats on mount
  React.useEffect(() => {
    checkStats();
  }, []);
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Service Type Normalization</h3>
      
      {stats && (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          <p>Total leads with service type: {stats.total}</p>
          <p>Already normalized: {stats.normalized}</p>
          <p>Need normalization: {stats.notNormalized}</p>
          <p>Unique original types: {stats.uniqueOriginalTypes}</p>
          <p>Unique normalized types: {stats.uniqueNormalizedTypes}</p>
          <p>Reduction: {stats.reductionRatio}</p>
          
          {stats.unmappedExamples && stats.unmappedExamples.length > 0 && (
            <div className="mt-2">
              <p className="font-medium">Unmapped examples:</p>
              <ul className="list-disc list-inside">
                {stats.unmappedExamples.map((type: string, i: number) => (
                  <li key={i}>{type}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <button
        onClick={runNormalization}
        disabled={loading || (stats?.notNormalized === 0)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Normalizing...' : 'Run Normalization'}
      </button>
      
      {result && (
        <div className={`mt-4 p-4 rounded ${result.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {result.error ? (
            <p>Error: {result.error}</p>
          ) : (
            <div>
              <p className="font-medium">Normalization Complete!</p>
              <p>Normalized: {result.normalized} leads</p>
              {result.stats && (
                <>
                  <p>Original types: {result.stats.uniqueOriginalTypes}</p>
                  <p>Normalized types: {result.stats.uniqueNormalizedTypes}</p>
                  <p>Reduction: {result.stats.reductionRatio}</p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}