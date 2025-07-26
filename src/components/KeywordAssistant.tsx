import { useState, useEffect } from 'react';
import { useLeadStore } from '@/lib/store';
import { generateKeywordsForService, GeneratedKeywords, getAllKeywordsFlat } from '@/utils/keyword-generator';
import { CheckIcon, ChevronRightIcon, ClipboardDocumentIcon } from '@heroicons/react/24/solid';

interface KeywordAssistantProps {
  city: string;
}

export default function KeywordAssistant({ city }: KeywordAssistantProps) {
  const { keywordSession, startKeywordSession, completeKeyword, endKeywordSession } = useLeadStore();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customService, setCustomService] = useState('');
  const [copiedKeyword, setCopiedKeyword] = useState('');
  const [generatedKeywords, setGeneratedKeywords] = useState<GeneratedKeywords | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [includeSuburbs, setIncludeSuburbs] = useState(true);

  const generatePreview = () => {
    if (!selectedCategory) return;

    const serviceType = selectedCategory === 'custom' ? customService : selectedCategory;
    if (!serviceType) return;

    const keywords = generateKeywordsForService(serviceType, city || 'Phoenix', includeSuburbs);
    setGeneratedKeywords(keywords);
    setShowPreview(true);
  };

  useEffect(() => {
    if (selectedCategory) {
      generatePreview();
    }
  }, [selectedCategory, customService, city, includeSuburbs]);

  const handleStartSession = () => {
    if (!selectedCategory) {
      alert('Please select a service type first');
      return;
    }

    if (selectedCategory === 'custom' && !customService.trim()) {
      alert('Please enter a custom service type');
      return;
    }

    if (!generatedKeywords) return;

    const allKeywords = getAllKeywordsFlat(generatedKeywords);
    startKeywordSession(allKeywords, city || 'Phoenix');
  };

  const copyNextKeyword = () => {
    if (!keywordSession.active || keywordSession.currentIndex >= keywordSession.keywords.length) {
      return;
    }

    const keyword = keywordSession.keywords[keywordSession.currentIndex];
    navigator.clipboard.writeText(keyword);
    setCopiedKeyword(keyword);
    
    setTimeout(() => {
      setCopiedKeyword('');
    }, 2000);
  };

  const handleKeywordComplete = () => {
    const currentKeyword = keywordSession.keywords[keywordSession.currentIndex];
    completeKeyword(currentKeyword);
    
    // Copy next keyword automatically
    if (keywordSession.currentIndex + 1 < keywordSession.keywords.length) {
      setTimeout(copyNextKeyword, 500);
    }
  };

  useEffect(() => {
    if (keywordSession.active && keywordSession.currentIndex < keywordSession.keywords.length) {
      copyNextKeyword();
    }
  }, [keywordSession.active, keywordSession.currentIndex]);

  const progress = keywordSession.keywords.length > 0
    ? (keywordSession.completed.length / keywordSession.keywords.length) * 100
    : 0;

  // Helper to determine which category the current keyword belongs to
  const getCurrentCategory = () => {
    if (!keywordSession.active || !generatedKeywords) return '';
    const currentIndex = keywordSession.currentIndex;
    const primaryEnd = generatedKeywords.primary.length;
    const businessEnd = primaryEnd + generatedKeywords.businessTypes.length;
    const commercialEnd = businessEnd + generatedKeywords.commercial.length;

    if (currentIndex < primaryEnd) return 'Primary Terms';
    if (currentIndex < businessEnd) return 'Business Types';
    if (currentIndex < commercialEnd) return 'Commercial/Specialty';
    return 'Location Variants';
  };

  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-medium text-gray-900 mb-3">🎯 Keyword Coverage Assistant</h4>
      
      {!keywordSession.active ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                if (e.target.value !== 'custom') {
                  setCustomService('');
                }
              }}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select Service Type...</option>
              <option value="turf">Turf/Artificial Grass</option>
              <option value="landscaping">Landscaping</option>
              <option value="remodeling">Remodeling</option>
              <option value="painting">Painting</option>
              <option value="roofing">Roofing</option>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="hvac">HVAC</option>
              <option value="concrete">Concrete</option>
              <option value="fencing">Fencing</option>
              <option value="pool">Pool Service</option>
              <option value="pest">Pest Control</option>
              <option value="cleaning">Cleaning Service</option>
              <option value="tree">Tree Service</option>
              <option value="custom">Custom Service Type...</option>
            </select>
            
            {selectedCategory === 'custom' && (
              <input
                type="text"
                value={customService}
                onChange={(e) => setCustomService(e.target.value)}
                placeholder="e.g., window tinting"
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            )}
          </div>

          {selectedCategory && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeSuburbs"
                checked={includeSuburbs}
                onChange={(e) => setIncludeSuburbs(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="includeSuburbs" className="text-sm text-gray-700">
                Include suburb variations (adds 3-6 location keywords)
              </label>
            </div>
          )}

          {generatedKeywords && showPreview && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-gray-900">
                  📋 Keyword Strategy ({generatedKeywords.totalCount} total)
                </h5>
                <button
                  onClick={handleStartSession}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Start Smart Session
                </button>
              </div>

              <div className="space-y-2 text-sm">
                {generatedKeywords.primary.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-medium text-gray-700">✅ Primary Terms ({generatedKeywords.primary.length}):</p>
                    <div className="pl-4 text-gray-600 grid grid-cols-2 gap-1">
                      {generatedKeywords.primary.map((kw, idx) => (
                        <span key={idx} className="flex items-center gap-1">
                          • {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {generatedKeywords.businessTypes.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-medium text-gray-700">⏳ Business Types ({generatedKeywords.businessTypes.length}):</p>
                    <div className="pl-4 text-gray-600 grid grid-cols-2 gap-1">
                      {generatedKeywords.businessTypes.map((kw, idx) => (
                        <span key={idx} className="flex items-center gap-1">
                          • {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {generatedKeywords.commercial.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-medium text-gray-700">🏢 Commercial/Specialty ({generatedKeywords.commercial.length}):</p>
                    <div className="pl-4 text-gray-600 grid grid-cols-2 gap-1">
                      {generatedKeywords.commercial.map((kw, idx) => (
                        <span key={idx} className="flex items-center gap-1">
                          • {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {generatedKeywords.local.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-medium text-gray-700">📍 Location Variants ({generatedKeywords.local.length}):</p>
                    <div className="pl-4 text-gray-600 grid grid-cols-2 gap-1">
                      {generatedKeywords.local.map((kw, idx) => (
                        <span key={idx} className="flex items-center gap-1">
                          • {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {!generatedKeywords && selectedCategory && (
            <button
              onClick={generatePreview}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Preview Keywords
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium text-gray-900">
                Searching: {keywordSession.city}
              </p>
              <p className="text-sm text-gray-600">
                {keywordSession.completed.length} of {keywordSession.keywords.length} keywords complete
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Category: {getCurrentCategory()}
              </p>
            </div>
            <button
              onClick={endKeywordSession}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              End Session
            </button>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Current Keyword:</p>
              {copiedKeyword && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <CheckIcon className="h-4 w-4" />
                  Copied!
                </span>
              )}
            </div>
            <p className="text-lg font-mono bg-gray-100 p-3 rounded flex items-center justify-between">
              <span>{keywordSession.keywords[keywordSession.currentIndex] || 'All keywords complete!'}</span>
              {keywordSession.currentIndex < keywordSession.keywords.length && (
                <ClipboardDocumentIcon className="h-5 w-5 text-gray-400" />
              )}
            </p>
            
            {keywordSession.currentIndex < keywordSession.keywords.length && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={copyNextKeyword}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                >
                  Copy Again
                </button>
                <button
                  onClick={handleKeywordComplete}
                  className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm flex items-center gap-1"
                >
                  <CheckIcon className="h-4 w-4" />
                  Mark Complete
                </button>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="text-gray-900 font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          
          {keywordSession.totalFound > 0 && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                🎉 Found {keywordSession.totalFound} leads so far!
              </p>
            </div>
          )}
          
          {keywordSession.currentIndex >= keywordSession.keywords.length && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">
                ✅ All keywords complete!
              </p>
              <p className="text-sm text-blue-700">
                Total leads found: {keywordSession.totalFound}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}