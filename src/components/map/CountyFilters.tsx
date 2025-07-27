import { useState } from 'react';
import { CountyFilter } from '@/services/county-data-aggregator';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { GREY_TSUNAMI_CATEGORIES } from '@/utils/grey-tsunami-business-types';

interface Props {
  filter: CountyFilter;
  onFilterChange: (filter: CountyFilter) => void;
  viewMode: 'metro' | 'county';
}

export default function CountyFilters({ filter, onFilterChange, viewMode }: Props) {
  const [activePreset, setActivePreset] = useState<string | null>(null);
  
  const states = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
    'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
    'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
    'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia',
    'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  const handleStateToggle = (state: string) => {
    const currentStates = filter.states || [];
    const newStates = currentStates.includes(state)
      ? currentStates.filter(s => s !== state)
      : [...currentStates, state];
    
    setActivePreset(null); // Clear active preset
    onFilterChange({ ...filter, states: newStates });
  };

  const handleMarketClassToggle = (classification: 'main' | 'secondary' | 'tertiary') => {
    const current = filter.marketClassification || [];
    const updated = current.includes(classification)
      ? current.filter(c => c !== classification)
      : [...current, classification];
    
    setActivePreset(null); // Clear active preset
    onFilterChange({ ...filter, marketClassification: updated });
  };

  return (
    <div className="space-y-4">
          {/* Market Classification */}
          <div>
            <h4 className="text-sm font-medium text-gray-200 mb-2">Market Type</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filter.marketClassification?.includes('main') || false}
                  onChange={() => handleMarketClassToggle('main')}
                  className="h-4 w-4 text-[#3B82F6] rounded border-[#374151] focus:ring-[#3B82F6]"
                />
                <span className="ml-2 text-sm text-gray-300">
                  Main Markets (1M+ pop)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filter.marketClassification?.includes('secondary') || false}
                  onChange={() => handleMarketClassToggle('secondary')}
                  className="h-4 w-4 text-[#3B82F6] rounded border-[#374151] focus:ring-[#3B82F6]"
                />
                <span className="ml-2 text-sm text-gray-300">
                  Secondary (250K-1M)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filter.marketClassification?.includes('tertiary') || false}
                  onChange={() => handleMarketClassToggle('tertiary')}
                  className="h-4 w-4 text-[#3B82F6] rounded border-[#374151] focus:ring-[#3B82F6]"
                />
                <span className="ml-2 text-sm text-gray-300">
                  Tertiary (&lt;250K) 🎯
                </span>
              </label>
            </div>
          </div>

          {/* Opportunity Score */}
          <div>
            <h4 className="text-sm font-medium text-gray-200 mb-2">
              Min Opportunity Score
            </h4>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={filter.minOpportunityScore || 0}
              onChange={(e) => {
                setActivePreset(null);
                onFilterChange({
                  ...filter,
                  minOpportunityScore: parseInt(e.target.value)
                });
              }}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>0</span>
              <span className="font-medium text-[#60A5FA]">
                {filter.minOpportunityScore || 0}
              </span>
              <span>100</span>
            </div>
          </div>

          {/* State Selection */}
          <div>
            <h4 className="text-sm font-medium text-gray-200 mb-2">
              States ({filter.states?.length || 0} selected)
            </h4>
                          <div className="max-h-40 overflow-y-auto border border-[#374151] rounded p-2">
              <div className="grid grid-cols-2 gap-1">
                {states.map(state => (
                  <label key={state} className="flex items-center text-xs">
                    <input
                      type="checkbox"
                      checked={filter.states?.includes(state) || false}
                      onChange={() => handleStateToggle(state)}
                      className="h-3 w-3 text-[#3B82F6] rounded border-[#374151] focus:ring-[#3B82F6]"
                    />
                    <span className="ml-1 text-gray-300">{state}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => onFilterChange({ ...filter, states: states })}
                className="text-xs text-[#60A5FA] hover:text-[#93BBFC]"
              >
                Select All
              </button>
              <button
                onClick={() => onFilterChange({ ...filter, states: [] })}
                className="text-xs text-[#60A5FA] hover:text-[#93BBFC]"
              >
                Clear All
              </button>
              <button
                onClick={() => onFilterChange({ ...filter, states: ['Florida', 'Texas', 'California', 'Arizona', 'North Carolina'] })}
                className="text-xs text-emerald-400 hover:text-emerald-300"
              >
                Top 5 States
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-200">Quick Presets</h4>
              {activePreset && (
                <button
                  onClick={() => setActivePreset(null)}
                  className="text-xs text-gray-400 hover:text-gray-300"
                >
                  Clear selection
                </button>
              )}
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setActivePreset('high-opportunity');
                  onFilterChange({
                    states: ['Florida', 'Texas', 'Arizona', 'North Carolina', 'Tennessee'],
                    marketClassification: ['tertiary'],
                    minOpportunityScore: 70
                  });
                }}
                className={`w-full text-left text-xs p-2 rounded transition-all ${
                  activePreset === 'high-opportunity' 
                    ? 'bg-[#3B82F6] text-white ring-2 ring-[#3B82F6] ring-offset-2 ring-offset-[#1F2937]' 
                    : 'bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 text-[#60A5FA]'
                }`}
              >
                🎯 High Opportunity Tertiary Markets
              </button>
              <button
                onClick={() => {
                  setActivePreset('hidden-gems');
                  onFilterChange({
                    marketClassification: ['tertiary'],
                    minOpportunityScore: 75,
                    states: [], // All states
                    greyTsunamiTiers: ['TIER 1', 'TIER 2', 'TIER 3'] // Focus on top tiers
                  });
                }}
                className={`w-full text-left text-xs p-2 rounded transition-all ${
                  activePreset === 'hidden-gems' 
                    ? 'bg-purple-500 text-white ring-2 ring-purple-500 ring-offset-2 ring-offset-[#1F2937]' 
                    : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400'
                }`}
              >
                💎 Hidden Gems (75+ Tertiary)
              </button>
              <button
                onClick={() => {
                  setActivePreset('small-town-gems');
                  onFilterChange({
                    marketClassification: ['tertiary'],
                    minOpportunityScore: 75,
                    states: ['Texas', 'Florida', 'Georgia', 'North Carolina', 'Tennessee']
                  });
                }}
                className={`w-full text-left text-xs p-2 rounded transition-all ${
                  activePreset === 'small-town-gems' 
                    ? 'bg-indigo-500 text-white ring-2 ring-indigo-500 ring-offset-2 ring-offset-[#1F2937]' 
                    : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400'
                }`}
              >
                🏘️ Small Town Gems (75+ Southern States)
              </button>
              <button
                onClick={() => {
                  setActivePreset('low-competition');
                  onFilterChange({
                    marketClassification: ['tertiary'],
                    minOpportunityScore: 70,
                    states: ['Montana', 'Wyoming', 'Idaho', 'North Dakota', 'South Dakota', 'Nebraska', 'Kansas']
                  });
                }}
                className={`w-full text-left text-xs p-2 rounded transition-all ${
                  activePreset === 'low-competition' 
                    ? 'bg-pink-500 text-white ring-2 ring-pink-500 ring-offset-2 ring-offset-[#1F2937]' 
                    : 'bg-pink-500/10 hover:bg-pink-500/20 text-pink-400'
                }`}
              >
                🎣 Low Competition Markets (Midwest)
              </button>
              <button
                onClick={() => {
                  setActivePreset('high-density');
                  onFilterChange({
                    marketClassification: ['secondary'],
                    minOpportunityScore: 65,
                    states: []  // All states
                  });
                }}
                className={`w-full text-left text-xs p-2 rounded transition-all ${
                  activePreset === 'high-density' 
                    ? 'bg-emerald-500 text-white ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#1F2937]' 
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                }`}
              >
                🏢 High Business Density (Secondary Markets)
              </button>
              <button
                onClick={() => {
                  setActivePreset('major-metros');
                  onFilterChange({
                    states: ['Florida', 'Texas', 'California', 'New York'],
                    marketClassification: ['main', 'secondary'],
                    minOpportunityScore: 60
                  });
                }}
                className={`w-full text-left text-xs p-2 rounded transition-all ${
                  activePreset === 'major-metros' 
                    ? 'bg-amber-500 text-white ring-2 ring-amber-500 ring-offset-2 ring-offset-[#1F2937]' 
                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400'
                }`}
              >
                🏙️ Major Metro Areas
              </button>
              <button
                onClick={() => {
                  setActivePreset('mountain-west');
                  onFilterChange({
                    states: ['Utah', 'Idaho', 'Montana', 'Wyoming', 'North Dakota'],
                    marketClassification: ['tertiary'],
                    minOpportunityScore: 50
                  });
                }}
                className={`w-full text-left text-xs p-2 rounded transition-all ${
                  activePreset === 'mountain-west' 
                    ? 'bg-emerald-500 text-white ring-2 ring-emerald-500 ring-offset-2 ring-offset-[#1F2937]' 
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                }`}
              >
                🌄 Mountain West Opportunities
              </button>
              <button
                onClick={() => {
                  setActivePreset('home-services');
                  onFilterChange({
                    marketClassification: ['tertiary'],
                    minOpportunityScore: 70,
                    greyTsunamiTiers: ['TIER 1', 'TIER 2', 'TIER 3', 'TIER 16'], // Home services tiers
                    states: [] // All states
                  });
                }}
                className={`w-full text-left text-xs p-2 rounded transition-all ${
                  activePreset === 'home-services' 
                    ? 'bg-orange-500 text-white ring-2 ring-orange-500 ring-offset-2 ring-offset-[#1F2937]' 
                    : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400'
                }`}
              >
                🏠 Home Services Hidden Gems
              </button>
              <button
                onClick={() => {
                  setActivePreset('retail-services');
                  onFilterChange({
                    marketClassification: ['secondary', 'tertiary'],
                    minOpportunityScore: 65,
                    greyTsunamiTiers: ['TIER 7', 'TIER 11', 'TIER 13'], // Retail tiers
                    states: [] // All states
                  });
                }}
                className={`w-full text-left text-xs p-2 rounded transition-all ${
                  activePreset === 'retail-services' 
                    ? 'bg-rose-500 text-white ring-2 ring-rose-500 ring-offset-2 ring-offset-[#1F2937]' 
                    : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
                }`}
              >
                🛍️ Retail Hidden Gems
              </button>
            </div>
          </div>

          {/* Sector/Industry Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-200 mb-2">
              Target Sectors ({filter.greyTsunamiTiers?.length || 0} selected)
            </h4>
            <div className="space-y-2">
              <div className="max-h-60 overflow-y-auto border border-[#374151] rounded p-2">
                {GREY_TSUNAMI_CATEGORIES.map((category) => (
                  <div key={category.tier} className="mb-3">
                    <label className="flex items-start cursor-pointer hover:bg-[#374151] p-1 rounded">
                      <input
                        type="checkbox"
                        checked={filter.greyTsunamiTiers?.includes(category.tier) || false}
                        onChange={() => {
                          const current = filter.greyTsunamiTiers || [];
                          const updated = current.includes(category.tier)
                            ? current.filter(t => t !== category.tier)
                            : [...current, category.tier];
                          onFilterChange({ ...filter, greyTsunamiTiers: updated });
                        }}
                        className="h-4 w-4 text-[#3B82F6] rounded mt-1 border-[#374151] focus:ring-[#3B82F6]"
                      />
                      <div className="ml-2 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-white">
                            {category.tier}
                          </span>
                          <span className="text-xs text-gray-400">
                            Score: {category.acquisitionScore}/10
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 mt-0.5">
                          {category.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {category.businesses.length} business types
                        </p>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
              
              {/* Sector Quick Filters */}
              <div className="space-y-1">
                <button
                  onClick={() => onFilterChange({
                    ...filter,
                    greyTsunamiTiers: ['TIER 1', 'TIER 2', 'TIER 3']
                  })}
                  className="text-xs text-[#60A5FA] hover:text-[#93BBFC]"
                >
                  Select Top Tiers (1-3)
                </button>
                <button
                  onClick={() => onFilterChange({
                    ...filter,
                    greyTsunamiTiers: GREY_TSUNAMI_CATEGORIES
                      .filter(c => c.category.toLowerCase().includes('service'))
                      .map(c => c.tier)
                  })}
                  className="text-xs text-[#60A5FA] hover:text-[#93BBFC]"
                >
                  All Service Sectors
                </button>
                <button
                  onClick={() => onFilterChange({
                    ...filter,
                    greyTsunamiTiers: GREY_TSUNAMI_CATEGORIES
                      .filter(c => c.category.toLowerCase().includes('manufacturing') || 
                                  c.category.toLowerCase().includes('industrial'))
                      .map(c => c.tier)
                  })}
                  className="text-xs text-[#60A5FA] hover:text-[#93BBFC]"
                >
                  Manufacturing & Industrial
                </button>
                <button
                  onClick={() => onFilterChange({ ...filter, greyTsunamiTiers: [] })}
                  className="text-xs text-gray-400 hover:text-gray-300"
                >
                  Clear Sectors
                </button>
              </div>
            </div>
          </div>
        </div>
  );
}