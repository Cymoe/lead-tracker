'use client';

import { useState } from 'react';
import ServiceTypeAutocomplete from '@/components/ServiceTypeAutocomplete';
import ServiceTypeAutocompleteDebug from '@/components/ServiceTypeAutocomplete-Debug';

export default function TestServiceDropdownDebug() {
  const [selectedService, setSelectedService] = useState('');
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setDebugLog(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto grid grid-cols-2 gap-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Test Service Type Dropdown</h1>
          
          <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Service Type Autocomplete</h2>
              <p className="text-sm text-gray-600 mb-4">
                Click the dropdown icon to see all 100+ service categories
              </p>
              
              <ServiceTypeAutocomplete
                value={selectedService}
                onChange={(value) => {
                  setSelectedService(value);
                  addLog(`Selected: ${value}`);
                }}
                placeholder="Type or select a service..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            {selectedService && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Selected Service:</p>
                <p className="text-lg text-blue-700">{selectedService}</p>
              </div>
            )}
            
            <div className="mt-6 space-y-4">
              <button
                onClick={() => {
                  setSelectedService('');
                  addLog('Cleared selection');
                }}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Clear Selection
              </button>
              
              <button
                onClick={() => {
                  setSelectedService('Custom Service XYZ');
                  addLog('Set custom service');
                }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Set Custom Service
              </button>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Import Debug:</h3>
              <ServiceTypeAutocompleteDebug />
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Debug Log</h2>
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs h-96 overflow-auto">
            {debugLog.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}