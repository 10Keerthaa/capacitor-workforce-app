"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '@/lib/supabase';

// Fix for default Leaflet icon missing in Next.js
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function LiveMap() {
  const [tools, setTools] = useState<any[]>([]);

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
        {/* Sleek Dark Mode Map Tiles to match the dashboard aesthetic */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {tools.map((tool) => (
          <Marker 
            key={tool.id} 
            position={[tool.latitude, tool.longitude]}
            icon={customIcon}
          >
            <Popup>
              <div className="font-sans min-w-[150px]">
                <strong className="text-gray-900 block text-sm mb-1">{tool.itemName}</strong>
                <p className="text-gray-600 text-xs m-0 mb-1"><strong>Tag:</strong> {tool.tagName}</p>
                <p className="text-gray-600 text-xs m-0 mb-1"><strong>Assigned To:</strong> {tool.assignedTo}</p>
                <p className={`text-xs m-0 font-bold ${tool.condition === 'Good' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  Condition: {tool.condition}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
