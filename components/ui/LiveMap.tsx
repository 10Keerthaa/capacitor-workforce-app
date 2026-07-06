"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { supabase } from '@/lib/supabase';

// Map resizer component to fix the "blank map" issue when switching tabs
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    // Delay slightly to ensure layout has settled before invalidating size
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

export default function LiveMap() {
  const [tools, setTools] = useState<any[]>([]);
  const [icon, setIcon] = useState<any>(null);

  useEffect(() => {
    // Dynamically import Leaflet strictly on the client side
    import('leaflet').then((L) => {
      const customIcon = new L.default.Icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      setIcon(customIcon);
    });
  }, []);

  useEffect(() => {
    const fetchTools = async () => {
      // Only fetch tools that have GPS coordinates
      const { data } = await supabase
        .from('tools_management')
        .select('*')
        .not('latitude', 'is', null);
      if (data) {
        setTools(data);
      }
    };
    fetchTools();
  }, []);

  // Center on Dubai
  const center: [number, number] = [25.2048, 55.2708];

  return (
    <div className="w-full h-[600px] rounded-2xl overflow-hidden border border-[#222] shadow-[0_0_30px_rgba(0,0,0,0.5)] z-0 relative">
      <MapContainer 
        center={center} 
        zoom={11} 
        style={{ height: '100%', width: '100%', background: '#0a0a0a', zIndex: 0 }}
      >
        <MapResizer />
        {/* Satellite Map Tiles for construction sites */}
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        {icon && tools.map((tool) => {
          const lat = parseFloat(tool.latitude);
          const lng = parseFloat(tool.longitude);
          
          // Skip rendering marker if coordinates are invalid
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker 
              key={tool.id} 
              position={[lat, lng]}
              icon={icon}
            >
              <Popup>
                <div className="font-sans min-w-[150px]">
                  <strong className="text-gray-900 block text-sm mb-1">{tool.itemName}</strong>
                  {tool.siteName && <p className="text-gray-800 text-xs font-bold m-0 mb-1">📍 {tool.siteName}</p>}
                  <p className="text-gray-600 text-xs m-0 mb-1"><strong>Tag:</strong> {tool.tagName}</p>
                  <p className="text-gray-600 text-xs m-0 mb-1"><strong>Assigned To:</strong> {tool.assignedTo}</p>
                  <p className={`text-xs m-0 font-bold ${tool.condition === 'Good' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    Condition: {tool.condition}
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
