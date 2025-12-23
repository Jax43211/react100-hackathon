import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { fetchUSFlights, metersToFeet, msToKnots } from "../services/flightAPI";
import { createPlaneIcon } from "../utils/helpers";
import "leaflet/dist/leaflet.css";

const MapComponent = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef(new Map());

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    // Create map
    mapInstance.current = L.map(mapContainer.current, {
      minZoom: 4,
      maxZoom: 10,
      preferCanvas: true, // Use canvas for better performance
    }).setView([39.8283, -98.5795], 5); // Center on US

    // Add tile layer with performance optimizations
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
      updateWhenIdle: true, // Only update tiles when map stops moving
      updateWhenZooming: false, // Don't update while zooming
      keepBuffer: 2, // Keep tiles in buffer for smoother panning
    }).addTo(mapInstance.current);

    // Mark map as ready when tiles load
    mapInstance.current.whenReady(() => {
      setMapReady(true);
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
      setLoading(false);
    };

    fetchFlights();
    const interval = setInterval(fetchFlights, 120000);

    return () => clearInterval(interval);
  }, []);

  // Smart marker updates - only update what changed
  useEffect(() => {
    if (!mapInstance.current) return;

    const currentMarkers = markersRef.current;
    const newFlightIds = new Set(flights.map((f) => f.icao24));

    // Remove markers for flights that are no longer present
    currentMarkers.forEach((marker, icao24) => {
      if (!newFlightIds.has(icao24)) {
        marker.remove();
        currentMarkers.delete(icao24);
      }
    });

    // Update or add markers
    flights.forEach((flight) => {
      const existingMarker = currentMarkers.get(flight.icao24);

      if (existingMarker) {
        // Update existing marker position and icon
        existingMarker.setLatLng([flight.latitude, flight.longitude]);
        existingMarker.setIcon(createPlaneIcon(flight.heading));

        // Update popup content (only if popup is open to avoid lag)
        if (existingMarker.isPopupOpen()) {
          existingMarker.setPopupContent(createPopupContent(flight));
        }
      } else {
        // Create new marker
        const marker = L.marker([flight.latitude, flight.longitude], {
          icon: createPlaneIcon(flight.heading),
          riseOnHover: true,
        }).addTo(mapInstance.current);

        // Bind popup (lazy load content on click)
        marker.on("click", () => {
          marker.bindPopup(createPopupContent(flight)).openPopup();
        });

        currentMarkers.set(flight.icao24, marker);
      }
    });
  }, [flights]);

  // Helper function to create popup HTML
  const createPopupContent = (flight) => {
    return `
      <div class="text-sm">
        <h3 class="font-bold text-lg">${flight.callsign}</h3>
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
          🛫 Tracking {flights.length} flights over US
          {loading && <span className="text-blue-500 ml-2">• Updating...</span>}
        </p>
      </div>
    </div>
  );
};

export default MapComponent;
