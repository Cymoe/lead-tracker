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

  // Debug: Log the business types (commented out to reduce console noise)
  // console.log('Business categories:', GREY_TSUNAMI_CATEGORIES.length);
  // console.log('Total business types:', ALL_BUSINESS_TYPES.length);

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
          className="absolute z-[9999] left-0 right-0 mt-2 bg-white dark:bg-[#1F2937] border border-gray-300 dark:border-[#374151] rounded-lg shadow-2xl overflow-y-auto max-w-full"
          style={{ maxHeight: '28rem' }}
        >
          {searchTerm ? (
            // Search results view
            <>
              <div className="sticky top-0 bg-gray-50 dark:bg-[#374151] px-3 py-2 text-xs text-gray-600 dark:text-gray-300 font-medium border-b dark:border-[#4B5563] z-20">
                {filteredBusinesses.length} results found
              </div>
              {filteredBusinesses.map((business, idx) => {
                const category = getCategoryForBusiness(business);
                return (
                  <div
                    key={idx}
                    className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-[#374151] cursor-pointer border-b border-gray-100 dark:border-[#374151] transition-colors"
                    onClick={() => selectBusiness(business)}
                  >
                    <div className="font-medium text-gray-900 dark:text-white text-sm">{business}</div>
                    {category && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {category.tier} • {category.category} • Score: {category.acquisitionScore}/10
                      </div>
                    )}
                  </div>
                );
              })}
              {searchTerm && filteredBusinesses.length === 0 && (
                <div
                  className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-[#374151] cursor-pointer text-gray-600 dark:text-gray-400 italic transition-colors text-sm"
                  onClick={() => selectBusiness(searchTerm)}
                >
                  Use "{searchTerm}" as custom business type
                </div>
              )}
            </>
          ) : (
            // Category view when no search
            <>
              <div className="sticky top-0 bg-gray-50 dark:bg-[#374151] px-3 py-2 border-b dark:border-[#4B5563] z-20">
                <div className="text-xs font-medium text-gray-600 dark:text-gray-300">Select a business type</div>
              </div>
              {GREY_TSUNAMI_CATEGORIES.map((category, catIdx) => (
                <div key={catIdx} className="border-b border-gray-200 dark:border-[#374151]">
                  <div className="px-3 py-2 bg-gray-50 dark:bg-[#2D3748] sticky z-10" style={{ top: '32px' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">{category.tier}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">{category.category}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs bg-blue-100 dark:bg-[#3B82F6] dark:bg-opacity-20 text-blue-800 dark:text-[#60A5FA] px-2 py-0.5 rounded font-medium">
                          Score: {category.acquisitionScore}/10
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {category.businesses.length} types
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{category.description}</div>
                  </div>
                  <div className="grid grid-cols-1">
                    {category.businesses.map((business, bizIdx) => (
                      <div
                        key={`${catIdx}-${bizIdx}`}
                        className="px-6 py-2 hover:bg-blue-50 dark:hover:bg-[#374151] cursor-pointer text-sm text-gray-800 dark:text-gray-300 transition-colors border-b border-gray-50 dark:border-[#2D3748]"
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