// High-ticket service configuration focusing on visual transformation potential

export interface HighTicketService {
  name: string;
  searchTerms: string[];
  avgProjectValue: {
    min: number;
    max: number;
  };
  visualImpactScore: 1 | 2 | 3 | 4 | 5; // 5 = highest visual impact
  instagramPotential: 'low' | 'medium' | 'high' | 'very-high';
  beforeAfterPotential: boolean;
  description: string;
  leadQualityIndicators: string[];
}

export const HIGH_TICKET_SERVICES: HighTicketService[] = [
  // TOP PRIORITY - Highest visual impact & ticket value
  {
    name: 'Pool Builders',
    searchTerms: ['Pool Builder', 'Pool Contractor', 'Pool Installation', 'Swimming Pool Construction', 'Pool Company'],
    avgProjectValue: { min: 30000, max: 200000 },
    visualImpactScore: 5,
    instagramPotential: 'very-high',
    beforeAfterPotential: true,
    description: 'Complete backyard transformations with pools, spas, and outdoor living',
    leadQualityIndicators: ['custom', 'design', 'luxury', 'construction', 'installation']
  },
  {
    name: 'Turf Installers',
    searchTerms: ['Turf Installer', 'Artificial Grass', 'Synthetic Turf', 'Artificial Turf Installation', 'Synthetic Grass'],
    avgProjectValue: { min: 10000, max: 50000 },
    visualImpactScore: 5,
    instagramPotential: 'very-high',
    beforeAfterPotential: true,
    description: 'Instant lawn transformations with synthetic turf',
    leadQualityIndicators: ['installation', 'installer', 'synthetic', 'artificial', 'turf']
  },
  {
    name: 'Kitchen Remodeling',
    searchTerms: ['Kitchen Remodeling', 'Kitchen Renovation', 'Kitchen Remodel', 'Kitchen Design', 'Kitchen Contractor'],
    avgProjectValue: { min: 25000, max: 150000 },
    visualImpactScore: 5,
    instagramPotential: 'very-high',
    beforeAfterPotential: true,
    description: 'Complete kitchen transformations and renovations',
    leadQualityIndicators: ['remodel', 'renovation', 'design', 'custom', 'cabinets']
  },
  {
    name: 'Bathroom Remodeling',
    searchTerms: ['Bathroom Remodeling', 'Bathroom Renovation', 'Bathroom Remodel', 'Bath Remodel', 'Bathroom Contractor'],
    avgProjectValue: { min: 15000, max: 75000 },
    visualImpactScore: 5,
    instagramPotential: 'very-high',
    beforeAfterPotential: true,
    description: 'Luxury bathroom transformations and spa-like renovations',
    leadQualityIndicators: ['remodel', 'renovation', 'luxury', 'custom', 'design']
  },
  {
    name: 'Exterior Contractors',
    searchTerms: ['Exterior Contractor', 'Siding Contractor', 'Exterior Remodeling', 'Home Exterior', 'Siding Installation'],
    avgProjectValue: { min: 20000, max: 100000 },
    visualImpactScore: 5,
    instagramPotential: 'high',
    beforeAfterPotential: true,
    description: 'Complete exterior home transformations including siding',
    leadQualityIndicators: ['siding', 'exterior', 'installation', 'contractor', 'remodel']
  },
  {
    name: 'Deck Builders',
    searchTerms: ['Deck Builder', 'Deck Contractor', 'Outdoor Living', 'Deck Construction', 'Patio Builder'],
    avgProjectValue: { min: 15000, max: 80000 },
    visualImpactScore: 5,
    instagramPotential: 'very-high',
    beforeAfterPotential: true,
    description: 'Outdoor living spaces and deck construction',
    leadQualityIndicators: ['deck', 'patio', 'outdoor', 'construction', 'builder']
  },
  
  // SECONDARY - Still high-ticket with good visuals
  {
    name: 'Painting Companies',
    searchTerms: ['Painting Contractor', 'Commercial Painting', 'House Painting', 'Exterior Painting', 'Interior Painting'],
    avgProjectValue: { min: 5000, max: 50000 },
    visualImpactScore: 4,
    instagramPotential: 'high',
    beforeAfterPotential: true,
    description: 'Commercial and large residential painting projects',
    leadQualityIndicators: ['commercial', 'contractor', 'exterior', 'interior', 'company']
  },
  {
    name: 'Concrete Contractors',
    searchTerms: ['Concrete Contractor', 'Stamped Concrete', 'Decorative Concrete', 'Concrete Patio', 'Concrete Driveway'],
    avgProjectValue: { min: 10000, max: 40000 },
    visualImpactScore: 4,
    instagramPotential: 'high',
    beforeAfterPotential: true,
    description: 'Decorative concrete, driveways, and hardscaping',
    leadQualityIndicators: ['stamped', 'decorative', 'patio', 'driveway', 'contractor']
  },
  {
    name: 'Hardscape Contractors',
    searchTerms: ['Hardscape Contractor', 'Hardscaping', 'Paver Installation', 'Paver Patio', 'Retaining Wall'],
    avgProjectValue: { min: 15000, max: 60000 },
    visualImpactScore: 5,
    instagramPotential: 'very-high',
    beforeAfterPotential: true,
    description: 'Hardscaping with pavers, walls, and outdoor features',
    leadQualityIndicators: ['hardscape', 'paver', 'patio', 'retaining wall', 'installation']
  },
  {
    name: 'Fencing Contractors',
    searchTerms: ['Fence Contractor', 'Fence Company', 'Commercial Fencing', 'Fence Installation', 'Custom Fencing'],
    avgProjectValue: { min: 10000, max: 50000 },
    visualImpactScore: 3,
    instagramPotential: 'medium',
    beforeAfterPotential: true,
    description: 'High-end and commercial fencing installations',
    leadQualityIndicators: ['commercial', 'custom', 'installation', 'contractor', 'company']
  },
  {
    name: 'Landscaping Design',
    searchTerms: ['Landscape Designer', 'Landscape Architect', 'Landscape Design', 'Landscaping Company', 'Landscape Contractor'],
    avgProjectValue: { min: 10000, max: 100000 },
    visualImpactScore: 5,
    instagramPotential: 'very-high',
    beforeAfterPotential: true,
    description: 'Full landscape design and installation projects',
    leadQualityIndicators: ['design', 'architect', 'custom', 'installation', 'company']
  },
  {
    name: 'Window & Door',
    searchTerms: ['Window Replacement', 'Window Contractor', 'Door Installation', 'Window and Door', 'Window Company'],
    avgProjectValue: { min: 15000, max: 50000 },
    visualImpactScore: 4,
    instagramPotential: 'medium',
    beforeAfterPotential: true,
    description: 'Whole home window and door replacement',
    leadQualityIndicators: ['replacement', 'installation', 'contractor', 'company', 'custom']
  },
  {
    name: 'Roofing Contractors',
    searchTerms: ['Roofing Contractor', 'Roof Replacement', 'Roofing Company', 'Commercial Roofing', 'Residential Roofing'],
    avgProjectValue: { min: 15000, max: 40000 },
    visualImpactScore: 3,
    instagramPotential: 'medium',
    beforeAfterPotential: true,
    description: 'Full roof replacements and major repairs',
    leadQualityIndicators: ['replacement', 'contractor', 'commercial', 'company', 'installation']
  },
  
  // ADDITIONAL HIGH-TICKET OPPORTUNITIES
  {
    name: 'Solar Installers',
    searchTerms: ['Solar Installation', 'Solar Installer', 'Solar Panel', 'Solar Contractor', 'Solar Company'],
    avgProjectValue: { min: 20000, max: 60000 },
    visualImpactScore: 3,
    instagramPotential: 'medium',
    beforeAfterPotential: true,
    description: 'Residential and commercial solar installations',
    leadQualityIndicators: ['installation', 'installer', 'panel', 'contractor', 'system']
  },
  {
    name: 'Home Addition',
    searchTerms: ['Home Addition', 'Room Addition', 'ADU Builder', 'Addition Contractor', 'Home Extension'],
    avgProjectValue: { min: 50000, max: 300000 },
    visualImpactScore: 5,
    instagramPotential: 'high',
    beforeAfterPotential: true,
    description: 'Major home additions and ADU construction',
    leadQualityIndicators: ['addition', 'ADU', 'construction', 'builder', 'contractor']
  },
  {
    name: 'Epoxy Flooring',
    searchTerms: ['Epoxy Flooring', 'Epoxy Floor', 'Garage Floor Coating', 'Polished Concrete', 'Industrial Flooring'],
    avgProjectValue: { min: 10000, max: 30000 },
    visualImpactScore: 4,
    instagramPotential: 'high',
    beforeAfterPotential: true,
    description: 'Decorative epoxy and polished concrete flooring',
    leadQualityIndicators: ['epoxy', 'coating', 'polished', 'industrial', 'garage']
  },
  {
    name: 'Smart Home',
    searchTerms: ['Smart Home Installation', 'Home Automation', 'Smart Home Installer', 'Home Technology', 'Home Theater'],
    avgProjectValue: { min: 10000, max: 50000 },
    visualImpactScore: 3,
    instagramPotential: 'medium',
    beforeAfterPotential: false,
    description: 'Smart home and automation system installation',
    leadQualityIndicators: ['smart', 'automation', 'installation', 'technology', 'system']
  },
  {
    name: 'Whole Home Remodel',
    searchTerms: ['General Contractor', 'Home Remodeling', 'Whole House Remodel', 'Home Renovation', 'Remodeling Contractor'],
    avgProjectValue: { min: 100000, max: 500000 },
    visualImpactScore: 5,
    instagramPotential: 'very-high',
    beforeAfterPotential: true,
    description: 'Complete home renovations and major remodeling',
    leadQualityIndicators: ['general contractor', 'remodel', 'renovation', 'whole house', 'custom']
  },
  {
    name: 'Outdoor Kitchen',
    searchTerms: ['Outdoor Kitchen', 'Outdoor Kitchen Builder', 'Outdoor Living Contractor', 'BBQ Island', 'Outdoor Cooking'],
    avgProjectValue: { min: 20000, max: 75000 },
    visualImpactScore: 5,
    instagramPotential: 'very-high',
    beforeAfterPotential: true,
    description: 'Luxury outdoor kitchen and entertainment areas',
    leadQualityIndicators: ['outdoor kitchen', 'builder', 'custom', 'installation', 'contractor']
  },
  {
    name: 'Pergola & Gazebo',
    searchTerms: ['Pergola Builder', 'Gazebo Contractor', 'Shade Structure', 'Patio Cover', 'Outdoor Structure'],
    avgProjectValue: { min: 8000, max: 30000 },
    visualImpactScore: 4,
    instagramPotential: 'high',
    beforeAfterPotential: true,
    description: 'Custom pergolas, gazebos, and shade structures',
    leadQualityIndicators: ['pergola', 'gazebo', 'builder', 'custom', 'installation']
  }
];

// Helper function to get services by minimum project value
export function getServicesByMinValue(minValue: number): HighTicketService[] {
  return HIGH_TICKET_SERVICES.filter(service => service.avgProjectValue.min >= minValue);
}

// Helper function to get services by visual impact
export function getServicesByVisualImpact(minScore: 1 | 2 | 3 | 4 | 5): HighTicketService[] {
  return HIGH_TICKET_SERVICES.filter(service => service.visualImpactScore >= minScore);
}

// Helper function to get Instagram-worthy services
export function getInstagramWorthyServices(): HighTicketService[] {
  return HIGH_TICKET_SERVICES.filter(service => 
    service.instagramPotential === 'high' || service.instagramPotential === 'very-high'
  );
}

// Get prioritized list for a specific market
export function getPrioritizedHighTicketServices(searchedTypes: string[]): HighTicketService[] {
  return HIGH_TICKET_SERVICES
    .map(service => ({
      ...service,
      priority: calculateServicePriority(service, searchedTypes)
    }))
    .sort((a, b) => b.priority - a.priority);
}

function calculateServicePriority(service: HighTicketService, searchedTypes: string[]): number {
  let priority = 0;
  
  // Base score from project value (0-40 points)
  const avgValue = (service.avgProjectValue.min + service.avgProjectValue.max) / 2;
  priority += Math.min(40, avgValue / 2500);
  
  // Visual impact bonus (0-25 points)
  priority += service.visualImpactScore * 5;
  
  // Instagram potential bonus (0-20 points)
  const instagramBonus = {
    'low': 0,
    'medium': 5,
    'high': 15,
    'very-high': 20
  };
  priority += instagramBonus[service.instagramPotential];
  
  // Unsearched bonus (0-15 points)
  const isSearched = searchedTypes.some(type => 
    service.searchTerms.some(term => 
      term.toLowerCase().includes(type.toLowerCase()) || 
      type.toLowerCase().includes(term.toLowerCase())
    )
  );
  if (!isSearched) {
    priority += 15;
  }
  
  return Math.round(priority);
}