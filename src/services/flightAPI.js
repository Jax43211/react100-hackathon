const OPENSKY_API = "https://opensky-network.org/api/states/all";

const US_BOUNDS = {
  north: 49.38, // Northern border (Canada)
  south: 24.52, // Southern border (Florida Keys)
  east: -66.95, // Eastern border (Maine)
  west: -125.0, // Western border (California)
};

export async function fetchUSFlights() {
  try {
    const { north, south, east, west } = US_BOUNDS;
    const url = `${OPENSKY_API}?lamin=${south}&lomin=${west}&lamax=${north}&lomax=${east}`;

    const response = await fetch(url);

    if (!response.ok) throw new Error("Failed to fetch flights");

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
