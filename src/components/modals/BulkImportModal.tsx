import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useLeadStore } from '@/lib/store';
import { saveLead } from '@/lib/api';
import { Lead } from '@/types';
import toast from 'react-hot-toast';
import KeywordAssistant from '../KeywordAssistant';
import USCityAutocomplete from '../USCityAutocomplete';
import ServiceTypeDropdown from '../ServiceTypeDropdown';
import { extractWithAI, extractWithAIStream } from '@/lib/api';

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function BulkImportModal({ open, onClose }: BulkImportModalProps) {
  const { openaiApiKey, addLead, leads, keywordSession } = useLeadStore();
  const [bulkData, setBulkData] = useState('');
  const [bulkCity, setBulkCity] = useState('');
  const [bulkSource, setBulkSource] = useState<'FB Ad Library' | 'Instagram Manual' | 'Google Maps'>('Instagram Manual');
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<Lead[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const streamingMode = true; // Always use streaming for better UX
  const [processedCount, setProcessedCount] = useState(0);
  const [selectedServiceType, setSelectedServiceType] = useState('');

  const handleAIExtract = async () => {
    if (!bulkData.trim()) {
      toast.error('Please paste some data to extract');
      return;
    }

    setIsProcessing(true);
    setPreview([]);
    setShowPreview(true);
    setProcessedCount(0);
    
    try {
      const serviceType = keywordSession.active ? getCurrentServiceType() : null;
      
      if (streamingMode) {
        // Streaming mode - show leads as they come in
        const collectedLeads: Lead[] = [];
        
        await extractWithAIStream(
          bulkData,
          bulkCity,
          selectedServiceType,
          openaiApiKey,
          (lead: Lead) => {
            // Filter duplicate as it arrives
            const isDuplicate = leads.some(
              existing => 
                existing.company_name.toLowerCase() === lead.company_name.toLowerCase() ||
                (existing.handle && lead.handle && existing.handle.toLowerCase() === lead.handle.toLowerCase())
            ) || collectedLeads.some(
              existing => 
                existing.company_name.toLowerCase() === lead.company_name.toLowerCase() ||
                (existing.handle && lead.handle && existing.handle.toLowerCase() === lead.handle.toLowerCase())
            );
            
            if (!isDuplicate) {
              collectedLeads.push(lead);
              setPreview(prev => [...prev, lead]);
              setProcessedCount(prev => prev + 1);
            }
          },
          (error) => {
            console.error('Streaming error:', error);
            toast.error('Error during AI extraction');
          }
        );
        
        if (collectedLeads.length === 0) {
          toast.error('No leads found in the provided text');
          return;
        }
        
        toast.success(`Found ${processedCount} new leads`);
        
        // Add to session if active
        if (keywordSession.active) {
          useLeadStore.getState().addSessionResults(collectedLeads);
        }
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
      toast.error('AI extraction failed');
      console.error(error);
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
        lead_source: bulkSource,
        running_ads: bulkSource === 'FB Ad Library',
      };

      parsedLeads.push(lead as Lead);
    });

    // Filter duplicates
    const newLeads = parsedLeads.filter(
      lead => !leads.some(
        existing => 
          existing.company_name.toLowerCase() === lead.company_name.toLowerCase()
      )
    );

    setPreview(newLeads);
    setShowPreview(true);
  };

  const handleImport = async () => {
    if (preview.length === 0) return;

    setIsProcessing(true);
    
    // Save all leads in parallel (in batches to avoid overwhelming the server)
    const BATCH_SIZE = 10; // Process 10 leads at a time
    let successCount = 0;
    
    for (let i = 0; i < preview.length; i += BATCH_SIZE) {
      const batch = preview.slice(i, i + BATCH_SIZE);
      
      const savePromises = batch.map(lead => 
        saveLead(lead)
          .then(savedLead => {
            addLead(savedLead);
            return true;
          })
          .catch(error => {
            console.error('Failed to import lead:', error);
            return false;
          })
      );
      
      const results = await Promise.all(savePromises);
      successCount += results.filter(success => success).length;
      
      // Show progress for large imports
      if (preview.length > 20 && i + BATCH_SIZE < preview.length) {
        const progress = Math.min(i + BATCH_SIZE, preview.length);
        toast.loading(`Importing... ${progress}/${preview.length}`, { id: 'import-progress' });
      }
    }
    
    toast.dismiss('import-progress');
    toast.success(`Imported ${successCount} leads successfully!`);
    onClose();
    resetModal();
  };

  const resetModal = () => {
    setBulkData('');
    setBulkCity('');
    setPreview([]);
    setShowPreview(false);
    setProcessedCount(0);
  };

  const getCurrentServiceType = () => {
    // Use the selected service type from the form
    return selectedServiceType || null;
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
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
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                        📋 Bulk Import from FB Ad Library
                      </Dialog.Title>

                      <div className="mt-4">

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Import Source
                          </label>
                          <select
                            value={bulkSource}
                            onChange={(e) => setBulkSource(e.target.value as 'FB Ad Library' | 'Instagram Manual' | 'Google Maps')}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          >
                            <option value="Instagram Manual">Instagram Manual</option>
                            <option value="FB Ad Library">FB Ad Library</option>
                            <option value="Google Maps">Google Maps</option>
                          </select>
                        </div>

                        <div className="space-y-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
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

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
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


                        {bulkSource === 'FB Ad Library' && (
                          <KeywordAssistant city={bulkCity} serviceType={selectedServiceType} />
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Paste Your Data:
                          </label>
                          <textarea
                            value={bulkData}
                            onChange={(e) => setBulkData(e.target.value)}
                            rows={10}
                            placeholder="Paste company names, one per line or comma separated:

Desert Turf Pros
AZ Synthetic Grass
Phoenix Landscaping LLC

Or paste full data:
Company Name, City, Service Type
Desert Turf, Phoenix, Turf
AZ Painters, Scottsdale, Painting"
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
                          />
                        </div>

                        {showPreview && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">
                              {isProcessing && streamingMode ? (
                                <span>
                                  🔄 Processing... Found {preview.length} leads so far
                                </span>
                              ) : (
                                <span>
                                  Preview (found {preview.length} leads):
                                </span>
                              )}
                            </h4>
                            <div className="max-h-48 overflow-y-auto space-y-2">
                              {preview.map((lead, idx) => (
                                <div key={idx} className="text-sm animate-fade-in animate-slide-in">
                                  ✅ {lead.company_name} - {lead.city} ({lead.service_type})
                                  {lead.phone && ` - 📞 ${lead.phone}`}
                                </div>
                              ))}
                              {isProcessing && streamingMode && preview.length === 0 && (
                                <div className="text-sm text-gray-500 italic">
                                  Waiting for AI to start processing...
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
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
                    className="inline-flex w-full justify-center rounded-md bg-yellow-500 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-yellow-400 sm:ml-3 sm:w-auto disabled:opacity-50"
                  >
                    🤖 AI Extract
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