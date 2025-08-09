'use client';

import { useState, useEffect, useMemo } from 'react';
import { Lead } from '@/types';
import AcquisitionOpportunityMap from './AcquisitionOpportunityMap';
import { normalizeState } from '@/utils/state-utils';
import { detectMetroArea } from '@/utils/metro-areas';
import { getStateFromPhone } from '@/utils/area-codes';
import { getCityFromPhone } from '@/utils/area-code-cities';

interface MarketAnalysisProps {
  leads: Lead[];
}

export default function MarketAnalysis({ leads }: MarketAnalysisProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  
  // Process leads to extract market data
  const marketData = useMemo(() => {
    const marketMap = new Map<string, {
      city: string;
      state: string;
      leadCount: number;
      withAds: number;
      serviceTypes: Set<string>;
    }>();

    leads.forEach(lead => {
      let city = lead.city?.trim() || '';
      let state = normalizeState(lead.state);
      
      // Try to detect location using various methods
      if (!state || !city) {
        // Extract city from company name if not already set
        if (!city && lead.company_name) {
          const dashMatch = lead.company_name.match(/\s*-\s*([A-Za-z\s]+?)$/);
          const inMatch = lead.company_name.match(/\sin\s+([A-Za-z\s]+?)$/i);
          const potentialCity = dashMatch?.[1] || inMatch?.[1];
          
          if (potentialCity) {
            const trimmedCity = potentialCity.trim();
            const detectedMetro = detectMetroArea(trimmedCity, '');
            if (detectedMetro) {
              city = trimmedCity;
              if (!state) {
                state = detectedMetro.state;
              }
            }
          }
        }
        
        // Detect from metro areas
        if (city && !state) {
          const detectedMetro = detectMetroArea(city, '');
          if (detectedMetro) {
            state = detectedMetro.state;
          }
        }
        
        // Detect from phone
        if (lead.phone) {
          if (!state) {
            state = getStateFromPhone(lead.phone) || '';
          }
          if (!city) {
            city = getCityFromPhone(lead.phone) || '';
          }
        }
      }
      
      if (city && state) {
        const key = `${city}|${state}`;
        if (!marketMap.has(key)) {
          marketMap.set(key, {
            city,
            state,
            leadCount: 0,
            withAds: 0,
            serviceTypes: new Set()
          });
        }
        
        const market = marketMap.get(key)!;
        market.leadCount++;
        if (lead.running_ads) market.withAds++;
        if (lead.service_type) market.serviceTypes.add(lead.service_type);
      }
    });

    return Array.from(marketMap.values());
  }, [leads]);

  // Get unique service types
  const serviceTypes = useMemo(() => {
    const types = new Set<string>();
    leads.forEach(lead => {
      if (lead.service_type) types.add(lead.service_type);
    });
    return Array.from(types).sort();
  }, [leads]);

  const handleCitySelect = (city: string, state: string) => {
    console.log('Selected city:', city, state);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Market Insights
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Visualize your leads and market opportunities across different locations
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              Total Markets
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">
              {marketData.length}
            </dd>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              Total Leads
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">
              {leads.length}
            </dd>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              Running Ads
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">
              {leads.filter(l => l.running_ads).length}
            </dd>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              Ad Competition
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-gray-100">
              {leads.length > 0 ? Math.round((leads.filter(l => l.running_ads).length / leads.length) * 100) : 0}%
            </dd>
          </div>
        </div>
      </div>

      {/* Industry Filter */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <label htmlFor="industry" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Filter by Service Type
        </label>
        <select
          id="industry"
          value={selectedIndustry}
          onChange={(e) => setSelectedIndustry(e.target.value)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-gray-200"
        >
          <option value="">All Service Types</option>
          {serviceTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* Map */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden" style={{ height: '600px' }}>
        <AcquisitionOpportunityMap 
          selectedIndustry={selectedIndustry}
          onCitySelect={handleCitySelect}
        />
      </div>

      {/* Market List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100 mb-4">
            Top Markets by Lead Count
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Market
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Leads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Running Ads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ad %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Service Types
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {marketData
                  .sort((a, b) => b.leadCount - a.leadCount)
                  .slice(0, 10)
                  .map((market, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {market.city}, {market.state}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {market.leadCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {market.withAds}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {Math.round((market.withAds / market.leadCount) * 100)}%
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {market.serviceTypes.size} types
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}