import React, { useEffect, useRef, useState } from 'react';
import { Job, StudentProfile } from '../types';
import { IconMapPin, IconClock, IconStar } from './Icons';
import { audioService } from '../services/audioService';
import { Search, Navigation, Compass, Layers, CheckCircle2 } from 'lucide-react';

declare const L: any;

interface JobMapProps {
  jobs: Job[];
  student: StudentProfile;
  onApply: (jobId: string) => void;
}

const CITY_COORDINATES: { [key: string]: [number, number] } = {
  'Stockholm': [59.3293, 18.0686],
  'Göteborg': [57.7089, 11.9746],
  'Borås': [57.7210, 12.9401],
};

const JobMap: React.FC<JobMapProps> = ({ jobs, student, onApply }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const [selectedCity, setSelectedCity] = useState<string>('Stockholm');
  const [geolocationStatus, setGeolocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);

  // Initialize and clean up Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (typeof L === 'undefined') return;

    // Center on Sweden [59.5, 15.0] with zoom level 5.5
    const map = L.map(mapContainerRef.current, {
      zoomControl: false // We will place our zoom control in a better place
    }).setView([58.2, 14.5], 6);

    // Modern styled map tiles (CartoDB Positron is clean, light, and modern)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Add standard zoom control with customized position
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    // Create a group for job markers
    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;

    mapInstanceRef.current = map;

    // Handle popup dynamic click bindings for applying
    map.on('popupopen', (e: any) => {
      audioService.playPop();
      const popupElement = e.popup.getElement();
      if (popupElement) {
        const applyBtn = popupElement.querySelector('.popup-apply-btn');
        if (applyBtn) {
          const jobId = applyBtn.getAttribute('data-job-id');
          applyBtn.addEventListener('click', () => {
            if (jobId) {
              onApply(jobId);
              popup.close();
            }
          });
        }
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when jobs list changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current || typeof L === 'undefined') return;

    // Clear previous markers
    markersGroupRef.current.clearLayers();

    jobs.forEach((job, index) => {
      const baseCoords = CITY_COORDINATES[job.city] || CITY_COORDINATES['Stockholm'];
      
      // Jiggle/offset slightly based on index to handle overlapping locations in same city
      const offsetLat = baseCoords[0] + (index * 0.007) - 0.0035;
      const offsetLng = baseCoords[1] + (index * 0.007) - 0.0035;

      // Custom elegant CSS-only Pin Marker (Anti-Asset-Bugs!)
      const customPin = L.divIcon({
        html: `
          <div class="relative group flex items-center justify-center">
            <!-- Pulsing outer ring -->
            <div class="absolute w-10 h-10 bg-blue-500/20 rounded-full animate-ping pointer-events-none"></div>
            <!-- Marker Body -->
            <div class="relative w-8 h-8 bg-blue-600 hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all text-white rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer">
              <span class="text-[10px] font-black">${job.hourlyRate}</span>
            </div>
            <!-- Tiny city indicator pointer -->
            <div class="absolute -bottom-1 w-2 h-2 bg-blue-600 rotate-45 border-r border-b border-white"></div>
          </div>
        `,
        className: 'custom-leaflet-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 36],
        popupAnchor: [0, -32]
      });

      const popupContent = `
        <div class="p-3 font-sans max-w-[210px] bg-white rounded-2xl">
          <span class="inline-block text-[9px] uppercase tracking-wider font-extrabold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full mb-1.5">
            ${job.city}
          </span>
          <h4 class="font-extrabold text-gray-900 text-sm leading-snug mb-1">${job.title}</h4>
          <p class="text-xs font-bold text-gray-600 mb-2">${job.company}</p>
          
          <div class="border-t border-b border-gray-100 py-2 my-2 space-y-1">
            <div class="flex justify-between items-center text-xs">
              <span class="text-gray-400">Timlön:</span>
              <strong class="text-gray-900 font-extrabold">${job.hourlyRate} kr/h</strong>
            </div>
            <div class="flex justify-between items-center text-xs">
              <span class="text-gray-400">Tid:</span>
              <span class="text-gray-600 font-semibold">${job.startTime}</span>
            </div>
          </div>

          <button 
            data-job-id="${job.id}"
            class="popup-apply-btn w-full bg-blue-600 hover:bg-blue-700 font-black text-[11px] uppercase tracking-wider text-white py-2 px-3 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
          >
            Sök passet direkt
          </button>
        </div>
      `;

      const popup = L.popup({
        closeButton: false,
        className: 'custom-leaflet-popup shadow-2xl rounded-2xl overflow-hidden',
        maxWidth: 240
      }).setContent(popupContent);

      const marker = L.marker([offsetLat, offsetLng], { icon: customPin }).bindPopup(popup);
      markersGroupRef.current.addLayer(marker);
    });

  }, [jobs]);

  // Fly mapping helper
  const handleFlyTo = (cityName: string) => {
    audioService.playWhoosh();
    setSelectedCity(cityName);
    const coords = CITY_COORDINATES[cityName];
    if (coords && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(coords, 12, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  };

  // Live Geolocation feature in Sweden
  const handleLocateMe = () => {
    audioService.playPop();
    if (!navigator.geolocation) {
      setGeolocationStatus('error');
      alert('Din webbläsare stöder inte GPS.');
      return;
    }

    setGeolocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setGeolocationStatus('success');
        setUserCoords([latitude, longitude]);
        audioService.playSuccess();

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 13);
          
          // Place temporary user locator circle
          const userCircle = L.circle([latitude, longitude], {
            color: '#10B981',
            fillColor: '#10B981',
            fillOpacity: 0.15,
            radius: 800
          }).addTo(mapInstanceRef.current);

          // Custom pulsing user GPS marker
          const centerMarker = L.divIcon({
            html: `
              <div class="relative w-6 h-6 flex items-center justify-center">
                <div class="absolute w-6 h-6 bg-emerald-500 rounded-full animate-ping opacity-60"></div>
                <div class="relative w-4.5 h-4.5 bg-emerald-500 border-2 border-white rounded-full shadow-lg"></div>
              </div>
            `,
            className: '',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          L.marker([latitude, longitude], { icon: centerMarker })
            .addTo(mapInstanceRef.current)
            .bindPopup('<strong class="text-xs text-emerald-600 font-extrabold font-sans">📍 Ditt läge!</strong>', { closeButton: false })
            .openPopup();
        }
      },
      (error) => {
        console.error('GPS error:', error);
        setGeolocationStatus('error');
        // If GPS is blocked/fails, we gracefully fly to Stockholm and alert nicely
        handleFlyTo('Stockholm');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Quick stats computed of jobs in the active area
  const jobsInActiveRegion = jobs.filter(j => j.city === selectedCity).length;

  if (typeof L === 'undefined') {
    return (
      <div className="bg-gray-100 h-[380px] rounded-3xl flex flex-col justify-center items-center text-gray-500 font-medium border border-gray-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
        <p className="text-xs font-bold uppercase tracking-widest text-blue-500">Laddar Leaflet-kartmotor...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in flex flex-col w-full">
      {/* City Slider / Zoom quick links */}
      <div className="flex justify-between items-center mb-3">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Välj Stad i Sverige</label>
        <button 
          onClick={handleLocateMe}
          className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-colors"
        >
          <Navigation className="w-3.5 h-3.5" />
          {geolocationStatus === 'loading' ? 'Hämtar...' : 'Mitt läge'}
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
        {Object.keys(CITY_COORDINATES).map((city) => (
          <button
            key={city}
            onClick={() => handleFlyTo(city)}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold border transition-all flex items-center gap-1.5 whitespace-nowrap shadow-sm ${
              selectedCity === city
                ? 'bg-blue-600 border-blue-600 text-white shadow-blue-100'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <span>📍</span>
            <span>{city}</span>
            {city === 'Borås' && (
              <span className="bg-yellow-400 text-gray-900 border border-yellow-300 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase scale-95 shrink-0">
                Ny!
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main Interactive Map Container */}
      <div className="relative rounded-3xl overflow-hidden border border-gray-200/80 shadow-inner mb-5">
        {/* Leaflet binds to this element */}
        <div 
          ref={mapContainerRef} 
          id="sweden-leaflet-map" 
          className="h-[360px] w-full z-10"
        />

        {/* Floating Quick overlay indicators */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-sm shadow-xl p-2.5 px-3.5 rounded-2xl border border-gray-100 flex items-center gap-2">
            <Compass className="w-4.5 h-4.5 text-blue-600 animate-spin" style={{ animationDuration: '6s' }} />
            <div>
              <p className="text-[8px] uppercase tracking-widest text-gray-400 font-extrabold">Visar just nu</p>
              <h5 className="text-[11px] font-black text-gray-800 leading-none">{selectedCity}</h5>
            </div>
          </div>
        </div>

        {/* Floating helper note */}
        <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
          <div className="bg-gray-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-xl text-[10px] font-semibold flex items-center gap-1">
            <span>💡</span>
            <span>Klicka på lönepins för att öppna jobbkortet</span>
          </div>
        </div>
      </div>

      {/* Local jobs panel list inside Map tab */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="font-extrabold text-sm text-gray-900 mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <IconMapPin className="text-blue-500 w-5 h-5 shrink-0" />
            Jobb i {selectedCity}
          </span>
          <span className="bg-blue-50 text-blue-600 text-xs font-black px-3 py-1 rounded-full">
            {jobsInActiveRegion} lediga
          </span>
        </h3>

        {jobsInActiveRegion > 0 ? (
          <div className="space-y-3 pt-1">
            {jobs
              .filter(j => j.city === selectedCity)
              .map(job => (
                <div key={job.id} className="p-3 border border-gray-100/80 rounded-2xl flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex-1">
                    <p className="font-extrabold text-xs text-gray-900 leading-tight mb-0.5">{job.title}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{job.company} • {job.duration}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11.5px] font-extrabold text-gray-800 shrink-0">{job.hourlyRate} kr/h</span>
                    <button 
                      onClick={() => {
                        audioService.playClick();
                        onApply(job.id);
                      }}
                      className="text-[10px] uppercase tracking-wider font-extrabold px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 active:scale-95 transition-all text-blue-600 shrink-0 border border-blue-100"
                    >
                      Sök
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-xs font-bold text-gray-400">Inga tillgängliga pass i {selectedCity} just nu.</p>
            <button 
              onClick={() => handleFlyTo('Stockholm')}
              className="mt-2 text-[10px] font-black text-blue-600 uppercase hover:underline"
            >
              Visa Stockholm (Sveriges mittpunkt)
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default JobMap;
