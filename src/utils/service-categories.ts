// Service type categorization for organizing similar services

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  services: string[];
  keywords: string[];
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'home-services',
    name: 'Home Services',
    icon: '🏠',
    services: [
      // HVAC & Climate
      'HVAC Services', 'Air Conditioning', 'Heating Services',
      // Plumbing & Water
      'Plumbing', 'Water Heater Services', 'Septic Services',
      // Electrical
      'Electrical Services', 'Solar Installation',
      // Exterior
      'Roofing', 'Siding', 'Gutters', 'Window Services', 'Door Services',
      'Garage Door Services', 'Fencing', 'Deck & Patio',
      // Landscaping & Outdoor
      'Landscaping', 'Tree Services', 'Pool Services', 'Irrigation',
      // Interior
      'Painting', 'Flooring', 'Kitchen Remodeling', 'Bathroom Remodeling',
      'General Remodeling', 'Cabinet Services', 'Countertop Services',
      // Cleaning & Maintenance
      'Cleaning Services', 'Pressure Washing', 'Carpet Cleaning',
      'Window Cleaning', 'Junk Removal',
      // Construction
      'General Contractor', 'Home Builder', 'Construction Services', 'Concrete Services',
      'Masonry', 'Concrete & Masonry', 'Drywall', 'Insulation', 'Remodeling',
      // Other Home Services
      'Handyman Services', 'Pest Control', 'Home Security',
      'Appliance Repair', 'Locksmith', 'Moving Services',
      'Home Inspection', 'Waterproofing', 'Chimney Services',
      'Restoration Services', 'Fire & Water Damage Restoration',
      'Mold Remediation', 'Foundation Repair', 'Basement Waterproofing',
      'Gutter Cleaning', 'Power Washing', 'Demolition Services',
      'Excavation Services', 'Grading Services', 'Paving Services',
      'Asphalt Services', 'Seal Coating', 'Striping Services',
      'Home Maintenance', 'Property Maintenance', 'Facilities Maintenance',
      'Building Maintenance', 'Janitorial Services', 'Commercial Cleaning',
      'Residential Cleaning', 'Maid Services', 'House Cleaning',
      'Office Cleaning', 'Post Construction Cleaning', 'Move Out Cleaning',
      'Deep Cleaning', 'Spring Cleaning', 'Holiday Decorating',
      'Christmas Light Installation', 'Blind Cleaning', 'Upholstery Cleaning'
    ],
    keywords: ['repair', 'install', 'service', 'maintenance', 'contractor', 'home', 'construction', 'remodel']
  },
  {
    id: 'automotive',
    name: 'Automotive',
    icon: '🚗',
    services: [
      'Auto Repair', 'Auto Detailing', 'Auto Body Shop', 'Auto Glass',
      'Car Dealership', 'Car Wash', 'Window Tinting',
      'Tire Services', 'Oil Change Services', 'Transmission Services',
      'Brake Services', 'Auto Parts', 'Car Rental', 'Towing Services',
      'Mobile Mechanic', 'Auto Electrical', 'Motorcycle Services',
      'RV Services', 'Boat Services', 'Auto Upholstery',
      'Fleet Services', 'Commercial Vehicle Services', 'Truck Repair',
      'Diesel Repair', 'Auto Auction', 'Vehicle Inspection'
    ],
    keywords: ['auto', 'car', 'vehicle', 'automotive', 'mechanic', 'dealer', 'detailing']
  },
  {
    id: 'health-wellness',
    name: 'Health & Wellness',
    icon: '🏥',
    services: [
      'Dentist', 'Doctor', 'Chiropractor', 'Physical Therapy',
      'Mental Health', 'Optometrist', 'Dermatologist', 'Pediatrician',
      'Veterinarian', 'Pharmacy', 'Medical Clinic', 'Urgent Care',
      'Orthodontist', 'Therapist', 'Counseling', 'Psychiatrist'
    ],
    keywords: ['health', 'medical', 'doctor', 'clinic', 'therapy', 'dental']
  },
  {
    id: 'beauty-personal',
    name: 'Beauty & Personal Care',
    icon: '💅',
    services: [
      'Hair Salon', 'Nail Salon', 'Beauty Salon', 'Spa Services', 
      'Barber Shop', 'Massage Therapy', 'Skincare Services', 
      'Makeup Services', 'Lash Services', 'Eyebrow Services',
      'Waxing Services', 'Tanning Services', 'Beauty Supply Store', 
      'Cosmetics Store', 'Aesthetics Services', 'Med Spa', 
      'Tattoo Shop', 'Body Piercing', 'Permanent Makeup',
      'Aesthetics', 'Esthetician', 'Beauty Services', 'Salon Services',
      'Hair Extensions', 'Hair Treatment', 'Microblading', 'Botox Services',
      'Dermal Fillers', 'Laser Hair Removal', 'Body Contouring'
    ],
    keywords: ['beauty', 'salon', 'spa', 'hair', 'nails', 'cosmetic', 'barber', 'lash', 'brow']
  },
  {
    id: 'fitness-sports',
    name: 'Fitness & Sports',
    icon: '🏋️',
    services: [
      'Gym', 'Personal Training', 'Yoga Studio', 'CrossFit',
      'Martial Arts', 'Dance Studio', 'Pilates', 'Boxing',
      'Sports Training', 'Fitness Center', 'Health Club',
      'Recreation Center', 'Swimming', 'Tennis'
    ],
    keywords: ['fitness', 'gym', 'training', 'sports', 'exercise', 'workout']
  },
  {
    id: 'food-beverage',
    name: 'Food & Beverage',
    icon: '🍽️',
    services: [
      'Restaurant', 'Cafe', 'Bakery', 'Bar', 'Food Truck',
      'Catering Services', 'Coffee Shop', 'Pizza Restaurant', 'Fast Food',
      'Fine Dining', 'Brewery', 'Ice Cream Shop', 'Deli',
      'Juice Bar', 'Smoothie Shop', 'Food Delivery', 'Meal Prep',
      'Personal Chef', 'Cooking Classes', 'Wine Bar', 'Sports Bar',
      'Sushi Restaurant', 'Mexican Restaurant', 'Italian Restaurant',
      'Chinese Restaurant', 'Thai Restaurant', 'Indian Restaurant',
      'BBQ Restaurant', 'Seafood Restaurant', 'Vegetarian Restaurant',
      'Food Manufacturing', 'Food Distribution', 'Wholesale Food'
    ],
    keywords: ['food', 'restaurant', 'dining', 'cafe', 'bar', 'catering']
  },
  {
    id: 'professional-services',
    name: 'Professional Services',
    icon: '💼',
    services: [
      'Law Firm', 'Accounting Services', 'Real Estate Agency', 'Insurance Agency',
      'Financial Services', 'Marketing Agency', 'Consulting Services',
      'IT Services', 'Web Design', 'Photography', 'Videography',
      'Graphic Design', 'Interior Design', 'Architecture Services', 
      'Engineering Services', 'Staffing Agency', 'Business Consulting',
      'SEO Services', 'Social Media Marketing', 'Public Relations',
      'Translation Services', 'Notary Services', 'Printing Services',
      'Event Photography', 'Commercial Photography', 'Advertising Agency',
      'Digital Marketing', 'Content Creation', 'Branding Services',
      'Bookkeeping Services', 'Tax Services', 'Payroll Services',
      'HR Services', 'Legal Services', 'Patent Services',
      'Trademark Services', 'Document Services', 'Virtual Assistant',
      'Call Center', 'Answering Service', 'Data Entry Services',
      'Research Services', 'Grant Writing', 'Business Development',
      'Design Agency', 'Creative Agency', 'Media Production', 'Video Production',
      'Animation Services', 'Copywriting Services', 'Content Marketing',
      'Email Marketing', 'Influencer Marketing', 'Brand Strategy',
      'UX Design', 'UI Design', 'Product Design', 'Package Design',
      'Logo Design', 'Brand Identity', 'Marketing Consulting'
    ],
    keywords: ['attorney', 'lawyer', 'accountant', 'agent', 'consultant', 'firm', 'agency', 'design', 'marketing']
  },
  {
    id: 'retail-shopping',
    name: 'Retail & Shopping',
    icon: '🛍️',
    services: [
      'Clothing Store', 'Boutique', 'Jewelry Store', 'Furniture Store',
      'Electronics', 'Grocery Store', 'Department Store', 'Gift Shop',
      'Bookstore', 'Pet Store', 'Sporting Goods', 'Toy Store',
      'Antiques', 'Thrift Store', 'Convenience Store',
      'Jewelry', 'Jeweler', 'Jewelry Repair', 'Custom Jewelry',
      'Watch Repair', 'Pawn Shop', 'Consignment Shop', 'Vintage Store',
      'Shoe Store', 'Accessory Store', 'Home Decor', 'Art Gallery',
      'Craft Store', 'Fabric Store', 'Hardware Store', 'Building Supplies',
      'Garden Center', 'Nursery', 'Flower Shop', 'Florist', 'Party Supply Store'
    ],
    keywords: ['store', 'shop', 'retail', 'boutique', 'market', 'mall']
  },
  {
    id: 'education-childcare',
    name: 'Education & Childcare',
    icon: '📚',
    services: [
      'School', 'Daycare', 'Preschool', 'Tutoring', 'College',
      'University', 'Trade School', 'Language School', 'Music Lessons',
      'Art Classes', 'Summer Camp', 'After School Program',
      'Educational Services', 'Training Center'
    ],
    keywords: ['school', 'education', 'learning', 'childcare', 'daycare', 'tutor']
  },
  {
    id: 'events-entertainment',
    name: 'Events & Entertainment',
    icon: '🎉',
    services: [
      'Event Planning', 'Wedding Planning', 'Wedding Venue', 'DJ Services', 
      'Party Rental', 'Entertainment Services', 'Concert Venue', 'Theater', 
      'Museum', 'Amusement Park', 'Bowling Alley', 'Casino', 'Night Club',
      'Event Space', 'Banquet Hall', 'Conference Center', 'Convention Center',
      'Photo Booth Rental', 'Equipment Rental', 'Audio Visual Services',
      'Stage Rental', 'Lighting Services', 'Sound Services', 'MC Services',
      'Live Music', 'Band Services', 'Karaoke Services', 'Magic Shows',
      'Face Painting', 'Balloon Artists', 'Caricature Artists'
    ],
    keywords: ['event', 'party', 'wedding', 'entertainment', 'venue', 'rental']
  },
  {
    id: 'travel-hospitality',
    name: 'Travel & Hospitality',
    icon: '✈️',
    services: [
      'Hotel', 'Motel', 'Travel Agency', 'Tour Operator',
      'Vacation Rental', 'Bed & Breakfast', 'Resort', 'Hostel',
      'Airport Shuttle', 'Travel Services', 'Tourism'
    ],
    keywords: ['hotel', 'travel', 'lodging', 'tourism', 'vacation', 'resort']
  },
  {
    id: 'pet-services',
    name: 'Pet Services',
    icon: '🐾',
    services: [
      'Pet Grooming', 'Dog Training', 'Pet Boarding', 'Pet Sitting',
      'Dog Walking', 'Pet Store', 'Animal Hospital', 'Veterinary Services',
      'Pet Daycare', 'Pet Photography', 'Pet Transportation',
      'Animal Services', 'Dog Grooming', 'Cat Grooming', 'Mobile Pet Grooming',
      'Pet Supplies', 'Pet Food Store', 'Aquarium Services', 'Pet Adoption',
      'Animal Rescue', 'Pet Cemetery', 'Pet Cremation', 'Horse Boarding',
      'Equestrian Services', 'Animal Training', 'Pet Hotel'
    ],
    keywords: ['pet', 'dog', 'cat', 'animal', 'grooming', 'veterinary', 'vet']
  },
  {
    id: 'real-estate-property',
    name: 'Real Estate & Property',
    icon: '🏘️',
    services: [
      'Property Management', 'Real Estate Agency', 'Real Estate Investment',
      'Home Staging', 'Real Estate Photography', 'Rental Services',
      'Commercial Real Estate', 'Real Estate Development'
    ],
    keywords: ['property', 'real estate', 'rental', 'management', 'realtor']
  },
  {
    id: 'manufacturing-industrial',
    name: 'Manufacturing & Industrial',
    icon: '🏭',
    services: [
      'Manufacturing Services', 'Welding Services', 'Machine Shop',
      'Metal Fabrication', 'Industrial Services', 'Equipment Rental',
      'Industrial Supply', 'Packaging Services', 'Logistics Services',
      'Warehouse Services', 'Distribution Services'
    ],
    keywords: ['manufacturing', 'industrial', 'welding', 'fabrication', 'machine', 'equipment']
  },
  {
    id: 'personal-services',
    name: 'Personal Services',
    icon: '👤',
    services: [
      'Personal Training', 'Life Coaching', 'Career Coaching',
      'Personal Shopping', 'Personal Assistant', 'Concierge Services',
      'Dating Services', 'Matchmaking', 'Image Consulting',
      'Organizing Services', 'Decluttering Services', 'Wardrobe Styling',
      'Nutrition Coaching', 'Wellness Coaching', 'Meditation Services',
      'Hypnotherapy', 'Acupuncture', 'Alternative Medicine'
    ],
    keywords: ['personal', 'coaching', 'assistant', 'concierge', 'organizing']
  },
  {
    id: 'technology-services',
    name: 'Technology Services',
    icon: '💻',
    services: [
      'Computer Repair', 'Phone Repair', 'Data Recovery', 'IT Support',
      'Network Services', 'Cybersecurity', 'Cloud Services', 'Software Development',
      'App Development', 'Game Development', 'Tech Support', 'Computer Training',
      'Electronics Repair', 'Smart Home Installation', 'Security System Installation',
      'Audio Video Installation', 'Satellite Installation', 'Internet Services'
    ],
    keywords: ['tech', 'computer', 'it', 'software', 'network', 'repair', 'development']
  },
  {
    id: 'environmental-services',
    name: 'Environmental Services',
    icon: '🌱',
    services: [
      'Recycling Services', 'Waste Management', 'Hazardous Waste Disposal',
      'Environmental Consulting', 'Environmental Testing', 'Air Quality Testing',
      'Water Testing', 'Soil Testing', 'Environmental Remediation',
      'Green Energy Consulting', 'Sustainability Consulting', 'LEED Consulting',
      'Solar Panel Cleaning', 'Wind Energy Services', 'Energy Auditing'
    ],
    keywords: ['environmental', 'recycling', 'waste', 'green', 'sustainable', 'energy']
  },
  {
    id: 'transportation-logistics',
    name: 'Transportation & Logistics',
    icon: '🚚',
    services: [
      'Trucking Services', 'Freight Services', 'Shipping Services',
      'Courier Services', 'Delivery Services', 'Taxi Services',
      'Limousine Services', 'Charter Bus', 'School Bus Services',
      'Medical Transportation', 'Airport Transportation', 'Ride Share',
      'Vehicle Transport', 'Boat Transport', 'RV Transport',
      'Storage Services', 'Self Storage', 'Document Storage',
      'Vehicle Storage', 'Boat Storage', 'RV Storage'
    ],
    keywords: ['transport', 'shipping', 'delivery', 'logistics', 'storage', 'freight']
  },
  {
    id: 'community-services',
    name: 'Community Services',
    icon: '🤝',
    services: [
      'Non Profit Organization', 'Charity', 'Community Center',
      'Youth Organization', 'Senior Center', 'Food Bank',
      'Homeless Shelter', 'Animal Shelter', 'Religious Organization',
      'Church', 'Mosque', 'Temple', 'Synagogue', 'Meditation Center',
      'Community Garden', 'Co-op', 'Social Services', 'Counseling Center',
      'Rehabilitation Center', 'Support Groups', 'Crisis Center'
    ],
    keywords: ['community', 'nonprofit', 'charity', 'religious', 'social', 'church']
  },
  {
    id: 'government-public',
    name: 'Government & Public Services',
    icon: '🏛️',
    services: [
      'Government Office', 'City Hall', 'Court House', 'Police Station',
      'Fire Department', 'Library', 'Post Office', 'DMV',
      'Public Works', 'Parks Department', 'Recreation Department',
      'Public Transportation', 'Public Utilities', 'Water Department',
      'Electric Department', 'Gas Department', 'Sanitation Department'
    ],
    keywords: ['government', 'public', 'municipal', 'city', 'county', 'state']
  },
  {
    id: 'agriculture-farming',
    name: 'Agriculture & Farming',
    icon: '🌾',
    services: [
      'Farm', 'Ranch', 'Dairy Farm', 'Poultry Farm', 'Livestock',
      'Agricultural Services', 'Farm Equipment', 'Feed Store',
      'Grain Elevator', 'Agricultural Supply', 'Irrigation Services',
      'Crop Dusting', 'Farm Management', 'Agricultural Consulting',
      'Organic Farming', 'Hydroponics', 'Greenhouse Services',
      'Farmers Market', 'Farm Stand', 'U-Pick Farm'
    ],
    keywords: ['farm', 'agriculture', 'ranch', 'livestock', 'crop', 'agricultural']
  },
];

// Get category for a service type
export function getCategoryForService(serviceType: string | null | undefined): ServiceCategory | null {
  if (!serviceType) return null;
  
  const normalizedInput = serviceType.trim();
  const normalizedLower = normalizedInput.toLowerCase();
  
  // First, check exact matches (case-insensitive)
  for (const category of SERVICE_CATEGORIES) {
    if (category.services.some(service => 
      service.toLowerCase() === normalizedLower || 
      service === normalizedInput // Also check exact case match
    )) {
      return category;
    }
  }
  
  // Check if the input matches the start of any service
  for (const category of SERVICE_CATEGORIES) {
    if (category.services.some(service => 
      service.toLowerCase().startsWith(normalizedLower) ||
      normalizedLower.startsWith(service.toLowerCase())
    )) {
      return category;
    }
  }
  
  // Then check if service type contains any category keywords
  for (const category of SERVICE_CATEGORIES) {
    if (category.keywords.some(keyword => 
      normalizedLower.includes(keyword.toLowerCase())
    )) {
      return category;
    }
  }
  
  // Check if any service in category is contained in the service type
  for (const category of SERVICE_CATEGORIES) {
    if (category.services.some(service => {
      const serviceLower = service.toLowerCase();
      // Check for word boundaries to avoid false matches
      const serviceWords = serviceLower.split(/\s+/);
      const inputWords = normalizedLower.split(/\s+/);
      
      // Check if all words from service appear in input
      return serviceWords.every(word => 
        inputWords.some(inputWord => inputWord.includes(word))
      );
    })) {
      return category;
    }
  }
  
  // Default to Professional Services if no match found
  // This ensures EVERY service has a category
  return SERVICE_CATEGORIES.find(c => c.id === 'professional-services') || SERVICE_CATEGORIES[0];
}

// Get all unique service types from leads grouped by category
export function groupServicesByCategory(serviceTypes: string[]): Map<ServiceCategory, string[]> {
  const grouped = new Map<ServiceCategory, string[]>();
  
  // Initialize all categories
  SERVICE_CATEGORIES.forEach(category => {
    grouped.set(category, []);
  });
  
  // Group service types
  serviceTypes.forEach(serviceType => {
    const category = getCategoryForService(serviceType);
    if (category) {
      const services = grouped.get(category) || [];
      services.push(serviceType);
      grouped.set(category, services);
    }
  });
  
  // Remove empty categories
  Array.from(grouped.entries()).forEach(([category, services]) => {
    if (services.length === 0) {
      grouped.delete(category);
    }
  });
  
  return grouped;
}