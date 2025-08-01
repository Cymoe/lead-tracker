import { useState, useRef, useEffect } from 'react';

interface ResizableColumnProps {
  children: React.ReactNode;
  onResize?: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
  initialWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function ResizableColumn({
  children,
  onResize,
  minWidth = 50,
  maxWidth = 500,
  initialWidth,
  className = '',
  style
}: ResizableColumnProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [width, setWidth] = useState(initialWidth);
  const columnRef = useRef<HTMLTableCellElement>(null);
  const startX = useRef(0);
  const startWidth = useRef(0);

  useEffect(() => {
    if (!width && columnRef.current) {
      setWidth(columnRef.current.offsetWidth);
    }
  }, [width]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    startX.current = e.pageX;
    startWidth.current = width || columnRef.current?.offsetWidth || 0;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const diff = e.pageX - startX.current;
    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth.current + diff));
    
    setWidth(newWidth);
    onResize?.(newWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  return (
    <th
      ref={columnRef}
      className={`relative ${className}`}
      style={{ ...style, width: width ? `${width}px` : undefined }}
    >
      {children}
      <div
        className="absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors"
        onMouseDown={handleMouseDown}
        style={{
          backgroundColor: isResizing ? 'rgb(59 130 246)' : 'transparent'
        }}
      >
        <div className="absolute inset-y-0 -left-1 -right-1" />
      </div>
    </th>
  );
}