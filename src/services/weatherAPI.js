const WEATHER_GOV_API = 'https://api.weather.gov';

export async function fetchWeatherAtLocation(lat, lon) {
  try {
    // Get the grid point for the coordinates
    const pointResponse = await fetch(
      `${WEATHER_GOV_API}/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
      {
        headers: {
          'User-Agent': '(FlightWeatherTracker)' // Required by NWS
        }
      }
    );
    
    if (!pointResponse.ok) {
      throw new Error('Location outside US coverage');
    }
    
    const pointData = await pointResponse.json();
    
    // Get the observation stations
    const observationUrl = pointData.properties.observationStations;
    
    const stationsResponse = await fetch(observationUrl, {
      headers: {
        'User-Agent': '(FlightWeatherTracker)'
      }
    });
    const stationsData = await stationsResponse.json();
    const stationId = stationsData.features[0]?.id;
    
    if (!stationId) {
      throw new Error('No weather station found');
    }
    
    // Get current observations
    const obsResponse = await fetch(`${stationId}/observations/latest`, {
      headers: {
        'User-Agent': '(FlightWeatherTracker)'
      }
    });
    const obsData = await obsResponse.json();
    const obs = obsData.properties;
    
    // Convert to more usable format
    return {
      temp: obs.temperature.value ? celsiusToFahrenheit(obs.temperature.value) : null,
      description: obs.textDescription || 'N/A',
      humidity: obs.relativeHumidity.value || null,
      wind_speed: obs.windSpeed.value ? kphToMph(obs.windSpeed.value) : null,
      wind_deg: obs.windDirection.value || null,
      visibility: obs.visibility.value ? (obs.visibility.value / 1000).toFixed(1) : null, // meters to km
      pressure: obs.barometricPressure.value || null,
      dewpoint: obs.dewpoint.value ? celsiusToFahrenheit(obs.dewpoint.value) : null,
      station: obs.station,
      timestamp: obs.timestamp
    };
    
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

// Helper functions
function celsiusToFahrenheit(celsius) {
  return Math.round((celsius * 9/5) + 32);
}

function kphToMph(kph) {
  return Math.round(kph * 0.621371);
}

// Cache weather data to reduce API calls
const weatherCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export async function fetchWeatherCached(lat, lon) {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const cached = weatherCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const weather = await fetchWeatherAtLocation(lat, lon);
  
  if (weather) {
    weatherCache.set(key, {
      data: weather,
      timestamp: Date.now()
    });
  }
  
  return weather;
}