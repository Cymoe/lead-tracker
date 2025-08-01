import { z } from 'zod';

export const FacebookAdSchema = z.object({
  company_name: z.string().describe("Actual company name (NOT page name). For 'Certified VooltPro Contractors', extract the real company name from ad text"),
  library_id: z.string().optional().describe("Facebook Ad Library ID number (first one if multiple ads)"),
  status: z.enum(['Active', 'Inactive']).optional().describe("Current ad status"),
  start_date: z.string().optional().describe("Date when ad started running"),
  active_time: z.string().optional().describe("Total active time duration"),
  platforms: z.array(z.string()).optional().describe("Platforms where ad runs (Facebook, Instagram, etc)"),
  categories: z.array(z.string()).optional().describe("Ad categories like 'Home & garden'"),
  ad_copy: z.string().optional().describe("Main advertising text content"),
  call_to_action: z.string().optional().describe("CTA button text like 'Get a Free Quote'"),
  website: z.string().optional().describe("Website URL mentioned in the ad"),
  phone: z.string().optional().describe("Phone number if mentioned in ad"),
  email: z.string().optional().describe("Email address if mentioned in ad"),
  service_type: z.string().optional().describe("Type of service advertised (e.g., Turf Installation, Pool Service)"),
  city: z.string().optional().describe("City mentioned in ad or company location"),
  price_info: z.string().optional().describe("Any pricing information mentioned")
});

export const FacebookAdsExtractionSchema = z.object({
  ads: z.array(FacebookAdSchema).min(1).describe("All UNIQUE companies found. If a company has multiple ads, combine into ONE entry. Extract: Green Forever Arizona, Innovative Custom Pools, Turf Cowboys AZ, HP Turf Solutions, West Valley Desert Landscaping"),
  total_found: z.number().describe("Total number of unique companies extracted (should be 5 for this data)")
});

export type FacebookAd = z.infer<typeof FacebookAdSchema>;
export type FacebookAdsExtraction = z.infer<typeof FacebookAdsExtractionSchema>;