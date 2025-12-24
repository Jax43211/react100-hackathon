export default function WeatherPanel({ weather, flight }) {
  if (!weather) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg max-w-sm">
        <p className="text-gray-500">Select a flight to see weather</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg max-w-sm">
      <h2 className="text-xl font-bold mb-3">Weather Conditions</h2>
      
      {flight && (
        <div className="mb-3 pb-3 border-b">
          <p className="text-lg font-semibold">{flight.callsign}</p>
          <p className="text-sm text-gray-600">
            {flight.latitude.toFixed(2)}°, {flight.longitude.toFixed(2)}°
          </p>
        </div>
      )}
      
      <div className="space-y-3">
        <div>
          <p className="text-3xl font-bold">{weather.temp}°F</p>
          <p className="text-sm text-gray-600 capitalize">{weather.description}</p>
          <p className="text-xs text-gray-500 mt-1">
            Source: National Weather Service
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          {weather.humidity && (
            <div>
              <p className="text-gray-600">Humidity</p>
              <p className="font-semibold">{Math.round(weather.humidity)}%</p>
            </div>
          )}
          
          {weather.dewpoint && (
            <div>
              <p className="text-gray-600">Dewpoint</p>
              <p className="font-semibold">{weather.dewpoint}°F</p>
            </div>
          )}
          
          {weather.wind_speed && (
            <div>
              <p className="text-gray-600">Wind Speed</p>
              <p className="font-semibold">{weather.wind_speed} mph</p>
            </div>
          )}
          
          {weather.wind_deg && (
            <div>
              <p className="text-gray-600">Wind Dir</p>
              <p className="font-semibold">{weather.wind_deg}°</p>
            </div>
          )}
          
          {weather.visibility && (
            <div>
              <p className="text-gray-600">Visibility</p>
              <p className="font-semibold">{weather.visibility} km</p>
            </div>
          )}
          
          {weather.pressure && (
            <div>
              <p className="text-gray-600">Pressure</p>
              <p className="font-semibold">{Math.round(weather.pressure)} Pa</p>
            </div>
          )}
        </div>
        
        {/* Weather Alerts */}
        {weather.wind_speed && weather.wind_speed > 25 && (
          <div className="p-2 bg-yellow-100 border border-yellow-400 rounded">
            <p className="text-sm text-yellow-800 font-semibold">
              ⚠️ High Wind Warning
            </p>
          </div>
        )}
        
        {weather.visibility && parseFloat(weather.visibility) < 5 && (
          <div className="p-2 bg-orange-100 border border-orange-400 rounded">
            <p className="text-sm text-orange-800 font-semibold">
              ⚠️ Low Visibility
            </p>
          </div>
        )}
      </div>
      
      {weather.timestamp && (
        <p className="text-xs text-gray-400 mt-3">
          Updated: {new Date(weather.timestamp).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}