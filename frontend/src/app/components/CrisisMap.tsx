"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customIcon = (severity: string) => new L.Icon({
  iconUrl: severity === 'Critical' 
    ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png' 
    : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface GroupedCluster {
  cluster_id: number;
  category: string;
  severity: string;
  latitude: number;
  longitude: number;
  latestText: string;
  reportCount: number;
}

function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center]);
  return null;
}

interface CrisisMapProps {
  currentMapCenter: [number, number];
  groupedData: GroupedCluster[];
}

export default function CrisisMap({ currentMapCenter, groupedData }: CrisisMapProps) {
  return (
    <MapContainer 
      center={currentMapCenter} 
      zoom={13} 
      style={{ width: '100%', height: '100%', background: '#0f172a' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <MapRecenter center={currentMapCenter} />

      {groupedData.map((cluster) => (
        <Marker 
          key={cluster.cluster_id} 
          position={[cluster.latitude, cluster.longitude]}
          icon={customIcon(cluster.severity)}
        >
          <Popup>
            <div className="text-slate-900 p-1 font-sans">
              <div className="font-bold border-b pb-1 mb-1 text-xs">{cluster.category} Event</div>
              <div className="text-[11px] italic text-slate-600 mb-1">"{cluster.latestText}"</div>
              <div className="text-[10px] font-bold text-blue-600">Unified Group Reports: {cluster.reportCount}</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}