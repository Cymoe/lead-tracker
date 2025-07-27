import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useLeadStore } from '@/lib/store';
import { saveLead } from '@/lib/api';
import { Lead } from '@/types';
import toast from 'react-hot-toast';
import USCityAutocomplete from '../USCityAutocomplete';
import ServiceTypeDropdown from '../ServiceTypeDropdown';

interface AddLeadModalProps {
  open: boolean;
  onClose: () => void;
  marketAnalysisData?: {
    county: string;
    state: string;
    fipsCode: string;
    businessTypes: string[];
  };
}

// Removed - now using ServiceTypeAutocomplete

export default function AddLeadModal({ open, onClose, marketAnalysisData }: AddLeadModalProps) {
  const { addLead } = useLeadStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    handle: '',
    companyName: '',
    serviceType: '',
    city: '',
    phone: '',
    website: '',
    leadSource: 'Instagram Manual' as 'FB Ad Library' | 'Instagram Manual' | 'Google Maps',
    runningAds: false,
    notes: '',
  });

  // Update form when market analysis data is provided
  useEffect(() => {
    if (marketAnalysisData && open) {
      setFormData(prev => ({
        ...prev,
        city: `${marketAnalysisData.county}, ${marketAnalysisData.state}`,
        serviceType: marketAnalysisData.businessTypes[0] || prev.serviceType,
        notes: `Lead from ${marketAnalysisData.county} County market analysis. Target industries: ${marketAnalysisData.businessTypes.join(', ')}`
      }));
    }
  }, [marketAnalysisData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {

      const newLead = {
        ...formData,
        company_name: formData.companyName,
        service_type: formData.serviceType,
        lead_source: formData.leadSource,
        running_ads: formData.runningAds,
        instagram_url: formData.handle 
          ? `https://www.instagram.com/${formData.handle.replace('@', '')}` 
          : '',
      };

      const savedLead = await saveLead(newLead);
      addLead(savedLead);
      toast.success('Lead added successfully!');
      onClose();
      resetForm();
    } catch (error) {
      toast.error('Failed to add lead');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      handle: '',
      companyName: '',
      serviceType: '',
      city: '',
      phone: '',
      website: '',
      leadSource: 'Instagram Manual' as 'FB Ad Library' | 'Instagram Manual' | 'Google Maps',
      runningAds: false,
      notes: '',
    });
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
                      <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                          Add New Lead
                        </Dialog.Title>
                        
                        {marketAnalysisData && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm text-blue-800">
                              🎯 Pre-filled from <strong>{marketAnalysisData.county} County</strong> market analysis
                            </p>
                          </div>
                        )}
                        
                        <div className="mt-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Instagram Handle
                              </label>
                              <input
                                type="text"
                                value={formData.handle}
                                onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                                placeholder="@companyname"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Company Name*
                              </label>
                              <input
                                type="text"
                                required
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Business Type*
                              </label>
                              <ServiceTypeDropdown
                                value={formData.serviceType}
                                onChange={(value) => setFormData({ ...formData, serviceType: value })}
                                placeholder="Search SMB acquisition targets..."
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                City*
                              </label>
                              <USCityAutocomplete
                                value={formData.city}
                                onChange={(value) => setFormData({ ...formData, city: value })}
                                placeholder="Type city name or state code..."
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Phone Number
                              </label>
                              <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="(602) 555-1234"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Business Website
                              </label>
                              <input
                                type="text"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                placeholder="www.example.com"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Lead Source*
                              </label>
                              <select
                                required
                                value={formData.leadSource}
                                onChange={(e) => setFormData({ ...formData, leadSource: e.target.value as 'FB Ad Library' | 'Instagram Manual' | 'Google Maps' })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              >
                                <option value="Instagram Manual">Instagram Manual</option>
                                <option value="FB Ad Library">FB Ad Library</option>
                                <option value="Google Maps">Google Maps</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Running Ads?
                              </label>
                              <div className="mt-2 space-x-4">
                                <label className="inline-flex items-center">
                                  <input
                                    type="radio"
                                    name="runningAds"
                                    checked={formData.runningAds === true}
                                    onChange={() => setFormData({ ...formData, runningAds: true })}
                                    className="form-radio h-4 w-4 text-blue-600"
                                  />
                                  <span className="ml-2">Yes</span>
                                </label>
                                <label className="inline-flex items-center">
                                  <input
                                    type="radio"
                                    name="runningAds"
                                    checked={formData.runningAds === false}
                                    onChange={() => setFormData({ ...formData, runningAds: false })}
                                    className="form-radio h-4 w-4 text-blue-600"
                                  />
                                  <span className="ml-2">No</span>
                                </label>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Notes
                            </label>
                            <textarea
                              value={formData.notes}
                              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                              rows={3}
                              placeholder="Ad details, special offers, etc."
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
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
                      {isSubmitting ? 'Saving...' : 'Save Lead'}
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