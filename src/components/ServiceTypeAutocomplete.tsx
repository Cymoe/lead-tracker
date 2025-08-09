import { useState, useEffect, useMemo, useCallback } from 'react';
import { searchServices, ALL_SERVICE_TYPES, SERVICE_CATEGORIES, type ServiceCategory } from '@/utils/service-types';
import debounce from 'lodash/debounce';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface ServiceTypeAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function ServiceTypeAutocomplete({
  value,
  onChange,
  placeholder = "Type or select a service...",
  className = "",
  required = false
}: ServiceTypeAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentServices, setRecentServices] = useState<string[]>([]);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [isDropdownButtonClick, setIsDropdownButtonClick] = useState(false);

  // Load recent services from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentServiceTypes');
    if (stored) {
      setRecentServices(JSON.parse(stored));
    }
  }, []);

  // Sync searchTerm with value prop
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Popular services to show when focused with no input
  const popularServices = useMemo(() => [
    "Landscaping",
    "Plumbing",
    "HVAC",
    "Roofing",
    "Electrical",
    "Painting",
    "Cleaning Service",
    "Pest Control",
    "Remodeling",
    "Tree Service"
  ], []);

  // Save to recent services
  const saveToRecentServices = (service: string) => {
    const updated = [service, ...recentServices.filter(s => s !== service)].slice(0, 10);
    setRecentServices(updated);
    localStorage.setItem('recentServiceTypes', JSON.stringify(updated));
  };

  // Search function
  const performSearch = useCallback((term: string) => {
    if (!term || term.length < 1) {
      // Show recent or popular services when empty
      if (recentServices.length > 0) {
        setSuggestions(recentServices);
      } else {
        setSuggestions(popularServices);
      }
      return;
    }

    const results = searchServices(term);
    
    // If no exact matches found, still allow custom entry
    if (results.length === 0) {
      setSuggestions([`"${term}" (custom service type)`]);
    } else {
      // Add option to use exact input if it's not in the list
      const exactMatch = results.find(r => r.toLowerCase() === term.toLowerCase());
      if (!exactMatch && term.length > 2) {
        setSuggestions([...results.slice(0, 9), `"${term}" (custom service type)`]);
      } else {
        setSuggestions(results.slice(0, 10));
      }
    }
  }, [recentServices, popularServices]);

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
    // Remove the "(custom service type)" suffix if present
    const cleanValue = suggestion.replace(' (custom service type)', '').replace(/"/g, '');
    setSearchTerm(cleanValue);
    onChange(cleanValue);
    saveToRecentServices(cleanValue);
    setShowDropdown(false);
  };

  // Handle focus
  const handleFocus = () => {
    setShowAllCategories(false);
    performSearch(searchTerm);
    setShowDropdown(true);
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm) {
      // Allow free text entry on Enter
      saveToRecentServices(searchTerm);
      setShowDropdown(false);
    }
  };

  // Handle dropdown icon click
  const handleDropdownClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Dropdown clicked, categories count:', SERVICE_CATEGORIES?.length || 0);
    setIsDropdownButtonClick(true);
    setShowAllCategories(true);
    setShowDropdown(true);
    // Don't clear the search term, just override the display
    setSuggestions([]);
    // Reset the flag after a longer delay
    setTimeout(() => setIsDropdownButtonClick(false), 300);
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
            setTimeout(() => {
              if (!isDropdownButtonClick) {
                setShowDropdown(false);
                setShowAllCategories(false);
              }
            }, 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`${className} pr-10`}
          required={required}
          autoComplete="off"
        />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsDropdownButtonClick(true);
          }}
          onClick={handleDropdownClick}
          className="absolute right-0 top-0 bottom-0 px-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <ChevronDownIcon className="h-5 w-5" />
        </button>
      </div>
      
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {showAllCategories === true ? (
            // Show all services organized by category
            <>
              <div className="px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                Select a Service Type
              </div>
              {console.log('Rendering dropdown - showAllCategories:', showAllCategories, 'type:', typeof showAllCategories, 'categories length:', SERVICE_CATEGORIES?.length)}
              {SERVICE_CATEGORIES && SERVICE_CATEGORIES.length > 0 ? (
                SERVICE_CATEGORIES.map((category, categoryIndex) => (
                <div key={categoryIndex}>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 sticky top-0">
                    {category.category}
                  </div>
                  {category.services.map((service, serviceIndex) => (
                    <div
                      key={`${categoryIndex}-${serviceIndex}`}
                      className="px-3 py-2 cursor-pointer text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        handleSelectSuggestion(service);
                        setShowAllCategories(false);
                      }}
                    >
                      {service}
                    </div>
                  ))}
                </div>
              ))
              ) : (
                <div className="px-3 py-2 text-gray-500 dark:text-gray-400">No categories available</div>
              )}
            </>
          ) : (
            // Show search suggestions
            <>
              {searchTerm.length === 0 && recentServices.length > 0 && (
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700">
                  Recent Services
                </div>
              )}
              
              {searchTerm.length === 0 && recentServices.length === 0 && (
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700">
                  Popular Services
                </div>
              )}
              
              {searchTerm.length > 0 && (
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-300 bg-gray-50 dark:bg-gray-700">
                  Suggestions
                </div>
              )}
              
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="px-3 py-2 cursor-pointer text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  {suggestion.includes('(custom service type)') ? (
                    <span className="text-gray-600 dark:text-gray-400 italic">{suggestion}</span>
                  ) : (
                    <span>{suggestion}</span>
                  )}
                </div>
              ))}
              
              {searchTerm.length > 0 && (
                <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
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