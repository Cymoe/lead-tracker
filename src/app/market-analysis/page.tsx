'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Sidebar from '@/components/Sidebar';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

// Dynamically import the map components to avoid SSR issues with Leaflet
const AcquisitionOpportunityMap = dynamic(
  () => import('@/components/AcquisitionOpportunityMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
);

const CountyOpportunityMap = dynamic(
  () => import('@/components/CountyOpportunityMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
);

export default function MarketAnalysisPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [mapView, setMapView] = useState<'metro' | 'county'>('metro');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      return saved === 'true';
    }
    return false;
  });
  
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isSidebarCollapsed.toString());
  }, [isSidebarCollapsed]);
  
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  const handleCitySelect = (city: string, state: string) => {
    console.log('Selected city:', city, state);
    // Could navigate to lead creation with pre-filled city
  };
  
  const handleCountySelect = (fipsCode: string, countyName: string, state: string) => {
    console.log('Selected county:', countyName, state, fipsCode);
    // Could navigate to lead creation with pre-filled county
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return null;
  }
  
  return (
    <>
      <Sidebar
        onAddLead={() => {}}
        onGoogleSheetsSync={() => {}}
        onDuplicateDetection={() => {}}
        onAnalytics={() => {}}
        onSettings={() => {}}
        onBulkEdit={() => {}}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <div className={`transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
      }`}>
        <main className="h-screen overflow-hidden bg-[#111827]">
          <div className="h-full flex flex-col">
            {/* Compact Header */}
            <div>
              <div className="bg-[#1F2937] shadow-lg px-4 py-2 border-b border-[#374151]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Link
                      href="/"
                      className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <ArrowLeftIcon className="h-4 w-4" />
                      <span className="text-sm">Back to Leads</span>
                    </Link>
                    <div className="border-l border-[#374151] pl-4">
                      <h1 className="text-lg font-semibold text-white">
                        🗺️ SMB Acquisition Opportunity Map
                      </h1>
                    </div>
                  </div>
                  
                  {/* View Toggle */}
                  <div className="bg-[#374151] p-1 rounded-lg">
                    <button
                      onClick={() => setMapView('metro')}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        mapView === 'metro' 
                          ? 'bg-[#3B82F6] text-white shadow-sm' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Major Metros
                    </button>
                    <button
                      onClick={() => setMapView('county')}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        mapView === 'county' 
                          ? 'bg-[#3B82F6] text-white shadow-sm' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      County View
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Map Container */}
            <div className="flex-1 relative w-full">
              {mapView === 'metro' ? (
                <AcquisitionOpportunityMap
                  selectedIndustry={selectedIndustry}
                  onCitySelect={handleCitySelect}
                />
              ) : (
                <CountyOpportunityMap
                  selectedIndustry={selectedIndustry}
                  onCountySelect={handleCountySelect}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}