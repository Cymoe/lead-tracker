import { useState, useEffect, useMemo, useCallback } from 'react';
import { searchServices, ALL_SERVICE_TYPES } from '@/utils/service-types';
import { SERVICE_CATEGORIES } from '@/utils/service-types';
import debounce from 'lodash/debounce';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

export default function ServiceTypeAutocompleteDebug() {
  console.log('SERVICE_CATEGORIES at module level:', SERVICE_CATEGORIES);
  console.log('SERVICE_CATEGORIES type:', typeof SERVICE_CATEGORIES);
  console.log('SERVICE_CATEGORIES is array:', Array.isArray(SERVICE_CATEGORIES));
  
  if (SERVICE_CATEGORIES && SERVICE_CATEGORIES.length > 0) {
    console.log('First category:', SERVICE_CATEGORIES[0]);
  }
  
  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3 className="font-bold mb-2">Debug Info:</h3>
      <pre className="text-xs bg-white p-2 rounded overflow-auto">
        {JSON.stringify({
          hasServiceCategories: !!SERVICE_CATEGORIES,
          isArray: Array.isArray(SERVICE_CATEGORIES),
          length: SERVICE_CATEGORIES?.length || 0,
          firstCategory: SERVICE_CATEGORIES?.[0]?.category || 'N/A'
        }, null, 2)}
      </pre>
    </div>
  );
}