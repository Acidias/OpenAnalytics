// Static city-to-coordinates lookup for enriching historical geo data
// that was stored without lat/lon. Keyed by "city|country" -> [lat, lon].
// Covers ~200 major cities worldwide.

export const CITY_COORDINATES: Record<string, [number, number]> = {
  // United States
  "New York|US": [40.7128, -74.0060],
  "Los Angeles|US": [34.0522, -118.2437],
  "Chicago|US": [41.8781, -87.6298],
  "Houston|US": [29.7604, -95.3698],
  "Phoenix|US": [33.4484, -112.0740],
  "Philadelphia|US": [39.9526, -75.1652],
  "San Antonio|US": [29.4241, -98.4936],
  "San Diego|US": [32.7157, -117.1611],
  "Dallas|US": [32.7767, -96.7970],
  "San Jose|US": [37.3382, -121.8863],
  "Austin|US": [30.2672, -97.7431],
  "San Francisco|US": [37.7749, -122.4194],
  "Seattle|US": [47.6062, -122.3321],
  "Denver|US": [39.7392, -104.9903],
  "Boston|US": [42.3601, -71.0589],
  "Nashville|US": [36.1627, -86.7816],
  "Portland|US": [45.5152, -122.6784],
  "Las Vegas|US": [36.1699, -115.1398],
  "Atlanta|US": [33.7490, -84.3880],
  "Miami|US": [25.7617, -80.1918],
  "Minneapolis|US": [44.9778, -93.2650],
  "Washington|US": [38.9072, -77.0369],
  "Charlotte|US": [35.2271, -80.8431],
  "Raleigh|US": [35.7796, -78.6382],

  // United Kingdom
  "London|GB": [51.5074, -0.1278],
  "Manchester|GB": [53.4808, -2.2426],
  "Birmingham|GB": [52.4862, -1.8904],
  "Edinburgh|GB": [55.9533, -3.1883],
  "Glasgow|GB": [55.8642, -4.2518],
  "Liverpool|GB": [53.4084, -2.9916],
  "Bristol|GB": [51.4545, -2.5879],
  "Leeds|GB": [53.8008, -1.5491],
  "Cardiff|GB": [51.4816, -3.1791],
  "Belfast|GB": [54.5973, -5.9301],

  // Germany
  "Berlin|DE": [52.5200, 13.4050],
  "Munich|DE": [48.1351, 11.5820],
  "Hamburg|DE": [53.5511, 9.9937],
  "Frankfurt|DE": [50.1109, 8.6821],
  "Cologne|DE": [50.9375, 6.9603],
  "Stuttgart|DE": [48.7758, 9.1829],
  "Dusseldorf|DE": [51.2277, 6.7735],
  "Leipzig|DE": [51.3397, 12.3731],
  "Dresden|DE": [51.0504, 13.7373],
  "Hanover|DE": [52.3759, 9.7320],

  // France
  "Paris|FR": [48.8566, 2.3522],
  "Marseille|FR": [43.2965, 5.3698],
  "Lyon|FR": [45.7640, 4.8357],
  "Toulouse|FR": [43.6047, 1.4442],
  "Nice|FR": [43.7102, 7.2620],
  "Nantes|FR": [47.2184, -1.5536],
  "Strasbourg|FR": [48.5734, 7.7521],
  "Bordeaux|FR": [44.8378, -0.5792],
  "Lille|FR": [50.6292, 3.0573],
  "Montpellier|FR": [43.6108, 3.8767],

  // Canada
  "Toronto|CA": [43.6532, -79.3832],
  "Vancouver|CA": [49.2827, -123.1207],
  "Montreal|CA": [45.5017, -73.5673],
  "Calgary|CA": [51.0447, -114.0719],
  "Ottawa|CA": [45.4215, -75.6972],
  "Edmonton|CA": [53.5461, -113.4938],
  "Winnipeg|CA": [49.8951, -97.1384],
  "Quebec|CA": [46.8139, -71.2080],

  // Japan
  "Tokyo|JP": [35.6762, 139.6503],
  "Osaka|JP": [34.6937, 135.5023],
  "Yokohama|JP": [35.4437, 139.6380],
  "Nagoya|JP": [35.1815, 136.9066],
  "Sapporo|JP": [43.0618, 141.3545],
  "Fukuoka|JP": [33.5904, 130.4017],
  "Kobe|JP": [34.6901, 135.1956],
  "Kyoto|JP": [35.0116, 135.7681],

  // Australia
  "Sydney|AU": [33.8688, 151.2093],
  "Melbourne|AU": [-37.8136, 144.9631],
  "Brisbane|AU": [-27.4698, 153.0251],
  "Perth|AU": [-31.9505, 115.8605],
  "Adelaide|AU": [-34.9285, 138.6007],
  "Canberra|AU": [-35.2809, 149.1300],

  // Netherlands
  "Amsterdam|NL": [52.3676, 4.9041],
  "Rotterdam|NL": [51.9244, 4.4777],
  "The Hague|NL": [52.0705, 4.3007],
  "Utrecht|NL": [52.0907, 5.1214],
  "Eindhoven|NL": [51.4416, 5.4697],
  "Groningen|NL": [53.2194, 6.5665],

  // India
  "Mumbai|IN": [19.0760, 72.8777],
  "Delhi|IN": [28.7041, 77.1025],
  "Bangalore|IN": [12.9716, 77.5946],
  "Hyderabad|IN": [17.3850, 78.4867],
  "Chennai|IN": [13.0827, 80.2707],
  "Kolkata|IN": [22.5726, 88.3639],
  "Pune|IN": [18.5204, 73.8567],
  "Ahmedabad|IN": [23.0225, 72.5714],
  "Jaipur|IN": [26.9124, 75.7873],

  // Brazil
  "Sao Paulo|BR": [-23.5505, -46.6333],
  "Rio de Janeiro|BR": [-22.9068, -43.1729],
  "Brasilia|BR": [-15.7975, -47.8919],
  "Salvador|BR": [-12.9714, -38.5124],
  "Fortaleza|BR": [-3.7172, -38.5433],
  "Belo Horizonte|BR": [-19.9167, -43.9345],
  "Curitiba|BR": [-25.4284, -49.2733],
  "Porto Alegre|BR": [-30.0346, -51.2177],

  // Spain
  "Madrid|ES": [40.4168, -3.7038],
  "Barcelona|ES": [41.3874, 2.1686],
  "Valencia|ES": [39.4699, -0.3763],
  "Seville|ES": [37.3891, -5.9845],
  "Bilbao|ES": [43.2630, -2.9350],
  "Malaga|ES": [36.7213, -4.4214],

  // Italy
  "Rome|IT": [41.9028, 12.4964],
  "Milan|IT": [45.4642, 9.1900],
  "Naples|IT": [40.8518, 14.2681],
  "Turin|IT": [45.0703, 7.6869],
  "Florence|IT": [43.7696, 11.2558],
  "Bologna|IT": [44.4949, 11.3426],

  // China
  "Beijing|CN": [39.9042, 116.4074],
  "Shanghai|CN": [31.2304, 121.4737],
  "Guangzhou|CN": [23.1291, 113.2644],
  "Shenzhen|CN": [22.5431, 114.0579],
  "Chengdu|CN": [30.5728, 104.0668],
  "Hangzhou|CN": [30.2741, 120.1551],

  // South Korea
  "Seoul|KR": [37.5665, 126.9780],
  "Busan|KR": [35.1796, 129.0756],
  "Incheon|KR": [37.4563, 126.7052],

  // Russia
  "Moscow|RU": [55.7558, 37.6173],
  "Saint Petersburg|RU": [59.9343, 30.3351],
  "Novosibirsk|RU": [55.0084, 82.9357],

  // Mexico
  "Mexico City|MX": [19.4326, -99.1332],
  "Guadalajara|MX": [20.6597, -103.3496],
  "Monterrey|MX": [25.6866, -100.3161],

  // Sweden
  "Stockholm|SE": [59.3293, 18.0686],
  "Gothenburg|SE": [57.7089, 11.9746],
  "Malmo|SE": [55.6050, 13.0038],

  // Norway
  "Oslo|NO": [59.9139, 10.7522],
  "Bergen|NO": [60.3913, 5.3221],

  // Denmark
  "Copenhagen|DK": [55.6761, 12.5683],
  "Aarhus|DK": [56.1629, 10.2039],

  // Finland
  "Helsinki|FI": [60.1699, 24.9384],
  "Tampere|FI": [61.4978, 23.7610],

  // Poland
  "Warsaw|PL": [52.2297, 21.0122],
  "Krakow|PL": [50.0647, 19.9450],
  "Wroclaw|PL": [51.1079, 17.0385],
  "Gdansk|PL": [54.3520, 18.6466],

  // Switzerland
  "Zurich|CH": [47.3769, 8.5417],
  "Geneva|CH": [46.2044, 6.1432],
  "Bern|CH": [46.9480, 7.4474],
  "Basel|CH": [47.5596, 7.5886],

  // Austria
  "Vienna|AT": [48.2082, 16.3738],
  "Graz|AT": [47.0707, 15.4395],
  "Salzburg|AT": [47.8095, 13.0550],

  // Belgium
  "Brussels|BE": [50.8503, 4.3517],
  "Antwerp|BE": [51.2194, 4.4025],
  "Ghent|BE": [51.0543, 3.7174],

  // Portugal
  "Lisbon|PT": [38.7223, -9.1393],
  "Porto|PT": [41.1579, -8.6291],

  // Ireland
  "Dublin|IE": [53.3498, -6.2603],
  "Cork|IE": [51.8985, -8.4756],

  // Turkey
  "Istanbul|TR": [41.0082, 28.9784],
  "Ankara|TR": [39.9334, 32.8597],
  "Izmir|TR": [38.4237, 27.1428],

  // Israel
  "Tel Aviv|IL": [32.0853, 34.7818],
  "Jerusalem|IL": [31.7683, 35.2137],

  // United Arab Emirates
  "Dubai|AE": [25.2048, 55.2708],
  "Abu Dhabi|AE": [24.4539, 54.3773],

  // Singapore
  "Singapore|SG": [1.3521, 103.8198],

  // South Africa
  "Cape Town|ZA": [-33.9249, 18.4241],
  "Johannesburg|ZA": [-26.2041, 28.0473],

  // Argentina
  "Buenos Aires|AR": [-34.6037, -58.3816],
  "Cordoba|AR": [-31.4201, -64.1888],

  // Colombia
  "Bogota|CO": [4.7110, -74.0721],
  "Medellin|CO": [6.2442, -75.5812],

  // Chile
  "Santiago|CL": [-33.4489, -70.6693],

  // New Zealand
  "Auckland|NZ": [-36.8485, 174.7633],
  "Wellington|NZ": [-41.2865, 174.7762],

  // Thailand
  "Bangkok|TH": [13.7563, 100.5018],

  // Indonesia
  "Jakarta|ID": [-6.2088, 106.8456],

  // Philippines
  "Manila|PH": [14.5995, 120.9842],

  // Vietnam
  "Ho Chi Minh City|VN": [10.8231, 106.6297],
  "Hanoi|VN": [21.0278, 105.8342],

  // Malaysia
  "Kuala Lumpur|MY": [3.1390, 101.6869],

  // Egypt
  "Cairo|EG": [30.0444, 31.2357],

  // Nigeria
  "Lagos|NG": [6.5244, 3.3792],

  // Kenya
  "Nairobi|KE": [-1.2921, 36.8219],

  // Romania
  "Bucharest|RO": [44.4268, 26.1025],

  // Czech Republic
  "Prague|CZ": [50.0755, 14.4378],

  // Hungary
  "Budapest|HU": [47.4979, 19.0402],

  // Greece
  "Athens|GR": [37.9838, 23.7275],

  // Ukraine
  "Kyiv|UA": [50.4501, 30.5234],

  // Taiwan
  "Taipei|TW": [25.0330, 121.5654],

  // Hong Kong
  "Hong Kong|HK": [22.3193, 114.1694],
};
