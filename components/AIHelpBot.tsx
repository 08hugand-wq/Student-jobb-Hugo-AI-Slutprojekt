import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, Bot, ArrowRight, User } from 'lucide-react';
import { audioService } from '../services/audioService';
import { askAIHelpBot } from '../services/geminiService';
import { StudentProfile } from '../types';

interface AIHelpBotProps {
  role: 'student' | 'employer';
  studentProfile: StudentProfile;
}

interface BotMessage {
  id: string;
  senderId: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

const AIHelpBot: React.FC<AIHelpBotProps> = ({ role, studentProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<BotMessage[]>(() => {
    try {
      const saved = localStorage.getItem('student_job_ai_help_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      }
    } catch (e) {}
    return [
      {
        id: 'welcome',
        senderId: 'bot',
        text: 'Hej! 👋 Jag är din personliga StudentJobb AI-assistent. Jag kan berätta hur du maximerar din inkomst, håller koll på fribeloppet, vässar din profil eller hittar rätt pass. Hur kan jag hjälpa dig idag?',
        timestamp: new Date()
      }
    ];
  });
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Save messages to local storage
  useEffect(() => {
    localStorage.setItem('student_job_ai_help_messages', JSON.stringify(messages));
  }, [messages]);

  // Handle auto scroll
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    // Add user message
    const userMsg: BotMessage = {
      id: Math.random().toString(36).substring(2, 9),
      senderId: 'user',
      text: textToSend,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    audioService.playPop();

    try {
      // Map history to simple format
      const simpleHistory = messages.slice(-10).map(m => ({
        senderId: m.senderId,
        text: m.text
      }));
      
      const botResponse = await askAIHelpBot(textToSend, role, studentProfile, simpleHistory);
      
      const botMsg: BotMessage = {
        id: Math.random().toString(36).substring(2, 9),
        senderId: 'bot',
        text: botResponse || 'Hoppsan, jag kunde tyvärr inte svara just nu. Fråga gärna något annat!',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMsg]);
      audioService.playPop();
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    audioService.playDelete();
    setMessages([
      {
        id: 'welcome',
        senderId: 'bot',
        text: 'Hej! 👋 Jag har rensat vår tidigare historik. Vad kan jag assistera dig med nu?',
        timestamp: new Date()
      }
    ]);
  };

  const starterChips = role === 'student' ? [
    { label: 'Hur fungerar fribeloppet? 📊', prompt: 'Hur fungerar fribeloppet och hur mycket får jag tjäna skattefritt?' },
    { label: 'Tips för mitt CV! 📝', prompt: 'Kan du ge mig tips för mitt CV och profil för att bli bokad direkt?' },
    { label: 'Hitta snabba pass ⚡', prompt: 'Hur hittar jag de snabbaste och bäst betalda passen på StudentJobb?' },
    { label: 'Hur fungerar nivåer? 🏆', prompt: 'Vad ger min användarnivå och pålitlighetspoäng för fördelar?' }
  ] : [
    { label: 'Löneförslag & kalkyl? 💰', prompt: 'Hur sätter jag bäst timlönen för timpass med AI?' },
    { label: 'Skapa bra annons ✍️', prompt: 'Hur skriver jag en attraktiv och effektiv annons för studenter?' },
    { label: 'Vad är pålitlighets-poäng? 🌟', prompt: 'Hur fungerar studenternas Reliability Score och pålitlighetspoäng?' }
  ];

  return (
    <div className="relative">
      {/* Floating Action Button (FAB) */}
      <button
        id="ai-fab-button"
        onClick={() => {
          audioService.playClick();
          setIsOpen(prev => !prev);
        }}
        className={`fixed bottom-[88px] right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
          isOpen 
          ? 'bg-gray-900 border-2 border-white rotate-90' 
          : 'bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400 animate-pulse'
        }`}
        title="StudentJobb AI Support"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6 animate-spin-slow" />}
      </button>

      {/* Floating Chat Window Panel Overlay */}
      {isOpen && (
        <div className="fixed bottom-[150px] right-6 z-40 w-[350px] max-w-[calc(100vw-2rem)] h-[480px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                <Bot className="w-5 h-5 text-blue-100" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs tracking-tight uppercase">StudentJobb AI</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></span>
                  <span className="text-[10px] text-blue-100 font-bold">Online & Redo</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="text-xs text-blue-100 hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors font-bold"
                title="Rensa historik"
              >
                Rensa
              </button>
              <button
                onClick={() => {
                  audioService.playClick();
                  setIsOpen(false);
                }}
                className="p-1 hover:bg-white/15 rounded-lg transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Message Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gray-50/50 no-scrollbar">
            {messages.map((m) => (
              <div key={m.id} className={`flex gap-2.5 max-w-[85%] ${m.senderId === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border ${
                  m.senderId === 'user' 
                  ? 'bg-blue-50 border-blue-200 text-blue-600' 
                  : 'bg-indigo-50 border-indigo-200 text-indigo-600'
                }`}>
                  {m.senderId === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                
                <div className={`rounded-2xl p-3 text-xs leading-relaxed font-semibold shadow-sm ${
                  m.senderId === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  <p className="whitespace-pre-line">{m.text}</p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-2.5 max-w-[85%]">
                <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-indigo-50 border border-indigo-200 text-indigo-600">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white rounded-2xl p-3 text-xs border border-gray-100 rounded-tl-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Starter Suggestions */}
          <div className="px-3 py-2 border-t border-gray-100 bg-white flex flex-wrap gap-1.5 shrink-0 select-none">
            {starterChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(chip.prompt)}
                className="text-[10px] font-bold text-gray-600 px-2.5 py-1.5 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 border border-gray-100 rounded-xl transition-all active:scale-95"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Chat Form Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="p-3 border-t border-gray-100 bg-white flex gap-2 shrink-0 items-center justify-between"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Skriv din fråga..."
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 text-gray-800"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all disabled:opacity-40 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIHelpBot;
