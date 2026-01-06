const OPENSKY_API = "https://opensky-network.org/api/states/all";

const BACKEND_API = "https://react100-hackathon.onrender.com/api/flights";

const US_BOUNDS = {
  north: 49.38, // Northern border (Canada)
  south: 24.52, // Southern border (Florida Keys)
  east: -66.95, // Eastern border (Maine)
  west: -125.0, // Western border (California)
};

const AIRLINE_COLORS = {
  // Major US mainline (each gets its own signature color)
  'UAL': '#ec4899', // United – hot pink
  'AAL': '#dc2626', // American – red
  'DAL': '#9333ea', // Delta – purple
  'SWA': '#f97316', // Southwest – orange
  'JBU': '#10b981', // JetBlue – green
  'ASA': '#f59e0b', // Alaska – yellow
  'FFT': '#14b8a6', // Frontier – turquoise
  'NKS': '#eab308', // Spirit – bright yellow

  // Cargo (darker, industrial tones)
  'FDX': '#7c2d12', // FedEx – brown
  'UPS': '#b91c1c', // UPS – crimson
  'GTI': '#92400e', // Atlas – burnt orange

  // Regionals (lighter, cooler tones)
  'SKW': '#06b6d4', // SkyWest – cyan
  'RPA': '#059669', // Republic – spring green
  'ENY': '#0891b2', // Envoy – deep cyan
  'AWI': '#84cc16', // Air Wisconsin – lime green
  'CPZ': '#3b82f6', // Compass – cornflower blue

  // Military / gov / business (high contrast)
  'MIL': '#991b1b', // Military – blood red
  'GOV': '#d97706', // Government – amber orange
  'BIZ': '#4b5563', // Business / GA – charcoal gray

  // Fallbacks (no blues - warm/neutral)
  'DEFAULT_US': '#c2410c',    // Generic US – rust orange
  'DEFAULT_INTL': '#7c2d12',  // Generic international – mahogany brown
  'DEFAULT': '#6b7280',       // True unknown – slate gray
};

export function getAirlineColor(callsignRaw, origin_country) {
  if (!callsignRaw || callsignRaw === 'N/A') {
    // No callsign; color by country
    return origin_country?.includes('United States')
      ? AIRLINE_COLORS.DEFAULT_US
      : AIRLINE_COLORS.DEFAULT_INTL;
  }

  const callsign = callsignRaw.trim().toUpperCase();
  const code3 = callsign.substring(0, 3);

  // 1) Military / government patterns
  const milPatterns = [/^RCH/, /^SAM/, /^SPAR/, /^VEN/, /^TANK/, /^BULL/, /^EAG/, /^NATO/];
  if (milPatterns.some((re) => re.test(callsign))) {
    return AIRLINE_COLORS.MIL;
  }
  if (origin_country?.includes('United States') && /^AF\d{3,4}/.test(callsign)) {
    return AIRLINE_COLORS.MIL;
  }

  // 2) Known airlines by 3‑letter code
  if (AIRLINE_COLORS[code3]) {
    return AIRLINE_COLORS[code3];
  }

  // 3) Cargo hints
  if (/FDX|FX/.test(callsign)) return AIRLINE_COLORS.FDX;
  if (/UPS/.test(callsign)) return AIRLINE_COLORS.UPS;
  if (/GTI/.test(callsign)) return AIRLINE_COLORS.GTI;

  // 4) US business / GA (tail numbers like N123AB)
  if (/^N\d{1,5}[A-Z]{0,2}$/.test(callsign)) {
    return AIRLINE_COLORS.BIZ;
  }

  // 5) Regional airline patterns in callsigns
  if (/^SKW|^RPA|^ENY|^AWI|^CPZ/.test(callsign)) {
    return AIRLINE_COLORS[code3] || AIRLINE_COLORS.DEFAULT_US;
  }

  // 6) Country-based fallback
  if (origin_country?.includes('United States')) {
    return AIRLINE_COLORS.DEFAULT_US;
  }
  return AIRLINE_COLORS.DEFAULT_INTL;
}


export async function fetchUSFlights() {
  try {
    const { north, south, east, west } = US_BOUNDS;
    const url = `${BACKEND_API}?lamin=${south}&lomin=${west}&lamax=${north}&lomax=${east}`;

    const response = await fetch(url); // no auth headers needed in the browser

    if (!response.ok) {
      throw new Error("Failed to fetch flights");
    }

    const data = await response.json();

    return (
      data.states
        ?.map((state) => ({
          icao24: state[0], // Unique aircraft ID
          callsign: state[1]?.trim() || "N/A", // Flight number
          origin_country: state[2],
          longitude: state[5],
          latitude: state[6],
          altitude: state[7], // meters
          velocity: state[9], // m/s
          heading: state[10], // degrees
          vertical_rate: state[11], // m/s
          on_ground: state[8],
        }))
        .filter(
          (flight) =>
            flight.latitude &&
            flight.longitude &&
            !flight.on_ground &&
            flight.latitude >= US_BOUNDS.south &&
            flight.latitude <= US_BOUNDS.north &&
            flight.longitude >= US_BOUNDS.west &&
            flight.longitude <= US_BOUNDS.east
        ) || []
    );
  } catch (error) {
    console.error("Error fetching flights:", error);
    return [];
  }
}

export function metersToFeet(meters) {
  return Math.round(meters * 3.28084);
}

export function msToKnots(ms) {
  return Math.round(ms * 1.94384);
}
