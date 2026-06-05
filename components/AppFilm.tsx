import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Monitor, Sparkles, MessageSquare, ShieldCheck, Landmark, MapPin, Film, Check } from 'lucide-react';
import { audioService } from '../services/audioService';

interface AppFilmProps {
  onSuggestJob?: () => void;
}

export const AppFilm: React.FC<AppFilmProps> = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(() => audioService.getMuted());
  const [voiceNarratorActive, setVoiceNarratorActive] = useState<boolean>(true);
  const [showSubtitles, setShowSubtitles] = useState<boolean>(true);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const DURATION = 40; // 40-seconds informational film (fits perfectly in 20-60s requirement)

  // Initialize Web Speech Synthesis for Swedish voiceover
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      stopVoice();
    };
  }, []);

  // Update mute state with main audio service
  useEffect(() => {
    setIsMuted(audioService.getMuted());
  }, [isPlaying]);

  const speakText = (text: string) => {
    if (!synthRef.current || isMuted || !voiceNarratorActive) return;

    try {
      synthRef.current.cancel(); // Stop current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'sv-SE';
      utterance.rate = 1.05; // Slightly faster for marketing vibe
      utterance.pitch = 1.0;
      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis failed:', e);
    }
  };

  const stopVoice = () => {
    try {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    } catch (e) {}
  };

  const playInteractiveSceneSound = (sec: number) => {
    if (isMuted) return;
    if (sec === 0 || sec === 1 || sec === 40) {
      audioService.playWhoosh();
    } else if (sec === 10) {
      audioService.playSuccess();
    } else if (sec === 11 || sec === 14 || sec === 17) {
      audioService.playPop();
    } else if (sec === 20) {
      audioService.playSuccess();
    } else if (sec === 30) {
      audioService.playWhoosh();
    }
  };

  // Scene triggers and voice narration
  useEffect(() => {
    if (!isPlaying) return;

    // Direct actions based on elapsed seconds
    const rounded = Math.floor(currentTime);

    // Speak or sync audio at start of each scene block
    if (rounded === 0) {
      speakText("Välkommen till StudentJobb! Appen där du hittar snabba timpass, helt utan krångliga ansökningar.");
      playInteractiveSceneSound(0);
    } else if (rounded === 10) {
      speakText("Sök passet med ett enda klick. Inbyggd direktchatt öppnas med chefen så att du kan starta direkt.");
      playInteractiveSceneSound(10);
    } else if (rounded === 20) {
      speakText("Håll alltid full koll på din ekonomi. Appen beräknar fribeloppet och sparar dina timmar helt skattefritt.");
      playInteractiveSceneSound(20);
    } else if (rounded === 30) {
      speakText("Från Stockholm till Göteborg och Borås. Extrajobb anpassat efter din studentbudget!");
      playInteractiveSceneSound(30);
    }

    // Individual minor seconds feedback sounds
    if ([2, 12, 14, 22, 32].includes(rounded)) {
      playInteractiveSceneSound(rounded);
    }

  }, [Math.floor(currentTime), isPlaying]);

  // Main movie ticking driver
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= DURATION - 0.1) {
            // End of film
            setIsPlaying(false);
            stopVoice();
            if (!isMuted) audioService.playSuccess();
            return 0;
          }
          return prev + 0.25; // Smoother 250ms ticking
        });
      }, 250);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      stopVoice();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying]);

  const handlePlayPause = () => {
    audioService.playClick();
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    audioService.playWhoosh();
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleMuteToggle = () => {
    const nextMuted = audioService.toggleMute();
    setIsMuted(nextMuted);
    if (nextMuted) {
      stopVoice();
    } else {
      audioService.playClick();
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newPercent = clickX / width;
    const targetedTime = Math.min(DURATION, Math.max(0, newPercent * DURATION));
    
    audioService.playPop();
    setCurrentTime(targetedTime);
    
    // Stop voice if user scrubs so it can reset to correct sentence
    stopVoice();
  };

  // Determine active scene based on time scale:
  // Scene 1: 0 - 10s
  // Scene 2: 10 - 20s
  // Scene 3: 20 - 30s
  // Scene 4: 30 - 40s
  const currentScene = Math.floor(currentTime / 10);
  const percentComplete = (currentTime / DURATION) * 100;

  const getSubtitles = () => {
    if (currentTime < 5) return "Välkommen till StudentJobb! Det smarta sättet att extrajobba...";
    if (currentTime < 10) return "Smidig mobil matchning byggd helt för studenters unika vardag.";
    if (currentTime < 15) return "Glöm gammaldags krångliga CV-brev! Sök pass direkt med ett enkelt klick.";
    if (currentTime < 20) return "Direkt när du ansöker startar chatten. Hitta tiderna som passar dina kurser.";
    if (currentTime < 25) return "Ekonomikollen hjälper dig att tjäna pengar helt skattefritt!";
    if (currentTime < 30) return "Håll automatiskt koll så att din årsinkomst inte passerar fribeloppet.";
    if (currentTime < 40) return "Sök snabba extrajobb nu i Stockholm, Göteborg och Borås. Kom igång idag!";
    return "";
  };

  return (
    <div className="bg-gray-900 text-white rounded-3xl p-4 shadow-2xl border border-gray-800 overflow-hidden relative">
      
      {/* Film Header Banner with live status */}
      <div className="flex justify-between items-center mb-3">
        <span className="flex items-center gap-1.5 text-xs font-black tracking-widest text-blue-400 uppercase">
          <Film className="w-4 h-4 text-blue-500 animate-pulse" />
          Om StudentJobb • Live Film
        </span>
        <div className="flex items-center gap-2">
          <span className="bg-rose-500 text-white px-2 py-0.5 text-[9px] font-black tracking-widest rounded-full animate-pulse uppercase">
            {isPlaying ? '• SPELAR' : 'PAUSAD'}
          </span>
          <span className="text-[10px] font-bold text-gray-500 tracking-wider">
            20-60S MÅL (40s)
          </span>
        </div>
      </div>

      {/* Main Interactive "Screen" Container */}
      <div className="relative aspect-video w-full bg-slate-950 rounded-2xl overflow-hidden border border-gray-800/80 flex flex-col justify-between p-3 select-none">
        
        {/* Cinematic Scanlines effect overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.4))] z-20"></div>

        {/* Scene 1: Lätt att ansöka (0-10s) */}
        {currentScene === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 animate-fade-in text-center">
            
            {/* Visual Phone Card mockup */}
            <div className="relative w-44 bg-white text-gray-900 rounded-2xl p-3 shadow-2xl border border-gray-200 transform scale-90 -rotate-1 hover:rotate-0 transition-transform duration-500">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[8px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">LAGER & LOGISTIK</span>
                <span className="text-[9px] font-extrabold text-gray-800">154 kr/h</span>
              </div>
              <h5 className="text-[10.5px] font-black text-gray-900 leading-tight mb-1">Morgonpass Knalleland</h5>
              <p className="text-[8px] text-gray-500 mb-2">Borås • Snabbt pass</p>
              
              {/* Animated Sök-button */}
              <div className={`w-full py-1.5 rounded-xl text-[9px] font-extrabold text-center transition-all ${
                currentTime > 4 
                  ? 'bg-emerald-500 text-white scale-95 shadow-sm' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}>
                {currentTime > 4 ? (
                  <span className="flex items-center justify-center gap-1">
                    <Check className="w-3 h-3" /> Ansökt!
                  </span>
                ) : 'Klicka för att söka'}
              </div>

              {currentTime > 4 && (
                <div className="absolute -top-3 -right-3 bg-yellow-400 text-gray-900 border-2 border-white px-2 py-1 rounded-xl text-[10px] font-black animate-bounce">
                  +154 kr!
                </div>
              )}
            </div>

            <div className="mt-2 text-center max-w-[280px]">
              <span className="inline-block bg-blue-500/10 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase mb-1">
                Steg 1: Skippa CV-breven
              </span>
              <p className="text-xs text-gray-300 font-extrabold">Sök timpass med ett klick direkt</p>
            </div>
          </div>
        )}

        {/* Scene 2: Direktchatt (10-20s) */}
        {currentScene === 1 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 animate-fade-in">
            <div className="w-64 space-y-2 max-w-full">
              
              {/* Message 1 (Employer) */}
              <div className={`flex gap-2 items-start transition-opacity duration-500 ${currentTime >= 11 ? 'opacity-100' : 'opacity-0'}`}>
                <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold shadow shrink-0">
                  🏬
                </div>
                <div className="bg-gray-800 text-gray-100 p-2 text-[10px] font-medium rounded-2xl rounded-tl-none border border-gray-700 shadow-md">
                  <p className="font-bold text-indigo-400 text-[8px] mb-0.5">Lagerchef Knalleland</p>
                  Hej Erik! Grymt pass igår, har du tid igen på torsdag kl 12?
                </div>
              </div>

              {/* Message 2 (Student Reply) */}
              <div className={`flex gap-2 items-start justify-end transition-opacity duration-500 ${currentTime >= 14 ? 'opacity-100' : 'opacity-0'}`}>
                <div className="bg-blue-600 text-white p-2 text-[10px] font-medium rounded-2xl rounded-tr-none border border-blue-500 shadow-md">
                  Jajamen, absolut! Det passar klockrent efter min föreläsning. 👍
                </div>
                <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-[10px] font-bold shadow shrink-0">
                  👨‍🎓
                </div>
              </div>
            </div>

            <div className="mt-3 text-center">
              <span className="inline-block bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase mb-1">
                Steg 2: Direktkontakt
              </span>
              <p className="text-xs text-gray-300 font-extrabold">Inbyggd direktchatt med chefen</p>
            </div>
          </div>
        )}

        {/* Scene 3: Fribeloppet & Skatt (20-30s) */}
        {currentScene === 2 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 animate-fade-in text-center">
            
            {/* Economymeter filling */}
            <div className="bg-slate-900 border border-gray-800 p-3.5 rounded-2xl text-center w-52 shadow-2xl relative">
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-yellow-400/10 text-yellow-500 text-[8px] px-1.5 py-0.5 rounded-full font-black">
                <Sparkles className="w-2.5 h-2.5" /> SKATTEFRITT
              </div>

              <span className="block text-[8px] uppercase tracking-wider font-extrabold text-blue-400 mb-1">Ditt årsbelopp</span>
              <div className="text-xl font-black text-white">
                {currentTime < 23 ? '8 400 kr' : currentTime < 27 ? '14 200 kr' : '18 450 kr'}
              </div>

              <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden mt-2.5 border border-gray-700">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (currentTime - 20) * 10 + 40)}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center text-[8px] text-gray-400 mt-1.5 uppercase font-bold">
                <span>0 kr</span>
                <span>Fribelopp: 22 208 kr</span>
              </div>
            </div>

            <div className="mt-3">
              <span className="inline-block bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase mb-1">
                Steg 3: Undvik skattesmäll
              </span>
              <p className="text-xs text-gray-300 font-extrabold">Spara smart och tjäna skattefritt</p>
            </div>
          </div>
        )}

        {/* Scene 4: Hela Sverige & Borås (30-40s) */}
        {currentScene === 3 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 animate-fade-in">
            
            {/* Illustrated Map connections */}
            <div className="relative w-48 h-24 bg-gray-900 rounded-2xl border border-gray-800 flex items-center justify-center overflow-hidden">
              <div className="absolute text-slate-800 text-[40px] font-black select-none pointer-events-none select-none">
                SVERIGE
              </div>
              
              {/* Stockholm coordinate */}
              <div className="absolute top-[20%] left-[65%] text-center">
                <div className="w-3.5 h-3.5 bg-blue-500 border border-white rounded-full animate-ping absolute"></div>
                <div className="w-3.5 h-3.5 bg-blue-600 border border-white rounded-full shadow relative"></div>
                <span className="text-[8px] font-extrabold text-blue-300 absolute mt-1 -left-2">Sthlm</span>
              </div>

              {/* Göteborg coordinate */}
              <div className="absolute top-[50%] left-[25%] text-center">
                <div className="w-3.5 h-3.5 bg-blue-500 border border-white rounded-full animate-ping absolute"></div>
                <div className="w-3.5 h-3.5 bg-blue-600 border border-white rounded-full shadow relative"></div>
                <span className="text-[8px] font-extrabold text-blue-300 absolute mt-1 -left-2">Gbg</span>
              </div>

              {/* Borås spotlight pulsing coordinate */}
              <div className="absolute top-[48%] left-[40%] text-center">
                <div className="w-5 h-5 bg-yellow-400 border-2 border-white rounded-full animate-ping absolute -left-1 -top-1"></div>
                <div className="w-3.5 h-3.5 bg-yellow-400 border border-white rounded-full shadow relative flex items-center justify-center text-[7px] font-black text-gray-900">
                  ●
                </div>
                <span className="text-[9px] font-black text-yellow-300 absolute mt-4 -left-2 bg-slate-950/80 px-1 rounded-md">Borås</span>
              </div>
            </div>

            <div className="mt-3 text-center">
              <span className="inline-block bg-yellow-400/10 text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase mb-1">
                Steg 4: Nu även i din stad!
              </span>
              <p className="text-xs text-gray-300 font-extrabold">Matchar extrajobb & helgpass</p>
            </div>
          </div>
        )}

        {/* Floating progress marker / HD badge inside movie screen */}
        <div className="flex justify-between items-center z-10 w-full pointer-events-none mt-auto">
          <span className="bg-black/60 backdrop-blur text-[8px] text-gray-300 px-2 py-0.5 rounded font-black tracking-widest leading-none">
            SCEN 0{currentScene + 1}/04
          </span>
          <span className="bg-blue-600/90 text-[8px] text-white px-1.5 py-0.5 rounded font-black tracking-widest leading-none">
            HD 1080P
          </span>
        </div>
      </div>

      {/* Subtitles caption box inside film area */}
      {showSubtitles && (
        <div className="mt-3 bg-slate-950/60 border border-slate-800 p-2.5 rounded-xl min-h-[52px] flex items-center justify-center text-center">
          <p className="text-xs font-semibold text-gray-200 leading-relaxed italic">
            "{getSubtitles()}"
          </p>
        </div>
      )}

      {/* Movie playback controls overlay bar */}
      <div className="mt-4 space-y-3.5">
        
        {/* Interactive progress scrub bar */}
        <div className="space-y-1">
          <div className="relative w-full bg-gray-800 h-2 rounded-full cursor-pointer group" onClick={handleProgressClick}>
            {/* Background passive loaded gauge */}
            <div className="absolute inset-0 bg-gray-700/50 rounded-full"></div>
            {/* Live calculated blue timing gauge */}
            <div 
              className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" 
              style={{ width: `${percentComplete}%` }}
            ></div>
            {/* Draggable glowing node pointer */}
            <div 
              className="absolute w-3.5 h-3.5 bg-white border-2 border-blue-600 rounded-full -top-0.5 shadow-md group-hover:scale-125 transition-transform"
              style={{ left: `calc(${percentComplete}% - 7px)` }}
            ></div>
          </div>
          
          {/* Time text markers */}
          <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold font-mono">
            <span>0:{Math.floor(currentTime).toString().padStart(2, '0')}</span>
            <span className="text-gray-400">Klicka på tidslinjen för att spola!</span>
            <span>0:{DURATION}</span>
          </div>
        </div>

        {/* Control Button Actions row */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-950 p-2 px-3 rounded-2xl border border-gray-800">
          
          {/* Leftside: Play, Pause, Replays */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayPause}
              className={`p-2 rounded-xl transition-all shadow active:scale-95 flex items-center justify-center ${
                isPlaying 
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-gray-950' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              title={isPlaying ? 'Pausa introfilmen' : 'Spela introfilmen (40 sek)'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            
            <button
              onClick={handleRestart}
              className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors active:scale-95"
              title="Spela om från början"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Centered narration helper */}
          <div className="hidden min-[380px]:flex items-center gap-1.5">
            <button
              onClick={() => {
                audioService.playClick();
                setVoiceNarratorActive(!voiceNarratorActive);
              }}
              className={`px-2 py-1 border text-[9px] font-black uppercase rounded-lg tracking-wider ${
                voiceNarratorActive 
                  ? 'bg-emerald-950 border-emerald-900 text-emerald-400' 
                  : 'bg-gray-900 border-gray-800 text-gray-500'
              }`}
              title="Slå på AI-berättarröst"
            >
              Röst: {voiceNarratorActive ? 'PÅ' : 'AV'}
            </button>
            <button
              onClick={() => {
                audioService.playClick();
                setShowSubtitles(!showSubtitles);
              }}
              className={`px-2 py-1 border text-[9px] font-black uppercase rounded-lg tracking-wider ${
                showSubtitles 
                  ? 'bg-blue-950 border-blue-900 text-blue-400' 
                  : 'bg-gray-900 border-gray-800 text-gray-500'
              }`}
              title="Visa/dölj textning"
            >
              Text: {showSubtitles ? 'PÅ' : 'AV'}
            </button>
          </div>

          {/* Rightside: Speaker volume control toggle */}
          <button
            onClick={handleMuteToggle}
            className="p-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white rounded-xl transition-colors active:scale-95"
            title={isMuted ? 'Slå på ljud' : 'Dämpa ljud'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-blue-400 animate-pulse" />}
          </button>
        </div>

      </div>

    </div>
  );
};

export default AppFilm;
