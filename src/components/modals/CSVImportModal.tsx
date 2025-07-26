import { Fragment, useState, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, DocumentTextIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { useLeadStore } from '@/lib/store';
import { saveLead } from '@/lib/api';
import { Lead } from '@/types';
import toast from 'react-hot-toast';
import { parseCSV, autoDetectMappings, transformToLeads, validateLeads, FieldMapping } from '@/utils/csv-parser';

interface CSVImportModalProps {
  open: boolean;
  onClose: () => void;
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

export default function CSVImportModal({ open, onClose }: CSVImportModalProps) {
  const { addLead } = useLeadStore();
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCSVData] = useState<{ headers: string[]; rows: Record<string, string>[] }>({ headers: [], rows: [] });
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [previewLeads, setPreviewLeads] = useState<Partial<Lead>[]>([]);
  const [validLeads, setValidLeads] = useState<Lead[]>([]);
  const [invalidLeads, setInvalidLeads] = useState<Array<{ lead: Partial<Lead>; reason: string }>>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importDefaults, setImportDefaults] = useState({
    lead_source: 'Instagram Manual' as 'FB Ad Library' | 'Instagram Manual' | 'Google Maps',
    defaultCity: '',
    defaultServiceType: '',
  });

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      readFile(selectedFile);
    }
  }, []);

  const readFile = async (file: File) => {
    try {
      const text = await file.text();
      const parseResult = parseCSV(text);
      
      if (!parseResult.success) {
        toast.error(parseResult.error || 'Failed to parse CSV');
        return;
      }

      setCSVData({ headers: parseResult.headers, rows: parseResult.rows });
      
      // Auto-detect mappings
      const detectedMappings = autoDetectMappings(parseResult.headers);
      setFieldMappings(detectedMappings);
      
      setStep('mapping');
    } catch (error) {
      toast.error('Failed to read file');
      console.error(error);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type !== 'text/csv' && !droppedFile.name.endsWith('.csv')) {
        toast.error('Please drop a CSV file');
        return;
      }
      setFile(droppedFile);
      readFile(droppedFile);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const updateMapping = (csvField: string, leadField: keyof Lead | '') => {
    setFieldMappings(prev => {
      const newMappings = prev.filter(m => m.csvField !== csvField);
      if (leadField) {
        newMappings.push({ csvField, leadField });
      }
      return newMappings;
    });
  };

  const handlePreview = () => {
    const transformed = transformToLeads(csvData.rows, fieldMappings, {
      lead_source: importDefaults.lead_source,
      city: importDefaults.defaultCity || undefined,
      service_type: importDefaults.defaultServiceType || undefined,
    });
    
    setPreviewLeads(transformed);
    
    const validation = validateLeads(transformed);
    setValidLeads(validation.valid);
    setInvalidLeads(validation.invalid);
    
    setStep('preview');
  };

  const handleImport = async () => {
    if (validLeads.length === 0) {
      toast.error('No valid leads to import');
      return;
    }

    setStep('importing');
    setImportProgress(0);
    
    let successCount = 0;
    let errorCount = 0;
    
    try {
      for (let i = 0; i < validLeads.length; i++) {
        try {
          const savedLead = await saveLead(validLeads[i]);
          addLead(savedLead);
          successCount++;
        } catch (error) {
          console.error(`Failed to import lead ${i}:`, error);
          errorCount++;
        }
        
        setImportProgress(((i + 1) / validLeads.length) * 100);
        
        // Small delay to prevent overwhelming the API
        if (i < validLeads.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      setStep('complete');
      
      if (successCount > 0) {
        toast.success(`Imported ${successCount} lead${successCount !== 1 ? 's' : ''}`);
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} lead${errorCount !== 1 ? 's' : ''}`);
      }
    } catch (error) {
      toast.error('Import failed');
      console.error(error);
      setStep('preview');
    }
  };

  const resetImport = () => {
    setStep('upload');
    setFile(null);
    setCSVData({ headers: [], rows: [] });
    setFieldMappings([]);
    setPreviewLeads([]);
    setValidLeads([]);
    setInvalidLeads([]);
    setImportProgress(0);
  };

  const leadFields: Array<{ value: keyof Lead; label: string }> = [
    { value: 'company_name', label: 'Company Name' },
    { value: 'handle', label: 'Instagram Handle' },
    { value: 'phone', label: 'Phone' },
    { value: 'website', label: 'Website' },
    { value: 'city', label: 'City' },
    { value: 'service_type', label: 'Service Type' },
    { value: 'notes', label: 'Notes' },
    { value: 'ad_copy', label: 'Ad Copy' },
    { value: 'price_info', label: 'Price Info' },
  ];

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="absolute right-0 top-0 pr-4 pt-4">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                      onClick={() => {
                        resetImport();
                        onClose();
                      }}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                      <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                        Import from CSV
                      </Dialog.Title>

                      {/* Upload Step */}
                      {step === 'upload' && (
                        <div className="mt-4">
                          <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors"
                          >
                            <div className="space-y-1 text-center">
                              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="flex text-sm text-gray-600">
                                <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 hover:text-blue-500">
                                  <span>Upload a file</span>
                                  <input
                                    id="file-upload"
                                    name="file-upload"
                                    type="file"
                                    className="sr-only"
                                    accept=".csv"
                                    onChange={handleFileSelect}
                                  />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">CSV files only</p>
                            </div>
                          </div>

                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-900">Supported Formats:</h4>
                            <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
                              <li>Standard CSV with headers</li>
                              <li>Close CRM exports</li>
                              <li>Google Maps exports</li>
                              <li>Custom formats (map fields manually)</li>
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Mapping Step */}
                      {step === 'mapping' && (
                        <div className="mt-4">
                          <div className="mb-4">
                            <p className="text-sm text-gray-600">
                              Map your CSV columns to lead fields. We've auto-detected some mappings.
                            </p>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Default Values</h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Lead Source</label>
                                  <select
                                    value={importDefaults.lead_source}
                                    onChange={(e) => setImportDefaults({ ...importDefaults, lead_source: e.target.value as any })}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                  >
                                    <option value="Instagram Manual">Instagram Manual</option>
                                    <option value="FB Ad Library">FB Ad Library</option>
                                    <option value="Google Maps">Google Maps</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Default City</label>
                                  <input
                                    type="text"
                                    value={importDefaults.defaultCity}
                                    onChange={(e) => setImportDefaults({ ...importDefaults, defaultCity: e.target.value })}
                                    placeholder="Optional"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Field Mappings</h4>
                              <div className="max-h-64 overflow-y-auto border rounded-md">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">CSV Column</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Maps To</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sample Data</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {csvData.headers.map((header) => {
                                      const currentMapping = fieldMappings.find(m => m.csvField === header);
                                      const sampleValue = csvData.rows[0]?.[header] || '';
                                      
                                      return (
                                        <tr key={header}>
                                          <td className="px-4 py-2 text-sm text-gray-900">{header}</td>
                                          <td className="px-4 py-2">
                                            <select
                                              value={currentMapping?.leadField || ''}
                                              onChange={(e) => updateMapping(header, e.target.value as keyof Lead)}
                                              className="block w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            >
                                              <option value="">-- Skip --</option>
                                              {leadFields.map(field => (
                                                <option key={field.value} value={field.value}>
                                                  {field.label}
                                                </option>
                                              ))}
                                            </select>
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-500 truncate max-w-xs" title={sampleValue}>
                                            {sampleValue}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Preview Step */}
                      {step === 'preview' && (
                        <div className="mt-4">
                          <div className="mb-4">
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-gray-600">
                                Preview your import. Valid leads will be imported.
                              </p>
                              <div className="text-sm">
                                <span className="text-green-600 font-medium">{validLeads.length} valid</span>
                                {invalidLeads.length > 0 && (
                                  <span className="text-red-600 font-medium ml-2">{invalidLeads.length} invalid</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {invalidLeads.length > 0 && (
                            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
                              <h4 className="text-sm font-medium text-red-800 mb-2">Invalid Leads (will be skipped):</h4>
                              <ul className="text-sm text-red-700 space-y-1">
                                {invalidLeads.slice(0, 5).map((item, index) => (
                                  <li key={index}>
                                    Row {index + 2}: {item.reason}
                                    {item.lead.company_name && ` (${item.lead.company_name})`}
                                  </li>
                                ))}
                                {invalidLeads.length > 5 && (
                                  <li>... and {invalidLeads.length - 5} more</li>
                                )}
                              </ul>
                            </div>
                          )}

                          <div className="border rounded-md max-h-96 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {validLeads.slice(0, 10).map((lead, index) => (
                                  <tr key={index}>
                                    <td className="px-4 py-2 text-sm text-gray-900">{lead.company_name}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500">{lead.phone || '-'}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500">{lead.city || '-'}</td>
                                    <td className="px-4 py-2 text-sm text-gray-500">{lead.service_type || '-'}</td>
                                  </tr>
                                ))}
                                {validLeads.length > 10 && (
                                  <tr>
                                    <td colSpan={4} className="px-4 py-2 text-sm text-gray-500 text-center">
                                      ... and {validLeads.length - 10} more
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Importing Step */}
                      {step === 'importing' && (
                        <div className="mt-4 text-center py-8">
                          <div className="inline-flex items-center">
                            <svg className="animate-spin h-8 w-8 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-lg">Importing leads...</span>
                          </div>
                          <div className="mt-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${importProgress}%` }}
                              />
                            </div>
                            <p className="mt-2 text-sm text-gray-600">{Math.round(importProgress)}% complete</p>
                          </div>
                        </div>
                      )}

                      {/* Complete Step */}
                      {step === 'complete' && (
                        <div className="mt-4 text-center py-8">
                          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="mt-2 text-lg font-medium text-gray-900">Import Complete!</p>
                          <p className="mt-1 text-sm text-gray-500">
                            Successfully imported {validLeads.length} lead{validLeads.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  {step === 'mapping' && (
                    <button
                      type="button"
                      onClick={handlePreview}
                      disabled={fieldMappings.length === 0}
                      className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Preview Import
                    </button>
                  )}
                  
                  {step === 'preview' && (
                    <>
                      <button
                        type="button"
                        onClick={handleImport}
                        disabled={validLeads.length === 0}
                        className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Import {validLeads.length} Lead{validLeads.length !== 1 ? 's' : ''}
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep('mapping')}
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:mr-3 sm:w-auto"
                      >
                        Back
                      </button>
                    </>
                  )}
                  
                  {(step === 'upload' || step === 'complete') && (
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={() => {
                        if (step === 'complete') {
                          resetImport();
                        }
                        onClose();
                      }}
                    >
                      {step === 'complete' ? 'Done' : 'Cancel'}
                    </button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}