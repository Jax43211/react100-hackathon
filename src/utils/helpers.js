import L from "leaflet";

// Icon cache at module level
const iconCache = new Map();

export function createPlaneIcon(heading = 0, color = '#2563eb') {
  // Round heading to nearest 15° to reduce unique icons
  const roundedHeading = Math.round(heading / 15) * 15;
  const cacheKey = `${roundedHeading}-${color}`;
  
  // Return cached icon if exists
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey);
  }

  const planeSVG = `
    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(${roundedHeading} 16 16)">
        <path d="M16 2 L18 14 L24 14 L24 18 L18 18 L16 30 L14 30 L12 18 L6 18 L6 14 L12 14 L14 2 Z" 
              fill="${color}" stroke="#1e40af" stroke-width="1"/>
      </g>
    </svg>
  `;

  const icon = L.divIcon({
    html: planeSVG,
    className: "plane-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  // Cache for reuse (limit cache size)
  if (iconCache.size < 100) {
    iconCache.set(cacheKey, icon);
  }

  return icon;
}