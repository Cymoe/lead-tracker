/**
 * NAICS Code to Grey Tsunami Business Type Mapping System
 * 
 * This module provides a comprehensive mapping between North American Industry 
 * Classification System (NAICS) codes and our Grey Tsunami business categories.
 * 
 * NAICS Structure:
 * - 2-digit: Sector (e.g., 23 = Construction)
 * - 3-digit: Subsector (e.g., 236 = Construction of Buildings)
 * - 4-digit: Industry Group (e.g., 2361 = Residential Building Construction)
 * - 5-digit: NAICS Industry (e.g., 23611 = Residential Building Construction)
 * - 6-digit: National Industry (e.g., 236118 = Residential Remodelers)
 * 
 * For Census API queries, we typically use 2-6 digit codes depending on granularity needed.
 */

import { GREY_TSUNAMI_CATEGORIES, BusinessCategory } from './grey-tsunami-business-types';

/**
 * NAICS code mapping structure
 */
export interface NAICSMapping {
  naicsCode: string;
  description: string;
  greyTsunamiBusinessTypes: string[];
  tier: string;
  category: string;
}

/**
 * Grouped NAICS codes for efficient API queries
 * Using 2-4 digit codes for broader industry coverage
 */
export interface NAICSGroup {
  groupName: string;
  codes: string[];
  description: string;
}

/**
 * Core NAICS mappings for Grey Tsunami business types
 * Organized by major NAICS sectors
 */
export const NAICS_MAPPINGS: NAICSMapping[] = [
  // CONSTRUCTION (23xxxx)
  {
    naicsCode: '2361',
    description: 'Residential Building Construction',
    greyTsunamiBusinessTypes: [
      'Room Additions',
      'Whole House Remodeling',
      'Home Remodeling'
    ],
    tier: 'TIER 3',
    category: 'Home Improvement & Remodeling'
  },
  {
    naicsCode: '2362',
    description: 'Nonresidential Building Construction',
    greyTsunamiBusinessTypes: [
      'Commercial Construction',
      'Building Maintenance'
    ],
    tier: 'TIER 2',
    category: 'Property & Facility Services'
  },
  {
    naicsCode: '2371',
    description: 'Utility System Construction',
    greyTsunamiBusinessTypes: [
      'Septic Tank Services',
      'Well Drilling & Pump Services',
      'Sewer Line Repair'
    ],
    tier: 'TIER 1',
    category: 'Essential Home Services'
  },
  {
    naicsCode: '2381',
    description: 'Foundation, Structure, and Building Exterior Contractors',
    greyTsunamiBusinessTypes: [
      'Roofing & Siding',
      'Foundation Repair',
      'Waterproofing Services',
      'Masonry & Brickwork',
      'Stucco Application',
      'Siding Installation'
    ],
    tier: 'TIER 1',
    category: 'Essential Home Services'
  },
  {
    naicsCode: '2382',
    description: 'Building Equipment Contractors',
    greyTsunamiBusinessTypes: [
      'HVAC Services',
      'Plumbing Services',
      'Electrical Services',
      'Generator Installation & Service',
      'Solar Panel Installation',
      'Boiler Services',
      'Furnace Repair & Installation'
    ],
    tier: 'TIER 1',
    category: 'Essential Home Services'
  },
  {
    naicsCode: '2383',
    description: 'Building Finishing Contractors',
    greyTsunamiBusinessTypes: [
      'Drywall Installation',
      'Insulation Services',
      'Flooring Installation',
      'Tile Installation',
      'Carpet Installation',
      'Cabinet Installation'
    ],
    tier: 'TIER 3',
    category: 'Home Improvement & Remodeling'
  },
  {
    naicsCode: '2389',
    description: 'Other Specialty Trade Contractors',
    greyTsunamiBusinessTypes: [
      'Concrete Services',
      'Fence Installation & Repair',
      'Deck Building & Repair',
      'Swimming Pool Construction'
    ],
    tier: 'TIER 3',
    category: 'Home Improvement & Remodeling'
  },

  // MANUFACTURING (31-33xxxx)
  {
    naicsCode: '3212',
    description: 'Veneer, Plywood, and Engineered Wood Product Manufacturing',
    greyTsunamiBusinessTypes: [
      'Cabinet Making',
      'Custom Millwork'
    ],
    tier: 'TIER 18',
    category: 'Specialized Manufacturing'
  },
  {
    naicsCode: '3219',
    description: 'Other Wood Product Manufacturing',
    greyTsunamiBusinessTypes: [
      'Custom Furniture Manufacturing',
      'Pallet Manufacturing'
    ],
    tier: 'TIER 18',
    category: 'Specialized Manufacturing'
  },
  {
    naicsCode: '3231',
    description: 'Printing and Related Support Activities',
    greyTsunamiBusinessTypes: [
      'Commercial Print Shops',
      'Business Forms Printing',
      'Label Printing'
    ],
    tier: 'TIER 6',
    category: 'B2B Professional Services'
  },
  {
    naicsCode: '3271',
    description: 'Clay Product and Refractory Manufacturing',
    greyTsunamiBusinessTypes: [
      'Brick Manufacturing',
      'Tile Manufacturing'
    ],
    tier: 'TIER 18',
    category: 'Specialized Manufacturing'
  },
  {
    naicsCode: '3273',
    description: 'Cement and Concrete Product Manufacturing',
    greyTsunamiBusinessTypes: [
      'Precast Concrete Manufacturing',
      'Concrete Block Manufacturing'
    ],
    tier: 'TIER 18',
    category: 'Specialized Manufacturing'
  },
  {
    naicsCode: '3323',
    description: 'Architectural and Structural Metals Manufacturing',
    greyTsunamiBusinessTypes: [
      'Metal Fabrication',
      'Ornamental Iron Work',
      'Custom Metalwork'
    ],
    tier: 'TIER 9',
    category: 'Manufacturing & Industrial'
  },
  {
    naicsCode: '3328',
    description: 'Coating, Engraving, Heat Treating, and Allied Activities',
    greyTsunamiBusinessTypes: [
      'Powder Coating',
      'Electroplating Services',
      'Anodizing Services',
      'Heat Treating Services'
    ],
    tier: 'TIER 9',
    category: 'Manufacturing & Industrial'
  },
  {
    naicsCode: '3331',
    description: 'Agriculture, Construction, and Mining Machinery Manufacturing',
    greyTsunamiBusinessTypes: [
      'Farm Equipment Manufacturing',
      'Construction Equipment Manufacturing'
    ],
    tier: 'TIER 9',
    category: 'Manufacturing & Industrial'
  },
  {
    naicsCode: '3339',
    description: 'Other General Purpose Machinery Manufacturing',
    greyTsunamiBusinessTypes: [
      'Welding Equipment Manufacturing',
      'Industrial Equipment Manufacturing'
    ],
    tier: 'TIER 9',
    category: 'Manufacturing & Industrial'
  },
  {
    naicsCode: '3399',
    description: 'Other Miscellaneous Manufacturing',
    greyTsunamiBusinessTypes: [
      'Sign Manufacturing',
      'Trophy & Award Manufacturing',
      'Promotional Products'
    ],
    tier: 'TIER 18',
    category: 'Specialized Manufacturing'
  },

  // WHOLESALE TRADE (42xxxx)
  {
    naicsCode: '4233',
    description: 'Lumber and Other Construction Materials Merchant Wholesalers',
    greyTsunamiBusinessTypes: [
      'Building Materials Distribution',
      'Lumber Yard'
    ],
    tier: 'TIER 16',
    category: 'Distribution & Wholesale'
  },
  {
    naicsCode: '4235',
    description: 'Metal and Mineral (except Petroleum) Merchant Wholesalers',
    greyTsunamiBusinessTypes: [
      'Metal Distribution',
      'Steel Service Centers'
    ],
    tier: 'TIER 16',
    category: 'Distribution & Wholesale'
  },
  {
    naicsCode: '4236',
    description: 'Household Appliances and Electrical and Electronic Goods Merchant Wholesalers',
    greyTsunamiBusinessTypes: [
      'Electrical Supply Wholesale',
      'HVAC Parts Distribution'
    ],
    tier: 'TIER 16',
    category: 'Distribution & Wholesale'
  },
  {
    naicsCode: '4237',
    description: 'Hardware, and Plumbing and Heating Equipment and Supplies Merchant Wholesalers',
    greyTsunamiBusinessTypes: [
      'Plumbing Supply Distribution',
      'Hardware Distribution'
    ],
    tier: 'TIER 16',
    category: 'Distribution & Wholesale'
  },
  {
    naicsCode: '4238',
    description: 'Machinery, Equipment, and Supplies Merchant Wholesalers',
    greyTsunamiBusinessTypes: [
      'Industrial Supply Distribution',
      'Safety Equipment Distribution'
    ],
    tier: 'TIER 16',
    category: 'Distribution & Wholesale'
  },
  {
    naicsCode: '4242',
    description: 'Drugs and Druggists\' Sundries Merchant Wholesalers',
    greyTsunamiBusinessTypes: [
      'Medical Supply Distribution',
      'Pharmaceutical Distribution'
    ],
    tier: 'TIER 16',
    category: 'Distribution & Wholesale'
  },
  {
    naicsCode: '4244',
    description: 'Grocery and Related Product Merchant Wholesalers',
    greyTsunamiBusinessTypes: [
      'Food Distribution',
      'Wholesale Food Supply'
    ],
    tier: 'TIER 12',
    category: 'Food & Hospitality'
  },
  {
    naicsCode: '4246',
    description: 'Chemical and Allied Products Merchant Wholesalers',
    greyTsunamiBusinessTypes: [
      'Chemical Distribution',
      'Janitorial Supply Distribution'
    ],
    tier: 'TIER 16',
    category: 'Distribution & Wholesale'
  },

  // RETAIL TRADE (44-45xxxx)
  {
    naicsCode: '4413',
    description: 'Automotive Parts, Accessories, and Tire Stores',
    greyTsunamiBusinessTypes: [
      'Auto Parts Store',
      'Tire Shops'
    ],
    tier: 'TIER 4',
    category: 'Automotive & Transportation'
  },
  {
    naicsCode: '4451',
    description: 'Grocery Stores',
    greyTsunamiBusinessTypes: [
      'Convenience Stores',
      'Specialty Food Stores'
    ],
    tier: 'TIER 8',
    category: 'Specialty Retail & Services'
  },
  {
    naicsCode: '4453',
    description: 'Beer, Wine, and Liquor Stores',
    greyTsunamiBusinessTypes: [
      'Liquor Stores'
    ],
    tier: 'TIER 8',
    category: 'Specialty Retail & Services'
  },
  {
    naicsCode: '4461',
    description: 'Health and Personal Care Stores',
    greyTsunamiBusinessTypes: [
      'Pharmacy (Independent)',
      'Medical Equipment Supply'
    ],
    tier: 'TIER 5',
    category: 'Healthcare & Professional Practices'
  },
  {
    naicsCode: '4481',
    description: 'Clothing Stores',
    greyTsunamiBusinessTypes: [
      'Uniform/Embroidery Services'
    ],
    tier: 'TIER 8',
    category: 'Specialty Retail & Services'
  },
  {
    naicsCode: '4531',
    description: 'Florists',
    greyTsunamiBusinessTypes: [
      'Florists'
    ],
    tier: 'TIER 8',
    category: 'Specialty Retail & Services'
  },

  // TRANSPORTATION AND WAREHOUSING (48-49xxxx)
  {
    naicsCode: '4841',
    description: 'General Freight Trucking',
    greyTsunamiBusinessTypes: [
      'Trucking Companies (Local)',
      'Hot Shot Trucking'
    ],
    tier: 'TIER 17',
    category: 'Transportation & Logistics'
  },
  {
    naicsCode: '4842',
    description: 'Specialized Freight Trucking',
    greyTsunamiBusinessTypes: [
      'Specialized Transport (Oversized)',
      'Auto Transport Services',
      'Boat Transport Services'
    ],
    tier: 'TIER 17',
    category: 'Transportation & Logistics'
  },
  {
    naicsCode: '4853',
    description: 'Taxi and Limousine Service',
    greyTsunamiBusinessTypes: [
      'Taxi Services',
      'Limousine Services'
    ],
    tier: 'TIER 17',
    category: 'Transportation & Logistics'
  },
  {
    naicsCode: '4854',
    description: 'School and Employee Bus Transportation',
    greyTsunamiBusinessTypes: [
      'School Bus Services',
      'Charter Bus Services'
    ],
    tier: 'TIER 17',
    category: 'Transportation & Logistics'
  },
  {
    naicsCode: '4855',
    description: 'Charter Bus Industry',
    greyTsunamiBusinessTypes: [
      'Charter Bus Services',
      'Tour Bus Services'
    ],
    tier: 'TIER 17',
    category: 'Transportation & Logistics'
  },
  {
    naicsCode: '4859',
    description: 'Other Transit and Ground Passenger Transportation',
    greyTsunamiBusinessTypes: [
      'Medical Transport (Non-Emergency)',
      'Airport Shuttle Services'
    ],
    tier: 'TIER 17',
    category: 'Transportation & Logistics'
  },
  {
    naicsCode: '4885',
    description: 'Freight Transportation Arrangement',
    greyTsunamiBusinessTypes: [
      'Freight Brokerage',
      'Logistics Consulting'
    ],
    tier: 'TIER 17',
    category: 'Transportation & Logistics'
  },
  {
    naicsCode: '4921',
    description: 'Couriers and Express Delivery Services',
    greyTsunamiBusinessTypes: [
      'Courier Services',
      'Last Mile Delivery'
    ],
    tier: 'TIER 17',
    category: 'Transportation & Logistics'
  },
  {
    naicsCode: '4931',
    description: 'Warehousing and Storage',
    greyTsunamiBusinessTypes: [
      'Self-Storage Facilities',
      'Moving & Storage'
    ],
    tier: 'TIER 7',
    category: 'Boring But Profitable'
  },

  // PROFESSIONAL, SCIENTIFIC, AND TECHNICAL SERVICES (54xxxx)
  {
    naicsCode: '5411',
    description: 'Legal Services',
    greyTsunamiBusinessTypes: [
      'Legal Services',
      'Process Serving'
    ],
    tier: 'TIER 6',
    category: 'B2B Professional Services'
  },
  {
    naicsCode: '5412',
    description: 'Accounting, Tax Preparation, Bookkeeping, and Payroll Services',
    greyTsunamiBusinessTypes: [
      'Accounting Firms',
      'Bookkeeping Services',
      'Payroll Services'
    ],
    tier: 'TIER 6',
    category: 'B2B Professional Services'
  },
  {
    naicsCode: '5413',
    description: 'Architectural, Engineering, and Related Services',
    greyTsunamiBusinessTypes: [
      'Engineering Services',
      'Surveying Services'
    ],
    tier: 'TIER 6',
    category: 'B2B Professional Services'
  },
  {
    naicsCode: '5414',
    description: 'Specialized Design Services',
    greyTsunamiBusinessTypes: [
      'Interior Design',
      'Graphic Design'
    ],
    tier: 'TIER 6',
    category: 'B2B Professional Services'
  },
  {
    naicsCode: '5415',
    description: 'Computer Systems Design and Related Services',
    greyTsunamiBusinessTypes: [
      'IT Services/MSP',
      'Software Development'
    ],
    tier: 'TIER 6',
    category: 'B2B Professional Services'
  },
  {
    naicsCode: '5416',
    description: 'Management, Scientific, and Technical Consulting Services',
    greyTsunamiBusinessTypes: [
      'Business Consulting',
      'HR Consulting',
      'Environmental Consulting'
    ],
    tier: 'TIER 6',
    category: 'B2B Professional Services'
  },
  {
    naicsCode: '5418',
    description: 'Advertising, Public Relations, and Related Services',
    greyTsunamiBusinessTypes: [
      'Marketing Agencies',
      'Advertising Services'
    ],
    tier: 'TIER 6',
    category: 'B2B Professional Services'
  },
  {
    naicsCode: '5419',
    description: 'Other Professional, Scientific, and Technical Services',
    greyTsunamiBusinessTypes: [
      'Translation Services',
      'Photography Services',
      'Veterinary Services'
    ],
    tier: 'TIER 5',
    category: 'Healthcare & Professional Practices'
  },

  // ADMINISTRATIVE AND SUPPORT SERVICES (56xxxx)
  {
    naicsCode: '5613',
    description: 'Employment Services',
    greyTsunamiBusinessTypes: [
      'Staffing Agencies',
      'Temp Agencies'
    ],
    tier: 'TIER 6',
    category: 'B2B Professional Services'
  },
  {
    naicsCode: '5614',
    description: 'Business Support Services',
    greyTsunamiBusinessTypes: [
      'Document Shredding Services',
      'Business Service Centers'
    ],
    tier: 'TIER 6',
    category: 'B2B Professional Services'
  },
  {
    naicsCode: '5615',
    description: 'Travel Arrangement and Reservation Services',
    greyTsunamiBusinessTypes: [
      'Travel Agencies',
      'Tour Operators'
    ],
    tier: 'TIER 6',
    category: 'B2B Professional Services'
  },
  {
    naicsCode: '5616',
    description: 'Investigation and Security Services',
    greyTsunamiBusinessTypes: [
      'Private Investigation',
      'Security Services'
    ],
    tier: 'TIER 6',
    category: 'B2B Professional Services'
  },
  {
    naicsCode: '5617',
    description: 'Services to Buildings and Dwellings',
    greyTsunamiBusinessTypes: [
      'Pest Control',
      'Janitorial Services',
      'Landscaping/Lawn Care',
      'Carpet Cleaning Services'
    ],
    tier: 'TIER 1',
    category: 'Essential Home Services'
  },
  {
    naicsCode: '5619',
    description: 'Other Support Services',
    greyTsunamiBusinessTypes: [
      'Convention Services',
      'Packaging Services'
    ],
    tier: 'TIER 6',
    category: 'B2B Professional Services'
  },
  {
    naicsCode: '5621',
    description: 'Waste Collection',
    greyTsunamiBusinessTypes: [
      'Waste Management',
      'Dumpster Rental Services'
    ],
    tier: 'TIER 2',
    category: 'Property & Facility Services'
  },
  {
    naicsCode: '5622',
    description: 'Waste Treatment and Disposal',
    greyTsunamiBusinessTypes: [
      'Medical Waste Disposal',
      'Hazardous Waste Disposal'
    ],
    tier: 'TIER 14',
    category: 'Specialized Cleaning & Restoration'
  },
  {
    naicsCode: '5629',
    description: 'Remediation and Other Waste Management Services',
    greyTsunamiBusinessTypes: [
      'Mold Remediation',
      'Asbestos Abatement',
      'Environmental Cleanup'
    ],
    tier: 'TIER 1',
    category: 'Essential Home Services'
  },

  // EDUCATIONAL SERVICES (61xxxx)
  {
    naicsCode: '6111',
    description: 'Elementary and Secondary Schools',
    greyTsunamiBusinessTypes: [
      'Private Schools',
      'Charter Schools'
    ],
    tier: 'TIER 11',
    category: 'Personal & Pet Services'
  },
  {
    naicsCode: '6114',
    description: 'Business Schools and Computer and Management Training',
    greyTsunamiBusinessTypes: [
      'Business Training',
      'Computer Training'
    ],
    tier: 'TIER 11',
    category: 'Personal & Pet Services'
  },
  {
    naicsCode: '6115',
    description: 'Technical and Trade Schools',
    greyTsunamiBusinessTypes: [
      'Trade Schools',
      'Vocational Training'
    ],
    tier: 'TIER 11',
    category: 'Personal & Pet Services'
  },
  {
    naicsCode: '6116',
    description: 'Other Schools and Instruction',
    greyTsunamiBusinessTypes: [
      'Driving Schools',
      'Music Lessons (In-Home)',
      'Tutoring Services'
    ],
    tier: 'TIER 11',
    category: 'Personal & Pet Services'
  },
  {
    naicsCode: '6117',
    description: 'Educational Support Services',
    greyTsunamiBusinessTypes: [
      'Test Prep Services',
      'College Prep Services'
    ],
    tier: 'TIER 11',
    category: 'Personal & Pet Services'
  },

  // HEALTH CARE AND SOCIAL ASSISTANCE (62xxxx)
  {
    naicsCode: '6211',
    description: 'Offices of Physicians',
    greyTsunamiBusinessTypes: [
      'Medical Practices',
      'Specialty Clinics'
    ],
    tier: 'TIER 5',
    category: 'Healthcare & Professional Practices'
  },
  {
    naicsCode: '6212',
    description: 'Offices of Dentists',
    greyTsunamiBusinessTypes: [
      'Dental Practices'
    ],
    tier: 'TIER 5',
    category: 'Healthcare & Professional Practices'
  },
  {
    naicsCode: '6213',
    description: 'Offices of Other Health Practitioners',
    greyTsunamiBusinessTypes: [
      'Chiropractic Offices',
      'Optometry Practices',
      'Podiatry Practices'
    ],
    tier: 'TIER 5',
    category: 'Healthcare & Professional Practices'
  },
  {
    naicsCode: '6214',
    description: 'Outpatient Care Centers',
    greyTsunamiBusinessTypes: [
      'Urgent Care Centers',
      'Dialysis Centers'
    ],
    tier: 'TIER 5',
    category: 'Healthcare & Professional Practices'
  },
  {
    naicsCode: '6215',
    description: 'Medical and Diagnostic Laboratories',
    greyTsunamiBusinessTypes: [
      'Medical Labs',
      'Dental Labs'
    ],
    tier: 'TIER 5',
    category: 'Healthcare & Professional Practices'
  },
  {
    naicsCode: '6216',
    description: 'Home Health Care Services',
    greyTsunamiBusinessTypes: [
      'Home Healthcare Agencies',
      'Home Companion Services'
    ],
    tier: 'TIER 5',
    category: 'Healthcare & Professional Practices'
  },
  {
    naicsCode: '6219',
    description: 'Other Ambulatory Health Care Services',
    greyTsunamiBusinessTypes: [
      'Medical Transport (Non-Emergency)',
      'Blood Banks'
    ],
    tier: 'TIER 5',
    category: 'Healthcare & Professional Practices'
  },
  {
    naicsCode: '6231',
    description: 'Nursing Care Facilities (Skilled Nursing Facilities)',
    greyTsunamiBusinessTypes: [
      'Senior Living Management',
      'Nursing Homes'
    ],
    tier: 'TIER 2',
    category: 'Property & Facility Services'
  },
  {
    naicsCode: '6233',
    description: 'Continuing Care Retirement Communities and Assisted Living Facilities',
    greyTsunamiBusinessTypes: [
      'Assisted Living',
      'Senior Care Services'
    ],
    tier: 'TIER 11',
    category: 'Personal & Pet Services'
  },
  {
    naicsCode: '6241',
    description: 'Individual and Family Services',
    greyTsunamiBusinessTypes: [
      'Senior Care Services',
      'Family Services'
    ],
    tier: 'TIER 11',
    category: 'Personal & Pet Services'
  },
  {
    naicsCode: '6244',
    description: 'Child Day Care Services',
    greyTsunamiBusinessTypes: [
      'Daycare Centers',
      'Child Care Services'
    ],
    tier: 'TIER 11',
    category: 'Personal & Pet Services'
  },

  // ARTS, ENTERTAINMENT, AND RECREATION (71xxxx)
  {
    naicsCode: '7113',
    description: 'Promoters of Performing Arts, Sports, and Similar Events',
    greyTsunamiBusinessTypes: [
      'Event Planning Services',
      'Concert Promoters'
    ],
    tier: 'TIER 11',
    category: 'Personal & Pet Services'
  },
  {
    naicsCode: '7121',
    description: 'Museums, Historical Sites, and Similar Institutions',
    greyTsunamiBusinessTypes: [
      'Museums',
      'Historical Sites'
    ],
    tier: 'TIER 11',
    category: 'Personal & Pet Services'
  },
  {
    naicsCode: '7131',
    description: 'Amusement Parks and Arcades',
    greyTsunamiBusinessTypes: [
      'Amusement Parks',
      'Arcades'
    ],
    tier: 'TIER 11',
    category: 'Personal & Pet Services'
  },
  {
    naicsCode: '7132',
    description: 'Gambling Industries',
    greyTsunamiBusinessTypes: [
      'Casinos',
      'Gaming'
    ],
    tier: 'TIER 11',
    category: 'Personal & Pet Services'
  },
  {
    naicsCode: '7139',
    description: 'Other Amusement and Recreation Industries',
    greyTsunamiBusinessTypes: [
      'Golf Courses',
      'Marinas',
      'Bowling Alleys'
    ],
    tier: 'TIER 19',
    category: 'Marine & Recreational Services'
  },

  // ACCOMMODATION AND FOOD SERVICES (72xxxx)
  {
    naicsCode: '7211',
    description: 'Traveler Accommodation',
    greyTsunamiBusinessTypes: [
      'Small Motels/Inns',
      'Bed and Breakfasts'
    ],
    tier: 'TIER 12',
    category: 'Food & Hospitality'
  },
  {
    naicsCode: '7212',
    description: 'RV (Recreational Vehicle) Parks and Recreational Camps',
    greyTsunamiBusinessTypes: [
      'RV Parks/Campgrounds',
      'RV Park Management'
    ],
    tier: 'TIER 7',
    category: 'Boring But Profitable'
  },
  {
    naicsCode: '7213',
    description: 'Rooming and Boarding Houses',
    greyTsunamiBusinessTypes: [
      'Boarding Houses',
      'Student Housing Management'
    ],
    tier: 'TIER 2',
    category: 'Property & Facility Services'
  },
  {
    naicsCode: '7223',
    description: 'Special Food Services',
    greyTsunamiBusinessTypes: [
      'Catering Services',
      'Food Trucks/Mobile Food'
    ],
    tier: 'TIER 12',
    category: 'Food & Hospitality'
  },
  {
    naicsCode: '7224',
    description: 'Drinking Places (Alcoholic Beverages)',
    greyTsunamiBusinessTypes: [
      'Bars',
      'Taverns'
    ],
    tier: 'TIER 12',
    category: 'Food & Hospitality'
  },
  {
    naicsCode: '7225',
    description: 'Restaurants and Other Eating Places',
    greyTsunamiBusinessTypes: [
      'Established Restaurants',
      'Pizza Shops',
      'Coffee Shops (established)'
    ],
    tier: 'TIER 12',
    category: 'Food & Hospitality'
  },

  // OTHER SERVICES (81xxxx)
  {
    naicsCode: '8111',
    description: 'Automotive Repair and Maintenance',
    greyTsunamiBusinessTypes: [
      'Auto Repair Shops',
      'Transmission Repair',
      'Oil Change/Quick Lube',
      'Brake Repair Specialists'
    ],
    tier: 'TIER 4',
    category: 'Automotive & Transportation'
  },
  {
    naicsCode: '8112',
    description: 'Electronic and Precision Equipment Repair and Maintenance',
    greyTsunamiBusinessTypes: [
      'Electronic Repair',
      'Computer Repair'
    ],
    tier: 'TIER 4',
    category: 'Automotive & Transportation'
  },
  {
    naicsCode: '8113',
    description: 'Commercial and Industrial Machinery and Equipment Repair',
    greyTsunamiBusinessTypes: [
      'Industrial Equipment Repair',
      'Machine Shops'
    ],
    tier: 'TIER 9',
    category: 'Manufacturing & Industrial'
  },
  {
    naicsCode: '8114',
    description: 'Personal and Household Goods Repair and Maintenance',
    greyTsunamiBusinessTypes: [
      'Appliance Repair',
      'Furniture Repair',
      'Shoe Repair'
    ],
    tier: 'TIER 8',
    category: 'Specialty Retail & Services'
  },
  {
    naicsCode: '8121',
    description: 'Personal Care Services',
    greyTsunamiBusinessTypes: [
      'Hair Salons',
      'Nail Salons',
      'Massage Therapy'
    ],
    tier: 'TIER 11',
    category: 'Personal & Pet Services'
  },
  {
    naicsCode: '8122',
    description: 'Death Care Services',
    greyTsunamiBusinessTypes: [
      'Funeral Homes',
      'Cemeteries'
    ],
    tier: 'TIER 8',
    category: 'Specialty Retail & Services'
  },
  {
    naicsCode: '8123',
    description: 'Drycleaning and Laundry Services',
    greyTsunamiBusinessTypes: [
      'Dry Cleaners',
      'Laundromats'
    ],
    tier: 'TIER 7',
    category: 'Boring But Profitable'
  },
  {
    naicsCode: '8129',
    description: 'Other Personal Services',
    greyTsunamiBusinessTypes: [
      'Pet Grooming',
      'Pet Sitting Services',
      'Dog Walking Services'
    ],
    tier: 'TIER 11',
    category: 'Personal & Pet Services'
  },
  {
    naicsCode: '8131',
    description: 'Religious Organizations',
    greyTsunamiBusinessTypes: [
      'Churches',
      'Religious Organizations'
    ],
    tier: 'TIER 2',
    category: 'Property & Facility Services'
  },
  {
    naicsCode: '8134',
    description: 'Civic and Social Organizations',
    greyTsunamiBusinessTypes: [
      'Social Clubs',
      'Community Organizations'
    ],
    tier: 'TIER 2',
    category: 'Property & Facility Services'
  },
  {
    naicsCode: '8141',
    description: 'Private Households',
    greyTsunamiBusinessTypes: [
      'House Sitting Services',
      'Personal Chef Services'
    ],
    tier: 'TIER 11',
    category: 'Personal & Pet Services'
  }
];

/**
 * Grouped NAICS codes for efficient Census API queries
 * These use broader 2-4 digit codes to capture entire industries
 */
export const NAICS_GROUPS: NAICSGroup[] = [
  {
    groupName: 'construction',
    codes: ['23', '236', '237', '238'],
    description: 'All construction including residential, commercial, and specialty trades'
  },
  {
    groupName: 'home_services',
    codes: ['2381', '2382', '2383', '2389', '5617', '5629'],
    description: 'Essential home services including HVAC, plumbing, electrical, pest control'
  },
  {
    groupName: 'healthcare',
    codes: ['621', '622', '623', '6241', '6244'],
    description: 'Healthcare practices, hospitals, senior care, and social assistance'
  },
  {
    groupName: 'professional_services',
    codes: ['541', '5411', '5412', '5413', '5414', '5415', '5416', '5418'],
    description: 'Professional, scientific, and technical services'
  },
  {
    groupName: 'automotive',
    codes: ['4413', '8111', '336', '3363'],
    description: 'Automotive repair, parts, and related services'
  },
  {
    groupName: 'manufacturing',
    codes: ['31', '32', '33', '332', '333'],
    description: 'All manufacturing including metals, machinery, and products'
  },
  {
    groupName: 'wholesale_distribution',
    codes: ['423', '424', '4233', '4235', '4236', '4237', '4238'],
    description: 'Wholesale trade and distribution'
  },
  {
    groupName: 'transportation_logistics',
    codes: ['484', '485', '488', '492', '493'],
    description: 'Transportation, warehousing, and logistics'
  },
  {
    groupName: 'retail_services',
    codes: ['44', '45', '441', '445', '446', '453'],
    description: 'Retail trade and specialty retail services'
  },
  {
    groupName: 'food_hospitality',
    codes: ['721', '722', '7223', '7224', '7225'],
    description: 'Restaurants, catering, hotels, and food services'
  },
  {
    groupName: 'property_services',
    codes: ['531', '5311', '5312', '5313', '5617', '5621'],
    description: 'Property management, real estate, and facility services'
  },
  {
    groupName: 'personal_services',
    codes: ['812', '8121', '8123', '8129', '6116', '6117'],
    description: 'Personal care, pet services, education, and training'
  },
  {
    groupName: 'boring_profitable',
    codes: ['4931', '5311', '5312', '7212', '8123'],
    description: 'Self-storage, laundromats, car washes, and similar businesses'
  },
  {
    groupName: 'agricultural_rural',
    codes: ['111', '112', '115', '4245', '5191'],
    description: 'Agriculture, farming support, and rural services'
  },
  {
    groupName: 'marine_recreational',
    codes: ['7131', '7132', '7139', '4872', '336612'],
    description: 'Marinas, recreational services, and marine-related businesses'
  }
];

/**
 * Helper function to get NAICS codes for a specific Grey Tsunami business type
 * @param businessType The Grey Tsunami business type
 * @returns Array of relevant NAICS codes
 */
export function getNAICSCodesForBusinessType(businessType: string): string[] {
  const codes: string[] = [];
  
  NAICS_MAPPINGS.forEach(mapping => {
    if (mapping.greyTsunamiBusinessTypes.some(
      type => type.toLowerCase() === businessType.toLowerCase()
    )) {
      codes.push(mapping.naicsCode);
    }
  });
  
  return codes;
}

/**
 * Helper function to get Grey Tsunami business types for a NAICS code
 * @param naicsCode The NAICS code (can be 2-6 digits)
 * @returns Array of Grey Tsunami business types
 */
export function getBusinessTypesForNAICS(naicsCode: string): string[] {
  const businessTypes: string[] = [];
  
  NAICS_MAPPINGS.forEach(mapping => {
    // Check if the mapping's NAICS code starts with the provided code
    // This allows for matching broader codes (e.g., '23' matches all '23xxx' codes)
    if (mapping.naicsCode.startsWith(naicsCode)) {
      businessTypes.push(...mapping.greyTsunamiBusinessTypes);
    }
  });
  
  // Remove duplicates
  return [...new Set(businessTypes)];
}

/**
 * Get NAICS group codes for efficient Census API queries
 * @param category Grey Tsunami category name
 * @returns Array of NAICS codes to query
 */
export function getNAICSGroupForCategory(category: string): string[] {
  const categoryLower = category.toLowerCase();
  
  // Map categories to appropriate NAICS groups
  const categoryToGroup: { [key: string]: string[] } = {
    'essential home services': ['home_services', 'construction'],
    'property & facility services': ['property_services', 'construction'],
    'home improvement & remodeling': ['construction', 'retail_services'],
    'automotive & transportation': ['automotive', 'transportation_logistics'],
    'healthcare & professional practices': ['healthcare'],
    'b2b professional services': ['professional_services', 'wholesale_distribution'],
    'boring but profitable': ['boring_profitable'],
    'specialty retail & services': ['retail_services', 'personal_services'],
    'manufacturing & industrial': ['manufacturing'],
    'specialty home services': ['home_services', 'construction'],
    'personal & pet services': ['personal_services'],
    'food & hospitality': ['food_hospitality'],
    'seasonal & specialty outdoor': ['home_services', 'construction'],
    'specialized cleaning & restoration': ['home_services', 'property_services'],
    'specialty installation & repair': ['construction', 'home_services'],
    'distribution & wholesale': ['wholesale_distribution'],
    'transportation & logistics': ['transportation_logistics'],
    'specialized manufacturing': ['manufacturing'],
    'marine & recreational services': ['marine_recreational'],
    'agricultural & rural services': ['agricultural_rural']
  };
  
  const groupNames = categoryToGroup[categoryLower] || ['professional_services'];
  const codes: string[] = [];
  
  groupNames.forEach(groupName => {
    const group = NAICS_GROUPS.find(g => g.groupName === groupName);
    if (group) {
      codes.push(...group.codes);
    }
  });
  
  return codes;
}

/**
 * Get the most specific NAICS codes for Census API queries
 * Returns an optimized list of codes that balance specificity with query efficiency
 * @param businessTypes Array of Grey Tsunami business types
 * @returns Array of NAICS codes optimized for API queries
 */
export function getOptimizedNAICSCodes(businessTypes: string[]): string[] {
  const codeSet = new Set<string>();
  
  businessTypes.forEach(businessType => {
    const codes = getNAICSCodesForBusinessType(businessType);
    codes.forEach(code => {
      // Add the specific code
      codeSet.add(code);
      
      // Also add broader codes for fallback
      if (code.length >= 4) {
        codeSet.add(code.substring(0, 3)); // 3-digit subsector
      }
      if (code.length >= 3) {
        codeSet.add(code.substring(0, 2)); // 2-digit sector
      }
    });
  });
  
  // Convert to array and sort by specificity (longer codes first)
  return Array.from(codeSet).sort((a, b) => b.length - a.length);
}

/**
 * Calculate the density of Grey Tsunami businesses in a given NAICS industry
 * Higher density indicates more acquisition opportunities
 * @param naicsCode The NAICS code to analyze
 * @returns Density score from 0-10
 */
export function calculateGreyTsunamiDensity(naicsCode: string): number {
  const businessTypes = getBusinessTypesForNAICS(naicsCode);
  const totalBusinessTypes = GREY_TSUNAMI_CATEGORIES.reduce(
    (sum, cat) => sum + cat.businesses.length,
    0
  );
  
  // Calculate density as percentage of Grey Tsunami businesses in this NAICS
  const density = (businessTypes.length / totalBusinessTypes) * 100;
  
  // Convert to 0-10 scale
  return Math.min(10, Math.round(density));
}

/**
 * Get recommended NAICS codes for market analysis based on business category
 * Returns codes in priority order for Census API queries
 * @param category Grey Tsunami category
 * @returns Prioritized array of NAICS codes
 */
export function getMarketAnalysisNAICSCodes(category: BusinessCategory): string[] {
  const codes: string[] = [];
  
  // Get all NAICS codes for businesses in this category
  category.businesses.forEach(businessType => {
    const businessCodes = getNAICSCodesForBusinessType(businessType);
    codes.push(...businessCodes);
  });
  
  // Remove duplicates and sort by frequency
  const codeFrequency = new Map<string, number>();
  codes.forEach(code => {
    codeFrequency.set(code, (codeFrequency.get(code) || 0) + 1);
  });
  
  // Sort by frequency (most common first) then by specificity
  return Array.from(codeFrequency.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]; // Sort by frequency
      return b[0].length - a[0].length; // Then by specificity
    })
    .map(entry => entry[0]);
}

/**
 * Validate if a NAICS code is relevant for Grey Tsunami analysis
 * @param naicsCode The NAICS code to validate
 * @returns Boolean indicating if the code is relevant
 */
export function isGreyTsunamiRelevantNAICS(naicsCode: string): boolean {
  return getBusinessTypesForNAICS(naicsCode).length > 0;
}

/**
 * Get a human-readable description for a NAICS code
 * @param naicsCode The NAICS code
 * @returns Description string
 */
export function getNAICSDescription(naicsCode: string): string {
  const mapping = NAICS_MAPPINGS.find(m => m.naicsCode === naicsCode);
  if (mapping) return mapping.description;
  
  // Check if it's a broader code that matches multiple mappings
  const partialMatches = NAICS_MAPPINGS.filter(m => m.naicsCode.startsWith(naicsCode));
  if (partialMatches.length > 0) {
    return `${partialMatches[0].description} (and related)`;
  }
  
  // Check NAICS groups
  const group = NAICS_GROUPS.find(g => g.codes.includes(naicsCode));
  if (group) return group.description;
  
  return 'Unknown NAICS code';
}

/**
 * Export all NAICS codes used in the system for reference
 */
export const ALL_NAICS_CODES = Array.from(
  new Set(NAICS_MAPPINGS.map(m => m.naicsCode))
).sort();

/**
 * Export mapping of NAICS sectors to general descriptions
 */
export const NAICS_SECTORS: { [key: string]: string } = {
  '11': 'Agriculture, Forestry, Fishing and Hunting',
  '21': 'Mining, Quarrying, and Oil and Gas Extraction',
  '22': 'Utilities',
  '23': 'Construction',
  '31-33': 'Manufacturing',
  '42': 'Wholesale Trade',
  '44-45': 'Retail Trade',
  '48-49': 'Transportation and Warehousing',
  '51': 'Information',
  '52': 'Finance and Insurance',
  '53': 'Real Estate and Rental and Leasing',
  '54': 'Professional, Scientific, and Technical Services',
  '55': 'Management of Companies and Enterprises',
  '56': 'Administrative and Support and Waste Management and Remediation Services',
  '61': 'Educational Services',
  '62': 'Health Care and Social Assistance',
  '71': 'Arts, Entertainment, and Recreation',
  '72': 'Accommodation and Food Services',
  '81': 'Other Services (except Public Administration)',
  '92': 'Public Administration'
};