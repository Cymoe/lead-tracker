// Acquisition Outreach Script Generator
// Creates personalized outreach templates based on market data and industry

import { CountyMarketMetrics } from '@/services/county-data-aggregator';
import { MARKET_CONSTANTS } from '@/config/market-constants';

export interface OutreachScript {
  subject: string;
  body: string;
  tone: 'professional' | 'friendly' | 'urgent';
  channel: 'email' | 'linkedin' | 'phone' | 'letter';
}

// Industry-specific pain points and value propositions
const industryPainPoints: { [key: string]: string[] } = {
  'HVAC Services': [
    'finding skilled technicians',
    'managing seasonal demand fluctuations',
    'keeping up with new technology and regulations'
  ],
  'Plumbing Services': [
    'emergency call management',
    'supply chain disruptions',
    'competition from national chains'
  ],
  'Auto Repair': [
    'EV transition challenges',
    'finding certified mechanics',
    'equipment upgrade costs'
  ],
  'Manufacturing': [
    'automation investments',
    'workforce succession planning',
    'supply chain complexity'
  ],
  'Landscaping': [
    'seasonal workforce management',
    'equipment maintenance costs',
    'weather dependency'
  ],
  'Construction': [
    'project pipeline volatility',
    'subcontractor management',
    'regulatory compliance'
  ],
  'Retail Trade': [
    'e-commerce competition',
    'inventory management',
    'changing consumer habits'
  ],
  'Food Service': [
    'labor shortages',
    'rising food costs',
    'delivery platform fees'
  ]
};

// Calculate seller motivation level
export function calculateSellerMotivation(county: CountyMarketMetrics): {
  level: 'high' | 'medium' | 'low';
  factors: string[];
} {
  const factors: string[] = [];
  let score = 0;

  // Age factor
  if (county.demographics.medianAge > 42) {
    factors.push('aging business owner demographic');
    score += 3;
  }

  // Boomer likelihood
  if (county.boomerLikelihood && county.boomerLikelihood.percentage > 0.45) {
    factors.push('high concentration of boomer-owned businesses');
    score += 3;
  }

  // Market classification
  if (county.marketClassification === 'tertiary') {
    factors.push('limited buyer competition in tertiary market');
    score += 2;
  }

  // Business size
  if (county.businessMetrics.avgBusinessSize < 20) {
    factors.push('smaller businesses often lack succession plans');
    score += 2;
  }

  const level = score >= 7 ? 'high' : score >= 4 ? 'medium' : 'low';
  
  return { level, factors };
}

// Generate personalized outreach scripts
export function generateOutreachScripts(
  county: CountyMarketMetrics,
  industry: string,
  companyName?: string
): OutreachScript[] {
  const motivation = calculateSellerMotivation(county);
  const painPoints = industryPainPoints[industry] || ['business growth challenges'];
  const scripts: OutreachScript[] = [];

  // Email Script - Professional
  scripts.push({
    subject: `Succession Planning Options for ${industry} Businesses in ${county.countyName}`,
    body: `Dear ${companyName ? companyName + ' Owner' : industry + ' Business Owner'},

I hope this message finds you well. I'm reaching out to established ${industry.toLowerCase()} businesses in ${county.countyName} County regarding succession planning opportunities.

${motivation.level === 'high' ? 
`Given ${county.countyName}'s ${motivation.factors[0]}, many business owners are exploring their options for transitioning ownership while preserving their legacy.` :
`As the business landscape evolves, many owners are considering their long-term plans and exit strategies.`}

We specialize in helping ${industry.toLowerCase()} business owners:
• Maximize business value through strategic positioning
• Find qualified buyers who understand your industry
• Navigate the transition smoothly while protecting employees
• ${painPoints[0] ? `Address ongoing challenges like ${painPoints[0]}` : 'Overcome industry-specific challenges'}

With ${county.businessMetrics.boomerOwnedEstimate.toLocaleString()} businesses potentially owned by those nearing retirement in your county, now is an ideal time to explore your options.

Would you be open to a brief, confidential conversation about your business goals? Even if you're not ready to sell today, understanding your options can help with long-term planning.

Best regards,
[Your Name]
[Your Company]
[Contact Information]

P.S. We've successfully helped [X] ${industry.toLowerCase()} businesses in ${county.state} transition to new ownership while achieving above-market valuations.`,
    tone: 'professional',
    channel: 'email'
  });

  // LinkedIn Script - Friendly
  scripts.push({
    subject: `Connecting with ${industry} Leaders in ${county.countyName}`,
    body: `Hi ${companyName ? companyName + ' Team' : 'there'},

I've been impressed by the thriving ${industry.toLowerCase()} community in ${county.countyName}! ${motivation.level === 'high' ? 
`With ${(county.boomerLikelihood?.percentage || county.businessMetrics.boomerOwnershipPercentage * 100).toFixed(0)}% of local businesses potentially owned by those approaching retirement, it's an interesting time for the industry.` :
`The local business community continues to evolve with new opportunities emerging.`}

I work with business owners who are thinking about their next chapter - whether that's:
✓ Retiring while ensuring their legacy continues
✓ Partnering with someone to handle day-to-day operations
✓ Exploring acquisition opportunities to grow

${painPoints[0] ? `I know ${painPoints[0]} is a common challenge in your industry. ` : ''}Have you given any thought to your long-term business plans?

Happy to share insights about what we're seeing in the ${county.state} market if helpful!

Best,
[Your Name]`,
    tone: 'friendly',
    channel: 'linkedin'
  });

  // Phone Script - Urgent (for high motivation markets)
  if (motivation.level === 'high') {
    scripts.push({
      subject: 'Phone Outreach Script',
      body: `Hello, is this the owner of ${companyName || '[Business Name]'}?

Hi [Owner Name], I'm [Your Name] with [Your Company]. I'm calling established ${industry.toLowerCase()} businesses in ${county.countyName} County about a time-sensitive opportunity.

We're seeing unprecedented buyer interest in ${industry.toLowerCase()} businesses in ${county.marketClassification} markets like yours. ${motivation.factors[0] ? `With ${motivation.factors[0]}, many owners are taking advantage of current valuations.` : ''}

The reason for my call is that we have qualified buyers specifically looking for ${industry.toLowerCase()} businesses in ${county.countyName}. 

Do you have 5 minutes to discuss what we're seeing in the market? Even if you're not looking to sell immediately, this information could be valuable for your planning.

[If Yes]: Great! First, how long have you owned the business?
[If No]: I understand. Would it be better if I sent you some market data via email? What's the best address to reach you?

Key Points to Cover:
• Current market multiples for ${industry}
• Buyer demand in ${county.marketClassification} markets
• Timeline typically 90-120 days
• Confidential process to protect the business`,
      tone: 'urgent',
      channel: 'phone'
    });
  }

  // Direct Mail Script
  scripts.push({
    subject: 'Direct Mail Template',
    body: `[Your Company Letterhead]

${companyName || '[Business Name]'}
[Address]
${county.countyName}, ${county.state}

Dear Business Owner,

**Is Your ${industry} Business Ready for Its Next Chapter?**

As a successful ${industry.toLowerCase()} business owner in ${county.countyName} County, you've built something valuable. ${motivation.level === 'high' ? 
`With ${motivation.factors.join(' and ')}, now may be the ideal time to explore your options.` :
`Whether you're thinking about retirement or simply curious about your business's value, it's worth exploring your options.`}

**Why ${industry} Businesses Are In Demand:**
• Established customer relationships
• Proven business models
• ${painPoints[0] ? `Despite challenges like ${painPoints[0]}, buyers see opportunity` : 'Strong market fundamentals'}

**What We Offer:**
□ Free, confidential business valuation
□ Access to qualified buyers
□ Expert guidance through the entire process
□ Protection for your employees and legacy

**Local Market Insights:**
• ${county.businessMetrics.totalBusinesses.toLocaleString()} total businesses in ${county.countyName}
• Estimated ${county.businessMetrics.boomerOwnedEstimate.toLocaleString()} owned by those nearing retirement
• ${county.marketClassification === 'tertiary' ? 'Less competition from large PE firms' : 'Active buyer market'}

Call [Phone] or visit [Website] for a confidential conversation about your future.

Sincerely,
[Your Name]
[Title]

P.S. We're hosting a free "Business Succession Planning" workshop on [Date]. Reserve your spot at [Website/Workshop]`,
    tone: 'professional',
    channel: 'letter'
  });

  return scripts;
}

// Generate follow-up sequences
export function generateFollowUpSequence(
  initialOutreach: OutreachScript,
  responseType: 'no-response' | 'not-interested' | 'maybe-later'
): OutreachScript[] {
  const followUps: OutreachScript[] = [];

  switch (responseType) {
    case 'no-response':
      followUps.push({
        subject: 'Re: ' + initialOutreach.subject,
        body: `Following up on my previous message about succession planning opportunities.

I understand you're busy running your business. If you'd prefer, I can send you a brief market report showing:
• Current valuations for businesses like yours
• Recent transaction examples
• Market trends affecting your industry

No obligation - just helpful information for your planning.

Best regards,
[Your Name]`,
        tone: 'professional',
        channel: initialOutreach.channel
      });
      break;

    case 'not-interested':
      followUps.push({
        subject: 'Understood - Staying in Touch',
        body: `Thank you for your response. I respect that you're not looking to sell at this time.

Many successful owners aren't ready to sell but find value in:
• Understanding their business valuation
• Staying informed about market conditions
• Having a succession plan in place

I'll check back in 6 months, but feel free to reach out anytime if your situation changes or if you'd like market insights.

Best wishes for continued success,
[Your Name]`,
        tone: 'friendly',
        channel: initialOutreach.channel
      });
      break;

    case 'maybe-later':
      followUps.push({
        subject: 'Market Update for Your Planning',
        body: `Thanks for your interest in staying informed. Here's a quick market update:

• ${initialOutreach.channel === 'email' ? 'Industry' : 'Your industry'} valuations have increased X% this quarter
• We've seen Y successful transitions in your area recently
• Buyer demand remains strong for established businesses

I've attached a brief report with more details. When might be a good time to revisit this conversation?

Would [Month] work for a quick check-in call?

Best regards,
[Your Name]`,
        tone: 'professional',
        channel: initialOutreach.channel
      });
      break;
  }

  return followUps;
}

// Export templates for specific scenarios
export const scenarioTemplates = {
  highMotivationTertiary: (county: string, industry: string) => ({
    subject: `Exclusive Opportunity for ${industry} Businesses in ${county}`,
    body: `Multiple buyers seeking established ${industry.toLowerCase()} businesses in smaller markets. 
    Limited competition means better terms for sellers. Confidential discussion available.`
  }),
  
  approachingRetirement: (businessName: string) => ({
    subject: `Succession Planning for ${businessName}`,
    body: `After decades of building your business, ensure it continues to thrive under new ownership. 
    We specialize in smooth transitions that protect your legacy and employees.`
  }),
  
  industryConsolidation: (industry: string) => ({
    subject: `${industry} Industry Consolidation Creates Opportunities`,
    body: `Strategic buyers are actively acquiring in the ${industry.toLowerCase()} sector. 
    Now may be the ideal time to explore your options while valuations are strong.`
  })
};