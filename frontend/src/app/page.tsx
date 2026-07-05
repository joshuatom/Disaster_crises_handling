"use client";

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for missing default Leaflet marker graphics icon assets in Next.js builds
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

interface Report {
  id: number;
  text: string;
  latitude: number;
  longitude: number;
  category: string;
  severity: string;
  cluster_id: number;
}

interface GroupedCluster {
  cluster_id: number;
  category: string;
  severity: string;
  latitude: number;
  longitude: number;
  latestText: string;
  reportCount: number;
}

// Simple internal helper component to automatically pan/zoom the map view frame when new items load
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center]);
  return null;
}

export default function CrisisDashboard() {
  // 🔗 DYNAMIC BACKEND PRODUCTION ROUTER
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  const [reports, setReports] = useState<Report[]>([]);
  const [inputText, setInputText] = useState("");
  const [lat, setLat] = useState("37.7749"); // Defaults map focus on San Francisco center grid
  const [lng, setLng] = useState("-122.4194");
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      // 🔄 Uses dynamic cloud URL routing
      const res = await fetch(`${BACKEND_URL}/api/reports`);
      if (!res.ok) throw new Error('Failed to fetch backend data');
      const data = await res.json();
      setReports(data);
      setError(null);
    } catch (err) {
      setError("Backend disconnected. Make sure backend engine is running!");
    }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      // 🔄 Uses dynamic cloud URL routing for post requests
      const response = await fetch(`${BACKEND_URL}/api/reports/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          latitude: parseFloat(lat),
          longitude: parseFloat(lng)
        })
      });

      if (response.ok) {
        setInputText("");
        fetchReports();
      }
    } catch (err) {
      alert("Submission error. Is backend online?");
    }
  };

  const getGroupedClusters = (): GroupedCluster[] => {
    const clusters: { [key: number]: GroupedCluster } = {};
    reports.forEach((report) => {
      if (!clusters[report.cluster_id]) {
        clusters[report.cluster_id] = {
          cluster_id: report.cluster_id,
          category: report.category,
          severity: report.severity,
          latitude: report.latitude,
          longitude: report.longitude,
          latestText: report.text,
          reportCount: 1,
        };
      } else {
        clusters[report.cluster_id].reportCount += 1;
        clusters[report.cluster_id].latestText = report.text;
      }
    });
    return Object.values(clusters).reverse();
  };

  const groupedData = getGroupedClusters();
  const currentMapCenter: [number, number] = [parseFloat(lat), parseFloat(lng)];

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Visual Header */}
      <header className="bg-slate-950 border-b border-slate-800 p-4 flex justify-between items-center z-50">
        <h1 className="text-xl font-bold tracking-tight text-red-500 flex items-center gap-2">
          🚨 CRISIS-NET // Crowdsourced AI Intelligence
        </h1>
        <div className="flex items-center gap-4">
          {error && <span className="text-xs text-red-400 bg-red-950/50 px-2 py-1 rounded border border-red-900 animate-pulse">{error}</span>}
          <div className="text-xs bg-slate-800 px-3 py-1 rounded text-slate-400">
            Active Event Hotspots: {groupedData.length}
          </div>
        </div>
      </header>

      {/* Main Framework Body workspace split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Data Panel Menu elements layout */}
        <div className="w-96 bg-slate-950 p-6 border-r border-slate-800 flex flex-col gap-6 overflow-y-auto z-40">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Simulate Incoming Report</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste citizen report, Tweet, SMS text here..."
                className="w-full h-24 bg-slate-900 border border-slate-700 rounded p-2 text-sm focus:outline-none focus:border-red-500 resize-none text-white"
              />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude" className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white focus:outline-none" />
                <input type="text" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Longitude" className="bg-slate-900 border border-slate-700 rounded p-2 text-xs text-white focus:outline-none" />
              </div>
              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 font-medium py-2 rounded text-sm transition">
                Process via AI Engine
              </button>
            </form>
          </div>

          <hr className="border-slate-800" />

          {/* Aggregated Log list segment */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Deduplicated Feeds</h2>
            <div className="flex flex-col gap-2 overflow-y-auto pr-1 flex-1">
              {groupedData.length === 0 ? (
                <div className="text-center text-xs text-slate-600 p-8 border border-dashed border-slate-800 rounded">
                  No spatial tracking nodes active. Ingest metrics data.
                </div>
              ) : (
                groupedData.map((cluster) => (
                  <div key={cluster.cluster_id} className="bg-slate-900 border border-slate-800 rounded p-3 text-xs flex flex-col gap-1.5 border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-300">{cluster.category}</span>
                        <span className="bg-blue-950 text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {cluster.reportCount} Reports
                        </span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        cluster.severity === 'Critical' ? 'bg-red-950 text-red-400 border border-red-800' :
                        cluster.severity === 'High' ? 'bg-orange-950 text-orange-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {cluster.severity}
                      </span>
                    </div>
                    <p className="text-slate-400 leading-relaxed italic">"{cluster.latestText}"</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side Map Workspace View */}
        <div className="flex-1 bg-slate-900 p-6 relative z-10">
          <div className="w-full h-full border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative">
            
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

          </div>
        </div>
      </div>
    </div>
  );
}