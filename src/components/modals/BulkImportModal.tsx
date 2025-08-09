import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useLeadStore } from '@/lib/store';
import { saveLead } from '@/lib/api';
import { Lead } from '@/types';
import toast from 'react-hot-toast';
import { createImportOperation } from '@/lib/import-operations-api';
import KeywordAssistant from '../KeywordAssistant';
import USCityAutocomplete from '../USCityAutocomplete';
import ServiceTypeDropdown from '../ServiceTypeDropdown';
import { extractWithAI, extractWithAIStream } from '@/lib/api';
import { detectDataFormat } from '@/utils/data-format-detector';
import { findDuplicateLead } from '@/utils/duplicate-detection';

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function BulkImportModal({ open, onClose }: BulkImportModalProps) {
  const { openaiApiKey, addLead, leads, keywordSession } = useLeadStore();
  const [bulkData, setBulkData] = useState('');
  const [bulkCity, setBulkCity] = useState('');
  const bulkSource = 'FB Ad Library'; // Fixed source since this modal is only for FB Ad Library
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<Lead[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const streamingMode = true; // Always use streaming for better UX
  const [processedCount, setProcessedCount] = useState(0);
  const [selectedServiceType, setSelectedServiceType] = useState('');
  const [duplicateLeads, setDuplicateLeads] = useState<Lead[]>([]);
  const [importMode, setImportMode] = useState<'new' | 'update' | 'all'>('new');


  const handleAIExtract = async () => {
    if (!bulkData.trim()) {
      toast.error('Please paste some data to extract');
      return;
    }

    console.log('Starting AI extraction...');
    console.log('Data length:', bulkData.length);
    console.log('First 200 chars:', bulkData.substring(0, 200));

    setIsProcessing(true);
    setPreview([]);
    setShowPreview(true);
    setProcessedCount(0);
    
    try {
      // Detect data format
      const formatResult = detectDataFormat(bulkData);
      console.log('Detected format:', formatResult);
      
      // Show appropriate toast based on format
      if (formatResult.format === 'facebook-ad-library' && formatResult.confidence >= 70) {
        toast('Detected Facebook Ad Library format. Using AI with structured outputs...', { icon: '🎯' });
        const sponsoredCount = formatResult.metadata?.sponsoredCount || 0;
        if (sponsoredCount > 0) {
          toast(`Found ${sponsoredCount} ads to extract...`, { icon: '📊' });
        }
      } else {
        toast(`Using AI extraction for ${formatResult.format} data...`, { icon: '🤖' });
      }
      
      if (streamingMode) {
        // Streaming mode - show leads as they come in
        const collectedNewLeads: Lead[] = [];
        const collectedDuplicates: Lead[] = [];
        
        console.log('Starting streaming extraction...');
        console.log('OpenAI API Key available:', !!openaiApiKey);
        
        if (!openaiApiKey) {
          toast.error('OpenAI API key is required. Please set it in Settings.');
          setIsProcessing(false);
          return;
        }
        
        await extractWithAIStream(
          bulkData,
          bulkCity,
          selectedServiceType,
          openaiApiKey,
          (lead: Lead) => {
            console.log('Received lead:', lead.company_name);
            
            // Check if duplicate using improved detection
            const existingLead = findDuplicateLead(lead, leads, { 
              checkCity: true, 
              similarityThreshold: 0.8 
            });
            
            if (existingLead) {
              // It's a duplicate - add to duplicates list with reference to existing
              const duplicateWithRef = { ...lead, existingId: existingLead.id };
              collectedDuplicates.push(duplicateWithRef);
              setDuplicateLeads(prev => [...prev, duplicateWithRef]);
            } else {
              // Check if it's duplicate within current extraction
              const isDuplicateInBatch = findDuplicateLead(lead, collectedNewLeads as Lead[], {
                checkCity: true,
                similarityThreshold: 0.8
              });
              
              if (!isDuplicateInBatch) {
                collectedNewLeads.push(lead);
                setPreview(prev => [...prev, lead]);
              }
            }
            
            setProcessedCount(prev => prev + 1);
          },
          (error) => {
            console.error('Streaming error:', error);
            toast.error(`Error during AI extraction: ${error}`);
            setIsProcessing(false);
          }
        );
        
        const totalFound = collectedNewLeads.length + collectedDuplicates.length;
        
        if (totalFound === 0) {
          toast.error('No leads found in the provided text');
          setIsProcessing(false);
          return;
        }
        
        toast.success(`Found ${totalFound} leads (${collectedNewLeads.length} new, ${collectedDuplicates.length} duplicates)`);
        
        // Add to session if active
        if (keywordSession.active && importMode === 'new') {
          useLeadStore.getState().addSessionResults(collectedNewLeads);
        }
        
        setIsProcessing(false);
      } else {
        // Non-streaming mode - wait for all leads
        const extractedLeads = await extractWithAI(
          bulkData,
          bulkCity,
          selectedServiceType,
          openaiApiKey
        );

        if (extractedLeads.length === 0) {
          toast.error('No leads found in the provided text');
          return;
        }

        // Filter out duplicates
        const newLeads = extractedLeads.filter(
          lead => !leads.some(
            existing => 
              existing.company_name.toLowerCase() === lead.company_name.toLowerCase() ||
              (existing.handle && lead.handle && existing.handle.toLowerCase() === lead.handle.toLowerCase())
          )
        );

        setPreview(newLeads);
        
        toast.success(`Found ${extractedLeads.length} leads (${newLeads.length} new)`);

        // Add to session if active
        if (keywordSession.active) {
          useLeadStore.getState().addSessionResults(newLeads);
        }
      }
    } catch (error) {
      console.error('AI extraction error:', error);
      toast.error(`AI extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualParse = () => {
    const lines = bulkData.split('\n').filter(line => line.trim());
    const parsedLeads: Lead[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.length < 3 || trimmed.length > 60) return;

      const lead: Partial<Lead> = {
        company_name: trimmed,
        handle: '@' + trimmed.toLowerCase().replace(/[^a-z0-9]/g, ''),
        city: bulkCity || 'Unknown',
        service_type: detectServiceType(trimmed),
        lead_source: 'FB Ad Library',
        running_ads: true,
      };

      parsedLeads.push(lead as Lead);
    });

    // Filter duplicates using improved detection
    const uniqueLeads: Lead[] = [];
    const manualDuplicates: Lead[] = [];
    
    parsedLeads.forEach(lead => {
      const existingDupe = findDuplicateLead(lead, leads, {
        checkCity: true,
        similarityThreshold: 0.8
      });
      
      if (existingDupe) {
        manualDuplicates.push({ ...lead, existingId: existingDupe.id } as Lead);
      } else if (!findDuplicateLead(lead, uniqueLeads, { checkCity: true })) {
        uniqueLeads.push(lead as Lead);
      }
    });

    setPreview(uniqueLeads);
    setDuplicateLeads(manualDuplicates);
    setShowPreview(true);
  };

  const handleImport = async () => {
    if (preview.length === 0 && duplicateLeads.length === 0) return;

    setIsProcessing(true);
    
    let leadsToProcess: Lead[] = [];
    let updateMode = false;
    
    // Determine which leads to process based on import mode
    switch (importMode) {
      case 'new':
        leadsToProcess = preview;
        break;
      case 'update':
        leadsToProcess = duplicateLeads;
        updateMode = true;
        break;
      case 'all':
        leadsToProcess = [...preview, ...duplicateLeads];
        break;
    }
    
    if (leadsToProcess.length === 0) {
      toast.error('No leads to import in this mode');
      setIsProcessing(false);
      return;
    }
    
    // Create import operation record
    const importOperation = await createImportOperation(
      'bulk_import',
      bulkSource,
      leadsToProcess.length,
      {
        city: bulkCity,
        service_type: selectedServiceType,
        import_mode: importMode,
        ai_extracted: true,
        duplicates_found: duplicateLeads.length,
        new_leads_found: preview.length
      }
    );
    
    if (!importOperation) {
      toast.error('Failed to create import operation');
      setIsProcessing(false);
      return;
    }
    
    // Save all leads in parallel (in batches to avoid overwhelming the server)
    const BATCH_SIZE = 10;
    let successCount = 0;
    let updateCount = 0;
    
    for (let i = 0; i < leadsToProcess.length; i += BATCH_SIZE) {
      const batch = leadsToProcess.slice(i, i + BATCH_SIZE);
      
      const savePromises = batch.map(async (lead) => {
        try {
          if (updateMode && lead.existingId) {
            // Update existing lead with new data
            const { updateLead } = await import('@/lib/api');
            const updatedLead = await updateLead(lead.existingId, {
              ...lead,
              notes: lead.notes ? `${lead.notes}\n\n[Updated from FB Ad Library]` : '[Updated from FB Ad Library]'
            });
            useLeadStore.getState().updateLead(updatedLead);
            updateCount++;
            return true;
          } else {
            // Save as new lead with import_operation_id
            const savedLead = await saveLead({
              ...lead,
              import_operation_id: importOperation.id
            });
            addLead(savedLead);
            return true;
          }
        } catch (error) {
          console.error('Failed to import/update lead:', error);
          return false;
        }
      });
      
      const results = await Promise.all(savePromises);
      successCount += results.filter(success => success).length;
      
      // Show progress for large imports
      if (leadsToProcess.length > 20 && i + BATCH_SIZE < leadsToProcess.length) {
        const progress = Math.min(i + BATCH_SIZE, leadsToProcess.length);
        toast.loading(`Processing... ${progress}/${leadsToProcess.length}`, { id: 'import-progress' });
      }
    }
    
    toast.dismiss('import-progress');
    
    if (updateMode) {
      toast.success(`Updated ${updateCount} leads successfully!`);
    } else {
      // Store the import operation for undo functionality
      useLeadStore.getState().setLastImportOperation(importOperation);
      
      // Show success with undo option
      toast((t) => (
        <div className="flex items-center justify-between gap-4">
          <span>Imported {successCount} leads successfully!</span>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              handleUndo();
            }}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            Undo
          </button>
        </div>
      ), {
        duration: 5000,
        id: 'import-success'
      });
    }
    
    onClose();
    resetModal();
  };
  
  const handleUndo = async () => {
    const { undoLastImport } = useLeadStore.getState();
    const result = await undoLastImport();
    
    if (result.success) {
      toast.success(`Undone! Removed ${result.deletedCount} leads.`);
    } else {
      toast.error('Failed to undo import');
    }
  };

  const resetModal = () => {
    setBulkData('');
    setBulkCity('');
    setPreview([]);
    setDuplicateLeads([]);
    setShowPreview(false);
    setProcessedCount(0);
    setImportMode('new');
  };


  const detectServiceType = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.includes('turf') || lower.includes('grass')) return 'Turf';
    if (lower.includes('paint')) return 'Painting';
    if (lower.includes('landscap')) return 'Landscaping';
    if (lower.includes('remodel')) return 'Remodeling';
    if (lower.includes('roof')) return 'Roofing';
    if (lower.includes('plumb')) return 'Plumbing';
    if (lower.includes('electric')) return 'Electrical';
    if (lower.includes('hvac')) return 'HVAC';
    if (lower.includes('concrete')) return 'Concrete';
    if (lower.includes('fence')) return 'Fencing';
    if (lower.includes('pool')) return 'Pool Service';
    if (lower.includes('pest')) return 'Pest Control';
    if (lower.includes('clean')) return 'Cleaning Service';
    if (lower.includes('tree')) return 'Tree Service';
    return 'General';
  };

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

        <div className="fixed inset-0 z-[51] overflow-y-auto">
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-900 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
                <div className="bg-white dark:bg-gray-900 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="absolute right-0 top-0 pr-4 pt-4">
                    <button
                      type="button"
                      className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                      onClick={onClose}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100">
                        📋 Bulk Import from FB Ad Library
                      </Dialog.Title>

                      <div className="mt-4">
                        <div className="space-y-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Default City (optional)
                            </label>
                            <USCityAutocomplete
                              value={bulkCity}
                              onChange={setBulkCity}
                              placeholder="Type city name or state code..."
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              required={false}
                            />
                          </div>

                          <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Service Type (optional)
                            </label>
                            <ServiceTypeDropdown
                              value={selectedServiceType}
                              onChange={setSelectedServiceType}
                              placeholder="Type or select a service..."
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                        </div>


                        <KeywordAssistant city={bulkCity} serviceType={selectedServiceType} />

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Paste Your Data:
                          </label>
                          <textarea
                            value={bulkData}
                            onChange={(e) => setBulkData(e.target.value)}
                            rows={10}
                            placeholder="Paste content from Facebook Ad Library search results here...

The AI will extract:
• Company names
• Phone numbers
• Addresses
• Ad details

Just copy and paste the entire page content!"
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400"
                          />
                        </div>

                        {showPreview && (
                          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                              {isProcessing && streamingMode ? (
                                <span className="flex items-center gap-2">
                                  <svg className="animate-spin h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Processing with AI... Found {processedCount} leads so far
                                </span>
                              ) : (
                                <span>
                                  Preview (found {preview.length + duplicateLeads.length} total - {preview.length} new, {duplicateLeads.length} duplicates):
                                </span>
                              )}
                            </h4>
                            
                            {/* Import mode selector */}
                            {!isProcessing && (preview.length > 0 || duplicateLeads.length > 0) && (
                              <div className="mb-3 flex gap-2">
                                <button
                                  onClick={() => setImportMode('new')}
                                  className={`px-3 py-1 text-xs rounded ${
                                    importMode === 'new' 
                                      ? 'bg-blue-600 text-white' 
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                  }`}
                                >
                                  Import New Only ({preview.length})
                                </button>
                                {duplicateLeads.length > 0 && (
                                  <>
                                    <button
                                      onClick={() => setImportMode('update')}
                                      className={`px-3 py-1 text-xs rounded ${
                                        importMode === 'update' 
                                          ? 'bg-blue-600 text-white' 
                                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                      }`}
                                    >
                                      Update Existing ({duplicateLeads.length})
                                    </button>
                                    <button
                                      onClick={() => setImportMode('all')}
                                      className={`px-3 py-1 text-xs rounded ${
                                        importMode === 'all' 
                                          ? 'bg-blue-600 text-white' 
                                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                      }`}
                                    >
                                      Import All ({preview.length + duplicateLeads.length})
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                            
                            <div className="max-h-48 overflow-y-auto space-y-2">
                              {/* Show new leads */}
                              {preview.map((lead, idx) => (
                                <div key={`new-${idx}`} className="text-sm animate-fade-in animate-slide-in text-gray-800 dark:text-gray-200">
                                  ✅ {lead.company_name} - {lead.city} ({lead.service_type})
                                  {lead.phone && ` - 📞 ${lead.phone}`}
                                  <span className="ml-2 text-xs text-green-600 dark:text-green-400 font-medium">[NEW]</span>
                                </div>
                              ))}
                              
                              {/* Show duplicate leads */}
                              {duplicateLeads.map((lead, idx) => (
                                <div key={`dup-${idx}`} className="text-sm animate-fade-in animate-slide-in opacity-75 text-gray-700 dark:text-gray-300">
                                  🔄 {lead.company_name} - {lead.city} ({lead.service_type})
                                  {lead.phone && ` - 📞 ${lead.phone}`}
                                  <span className="ml-2 text-xs text-orange-600 dark:text-orange-400 font-medium">[DUPLICATE - Already exists]</span>
                                </div>
                              ))}
                              
                              {isProcessing && streamingMode && processedCount === 0 && (
                                <div className="flex flex-col items-center justify-center py-8">
                                  <svg className="animate-spin h-8 w-8 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                                    AI is analyzing your data...
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    This may take a moment for large datasets
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  {showPreview && preview.length > 0 && (
                    <button
                      type="button"
                      onClick={handleImport}
                      disabled={isProcessing}
                      className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50"
                    >
                      ✓ Import All
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={handleAIExtract}
                    disabled={isProcessing}
                    className="inline-flex w-full justify-center rounded-md bg-yellow-500 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-yellow-400 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      '🤖 AI Extract'
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleManualParse}
                    disabled={isProcessing}
                    className="inline-flex w-full justify-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 sm:ml-3 sm:w-auto disabled:opacity-50"
                  >
                    Manual Parse
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