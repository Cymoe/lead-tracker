# Google Maps Business Search Setup Guide

This guide will help you set up the Google Maps integration to automatically import businesses from Google Maps.

## Features

- Search for businesses by service type and location
- Automatic scoring based on opportunity (no website, low reviews, etc.)
- Bulk import with phone numbers, addresses, and business details
- Smart filtering to find businesses most likely to need your services

## Setup Instructions

### 1. Get a Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Go to "Credentials" and create an API Key
5. (Optional but recommended) Restrict the API key to your domain

### 2. Add the API Key to Your Environment

Add the following to your `.env.local` file:

```
GOOGLE_MAPS_API_KEY=your_api_key_here
```

### 3. How to Use

1. Click the "Import" button in your dashboard
2. Select "Google Maps" from the dropdown
3. Enter:
   - **Service Type**: e.g., "HVAC", "Landscaping", "Plumbing"
   - **City**: e.g., "Phoenix, AZ"
   - **Radius**: How far to search (5-50 km)
4. Click "Search Google Maps"
5. Review the results - they're automatically scored by opportunity
6. Select the businesses you want to import
7. Click "Import Selected"

## Opportunity Scoring

The system automatically scores each business based on:

- **No Website** (+30 points) - High opportunity for digital services
- **Low Reviews** (+20 points) - Growing business, needs marketing help
- **Medium Rating** (+15 points) - Room for improvement

Businesses are sorted by opportunity score, with the highest opportunities at the top.

## Pro Tips

1. **Target Specific Niches**: Search for specific services like "emergency plumber" or "commercial HVAC"
2. **Check Multiple Radiuses**: Start with 10km, then expand to catch more businesses
3. **Look for Quality Signals**: 
   - 🚨 No Website = They need digital presence
   - 🌱 Growing Business = Under 50 reviews
   - ⚡ Reputation Opportunity = Under 4.0 stars
   - ✅ Active Business = Has operating hours

## Pricing

Google Maps API pricing:
- First $200/month is FREE (covers ~28,000 searches)
- After that: $0.007 per search

For most users, the free tier is more than enough!

## Troubleshooting

### "Google Maps API Key Required" Error
- Make sure you've added the API key to your `.env.local` file
- Restart your Next.js server after adding the key

### No Results Found
- Try broader search terms
- Increase the search radius
- Check if the city name is spelled correctly

### API Quota Exceeded
- You've hit Google's rate limits
- Wait a few minutes and try again
- Consider upgrading your Google Cloud account

## Next Steps

After importing leads from Google Maps:
1. Use the Ad Platform Checker to see who's already advertising
2. Sort by opportunity score to prioritize outreach
3. Export high-opportunity leads to your CRM
4. Start your outreach campaigns! 