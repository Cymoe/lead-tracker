import { Lead, DynamicMarket, MarketHierarchy } from '@/types';
import { detectMetroArea } from '@/utils/metro-areas';
import { normalizeState } from '@/utils/state-utils';
import { getStateFromPhone } from '@/utils/area-codes';
import { getCityFromPhone } from '@/utils/area-code-cities';

/**
 * Detect markets from a list of leads and build a hierarchical structure
 */
export function detectMarketsFromLeads(leads: Lead[]): MarketHierarchy[] {
  // Group leads by location
  const locationMap = new Map<string, { city: string; state: string; count: number; withAds: number }>();
  const stateMap = new Map<string, { count: number; withAds: number; cities: Set<string> }>();
  
  leads.forEach(lead => {
    let city = lead.city?.trim() || '';
    let state = normalizeState(lead.state);
    
    // Try multiple fallback methods to detect location
    if (!state || !city) {
      // Method 1: Extract city from company name if not already set
      if (!city && lead.company_name) {
        // Common patterns: "Company - City" or "Company in City"
        const dashMatch = lead.company_name.match(/\s*-\s*([A-Za-z\s]+?)$/);
        const inMatch = lead.company_name.match(/\sin\s+([A-Za-z\s]+?)$/i);
        const potentialCity = dashMatch?.[1] || inMatch?.[1];
        
        if (potentialCity) {
          const trimmedCity = potentialCity.trim();
          // Check if this is a known city
          const detectedMetro = detectMetroArea(trimmedCity, '');
          if (detectedMetro) {
            city = trimmedCity;
            state = detectedMetro.state;
          }
        }
      }
      
      // Method 2: Try phone number area code
      if (!state && lead.phone) {
        const phoneState = getStateFromPhone(lead.phone);
        if (phoneState) {
          state = phoneState;
          
          // Also try to get city from phone
          if (!city) {
            const phoneCity = getCityFromPhone(lead.phone);
            if (phoneCity) {
              city = phoneCity;
            }
          }
        }
      }
      
      // Method 3: Try extracting from address if available
      if (!state && lead.full_address) {
        // Match state abbreviation at the end, typically before ZIP
        const stateMatch = lead.full_address.match(/,\s*([A-Z]{2})\s+\d{5}/);
        if (stateMatch) {
          state = stateMatch[1];
        }
        
        // Extract city (usually before state)
        if (!city) {
          const cityMatch = lead.full_address.match(/,\s*([^,]+),\s*[A-Z]{2}\s+\d{5}/);
          if (cityMatch) {
            city = cityMatch[1].trim();
          }
        }
      }
    }
    
    if (city && state) {
      const locationKey = `${city}|${state}`;
      const existing = locationMap.get(locationKey);
      if (existing) {
        existing.count++;
        if (lead.running_ads) existing.withAds++;
      } else {
        locationMap.set(locationKey, {
          city,
          state,
          count: 1,
          withAds: lead.running_ads ? 1 : 0
        });
      }
      
      // Update state map
      const stateData = stateMap.get(state) || { count: 0, withAds: 0, cities: new Set() };
      stateData.count++;
      if (lead.running_ads) stateData.withAds++;
      stateData.cities.add(city);
      stateMap.set(state, stateData);
    }
  });
  
  // Build hierarchy
  const hierarchy: MarketHierarchy[] = [];
  
  // First, add "All Markets" as the root
  const allMarket: DynamicMarket = {
    id: 'all',
    name: 'All Markets',
    type: 'all',
    cities: [],
    leadCount: leads.length,
    adPercentage: leads.length > 0 ? (leads.filter(l => l.running_ads).length / leads.length) * 100 : 0
  };
  
  const allNode: MarketHierarchy = {
    market: allMarket,
    children: []
  };
  
  // Build state-level markets
  const sortedStates = Array.from(stateMap.entries())
    .sort((a, b) => b[1].count - a[1].count);
  
  sortedStates.forEach(([stateName, stateData]) => {
    const stateMarket: DynamicMarket = {
      id: `state-${stateName}`,
      name: stateName,
      type: 'state',
      state: stateName,
      cities: Array.from(stateData.cities),
      leadCount: stateData.count,
      adPercentage: stateData.count > 0 ? (stateData.withAds / stateData.count) * 100 : 0
    };
    
    const stateNode: MarketHierarchy = {
      market: stateMarket,
      children: []
    };
    
    // Add cities within this state
    const stateCities = Array.from(locationMap.entries())
      .filter(([key]) => key.endsWith(`|${stateName}`))
      .map(([key, data]) => ({ key, ...data }))
      .sort((a, b) => b.count - a.count);
    
    // Group cities into metros where applicable
    const metroMap = new Map<string, { metro: ReturnType<typeof detectMetroArea>; cities: typeof stateCities }>();
    const standaloneCities: typeof stateCities = [];
    
    stateCities.forEach(cityData => {
      const metro = detectMetroArea(cityData.city, stateName);
      if (metro) {
        const existing = metroMap.get(metro.name);
        if (existing) {
          existing.cities.push(cityData);
        } else {
          metroMap.set(metro.name, { metro, cities: [cityData] });
        }
      } else {
        standaloneCities.push(cityData);
      }
    });
    
    // Add metros first
    metroMap.forEach(({ metro, cities }) => {
      const totalCount = cities.reduce((sum, c) => sum + c.count, 0);
      const totalAds = cities.reduce((sum, c) => sum + c.withAds, 0);
      
      const metroMarket: DynamicMarket = {
        id: `metro-${metro!.name}-${stateName}`,
        name: metro!.name,
        type: 'metro',
        state: stateName,
        cities: cities.map(c => c.city),
        leadCount: totalCount,
        parentId: stateMarket.id,
        adPercentage: totalCount > 0 ? (totalAds / totalCount) * 100 : 0
      };
      
      const metroNode: MarketHierarchy = {
        market: metroMarket,
        children: []
      };
      
      // Add individual cities within metro
      cities.forEach(cityData => {
        const cityMarket: DynamicMarket = {
          id: `city-${cityData.city}-${stateName}`,
          name: cityData.city,
          type: 'city',
          state: stateName,
          cities: [cityData.city],
          leadCount: cityData.count,
          parentId: metroMarket.id,
          adPercentage: cityData.count > 0 ? (cityData.withAds / cityData.count) * 100 : 0
        };
        
        metroNode.children.push({
          market: cityMarket,
          children: []
        });
      });
      
      stateNode.children.push(metroNode);
    });
    
    // Add standalone cities
    standaloneCities.forEach(cityData => {
      const cityMarket: DynamicMarket = {
        id: `city-${cityData.city}-${stateName}`,
        name: cityData.city,
        type: 'city',
        state: stateName,
        cities: [cityData.city],
        leadCount: cityData.count,
        parentId: stateMarket.id,
        adPercentage: cityData.count > 0 ? (cityData.withAds / cityData.count) * 100 : 0
      };
      
      stateNode.children.push({
        market: cityMarket,
        children: []
      });
    });
    
    allNode.children.push(stateNode);
  });
  
  hierarchy.push(allNode);
  return hierarchy;
}

/**
 * Get flat list of all markets (not hierarchical)
 */
export function getFlatMarketList(leads: Lead[]): DynamicMarket[] {
  const hierarchy = detectMarketsFromLeads(leads);
  const flatList: DynamicMarket[] = [];
  
  function traverse(node: MarketHierarchy) {
    flatList.push(node.market);
    node.children.forEach(child => traverse(child));
  }
  
  hierarchy.forEach(node => traverse(node));
  return flatList;
}