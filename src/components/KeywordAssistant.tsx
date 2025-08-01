import { useState, useEffect } from 'react';
import { useLeadStore } from '@/lib/store';
import { generateKeywordsForService, GeneratedKeywords, getAllKeywordsFlat } from '@/utils/keyword-generator';
import { CheckIcon, ChevronRightIcon, ClipboardDocumentIcon } from '@heroicons/react/24/solid';
import ServiceTypeAutocomplete from './ServiceTypeAutocomplete';

interface KeywordAssistantProps {
  city: string;
  serviceType?: string;
}

export default function KeywordAssistant({ city, serviceType }: KeywordAssistantProps) {
  const { keywordSession, startKeywordSession, completeKeyword, endKeywordSession } = useLeadStore();
  const [selectedService, setSelectedService] = useState(serviceType || '');
  const [copiedKeyword, setCopiedKeyword] = useState('');
  const [generatedKeywords, setGeneratedKeywords] = useState<GeneratedKeywords | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const includeSuburbs = true; // Always include suburbs for maximum coverage

  const generatePreview = () => {
    const service = serviceType || selectedService;
    if (!service) return;

    const keywords = generateKeywordsForService(service, city || 'Phoenix', includeSuburbs);
    setGeneratedKeywords(keywords);
    setShowPreview(true);
  };

  useEffect(() => {
    const service = serviceType || selectedService;
    if (service) {
      generatePreview();
    }
  }, [serviceType, selectedService, city]);

  const handleStartSession = () => {
    const service = serviceType || selectedService;
    if (!service) {
      alert('Please select a service type first');
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
    
    // Clear the copied state after 2 seconds
    setTimeout(() => setCopiedKeyword(''), 2000);
  };

  const handleCompleteKeyword = (index: number) => {
    const keyword = keywordSession.keywords[index];
    completeKeyword(keyword);
    
    // Auto-copy the next keyword
    setTimeout(() => {
      copyNextKeyword();
    }, 100);
  };

  const remainingKeywords = keywordSession.keywords.length - keywordSession.completed.length;
  const progressPercentage = keywordSession.keywords.length > 0 
    ? (keywordSession.completed.length / keywordSession.keywords.length) * 100 
    : 0;

  // Group keywords by category for better display
  const getCategoryForIndex = (index: number): string => {
    if (!generatedKeywords) return '';
    
    const primaryCount = generatedKeywords.primary.length;
    const businessCount = generatedKeywords.businessTypes.length;
    const commercialCount = generatedKeywords.commercial.length;
    
    if (index < primaryCount) return 'Primary';
    if (index < primaryCount + businessCount) return 'Business Types';
    if (index < primaryCount + businessCount + commercialCount) return 'Commercial';
    return 'Local';
  };

  return (
    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-medium text-gray-900 mb-3">🎯 Keyword Coverage Assistant</h4>
      
      {!keywordSession.active ? (
        <div className="space-y-3">
          {!serviceType && (
            <div className="space-y-2">
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Type any service (e.g., "Solar Panel Installation")</p>
                <p>• Select from 100+ predefined services</p>
                <p>• Keywords are generated automatically</p>
              </div>
              <ServiceTypeAutocomplete
                value={selectedService}
                onChange={setSelectedService}
                placeholder="Type or select a service..."
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          )}

          {serviceType && (
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                Generating keywords for: <span className="font-medium">{serviceType}</span> in {city || 'your selected city'}
              </p>
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

              <div className="space-y-3 max-h-96 overflow-y-auto">
                <div className="p-3 bg-blue-50 rounded">
                  <div className="font-medium text-blue-900 mb-2">Primary Keywords ({generatedKeywords.primary.length}):</div>
                  <div className="space-y-1">
                    {generatedKeywords.primary.map((keyword, idx) => (
                      <div key={idx} className="text-sm text-blue-700 pl-2">• {keyword}</div>
                    ))}
                  </div>
                </div>
                
                <div className="p-3 bg-green-50 rounded">
                  <div className="font-medium text-green-900 mb-2">Business Types ({generatedKeywords.businessTypes.length}):</div>
                  <div className="space-y-1">
                    {generatedKeywords.businessTypes.map((keyword, idx) => (
                      <div key={idx} className="text-sm text-green-700 pl-2">• {keyword}</div>
                    ))}
                  </div>
                </div>
                
                {generatedKeywords.commercial.length > 0 && (
                  <div className="p-3 bg-purple-50 rounded">
                    <div className="font-medium text-purple-900 mb-2">Commercial ({generatedKeywords.commercial.length}):</div>
                    <div className="space-y-1">
                      {generatedKeywords.commercial.map((keyword, idx) => (
                        <div key={idx} className="text-sm text-purple-700 pl-2">• {keyword}</div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="p-3 bg-amber-50 rounded">
                  <div className="font-medium text-amber-900 mb-2">Local Variations ({generatedKeywords.local.length}):</div>
                  <div className="space-y-1">
                    {generatedKeywords.local.map((keyword, idx) => (
                      <div key={idx} className="text-sm text-amber-700 pl-2">• {keyword}</div>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-600 italic">
                💡 This strategic mix targets different search intents to maximize your coverage
              </p>
            </div>
          )}

          {!generatedKeywords && selectedService && (
            <div className="animate-pulse bg-gray-100 h-20 rounded-lg"></div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                City: <span className="font-medium">{keywordSession.city}</span>
              </p>
              <p className="text-sm text-gray-600">
                Progress: <span className="font-medium">{keywordSession.completed.length} / {keywordSession.keywords.length}</span>
              </p>
            </div>
            <button
              onClick={endKeywordSession}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              End Session
            </button>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {keywordSession.currentIndex < keywordSession.keywords.length ? (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-900">
                  Current Keyword ({getCategoryForIndex(keywordSession.currentIndex)})
                </h5>
                <button
                  onClick={copyNextKeyword}
                  className="p-2 text-gray-600 hover:text-gray-900"
                  title="Copy keyword"
                >
                  <ClipboardDocumentIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="text-lg font-mono bg-gray-50 p-3 rounded mb-3">
                {keywordSession.keywords[keywordSession.currentIndex]}
              </div>

              {copiedKeyword === keywordSession.keywords[keywordSession.currentIndex] && (
                <p className="text-sm text-green-600 mb-3">✓ Copied to clipboard!</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleCompleteKeyword(keywordSession.currentIndex)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <CheckIcon className="h-5 w-5" />
                  Mark Complete
                </button>
                <button
                  onClick={() => {
                    if (keywordSession.currentIndex < keywordSession.keywords.length) {
                      const keyword = keywordSession.keywords[keywordSession.currentIndex];
                      completeKeyword(keyword);
                      copyNextKeyword();
                    }
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 flex items-center gap-2"
                >
                  Skip
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <CheckIcon className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <h5 className="font-medium text-green-900">All Keywords Completed!</h5>
              <p className="text-sm text-green-700 mt-1">
                Great job! You've covered all {keywordSession.keywords.length} keywords.
              </p>
              <button
                onClick={endKeywordSession}
                className="mt-3 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Finish Session
              </button>
            </div>
          )}

          <div className="text-xs text-gray-500">
            <p>💡 Tip: Copy each keyword and search it on your platform before marking complete</p>
            <p className="mt-1">📊 Remaining: {remainingKeywords} keywords</p>
          </div>
        </div>
      )}
    </div>
  );
}