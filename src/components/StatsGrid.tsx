import React, { useState, useEffect } from 'react';
import { Lead } from '@/types';
import Link from 'next/link';
import { MapIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface StatsGridProps {
  leads: Lead[];
}

export default function StatsGrid({ leads }: StatsGridProps) {
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem('marketAnalysisBannerDismissed');
    setIsBannerDismissed(dismissed === 'true');
  }, []);

  const handleDismissBanner = () => {
    setIsBannerDismissed(true);
    localStorage.setItem('marketAnalysisBannerDismissed', 'true');
  };

  const stats = {
    total: leads.length,
    instagram: leads.filter(l => l.lead_source === 'Instagram Manual').length,
    adLibrary: leads.filter(l => l.lead_source === 'FB Ad Library').length,
    googleMaps: leads.filter(l => l.lead_source === 'Google Maps').length,
    withPhone: leads.filter(l => l.phone).length,
    withEmail: leads.filter(l => l.email).length,
    multiSource: leads.filter(l => 
      (l.lead_source === 'Google Maps' && l.running_ads) ||
      (l.lead_source === 'FB Ad Library' && l.google_maps_url) ||
      (l.ad_platforms && l.ad_platforms.filter(p => p.hasAds).length > 0 && l.lead_source === 'Google Maps')
    ).length,
  };

  return (
    <div className="space-y-4 mb-8">
      {/* Market Analysis CTA - Dismissible and Compact */}
      {!isBannerDismissed && (
        <div className="relative">
          <Link href="/market-analysis" className="block">
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <MapIcon className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      Market Analysis
                      <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">NEW</span>
                    </h3>
                    <p className="text-sm text-gray-600">
                      Discover hot markets for acquisition • 20+ cities analyzed
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>🔴 Hot: 5</span>
                  <span>🟡 Warm: 8</span>
                  <span>🔵 Emerging: 7</span>
                </div>
              </div>
            </div>
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              handleDismissBanner();
            }}
            className="absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Dismiss banner"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Simplified Stats Grid - 3 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Leads */}
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500">Total Leads</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{stats.total}</dd>
            <div className="mt-3 text-sm text-gray-600">
              <span className="text-green-600 font-medium">↑ {stats.total > 0 ? '+100%' : '0%'}</span> all time
            </div>
          </div>
        </div>

        {/* Lead Sources */}
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500">Lead Sources</dt>
            <dd className="mt-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-gray-900">3</span>
                <span className="text-sm text-gray-500">active</span>
              </div>
            </dd>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Instagram</span>
                <span className="font-medium text-gray-900">{stats.instagram}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Google Maps</span>
                <span className="font-medium text-gray-900">{stats.googleMaps}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">FB Ad Library</span>
                <span className="font-medium text-gray-900">{stats.adLibrary}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500">Lead Quality</dt>
            <dd className="mt-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-gray-900">
                  {Math.round((stats.withPhone / stats.total) * 100) || 0}%
                </span>
                <span className="text-sm text-gray-500">contactable</span>
              </div>
            </dd>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">📞 With Phone</span>
                <span className="font-medium text-gray-900">{stats.withPhone}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">📧 With Email</span>
                <span className="font-medium text-gray-900">{stats.withEmail}</span>
              </div>
              <div className="flex justify-between text-xs border-t pt-1 mt-1">
                <span className="text-purple-600 font-medium">🔗 Multi-Source</span>
                <span className="font-medium text-purple-600">{stats.multiSource}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}