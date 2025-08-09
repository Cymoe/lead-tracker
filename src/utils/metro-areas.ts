import { MetroAreaDefinition } from '@/types';

// Common US metro areas for auto-detection
export const METRO_AREAS: MetroAreaDefinition[] = [
  // California
  {
    name: 'Bay Area',
    state: 'CA',
    cities: ['San Francisco', 'Oakland', 'San Jose', 'Berkeley', 'Palo Alto', 'Mountain View', 'Sunnyvale', 'Fremont', 'Hayward', 'San Mateo', 'Redwood City', 'Santa Clara', 'Cupertino', 'Daly City', 'Richmond'],
    aliases: ['SF Bay Area', 'San Francisco Bay Area']
  },
  {
    name: 'Los Angeles Metro',
    state: 'CA',
    cities: ['Los Angeles', 'Long Beach', 'Anaheim', 'Santa Ana', 'Irvine', 'Glendale', 'Pasadena', 'Torrance', 'Orange', 'Fullerton', 'Costa Mesa', 'Burbank', 'Downey', 'West Covina', 'Norwalk'],
    aliases: ['LA Metro', 'Greater Los Angeles']
  },
  {
    name: 'San Diego Metro',
    state: 'CA',
    cities: ['San Diego', 'Chula Vista', 'Oceanside', 'Escondido', 'Carlsbad', 'El Cajon', 'Vista', 'San Marcos', 'Encinitas', 'National City', 'La Mesa'],
    aliases: ['Greater San Diego']
  },
  
  // Texas
  {
    name: 'Dallas-Fort Worth',
    state: 'TX',
    cities: ['Dallas', 'Fort Worth', 'Arlington', 'Plano', 'Irving', 'Garland', 'Frisco', 'McKinney', 'Carrollton', 'Denton', 'Richardson', 'Lewisville', 'Allen', 'Flower Mound', 'Mansfield'],
    aliases: ['DFW', 'Metroplex']
  },
  {
    name: 'Houston Metro',
    state: 'TX',
    cities: ['Houston', 'Pasadena', 'Pearland', 'League City', 'Sugar Land', 'The Woodlands', 'Baytown', 'Conroe', 'Missouri City', 'Spring', 'Katy', 'Cypress'],
    aliases: ['Greater Houston']
  },
  {
    name: 'Austin Metro',
    state: 'TX',
    cities: ['Austin', 'Round Rock', 'Cedar Park', 'Georgetown', 'Pflugerville', 'San Marcos', 'Kyle', 'Leander', 'Cedar Creek', 'Bastrop'],
    aliases: ['Greater Austin']
  },
  {
    name: 'San Antonio Metro',
    state: 'TX',
    cities: ['San Antonio', 'New Braunfels', 'Seguin', 'Boerne', 'Schertz', 'Converse', 'Live Oak', 'Selma', 'Universal City'],
    aliases: ['Greater San Antonio']
  },
  
  // Arizona
  {
    name: 'Phoenix Metro',
    state: 'AZ',
    cities: ['Phoenix', 'Mesa', 'Chandler', 'Scottsdale', 'Glendale', 'Gilbert', 'Tempe', 'Peoria', 'Surprise', 'Goodyear', 'Avondale', 'Queen Creek', 'Buckeye'],
    aliases: ['Valley of the Sun', 'Phoenix Metropolitan Area']
  },
  
  // Nevada
  {
    name: 'Las Vegas Metro',
    state: 'NV',
    cities: ['Las Vegas', 'Henderson', 'North Las Vegas', 'Spring Valley', 'Paradise', 'Sunrise Manor', 'Enterprise', 'Summerlin'],
    aliases: ['Las Vegas Valley', 'Greater Las Vegas']
  },
  
  // Colorado
  {
    name: 'Denver Metro',
    state: 'CO',
    cities: ['Denver', 'Aurora', 'Lakewood', 'Thornton', 'Westminster', 'Arvada', 'Centennial', 'Littleton', 'Englewood', 'Wheat Ridge', 'Parker', 'Castle Rock', 'Highlands Ranch'],
    aliases: ['Denver-Aurora', 'Mile High City']
  },
  
  // Florida
  {
    name: 'Miami Metro',
    state: 'FL',
    cities: ['Miami', 'Hialeah', 'Miami Beach', 'Coral Gables', 'Kendall', 'Doral', 'Aventura', 'Homestead', 'North Miami', 'Cutler Bay', 'Miami Lakes', 'Palmetto Bay'],
    aliases: ['Greater Miami', 'Miami-Dade']
  },
  {
    name: 'Tampa Bay',
    state: 'FL',
    cities: ['Tampa', 'St. Petersburg', 'Clearwater', 'Brandon', 'Largo', 'Spring Hill', 'Riverview', 'Palm Harbor', 'Plant City', 'Bradenton', 'Sarasota'],
    aliases: ['Tampa Bay Area', 'Tampa-St. Pete']
  },
  {
    name: 'Orlando Metro',
    state: 'FL',
    cities: ['Orlando', 'Kissimmee', 'Sanford', 'Altamonte Springs', 'Winter Park', 'Oviedo', 'Apopka', 'Lake Mary', 'Winter Garden', 'Clermont'],
    aliases: ['Greater Orlando', 'Central Florida']
  },
  {
    name: 'Naples-Fort Myers',
    state: 'FL',
    cities: ['Naples', 'Fort Myers', 'Cape Coral', 'Bonita Springs', 'Estero', 'Marco Island', 'Immokalee', 'Golden Gate'],
    aliases: ['Southwest Florida', 'Naples-Marco Island']
  },
  {
    name: 'Jacksonville Metro',
    state: 'FL',
    cities: ['Jacksonville', 'St. Augustine', 'Orange Park', 'Neptune Beach', 'Atlantic Beach', 'Jacksonville Beach', 'Ponte Vedra Beach'],
    aliases: ['Greater Jacksonville', 'First Coast']
  },
  {
    name: 'Fort Lauderdale Metro',
    state: 'FL',
    cities: ['Fort Lauderdale', 'Hollywood', 'Pembroke Pines', 'Coral Springs', 'Pompano Beach', 'Davie', 'Plantation', 'Sunrise', 'Miramar', 'Weston', 'Coconut Creek', 'Deerfield Beach'],
    aliases: ['Broward County', 'Greater Fort Lauderdale']
  },
  {
    name: 'West Palm Beach Metro',
    state: 'FL',
    cities: ['West Palm Beach', 'Boca Raton', 'Boynton Beach', 'Delray Beach', 'Jupiter', 'Wellington', 'Lake Worth', 'Royal Palm Beach', 'Palm Beach Gardens'],
    aliases: ['Palm Beach County', 'Palm Beaches']
  },
  
  // Georgia
  {
    name: 'Atlanta Metro',
    state: 'GA',
    cities: ['Atlanta', 'Sandy Springs', 'Roswell', 'Alpharetta', 'Marietta', 'Smyrna', 'Dunwoody', 'Brookhaven', 'Decatur', 'Kennesaw', 'Lawrenceville', 'Duluth', 'Tucker'],
    aliases: ['Metro Atlanta', 'Greater Atlanta']
  },
  
  // North Carolina
  {
    name: 'Charlotte Metro',
    state: 'NC',
    cities: ['Charlotte', 'Concord', 'Gastonia', 'Rock Hill', 'Huntersville', 'Kannapolis', 'Mooresville', 'Monroe', 'Matthews', 'Mint Hill'],
    aliases: ['Greater Charlotte', 'Charlotte Metropolitan']
  },
  {
    name: 'Raleigh-Durham',
    state: 'NC',
    cities: ['Raleigh', 'Durham', 'Cary', 'Chapel Hill', 'Wake Forest', 'Apex', 'Holly Springs', 'Morrisville', 'Carrboro', 'Fuquay-Varina'],
    aliases: ['Research Triangle', 'Triangle Area']
  },
  
  // Washington
  {
    name: 'Seattle Metro',
    state: 'WA',
    cities: ['Seattle', 'Bellevue', 'Tacoma', 'Kent', 'Everett', 'Renton', 'Federal Way', 'Spokane Valley', 'Kirkland', 'Auburn', 'Redmond', 'Sammamish', 'Bothell', 'Issaquah'],
    aliases: ['Greater Seattle', 'Puget Sound']
  },
  
  // Oregon
  {
    name: 'Portland Metro',
    state: 'OR',
    cities: ['Portland', 'Eugene', 'Gresham', 'Hillsboro', 'Beaverton', 'Bend', 'Medford', 'Springfield', 'Corvallis', 'Albany', 'Tigard', 'Lake Oswego', 'Keizer'],
    aliases: ['Greater Portland', 'Portland Metropolitan']
  },
  
  // Illinois
  {
    name: 'Chicago Metro',
    state: 'IL',
    cities: ['Chicago', 'Aurora', 'Rockford', 'Joliet', 'Naperville', 'Springfield', 'Peoria', 'Elgin', 'Waukegan', 'Cicero', 'Schaumburg', 'Evanston', 'Des Plaines', 'Orland Park'],
    aliases: ['Chicagoland', 'Greater Chicago']
  },
  
  // New York
  {
    name: 'New York Metro',
    state: 'NY',
    cities: ['New York', 'Brooklyn', 'Queens', 'Manhattan', 'Bronx', 'Staten Island', 'Yonkers', 'White Plains', 'New Rochelle', 'Mount Vernon'],
    aliases: ['NYC Metro', 'Greater New York', 'Tri-State Area']
  },
  
  // Massachusetts
  {
    name: 'Boston Metro',
    state: 'MA',
    cities: ['Boston', 'Cambridge', 'Quincy', 'Lynn', 'Newton', 'Somerville', 'Framingham', 'Waltham', 'Malden', 'Brookline', 'Medford', 'Revere', 'Arlington'],
    aliases: ['Greater Boston', 'Boston Metropolitan']
  },
  
  // Pennsylvania
  {
    name: 'Philadelphia Metro',
    state: 'PA',
    cities: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Reading', 'Upper Darby', 'Bensalem', 'Lancaster', 'Bethlehem', 'Abington', 'Bristol'],
    aliases: ['Greater Philadelphia', 'Philly Metro']
  },
  
  // Michigan
  {
    name: 'Detroit Metro',
    state: 'MI',
    cities: ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor', 'Lansing', 'Dearborn', 'Livonia', 'Troy', 'Westland', 'Farmington Hills', 'Rochester Hills'],
    aliases: ['Metro Detroit', 'Greater Detroit']
  },
  
  // Ohio
  {
    name: 'Cleveland Metro',
    state: 'OH',
    cities: ['Cleveland', 'Akron', 'Canton', 'Parma', 'Lakewood', 'Elyria', 'Euclid', 'Mentor', 'Strongsville', 'Westlake'],
    aliases: ['Greater Cleveland', 'Northeast Ohio']
  },
  {
    name: 'Columbus Metro',
    state: 'OH',
    cities: ['Columbus', 'Dublin', 'Westerville', 'Grove City', 'Upper Arlington', 'Gahanna', 'Hilliard', 'Reynoldsburg', 'Pickerington', 'Worthington'],
    aliases: ['Greater Columbus', 'Central Ohio']
  },
  {
    name: 'Cincinnati Metro',
    state: 'OH',
    cities: ['Cincinnati', 'Hamilton', 'Middletown', 'Fairfield', 'Mason', 'West Chester', 'Loveland', 'Norwood', 'Forest Park', 'Springdale'],
    aliases: ['Greater Cincinnati', 'Cincinnati Metropolitan']
  }
];

// Function to detect which metro area a city belongs to
export function detectMetroArea(city: string, state: string): MetroAreaDefinition | null {
  if (!city) return null;
  
  const normalizedCity = city.trim().toLowerCase();
  
  // If state is provided, look for exact match
  if (state) {
    return METRO_AREAS.find(metro => 
      metro.state === state && 
      metro.cities.some(c => c.toLowerCase() === normalizedCity)
    ) || null;
  }
  
  // If no state provided, try to find city in any metro area
  return METRO_AREAS.find(metro => 
    metro.cities.some(c => c.toLowerCase() === normalizedCity)
  ) || null;
}

// Function to group cities by metro areas
export function groupCitiesByMetro(cities: Array<{city: string, state: string, count: number}>): Map<string, Array<{city: string, count: number}>> {
  const metroGroups = new Map<string, Array<{city: string, count: number}>>();
  const ungroupedCities: Array<{city: string, state: string, count: number}> = [];
  
  cities.forEach(({city, state, count}) => {
    const metro = detectMetroArea(city, state);
    if (metro) {
      const key = `${metro.name}|${metro.state}`;
      if (!metroGroups.has(key)) {
        metroGroups.set(key, []);
      }
      metroGroups.get(key)!.push({city, count});
    } else {
      ungroupedCities.push({city, state, count});
    }
  });
  
  // Add ungrouped cities as individual entries
  ungroupedCities.forEach(({city, state, count}) => {
    metroGroups.set(`${city}|${state}`, [{city, count}]);
  });
  
  return metroGroups;
}