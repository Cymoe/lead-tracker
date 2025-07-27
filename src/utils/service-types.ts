export interface ServiceCategory {
  category: string;
  services: string[];
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    category: "Home Construction & Remodeling",
    services: [
      "General Contractor",
      "Kitchen Remodeling",
      "Bathroom Remodeling",
      "Home Additions",
      "Basement Finishing",
      "Drywall Installation",
      "Flooring Installation",
      "Tile Installation",
      "Cabinet Installation",
      "Countertop Installation",
      "Deck Building",
      "Patio Construction"
    ]
  },
  {
    category: "Home Exterior",
    services: [
      "Roofing",
      "Siding Installation",
      "Window Installation",
      "Door Installation",
      "Gutter Installation",
      "Pressure Washing",
      "Exterior Painting",
      "Stucco Repair",
      "Masonry",
      "Chimney Repair"
    ]
  },
  {
    category: "Property Maintenance",
    services: [
      "Landscaping",
      "Lawn Care",
      "Tree Service",
      "Turf Installation",
      "Irrigation System",
      "Snow Removal",
      "Pool Service",
      "Pool Installation",
      "Fence Installation",
      "Concrete Work",
      "Asphalt Paving",
      "Seal Coating"
    ]
  },
  {
    category: "Home Systems",
    services: [
      "HVAC Service",
      "Plumbing",
      "Electrical",
      "Solar Panel Installation",
      "Generator Installation",
      "Water Heater Service",
      "Septic Service",
      "Well Drilling",
      "Security System Installation",
      "Home Automation"
    ]
  },
  {
    category: "Cleaning & Maintenance",
    services: [
      "House Cleaning",
      "Commercial Cleaning",
      "Carpet Cleaning",
      "Window Cleaning",
      "Air Duct Cleaning",
      "Chimney Cleaning",
      "Junk Removal",
      "Organizing Services"
    ]
  },
  {
    category: "Pest & Wildlife",
    services: [
      "Pest Control",
      "Termite Control",
      "Wildlife Removal",
      "Bee Removal",
      "Mosquito Control",
      "Rodent Control"
    ]
  },
  {
    category: "Auto Services",
    services: [
      "Auto Repair",
      "Auto Body Shop",
      "Auto Detailing",
      "Oil Change",
      "Tire Service",
      "Auto Glass Repair",
      "Mobile Mechanic",
      "Towing Service",
      "Auto Electrical",
      "Transmission Repair"
    ]
  },
  {
    category: "Moving & Storage",
    services: [
      "Moving Company",
      "Storage Units",
      "Packing Services",
      "Piano Moving",
      "Junk Hauling"
    ]
  },
  {
    category: "Home Services",
    services: [
      "Appliance Repair",
      "Furniture Assembly",
      "Handyman Services",
      "Locksmith",
      "Garage Door Repair",
      "Glass Repair",
      "Blind Installation",
      "Closet Organization",
      "Home Inspection"
    ]
  },
  {
    category: "Business Services",
    services: [
      "Commercial HVAC",
      "Commercial Plumbing",
      "Commercial Electrical",
      "Commercial Roofing",
      "Commercial Landscaping",
      "Commercial Cleaning",
      "Commercial Painting",
      "Commercial Security"
    ]
  },
  {
    category: "Specialty Services",
    services: [
      "Epoxy Flooring",
      "Waterproofing",
      "Foundation Repair",
      "Mold Remediation",
      "Fire Damage Restoration",
      "Water Damage Restoration",
      "Radon Mitigation",
      "Insulation Installation",
      "Soundproofing"
    ]
  }
];

// Flatten all services for easy searching
export const ALL_SERVICE_TYPES: string[] = [
  ...SERVICE_CATEGORIES.flatMap(cat => cat.services),
  // Keep the original common ones at the top
  "Turf",
  "Painting",
  "Remodeling",
  "Landscaping",
  "Roofing",
  "Plumbing",
  "Electrical",
  "HVAC",
  "Concrete",
  "Fencing",
  "Pool Service",
  "Pest Control",
  "Cleaning Service",
  "Tree Service"
].filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

// Get services by category
export function getServicesByCategory(category: string): string[] {
  const cat = SERVICE_CATEGORIES.find(c => c.category === category);
  return cat ? cat.services : [];
}

// Search services
export function searchServices(query: string): string[] {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return [];
  
  return ALL_SERVICE_TYPES.filter(service => 
    service.toLowerCase().includes(searchTerm)
  ).sort((a, b) => {
    // Prioritize exact matches and starts with
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();
    
    if (aLower === searchTerm) return -1;
    if (bLower === searchTerm) return 1;
    
    if (aLower.startsWith(searchTerm) && !bLower.startsWith(searchTerm)) return -1;
    if (!aLower.startsWith(searchTerm) && bLower.startsWith(searchTerm)) return 1;
    
    return a.localeCompare(b);
  });
}