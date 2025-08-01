import { useEffect, useRef, useState } from 'react';
import { useLeadStore } from '@/lib/store';

export function useTableKeyboardNavigation(tableRef: React.RefObject<HTMLTableElement>) {
  const { selectedLeads, setSelectedLeads, leads } = useLeadStore();
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!tableRef.current || isEditing) return;

      const rows = tableRef.current.querySelectorAll('tbody tr');
      const maxRows = rows.length;
      
      // Get focused cell from DOM if not tracked
      if (!focusedCell && document.activeElement) {
        const cell = document.activeElement.closest('td');
        if (cell) {
          const row = cell.closest('tr');
          const rowIndex = Array.from(rows).indexOf(row as HTMLTableRowElement);
          const colIndex = Array.from(row?.children || []).indexOf(cell);
          if (rowIndex >= 0 && colIndex >= 0) {
            setFocusedCell({ row: rowIndex, col: colIndex });
          }
        }
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (focusedCell && focusedCell.row > 0) {
            const newRow = focusedCell.row - 1;
            setFocusedCell({ ...focusedCell, row: newRow });
            focusCell(newRow, focusedCell.col);
          }
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (focusedCell && focusedCell.row < maxRows - 1) {
            const newRow = focusedCell.row + 1;
            setFocusedCell({ ...focusedCell, row: newRow });
            focusCell(newRow, focusedCell.col);
          }
          break;

        case 'ArrowLeft':
          e.preventDefault();
          if (focusedCell && focusedCell.col > 0) {
            const newCol = focusedCell.col - 1;
            setFocusedCell({ ...focusedCell, col: newCol });
            focusCell(focusedCell.row, newCol);
          }
          break;

        case 'ArrowRight':
          e.preventDefault();
          if (focusedCell) {
            const row = rows[focusedCell.row];
            const maxCols = row?.children.length || 0;
            if (focusedCell.col < maxCols - 1) {
              const newCol = focusedCell.col + 1;
              setFocusedCell({ ...focusedCell, col: newCol });
              focusCell(focusedCell.row, newCol);
            }
          }
          break;

        case ' ':
          // Space to select/deselect current row
          if (e.shiftKey || e.metaKey || e.ctrlKey) return; // Let modifiers through
          e.preventDefault();
          if (focusedCell && focusedCell.row < leads.length) {
            const leadId = leads[focusedCell.row].id;
            toggleSelect(leadId);
          }
          break;

        case 'Enter':
          // Enter to start editing
          e.preventDefault();
          if (focusedCell) {
            const cell = getCellElement(focusedCell.row, focusedCell.col);
            const editableElement = cell?.querySelector('[data-editable]');
            if (editableElement) {
              (editableElement as HTMLElement).dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
              setIsEditing(true);
            }
          }
          break;

        case 'Escape':
          // Clear selection
          if (selectedLeads.length > 0) {
            e.preventDefault();
            setSelectedLeads([]);
          }
          break;

        case 'a':
          // Cmd/Ctrl+A to select all
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            setSelectedLeads(leads.map(l => l.id));
          }
          break;

        case 'd':
          // Cmd/Ctrl+D to duplicate row
          if ((e.metaKey || e.ctrlKey) && focusedCell) {
            e.preventDefault();
            // Could trigger duplicate functionality
          }
          break;
      }

      // Shift+Click style range selection
      if (e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        if (focusedCell && focusedCell.row < leads.length) {
          const leadId = leads[focusedCell.row].id;
          if (!selectedLeads.includes(leadId)) {
            setSelectedLeads([...selectedLeads, leadId]);
          }
        }
      }
    };

    const focusCell = (row: number, col: number) => {
      const cell = getCellElement(row, col);
      if (cell) {
        (cell as HTMLElement).focus();
        // Scroll into view if needed
        cell.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    };

    const getCellElement = (row: number, col: number) => {
      if (!tableRef.current) return null;
      const rows = tableRef.current.querySelectorAll('tbody tr');
      const targetRow = rows[row];
      return targetRow?.children[col] as HTMLTableCellElement;
    };

    const toggleSelect = (leadId: string) => {
      setSelectedLeads(
        selectedLeads.includes(leadId)
          ? selectedLeads.filter(id => id !== leadId)
          : [...selectedLeads, leadId]
      );
    };

    // Listen for edit mode changes
    const handleEditStart = () => setIsEditing(true);
    const handleEditEnd = () => setIsEditing(false);

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('inline-edit-start', handleEditStart);
    document.addEventListener('inline-edit-end', handleEditEnd);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('inline-edit-start', handleEditStart);
      document.removeEventListener('inline-edit-end', handleEditEnd);
    };
  }, [focusedCell, selectedLeads, leads, setSelectedLeads, isEditing]);

  return {
    focusedCell,
    setFocusedCell,
    isEditing
  };
}