'use client';

import { useEffect, useState, useRef } from 'react';
import { useLeadStore } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import SimpleHeader from '@/components/SimpleHeader';
import LeadTable from '@/components/LeadTable';
import LeadGrid from '@/components/LeadGrid';
import EnhancedFilters from '@/components/EnhancedFilters';
import ViewToggle from '@/components/ViewToggle';
import ViewDensityToggle from '@/components/ViewDensityToggle';
import AddLeadModal from '@/components/modals/AddLeadModal';
import BulkImportModal from '@/components/modals/BulkImportModal';
import BulkEditModal from '@/components/modals/BulkEditModal';
import SettingsModal from '@/components/modals/SettingsModal';
import GoogleSheetsExportModal from '@/components/modals/GoogleSheetsExportModal';
import CloseCRMExportModal from '@/components/modals/CloseCRMExportModal';
import GoogleSheetsSyncModal from '@/components/modals/GoogleSheetsSyncModal';
import DuplicateDetectionModal from '@/components/modals/DuplicateDetectionModal';
import CSVImportModal from '@/components/modals/CSVImportModal';
import AdPlatformModal from '@/components/modals/AdPlatformModal';
import GoogleMapsImportModal from '@/components/modals/GoogleMapsImportModal';
import FacebookAdsSearchModal from '@/components/modals/FacebookAdsSearchModal';
import { Menu, Transition } from '@headlessui/react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { Fragment } from 'react';

import { fetchLeads } from '@/lib/api';
import { exportToGoogleSheets, exportToCSV } from '@/utils/export';
import { Lead } from '@/types';

export default function LeadsPage() {
  const { 
    setLeads, 
    leads, 
    selectedLeads, 
    setSelectedLeads, 
    viewMode,
    sourceFilter,
    cityFilter,
    serviceTypeFilter
  } = useLeadStore();
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      return saved === 'true';
    }
    return false;
  });
  
  // Header collapse state
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  
  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    handle: true,
    company: true,
    type: true,
    city: true,
    phone: true,
    email: true,
    rating: true,
    links: true,
    source: true,
    ads: true,
    adPlatforms: true,
    notes: false, // Hide by default
    close: false, // Hide by default
    actions: true
  });
  
  // Modal states
  const [showAddLead, setShowAddLead] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGoogleSheetsExport, setShowGoogleSheetsExport] = useState(false);
  const [showCloseCRMExport, setShowCloseCRMExport] = useState(false);
  const [showGoogleSheetsSync, setShowGoogleSheetsSync] = useState(false);
  const [showDuplicateDetection, setShowDuplicateDetection] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [showAdPlatformCheck, setShowAdPlatformCheck] = useState(false);
  const [showGoogleMapsImport, setShowGoogleMapsImport] = useState(false);
  const [showFacebookAdsSearch, setShowFacebookAdsSearch] = useState(false);

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
        ad_copy: '🚰 Emergency Plumbing Services Available 24/7! Licensed & Insured. Same-day service for all your plumbing needs.', // Legacy single ad copy
        ad_call_to_action: 'Get Quote',
        ad_platform: 'Facebook',
        ad_platforms: [
          {
            platform: 'Facebook Ads',
            hasAds: true,
            lastChecked: new Date().toISOString(),
            adCount: 3,
            notes: 'Running multiple campaigns targeting Phoenix metro area',
            ads: [
              {
                id: 'fb-ad-1',
                type: 'image',
                headline: '24/7 Emergency Plumbing Services',
                primaryText: '🚰 Burst pipe? Clogged drain? We\'re here 24/7! Licensed & insured plumbers ready to help. Same-day service available.',
                description: 'Phoenix\'s most trusted emergency plumbing service',
                callToAction: 'Get Quote',
                status: 'active',
                imageUrl: '/api/placeholder/400/300',
                lastSeen: new Date().toISOString(),
                targeting: {
                  locations: ['Phoenix, AZ', 'Scottsdale, AZ', 'Mesa, AZ'],
                  ageRange: '25-65+',
                }
              },
              {
                id: 'fb-ad-2',
                type: 'video',
                headline: 'Save 20% on Drain Cleaning',
                primaryText: '🎯 Special Offer: Professional drain cleaning starting at $89 (reg $109). Fast, reliable service by certified plumbers.',
                callToAction: 'Book Now',
                status: 'active',
                videoUrl: '/api/placeholder/video',
                thumbnailUrl: '/api/placeholder/400/300',
                lastSeen: new Date().toISOString(),
                spend: '$1,250',
              },
              {
                id: 'fb-ad-3',
                type: 'carousel',
                headline: 'Complete Plumbing Services',
                primaryText: 'From repairs to remodels - we do it all! ✅ Water heaters ✅ Pipe repair ✅ Bathroom remodels ✅ Kitchen plumbing',
                callToAction: 'Learn More',
                status: 'active',
                lastSeen: new Date(Date.now() - 86400000).toISOString(), // Yesterday
              }
            ]
          },
          {
            platform: 'Google Ads',
            hasAds: true,
            lastChecked: new Date().toISOString(),
            adCount: 2,
            notes: 'Running search ads for emergency plumbing keywords',
            ads: [
              {
                id: 'google-ad-1',
                type: 'text',
                headline: 'Emergency Plumber Phoenix - Available 24/7',
                description: 'Licensed plumbers ready now. Fast response, fair prices. Call for same-day service.',
                callToAction: 'Call Now',
                status: 'active',
                lastSeen: new Date().toISOString(),
              },
              {
                id: 'google-ad-2',
                type: 'text',
                headline: 'Phoenix Plumbing Repair - $50 Off First Service',
                description: 'Professional plumbing repairs. Water heaters, pipes, drains & more. Licensed & insured.',
                callToAction: 'Get $50 Off',
                status: 'active',
                spend: '$2,800/month',
                lastSeen: new Date().toISOString(),
              }
            ]
          }
        ],
        total_ad_platforms: 2,
        notes: '🔗 Multi-source lead: Found in both Google Maps and FB Ad Library\n\nHigh-value lead! Established business with strong online presence and active marketing campaigns. Google Maps shows 127 reviews with 4.8 rating. Running Facebook ads for emergency services. Total of 5 active ads across Facebook and Google.',
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

  // Handle scroll to collapse header
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      if (scrollPosition > 20) {
        setIsHeaderCollapsed(true);
      } else {
        setIsHeaderCollapsed(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    // Check initial scroll position
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        loadLeads();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    const handleFocus = () => {
      if (user) {
        loadLeads();
      }
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  const handleGoogleSheetsExport = async () => {
    if (selectedLeads.length === 0) {
      alert('Please select leads to export');
      return;
    }
    setShowGoogleSheetsExport(true);
  };

  const handleToggleSidebar = () => {
    const newValue = !isSidebarCollapsed;
    setIsSidebarCollapsed(newValue);
    localStorage.setItem('sidebarCollapsed', newValue.toString());
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
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

  // Filter leads based on all active filters
  const filteredLeads = leads.filter((lead) => {
    // Source filter
    if (lead.lead_source === 'Instagram Manual' && !sourceFilter.instagram) return false;
    if (lead.lead_source === 'FB Ad Library' && !sourceFilter.adLibrary) return false;
    if (lead.lead_source === 'Google Maps' && !sourceFilter.googleMaps) return false;
    
    // City filter
    if (cityFilter !== 'all' && lead.city !== cityFilter) return false;
    
    // Service type filter
    if (serviceTypeFilter !== 'all' && lead.service_type !== serviceTypeFilter) return false;
    
    return true;
  });

  return (
    <>
      <Sidebar
        onAddLead={() => setShowAddLead(true)}
        onGoogleSheetsSync={() => setShowGoogleSheetsSync(true)}
        onDuplicateDetection={() => setShowDuplicateDetection(true)}
        onAnalytics={() => {}}
        onSettings={() => setShowSettings(true)}
        onBulkEdit={() => setShowBulkEdit(true)}
        onAdPlatformCheck={() => setShowAdPlatformCheck(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />
      
      <div className={`transition-all duration-300 min-h-screen bg-white dark:bg-gray-900 ${
        isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-56'
      }`}>
        {/* Fixed header positioned at the top level */}
        <div className={`fixed top-0 right-0 transition-all duration-300 ease-in-out z-40 ${
          isHeaderCollapsed 
            ? 'bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700' 
            : 'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800'
        } ${isSidebarCollapsed ? 'lg:left-16 left-0' : 'lg:left-56 left-0'}`}>
            <div className="px-2 sm:px-3 lg:px-4">
              {/* Always-present header wrapper with smooth height transition */}
              <div className={`transition-all duration-300 ease-in-out ${
                isHeaderCollapsed ? 'py-1' : 'py-1.5'
              }`}>
                {/* Cleaner single-row layout */}
                <div className={`transition-all duration-300 ease-in-out ${
                  isHeaderCollapsed 
                    ? 'scale-y-0 opacity-0 max-h-0 pointer-events-none' 
                    : 'scale-y-100 opacity-100'
                }`}>
                  <SimpleHeader
                    onBulkImport={() => setShowBulkImport(true)}
                    onCSVImport={() => setShowCSVImport(true)}
                    onGoogleMapsImport={() => setShowGoogleMapsImport(true)}
                    onFacebookAdsSearch={() => setShowFacebookAdsSearch(true)}
                    onGoogleSheetsExport={handleGoogleSheetsExport}
                    onCSVExport={() => exportToCSV(leads)}
                    onCloseCRMExport={() => setShowCloseCRMExport(true)}
                  />
                </div>
                
                {/* Filters and controls bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-2">
                  {/* Left side: Collapsed header indicator + Filters */}
                  <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                    {/* Lead count - only visible when collapsed */}
                    <div className={`flex items-center gap-2 transition-all duration-300 ${
                      isHeaderCollapsed ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
                    }`}>
                      <span className="text-[10px] text-gray-400">▼</span>
                      <div className="flex items-center gap-1 text-sm flex-shrink-0">
                        <span className="font-semibold text-gray-800">{filteredLeads.length}</span>
                        <span className="text-gray-400 text-xs">/</span>
                        <span className="text-gray-500 text-xs">{leads.length}</span>
                      </div>
                    </div>
                    
                    {/* Filters */}
                    <EnhancedFilters compact={isHeaderCollapsed} />
                  </div>
                  
                  {/* Right side: View controls */}
                  <div className="flex items-center gap-2 ml-auto">
                      {/* Column visibility dropdown */}
                      <Menu as="div" className="relative inline-block text-left">
                      <div>
                        <Menu.Button className={`inline-flex items-center border border-gray-200 font-medium rounded text-gray-600 bg-white hover:bg-gray-50 hover:text-gray-900 focus:outline-none transition-all duration-300 ${
                          isHeaderCollapsed ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs'
                        }`}>
                          <EyeIcon className="h-3.5 w-3.5" />
                          {!isHeaderCollapsed && <span className="ml-1">Columns</span>}
                        </Menu.Button>
                      </div>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none z-[45]">
                          <div className="py-1">
                            {(Object.entries(visibleColumns) as [keyof typeof visibleColumns, boolean][]).map(([column, visible]) => (
                              <Menu.Item key={column}>
                                {({ active }) => (
                                  <button
                                    onClick={() => setVisibleColumns(prev => ({ ...prev, [column]: !prev[column as keyof typeof visibleColumns] }))}
                                    className={`${
                                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                    } group flex items-center justify-between px-4 py-2 text-sm w-full`}
                                  >
                                    <span className="capitalize">{column.replace(/([A-Z])/g, ' $1').trim()}</span>
                                    {visible ? (
                                      <EyeIcon className="h-4 w-4 text-gray-400" />
                                    ) : (
                                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                                    )}
                                  </button>
                                )}
                              </Menu.Item>
                            ))}
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                    
                    {/* View density toggle - always present, just changes compact mode */}
                    <ViewDensityToggle compact={isHeaderCollapsed} />
                    
                    {/* View toggle - always present, just changes compact mode */}
                    <ViewToggle compact={isHeaderCollapsed} />
                  </div>
                </div>
              </div>
            </div>
        </div>
        
        {/* Main content area */}
        <main className={`bg-gray-50 dark:bg-gray-900 min-h-screen transition-all duration-300 ${
          isHeaderCollapsed ? 'pt-12' : 'pt-20'
        }`} ref={mainRef}>
          <div className="pt-2 relative z-10">
            {/* Conditional rendering based on view mode */}
            {viewMode === 'table' ? (
              <LeadTable 
                visibleColumns={visibleColumns} 
                setVisibleColumns={setVisibleColumns}
                isHeaderCollapsed={isHeaderCollapsed}
              />
            ) : (
              <LeadGrid />
            )}
          </div>
        </main>
      </div>
      
      {/* Modals */}
      <AddLeadModal open={showAddLead} onClose={() => setShowAddLead(false)} />
      <BulkImportModal open={showBulkImport} onClose={() => setShowBulkImport(false)} />
      <BulkEditModal 
        open={showBulkEdit} 
        onClose={() => {
          setShowBulkEdit(false);
          setSelectedLeads([]);
        }} 
        selectedLeadIds={selectedLeads}
      />
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
      <GoogleSheetsExportModal 
        open={showGoogleSheetsExport} 
        onClose={() => setShowGoogleSheetsExport(false)} 
      />
      <CloseCRMExportModal 
        open={showCloseCRMExport} 
        onClose={() => setShowCloseCRMExport(false)} 
      />
      <GoogleSheetsSyncModal open={showGoogleSheetsSync} onClose={() => setShowGoogleSheetsSync(false)} />
      <DuplicateDetectionModal open={showDuplicateDetection} onClose={() => setShowDuplicateDetection(false)} />
      <CSVImportModal open={showCSVImport} onClose={() => setShowCSVImport(false)} />
      <AdPlatformModal 
        open={showAdPlatformCheck} 
        onClose={() => setShowAdPlatformCheck(false)} 
        selectedLeadIds={selectedLeads}
      />
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