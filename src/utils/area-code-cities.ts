// Area code to city/metro mapping
export const AREA_CODE_CITIES: Record<string, { state: string; cities: string[] }> = {
  // Arizona
  '480': { state: 'AZ', cities: ['Phoenix', 'Mesa', 'Scottsdale', 'Chandler', 'Tempe', 'Gilbert'] },
  '602': { state: 'AZ', cities: ['Phoenix'] },
  '623': { state: 'AZ', cities: ['Phoenix', 'Glendale', 'Peoria'] },
  '520': { state: 'AZ', cities: ['Tucson'] },
  '928': { state: 'AZ', cities: ['Flagstaff', 'Yuma', 'Prescott'] },
  
  // California
  '213': { state: 'CA', cities: ['Los Angeles'] },
  '310': { state: 'CA', cities: ['Los Angeles', 'Santa Monica', 'Beverly Hills', 'Torrance'] },
  '323': { state: 'CA', cities: ['Los Angeles'] },
  '415': { state: 'CA', cities: ['San Francisco'] },
  '510': { state: 'CA', cities: ['Oakland', 'Berkeley', 'Fremont'] },
  '408': { state: 'CA', cities: ['San Jose', 'Sunnyvale'] },
  '619': { state: 'CA', cities: ['San Diego'] },
  '714': { state: 'CA', cities: ['Anaheim', 'Santa Ana', 'Orange'] },
  '818': { state: 'CA', cities: ['Los Angeles', 'Burbank', 'Glendale'] },
  '916': { state: 'CA', cities: ['Sacramento'] },
  '949': { state: 'CA', cities: ['Irvine', 'Newport Beach', 'Mission Viejo'] },
  '650': { state: 'CA', cities: ['San Mateo', 'Palo Alto', 'Redwood City'] },
  '925': { state: 'CA', cities: ['Concord', 'Livermore', 'Walnut Creek'] },
  '562': { state: 'CA', cities: ['Long Beach', 'Downey', 'Norwalk'] },
  '626': { state: 'CA', cities: ['Pasadena', 'Alhambra', 'West Covina'] },
  '707': { state: 'CA', cities: ['Santa Rosa', 'Vallejo', 'Napa'] },
  '805': { state: 'CA', cities: ['Santa Barbara', 'Ventura', 'San Luis Obispo'] },
  '831': { state: 'CA', cities: ['Monterey', 'Salinas', 'Santa Cruz'] },
  '909': { state: 'CA', cities: ['San Bernardino', 'Riverside', 'Ontario'] },
  '951': { state: 'CA', cities: ['Riverside', 'Corona', 'Moreno Valley'] },
  
  // Texas
  '214': { state: 'TX', cities: ['Dallas'] },
  '469': { state: 'TX', cities: ['Dallas', 'Plano', 'Richardson'] },
  '972': { state: 'TX', cities: ['Dallas', 'Irving', 'Plano'] },
  '817': { state: 'TX', cities: ['Fort Worth', 'Arlington'] },
  '682': { state: 'TX', cities: ['Fort Worth', 'Arlington'] },
  '713': { state: 'TX', cities: ['Houston'] },
  '281': { state: 'TX', cities: ['Houston'] },
  '832': { state: 'TX', cities: ['Houston'] },
  '512': { state: 'TX', cities: ['Austin'] },
  '737': { state: 'TX', cities: ['Austin'] },
  '210': { state: 'TX', cities: ['San Antonio'] },
  '726': { state: 'TX', cities: ['San Antonio'] },
  '361': { state: 'TX', cities: ['Corpus Christi'] },
  '409': { state: 'TX', cities: ['Beaumont', 'Galveston'] },
  '806': { state: 'TX', cities: ['Amarillo', 'Lubbock'] },
  '915': { state: 'TX', cities: ['El Paso'] },
  '903': { state: 'TX', cities: ['Tyler', 'Sherman'] },
  '940': { state: 'TX', cities: ['Denton', 'Wichita Falls'] },
  
  // Florida
  '305': { state: 'FL', cities: ['Miami', 'Key West'] },
  '786': { state: 'FL', cities: ['Miami'] },
  '954': { state: 'FL', cities: ['Fort Lauderdale', 'Pembroke Pines', 'Hollywood'] },
  '754': { state: 'FL', cities: ['Fort Lauderdale', 'Broward County'] },
  '561': { state: 'FL', cities: ['West Palm Beach', 'Boca Raton', 'Boynton Beach'] },
  '407': { state: 'FL', cities: ['Orlando', 'Sanford'] },
  '321': { state: 'FL', cities: ['Orlando', 'Melbourne', 'Cocoa'] },
  '813': { state: 'FL', cities: ['Tampa'] },
  '727': { state: 'FL', cities: ['St. Petersburg', 'Clearwater'] },
  '239': { state: 'FL', cities: ['Fort Myers', 'Naples', 'Cape Coral'] },
  '352': { state: 'FL', cities: ['Gainesville', 'Ocala'] },
  '386': { state: 'FL', cities: ['Daytona Beach', 'Deltona'] },
  '850': { state: 'FL', cities: ['Tallahassee', 'Pensacola', 'Panama City'] },
  '904': { state: 'FL', cities: ['Jacksonville'] },
  '941': { state: 'FL', cities: ['Sarasota', 'Bradenton'] },
  
  // New York
  '212': { state: 'NY', cities: ['New York', 'Manhattan'] },
  '646': { state: 'NY', cities: ['New York', 'Manhattan'] },
  '917': { state: 'NY', cities: ['New York'] },
  '718': { state: 'NY', cities: ['New York', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'] },
  '347': { state: 'NY', cities: ['New York', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'] },
  '929': { state: 'NY', cities: ['New York', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island'] },
  '516': { state: 'NY', cities: ['Long Island', 'Hempstead'] },
  '631': { state: 'NY', cities: ['Long Island', 'Suffolk County'] },
  '914': { state: 'NY', cities: ['Westchester', 'White Plains', 'Yonkers'] },
  '518': { state: 'NY', cities: ['Albany', 'Schenectady', 'Troy'] },
  '585': { state: 'NY', cities: ['Rochester'] },
  '716': { state: 'NY', cities: ['Buffalo', 'Niagara Falls'] },
  '315': { state: 'NY', cities: ['Syracuse', 'Utica'] },
  '607': { state: 'NY', cities: ['Binghamton', 'Ithaca'] },
  '845': { state: 'NY', cities: ['Poughkeepsie', 'Newburgh'] },
  
  // Illinois
  '312': { state: 'IL', cities: ['Chicago'] },
  '773': { state: 'IL', cities: ['Chicago'] },
  '872': { state: 'IL', cities: ['Chicago'] },
  '708': { state: 'IL', cities: ['Chicago', 'Cicero'] },
  '847': { state: 'IL', cities: ['Chicago', 'Evanston', 'Waukegan'] },
  '630': { state: 'IL', cities: ['Chicago', 'Aurora', 'Naperville'] },
  '331': { state: 'IL', cities: ['Chicago', 'Aurora'] },
  '815': { state: 'IL', cities: ['Rockford', 'Joliet'] },
  '217': { state: 'IL', cities: ['Springfield', 'Champaign'] },
  '618': { state: 'IL', cities: ['East St. Louis', 'Carbondale'] },
  '309': { state: 'IL', cities: ['Peoria', 'Bloomington'] },
  
  // Pennsylvania
  '215': { state: 'PA', cities: ['Philadelphia'] },
  '267': { state: 'PA', cities: ['Philadelphia'] },
  '445': { state: 'PA', cities: ['Philadelphia'] },
  '610': { state: 'PA', cities: ['Philadelphia', 'Reading', 'Allentown'] },
  '484': { state: 'PA', cities: ['Philadelphia', 'Reading', 'Allentown'] },
  '412': { state: 'PA', cities: ['Pittsburgh'] },
  '724': { state: 'PA', cities: ['Pittsburgh', 'New Castle'] },
  '717': { state: 'PA', cities: ['Harrisburg', 'Lancaster', 'York'] },
  '570': { state: 'PA', cities: ['Scranton', 'Wilkes-Barre'] },
  '814': { state: 'PA', cities: ['Erie', 'Altoona', 'State College'] },
  
  // Georgia
  '404': { state: 'GA', cities: ['Atlanta'] },
  '470': { state: 'GA', cities: ['Atlanta'] },
  '678': { state: 'GA', cities: ['Atlanta'] },
  '770': { state: 'GA', cities: ['Atlanta', 'Marietta', 'Alpharetta'] },
  '706': { state: 'GA', cities: ['Augusta', 'Athens', 'Columbus'] },
  '762': { state: 'GA', cities: ['Augusta', 'Athens', 'Columbus'] },
  '912': { state: 'GA', cities: ['Savannah'] },
  '229': { state: 'GA', cities: ['Albany', 'Valdosta'] },
  '478': { state: 'GA', cities: ['Macon'] },
  
  // Massachusetts
  '617': { state: 'MA', cities: ['Boston'] },
  '857': { state: 'MA', cities: ['Boston'] },
  '781': { state: 'MA', cities: ['Boston', 'Lynn', 'Waltham'] },
  '508': { state: 'MA', cities: ['Worcester', 'New Bedford', 'Fall River'] },
  '774': { state: 'MA', cities: ['Worcester', 'Plymouth', 'Cape Cod'] },
  '978': { state: 'MA', cities: ['Lowell', 'Lawrence'] },
  '351': { state: 'MA', cities: ['Lowell', 'Lawrence'] },
  '413': { state: 'MA', cities: ['Springfield', 'Pittsfield'] },
  
  // Other major cities
  '202': { state: 'DC', cities: ['Washington'] },
  '206': { state: 'WA', cities: ['Seattle'] },
  '425': { state: 'WA', cities: ['Seattle', 'Bellevue', 'Everett'] },
  '253': { state: 'WA', cities: ['Tacoma'] },
  '360': { state: 'WA', cities: ['Vancouver', 'Olympia'] },
  '509': { state: 'WA', cities: ['Spokane'] },
  '503': { state: 'OR', cities: ['Portland'] },
  '971': { state: 'OR', cities: ['Portland', 'Salem'] },
  '541': { state: 'OR', cities: ['Eugene', 'Medford', 'Bend'] },
  '303': { state: 'CO', cities: ['Denver'] },
  '720': { state: 'CO', cities: ['Denver'] },
  '719': { state: 'CO', cities: ['Colorado Springs', 'Pueblo'] },
  '970': { state: 'CO', cities: ['Fort Collins', 'Grand Junction', 'Aspen'] },
  '702': { state: 'NV', cities: ['Las Vegas'] },
  '725': { state: 'NV', cities: ['Las Vegas'] },
  '775': { state: 'NV', cities: ['Reno', 'Carson City'] },
  '801': { state: 'UT', cities: ['Salt Lake City'] },
  '385': { state: 'UT', cities: ['Salt Lake City'] },
  '435': { state: 'UT', cities: ['St. George', 'Logan'] },
  '314': { state: 'MO', cities: ['St. Louis'] },
  '636': { state: 'MO', cities: ['St. Louis'] },
  '816': { state: 'MO', cities: ['Kansas City'] },
  '417': { state: 'MO', cities: ['Springfield'] },
  '615': { state: 'TN', cities: ['Nashville'] },
  '629': { state: 'TN', cities: ['Nashville'] },
  '901': { state: 'TN', cities: ['Memphis'] },
  '865': { state: 'TN', cities: ['Knoxville'] },
  '423': { state: 'TN', cities: ['Chattanooga'] },
  '502': { state: 'KY', cities: ['Louisville'] },
  '859': { state: 'KY', cities: ['Lexington'] },
  '504': { state: 'LA', cities: ['New Orleans'] },
  '225': { state: 'LA', cities: ['Baton Rouge'] },
  '337': { state: 'LA', cities: ['Lafayette'] },
  '318': { state: 'LA', cities: ['Shreveport'] },
};

// Get city from phone number (returns most likely city)
export function getCityFromPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Skip if too short
  if (cleaned.length < 10) return null;
  
  // Check if it starts with 1 (US country code) and remove it
  const withoutCountryCode = cleaned.startsWith('1') && cleaned.length === 11 
    ? cleaned.substring(1) 
    : cleaned;
  
  // For international numbers (starting with country codes other than 1)
  if (cleaned.length > 11 || (cleaned.length === 11 && !cleaned.startsWith('1'))) {
    // This is likely an international number, skip it
    return null;
  }
  
  // Extract first 3 digits
  if (withoutCountryCode.length === 10) {
    const areaCode = withoutCountryCode.substring(0, 3);
    const areaInfo = AREA_CODE_CITIES[areaCode];
    
    // Return the first (most common) city for this area code
    return areaInfo?.cities[0] || null;
  }
  
  return null;
}

// Get all possible cities for an area code
export function getPossibleCitiesFromPhone(phone: string | null | undefined): string[] {
  if (!phone) return [];
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Skip if too short
  if (cleaned.length < 10) return [];
  
  // Check if it starts with 1 (US country code) and remove it
  const withoutCountryCode = cleaned.startsWith('1') && cleaned.length === 11 
    ? cleaned.substring(1) 
    : cleaned;
  
  // For international numbers (starting with country codes other than 1)
  if (cleaned.length > 11 || (cleaned.length === 11 && !cleaned.startsWith('1'))) {
    // This is likely an international number, skip it
    return [];
  }
  
  // Extract first 3 digits
  if (withoutCountryCode.length === 10) {
    const areaCode = withoutCountryCode.substring(0, 3);
    const areaInfo = AREA_CODE_CITIES[areaCode];
    
    return areaInfo?.cities || [];
  }
  
  return [];
}