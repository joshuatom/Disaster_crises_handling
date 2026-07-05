"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// 🚀 Explicit dynamic type properties mapped to your exact folder layout
const CrisisMap = dynamic<{
  currentMapCenter: [number, number];
  groupedData: any[];
}>(() => import('./components/CrisisMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3 border border-slate-800 rounded-2xl">
      <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-xs font-mono tracking-widest uppercase opacity-70">Initializing Satellite Arrays...</span>
    </div>
  ),
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

export default function CrisisDashboard() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  const [reports, setReports] = useState<Report[]>([]);
  const [inputText, setInputText] = useState("");
  const [lat, setLat] = useState("37.7749"); 
  const [lng, setLng] = useState("-122.4194");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReports = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/reports`);
      if (!res.ok) throw new Error('Failed to fetch backend data');
      const data = await res.json();
      setReports(data);
      setError(null);
    } catch (err) {
      setError("OFFLINE");
    }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 3000);
    return () => clearInterval(interval);
  }, [BACKEND_URL]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setIsSubmitting(true);

    try {
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
      alert("Submission failed. API Node unreachable.");
    } finally {
      setIsSubmitting(false);
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
    <div className="flex flex-col h-screen bg-[#090d16] text-slate-100 font-sans antialiased selection:bg-red-500/30 selection:text-red-200">
      
      {/* 🚀 Futuristic Glass Header */}
      <header className="bg-slate-950/60 backdrop-blur-md border-b border-slate-800/60 px-6 py-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </div>
          <h1 className="text-lg font-bold tracking-wider font-mono text-slate-200 bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
            CRISISNET // <span className="text-red-500 font-extrabold">INTEL ENGINE</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {error ? (
            <span className="text-[10px] font-mono tracking-wider font-bold text-red-400 bg-red-950/40 px-2.5 py-1 rounded-md border border-red-900/50 animate-pulse">
              ⚠️ SYSTEM {error}
            </span>
          ) : (
            <span className="text-[10px] font-mono tracking-wider font-bold text-emerald-400 bg-emerald-950/30 px-2.5 py-1 rounded-md border border-emerald-900/40">
              🟢 SYSTEM ONLINE
            </span>
          )}
          <div className="text-xs font-mono bg-slate-900/80 px-3 py-1 rounded-md border border-slate-800 text-slate-400">
            HOTSPOTS: <span className="text-slate-200 font-bold">{groupedData.length}</span>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex flex-1 overflow-hidden p-4 gap-4">
        
        {/* 🚀 Sleek Control Sidebar */}
        <div className="w-96 bg-slate-950/40 backdrop-blur-md border border-slate-800/50 rounded-2xl p-5 flex flex-col gap-5 overflow-y-auto z-40 shadow-2xl shadow-black/40">
          <div>
            <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <span>⚡</span> Ingest Incident Feed
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste multi-source citizen data, SMS reports, or emergency tweets..."
                  className="w-full h-28 bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-sm focus:outline-none focus:border-red-500/80 focus:ring-2 focus:ring-red-950/50 transition-all duration-200 resize-none placeholder:text-slate-600 text-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono tracking-wider uppercase text-slate-500 pl-1">Latitude</label>
                  <input type="text" value={lat} onChange={(e) => setLat(e.target.value)} className="bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-slate-700 font-mono" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono tracking-wider uppercase text-slate-500 pl-1">Longitude</label>
                  <input type="text" value={lng} onChange={(e) => setLng(e.target.value)} className="bg-slate-900/60 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-slate-700 font-mono" />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 active:scale-[0.99] font-semibold tracking-wider py-2.5 rounded-xl text-xs uppercase text-white transition-all duration-200 shadow-lg shadow-red-950/20 disabled:opacity-50"
              >
                {isSubmitting ? "Processing Metrics..." : "Analyze & Vector Map"}
              </button>
            </form>
          </div>

          <hr className="border-slate-800/60" />

          {/* 🚀 Active Deduplicated Log List */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <span>📋</span> Core Consolidated Matrix
            </h2>
            <div className="flex flex-col gap-2 overflow-y-auto pr-1 flex-1 scrollbar-thin scrollbar-thumb-slate-800">
              {groupedData.length === 0 ? (
                <div className="text-center text-xs font-mono text-slate-600 p-8 border border-dashed border-slate-800/80 rounded-xl bg-slate-950/20">
                  No tracking vectors active. Ingest event intelligence parameters.
                </div>
              ) : (
                groupedData.map((cluster) => {
                  const isCritical = cluster.severity === 'Critical';
                  const isHigh = cluster.severity === 'High';
                  
                  return (
                    <div 
                      key={cluster.cluster_id} 
                      className={`bg-slate-900/30 backdrop-blur-sm border rounded-xl p-3.5 flex flex-col gap-2 transition-all duration-200 hover:bg-slate-900/50 ${
                        isCritical ? 'border-red-900/40 border-l-4 border-l-red-500' :
                        isHigh ? 'border-orange-900/40 border-l-4 border-l-orange-500' : 'border-slate-800/60 border-l-4 border-l-blue-500'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-200 text-xs tracking-wide">{cluster.category}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            ID: #{cluster.cluster_id} • {cluster.reportCount} linked events
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-black uppercase tracking-wider ${
                          isCritical ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse' :
                          isHigh ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {cluster.severity}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed font-normal bg-black/20 p-2 rounded-lg italic border border-slate-900/40">
                        "{cluster.latestText}"
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 🚀 Right Side Map Area Workspace */}
        <div className="flex-1 bg-[#0c1220]/60 border border-slate-800/40 rounded-2xl overflow-hidden shadow-2xl relative">
          <CrisisMap currentMapCenter={currentMapCenter} groupedData={groupedData} />
        </div>
      </div>
    </div>
  );
}