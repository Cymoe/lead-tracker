import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useLeadStore } from '@/lib/store';
import { updateLead } from '@/lib/api';
import { Lead } from '@/types';
import toast from 'react-hot-toast';
import USCityAutocomplete from '../USCityAutocomplete';
import ServiceTypeDropdown from '../ServiceTypeDropdown';
import AdPlatformChecker from '../AdPlatformChecker';
import AdViewerModal from './AdViewerModal';

interface EditLeadModalProps {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
}

// Removed - now using ServiceTypeDropdown with Grey Tsunami business types

export default function EditLeadModal({ open, onClose, lead }: EditLeadModalProps) {
  const { updateLead: updateLeadInStore } = useLeadStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdViewer, setShowAdViewer] = useState(false);
  // Removed showCustomService - ServiceTypeDropdown handles custom types
  
  const [formData, setFormData] = useState({
    handle: '',
    companyName: '',
    serviceType: '',
    city: '',
    phone: '',
    email: '',
    email2: '',
    email3: '',
    website: '',
    instagram_url: '',
    facebook_url: '',
    linkedin_url: '',
    twitter_url: '',
    leadSource: 'Instagram Manual' as 'FB Ad Library' | 'Instagram Manual' | 'Google Maps',
    runningAds: false,
    notes: '',
    adCopy: '',
    priceInfo: '',
  });

  // Update form when lead changes
  useEffect(() => {
    if (lead) {
      // ServiceTypeDropdown handles all business types
      
      setFormData({
        handle: lead.handle || '',
        companyName: lead.company_name || '',
        serviceType: lead.service_type || '',
        city: lead.city || '',
        phone: lead.phone || '',
        email: lead.email || '',
        email2: lead.email2 || '',
        email3: lead.email3 || '',
        website: lead.website || '',
        instagram_url: lead.instagram_url || '',
        facebook_url: lead.facebook_url || '',
        linkedin_url: lead.linkedin_url || '',
        twitter_url: lead.twitter_url || '',
        leadSource: lead.lead_source || 'Instagram Manual',
        runningAds: lead.running_ads || false,
        notes: lead.notes || '',
        adCopy: lead.ad_copy || '',
        priceInfo: lead.price_info || '',
      });
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    
    setIsSubmitting(true);

    try {
      // ServiceTypeDropdown handles all business types including custom ones

      const updates: Partial<Lead> = {
        handle: formData.handle || null,
        company_name: formData.companyName,
        service_type: formData.serviceType || null,
        city: formData.city || null,
        phone: formData.phone || null,
        email: formData.email || null,
        email2: formData.email2 || null,
        email3: formData.email3 || null,
        website: formData.website || null,
        instagram_url: formData.instagram_url || (formData.handle 
          ? `https://www.instagram.com/${formData.handle.replace('@', '')}` 
          : null),
        facebook_url: formData.facebook_url || null,
        linkedin_url: formData.linkedin_url || null,
        twitter_url: formData.twitter_url || null,
        lead_source: formData.leadSource,
        running_ads: formData.runningAds,
        notes: formData.notes || null,
        ad_copy: formData.adCopy || null,
        price_info: formData.priceInfo || null,
      };

      const updatedLead = await updateLead(lead.id, updates);
      updateLeadInStore(updatedLead);
      toast.success('Lead updated successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to update lead');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!lead) return null;

  return (
    <>
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
                          Edit Lead: {lead.company_name}
                        </Dialog.Title>
                        
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
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Business Type
                              </label>
                              <ServiceTypeDropdown
                                value={formData.serviceType}
                                onChange={(value) => setFormData({ ...formData, serviceType: value })}
                                placeholder="Search SMB acquisition targets..."
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                City
                              </label>
                              <USCityAutocomplete
                                value={formData.city}
                                onChange={(value) => setFormData({ ...formData, city: value })}
                                placeholder="Type city name or state code..."
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required={false}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Phone
                              </label>
                              <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="XXX-XXX-XXXX"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Email
                              </label>
                              <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="email@example.com"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Website
                              </label>
                              <input
                                type="text"
                                value={formData.website}
                                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                placeholder="example.com"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Lead Source
                              </label>
                              <select
                                value={formData.leadSource}
                                onChange={(e) => setFormData({ ...formData, leadSource: e.target.value as any })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                              >
                                <option value="Instagram Manual">Instagram Manual</option>
                                <option value="FB Ad Library">FB Ad Library</option>
                                <option value="Google Maps">Google Maps</option>
                              </select>
                            </div>
                          </div>

                          {/* Additional Contact Info */}
                          <div className="border-t pt-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Additional Contact Info</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  Email 2
                                </label>
                                <input
                                  type="email"
                                  value={formData.email2}
                                  onChange={(e) => setFormData({ ...formData, email2: e.target.value })}
                                  placeholder="alternate@example.com"
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  Email 3
                                </label>
                                <input
                                  type="email"
                                  value={formData.email3}
                                  onChange={(e) => setFormData({ ...formData, email3: e.target.value })}
                                  placeholder="another@example.com"
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Social Media */}
                          <div className="border-t pt-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Social Media Profiles</h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  Instagram URL
                                </label>
                                <input
                                  type="text"
                                  value={formData.instagram_url}
                                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                                  placeholder="https://instagram.com/username"
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  Facebook URL
                                </label>
                                <input
                                  type="text"
                                  value={formData.facebook_url}
                                  onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                                  placeholder="https://facebook.com/pagename"
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  LinkedIn URL
                                </label>
                                <input
                                  type="text"
                                  value={formData.linkedin_url}
                                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                                  placeholder="https://linkedin.com/company/name"
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  Twitter/X URL
                                </label>
                                <input
                                  type="text"
                                  value={formData.twitter_url}
                                  onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                                  placeholder="https://twitter.com/username"
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="runningAds"
                              checked={formData.runningAds}
                              onChange={(e) => setFormData({ ...formData, runningAds: e.target.checked })}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="runningAds" className="ml-2 block text-sm text-gray-900">
                              Currently running ads
                            </label>
                          </div>
                          
                          {/* Ad Platform Status */}
                          <div className="border-t pt-4">
                            <AdPlatformChecker
                              platforms={lead.ad_platforms || []}
                              onPlatformCheck={async (platform) => {
                                // TODO: Implement individual platform check
                                toast(`Checking ${platform} for ${lead.company_name}...`);
                              }}
                              onViewAds={() => setShowAdViewer(true)}
                              compact={false}
                            />
                          </div>
                          
                          {formData.runningAds && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  Ad Copy
                                </label>
                                <textarea
                                  value={formData.adCopy}
                                  onChange={(e) => setFormData({ ...formData, adCopy: e.target.value })}
                                  rows={3}
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  Price Information
                                </label>
                                <input
                                  type="text"
                                  value={formData.priceInfo}
                                  onChange={(e) => setFormData({ ...formData, priceInfo: e.target.value })}
                                  placeholder="e.g., $2995, 15% off"
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                              </div>
                            </>
                          )}

                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Notes
                            </label>
                            <textarea
                              value={formData.notes}
                              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                              rows={3}
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
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
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
    
      <AdViewerModal
        open={showAdViewer}
        onClose={() => setShowAdViewer(false)}
        lead={lead}
      />
    </>
  );
}