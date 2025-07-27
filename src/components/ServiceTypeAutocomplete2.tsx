import { useState, useEffect, useMemo, useCallback } from 'react';
import debounce from 'lodash/debounce';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

// Inline service categories to avoid import issues
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

export default function ServiceTypeAutocomplete2({
  value,
  onChange,
  placeholder = "Type or select a service...",
  className = "",
  required = false
}: ServiceTypeAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [recentServices, setRecentServices] = useState<string[]>([]);
  const [keepOpen, setKeepOpen] = useState(false);

  // Load recent services
  useEffect(() => {
    const stored = localStorage.getItem('recentServiceTypes');
    if (stored) {
      setRecentServices(JSON.parse(stored));
    }
  }, []);

  // Sync with value prop
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Popular services
  const popularServices = [
    "Landscaping", "Plumbing", "HVAC", "Roofing", "Electrical",
    "Painting", "Cleaning Service", "Pest Control", "Remodeling", "Tree Service"
  ];

  // Get all services flat
  const allServices = useMemo(() => {
    const services: string[] = [];
    SERVICE_CATEGORIES.forEach(cat => {
      services.push(...cat.services);
    });
    return services;
  }, []);

  // Search function
  const searchServices = useCallback((query: string): string[] => {
    if (!query || query.length < 1) return [];
    
    const searchLower = query.toLowerCase();
    return allServices.filter(service => 
      service.toLowerCase().includes(searchLower)
    ).slice(0, 10);
  }, [allServices]);

  // Save to recent
  const saveToRecentServices = (service: string) => {
    const updated = [service, ...recentServices.filter(s => s !== service)].slice(0, 10);
    setRecentServices(updated);
    localStorage.setItem('recentServiceTypes', JSON.stringify(updated));
  };

  // Perform search
  const performSearch = useCallback((term: string) => {
    if (!term || term.length < 1) {
      if (recentServices.length > 0) {
        setSuggestions(recentServices);
      } else {
        setSuggestions(popularServices);
      }
      return;
    }

    const results = searchServices(term);
    
    if (results.length === 0) {
      setSuggestions([`"${term}" (custom service type)`]);
    } else {
      const exactMatch = results.find(r => r.toLowerCase() === term.toLowerCase());
      if (!exactMatch && term.length > 2) {
        setSuggestions([...results.slice(0, 9), `"${term}" (custom service type)`]);
      } else {
        setSuggestions(results);
      }
    }
  }, [recentServices, popularServices, searchServices]);

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((term: string) => {
      performSearch(term);
      setShowDropdown(true);
    }, 200),
    [performSearch]
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setShowAllCategories(false);
    debouncedSearch(newValue);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: string) => {
    const cleanValue = suggestion.replace(' (custom service type)', '').replace(/"/g, '');
    setSearchTerm(cleanValue);
    onChange(cleanValue);
    saveToRecentServices(cleanValue);
    setShowDropdown(false);
    setShowAllCategories(false);
  };

  // Handle focus
  const handleFocus = () => {
    setShowAllCategories(false);
    performSearch(searchTerm);
    setShowDropdown(true);
  };

  // Handle dropdown click
  const handleDropdownClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Dropdown button clicked! Setting showAllCategories to true');
    setKeepOpen(true);
    setShowAllCategories(true);
    setShowDropdown(true);
    setSuggestions([]);
    // Reset keepOpen after a delay
    setTimeout(() => {
      setKeepOpen(false);
      console.log('Reset keepOpen');
    }, 500);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={() => {
            if (!keepOpen) {
              setTimeout(() => {
                setShowDropdown(false);
                setShowAllCategories(false);
              }, 200);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchTerm) {
              saveToRecentServices(searchTerm);
              setShowDropdown(false);
            }
          }}
          placeholder={placeholder}
          className={`${className} pr-10`}
          required={required}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={handleDropdownClick}
          onMouseDown={(e) => {
            e.preventDefault();
            setKeepOpen(true);
          }}
          className="absolute right-0 top-0 bottom-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          <ChevronDownIcon className={`h-5 w-5 transition-transform ${showAllCategories ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      {showDropdown && (
        <div 
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
          onMouseDown={(e) => e.preventDefault()}
        >
          {showAllCategories ? (
            <>
              {console.log('Rendering all categories view, showAllCategories:', showAllCategories)}
              <div className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b">
                Select a Service Type
              </div>
              {SERVICE_CATEGORIES.map((category, categoryIndex) => (
                <div key={categoryIndex}>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 sticky top-0">
                    {category.category}
                  </div>
                  {category.services.map((service, serviceIndex) => (
                    <div
                      key={`${categoryIndex}-${serviceIndex}`}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSelectSuggestion(service)}
                    >
                      {service}
                    </div>
                  ))}
                </div>
              ))}
            </>
          ) : (
            <>
              {searchTerm.length === 0 && recentServices.length > 0 && (
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                  Recent Services
                </div>
              )}
              
              {searchTerm.length === 0 && recentServices.length === 0 && (
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                  Popular Services
                </div>
              )}
              
              {searchTerm.length > 0 && (
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                  Suggestions
                </div>
              )}
              
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  {suggestion.includes('(custom service type)') ? (
                    <span className="text-gray-600 italic">{suggestion}</span>
                  ) : (
                    <span>{suggestion}</span>
                  )}
                </div>
              ))}
              
              {searchTerm.length > 0 && (
                <div className="px-3 py-1 text-xs text-gray-500 border-t bg-gray-50">
                  Press Enter to use "{searchTerm}" as is
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}