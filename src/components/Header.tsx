import { useState } from 'react';
import { useLeadStore } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import AddLeadModal from './modals/AddLeadModal';
import BulkImportModal from './modals/BulkImportModal';
import SettingsModal from './modals/SettingsModal';
import GoogleSheetsExportModal from './modals/GoogleSheetsExportModal';
import CloseCRMExportModal from './modals/CloseCRMExportModal';
import GoogleSheetsSyncModal from './modals/GoogleSheetsSyncModal';
import DuplicateDetectionModal from './modals/DuplicateDetectionModal';
import CSVImportModal from './modals/CSVImportModal';
import AnalyticsDashboardModal from './modals/AnalyticsDashboardModal';
import { ArrowPathIcon, PlusIcon, CloudArrowUpIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, ArrowsRightLeftIcon, MagnifyingGlassCircleIcon, DocumentArrowUpIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { exportToCSV, exportToGoogleSheets } from '@/utils/export';

interface HeaderProps {
  onRefresh: () => void;
}

export default function Header({ onRefresh }: HeaderProps) {
  const { leads } = useLeadStore();
  const { user, signOut } = useAuth();
  const [showAddLead, setShowAddLead] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGoogleSheetsExport, setShowGoogleSheetsExport] = useState(false);
  const [showCloseCRMExport, setShowCloseCRMExport] = useState(false);
  const [showGoogleSheetsSync, setShowGoogleSheetsSync] = useState(false);
  const [showDuplicateDetection, setShowDuplicateDetection] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  const handleGoogleSheetsExport = () => {
    const success = exportToGoogleSheets(leads);
    if (success) {
      setShowGoogleSheetsExport(true);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🎯 Lead Tracker Pro</h1>
          <p className="text-sm text-gray-600 mt-1">Welcome, {user?.user_metadata?.full_name || user?.email}</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddLead(true)}
            className="btn btn-success"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Add Lead
          </button>
          
          <button
            onClick={() => setShowBulkImport(true)}
            className="btn btn-primary"
          >
            <CloudArrowUpIcon className="h-5 w-5 mr-1" />
            Bulk Import
          </button>
          
          <button
            onClick={() => setShowCSVImport(true)}
            className="btn btn-secondary"
            title="Import from CSV file"
          >
            <DocumentArrowUpIcon className="h-5 w-5 mr-1" />
            Import CSV
          </button>
          
          <button
            onClick={handleGoogleSheetsExport}
            className="btn btn-secondary"
          >
            📊 Export to Sheets
          </button>
          
          <button
            onClick={() => setShowGoogleSheetsSync(true)}
            className="btn btn-secondary"
          >
            <ArrowsRightLeftIcon className="h-5 w-5 mr-1" />
            Sync Sheets
          </button>
          
          <button
            onClick={() => exportToCSV(leads)}
            className="btn btn-secondary"
          >
            💾 Export CSV
          </button>
          
          <button
            onClick={() => setShowCloseCRMExport(true)}
            className="btn btn-secondary"
          >
            🚀 Export for Close
          </button>
          
          <button
            onClick={() => setShowDuplicateDetection(true)}
            className="btn btn-secondary"
            title="Find duplicate leads"
          >
            <MagnifyingGlassCircleIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => setShowAnalytics(true)}
            className="btn btn-secondary"
            title="View analytics"
          >
            <ChartBarIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={onRefresh}
            className="btn btn-secondary"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => setShowSettings(true)}
            className="btn btn-secondary"
          >
            <Cog6ToothIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={signOut}
            className="btn btn-secondary"
            title="Sign out"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <AddLeadModal open={showAddLead} onClose={() => setShowAddLead(false)} />
      <BulkImportModal open={showBulkImport} onClose={() => setShowBulkImport(false)} />
      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
      <GoogleSheetsExportModal open={showGoogleSheetsExport} onClose={() => setShowGoogleSheetsExport(false)} />
      <CloseCRMExportModal open={showCloseCRMExport} onClose={() => setShowCloseCRMExport(false)} />
      <GoogleSheetsSyncModal open={showGoogleSheetsSync} onClose={() => setShowGoogleSheetsSync(false)} />
      <DuplicateDetectionModal open={showDuplicateDetection} onClose={() => setShowDuplicateDetection(false)} />
      <CSVImportModal open={showCSVImport} onClose={() => setShowCSVImport(false)} />
      <AnalyticsDashboardModal open={showAnalytics} onClose={() => setShowAnalytics(false)} />
    </>
  );
}