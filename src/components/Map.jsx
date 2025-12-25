import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  fetchUSFlights,
  metersToFeet,
  msToKnots,
  getAirlineColor,
} from "../services/flightAPI";
import { createPlaneIcon } from "../utils/helpers";
import "leaflet/dist/leaflet.css";
import { fetchWeatherCached } from "../services/weatherAPI";
import WeatherPanel from "./WeatherPanel";

function throttle(func, delay) {
  let timeoutId;
  let lastRan;
  return function (...args) {
    if (!lastRan) {
      func.apply(this, args);
      lastRan = Date.now();
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (Date.now() - lastRan >= delay) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, delay - (Date.now() - lastRan));
    }
  };
}

const MapComponent = ({ onFlightsUpdate, filteredFlights }) => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef(new Map());

  // Use filtered flights if searching, otherwise all flights
  const displayedFlights = filteredFlights !== null ? filteredFlights : flights;

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    // Create map
    mapInstance.current = L.map(mapContainer.current, {
      minZoom: 4,
      maxZoom: 10,
      preferCanvas: true,
    }).setView([39.8283, -98.5795], 5);

    // Add tile layer with performance optimizations
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
      updateWhenIdle: true,
      updateWhenZooming: false,
      keepBuffer: 2,
    }).addTo(mapInstance.current);

    // Mark map as ready when tiles load
    mapInstance.current.whenReady(() => {
      setMapReady(true);
    });

    mapInstance.current.on("click", () => {
      setSelectedFlight(null);
      setWeather(null);
      setLoadingWeather(false);

      // Close any open popups
      mapInstance.current.eachLayer((layer) => {
        if (layer.closePopup) {
          layer.closePopup();
        }
      });
    });

    // Cleanup on unmount
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Fetch flights periodically
  useEffect(() => {
    const fetchFlights = async () => {
      setLoading(true);
      const flightData = await fetchUSFlights();
      setFlights(flightData);

      // Send flights up to App.jsx for SearchBar
      if (onFlightsUpdate) {
        onFlightsUpdate(flightData);
      }

      setLoading(false);
    };

    fetchFlights();
    const interval = setInterval(fetchFlights, 30000);

    return () => clearInterval(interval);
  }, [onFlightsUpdate]);

  // Smart marker updates - only update what changed
  useEffect(() => {
    if (!mapInstance.current) return;

    const updateMarkers = () => {
      const currentMarkers = markersRef.current;
      const newFlightIds = new Set(displayedFlights.map((f) => f.icao24));

      // Remove markers for flights that are no longer present
      currentMarkers.forEach((marker, icao24) => {
        if (!newFlightIds.has(icao24)) {
          marker.remove();
          currentMarkers.delete(icao24);
        }
      });

      // Batch DOM operations using requestAnimationFrame
      requestAnimationFrame(() => {
        displayedFlights.forEach((flight) => {
          const existingMarker = currentMarkers.get(flight.icao24);

          if (existingMarker) {
            // Update existing marker
            existingMarker.setLatLng([flight.latitude, flight.longitude]);
            existingMarker.setIcon(
              createPlaneIcon(
                flight.heading,
                getAirlineColor(flight.callsign, flight.origin_country)
              )
            );

            if (existingMarker.isPopupOpen()) {
              existingMarker.setPopupContent(createPopupContent(flight));
            }
          } else {
            // Create new marker
            const marker = L.marker([flight.latitude, flight.longitude], {
              icon: createPlaneIcon(
                flight.heading,
                getAirlineColor(flight.callsign, flight.origin_country)
              ),
              riseOnHover: true,
            }).addTo(mapInstance.current);

            marker.on("click", async () => {
              setSelectedFlight(flight);
              setLoadingWeather(true);
              marker.bindPopup(createPopupContent(flight)).openPopup();

              const weatherData = await fetchWeatherCached(
                flight.latitude,
                flight.longitude
              );
              setWeather(weatherData);
              setLoadingWeather(false);
            });

            currentMarkers.set(flight.icao24, marker);
          }
        });
      });
    };

    // Throttle updates to max once per 500ms
    const throttledUpdate = throttle(updateMarkers, 500);
    throttledUpdate();
  }, [displayedFlights]);

  // Helper function to create popup HTML
  const createPopupContent = (flight) => {
    const color = getAirlineColor(flight.callsign, flight.origin_country);
    const airlineEmoji =
      flight.callsign.startsWith("RCH") ||
      flight.callsign.match(/^(FOR|TANK|VIP)/)
        ? "🛫⚔️"
        : "✈️";

    return `
      <div class="text-sm">
        <div class="flex items-center mb-2">
          <span class="text-2xl mr-2">${airlineEmoji}</span>
          <h3 class="font-bold text-lg" style="color: ${color}">${
      flight.callsign
    }</h3>
        </div>
        <p><strong>Country:</strong> ${flight.origin_country}</p>
        <p><strong>Altitude:</strong> ${metersToFeet(flight.altitude)} ft</p>
        <p><strong>Speed:</strong> ${msToKnots(flight.velocity)} knots</p>
        <p><strong>Heading:</strong> ${Math.round(flight.heading)}°</p>      
      </div>
    `;
  };

  return (
    <div className="relative w-full h-full">
      {/* Loading skeleton */}
      {!mapReady && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center z-999">
          <div className="text-center">
            <div className="text-4xl mb-4">🗺️</div>
            <p className="text-gray-600 font-semibold">Loading map...</p>
          </div>
        </div>
      )}

      {/* Map container */}
      <div ref={mapContainer} className="w-full h-full"></div>

      {/* Flight counter overlay */}
      <div className="absolute top-4 left-4 z-1000 bg-white p-3 rounded-lg shadow-lg">
        <p className="text-sm font-semibold">
          🛫{" "}
          {filteredFlights !== null ? (
            <>
              Showing {displayedFlights.length} of {flights.length} flights
            </>
          ) : (
            <>Tracking {displayedFlights.length} flights over US</>
          )}
          {loading && <span className="text-blue-500 ml-2">• Updating...</span>}
        </p>
      </div>

      {/* Weather Panel */}
      <div className="absolute top-4 right-4 z-1000">
        {loadingWeather ? (
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <p className="text-gray-600">Loading weather...</p>
          </div>
        ) : (
          <WeatherPanel weather={weather} flight={selectedFlight} />
        )}
      </div>
    </div>
  );
};

export default MapComponent;
