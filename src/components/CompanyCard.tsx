'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  PhoneIcon, 
  GlobeAltIcon, 
  MapPinIcon,
  ClockIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { 
  SparklesIcon,
  DocumentTextIcon,
  EyeIcon
} from '@heroicons/react/24/solid';

interface CompanyData {
  name: string;
  leads: any[];
  runningAds: boolean;
  latestLead: any;
  totalLeads: number;
  sources: Set<string>;
}

interface CompanyCardProps {
  company: CompanyData;
}

export default function CompanyCard({ company }: CompanyCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Get company initial for avatar
  const initial = company.name.charAt(0).toUpperCase();
  
  // Calculate monitoring percentage (mock calculation for now)
  const monitoringPercentage = company.runningAds ? 85 : 45;
  
  // Get primary source
  const primarySource = Array.from(company.sources)[0] || 'Unknown';
  
  // Get latest lead info
  const latestCity = company.latestLead.city || 'No location';
  const hasWebsite = !!company.latestLead.website;
  const hasPhone = !!company.latestLead.phone;
  
  // Format date
  const lastUpdated = new Date(company.latestLead.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-shadow duration-300">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg
              ${company.runningAds ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gray-400'}`}>
              {initial}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{company.name}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                <span className="flex items-center">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  {latestCity}
                </span>
                {hasWebsite && (
                  <GlobeAltIcon className="w-4 h-4 text-green-500" />
                )}
                {hasPhone && (
                  <PhoneIcon className="w-4 h-4 text-blue-500" />
                )}
              </div>
            </div>
          </div>
          {company.runningAds && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center">
              <SparklesIcon className="w-3 h-3 mr-1" />
              Active Ads
            </span>
          )}
        </div>

        {/* Monitoring Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">Monitoring Progress</span>
            <span className="text-sm font-medium text-gray-900">{monitoringPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                company.runningAds ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gray-400'
              }`}
              style={{ width: `${monitoringPercentage}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Total Leads</p>
            <p className="text-lg font-semibold text-gray-900">{company.totalLeads}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">Last Updated</p>
            <p className="text-lg font-semibold text-gray-900">{lastUpdated}</p>
          </div>
        </div>

        {/* Sources */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Lead Sources</p>
          <div className="flex flex-wrap gap-1">
            {Array.from(company.sources).map((source, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
              >
                {source}
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center justify-center"
          >
            <DocumentTextIcon className="w-4 h-4 mr-1" />
            Details
          </button>
          <Link
            href={`/?company=${encodeURIComponent(company.name)}`}
            className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium flex items-center justify-center"
          >
            <EyeIcon className="w-4 h-4 mr-1" />
            View Leads
          </Link>
        </div>

        {/* Expandable Details */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="space-y-2 text-sm">
              {company.leads.map((lead, index) => (
                <div key={index} className="flex items-center justify-between text-gray-600">
                  <span>{lead.handle || 'No handle'}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 