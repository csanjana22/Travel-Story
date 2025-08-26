import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function StoriesMap({ stories, onStoryClick }) {
  const locations = stories
    .map(story => {
      const visitedLocation = story.visitedLocation;
      if (!visitedLocation || !visitedLocation.name) return null;

      if (visitedLocation.lat && visitedLocation.lng) {
        return [{ ...visitedLocation, storyTitle: story.title, storyData: story }];
      }
      return [];
    })
    .flat()
    .filter(Boolean);

  //Custom Icon
  const customIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // example pin
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -30],
  });

  //Component to auto-fit bounds
  function FitBounds({ locations }) {
    const map = useMap();

    useEffect(() => {
      if (locations.length > 0) {
        const bounds = L.latLngBounds(
          locations.map(loc => [loc.lat, loc.lng])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }, [locations, map]);

    return null;
  }

  const fallbackCenter = [20.5937, 78.9629]; // fallback if no stories

  const handleMarkerClick = (storyData) => {
    if (onStoryClick && storyData) {
      onStoryClick(storyData);
    }
  };

  return (
    <div className="my-8">
      <h2 className="text-xl font-semibold mb-2">Visited Places Map</h2>
      <MapContainer 
        center={fallbackCenter} 
        zoom={4} 
        scrollWheelZoom={false}
        style={{ height: '350px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {locations.map((loc, idx) => (
          <Marker key={idx} position={[loc.lat, loc.lng]} icon={customIcon}>
            <Popup>
              <div className="text-center">
                <strong className="text-sm font-semibold">{loc.storyTitle}</strong><br />
                <span className="text-xs text-gray-600">{loc.name || ''}</span><br />
                <button 
                  className="mt-2 px-3 py-1 bg-cyan-600 text-white text-xs rounded hover:bg-cyan-700 transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMarkerClick(loc.storyData);
                  }}
                >
                  View Story
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/*Auto-fit all markers */}
        <FitBounds locations={locations} />
      </MapContainer>
    </div>
  );
}
