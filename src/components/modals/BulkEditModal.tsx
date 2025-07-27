import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { useLeadStore } from '@/lib/store';
import { updateLead, updateLeads } from '@/lib/api';
import { Lead } from '@/types';
import toast from 'react-hot-toast';
import USCityAutocomplete from '../USCityAutocomplete';

interface BulkEditModalProps {
  open: boolean;
  onClose: () => void;
  selectedLeadIds: string[];
}

const SERVICE_TYPES = [
  'Turf', 'Painting', 'Remodeling', 'Landscaping', 'Roofing',
  'Plumbing', 'Electrical', 'HVAC', 'Concrete', 'Fencing',
  'Pool Service', 'Pest Control', 'Cleaning Service', 'Tree Service'
];

type FieldUpdate = {
  field: keyof Lead;
  value: any;
  enabled: boolean;
};

export default function BulkEditModal({ open, onClose, selectedLeadIds }: BulkEditModalProps) {
  const { leads, updateLead: updateLeadInStore } = useLeadStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomService, setShowCustomService] = useState(false);
  
  // Track which fields to update and their values
  const [updates, setUpdates] = useState<Record<string, FieldUpdate>>({
    service_type: { field: 'service_type', value: '', enabled: false },
    city: { field: 'city', value: '', enabled: false },
    lead_source: { field: 'lead_source', value: 'Instagram Manual', enabled: false },
    running_ads: { field: 'running_ads', value: false, enabled: false },
    notes_append: { field: 'notes', value: '', enabled: false },
    notes_replace: { field: 'notes', value: '', enabled: false },
  });

  const selectedLeads = leads.filter(lead => selectedLeadIds.includes(lead.id));

  const handleFieldToggle = (fieldKey: string) => {
    setUpdates(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        enabled: !prev[fieldKey].enabled
      }
    }));
  };

  const handleFieldChange = (fieldKey: string, value: any) => {
    setUpdates(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        value: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Collect enabled updates
    const enabledUpdates: Partial<Lead> = {};
    const appendNotes = updates.notes_append.enabled && updates.notes_append.value;
    const replaceNotes = updates.notes_replace.enabled && updates.notes_replace.value;

    Object.entries(updates).forEach(([key, update]) => {
      if (update.enabled && key !== 'notes_append' && key !== 'notes_replace') {
        if (key === 'service_type' && update.value === 'Other' && showCustomService) {
          // Handle custom service type
          enabledUpdates[update.field] = updates.custom_service?.value || '';
        } else {
          enabledUpdates[update.field] = update.value;
        }
      }
    });

    if (Object.keys(enabledUpdates).length === 0 && !appendNotes && !replaceNotes) {
      toast.error('Please select at least one field to update');
      setIsSubmitting(false);
      return;
    }

    try {
      // If we're only updating fields without special handling, use batch update
      if (!appendNotes) {
        const leadUpdates: Partial<Lead> = { ...enabledUpdates };
        
        if (replaceNotes) {
          leadUpdates.notes = updates.notes_replace.value;
        }

        const updatedLeads = await updateLeads(selectedLeadIds, leadUpdates);
        
        // Update local store
        updatedLeads.forEach(lead => updateLeadInStore(lead));
        
        toast.success(`Updated ${updatedLeads.length} lead${updatedLeads.length !== 1 ? 's' : ''}`);
        onClose();
      } else {
        // Handle append notes case - requires individual updates
        let successCount = 0;
        let errorCount = 0;

        const updatePromises = selectedLeads.map(async (lead) => {
          try {
            const leadUpdates: Partial<Lead> = { ...enabledUpdates };
            
            // Handle notes append
            leadUpdates.notes = lead.notes 
              ? `${lead.notes}\n\n${updates.notes_append.value}` 
              : updates.notes_append.value;

            const updatedLead = await updateLead(lead.id, leadUpdates);
            updateLeadInStore(updatedLead);
            successCount++;
          } catch (error) {
            console.error(`Failed to update lead ${lead.id}:`, error);
            errorCount++;
          }
        });

        await Promise.all(updatePromises);

        if (successCount > 0) {
          toast.success(`Updated ${successCount} lead${successCount !== 1 ? 's' : ''}`);
        }
        
        if (errorCount > 0) {
          toast.error(`Failed to update ${errorCount} lead${errorCount !== 1 ? 's' : ''}`);
        }

        if (errorCount === 0) {
          onClose();
        }
      }
    } catch (error) {
      toast.error('An error occurred during bulk update');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCommonValue = (field: keyof Lead): string => {
    const values = selectedLeads.map(lead => lead[field]);
    const uniqueValues = Array.from(new Set(values));
    
    if (uniqueValues.length === 1 && uniqueValues[0] !== null && uniqueValues[0] !== undefined) {
      return String(uniqueValues[0]);
    }
    
    return uniqueValues.length > 1 ? '(Multiple values)' : '';
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <form onSubmit={handleSubmit}>
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
                        <PencilSquareIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                          Bulk Edit {selectedLeadIds.length} Leads
                        </Dialog.Title>

                        <div className="mt-4 space-y-4">
                          <div className="bg-blue-50 p-3 rounded-md">
                            <p className="text-sm text-blue-800">
                              Select the fields you want to update. Only checked fields will be modified.
                            </p>
                          </div>

                          {/* Service Type */}
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="update-service-type"
                                checked={updates.service_type.enabled}
                                onChange={() => handleFieldToggle('service_type')}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor="update-service-type" className="ml-2 text-sm font-medium text-gray-700">
                                Update Service Type
                              </label>
                            </div>
                            {updates.service_type.enabled && (
                              <div className="ml-6">
                                <select
                                  value={updates.service_type.value}
                                  onChange={(e) => {
                                    handleFieldChange('service_type', e.target.value);
                                    setShowCustomService(e.target.value === 'Other');
                                  }}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                  <option value="">Select service type</option>
                                  {SERVICE_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                                  <option value="Other">Other</option>
                                </select>
                                {showCustomService && (
                                  <input
                                    type="text"
                                    value={updates.custom_service?.value || ''}
                                    onChange={(e) => handleFieldChange('custom_service', e.target.value)}
                                    placeholder="Enter custom service type"
                                    className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                  />
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                  Current: {getCommonValue('service_type')}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* City */}
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="update-city"
                                checked={updates.city.enabled}
                                onChange={() => handleFieldToggle('city')}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor="update-city" className="ml-2 text-sm font-medium text-gray-700">
                                Update City
                              </label>
                            </div>
                            {updates.city.enabled && (
                              <div className="ml-6">
                                <USCityAutocomplete
                                  value={updates.city.value}
                                  onChange={(value) => handleFieldChange('city', value)}
                                  placeholder="Type city name or state code..."
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                  required={false}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Current: {getCommonValue('city')}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Lead Source */}
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="update-lead-source"
                                checked={updates.lead_source.enabled}
                                onChange={() => handleFieldToggle('lead_source')}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor="update-lead-source" className="ml-2 text-sm font-medium text-gray-700">
                                Update Lead Source
                              </label>
                            </div>
                            {updates.lead_source.enabled && (
                              <div className="ml-6">
                                <select
                                  value={updates.lead_source.value}
                                  onChange={(e) => handleFieldChange('lead_source', e.target.value)}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                  <option value="Instagram Manual">Instagram Manual</option>
                                  <option value="FB Ad Library">FB Ad Library</option>
                                  <option value="Google Maps">Google Maps</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                  Current: {getCommonValue('lead_source')}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Running Ads */}
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id="update-running-ads"
                                checked={updates.running_ads.enabled}
                                onChange={() => handleFieldToggle('running_ads')}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor="update-running-ads" className="ml-2 text-sm font-medium text-gray-700">
                                Update Running Ads Status
                              </label>
                            </div>
                            {updates.running_ads.enabled && (
                              <div className="ml-6">
                                <select
                                  value={updates.running_ads.value.toString()}
                                  onChange={(e) => handleFieldChange('running_ads', e.target.value === 'true')}
                                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                  <option value="true">Yes - Running Ads</option>
                                  <option value="false">No - Not Running Ads</option>
                                </select>
                              </div>
                            )}
                          </div>

                          {/* Notes Options */}
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">Notes Update</p>
                            
                            {/* Append to Notes */}
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id="append-notes"
                                  checked={updates.notes_append.enabled}
                                  onChange={() => {
                                    handleFieldToggle('notes_append');
                                    if (!updates.notes_append.enabled && updates.notes_replace.enabled) {
                                      handleFieldToggle('notes_replace');
                                    }
                                  }}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="append-notes" className="ml-2 text-sm text-gray-700">
                                  Append to existing notes
                                </label>
                              </div>
                              {updates.notes_append.enabled && (
                                <div className="ml-6">
                                  <textarea
                                    value={updates.notes_append.value}
                                    onChange={(e) => handleFieldChange('notes_append', e.target.value)}
                                    rows={3}
                                    placeholder="Text to add to existing notes..."
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Replace Notes */}
                            <div className="space-y-2">
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  id="replace-notes"
                                  checked={updates.notes_replace.enabled}
                                  onChange={() => {
                                    handleFieldToggle('notes_replace');
                                    if (!updates.notes_replace.enabled && updates.notes_append.enabled) {
                                      handleFieldToggle('notes_append');
                                    }
                                  }}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="replace-notes" className="ml-2 text-sm text-gray-700">
                                  Replace all notes
                                </label>
                              </div>
                              {updates.notes_replace.enabled && (
                                <div className="ml-6">
                                  <textarea
                                    value={updates.notes_replace.value}
                                    onChange={(e) => handleFieldChange('notes_replace', e.target.value)}
                                    rows={3}
                                    placeholder="New notes content..."
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                  />
                                  <p className="text-xs text-red-500 mt-1">
                                    Warning: This will replace all existing notes
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto disabled:opacity-50"
                    >
                      {isSubmitting ? 'Updating...' : `Update ${selectedLeadIds.length} Leads`}
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}