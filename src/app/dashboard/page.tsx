'use client';

import { useEffect, useState } from 'react';
import { useLeadStore } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  BuildingOfficeIcon, 
  GlobeAltIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  DocumentPlusIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { fetchLeads } from '@/lib/api';
import SettingsModal from '@/components/modals/SettingsModal';
import AddLeadModal from '@/components/modals/AddLeadModal';
import GoogleMapsImportModal from '@/components/modals/GoogleMapsImportModal';
import FacebookAdsSearchModal from '@/components/modals/FacebookAdsSearchModal';
import { Lead } from '@/types';

export default function DashboardPage() {
  const { setLeads, leads } = useLeadStore();
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      return saved === 'true';
    }
    return false;
  });

  // Modal states
  const [showSettings, setShowSettings] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showGoogleMapsImport, setShowGoogleMapsImport] = useState(false);
  const [showFacebookAdsSearch, setShowFacebookAdsSearch] = useState(false);

  // Calculate statistics
  const stats = {
    totalLeads: leads.length,
    companiesWithAds: leads.filter(l => l.running_ads).length,
    newThisWeek: leads.filter(l => {
      const date = new Date(l.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date > weekAgo;
    }).length,
    uniqueCompanies: new Set(leads.map(l => l.company_name.toLowerCase())).size,
    leadsBySource: {
      instagram: leads.filter(l => l.lead_source === 'Instagram Manual').length,
      fbAds: leads.filter(l => l.lead_source === 'FB Ad Library').length,
      googleMaps: leads.filter(l => l.lead_source === 'Google Maps').length
    }
  };

  const loadLeads = async () => {
    try {
      const fetchedLeads = await fetchLeads();
      
      // Add hardcoded multi-source example at the top
      const multiSourceExample: Lead = {
        id: 'example-multi-source',
        user_id: user?.id || '',
        company_name: 'Phoenix Premium Plumbing',
        handle: '@phoenixpremiumplumbing',
        service_type: 'Plumbing',
        city: 'Phoenix',
        state: 'AZ',
        phone: '(602) 555-0123',
        email: 'info@phoenixpremiumplumbing.com',
        website: 'https://phoenixpremiumplumbing.com',
        instagram_url: 'https://instagram.com/phoenixpremiumplumbing',
        google_maps_url: 'https://www.google.com/maps/place/?q=place_id:ChIJexample123',
        address: '1234 E Camelback Rd, Phoenix, AZ 85014',
        rating: 4.8,
        review_count: 127,
        lead_source: 'Google Maps',
        running_ads: true,
        ad_start_date: '2024-01-15',
        ad_copy: '🚰 Emergency Plumbing Services Available 24/7! Licensed & Insured. Same-day service for all your plumbing needs.',
        ad_call_to_action: 'Get Quote',
        ad_platform: 'Facebook',
        ad_platforms: [
          {
            platform: 'Facebook Ads',
            hasAds: true,
            lastChecked: new Date().toISOString(),
            notes: 'Active campaign targeting Phoenix metro area'
          },
          {
            platform: 'Google Ads',
            hasAds: true,
            lastChecked: new Date().toISOString(),
            notes: 'Running search ads for emergency plumbing keywords'
          }
        ],
        total_ad_platforms: 2,
        notes: '🔗 Multi-source lead: Found in both Google Maps and FB Ad Library\n\nHigh-value lead! Established business with strong online presence and active marketing campaigns. Google Maps shows 127 reviews with 4.8 rating. Running Facebook ads for emergency services.',
        score: 'A+',
        dm_sent: false,
        called: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add example at the beginning of the array
      setLeads([multiSourceExample, ...fetchedLeads]);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadLeads();
    }
  }, [user]);

  const handleToggleSidebar = () => {
    const newValue = !isSidebarCollapsed;
    setIsSidebarCollapsed(newValue);
    localStorage.setItem('sidebarCollapsed', newValue.toString());
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Get recent leads (last 5)
  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <>
      <Sidebar
        onAddLead={() => setShowAddLead(true)}
        onGoogleSheetsSync={() => {}}
        onDuplicateDetection={() => {}}
        onAnalytics={() => {}}
        onSettings={() => setShowSettings(true)}
        onBulkEdit={() => {}}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />
      
      <div className={`transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
      }`}>
        <main className="py-10 bg-gray-50 min-h-screen">
          <div className="px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
              <p className="mt-2 text-gray-600">Here&apos;s what&apos;s happening with your leads</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Leads</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalLeads}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <UserGroupIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Companies</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.uniqueCompanies}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <BuildingOfficeIcon className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Running Ads</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.companiesWithAds}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <GlobeAltIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">New This Week</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stats.newThisWeek}</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <ArrowTrendingUpIcon className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Quick Actions */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowAddLead(true)}
                    className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <DocumentPlusIcon className="h-5 w-5 text-gray-600" />
                      <span className="font-medium text-gray-900">Add New Lead</span>
                    </div>
                    <span className="text-gray-400">→</span>
                  </button>

                  <button
                    onClick={() => setShowGoogleMapsImport(true)}
                    className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-600" />
                      <span className="font-medium text-gray-900">Search Google Maps</span>
                    </div>
                    <span className="text-gray-400">→</span>
                  </button>

                  <button
                    onClick={() => setShowFacebookAdsSearch(true)}
                    className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <GlobeAltIcon className="h-5 w-5 text-gray-600" />
                      <span className="font-medium text-gray-900">Search Facebook Ads</span>
                    </div>
                    <span className="text-gray-400">→</span>
                  </button>

                  <button
                    onClick={() => router.push('/leads')}
                    className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ChartBarIcon className="h-5 w-5 text-gray-600" />
                      <span className="font-medium text-gray-900">View All Leads</span>
                    </div>
                    <span className="text-gray-400">→</span>
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Leads</h2>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {recentLeads.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {recentLeads.map(lead => (
                        <div key={lead.id} className="p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{lead.company_name}</p>
                              <p className="text-sm text-gray-500">
                                {lead.city} • {lead.service_type}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">
                                {new Date(lead.created_at).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-400">{lead.lead_source}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No leads yet</p>
                      <button
                        onClick={() => setShowAddLead(true)}
                        className="mt-3 text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Add your first lead
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lead Sources */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Sources</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Instagram Manual</span>
                    <span className="text-pink-600 font-semibold">{stats.leadsBySource.instagram}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-pink-600 h-2 rounded-full" 
                      style={{ width: `${stats.totalLeads > 0 ? (stats.leadsBySource.instagram / stats.totalLeads) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">FB Ad Library</span>
                    <span className="text-blue-600 font-semibold">{stats.leadsBySource.fbAds}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${stats.totalLeads > 0 ? (stats.leadsBySource.fbAds / stats.totalLeads) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Google Maps</span>
                    <span className="text-green-600 font-semibold">{stats.leadsBySource.googleMaps}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${stats.totalLeads > 0 ? (stats.leadsBySource.googleMaps / stats.totalLeads) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Modals */}
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
      <AddLeadModal open={showAddLead} onClose={() => setShowAddLead(false)} />
      <GoogleMapsImportModal 
        open={showGoogleMapsImport} 
        onClose={() => setShowGoogleMapsImport(false)} 
      />
      <FacebookAdsSearchModal
        open={showFacebookAdsSearch}
        onClose={() => setShowFacebookAdsSearch(false)}
      />
    </>
  );
}