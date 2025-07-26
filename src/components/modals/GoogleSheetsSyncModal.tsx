import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CloudArrowUpIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { useLeadStore } from '@/lib/store';
import { GoogleSheetsAPI, syncLeadsToGoogleSheets } from '@/lib/google-sheets-api';
import toast from 'react-hot-toast';

interface GoogleSheetsSyncModalProps {
  open: boolean;
  onClose: () => void;
}

type SyncStatus = 'idle' | 'testing' | 'syncing' | 'success' | 'error';

export default function GoogleSheetsSyncModal({ open, onClose }: GoogleSheetsSyncModalProps) {
  const { leads, googleScriptUrl, setGoogleScriptUrl } = useLeadStore();
  const [scriptUrl, setScriptUrl] = useState(googleScriptUrl);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncProgress, setSyncProgress] = useState(0);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncOptions, setSyncOptions] = useState({
    syncAll: true,
    onlyNew: false,
    updateExisting: false,
    batchSize: 50,
  });

  useEffect(() => {
    setScriptUrl(googleScriptUrl);
  }, [googleScriptUrl]);

  const handleTestConnection = async () => {
    if (!scriptUrl) {
      toast.error('Please enter a Google Apps Script URL');
      return;
    }

    setSyncStatus('testing');
    setTestResult(null);

    try {
      const api = new GoogleSheetsAPI(scriptUrl);
      const isConnected = await api.testConnection();
      
      if (isConnected) {
        // Try to set up the sheet structure
        try {
          const setupResult = await api.setup();
          setTestResult({
            success: true,
            message: 'Connection successful! Sheet is ready for sync.',
          });
          setGoogleScriptUrl(scriptUrl);
        } catch (error) {
          // Setup might fail due to CORS, but connection works
          setTestResult({
            success: true,
            message: 'Connection successful! You may need to run setup manually in Google Sheets.',
          });
          setGoogleScriptUrl(scriptUrl);
        }
      } else {
        setTestResult({
          success: false,
          message: 'Could not connect. Please check your script URL and deployment settings.',
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      });
    } finally {
      setSyncStatus('idle');
    }
  };

  const handleSync = async () => {
    if (!scriptUrl) {
      toast.error('Please configure Google Apps Script URL first');
      return;
    }

    setSyncStatus('syncing');
    setSyncProgress(0);

    try {
      const leadsToSync = syncOptions.onlyNew 
        ? leads.filter(lead => !lead.close_crm_id) // Using close_crm_id as a proxy for "synced"
        : leads;

      await syncLeadsToGoogleSheets(leadsToSync, scriptUrl, {
        onProgress: setSyncProgress,
        batchSize: syncOptions.batchSize,
      });

      setSyncStatus('success');
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
        setSyncStatus('idle');
        setSyncProgress(0);
      }, 2000);
    } catch (error) {
      setSyncStatus('error');
      console.error('Sync failed:', error);
    }
  };

  const getSyncMessage = () => {
    switch (syncStatus) {
      case 'testing':
        return 'Testing connection...';
      case 'syncing':
        return `Syncing leads... ${Math.round(syncProgress)}%`;
      case 'success':
        return 'Sync completed successfully!';
      case 'error':
        return 'Sync failed. Please try again.';
      default:
        return '';
    }
  };

  const leadsToSyncCount = syncOptions.onlyNew 
    ? leads.filter(lead => !lead.close_crm_id).length 
    : leads.length;

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="absolute right-0 top-0 pr-4 pt-4">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                      onClick={onClose}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                      <CloudArrowUpIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                        Sync to Google Sheets
                      </Dialog.Title>

                      <div className="mt-4 space-y-4">
                        {/* Script URL Configuration */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Google Apps Script URL
                          </label>
                          <input
                            type="text"
                            value={scriptUrl}
                            onChange={(e) => setScriptUrl(e.target.value)}
                            placeholder="https://script.google.com/macros/s/..."
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                          <button
                            onClick={handleTestConnection}
                            disabled={!scriptUrl || syncStatus === 'testing'}
                            className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                          >
                            Test Connection
                          </button>
                        </div>

                        {/* Test Result */}
                        {testResult && (
                          <div className={`p-3 rounded-md ${testResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                            <div className="flex">
                              {testResult.success ? (
                                <CheckCircleIcon className="h-5 w-5 text-green-400" />
                              ) : (
                                <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                              )}
                              <p className={`ml-2 text-sm ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                {testResult.message}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Sync Options */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-900">Sync Options</h4>
                          
                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={syncOptions.syncAll}
                              onChange={() => setSyncOptions({ ...syncOptions, syncAll: true, onlyNew: false })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              Sync all leads ({leads.length} total)
                            </span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="radio"
                              checked={syncOptions.onlyNew}
                              onChange={() => setSyncOptions({ ...syncOptions, syncAll: false, onlyNew: true })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              Only sync new leads ({leads.filter(l => !l.close_crm_id).length} new)
                            </span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={syncOptions.updateExisting}
                              onChange={(e) => setSyncOptions({ ...syncOptions, updateExisting: e.target.checked })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              Update existing leads if found
                            </span>
                          </label>
                        </div>

                        {/* Progress */}
                        {syncStatus === 'syncing' && (
                          <div>
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Syncing leads...</span>
                              <span>{Math.round(syncProgress)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${syncProgress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Status Message */}
                        {syncStatus !== 'idle' && (
                          <div className={`text-center py-2 text-sm font-medium ${
                            syncStatus === 'success' ? 'text-green-600' : 
                            syncStatus === 'error' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {getSyncMessage()}
                          </div>
                        )}

                        {/* Instructions */}
                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Setup Instructions:</h4>
                          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                            <li>Create a new Google Sheet</li>
                            <li>Go to Extensions → Apps Script</li>
                            <li>Copy the provided script code</li>
                            <li>Deploy as Web App (Execute as: You, Access: Anyone)</li>
                            <li>Copy the Web App URL and paste it above</li>
                          </ol>
                          <a
                            href="/google-apps-script/Code.gs"
                            download="LeadTrackerScript.gs"
                            className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-500"
                          >
                            Download Script Template
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    onClick={handleSync}
                    disabled={!scriptUrl || !testResult?.success || syncStatus !== 'idle' || leadsToSyncCount === 0}
                    className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sync {leadsToSyncCount} Lead{leadsToSyncCount !== 1 ? 's' : ''}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}