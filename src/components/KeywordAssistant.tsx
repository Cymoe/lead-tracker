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
    <div className="mb-4 p-4 bg-gray-50 dark:bg-[#2D3748] rounded-lg border border-gray-200 dark:border-[#4A5568]">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">🎯 Keyword Coverage Assistant</h4>
      
      {!keywordSession.active ? (
        <div className="space-y-3">
          {!serviceType && (
            <div className="space-y-2">
              <ul className="text-sm space-y-1">
                <li className="text-gray-700 dark:text-gray-100">• Type any service (e.g., "Solar Panel Installation")</li>
                <li className="text-gray-700 dark:text-gray-100">• Select from 100+ predefined services</li>
                <li className="text-gray-700 dark:text-gray-100">• Keywords are generated automatically</li>
              </ul>
              <ServiceTypeAutocomplete
                value={selectedService}
                onChange={setSelectedService}
                placeholder="Type or select a service..."
                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          )}

          {serviceType && (
            <div className="bg-blue-50 dark:bg-blue-500/10 p-3 rounded-md border border-blue-200 dark:border-blue-400">
              <p className="text-sm text-blue-800 dark:text-blue-100">
                Generating keywords for: <span className="font-semibold">{serviceType}</span> in {city || 'your selected city'}
              </p>
            </div>
          )}


          {generatedKeywords && showPreview && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-gray-900 dark:text-gray-100">
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
                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded border border-blue-200 dark:border-blue-500/20">
                  <div className="font-medium text-blue-900 dark:text-blue-200 mb-2">Primary Keywords ({generatedKeywords.primary.length}):</div>
                  <div className="space-y-1">
                    {generatedKeywords.primary.map((keyword, idx) => (
                      <div key={idx} className="text-sm text-blue-700 dark:text-blue-300 pl-2">• {keyword}</div>
                    ))}
                  </div>
                </div>
                
                <div className="p-3 bg-green-50 dark:bg-green-500/10 rounded border border-green-200 dark:border-green-500/20">
                  <div className="font-medium text-green-900 dark:text-green-200 mb-2">Business Types ({generatedKeywords.businessTypes.length}):</div>
                  <div className="space-y-1">
                    {generatedKeywords.businessTypes.map((keyword, idx) => (
                      <div key={idx} className="text-sm text-green-700 dark:text-green-300 pl-2">• {keyword}</div>
                    ))}
                  </div>
                </div>
                
                {generatedKeywords.commercial.length > 0 && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-500/10 rounded border border-purple-200 dark:border-purple-500/20">
                    <div className="font-medium text-purple-900 dark:text-purple-200 mb-2">Commercial ({generatedKeywords.commercial.length}):</div>
                    <div className="space-y-1">
                      {generatedKeywords.commercial.map((keyword, idx) => (
                        <div key={idx} className="text-sm text-purple-700 dark:text-purple-300 pl-2">• {keyword}</div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded border border-amber-200 dark:border-amber-500/20">
                  <div className="font-medium text-amber-900 dark:text-amber-200 mb-2">Local Variations ({generatedKeywords.local.length}):</div>
                  <div className="space-y-1">
                    {generatedKeywords.local.map((keyword, idx) => (
                      <div key={idx} className="text-sm text-amber-700 dark:text-amber-300 pl-2">• {keyword}</div>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300 italic">
                💡 This strategic mix targets different search intents to maximize your coverage
              </p>
            </div>
          )}

          {!generatedKeywords && selectedService && (
            <div className="animate-pulse bg-gray-100 dark:bg-gray-700 h-20 rounded-lg"></div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-100">
                City: <span className="font-medium">{keywordSession.city}</span>
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-100">
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

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {keywordSession.currentIndex < keywordSession.keywords.length ? (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-900 dark:text-gray-100">
                  Current Keyword ({getCategoryForIndex(keywordSession.currentIndex)})
                </h5>
                <button
                  onClick={copyNextKeyword}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  title="Copy keyword"
                >
                  <ClipboardDocumentIcon className="h-5 w-5" />
                </button>
              </div>
              
              <div className="text-lg font-mono bg-gray-50 dark:bg-gray-900 p-3 rounded mb-3 text-gray-900 dark:text-gray-100">
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
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 flex items-center gap-2"
                >
                  Skip
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-500/10 p-4 rounded-lg text-center border border-green-200 dark:border-green-500/20">
              <CheckIcon className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <h5 className="font-medium text-green-900 dark:text-green-200">All Keywords Completed!</h5>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
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

          <div className="text-xs text-gray-600 dark:text-gray-200">
            <p>💡 Tip: Copy each keyword and search it on your platform before marking complete</p>
            <p className="mt-1">📊 Remaining: {remainingKeywords} keywords</p>
          </div>
        </div>
      )}
    </div>
  );
}