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
  // Initialize states with defaults
  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState(false);
  const [isViewsPanelOpen, setIsViewsPanelOpenState] = useState(false);
  
  // Load saved states after mount
  useEffect(() => {
    const savedSidebar = localStorage.getItem('sidebarCollapsed');
    const savedViewsPanel = localStorage.getItem('viewsPanelOpen');
    
    if (savedSidebar === 'true') {
      setIsSidebarCollapsedState(true);
    }
    if (savedViewsPanel === 'true') {
      setIsViewsPanelOpenState(true);
    }
  }, []);

  const setIsSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsedState(collapsed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', collapsed.toString());
      // Emit event for other components
      window.dispatchEvent(new Event('sidebarToggled'));
    }
  };

  const setIsViewsPanelOpen = (open: boolean) => {
    setIsViewsPanelOpenState(open);
    if (typeof window !== 'undefined') {
      localStorage.setItem('viewsPanelOpen', open.toString());
      // Emit event for other components
      window.dispatchEvent(new CustomEvent('viewsPanelToggled', { detail: { isOpen: open } }));
    }
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