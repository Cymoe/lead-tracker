import { Fragment, useState, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, DocumentTextIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { useLeadStore } from '@/lib/store';
import { saveLeadsBatch, updateLeadsBatch } from '@/lib/api';
import { useRefreshLeads } from '@/hooks/useLeadsQuery';
import { Lead } from '@/types';
import toast from 'react-hot-toast';
import { parseCSV, autoDetectMappings, transformToLeads, validateLeads, FieldMapping } from '@/utils/csv-parser';

interface CSVImportModalProps {
  open: boolean;
  onClose: () => void;
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

export default function CSVImportModal({ open, onClose }: CSVImportModalProps) {
  const { addLead, updateLead: updateLeadInStore, leads } = useLeadStore();
  const refreshLeads = useRefreshLeads();
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCSVData] = useState<{ headers: string[]; rows: Record<string, string>[] }>({ headers: [], rows: [] });
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [previewLeads, setPreviewLeads] = useState<Partial<Lead>[]>([]);
  const [validLeads, setValidLeads] = useState<Lead[]>([]);
  const [invalidLeads, setInvalidLeads] = useState<Array<{ lead: Partial<Lead>; reason: string }>>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState({ new: 0, merged: 0, failed: 0 });
  const [importDefaults, setImportDefaults] = useState({
    lead_source: 'CSV Import' as 'FB Ad Library' | 'Instagram Manual' | 'Google Maps' | 'CSV Import',
    defaultCity: '',
    defaultState: '',
    defaultServiceType: '',
    overrideLocation: false, // New: whether to override CSV location data
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
  
  const handleUndo = async () => {
    const { undoLastImport } = useLeadStore.getState();
    const result = await undoLastImport();
    
    if (result.success) {
      toast.success(`Undone! Removed ${result.deletedCount} leads.`);
    } else {
      toast.error('Failed to undo import');
    }
  };

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
    // Don't pass city in defaults if we're going to override it
    const transformDefaults = {
      lead_source: importDefaults.lead_source,
      service_type: importDefaults.defaultServiceType || undefined,
    };
    
    // Only add city to defaults if NOT overriding
    if (!importDefaults.overrideLocation) {
      (transformDefaults as any).city = importDefaults.defaultCity || undefined;
    }
    
    const transformed = transformToLeads(csvData.rows, fieldMappings, transformDefaults);
    
    // Apply location overrides if enabled - this MUST happen after transformToLeads
    const leadsWithDefaults = transformed.map(lead => {
      if (importDefaults.overrideLocation) {
        // Force override ALL location data with the defaults
        // This overrides any city/state that might have been parsed from full_address
        return {
          ...lead,
          city: importDefaults.defaultCity,
          state: importDefaults.defaultState,
        };
      }
      // If not overriding, still apply defaults if lead is missing city/state
      return {
        ...lead,
        city: lead.city || importDefaults.defaultCity || undefined,
        state: lead.state || importDefaults.defaultState || undefined,
      };
    });
    
    setPreviewLeads(leadsWithDefaults);
    
    // Debug logging
    console.log('=== LOCATION OVERRIDE DEBUG ===');
    console.log('Override enabled:', importDefaults.overrideLocation);
    console.log('Default city:', importDefaults.defaultCity);
    console.log('Default state:', importDefaults.defaultState);
    console.log('First 3 leads after override:', leadsWithDefaults.slice(0, 3).map(l => ({
      company: l.company_name,
      city: l.city,
      state: l.state
    })));
    
    const validation = validateLeads(leadsWithDefaults);
    setValidLeads(validation.valid);
    setInvalidLeads(validation.invalid);
    
    setStep('preview');
  };

  const handleImport = async () => {
    if (validLeads.length === 0) {
      toast.error('No valid leads to import');
      return;
    }
    
    // CRITICAL FIX: Re-apply location override if enabled
    // This ensures the override is applied even if something went wrong in preview
    let leadsToImport = validLeads;
    if (importDefaults.overrideLocation && importDefaults.defaultCity && importDefaults.defaultState) {
      console.log('Re-applying location override before import...');
      leadsToImport = validLeads.map(lead => ({
        ...lead,
        city: importDefaults.defaultCity,
        state: importDefaults.defaultState
      }));
    }

    console.log(`Starting import of ${leadsToImport.length} leads`);
    console.log('Sample lead:', leadsToImport[0]);
    console.log('Import defaults:', importDefaults);
    console.log('Override location enabled:', importDefaults.overrideLocation);
    console.log('Default city:', importDefaults.defaultCity);
    console.log('Default state:', importDefaults.defaultState);
    console.log('First 5 leadsToImport cities:', leadsToImport.slice(0, 5).map(l => ({
      company: l.company_name,
      city: l.city,
      state: l.state
    })));
    
    // Debug: Check if leadsToImport have the overridden locations
    if (importDefaults.overrideLocation) {
      const citiesInLeadsToImport = new Set(leadsToImport.map(l => l.city));
      const statesInLeadsToImport = new Set(leadsToImport.map(l => l.state));
      console.log('Cities in leadsToImport:', Array.from(citiesInLeadsToImport));
      console.log('States in leadsToImport:', Array.from(statesInLeadsToImport));
      console.log('Expected city:', importDefaults.defaultCity);
      console.log('Expected state:', importDefaults.defaultState);
      
      // Verify override was applied
      if (!Array.from(citiesInLeadsToImport).every(city => city === importDefaults.defaultCity)) {
        console.error('ERROR: Override failed! Cities still vary after re-applying override.');
      } else {
        console.log('✓ Override successfully applied - all leads set to', importDefaults.defaultCity, importDefaults.defaultState);
      }
    }

    setStep('importing');
    setImportProgress(0);
    
    let newCount = 0;
    let mergedCount = 0;
    let errorCount = 0;
    
    try {
      // Fetch fresh data from database to ensure we have the latest leads
      toast('Checking for duplicates...', { icon: '🔍' });
      
      // Use store leads which we know has the current data
      const freshLeads = leads;
      console.log('=== DUPLICATE DETECTION DEBUG ===');
      console.log('Total leads in store:', freshLeads.length);
      console.log('First 5 existing leads:', freshLeads.slice(0, 5).map(l => ({
        company: l.company_name,
        city: l.city,
        source: l.lead_source
      })));
      
      // Debug: Check if we have Naples leads
      const naplesLeads = freshLeads.filter(lead => lead.city?.toLowerCase() === 'naples');
      console.log(`Found ${naplesLeads.length} leads in Naples`);
      if (naplesLeads.length > 0) {
        console.log('Sample Naples lead:', naplesLeads[0]);
      }
      
      // Create a Map for O(1) lookups of existing leads
      const existingLeadsMap = new Map<string, Lead>();
      
      // Helper function to normalize strings for comparison
      const normalizeString = (str: string | null | undefined): string => {
        if (!str) return '';
        return str.toLowerCase()
          .trim()
          .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
          .replace(/[^\w\s]/g, '') // Remove special characters
          .replace(/\b(inc|incorporated|llc|ltd|limited|corp|corporation|company|co)\b/g, '') // Remove common suffixes
          .trim();
      };
      
      // Build map of existing leads from fresh database data
      console.log('=== BUILDING EXISTING LEADS MAP ===');
      freshLeads.forEach((lead, index) => {
        const key = `${normalizeString(lead.company_name)}|${normalizeString(lead.city)}`;
        existingLeadsMap.set(key, lead);
        
        // Log first few for debugging
        if (index < 5) {
          console.log(`Existing lead ${index}:`, {
            company: lead.company_name,
            city: lead.city,
            normalized_company: normalizeString(lead.company_name),
            normalized_city: normalizeString(lead.city),
            key: key
          });
        }
      });
      console.log(`Total keys in map: ${existingLeadsMap.size}`);
      
      
      // Separate leads into new and existing
      const newLeads: Partial<Lead>[] = [];
      const leadsToUpdate: Array<{ id: string, updates: Partial<Lead> }> = [];
      const skippedDuplicates: string[] = [];
      
      console.log('=== CHECKING EACH IMPORT ===');
      for (let i = 0; i < leadsToImport.length; i++) {
        const leadToImport = leadsToImport[i];
        
        // validLeads already has the overridden city if override was enabled
        const lookupKey = `${normalizeString(leadToImport.company_name)}|${normalizeString(leadToImport.city)}`;
        
        // Log first few imports for debugging
        if (i < 5) {
          console.log(`Import lead ${i}:`, {
            company: leadToImport.company_name,
            city: leadToImport.city,
            state: leadToImport.state,
            normalized_company: normalizeString(leadToImport.company_name),
            normalized_city: normalizeString(leadToImport.city),
            lookup_key: lookupKey
          });
        }
        
        const existingLead = existingLeadsMap.get(lookupKey);
        
        if (i < 5 && existingLead) {
          console.log(`  -> DUPLICATE FOUND:`, {
            existing_company: existingLead.company_name,
            existing_city: existingLead.city
          });
        }
        
        if (existingLead) {
          // Prepare update for existing lead - only update fields that have values
          const updateData: Partial<Lead> = {
            lead_source: importDefaults.lead_source,
          };
          
          // Only update fields that have values in the import
          if (leadToImport.phone) updateData.phone = leadToImport.phone;
          if (leadToImport.email) updateData.email = leadToImport.email;
          if (leadToImport.website) updateData.website = leadToImport.website;
          if (leadToImport.address) updateData.address = leadToImport.address;
          if (leadToImport.service_type) updateData.service_type = leadToImport.service_type;
          if (leadToImport.instagram_url) updateData.instagram_url = leadToImport.instagram_url;
          if (leadToImport.facebook_url) updateData.facebook_url = leadToImport.facebook_url;
          if (leadToImport.linkedin_url) updateData.linkedin_url = leadToImport.linkedin_url;
          if (leadToImport.twitter_url) updateData.twitter_url = leadToImport.twitter_url;
          if (leadToImport.google_maps_url) updateData.google_maps_url = leadToImport.google_maps_url;
          
          // Always update city/state - FORCE override if enabled
          if (importDefaults.overrideLocation) {
            updateData.city = importDefaults.defaultCity;
            updateData.state = importDefaults.defaultState;
          } else {
            if (leadToImport.city) updateData.city = leadToImport.city;
            if (leadToImport.state) updateData.state = leadToImport.state;
          }
          
          // Handle notes specially to append rather than replace
          if (leadToImport.notes || importDefaults.lead_source === 'CSV Import') {
            updateData.notes = existingLead.notes 
              ? `${existingLead.notes}\n\n[Updated from ${importDefaults.lead_source}]: ${leadToImport.notes || 'No additional notes'}`
              : `[${importDefaults.lead_source}]: ${leadToImport.notes || 'Imported from CSV'}`;
          }
          
          leadsToUpdate.push({
            id: existingLead.id,
            updates: updateData
          });
          skippedDuplicates.push(`${leadToImport.company_name} (${leadToImport.city})`);
        } else {
          // Check if this is a duplicate within the import batch itself
          const isDuplicateInBatch = newLeads.some(newLead => 
            normalizeString(newLead.company_name) === normalizeString(leadToImport.company_name) &&
            normalizeString(newLead.city) === normalizeString(leadToImport.city)
          );
          
          if (!isDuplicateInBatch) {
            // Add to new leads - FORCE override if enabled
            const newLead: Partial<Lead> = {
              ...leadToImport,
              lead_source: importDefaults.lead_source
            };
            
            // CRITICAL: Force override again to be absolutely sure
            if (importDefaults.overrideLocation) {
              newLead.city = importDefaults.defaultCity;
              newLead.state = importDefaults.defaultState;
            }
            
            newLeads.push(newLead);
          } else {
            skippedDuplicates.push(`${leadToImport.company_name} (${leadToImport.city}) - duplicate in import`);
          }
        }
      }
      
      console.log(`Import summary: ${newLeads.length} new, ${leadsToUpdate.length} updates, ${skippedDuplicates.length} duplicates`);
      console.log('New leads array length:', newLeads.length);
      console.log('Updates array length:', leadsToUpdate.length);
      console.log('First few updates:', leadsToUpdate.slice(0, 3));
      
      // Create copies to ensure arrays don't get modified
      const newLeadsCopy = [...newLeads];
      const leadsToUpdateCopy = [...leadsToUpdate];
      
      console.log('After copy - new leads:', newLeadsCopy.length);
      console.log('After copy - updates:', leadsToUpdateCopy.length);
      
      // DEBUG: Check cities in newLeadsCopy
      if (importDefaults.overrideLocation) {
        const citiesInNewLeads = new Set(newLeadsCopy.map(l => l.city));
        console.log('Cities in newLeadsCopy:', Array.from(citiesInNewLeads));
        if (Array.from(citiesInNewLeads).length > 1 || !Array.from(citiesInNewLeads).includes(importDefaults.defaultCity)) {
          console.error('ERROR: newLeadsCopy contains leads with wrong cities!');
          console.log('Sample leads with wrong cities:', newLeadsCopy.filter(l => l.city !== importDefaults.defaultCity).slice(0, 5));
        }
      }
      
      if (skippedDuplicates.length > 0) {
        toast(`Found ${skippedDuplicates.length} duplicates that will be updated instead of created`, {
          icon: '🔄',
          duration: 5000
        });
      }
      
      // Process in batches - increased for better performance
      const BATCH_SIZE = 200;
      
      // IMPORTANT: Process updates FIRST to handle duplicates properly
      // Update existing leads in batches
      if (leadsToUpdateCopy.length > 0) {
        console.log(`Updating ${leadsToUpdateCopy.length} existing leads...`);
        toast(`Updating ${leadsToUpdateCopy.length} duplicates...`, { icon: '🔄' });
        
        for (let i = 0; i < leadsToUpdateCopy.length; i += BATCH_SIZE) {
          const batch = leadsToUpdateCopy.slice(i, i + BATCH_SIZE);
          try {
            const updatedLeads = await updateLeadsBatch(batch);
            updatedLeads.forEach(lead => {
              updateLeadInStore(lead);
            });
            mergedCount += updatedLeads.length;
          } catch (error) {
            console.error(`Failed to update batch of leads:`, error);
            console.error('Batch that failed:', batch);
            errorCount += batch.length;
          }
          
          // Update progress
          const processedUpdates = Math.min(i + BATCH_SIZE, leadsToUpdateCopy.length);
          setImportProgress((processedUpdates / leadsToImport.length) * 100);
        }
      }
      
      // Create import operation record if we have new leads OR updates
      if (newLeadsCopy.length > 0 || leadsToUpdateCopy.length > 0) {
        try {
          const operationMetadata = {
            filename: file?.name,
            city: importDefaults.defaultCity,
            state: importDefaults.defaultState,
            service_type: importDefaults.defaultServiceType,
            override_location: importDefaults.overrideLocation,
            new_leads: newLeadsCopy.length,
            merged_leads: leadsToUpdateCopy.length,
            skipped_duplicates: skippedDuplicates.length,
            total_processed: leadsToImport.length
          };
          
          console.log('Creating import operation...', {
            type: 'csv_import',
            source: 'CSV Import',
            leadCount: newLeadsCopy.length + leadsToUpdateCopy.length,
            metadata: operationMetadata
          });
          
          // Import operation tracking removed
        } catch (error) {
          console.error('Error creating import operation:', error);
          console.error('Full error details:', {
            error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined,
            errorResponse: (error as any)?.response,
            errorData: (error as any)?.data
          });
          
          // Don't fail the entire import if we can't create the operation record
          // Just log it and continue
          console.warn('Continuing without import operation tracking');
          toast('Import tracking unavailable, but continuing with import', { icon: '⚠️' });
        }
      }
      
      // THEN insert new leads
      if (newLeadsCopy.length > 0) {
        console.log(`Inserting ${newLeadsCopy.length} new leads...`);
        toast(`Creating ${newLeadsCopy.length} new leads...`, { icon: '➕' });
        
        // Use leads directly
        const leadsWithOperationId = newLeadsCopy;
        
        for (let i = 0; i < leadsWithOperationId.length; i += BATCH_SIZE) {
          const batch = leadsWithOperationId.slice(i, i + BATCH_SIZE);
          try {
            const savedLeads = await saveLeadsBatch(batch);
            savedLeads.forEach(lead => {
              addLead(lead);
              // Add to map for subsequent duplicate checks
              const key = `${normalizeString(lead.company_name)}|${normalizeString(lead.city)}`;
              existingLeadsMap.set(key, lead);
            });
            newCount += savedLeads.length;
          } catch (error) {
            console.error(`Failed to save batch of leads:`, error);
            console.error('Full error details:', {
              error,
              batch: batch.slice(0, 2), // Log first 2 leads from failed batch
              batchSize: batch.length,
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              errorStack: error instanceof Error ? error.stack : undefined
            });
            
            // Show more specific error to user
            if (error instanceof Error && error.message.includes('permission')) {
              toast.error('Permission denied: Unable to create leads');
            } else if (error instanceof Error && error.message.includes('unique')) {
              toast.error('Duplicate error: Some leads already exist');
            } else {
              toast.error(`Failed to create ${batch.length} leads: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            
            errorCount += batch.length;
          }
          
          // Update progress
          const processedNew = Math.min(i + BATCH_SIZE, newLeadsCopy.length);
          const totalProcessed = mergedCount + processedNew;
          setImportProgress((totalProcessed / leadsToImport.length) * 100);
        }
      }
      
      // Update results
      setImportResults({ new: newCount, merged: mergedCount, failed: errorCount });
      setStep('complete');
      
      // Show detailed results
      const totalSuccess = newCount + mergedCount;
      if (totalSuccess > 0) {
        let message = `Successfully processed ${totalSuccess} lead${totalSuccess !== 1 ? 's' : ''}`;
        if (newCount > 0 && mergedCount > 0) {
          message += ` (${newCount} new, ${mergedCount} updated)`;
        } else if (mergedCount > 0) {
          message += ` (all updated)`;
        } else {
          message += ` (all new)`;
        }
        
        // Store the import operation for undo functionality if we created new leads
        
        toast.success(message);
        
        // Refresh leads to show the imported data immediately
        refreshLeads();
      }
      
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} lead${errorCount !== 1 ? 's' : ''}`);
      }
      
      // Close modal after a short delay if successful
      if (totalSuccess > 0) {
        // The first refreshLeads() above already updates the UI immediately
        // Now just close the modal after a short delay
        setTimeout(() => {
          onClose();
          resetImport();
        }, 2000);
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
    setImportResults({ new: 0, merged: 0, failed: 0 });
  };

  const leadFields: Array<{ value: keyof Lead; label: string }> = [
    { value: 'company_name', label: 'Company Name' },
    { value: 'handle', label: 'Instagram Handle' },
    { value: 'phone', label: 'Phone' },
    { value: 'email', label: 'Email' },
    { value: 'email2', label: 'Email 2' },
    { value: 'email3', label: 'Email 3' },
    { value: 'website', label: 'Website' },
    { value: 'instagram_url', label: 'Instagram URL' },
    { value: 'facebook_url', label: 'Facebook URL' },
    { value: 'linkedin_url', label: 'LinkedIn URL' },
    { value: 'twitter_url', label: 'Twitter URL' },
    { value: 'city', label: 'City' },
    { value: 'state', label: 'State' },
    { value: 'address', label: 'Address' },
    { value: 'full_address', label: 'Full Address' },
    { value: 'service_type', label: 'Service Type' },
    { value: 'search_query', label: 'Search Query' },
    { value: 'notes', label: 'Notes' },
    { value: 'ad_copy', label: 'Ad Copy' },
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
              <Dialog.Panel className="relative transform rounded-lg bg-[#1F2937] text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl max-h-[90vh] flex flex-col">
                <div className="absolute right-0 top-0 pr-6 pt-6 z-10">
                  <button
                    type="button"
                    className="rounded-md bg-[#1F2937] text-gray-400 hover:text-gray-300 p-1"
                    onClick={() => {
                      resetImport();
                      onClose();
                    }}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="bg-[#1F2937] px-6 pb-6 pt-6 sm:px-8 sm:pt-8 sm:pb-6 overflow-x-hidden flex-1">

                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#3B82F6] bg-opacity-20 sm:mx-0 sm:h-10 sm:w-10">
                      <DocumentTextIcon className="h-6 w-6 text-[#3B82F6]" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-white">
                        Import from CSV
                      </Dialog.Title>

                      {/* Upload Step */}
                      {step === 'upload' && (
                        <div className="mt-6">
                          <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            className="mt-1 flex justify-center px-8 pt-8 pb-8 border-2 border-[#374151] border-dashed rounded-lg hover:border-[#3B82F6] transition-colors bg-[#111827]"
                          >
                            <div className="space-y-3 text-center">
                              <CloudArrowUpIcon className="mx-auto h-16 w-16 text-gray-400" />
                              <div className="flex text-sm text-gray-300 justify-center">
                                <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-transparent font-medium text-[#3B82F6] hover:text-[#60A5FA] px-2 py-1">
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
                              <p className="text-xs text-gray-400">CSV files only</p>
                            </div>
                          </div>

                          <div className="mt-6">
                            <h4 className="text-sm font-medium text-white">Supported Formats:</h4>
                            <ul className="mt-3 text-sm text-gray-300 list-disc list-inside space-y-1">
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
                        <div className="mt-6">
                          <div className="mb-6">
                            <p className="text-sm text-gray-300">
                              Map your CSV columns to lead fields. We've auto-detected some mappings.
                            </p>
                          </div>

                          <div className="space-y-6">
                            <div>
                              <h4 className="text-sm font-medium text-white mb-4">Default Values</h4>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-6">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Lead Source</label>
                                    <select
                                      value={importDefaults.lead_source}
                                      onChange={(e) => setImportDefaults({ ...importDefaults, lead_source: e.target.value as any })}
                                      className="block w-full rounded-lg bg-[#374151] border border-[#4B5563] text-white px-3 py-2 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] focus:outline-none"
                                    >
                                      <option value="CSV Import">CSV Import</option>
                                      <option value="Instagram Manual">Instagram Manual</option>
                                      <option value="FB Ad Library">FB Ad Library</option>
                                      <option value="Google Maps">Google Maps</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Default Service Type</label>
                                    <input
                                      type="text"
                                      value={importDefaults.defaultServiceType}
                                      onChange={(e) => setImportDefaults({ ...importDefaults, defaultServiceType: e.target.value })}
                                      placeholder="Optional"
                                      className="block w-full rounded-lg bg-[#374151] border border-[#4B5563] text-white px-3 py-2 placeholder-gray-400 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] focus:outline-none"
                                    />
                                  </div>
                                </div>
                                
                                <div className="border-t border-[#374151] pt-4">
                                  <div className="flex items-center mb-3">
                                    <input
                                      type="checkbox"
                                      id="overrideLocation"
                                      checked={importDefaults.overrideLocation}
                                      onChange={(e) => setImportDefaults({ ...importDefaults, overrideLocation: e.target.checked })}
                                      className="h-4 w-4 text-[#3B82F6] focus:ring-[#3B82F6] border-[#4B5563] rounded bg-[#374151]"
                                    />
                                    <label htmlFor="overrideLocation" className="ml-3 text-sm text-gray-300">
                                      Override all location data with defaults
                                    </label>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-6">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-300 mb-2">Default City</label>
                                      <input
                                        type="text"
                                        value={importDefaults.defaultCity}
                                        onChange={(e) => setImportDefaults({ ...importDefaults, defaultCity: e.target.value })}
                                        placeholder={importDefaults.overrideLocation ? "Required" : "For empty values only"}
                                        className="block w-full rounded-lg bg-[#374151] border border-[#4B5563] text-white px-3 py-2 placeholder-gray-400 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] focus:outline-none"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-300 mb-2">Default State</label>
                                      <input
                                        type="text"
                                        value={importDefaults.defaultState}
                                        onChange={(e) => setImportDefaults({ ...importDefaults, defaultState: e.target.value })}
                                        placeholder={importDefaults.overrideLocation ? "Required (e.g., FL)" : "For empty values only"}
                                        className="block w-full rounded-lg bg-[#374151] border border-[#4B5563] text-white px-3 py-2 placeholder-gray-400 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                  
                                  {importDefaults.overrideLocation && (
                                    <p className="mt-3 text-xs text-[#EAB308]">
                                      ⚠️ All leads will be set to {importDefaults.defaultCity || "[City]"}, {importDefaults.defaultState || "[State]"} regardless of CSV data
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-white mb-3">Field Mappings</h4>
                              <div className="max-h-48 overflow-y-auto border border-[#374151] rounded-lg bg-[#111827]">
                                <table className="min-w-full divide-y divide-[#374151]">
                                  <thead className="bg-[#374151] sticky top-0">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">CSV Column</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Maps To</th>
                                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Sample Data</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-[#111827] divide-y divide-[#374151]">
                                    {csvData.headers.map((header, index) => {
                                      const currentMapping = fieldMappings.find(m => m.csvField === header);
                                      const sampleValue = csvData.rows[0]?.[header] || '';
                                      
                                      return (
                                        <tr key={header} className={index % 2 === 0 ? 'bg-[#111827]' : 'bg-[#1F2937]'}>
                                          <td className="px-4 py-3 text-sm text-white font-medium">{header}</td>
                                          <td className="px-4 py-3">
                                            <select
                                              value={currentMapping?.leadField || ''}
                                              onChange={(e) => updateMapping(header, e.target.value as keyof Lead)}
                                              className="block w-full text-sm rounded-md bg-[#374151] border border-[#4B5563] text-white px-2 py-1 focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] focus:outline-none"
                                            >
                                              <option value="">-- Skip --</option>
                                              {leadFields.map(field => (
                                                <option key={field.value} value={field.value}>
                                                  {field.label}
                                                </option>
                                              ))}
                                            </select>
                                          </td>
                                          <td className="px-4 py-3 text-sm text-gray-400 truncate max-w-xs" title={sampleValue}>
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
                        <div className="mt-6">
                          <div className="mb-6 px-6 sm:px-8">
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-gray-300">
                                Preview your import. Valid leads will be imported.
                              </p>
                              <div className="text-sm">
                                <span className="text-[#10B981] font-medium">{validLeads.length} valid</span>
                                {invalidLeads.length > 0 && (
                                  <span className="text-[#EF4444] font-medium ml-3">{invalidLeads.length} invalid</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {invalidLeads.length > 0 && (
                            <div className="mb-6 mx-6 sm:mx-8 bg-[#EF4444] bg-opacity-10 border border-[#EF4444] border-opacity-30 rounded-lg p-4">
                              <h4 className="text-sm font-medium text-[#EF4444] mb-3">Invalid Leads (will be skipped):</h4>
                              <ul className="text-sm text-gray-300 space-y-1">
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

                          <div className="px-4">
                            <div className="border border-[#374151] rounded-lg bg-[#111827]">
                              <div className="max-h-[400px] overflow-y-auto">
                                <table className="w-full divide-y divide-[#374151] text-sm table-fixed">
                                <thead className="bg-[#374151] sticky top-0 z-10">
                                  <tr>
                                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase w-8">#</th>
                                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-300 uppercase">Company</th>
                                    <th className="px-1 py-2 text-left text-xs font-medium text-gray-300 uppercase w-20">Phone</th>
                                    <th className="px-1 py-2 text-left text-xs font-medium text-gray-300 uppercase">Email</th>
                                    <th className="px-1 py-2 text-left text-xs font-medium text-gray-300 uppercase w-16">Location</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-[#111827] divide-y divide-[#374151]">
                                  {previewLeads.slice(0, 100).map((lead, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-[#111827]' : 'bg-[#1F2937]'}>
                                      <td className="px-2 py-2 text-xs text-gray-400">{index + 1}</td>
                                      <td className="px-2 py-2 text-xs">
                                        <div className="font-medium text-white truncate" title={lead.company_name}>
                                          {lead.company_name}
                                        </div>
                                      </td>
                                      <td className="px-1 py-2 text-xs text-gray-300 truncate">
                                        {lead.phone || '-'}
                                      </td>
                                      <td className="px-1 py-2 text-xs truncate">
                                        <div className="text-gray-300 truncate" title={lead.email || ''}>
                                          {lead.email || '-'}
                                        </div>
                                      </td>
                                      <td className="px-1 py-2 text-xs text-gray-300 truncate">
                                        {[lead.city, lead.state].filter(Boolean).join(', ') || '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {previewLeads.length > 100 && (
                              <div className="bg-[#374151] px-4 py-3 text-sm text-gray-300 text-center border-t border-[#4B5563] rounded-b-lg">
                                Showing first 100 of {previewLeads.length} leads
                              </div>
                            )}
                          </div>
                          </div>
                        </div>
                      )}

                      {/* Importing Step */}
                      {step === 'importing' && (
                        <div className="mt-6 text-center py-12">
                          <div className="inline-flex items-center">
                            <svg className="animate-spin h-10 w-10 text-[#3B82F6] mr-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-lg text-white">Importing leads...</span>
                          </div>
                          <div className="mt-6">
                            <div className="w-full bg-[#374151] rounded-full h-3">
                              <div
                                className="bg-[#3B82F6] h-3 rounded-full transition-all duration-300"
                                style={{ width: `${importProgress}%` }}
                              />
                            </div>
                            <p className="mt-3 text-sm text-gray-300">{Math.round(importProgress)}% complete</p>
                          </div>
                        </div>
                      )}

                      {/* Complete Step */}
                      {step === 'complete' && (
                        <div className="mt-6 text-center py-12">
                          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[#10B981] bg-opacity-20">
                            <svg className="h-8 w-8 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="mt-4 text-xl font-semibold text-white">Import Complete!</p>
                          
                          <div className="mt-6 space-y-3">
                            {importResults.new > 0 && (
                              <p className="text-sm text-gray-300">
                                ✅ <span className="font-medium text-[#10B981]">{importResults.new}</span> new lead{importResults.new !== 1 ? 's' : ''} imported
                              </p>
                            )}
                            {importResults.merged > 0 && (
                              <p className="text-sm text-gray-300">
                                🔄 <span className="font-medium text-[#3B82F6]">{importResults.merged}</span> existing lead{importResults.merged !== 1 ? 's' : ''} updated
                              </p>
                            )}
                            {importResults.failed > 0 && (
                              <p className="text-sm text-gray-300">
                                ❌ <span className="font-medium text-[#EF4444]">{importResults.failed}</span> lead{importResults.failed !== 1 ? 's' : ''} failed to import
                              </p>
                            )}
                          </div>
                          
                          <p className="mt-6 text-sm text-gray-400">
                            All leads now show as "CSV Import" source
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-[#374151] px-6 py-5 sm:flex sm:flex-row-reverse sm:px-8 flex-shrink-0 border-t border-[#4B5563]">
                  {step === 'mapping' && (
                    <button
                      type="button"
                      onClick={handlePreview}
                      disabled={fieldMappings.length === 0}
                      className="inline-flex w-full justify-center rounded-lg bg-[#EAB308] px-6 py-3 text-sm font-semibold text-black shadow-sm hover:bg-[#D97706] sm:ml-4 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                        className="inline-flex w-full justify-center rounded-lg bg-[#EAB308] px-6 py-3 text-sm font-semibold text-black shadow-sm hover:bg-[#D97706] sm:ml-4 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Import {validLeads.length} Lead{validLeads.length !== 1 ? 's' : ''}
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep('mapping')}
                        className="mt-3 inline-flex w-full justify-center rounded-lg bg-transparent border border-[#6B7280] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#4B5563] sm:mt-0 sm:mr-4 sm:w-auto transition-colors"
                      >
                        Back
                      </button>
                    </>
                  )}
                  
                  {(step === 'upload' || step === 'complete') && (
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-lg bg-transparent border border-[#6B7280] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#4B5563] sm:w-auto transition-colors"
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