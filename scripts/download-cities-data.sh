#!/bin/bash

# Download comprehensive US cities data
# Using the kelvins/US-Cities-Database which has 29,880 US cities with coordinates

echo "Downloading US cities data..."

# Create data directory if it doesn't exist
mkdir -p src/data

# Download the JSON data from a reliable source
# Using a combination of sources for comprehensive coverage

# Option 1: Download from kelvins/US-Cities-Database (29,880 cities)
curl -L https://raw.githubusercontent.com/kelvins/US-Cities-Database/main/sql/us_cities.sql -o src/data/us_cities.sql

# Option 2: Download from dr5hn comprehensive database
curl -L https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/cities.json -o src/data/world_cities.json

# Option 3: Download US-specific data
curl -L https://gist.githubusercontent.com/Lwdthe1/81818d30d23f012628aac1cdf672627d/raw/d0c2c5a9555b4b0e2a6a8b6f5b3e0c5e5a5b5b5b/us-cities-states.json -o src/data/us-cities-states.json

echo "Download complete!"
echo "Converting to TypeScript format..."

# Run Node script to process the data
node scripts/process-cities-data.js