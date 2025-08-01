import { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

// Inline service categories
const SERVICE_CATEGORIES = [
  {
    category: "Home Construction & Remodeling",
    services: [
      "General Contractor", "Kitchen Remodeling", "Bathroom Remodeling", 
      "Home Additions", "Basement Finishing", "Drywall Installation",
      "Flooring Installation", "Tile Installation", "Cabinet Installation",
      "Countertop Installation", "Deck Building", "Patio Construction"
    ]
  },
  {
    category: "Outdoor & Landscaping", 
    services: [
      "Landscaping", "Lawn Care", "Tree Service", "Turf Installation",
      "Irrigation System", "Snow Removal", "Pool Service", "Pool Installation",
      "Fence Installation", "Hardscaping", "Garden Design", "Outdoor Lighting"
    ]
  },
  {
    category: "Home Systems",
    services: [
      "Plumbing", "Electrical", "HVAC", "Water Heater Installation",
      "Solar Panel Installation", "Generator Installation", "Home Automation",
      "Security System Installation", "Fire Alarm Installation"
    ]
  },
  {
    category: "Cleaning & Maintenance",
    services: [
      "House Cleaning", "Carpet Cleaning", "Window Cleaning", "Pressure Washing",
      "Gutter Cleaning", "Chimney Cleaning", "Air Duct Cleaning", "Pest Control",
      "Mold Remediation", "Junk Removal"
    ]
  },
  {
    category: "Professional Services",
    services: [
      "Home Inspection", "Real Estate Photography", "Interior Design",
      "Architecture", "Engineering", "Land Surveying", "Appraisal Services",
      "Property Management", "HOA Management"
    ]
  }
];

interface ServiceTypeAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function ServiceTypeAutocomplete3({
  value,
  onChange,
  placeholder = "Type or select a service...",
  className = "",
  required = false
}: ServiceTypeAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [displayMode, setDisplayMode] = useState<'search' | 'categories'>('search');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync with value prop
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setDisplayMode('search');
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    // Don't change mode if dropdown is already open
    if (!isOpen) {
      setDisplayMode('search');
      setIsOpen(true);
    }
  };

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('Dropdown clicked! Current mode:', displayMode);
    setDisplayMode('categories');
    setIsOpen(true);
    console.log('Set mode to categories');
  };

  const selectService = (service: string) => {
    setInputValue(service);
    onChange(service);
    setIsOpen(false);
    
    // Save to recent
    const stored = localStorage.getItem('recentServiceTypes');
    const recent = stored ? JSON.parse(stored) : [];
    const updated = [service, ...recent.filter((s: string) => s !== service)].slice(0, 10);
    localStorage.setItem('recentServiceTypes', JSON.stringify(updated));
  };

  // Get filtered services for search
  const getFilteredServices = () => {
    if (!inputValue) {
      const stored = localStorage.getItem('recentServiceTypes');
      const recent = stored ? JSON.parse(stored) : [];
      return recent.length > 0 ? recent : [
        "Landscaping", "Plumbing", "HVAC", "Roofing", "Electrical"
      ];
    }
    
    const searchLower = inputValue.toLowerCase();
    const allServices: string[] = [];
    SERVICE_CATEGORIES.forEach(cat => allServices.push(...cat.services));
    
    return allServices
      .filter(service => service.toLowerCase().includes(searchLower))
      .slice(0, 10);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={`${className} pr-10`}
          required={required}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={handleDropdownClick}
          onMouseDown={(e) => e.preventDefault()}
          className="absolute right-0 top-0 bottom-0 px-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer focus:outline-none"
        >
          <ChevronDownIcon className={`h-5 w-5 transition-transform ${displayMode === 'categories' ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {displayMode === 'categories' ? (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b sticky top-0">
                All Service Categories
              </div>
              {SERVICE_CATEGORIES.map((category, idx) => (
                <div key={idx}>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                    {category.category}
                  </div>
                  {category.services.map((service, sIdx) => (
                    <div
                      key={`${idx}-${sIdx}`}
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
            <>
              <div className="px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                {inputValue ? 'Suggestions' : 'Recent Services'}
              </div>
              {getFilteredServices().map((service: string, idx: number) => (
                <div
                  key={idx}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => selectService(service)}
                >
                  {service}
                </div>
              ))}
              {inputValue && (
                <div
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-gray-600 italic border-t"
                  onClick={() => selectService(inputValue)}
                >
                  Use "{inputValue}" as custom service
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}