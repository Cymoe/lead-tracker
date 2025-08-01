# Google Maps Comprehensive Search Strategy

## The Reality: Google Maps API Limitations

Google Maps API **does NOT return all businesses** in an area. Here's what you need to know:

### API Limitations:
- **20 results** per search (default)
- **60 results maximum** with pagination (3 pages × 20)
- Results are ranked by Google's "prominence" algorithm
- Small/new businesses often don't appear

### Why This Happens:
1. **Performance**: Returning thousands of results would be slow
2. **Cost**: Google charges per result
3. **Relevance**: Google assumes you want "best" not "all"

## Strategy: Grid Search for Complete Coverage

To get comprehensive coverage, search multiple times with different approaches:

### 1. **Geographic Grid Search**
Instead of one large search, divide the city into zones:

```
Phoenix Example:
- "plumber downtown Phoenix"
- "plumber north Phoenix"  
- "plumber south Phoenix"
- "plumber Scottsdale" (nearby area)
- "plumber Tempe" (nearby area)
```

### 2. **Service Variation Search**
Different keywords find different businesses:

```
HVAC Example:
- "HVAC repair"
- "air conditioning"
- "AC repair"
- "heating repair"
- "furnace repair"
- "{brand} HVAC" (Carrier, Trane, etc.)
```

### 3. **Business Type Modifiers**
Add modifiers to find specific segments:

```
Modifiers:
- "emergency plumber"
- "24 hour plumber"
- "commercial plumber"
- "residential plumber"
- "plumber near me"
- "best plumber"
- "cheap plumber"
```

### 4. **Radius Strategy**
Use smaller, overlapping searches:

```
Instead of: 50km radius (gets 60 businesses)
Do this: 
- 5km radius at city center
- 5km radius north of center
- 5km radius south of center
- 5km radius east of center
- 5km radius west of center
Total: Up to 300 businesses!
```

## Automation Script Example

Here's how to search comprehensively:

```javascript
// Example search grid for Phoenix
const searchGrid = [
  // Geographic zones
  { area: "downtown Phoenix", radius: 5000 },
  { area: "north Phoenix", radius: 5000 },
  { area: "south Phoenix", radius: 5000 },
  { area: "east Phoenix", radius: 5000 },
  { area: "west Phoenix", radius: 5000 },
  
  // Nearby cities
  { area: "Scottsdale", radius: 5000 },
  { area: "Tempe", radius: 5000 },
  { area: "Mesa", radius: 5000 },
  { area: "Glendale", radius: 5000 },
];

// Service variations
const serviceVariations = [
  "plumber",
  "plumbing",
  "emergency plumber",
  "drain cleaning",
  "pipe repair"
];

// This would yield up to:
// 9 areas × 5 variations × 60 results = 2,700 potential businesses!
```

## Quick Manual Strategy

For immediate results without coding:

### Round 1: Core Search
1. Search: `"plumber"` in `"Phoenix, AZ"` with `10km radius`
2. Import high-opportunity businesses
3. Note how many results you got

### Round 2: Geographic Expansion
1. If you got 60 results, the area has more businesses
2. Search specific neighborhoods:
   - `"plumber"` in `"Scottsdale, AZ"`
   - `"plumber"` in `"Tempe, AZ"`
   - `"plumber"` in `"Mesa, AZ"`

### Round 3: Service Variations
1. Try different terms in same areas:
   - `"plumbing contractor"`
   - `"emergency plumber"`
   - `"drain cleaning"`

### Round 4: Competition Gaps
1. Look for underserved terms:
   - `"24 hour plumber"`
   - `"commercial plumbing"`
   - `"sewer repair"`

## Pro Tips

### 1. **Track Your Searches**
Keep a spreadsheet:
| Search Term | Location | Radius | Results | Imported |
|------------|----------|---------|---------|----------|
| plumber | Phoenix | 10km | 60 | 12 |
| plumber | Scottsdale | 10km | 45 | 8 |

### 2. **Look for Patterns**
- If you get 60 results → area has more businesses
- If you get <20 results → you've found most in that area
- No-website businesses = highest opportunity

### 3. **Use Business Insights**
- Downtown = established businesses
- Suburbs = growing businesses
- Industrial = commercial focus
- Residential = consumer focus

### 4. **Seasonal Searches**
Some businesses appear differently by season:
- "AC repair" (summer)
- "heating repair" (winter)
- "pool service" (summer)
- "snow removal" (winter)

## Alternative Data Sources

For truly comprehensive data, consider:

1. **Yellow Pages API** - More complete for traditional businesses
2. **Yelp API** - Good for service businesses
3. **Facebook API** - Finds businesses with social presence
4. **Local Business Directories** - City-specific databases
5. **Web Scraping** - Most comprehensive but requires more setup

## The Bottom Line

Google Maps is excellent for finding **quality leads quickly**, but it's not comprehensive. Use it as:
- **Phase 1**: Quick wins (businesses without websites)
- **Phase 2**: Grid search for broader coverage  
- **Phase 3**: Combine with other data sources

Remember: The businesses Google doesn't show you might be your BEST opportunities - they need help being found! 