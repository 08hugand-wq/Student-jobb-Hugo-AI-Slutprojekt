
import React, { useState, useMemo, useEffect } from 'react';
import { UserRole, StudentProfile, Job, ShiftType, WorkType, Message, ChatSession } from './types';
import { MOCK_JOBS, MOCK_STUDENT } from './constants';
import JobCard from './components/JobCard';
import ChatView from './components/ChatView';
import AIHelpBot from './components/AIHelpBot';
import AppLogo from './components/AppLogo';
import JobMap from './components/JobMap';
import AppFilm from './components/AppFilm';
import { IconVerify, IconClock, IconZap, IconMapPin, IconChat, IconCurrency, IconCalendar, IconStar } from './components/Icons';
import { suggestSalary } from './services/geminiService';
import { audioService } from './services/audioService';
import { Volume2, VolumeX, Sparkles, ChevronDown, ChevronUp, Info, HelpCircle } from 'lucide-react';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>('student');
  const [activeTab, setActiveTab] = useState<string>('feed');
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [filter, setFilter] = useState<{type: string, value: any}>({type: 'all', value: null});
  const [studentProfile, setStudentProfile] = useState<StudentProfile>(MOCK_STUDENT);
  const [isAudioMuted, setIsAudioMuted] = useState(() => audioService.getMuted());
  const [showAppDescription, setShowAppDescription] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('student_job_show_description');
      return saved !== 'false';
    } catch (e) {
      return true;
    }
  });
  const [descTab, setDescTab] = useState<'text' | 'video'>('video');
  const [showProjectReport, setShowProjectReport] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('student_job_show_report');
      return saved !== 'false';
    } catch (e) {
      return true;
    }
  });

  const toggleAppDescription = () => {
    audioService.playPop();
    setShowAppDescription(prev => {
      const next = !prev;
      try {
        localStorage.setItem('student_job_show_description', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const toggleProjectReport = () => {
    audioService.playPop();
    setShowProjectReport(prev => {
      const next = !prev;
      try {
        localStorage.setItem('student_job_show_report', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const toggleMute = () => {
    const nextMuted = audioService.toggleMute();
    setIsAudioMuted(nextMuted);
    if (!nextMuted) {
      audioService.playClick();
    }
  };

  // Chats state (persisted in localStorage or fallback to Erik's previous conversations)
  const [chats, setChats] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('student_job_chats');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'emp2',
        participantId: 'emp2',
        participantName: 'Logistik AB',
        lastMessage: 'Tack för ett grymt pass i torsdags! Schema för nästa vecka kommer snart.',
        unreadCount: 0,
        jobTitle: 'Lagerarbetare förmiddag',
      },
      {
        id: 'emp-past-1',
        participantId: 'emp-past-1',
        participantName: 'Café Grön',
        lastMessage: 'Hej Erik! Har du möjlighet att hoppa in nu på lördag kl 11-16?',
        unreadCount: 1,
        jobTitle: 'Barista & Cafébiträde',
      }
    ];
  });

  const [messages, setMessages] = useState<{ [chatId: string]: Message[] }>(() => {
    try {
      const saved = localStorage.getItem('student_job_messages');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      'emp2': [
        {
          id: 'm1',
          senderId: 'employer',
          text: 'Hej Erik! Är du redo för ditt pass imorgon kl 08?',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 * 5),
          isRead: true,
        },
        {
          id: 'm2',
          senderId: 'student',
          text: 'Jajamen, absolut! Jag har tagit fram skyddsskorna.',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 * 5 + 30 * 60 * 1000),
          isRead: true,
        },
        {
          id: 'm3',
          senderId: 'employer',
          text: 'Super! Välkommen in genom port B, vi ses där.',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 * 5 + 40 * 60 * 1000),
          isRead: true,
        },
        {
          id: 'm4',
          senderId: 'student',
          text: 'Tack för ett bra pass idag!',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 * 4),
          isRead: true,
        },
        {
          id: 'm5',
          senderId: 'employer',
          text: 'Tack för ett grymt pass i torsdags! Schema för nästa vecka kommer snart.',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 * 4 + 60 * 60 * 1000),
          isRead: true,
        }
      ],
      'emp-past-1': [
        {
          id: 'm_past1',
          senderId: 'employer',
          text: 'Hej Erik! Snyggt jobbat förra veckan.',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
          isRead: true,
        },
        {
          id: 'm_past2',
          senderId: 'employer',
          text: 'Hej Erik! Har du möjlighet att hoppa in nu på lördag kl 11-16?',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          isRead: false,
        }
      ]
    };
  });

  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Sync state with localStorage
  useEffect(() => {
    localStorage.setItem('student_job_chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem('student_job_messages', JSON.stringify(messages));
  }, [messages]);

  // Form State for Employer
  const [newJob, setNewJob] = useState<Partial<Job>>({
    title: '',
    hourlyRate: 140,
    duration: '4 timmar',
    workType: WorkType.Physical,
    shiftType: ShiftType.Evening,
    city: 'Stockholm',
    workingConditions: '',
    requirements: [],
    employerRequirements: [],
    isQuickShift: true,
    isRecurring: false,
    isGroupJob: false
  });

  const addNotification = (msg: string) => {
    setNotifications(prev => [msg, ...prev].slice(0, 3));
    setTimeout(() => setNotifications(prev => prev.filter(n => n !== msg)), 4000);
  };

  const handleApply = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    // Play successful click/arpeggio
    audioService.playSuccess();
    addNotification(`Ansökan skickad till ${job.company}!`);

    // Create a new chat or reload the existing one
    const chatId = job.employerId || `emp-${job.id}`;
    const chatExists = chats.some(c => c.id === chatId);

    if (!chatExists) {
      const newChat: ChatSession = {
        id: chatId,
        participantId: chatId,
        participantName: job.company,
        lastMessage: 'Ansökan skickad',
        unreadCount: 0,
        jobTitle: job.title
      };

      setChats(prev => [newChat, ...prev]);
      setMessages(prev => ({
        ...prev,
        [chatId]: []
      }));
    }

    // After 2.0 seconds, send employer automated Swedish message
    setTimeout(() => {
      const welcomeText = `Hej Erik! Tack för din ansökan för rollen som "${job.title}". Vi har tagit emot din ansökan och kollar just nu närmare på din profil. Har du möjlighet att köra på det angivna startdatumet?`;
      handleAddIncomingMessage(chatId, welcomeText, 'employer');
      addNotification(`Nytt meddelande från ${job.company}!`);
    }, 2000);
  };

  const handleSelectChat = (chatId: string | null) => {
    setActiveChatId(chatId);
    if (chatId) {
      // Mark messages as read
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, unreadCount: 0 } : c));
      setMessages(prev => {
        const chatMessages = prev[chatId] || [];
        return {
          ...prev,
          [chatId]: chatMessages.map(m => ({ ...m, isRead: true }))
        };
      });
    }
  };

  const handleSendMessage = (chatId: string, text: string) => {
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: 'student',
      text,
      timestamp: new Date(),
      isRead: false
    };

    setMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMessage]
    }));

    setChats(prev => prev.map(c => c.id === chatId ? {
      ...c,
      lastMessage: text,
      unreadCount: 0
    } : c));
  };

  const handleAddIncomingMessage = (chatId: string, text: string, senderId: string) => {
    // Play message bubble pop sound
    audioService.playPop();

    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId,
      text,
      timestamp: new Date(),
      isRead: activeChatId === chatId
    };

    setMessages(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), newMessage]
    }));

    setChats(prev => prev.map(c => c.id === chatId ? {
      ...c,
      lastMessage: text,
      unreadCount: activeChatId === chatId ? 0 : (c.unreadCount + 1)
    } : c));
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    const jobToAdd: Job = {
      ...newJob as Job,
      id: Math.random().toString(36).substr(2, 9),
      company: 'Mitt Företag AB',
      employerId: 'emp-current',
      startTime: 'Idag',
      requirements: newJob.requirements?.length ? newJob.requirements : ['Student'],
      employerRequirements: newJob.employerRequirements || [],
      description: 'Ett spännande extrajobb.',
      workingConditions: newJob.workingConditions || '',
      travelReimbursement: false
    };
    
    setJobs([jobToAdd, ...jobs]);
    audioService.playSuccess();
    addNotification("Jobbet har publicerats!");
    
    // Reset form
    setNewJob({
      title: '',
      hourlyRate: 140,
      duration: '4 timmar',
      workType: WorkType.Physical,
      shiftType: ShiftType.Evening,
      city: 'Stockholm',
      workingConditions: '',
      requirements: [],
      employerRequirements: [],
      isQuickShift: true,
      isRecurring: false,
      isGroupJob: false
    });
    
    setActiveTab('employer-dashboard');
  };

  const updateSalarySuggestion = async () => {
    if (newJob.title && newJob.city) {
      const suggested = await suggestSalary(newJob.title, newJob.city);
      setNewJob(prev => ({ ...prev, hourlyRate: suggested }));
    }
  };

  const filteredJobs = useMemo(() => {
    if (filter.type === 'all') return jobs;
    if (filter.type === 'remote') return jobs.filter(j => j.workType === WorkType.Online);
    if (filter.type === 'high-pay') return jobs.filter(j => j.hourlyRate > 140);
    if (filter.type === 'quick') return jobs.filter(j => j.isQuickShift);
    return jobs;
  }, [jobs, filter]);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col relative pb-24">
      {/* Toast Notifications */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-[340px] space-y-2 pointer-events-none">
        {notifications.map((n, i) => (
          <div key={i} className="bg-gray-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center animate-bounce-in pointer-events-auto">
            <IconVerify className="w-5 h-5 text-green-400 mr-2" />
            <span className="text-sm font-medium">{n}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40 flex justify-between items-center">
        <AppLogo />
        
        <div className="flex items-center gap-3">
          {/* Intelligent Speaker Synth Mute/Volume controls */}
          <button
            onClick={toggleMute}
            title={isAudioMuted ? "Slå på ljud" : "Ljuddämpa"}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded-full transition-colors active:scale-95"
          >
            {isAudioMuted ? <VolumeX className="w-4.5 h-4.5 text-gray-400" /> : <Volume2 className="w-4.5 h-4.5 text-blue-500 animate-pulse" />}
          </button>

          <button 
            onClick={() => {
              audioService.playWhoosh();
              const newRole = role === 'student' ? 'employer' : 'student';
              setRole(newRole);
              setActiveTab(newRole === 'student' ? 'feed' : 'employer-dashboard');
            }}
            className="text-[10px] font-bold px-3 py-1.5 bg-gray-100 rounded-full text-gray-500 uppercase tracking-wider"
          >
            {role === 'student' ? 'Employer Mode' : 'Student Mode'}
          </button>
        </div>
      </header>

      <main className="flex-1 p-5">
        {role === 'student' ? (
          <>
            {activeTab === 'feed' && (
              <div className="animate-fade-in">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Hitta pass 👋</h2>
                  <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar">
                    {[
                      { label: 'Alla', type: 'all' },
                      { label: 'Distans', type: 'remote' },
                      { label: 'Hög lön', type: 'high-pay' },
                      { label: 'Snabba pass', type: 'quick' }
                    ].map(f => {
                      const isActive = filter.type === f.type;
                      return (
                        <button 
                          key={f.type} 
                          onClick={() => {
                            audioService.playPop();
                            setFilter({ type: f.type, value: null });
                          }}
                          className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border transition-all shadow-sm ${
                            isActive 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-100' 
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Product Description Section */}
                <div id="app-product-description" className="mb-6 bg-gradient-to-br from-blue-50/70 to-indigo-50/50 border border-blue-100 rounded-3xl p-5 shadow-sm relative overflow-hidden transition-all duration-300">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <Info className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-gray-900 leading-tight">Om StudentJobb</h3>
                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Det smarta sättet att extrajobba</p>
                      </div>
                    </div>
                    <button 
                      onClick={toggleAppDescription}
                      type="button"
                      className="p-1 hover:bg-blue-100/50 rounded-lg text-blue-600 transition-colors"
                      title={showAppDescription ? "Dölj beskrivning" : "Visa beskrivning"}
                    >
                      {showAppDescription ? <ChevronUp className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
                    </button>
                  </div>

                  {showAppDescription ? (
                    <div className="mt-4 space-y-3.5 animate-fade-in">
                      {/* Interactive Tabs */}
                      <div className="flex border-b border-blue-100/60 pb-1 font-bold text-[10px] uppercase tracking-wider gap-4">
                        <button 
                          onClick={() => {
                            audioService.playClick();
                            setDescTab('video');
                          }}
                          className={`pb-1.5 px-0.5 border-b-2 transition-all flex items-center gap-1.5 ${
                            descTab === 'video' 
                              ? 'border-blue-600 text-blue-600 font-black' 
                              : 'border-transparent text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          🎥 Introfilm (40s)
                          <span className="bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-pulse font-extrabold shrink-0">LIVE</span>
                        </button>
                        <button 
                          onClick={() => {
                            audioService.playClick();
                            setDescTab('text');
                          }}
                          className={`pb-1.5 px-0.5 border-b-2 transition-all ${
                            descTab === 'text' 
                              ? 'border-blue-600 text-blue-600 font-black' 
                              : 'border-transparent text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          Snabb-info (Text)
                        </button>
                      </div>

                      {descTab === 'video' ? (
                        <div className="pt-1 animate-fade-in">
                          <AppFilm />
                        </div>
                      ) : (
                        <div className="text-xs text-gray-600 font-medium space-y-3.5 animate-fade-in">
                          <p className="leading-relaxed">
                            StudentJobb är en modern och snabb matchningsplattform utvecklad speciellt för studenters unika behov och flexibla tider. Vi sätter tidsbesparing, direktkontakt och enkelhet i centrum.
                          </p>
                          <div className="grid grid-cols-1 gap-3 pt-1 border-t border-blue-100/40">
                            <div className="flex gap-2.5 items-start">
                              <span className="text-[14px] shrink-0">⚡</span>
                              <div className="text-[11.5px] leading-relaxed">
                                <strong className="text-gray-900 block text-[10.5px] font-black uppercase tracking-wider mb-0.5">Direkt matchning & Snabba pass</strong>
                                Sök enstaka timpass och korta extrajobb med ett klick. Inga långdragna ansökningsprocesser eller komplicerade CV-filer behövs.
                              </div>
                            </div>
                            <div className="flex gap-2.5 items-start">
                              <span className="text-[14px] shrink-0">💬</span>
                              <div className="text-[11.5px] leading-relaxed">
                                <strong className="text-gray-900 block text-[10.5px] font-black uppercase tracking-wider mb-0.5">Direktchatt med arbetsgivaren</strong>
                                Så fort du ansöker öppnas en inbyggd direktchatt där du kan diskutera tider, introduktion och schema direkt med ansvarig chef.
                              </div>
                            </div>
                            <div className="flex gap-2.5 items-start">
                              <span className="text-[14px] shrink-0">📊</span>
                              <div className="text-[11.5px] leading-relaxed">
                                <strong className="text-gray-900 block text-[10.5px] font-black uppercase tracking-wider mb-0.5">Koll på Skattefritt (Fribeloppet)</strong>
                                Följ dina inkomster i realtid på ekonomisidan för att se exakt hur nära du är gränsen för skattefri inkomst (22 208 kr).
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 font-semibold mt-2 animate-fade-in">
                      Klicka på pilen för att läsa mer om hur StudentJobb hjälper dig hitta flexibla extrajobb anpassade efter ditt studieschema.
                    </p>
                  )}
                </div>

                {/* AI Project Report Section */}
                <div id="ai-project-report" className="mb-6 bg-gradient-to-br from-purple-50/70 to-indigo-50/50 border border-purple-100 rounded-3xl p-5 shadow-sm relative overflow-hidden transition-all duration-300">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                        <Sparkles className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-gray-900 leading-tight">Kort rapport om mitt AI-projekt</h3>
                        <p className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Av Hugo Andersson</p>
                      </div>
                    </div>
                    <button 
                      onClick={toggleProjectReport}
                      type="button"
                      className="p-1 hover:bg-purple-100/50 rounded-lg text-purple-600 transition-colors"
                      title={showProjectReport ? "Dölj rapport" : "Visa rapport"}
                    >
                      {showProjectReport ? <ChevronUp className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
                    </button>
                  </div>

                  {showProjectReport ? (
                    <div className="mt-4 space-y-4 text-xs font-medium text-gray-700 animate-fade-in">
                      <div className="bg-white/65 p-3 rounded-2xl border border-purple-100/40">
                        <h4 className="text-gray-900 font-extrabold text-[11px] uppercase tracking-wider mb-1 text-purple-700 flex items-center gap-1.5">
                          <span>🔧</span> Vilka AI-verktyg använde du?
                        </h4>
                        <p className="leading-relaxed text-gray-600 text-[11.5px]">
                          Jag använde Google AI Studio och Gemini under arbetet med min app/hemsida.
                        </p>
                      </div>

                      <div className="bg-white/65 p-3 rounded-2xl border border-purple-100/40">
                        <h4 className="text-gray-900 font-extrabold text-[11px] uppercase tracking-wider mb-1 text-purple-700 flex items-center gap-1.5">
                          <span>🎯</span> Vad använde du dem till?
                        </h4>
                        <p className="leading-relaxed text-gray-600 text-[11.5px]">
                          Google AI Studio använde jag för att bygga själva appen och skapa funktionerna och designen. Gemini hjälpte mig i början genom att ge mig den första prompten och förklara hur jag kunde få en länk till sidan. Efter det gjorde jag resten själv i AI Studio.
                        </p>
                      </div>

                      <div className="bg-white/65 p-3 rounded-2xl border border-purple-100/40">
                        <h4 className="text-gray-900 font-extrabold text-[11px] uppercase tracking-wider mb-1 text-purple-700 flex items-center gap-1.5">
                          <span>✨</span> Vad blev mest lyckat?
                        </h4>
                        <p className="leading-relaxed text-gray-600 text-[11.5px]">
                          Det som blev mest lyckat var jobb-fliken. Jag tycker att den blev riktigt snygg och passade bra ihop med resten av appen.
                        </p>
                      </div>

                      <div className="bg-white/65 p-3 rounded-2xl border border-purple-100/40">
                        <h4 className="text-gray-900 font-extrabold text-[11px] uppercase tracking-wider mb-1 text-purple-700 flex items-center gap-1.5">
                          <span>🛠️</span> Vad behövde du förbättra själv?
                        </h4>
                        <p className="leading-relaxed text-gray-600 text-[11.5px]">
                          Jag behövde fixa troubleshooting och lösa olika problem själv när något inte fungerade som det skulle.
                        </p>
                      </div>

                      <div className="bg-white/65 p-3 rounded-2xl border border-purple-100/40">
                        <h4 className="text-gray-900 font-extrabold text-[11px] uppercase tracking-wider mb-1 text-purple-700 flex items-center gap-1.5">
                          <span>🧠</span> Vilken del krävde mest eget tänkande?
                        </h4>
                        <p className="leading-relaxed text-gray-600 text-[11.5px]">
                          Det som krävde mest eget tänkande var att komma på själva idén till appen. Det tog en stund innan jag visste exakt hur jag ville att den skulle se ut och fungera.
                        </p>
                      </div>

                      <div className="bg-white/65 p-3 rounded-2xl border border-purple-100/40">
                        <h4 className="text-gray-900 font-extrabold text-[11px] uppercase tracking-wider mb-1 text-purple-700 flex items-center gap-1.5">
                          <span>📈</span> Vad blev dåligt först, och hur förbättrade du det?
                        </h4>
                        <p className="leading-relaxed text-gray-600 text-[11.5px]">
                          I början var struktureringen ganska kaosig och allt låg inte organiserat på ett bra sätt. Jag förbättrade det genom att planera bättre och ändra strukturen så att appen blev tydligare och lättare att använda.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 font-semibold mt-2 animate-fade-in">
                      Klicka på pilen för att läsa Hugos rapport om arbetet och erfarenheterna med AI-verktygen i projektet.
                    </p>
                  )}
                </div>

                {filteredJobs.map(job => (
                  <JobCard key={job.id} job={job} student={studentProfile} onApply={handleApply} />
                ))}
              </div>
            )}

            {activeTab === 'chat' && (
              <ChatView
                studentProfile={studentProfile}
                chats={chats}
                messages={messages}
                activeChatId={activeChatId}
                onSelectChat={handleSelectChat}
                onSendMessage={handleSendMessage}
                onAddIncomingMessage={handleAddIncomingMessage}
                onNavigateToFeed={() => setActiveTab('feed')}
              />
            )}

            {activeTab === 'map' && (
              <JobMap 
                jobs={jobs} 
                student={studentProfile} 
                onApply={handleApply} 
              />
            )}

            {activeTab === 'economy' && (
              <div className="animate-fade-in">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Totalt intjänat i år</p>
                  <h3 className="text-3xl font-black text-gray-900">{studentProfile.totalEarned} kr</h3>
                  <div className="mt-6">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-2">
                      <span>Fribelopp (Skattefritt)</span>
                      <span>{Math.round((studentProfile.totalEarned / 22208) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full transition-all duration-1000" style={{width: `${(studentProfile.totalEarned / 22208) * 100}%`}}></div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">Gräns för skattefri inkomst: 22 208 kr</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <IconCurrency className="text-blue-600 mb-2" />
                    <p className="text-xs font-bold text-blue-700">Utbetalt</p>
                    <p className="text-lg font-black text-blue-900">12 400 kr</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                    <IconClock className="text-orange-600 mb-2" />
                    <p className="text-xs font-bold text-orange-700">Kommande</p>
                    <p className="text-lg font-black text-orange-900">3 000 kr</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="animate-fade-in">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center mb-4">
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                      {studentProfile.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-xs font-black px-2 py-1 rounded-full border-2 border-white shadow-sm">LVL {studentProfile.level}</div>
                  </div>
                  <h2 className="text-xl font-bold">{studentProfile.name}</h2>
                  <p className="text-gray-500 text-sm mb-4">Pålitlighet: <span className="text-green-600 font-bold">{studentProfile.reliabilityScore}%</span></p>
                  
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {studentProfile.badges.map(b => (
                      <span key={b} className="bg-yellow-50 text-yellow-700 text-[10px] font-bold px-3 py-1.5 rounded-full border border-yellow-100 flex items-center">
                        <IconStar className="w-3 h-3 mr-1" fill="currentColor" /> {b}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t pt-6 border-gray-100">
                    <button onClick={() => audioService.playClick()} className="py-3 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 border border-gray-200">Ändra profil</button>
                    <button onClick={() => audioService.playSuccess()} className="py-3 bg-blue-600 rounded-xl text-xs font-bold text-white shadow-lg shadow-blue-200">Ladda ner CV</button>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-bold mb-4 flex items-center"><IconCalendar className="mr-2 text-blue-500" /> Tidsblockering</h3>
                  <p className="text-xs text-gray-500 mb-4">Markera tider då du t.ex. har tentor så döljer vi matchningar då.</p>
                  <button onClick={() => audioService.playPop()} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-bold text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-all">+ Lägg till tentaperiod</button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* EMPLOYER VIEW */
          <div className="animate-fade-in">
            {activeTab === 'employer-dashboard' ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Dashboard</h2>
                  <button onClick={() => { audioService.playPop(); setActiveTab('post'); }} className="bg-blue-600 text-white p-3 rounded-2xl shadow-lg transition-transform active:scale-90"><IconZap /></button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Sökande</p>
                    <p className="text-2xl font-black text-blue-600">8</p>
                  </div>
                  <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Genomförda</p>
                    <p className="text-2xl font-black text-green-600">12</p>
                  </div>
                </div>

                <h3 className="font-bold">Dina favoriter</h3>
                <div className="space-y-3">
                  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center font-bold text-yellow-600"><IconStar fill="currentColor" /></div>
                      <div>
                        <p className="font-bold text-sm">Sara L.</p>
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Senast jobbat: Igår</p>
                      </div>
                    </div>
                    <button onClick={() => audioService.playSuccess()} className="text-blue-600 text-xs font-bold">Boka igen</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in">
                <button onClick={() => { audioService.playClick(); setActiveTab('employer-dashboard'); }} className="text-blue-600 text-sm font-bold mb-4 flex items-center">← Avbryt</button>
                <h2 className="text-2xl font-bold mb-6">Skapa nytt pass</h2>
                <form onSubmit={handleCreateJob} className="space-y-5">
                  <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1 px-1">Jobbtitel</label>
                      <input 
                        type="text" 
                        required
                        value={newJob.title}
                        placeholder="t.ex. Butiksbiträde" 
                        className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-blue-500 text-sm font-medium" 
                        onBlur={updateSalarySuggestion}
                        onChange={e => setNewJob({...newJob, title: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-4">
                      <div className="w-1/2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1 px-1">Lön (kr/h)</label>
                        <input 
                          type="number" 
                          required
                          value={newJob.hourlyRate} 
                          className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-sm font-medium focus:ring-2 ring-blue-500" 
                          onChange={e => setNewJob({...newJob, hourlyRate: parseInt(e.target.value) || 0})} 
                        />
                      </div>
                      <div className="w-1/2 flex items-center text-[10px] font-bold text-blue-500 leading-tight">Gemini-förslag: Baserat på marknadsläget i {newJob.city}</div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1 px-1">Stad</label>
                      <input 
                        type="text" 
                        required
                        value={newJob.city} 
                        className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-sm font-medium focus:ring-2 ring-blue-500" 
                        onChange={e => setNewJob({...newJob, city: e.target.value})} 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1 px-1">Arbetsförhållanden</label>
                      <textarea 
                        required
                        value={newJob.workingConditions}
                        placeholder="Berätta om arbetsplatsen (t.ex. högt tempo, kräver tunga lyft, trevligt team...)" 
                        className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-blue-500 text-sm font-medium h-28 resize-none"
                        onChange={e => setNewJob({...newJob, workingConditions: e.target.value})}
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl active:scale-[0.98] transition-all hover:bg-blue-700">Publicera direkt</button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Navigation (Student) */}
      {role === 'student' && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 px-4 py-3 flex justify-around items-center z-50">
          <NavItem active={activeTab === 'feed'} icon={<IconClock />} label="Jobb" onClick={() => setActiveTab('feed')} />
          <NavItem active={activeTab === 'chat'} icon={<IconChat />} label="Chatt" onClick={() => setActiveTab('chat')} />
          <NavItem active={activeTab === 'map'} icon={<IconMapPin />} label="Karta" onClick={() => setActiveTab('map')} />
          <NavItem active={activeTab === 'economy'} icon={<IconCurrency />} label="Ekonomi" onClick={() => setActiveTab('economy')} />
          <NavItem active={activeTab === 'profile'} icon={<IconCalendar />} label="Profil" onClick={() => setActiveTab('profile')} />
        </nav>
      )}

      {/* Navigation (Employer) */}
      {role === 'employer' && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 px-4 py-3 flex justify-around items-center z-50">
          <NavItem active={activeTab === 'employer-dashboard'} icon={<IconClock />} label="Översikt" onClick={() => setActiveTab('employer-dashboard')} />
          <NavItem active={activeTab === 'post'} icon={<IconZap />} label="Publicera" onClick={() => setActiveTab('post')} />
        </nav>
      )}

      {/* Interactive AI Support Assist Bot */}
      <AIHelpBot role={role} studentProfile={studentProfile} />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes bounce-in { 0% { transform: translateY(-20px) scale(0.9); opacity: 0; } 70% { transform: translateY(5px) scale(1.02); opacity: 1; } 100% { transform: translateY(0) scale(1); opacity: 1; } }
        .animate-bounce-in { animation: bounce-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

const NavItem = ({ active, icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) => {
  const handleClick = () => {
    audioService.playClick();
    onClick();
  };
  return (
    <button onClick={handleClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-blue-600' : 'text-gray-400'}`}>
      <div className={`p-1.5 rounded-xl ${active ? 'bg-blue-50' : ''}`}>{icon}</div>
      <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
};

export default App;
