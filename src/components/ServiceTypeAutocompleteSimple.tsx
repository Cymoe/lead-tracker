import { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { SERVICE_CATEGORIES } from '@/utils/service-types';

interface ServiceTypeAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function ServiceTypeAutocompleteSimple({
  value,
  onChange,
  placeholder = "Type or select a service...",
  className = "",
  required = false
}: ServiceTypeAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCategories(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    if (isOpen && showCategories) {
      // If categories are showing, close it
      setIsOpen(false);
      setShowCategories(false);
    } else {
      // Open and show categories
      setIsOpen(true);
      setShowCategories(true);
    }
  };

  const selectService = (service: string) => {
    onChange(service);
    setIsOpen(false);
    setShowCategories(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            setIsOpen(true);
            setShowCategories(false);
          }}
          placeholder={placeholder}
          className={`${className} pr-10`}
          required={required}
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleDropdown();
          }}
          className="absolute inset-y-0 right-0 px-3 flex items-center"
        >
          <ChevronDownIcon className={`h-5 w-5 text-gray-400 hover:text-gray-600 ${showCategories ? 'rotate-180' : ''} transition-transform`} />
        </button>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {showCategories ? (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b sticky top-0">
                All Service Types
              </div>
              {SERVICE_CATEGORIES?.map((category, idx) => (
                <div key={idx}>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                    {category.category}
                  </div>
                  {category.services.map((service, sIdx) => (
                    <div
                      key={sIdx}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => selectService(service)}
                    >
                      {service}
                    </div>
                  ))}
                </div>
              ))}
            </>
          ) : (
            <div className="px-3 py-2 text-gray-500">
              Start typing to search services...
            </div>
          )}
        </div>
      )}
    </div>
  );
}