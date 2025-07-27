import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { 
  GREY_TSUNAMI_CATEGORIES, 
  ALL_BUSINESS_TYPES,
  searchBusinessTypes,
  getCategoryForBusiness 
} from '@/utils/grey-tsunami-business-types';

interface ServiceTypeDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function ServiceTypeDropdown({
  value,
  onChange,
  placeholder = "Type or select a service...",
  className = "",
  required = false
}: ServiceTypeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debug: Log the business types
  console.log('Business categories:', GREY_TSUNAMI_CATEGORIES.length);
  console.log('Total business types:', ALL_BUSINESS_TYPES.length);

  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter business types based on search
  const filteredBusinesses = searchTerm
    ? searchBusinessTypes(searchTerm)
    : ALL_BUSINESS_TYPES;

  const selectBusiness = (business: string) => {
    setSearchTerm(business);
    onChange(business);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search SMB acquisition targets..."
          className={`${className} pr-10`}
          required={required}
        />
        <button
          type="button"
          onClick={() => {
            console.log('Dropdown button clicked! Current isOpen:', isOpen);
            console.log('Setting isOpen to:', !isOpen);
            setIsOpen(!isOpen);
          }}
          className="absolute inset-y-0 right-0 px-3"
        >
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        </button>
      </div>
      
      {isOpen && (
        <div 
          className="absolute z-[9999] left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-2xl overflow-y-auto"
          style={{ width: 'min(700px, 90vw)', maxHeight: '32rem' }}
        >
          {searchTerm ? (
            // Search results view
            <>
              <div className="sticky top-0 bg-gray-50 px-4 py-3 text-sm text-gray-600 font-semibold border-b z-20">
                {filteredBusinesses.length} businesses found - {filteredBusinesses.length > 0 && getCategoryForBusiness(filteredBusinesses[0]) ? 
                  `Top match: ${getCategoryForBusiness(filteredBusinesses[0])?.tier}` : 'Custom'}
              </div>
              {filteredBusinesses.map((business, idx) => {
                const category = getCategoryForBusiness(business);
                return (
                  <div
                    key={idx}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 transition-colors"
                    onClick={() => selectBusiness(business)}
                  >
                    <div className="font-medium text-gray-900">{business}</div>
                    {category && (
                      <div className="text-xs text-gray-500 mt-1">
                        {category.tier} • {category.category} • Score: {category.acquisitionScore}/10
                      </div>
                    )}
                  </div>
                );
              })}
              {searchTerm && filteredBusinesses.length === 0 && (
                <div
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer text-gray-600 italic transition-colors"
                  onClick={() => selectBusiness(searchTerm)}
                >
                  Use "{searchTerm}" as custom business type
                </div>
              )}
            </>
          ) : (
            // Category view when no search
            <>
              <div className="sticky top-0 bg-blue-50 px-4 py-4 border-b shadow-sm z-20">
                <div className="text-base font-semibold text-blue-900">🎯 Grey Tsunami SMB Acquisition Targets</div>
                <div className="text-sm text-blue-700 mt-1">680+ business types across 20 tiers organized by acquisition potential</div>
              </div>
              {GREY_TSUNAMI_CATEGORIES.map((category, catIdx) => (
                <div key={catIdx} className="border-b border-gray-200">
                  <div className="px-4 py-4 bg-gray-50 sticky z-10" style={{ top: '80px' }}>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <span className="font-bold text-base text-gray-900">{category.tier}</span>
                          <span className="ml-3 text-base text-gray-700">{category.category}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                          <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium whitespace-nowrap">
                            Score: {category.acquisitionScore}/10
                          </span>
                          <span className="text-sm text-gray-500 whitespace-nowrap">
                            {category.businesses.length} types
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">{category.description}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1">
                    {category.businesses.map((business, bizIdx) => (
                      <div
                        key={`${catIdx}-${bizIdx}`}
                        className="px-8 py-3 hover:bg-blue-50 cursor-pointer text-sm text-gray-800 transition-colors border-b border-gray-50"
                        onClick={() => selectBusiness(business)}
                      >
                        {business}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}