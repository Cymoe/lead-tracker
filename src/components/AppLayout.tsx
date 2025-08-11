'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import ViewsSidebar from '@/components/ViewsSidebar';
import { LayoutProvider, useLayout } from '@/contexts/LayoutContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

function AppLayoutContent({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const { isSidebarCollapsed, isViewsPanelOpen, setIsViewsPanelOpen } = useLayout();
  const [isInitialMount, setIsInitialMount] = useState(true);
  
  // Remove initial mount flag after component mounts
  useEffect(() => {
    setIsClient(true);
    const timer = setTimeout(() => {
      setIsInitialMount(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Don't show layout on login page
  if (pathname === '/login') {
    return <>{children}</>;
  }
  
  const handleViewsPanelToggle = (open: boolean) => {
    setIsViewsPanelOpen(open);
    // Event is now emitted by setIsViewsPanelOpen in LayoutContext
  };

  return (
    <>
      {/* Markets Panel Tab - Always visible, moves with panel */}
      {isClient && (
        <button
          onClick={() => handleViewsPanelToggle(!isViewsPanelOpen)}
          className={`hidden lg:block fixed bottom-24 ${
            isViewsPanelOpen 
              ? 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white' 
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
          } py-4 px-2 rounded-r-md shadow-md ${!isInitialMount ? 'transition-all duration-300 ease-in-out' : ''} border border-gray-300 dark:border-gray-600 z-40 text-xs font-medium`}
          style={{
            left: `${(isSidebarCollapsed ? 64 : 224) + (isViewsPanelOpen ? 320 : 0)}px`,
            ...(isInitialMount ? {} : { transition: 'left 300ms ease-in-out' })
          }}
          title={isViewsPanelOpen ? "Close Markets" : "Open Markets"}
        >
          <span style={{ writingMode: 'vertical-lr', textOrientation: 'mixed' }}>
            Markets
          </span>
        </button>
      )}
      
      {/* Views Sidebar - Fixed position next to main sidebar */}
      {isClient && (
        <ViewsSidebar 
          isOpen={isViewsPanelOpen}
          onClose={() => handleViewsPanelToggle(false)}
        />
      )}
      
      {/* Main content area */}
      {children}
    </>
  );
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  
  // Don't wrap login page with layout provider
  if (pathname === '/login') {
    return <>{children}</>;
  }
  
  return (
    <LayoutProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </LayoutProvider>
  );
}
