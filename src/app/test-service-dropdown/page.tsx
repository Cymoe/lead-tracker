'use client';

import { useState } from 'react';
import ServiceTypeAutocomplete from '@/components/ServiceTypeAutocomplete';

export default function TestServiceDropdown() {
  const [selectedService, setSelectedService] = useState('');

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Test Service Type Dropdown</h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Service Type Autocomplete</h2>
            <p className="text-sm text-gray-600 mb-4">
              Click the dropdown icon to see all 100+ service categories
            </p>
            
            <ServiceTypeAutocomplete
              value={selectedService}
              onChange={setSelectedService}
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
          
          <div className="mt-6 text-xs text-gray-500 space-y-1">
            <p><strong>Features:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Type to search from 100+ predefined services</li>
              <li>Click dropdown icon to browse all categories</li>
              <li>Enter any custom service type</li>
              <li>Recent services are remembered</li>
              <li>Smart suggestions as you type</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}