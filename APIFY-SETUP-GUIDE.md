# 🚀 Apify Facebook Ad Library Integration

## Why Apify?

- **Pre-built scraper** specifically for Facebook Ad Library
- **No Facebook approval needed**
- **Handles anti-bot detection**
- **Returns structured data**
- **Free tier available** (100 executions/month)

## Quick Setup (10 minutes)

### 1. Create Apify Account

1. Go to: https://apify.com/
2. Sign up (free)
3. Get your API token from: https://console.apify.com/account/integrations

### 2. Find the Facebook Ad Library Scraper

1. Go to: https://apify.com/apify/facebook-ads-scraper
2. Click "Try for free"
3. Note the Actor ID: `apify/facebook-ads-scraper`

### 3. Add to Your App

Add to `.env.local`:
```
APIFY_API_TOKEN=your_apify_api_token_here
```

### 4. Test the Scraper

```bash
# Test with curl
curl -X POST https://api.apify.com/v2/acts/apify~facebook-ads-scraper/run-sync?token=YOUR_TOKEN \
  -H "Content-Type: application/json" \
  -d '{
    "searchTerms": "Sunblock Window Tint",
    "country": "US",
    "maxItems": 20
  }'
```

## Integration Code

Replace the mock Facebook function with:

```typescript
async function checkFacebookAdsWithApify(
  companyName: string,
  location?: string
): Promise<AdPlatformStatus> {
  const apiToken = process.env.APIFY_API_TOKEN;
  
  if (!apiToken) {
    return getMockFacebookAds(leadId, companyName, location);
  }
  
  try {
    // Start the scraper
    const response = await fetch(
      `https://api.apify.com/v2/acts/apify~facebook-ads-scraper/run-sync?token=${apiToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchTerms: companyName,
          country: 'US',
          maxItems: 25,
          adStatus: 'ACTIVE'
        })
      }
    );
    
    const data = await response.json();
    
    // Transform Apify results to our format
    const ads = data.items?.map((ad: any) => ({
      id: ad.id,
      type: ad.type || 'image',
      imageUrl: ad.snapshot_url,
      headline: ad.page_name,
      primaryText: ad.ad_creative_body,
      callToAction: ad.cta_text || 'Learn More',
      status: 'active',
      lastSeen: ad.ad_delivery_start_time,
      impressions: ad.impressions?.lower_bound,
      spend: ad.spend ? `$${ad.spend.lower_bound}-${ad.spend.upper_bound}` : undefined,
      targeting: {
        locations: [ad.target_locations?.[0] || location || 'US'],
      }
    })) || [];
    
    return {
      platform: 'Facebook Ads',
      hasAds: ads.length > 0,
      lastChecked: new Date().toISOString(),
      ads: ads,
      adCount: ads.length,
      notes: 'Live data from Apify'
    };
  } catch (error) {
    console.error('Apify error:', error);
    return getMockFacebookAds(leadId, companyName, location);
  }
}
```

## Pricing

### Apify Free Tier
- **100 actor runs/month**
- **$5 platform credit**
- Perfect for testing

### Paid Plans
- **Starter**: $49/month - 300 runs
- **Scale**: $499/month - 3,000 runs
- **Enterprise**: Custom

### Cost per Lead Check
- Free tier: ~100 leads/month
- Starter: ~300 leads/month
- Each "run" can check multiple platforms

## Other Platform Scrapers on Apify

1. **Google Maps Scraper** - Extract business data
2. **LinkedIn Scraper** - Company/people data
3. **Instagram Scraper** - Profile and posts
4. **Yelp Scraper** - Reviews and business info

## Alternative Services

### ScrapingBee ($49/month)
```javascript
const response = await fetch('https://app.scrapingbee.com/api/v1/', {
  method: 'GET',
  params: {
    api_key: 'YOUR_API_KEY',
    url: `https://www.facebook.com/ads/library/?q=${companyName}`,
    render_js: 'true'
  }
});
```

### Phantombuster ($30/month)
- Pre-built "Phantoms" for various platforms
- Visual workflow builder
- Good for non-developers

## Quick Start Checklist

- [ ] Sign up for Apify (free)
- [ ] Get API token
- [ ] Add to .env.local
- [ ] Test with curl command
- [ ] Update code to use Apify
- [ ] Test with real company names

## Common Issues

**"No ads found"**
- Try exact company name as it appears on Facebook
- Some small businesses might not run ads

**"Rate limit exceeded"**
- Free tier: 100 runs/month
- Upgrade or use caching

**"Invalid API token"**
- Check token in Apify console
- Make sure no extra spaces

## Next Steps

1. Test with your actual leads
2. Implement caching to save API calls
3. Add other platform scrapers
4. Set up webhook for real-time updates 