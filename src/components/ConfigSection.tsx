import { useState } from 'react';
import { useLeadStore } from '@/lib/store';

export default function ConfigSection() {
  const { googleScriptUrl, openaiApiKey, setGoogleScriptUrl, setOpenAIApiKey } = useLeadStore();
  const [scriptUrl, setScriptUrl] = useState(googleScriptUrl);
  const [apiKey, setApiKey] = useState(openaiApiKey);

  const handleConnect = () => {
    if (!scriptUrl.trim()) {
      alert('Please enter a valid Google Apps Script URL');
      return;
    }
    setGoogleScriptUrl(scriptUrl);
  };

  const handleSaveApiKey = () => {
    if (apiKey && !apiKey.startsWith('sk-')) {
      alert('Invalid API key format. OpenAI keys start with "sk-"');
      return;
    }
    setOpenAIApiKey(apiKey);
    alert(apiKey ? 'OpenAI API key saved!' : 'OpenAI API key removed');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Welcome to Lead Tracker Pro</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">🔗 Connect to Google Sheets</h3>
            <p className="text-sm text-gray-600 mb-4">
              Enter your Google Apps Script Web App URL:
            </p>
            <input
              type="text"
              value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleConnect}
              className="mt-4 w-full btn btn-primary"
            >
              {googleScriptUrl ? 'Update Connection' : 'Connect'}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              {googleScriptUrl ? '✓ Connected to Google Sheets' : "Don't have a URL? Follow the setup instructions in the README"}
            </p>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">🤖 AI Extraction (Optional)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Add OpenAI API key for intelligent data extraction:
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleSaveApiKey}
              className="mt-4 w-full btn btn-secondary"
            >
              {openaiApiKey ? 'Update Key' : 'Save Key'}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              {openaiApiKey ? '✓ OpenAI key configured' : (
                <>
                  Get your API key from{' '}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    OpenAI Platform
                  </a>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}