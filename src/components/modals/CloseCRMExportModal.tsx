import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline';
import { useLeadStore } from '@/lib/store';
import { Lead } from '@/types';
import { updateLead } from '@/lib/api';
import toast from 'react-hot-toast';

interface CloseCRMExportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CloseCRMExportModal({ open, onClose }: CloseCRMExportModalProps) {
  const { leads, updateLead: updateLeadInStore } = useLeadStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeOnlyPhone: true,
    excludeExported: true,
    includeInstagram: true,
    includeWebsite: true,
    includeAdInfo: true,
    includeNotes: true,
    groupByService: false,
    leadStatus: 'potential',
    markAsExported: true
  });

  const getFilteredLeads = () => {
    return leads.filter(lead => {
      if (exportOptions.includeOnlyPhone && !lead.phone) return false;
      if (exportOptions.excludeExported && lead.close_crm_id) return false;
      return true;
    });
  };

  const formatPhoneForClose = (phone: string | null | undefined): string => {
    if (!phone) return '';
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    // Format as Close expects: +1XXXXXXXXXX for US numbers
    if (digits.length === 10) {
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    return phone; // Return original if not standard US format
  };

  const handleExport = async () => {
    const filteredLeads = getFilteredLeads();
    
    if (filteredLeads.length === 0) {
      toast.error('No leads match the export criteria');
      return;
    }

    setIsExporting(true);

    // Close CRM CSV format with custom fields
    const headers = [
      'lead_name', // Company name
      'status_label', // Lead status
      'primary_phone',
      'company_website',
      'lead_source',
      'custom.cf_service_type',
      'custom.cf_city',
      'custom.cf_running_ads',
      'custom.cf_instagram_handle',
      'custom.cf_instagram_url',
      'custom.cf_ad_copy',
      'description' // Notes and other info
    ];

    const statusMap: { [key: string]: string } = {
      'potential': 'Potential',
      'interested': 'Interested',
      'upfront': 'Upfront About Budget',
      'unqualified': 'Unqualified',
      'badfit': 'Bad Fit'
    };

    const rows = filteredLeads.map(lead => {
      const description = [
        lead.notes,
        exportOptions.includeAdInfo && lead.ad_copy ? `Ad Copy: ${lead.ad_copy}` : '',
        `Source: ${lead.lead_source}`,
        `Added: ${new Date(lead.created_at).toLocaleDateString()}`
      ].filter(Boolean).join('\n\n');

      return [
        lead.company_name,
        statusMap[exportOptions.leadStatus] || 'Potential',
        formatPhoneForClose(lead.phone),
        exportOptions.includeWebsite ? (lead.website || '') : '',
        lead.lead_source || 'Lead Tracker',
        lead.service_type || '',
        lead.city || '',
        lead.running_ads ? 'Yes' : 'No',
        exportOptions.includeInstagram ? (lead.handle || '') : '',
        exportOptions.includeInstagram ? (lead.instagram_url || '') : '',
        exportOptions.includeAdInfo ? (lead.ad_copy || '') : '',
        exportOptions.includeNotes ? description : ''
      ];
    });

    // Sort by service type if requested
    if (exportOptions.groupByService) {
      rows.sort((a, b) => (a[5] || '').localeCompare(b[5] || ''));
    }

    const csv = [headers, ...rows]
      .map(row => row.map(cell => {
        const cellStr = String(cell || '');
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `close-crm-import-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredLeads.length} leads for Close CRM`);

    // Mark leads as exported if option is selected
    if (exportOptions.markAsExported) {
      try {
        const exportDate = new Date().toISOString();
        const updatePromises = filteredLeads.map(lead => 
          updateLead(lead.id, { close_crm_id: `exported_${exportDate}` })
            .then(updatedLead => updateLeadInStore(updatedLead))
        );
        
        await Promise.all(updatePromises);
        toast.success('Leads marked as exported');
      } catch (error) {
        console.error('Failed to mark some leads as exported:', error);
        toast.error('Warning: Some leads may not have been marked as exported');
      }
    }

    setIsExporting(false);
    onClose();
  };

  const filteredCount = getFilteredLeads().length;

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
                      <CloudArrowDownIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                        Export for Close CRM
                      </Dialog.Title>
                      
                      <div className="mt-4 space-y-4">
                        <div className="bg-blue-50 p-3 rounded-md">
                          <p className="text-sm text-blue-800">
                            This export is optimized for Close CRM's CSV import format with custom fields.
                            {filteredCount > 0 && (
                              <span className="block mt-1 font-medium">
                                {filteredCount} leads will be exported
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-900">Filter Options</h4>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={exportOptions.includeOnlyPhone}
                              onChange={(e) => setExportOptions({ ...exportOptions, includeOnlyPhone: e.target.checked })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Only include leads with phone numbers</span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={exportOptions.excludeExported}
                              onChange={(e) => setExportOptions({ ...exportOptions, excludeExported: e.target.checked })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Exclude already exported leads</span>
                          </label>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-900">Include Fields</h4>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={exportOptions.includeInstagram}
                              onChange={(e) => setExportOptions({ ...exportOptions, includeInstagram: e.target.checked })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Instagram handle & URL</span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={exportOptions.includeWebsite}
                              onChange={(e) => setExportOptions({ ...exportOptions, includeWebsite: e.target.checked })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Website</span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={exportOptions.includeAdInfo}
                              onChange={(e) => setExportOptions({ ...exportOptions, includeAdInfo: e.target.checked })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Ad copy & pricing info</span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={exportOptions.includeNotes}
                              onChange={(e) => setExportOptions({ ...exportOptions, includeNotes: e.target.checked })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Notes & descriptions</span>
                          </label>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-900">Export Options</h4>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={exportOptions.groupByService}
                              onChange={(e) => setExportOptions({ ...exportOptions, groupByService: e.target.checked })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Group by service type</span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={exportOptions.markAsExported}
                              onChange={(e) => setExportOptions({ ...exportOptions, markAsExported: e.target.checked })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Mark leads as exported to Close</span>
                          </label>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Default Lead Status
                            </label>
                            <select
                              value={exportOptions.leadStatus}
                              onChange={(e) => setExportOptions({ ...exportOptions, leadStatus: e.target.value })}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                              <option value="potential">Potential</option>
                              <option value="interested">Interested</option>
                              <option value="upfront">Upfront About Budget</option>
                              <option value="unqualified">Unqualified</option>
                              <option value="badfit">Bad Fit</option>
                            </select>
                          </div>
                        </div>

                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Import Instructions:</h4>
                          <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                            <li>Go to Close CRM → Settings → Import/Export</li>
                            <li>Click "Import Leads" and upload this CSV</li>
                            <li>Map the custom fields (cf_*) to your Close custom fields</li>
                            <li>Review and confirm the import</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={filteredCount === 0 || isExporting}
                    className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? 'Exporting...' : `Export ${filteredCount} Lead${filteredCount !== 1 ? 's' : ''}`}
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