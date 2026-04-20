'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Globe, Maximize2 } from 'lucide-react';
interface Job {
    id: string;
    title: string;
    company?: { display_name?: string };
    latitude?: number;
    longitude?: number;
    _matchScore?: number;
    redirect_url: string;
    created?: string;
}

// Internal component to handle auto-fitting bounds and provide reset function
function MapController({ geoJobs, resetTrigger }: { geoJobs: Job[], resetTrigger: number }) {
    const map = useMap();

    const fit = () => {
        if (geoJobs.length > 0) {
            const bounds = L.latLngBounds(geoJobs.map(j => [j.latitude!, j.longitude!]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
    };

    useEffect(() => {
        fit();
    }, [geoJobs, map]);

    useEffect(() => {
        if (resetTrigger > 0) fit();
    }, [resetTrigger]);

    return null;
}

// Simple jitter function to separate markers at the same location
function jitter(coord: number) {
    return coord + (Math.random() - 0.5) * 0.005;
}

export default function JobMap({ jobs }: { jobs: Job[] }) {
    const [mounted, setMounted] = useState(false);
    const [resetTrigger, setResetTrigger] = useState(0);

    useEffect(() => {
        setMounted(true);
        // Fix Leaflet icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
    }, []);

    // Memoize geoJobs calculation to avoid jittering changing on every render
    const geoJobs = useMemo(() => {
        const raw = jobs.filter(j => j.latitude && j.longitude);
        return raw.map((job, idx, self) => {
            const isDuplicate = self.slice(0, idx).some(j => j.latitude === job.latitude && j.longitude === job.longitude);
            if (isDuplicate) {
                return {
                    ...job,
                    latitude: jitter(job.latitude!),
                    longitude: jitter(job.longitude!)
                };
            }
            return job;
        });
    }, [jobs]);

    // Use a fixed initial center/zoom for MapContainer to ensure it never re-renders internally
    // We define this at the top to respect the Rules of Hooks
    const [initialConfig] = useState({
        center: [46.603354, 1.888334] as [number, number],
        zoom: 6
    });

    if (!mounted) return null;

    if (geoJobs.length === 0) {
        return (
            <div style={{ 
              height: '500px', 
              background: 'rgba(0,0,0,0.2)', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: 'var(--text3)', 
              border: '1px solid var(--border)',
              fontSize: '0.8rem',
              textAlign: 'center',
              padding: '20px'
            }}>
                Mode SIG Activé : Géolocalisation en attente de données réelles.
            </div>
        );
    }

    return (
        <div style={{ height: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#08090E', position: 'relative' }}>
            {/* RESET VIEW BUTTON */}
            <button 
                onClick={() => setResetTrigger(prev => prev + 1)}
                style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    zIndex: 1000,
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'var(--gold)',
                    fontSize: '0.65rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
                <Globe size={14} /> Vue Globale
            </button>

            <MapContainer 
                center={initialConfig.center} 
                zoom={initialConfig.zoom} 
                zoomControl={false}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
                key="stable-ats-map"
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                <MapController geoJobs={geoJobs} resetTrigger={resetTrigger} />
                
                {/* Heatmap Layer - Glowing Circles */}
                {geoJobs.map((job) => (
                    <CircleMarker
                        key={`heat-${job.id}`}
                        center={[job.latitude!, job.longitude!]}
                        radius={25}
                        pathOptions={{
                            fillColor: 'var(--gold)',
                            fillOpacity: 0.15,
                            color: 'transparent',
                            className: 'heat-glow'
                        }}
                    />
                ))}

                {/* Point Markers */}
                {geoJobs.map((job) => (
                    <CircleMarker
                        key={`point-${job.id}`}
                        center={[job.latitude!, job.longitude!]}
                        radius={5}
                        pathOptions={{
                            fillColor: 'var(--gold)',
                            fillOpacity: 0.8,
                            color: '#000',
                            weight: 1
                        }}
                    >
                        <Tooltip sticky direction="top" opacity={1}>
                            <div style={{ color: 'var(--text)', minWidth: '180px', fontFamily: 'Inter, sans-serif' }}>
                                <strong style={{ color: '#B45309', display: 'block', fontSize: '0.85rem', marginBottom: '2px' }}>{job.title}</strong>
                                <div style={{ fontSize: '0.75rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>🏢 {job.company?.display_name || 'Confidentiel'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10B981' }}>🎯 Match: {job._matchScore}%</div>
                                    {job.created && (
                                        <span style={{ fontSize: '0.65rem', opacity: 0.6, fontStyle: 'italic' }}>📅 {new Date(job.created).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
                                    )}
                                </div>
                            </div>
                        </Tooltip>
                    </CircleMarker>
                ))}
            </MapContainer>
        </div>
    );
}
