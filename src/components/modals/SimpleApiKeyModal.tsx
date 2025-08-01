import { useState } from 'react';
import { useLeadStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function SimpleApiKeyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { setOpenAIApiKey } = useLeadStore();
  const [apiKey, setApiKey] = useState('');

  if (!open) return null;

  const handleSave = () => {
    if (!apiKey.startsWith('sk-')) {
      toast.error('Invalid API key format');
      return;
    }
    
    // Save to localStorage and store
    localStorage.setItem('openaiApiKey', apiKey);
    setOpenAIApiKey(apiKey);
    
    toast.success('API key saved!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Set OpenAI API Key</h2>
        
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
          autoFocus
        />
        
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}