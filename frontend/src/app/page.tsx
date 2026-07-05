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
    <div className="w-full h-full bg-gradient-to-br from-orange-50 to-amber-100 flex flex-col items-center justify-center text-amber-700 gap-3 border border-amber-200 rounded-2xl transition-opacity duration-500">
      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
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
    <div className="flex flex-col h-screen bg-gradient-to-br from-[#1f1410] via-[#2b1b12] to-[#1a1310] text-amber-50 font-sans antialiased selection:bg-orange-500/30 selection:text-orange-100 transition-colors duration-500">

      {/* Warm glass header */}
      <header className="bg-[#2b1b12]/70 backdrop-blur-md border-b border-orange-900/30 px-6 py-4 flex justify-between items-center z-50 transition-colors duration-500">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
          </div>
          <h1 className="text-lg font-bold tracking-wider font-mono text-amber-100 bg-gradient-to-r from-amber-100 via-orange-200 to-yellow-200 bg-clip-text text-transparent">
            CRISISNET // <span className="text-orange-400 font-extrabold">INTEL ENGINE</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {error ? (
            <span className="text-[10px] font-mono tracking-wider font-bold text-rose-300 bg-rose-950/40 px-2.5 py-1 rounded-md border border-rose-800/50 animate-pulse transition-all duration-300">
              ⚠️ SYSTEM {error}
            </span>
          ) : (
            <span className="text-[10px] font-mono tracking-wider font-bold text-emerald-300 bg-emerald-900/30 px-2.5 py-1 rounded-md border border-emerald-700/40 transition-all duration-300">
              🟢 SYSTEM ONLINE
            </span>
          )}
          <div className="text-xs font-mono bg-[#332217]/80 px-3 py-1 rounded-md border border-orange-900/40 text-amber-200/80 transition-colors duration-300">
            HOTSPOTS: <span className="text-amber-100 font-bold">{groupedData.length}</span>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex flex-1 overflow-hidden p-4 gap-4">

        {/* Warm control sidebar */}
        <div className="w-96 bg-[#2b1b12]/40 backdrop-blur-md border border-orange-900/30 rounded-2xl p-5 flex flex-col gap-5 overflow-y-auto z-40 shadow-2xl shadow-black/40 transition-colors duration-500">
          <div>
            <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-amber-300/80 mb-3 flex items-center gap-2">
              <span>⚡</span> Ingest Incident Feed
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste multi-source citizen data, SMS reports, or emergency tweets..."
                  className="w-full h-28 bg-[#20140e]/60 border border-orange-900/30 rounded-xl p-3 text-sm focus:outline-none focus:border-orange-400/80 focus:ring-2 focus:ring-orange-900/40 transition-all duration-300 resize-none placeholder:text-amber-200/30 text-amber-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono tracking-wider uppercase text-amber-300/60 pl-1">Latitude</label>
                  <input type="text" value={lat} onChange={(e) => setLat(e.target.value)} className="bg-[#20140e]/60 border border-orange-900/30 rounded-lg p-2 text-xs text-amber-50 focus:outline-none focus:border-orange-400/60 font-mono transition-colors duration-300" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono tracking-wider uppercase text-amber-300/60 pl-1">Longitude</label>
                  <input type="text" value={lng} onChange={(e) => setLng(e.target.value)} className="bg-[#20140e]/60 border border-orange-900/30 rounded-lg p-2 text-xs text-amber-50 focus:outline-none focus:border-orange-400/60 font-mono transition-colors duration-300" />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-400 hover:via-orange-400 hover:to-orange-500 active:scale-[0.98] font-semibold tracking-wider py-2.5 rounded-xl text-xs uppercase text-[#2b1509] transition-all duration-300 ease-out shadow-lg shadow-orange-950/30 hover:shadow-orange-500/20 disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSubmitting ? "Processing Metrics..." : "Analyze & Vector Map"}
              </button>
            </form>
          </div>

          <hr className="border-orange-900/30" />

          {/* Consolidated log list with staggered entrance */}
          <div className="flex flex-col flex-1 overflow-hidden">
            <h2 className="text-xs font-bold font-mono uppercase tracking-widest text-amber-300/80 mb-3 flex items-center gap-2">
              <span>📋</span> Core Consolidated Matrix
            </h2>
            <div className="flex flex-col gap-2 overflow-y-auto pr-1 flex-1">
              {groupedData.length === 0 ? (
                <div className="text-center text-xs font-mono text-amber-200/40 p-8 border border-dashed border-orange-900/30 rounded-xl bg-[#20140e]/30 transition-opacity duration-500">
                  No tracking vectors active. Ingest event intelligence parameters.
                </div>
              ) : (
                groupedData.map((cluster, i) => {
                  const isCritical = cluster.severity === 'Critical';
                  const isHigh = cluster.severity === 'High';

                  return (
                    <div
                      key={cluster.cluster_id}
                      style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
                      className={`report-card bg-[#2b1b12]/40 backdrop-blur-sm border rounded-xl p-3.5 flex flex-col gap-2 transition-all duration-300 ease-out hover:bg-[#33221a]/60 hover:scale-[1.015] hover:shadow-lg hover:shadow-black/30 ${
                        isCritical ? 'border-rose-800/40 border-l-4 border-l-rose-400' :
                        isHigh ? 'border-orange-800/40 border-l-4 border-l-orange-400' : 'border-amber-800/30 border-l-4 border-l-amber-400'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-amber-100 text-xs tracking-wide">{cluster.category}</span>
                          <span className="text-[10px] text-amber-200/50 font-mono">
                            ID: #{cluster.cluster_id} • {cluster.reportCount} linked events
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-black uppercase tracking-wider transition-colors duration-300 ${
                          isCritical ? 'bg-rose-500/10 text-rose-300 border border-rose-500/25 animate-pulse' :
                          isHigh ? 'bg-orange-500/10 text-orange-300 border border-orange-500/25' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}>
                          {cluster.severity}
                        </span>
                      </div>
                      <p className="text-amber-100/70 text-xs leading-relaxed font-normal bg-black/15 p-2 rounded-lg italic border border-orange-900/20">
                        "{cluster.latestText}"
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Map workspace */}
        <div className="flex-1 bg-[#241810]/60 border border-orange-900/30 rounded-2xl overflow-hidden shadow-2xl relative transition-colors duration-500">
          <CrisisMap currentMapCenter={currentMapCenter} groupedData={groupedData} />
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .report-card {
          animation: fadeSlideIn 0.4s ease-out both;
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(251, 146, 60, 0.25);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(251, 146, 60, 0.4);
        }
      `}</style>
    </div>
  );
}