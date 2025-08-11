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
  
  // Initialize views panel state from localStorage
  const [isViewsPanelOpen, setIsViewsPanelOpenState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('viewsPanelOpen');
      return saved === 'true';
    }
    return false;
  });

  const setIsSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsedState(collapsed);
    localStorage.setItem('sidebarCollapsed', collapsed.toString());
    // Emit event for other components
    window.dispatchEvent(new Event('sidebarToggled'));
  };

  const setIsViewsPanelOpen = (open: boolean) => {
    setIsViewsPanelOpenState(open);
    localStorage.setItem('viewsPanelOpen', open.toString());
    // Emit event for other components
    window.dispatchEvent(new CustomEvent('viewsPanelToggled', { detail: { isOpen: open } }));
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

  // Listen for views panel toggle from AppLayout
  useEffect(() => {
    const handleViewsPanelToggle = (event: CustomEvent) => {
      // Update state but don't save to localStorage again (it's already saved by the setter)
      setIsViewsPanelOpenState(event.detail.isOpen);
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