'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LayoutContextType {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  isViewsPanelOpen: boolean;
  setIsViewsPanelOpen: (open: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  // Initialize sidebar state from localStorage synchronously to prevent flash
  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      return saved === 'true';
    }
    return false;
  });
  
  const [isViewsPanelOpen, setIsViewsPanelOpen] = useState(false);

  const setIsSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsedState(collapsed);
    localStorage.setItem('sidebarCollapsed', collapsed.toString());
    // Emit event for other components
    window.dispatchEvent(new Event('sidebarToggled'));
  };

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('sidebarCollapsed');
      setIsSidebarCollapsedState(saved === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sidebarToggled', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sidebarToggled', handleStorageChange);
    };
  }, []);

  // Listen for views panel toggle
  useEffect(() => {
    const handleViewsPanelToggle = (event: CustomEvent) => {
      setIsViewsPanelOpen(event.detail.isOpen);
    };
    
    window.addEventListener('viewsPanelToggled', handleViewsPanelToggle as EventListener);
    return () => window.removeEventListener('viewsPanelToggled', handleViewsPanelToggle as EventListener);
  }, []);

  return (
    <LayoutContext.Provider value={{
      isSidebarCollapsed,
      setIsSidebarCollapsed,
      isViewsPanelOpen,
      setIsViewsPanelOpen
    }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}