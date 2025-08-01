# Better Lead Collection Methods

Since Facebook Ad Library scraping is challenging, here are better alternatives:

## 1. 🗺️ **Google Maps Import** (RECOMMENDED)
This is the most reliable automated method:
- Finds real local businesses
- Gets phone numbers, addresses, websites
- Scores by opportunity (no website = high priority)
- Works consistently

### Quick Setup:
1. Get free Google Maps API key
2. Add to `.env.local`: `GOOGLE_MAPS_API_KEY=your_key`
3. Import → Google Maps → Search!

## 2. 📋 **Manual FB Ad Library + AI Extract**
More reliable than scraping:
1. Go to [Facebook Ad Library](https://www.facebook.com/ads/library/)
2. Search for your keyword + location
3. Manually copy 10-20 business names
4. Use Import → From URL → Paste names → AI Extract

The AI will:
- Parse business names
- Detect service types
- Add location info
- Remove duplicates

## 3. 🔍 **Industry Directories**
Target specific directories:
- **HomeAdvisor/Angi**: Home service businesses
- **Thumbtack**: Local service providers  
- **Yelp Business**: All types
- **Google My Business**: Local listings

## 4. 📊 **Lead Databases** 
Consider professional tools:
- **Apollo.io**: B2B leads with emails
- **ZoomInfo**: Enterprise contacts
- **Clearbit**: Company enrichment
- **Hunter.io**: Email finder

## 5. 🎯 **LinkedIn Sales Navigator**
For B2B leads:
- Advanced search filters
- Decision maker contacts
- Company insights
- Export to CSV

## Recommended Workflow:

### Step 1: Start with Google Maps
- Search: "HVAC repair Phoenix"
- Import businesses without websites
- These need digital marketing most!

### Step 2: Manual FB Ad Library
- Find who's already advertising
- Copy names, use AI extract
- These have budget for marketing

### Step 3: Enrich with data
- Add phone numbers
- Find decision makers
- Check their current website

## Why Google Maps is Best:

| Feature | Google Maps | FB Scraping |
|---------|------------|-------------|
| Reliability | ✅ 100% | ❌ Often fails |
| Data Quality | ✅ Complete | ⚠️ Partial |
| Phone Numbers | ✅ Yes | ❌ No |
| Addresses | ✅ Yes | ❌ No |
| Website Status | ✅ Yes | ❌ No |
| API Cost | ✅ Free tier | ✅ Free |

## Quick Start:
```bash
# 1. Get Google Maps API key from:
https://console.cloud.google.com/

# 2. Add to .env.local:
GOOGLE_MAPS_API_KEY=your_key_here

# 3. Restart app and use Import → Google Maps
```

## For Facebook Ads:
Instead of scraping, use the manual import:
1. Visit: https://www.facebook.com/ads/library/
2. Search manually
3. Copy business names
4. Import → From URL → Paste → AI Extract

This is more reliable and gets the same results! 