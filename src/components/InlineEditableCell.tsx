import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { updateLead } from '@/lib/api';
import { Lead } from '@/types';
import { CheckIcon, XMarkIcon } from '@heroicons/react/20/solid';
import toast from 'react-hot-toast';

interface InlineEditableCellProps {
  lead: Lead;
  field: keyof Lead;
  value: string | number | null | undefined;
  onUpdate: (lead: Lead) => void;
  className?: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'select';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export default function InlineEditableCell({
  lead,
  field,
  value,
  onUpdate,
  className = '',
  type = 'text',
  options = [],
  placeholder = 'Enter value...'
}: InlineEditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  const cellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value?.toString() || '');
  }, [value]);

  const handleSave = async () => {
    if (editValue === (value?.toString() || '')) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const updatedLead = await updateLead(lead.id, { [field]: editValue || null });
      onUpdate(updatedLead);
      setIsEditing(false);
      
      // Show subtle success indicator
      if (cellRef.current) {
        cellRef.current.classList.add('bg-green-50');
        setTimeout(() => {
          cellRef.current?.classList.remove('bg-green-50');
        }, 1000);
      }
    } catch (error) {
      toast.error('Failed to update');
      setEditValue(value?.toString() || '');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value?.toString() || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Tab') {
      handleSave();
    }
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  if (isEditing) {
    return (
      <div className={`relative ${className}`}>
        {type === 'select' ? (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 text-xs border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isSaving}
          >
            <option value="">-- Select --</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 text-xs border border-blue-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isSaving}
            placeholder={placeholder}
          />
        )}
        {isSaving && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2">
            <div className="animate-spin h-3 w-3 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={cellRef}
      onDoubleClick={handleDoubleClick}
      className={`cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${className}`}
      title="Double-click to edit"
    >
      {value || <span className="text-gray-400 italic text-xs">{placeholder}</span>}
    </div>
  );
}