import { useState } from 'react';
import { 
  PencilSquareIcon, 
  TrashIcon, 
  TagIcon, 
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useLeadStore } from '@/lib/store';
import { updateLeads, deleteLeads } from '@/lib/api';
import { batchUpdateLeads } from '@/lib/batch-updates';
import toast from 'react-hot-toast';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface BulkOperationsBarProps {
  selectedCount: number;
  onBulkEdit: () => void;
  onExport: () => void;
  onClearSelection: () => void;
}

export default function BulkOperationsBar({
  selectedCount,
  onBulkEdit,
  onExport,
  onClearSelection
}: BulkOperationsBarProps) {
  const { selectedLeads, leads, deleteLead, updateLead } = useLeadStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedCount} selected leads? This cannot be undone.`)) {
      return;
    }

    setIsProcessing(true);
    setProcessingMessage('Deleting leads...');
    
    try {
      await deleteLeads(selectedLeads);
      selectedLeads.forEach(id => deleteLead(id));
      toast.success(`Deleted ${selectedCount} leads`);
      onClearSelection();
    } catch (error) {
      toast.error('Failed to delete some leads');
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  const handleBulkTag = async (tag: string) => {
    setIsProcessing(true);
    setProcessingMessage(`Adding tag "${tag}"...`);
    
    try {
      // Add tag to notes for now (could be a separate field)
      const updates = selectedLeads.map(id => {
        const lead = leads.find(l => l.id === id);
        if (!lead) return null;
        
        const currentNotes = lead.notes || '';
        const newNotes = currentNotes ? `${currentNotes}\n#${tag}` : `#${tag}`;
        
        return {
          id,
          updates: { notes: newNotes }
        };
      }).filter(Boolean) as { id: string; updates: Partial<typeof leads[0]> }[];

      await batchUpdateLeads(updates);
      
      toast.success(`Added tag to ${selectedCount} leads`);
      onClearSelection();
    } catch (error) {
      toast.error('Failed to tag some leads');
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  const handleMarkContacted = async () => {
    setIsProcessing(true);
    setProcessingMessage('Marking as contacted...');
    
    try {
      const updates = selectedLeads.map(id => {
        const lead = leads.find(l => l.id === id);
        if (!lead) return null;
        
        const currentNotes = lead.notes || '';
        const contactedNote = `[Contacted: ${new Date().toLocaleDateString()}]`;
        const newNotes = currentNotes ? `${currentNotes}\n${contactedNote}` : contactedNote;
        
        return {
          id,
          updates: { 
            notes: newNotes
          }
        };
      }).filter(Boolean) as { id: string; updates: Partial<typeof leads[0]> }[];

      await batchUpdateLeads(updates);
      
      toast.success(`Marked ${selectedCount} leads as contacted`);
      onClearSelection();
    } catch (error) {
      toast.error('Failed to update some leads');
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-50 animate-slide-up max-w-4xl">
      <div className="bg-gray-900 text-white rounded-lg shadow-2xl px-3 py-2 md:px-4 md:py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        {/* Selection count */}
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5 text-blue-400" />
          <span className="text-sm font-medium">
            {selectedCount} {selectedCount === 1 ? 'lead' : 'leads'} selected
          </span>
        </div>

        {/* Divider - hidden on mobile */}
        <div className="hidden sm:block h-8 w-px bg-gray-700" />

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {isProcessing ? (
            <div className="flex items-center gap-2 px-3">
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              <span className="text-sm">{processingMessage}</span>
            </div>
          ) : (
            <>
              {/* Edit */}
              <button
                onClick={onBulkEdit}
                className="inline-flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium rounded hover:bg-gray-800 transition-colors"
                title="Edit selected"
              >
                <PencilSquareIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </button>

              {/* Tags dropdown */}
              <Menu as="div" className="relative">
                <Menu.Button className="inline-flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium rounded hover:bg-gray-800 transition-colors">
                  <TagIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Tag</span>
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute bottom-full mb-2 left-0 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      {['Hot Lead', 'Follow Up', 'Qualified', 'Not Interested'].map((tag) => (
                        <Menu.Item key={tag}>
                          {({ active }) => (
                            <button
                              onClick={() => handleBulkTag(tag)}
                              className={`${
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } block w-full px-4 py-2 text-left text-sm`}
                            >
                              {tag}
                            </button>
                          )}
                        </Menu.Item>
                      ))}
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>

              {/* Mark as contacted */}
              <button
                onClick={handleMarkContacted}
                className="inline-flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium rounded hover:bg-gray-800 transition-colors"
                title="Mark as contacted"
              >
                <CheckCircleIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Contacted</span>
              </button>


              {/* Export - hidden on mobile */}
              <button
                onClick={onExport}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded hover:bg-gray-800 transition-colors"
                title="Export selected"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                Export
              </button>

              {/* Delete */}
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium rounded text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
                title="Delete selected"
              >
                <TrashIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </>
          )}
        </div>

        {/* Clear selection */}
        <button
          onClick={onClearSelection}
          className="ml-auto sm:ml-2 p-1.5 rounded hover:bg-gray-800 transition-colors"
          title="Clear selection"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}