export type DataFormat = 'facebook-ad-library' | 'csv' | 'tsv' | 'unstructured';

export interface FormatDetectionResult {
  format: DataFormat;
  confidence: number;
  metadata?: {
    sponsoredCount?: number;
    hasLibraryIds?: boolean;
    delimiter?: string;
    columnCount?: number;
  };
}

export function detectDataFormat(text: string): FormatDetectionResult {
  // Check for Facebook Ad Library format
  const sponsoredCount = (text.match(/\nSponsored\n/g) || []).length;
  const hasLibraryIds = /Library ID:\s*\d+/i.test(text);
  const hasActiveStatus = /\nActive\n/g.test(text);
  const hasPlatforms = /\nPlatforms\n/g.test(text);
  
  if (sponsoredCount > 0 || hasLibraryIds || (hasActiveStatus && hasPlatforms)) {
    return {
      format: 'facebook-ad-library',
      confidence: Math.min((sponsoredCount * 20) + (hasLibraryIds ? 30 : 0) + (hasActiveStatus ? 25 : 0) + (hasPlatforms ? 25 : 0), 100),
      metadata: {
        sponsoredCount,
        hasLibraryIds
      }
    };
  }
  
  // Check for CSV format
  const lines = text.trim().split('\n').slice(0, 5); // Check first 5 lines
  const csvPattern = /^[^,]+(,[^,]+)+$/; // At least one comma per line
  const csvMatches = lines.filter(line => csvPattern.test(line)).length;
  
  if (csvMatches >= Math.min(3, lines.length)) {
    const columnCounts = lines.map(line => line.split(',').length);
    const consistentColumns = columnCounts.every(count => count === columnCounts[0]);
    
    return {
      format: 'csv',
      confidence: consistentColumns ? 90 : 70,
      metadata: {
        delimiter: ',',
        columnCount: columnCounts[0]
      }
    };
  }
  
  // Check for TSV format
  const tsvPattern = /^[^\t]+(\t[^\t]+)+$/; // At least one tab per line
  const tsvMatches = lines.filter(line => tsvPattern.test(line)).length;
  
  if (tsvMatches >= Math.min(3, lines.length)) {
    const columnCounts = lines.map(line => line.split('\t').length);
    const consistentColumns = columnCounts.every(count => count === columnCounts[0]);
    
    return {
      format: 'tsv',
      confidence: consistentColumns ? 90 : 70,
      metadata: {
        delimiter: '\t',
        columnCount: columnCounts[0]
      }
    };
  }
  
  // Default to unstructured
  return {
    format: 'unstructured',
    confidence: 100
  };
}

// Helper to suggest best parser based on format
export function suggestParser(format: DataFormat): string {
  switch (format) {
    case 'facebook-ad-library':
      return 'Facebook Ad Library Parser';
    case 'csv':
    case 'tsv':
      return 'Structured Data Parser';
    case 'unstructured':
      return 'AI Extraction';
    default:
      return 'AI Extraction';
  }
}