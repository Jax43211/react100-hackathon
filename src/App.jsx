import MapComponent from "./components/Map";

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-blue-900 via-blue-800 to-blue-900 p-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">
          US Flight Weather Tracker
        </h1>
        <p className="text-blue-200">
          Real-time aviation weather monitoring • National Weather Service data
        </p>
      </div>

      {/* Map Container */}
      <div
        className="w-full max-w-7xl rounded-xl shadow-2xl overflow-hidden border-2 border-blue-400"
        style={{ height: "75vh" }} // Explicit height
      >
        <MapComponent />
      </div>

      {/* Footer */}
      <div className="mt-4 text-center text-blue-200 text-sm">
        <p>Data: OpenSky Network • Weather: NOAA National Weather Service</p>
      </div>
    </div>
  );
}

export default App;
