# Search Results Persistence Feature

## Overview
This feature implements persistence for Apify search results, allowing users to come back to their search results within 48 hours without having to re-run the searches.

## Implementation Details

### Database Schema
A new table `apify_search_results` has been created to store search results:
- `id`: Unique identifier
- `user_id`: Reference to the user who performed the search
- `search_type`: Either 'google_maps' or 'facebook_ads'
- `search_params`: JSON object storing the search parameters
- `results`: JSON array of search results
- `result_count`: Number of results
- `search_mode`: Either 'standard' or 'apify' (for Google Maps)
- `cost_estimate`: JSON object with cost breakdown (if applicable)
- `created_at`: When the search was performed
- `expires_at`: When the results will be automatically deleted (48 hours after creation)

### Features

1. **Automatic Saving**: All search results are automatically saved after a successful search
2. **Previous Searches UI**: A "Previous Searches" button shows up when the modal opens
3. **Load Previous Results**: Users can load any previous search with one click
4. **Delete Searches**: Users can manually delete saved searches
5. **Auto-expiration**: Search results automatically expire after 48 hours
6. **Search Details**: Shows search parameters, result count, and date

### API Endpoints

#### POST /api/search-results
Save new search results
```json
{
  "searchType": "google_maps" | "facebook_ads",
  "searchParams": { ... },
  "results": [ ... ],
  "searchMode": "standard" | "apify",
  "costEstimate": { ... }
}
```

#### GET /api/search-results
Fetch saved search results
Query parameters:
- `searchType`: Filter by search type (optional)
- `limit`: Maximum number of results to return (default: 5)

#### DELETE /api/search-results?id={searchId}
Delete a specific search result

### Cleanup

The system includes automatic cleanup of expired results:
- Results expire 48 hours after creation
- A cleanup function `cleanup_expired_search_results()` can be called to remove expired entries
- The cleanup can be triggered manually via POST /api/cleanup-search-results

### Security

- Row Level Security (RLS) ensures users can only access their own search results
- All operations are authenticated and user-scoped

## Usage

1. When users open the Google Maps or Facebook Ads search modal, their previous searches automatically load
2. If there are previous searches, a "Previous Searches" button appears
3. Clicking the button shows a list of recent searches with:
   - Search parameters (service type, location, etc.)
   - Number of results
   - Date of search
   - Load and Delete options
4. Clicking "Load" restores the search parameters and results
5. Results are automatically selected based on their quality scores

## Benefits

1. **Time Saving**: No need to re-run expensive Apify searches
2. **Cost Saving**: Reduces API usage and associated costs
3. **Better UX**: Users can compare different searches or continue where they left off
4. **Reliability**: Results are persisted even if the browser crashes or user accidentally closes the modal