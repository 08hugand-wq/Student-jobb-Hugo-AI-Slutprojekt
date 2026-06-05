import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, Message, StudentProfile } from '../types';
import { ArrowLeft, Send, Check, CheckCheck, MessageSquare, Sparkles, TrendingUp } from 'lucide-react';
import { generateEmployerResponse } from '../services/geminiService';
import { audioService } from '../services/audioService';
import CompanyLogo from './CompanyLogo';

interface ChatViewProps {
  studentProfile: StudentProfile;
  chats: ChatSession[];
  messages: { [chatId: string]: Message[] };
  activeChatId: string | null;
  onSelectChat: (chatId: string | null) => void;
  onSendMessage: (chatId: string, text: string) => void;
  onAddIncomingMessage: (chatId: string, text: string, senderId: string) => void;
  onNavigateToFeed: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({
  studentProfile,
  chats,
  messages,
  activeChatId,
  onSelectChat,
  onSendMessage,
  onAddIncomingMessage,
  onNavigateToFeed,
}) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeChat = chats.find(c => c.id === activeChatId);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatId, messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId || !activeChat) return;

    const textToSend = inputText.trim();
    setInputText('');

    // Play bubble pop sound when student sends message
    audioService.playPop();

    // 1. Send student message
    onSendMessage(activeChatId, textToSend);

    // 2. Simulate Employer Thinking & Typing Response
    setIsTyping(true);

    setTimeout(async () => {
      // Fetch fresh message history
      const currentHistory = messages[activeChatId] || [];
      const historyFormatted = currentHistory.map(m => ({
        senderId: m.senderId,
        text: m.text,
      }));

      let reply = '';
      try {
        // Call Gemini (with automatic offline Swedish response fallback as safety)
        const geminiReply = await generateEmployerResponse(
          activeChat.participantName,
          activeChat.jobTitle || 'Extrajobb',
          studentProfile.name,
          textToSend,
          historyFormatted
        );
        reply = geminiReply;
      } catch (err) {
        reply = '';
      }

      // High-fidelity fallback scenarios if Gemini is not configured or fails
      if (!reply) {
        const fallbacks = [
          `Hej ${studentProfile.name.split(' ')[0]}! Tack för att du hör av dig. Det låter perfekt. Har du möjlighet att arbeta detta pass?`,
          `Det låter jättebra! Vi går igenom ansökningar nu. Har du erfarenhet av liknande pass och kan starta på kort varsel?`,
          `Tack för infon! Din profil matchar våra önskemål väldigt väl. Jag kollar på schemat och återkommer inom kort.`,
          `Kanon! Jag har sparat dina uppgifter för det här och kommande liknande pass. Kul att du är intresserad!`
        ];
        
        // Select fallback based on student message cues
        const lower = textToSend.toLowerCase();
        if (lower.includes('hej') || lower.includes('tjena') || lower.includes('hallå')) {
          reply = `Hej ${studentProfile.name.split(' ')[0]}! Kul att du ansökte till passet som ${activeChat.jobTitle || 'extrajobb'}. Har du vana av liknande uppgifter?`;
        } else if (lower.includes('ja') || lower.includes('kan arbeta') || lower.includes('absolut')) {
          reply = `Grymt! Vi uppskattar din snabba respons. Jag kommer att bekräfta bokningen inom kort, så håll utkik här i chatten!`;
        } else {
          reply = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
      }

      setIsTyping(false);
      onAddIncomingMessage(activeChatId, reply, 'employer');
    }, 1500);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  // Human friendly time formatting
  const formatTime = (timeInput: Date | string) => {
    const d = new Date(timeInput);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };

  // Helper for color pairings based on participant name to keep styling distinctive
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-indigo-600 border-indigo-100 text-white',
      'bg-emerald-600 border-emerald-100 text-white',
      'bg-amber-500 border-amber-100 text-white',
      'bg-rose-500 border-rose-100 text-white',
      'bg-blue-600 border-blue-100 text-white',
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
  };

  if (activeChatId && activeChat) {
    const chatMessages = messages[activeChatId] || [];

    return (
      <div id="chat-session-detail" className="flex flex-col bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden animate-fade-in h-[520px]">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 bg-gray-50/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                audioService.playClick();
                onSelectChat(null);
              }}
              className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <CompanyLogo companyName={activeChat.participantName} size="sm" />
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-gray-900 text-sm leading-tight">{activeChat.participantName}</h4>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              </div>
              <p className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 mt-0.5 rounded-full inline-block leading-tight">
                {activeChat.jobTitle || 'Extrajobb'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">Aktiv</span>
          </div>
        </div>

        {/* Message Panel Room */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gray-50/50 flex flex-col no-scrollbar">
          {chatMessages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <MessageSquare className="w-10 h-10 text-gray-300 mb-3 stroke-[1.5]" />
              <p className="text-sm font-medium">Skriv det första meddelandet till arbetsgivaren!</p>
              <p className="text-xs text-gray-400 mt-1">De svarar oftast mycket snabbt.</p>
            </div>
          ) : (
            chatMessages.map((msg, index) => {
              const isMe = msg.senderId === 'student';
              return (
                <div
                  key={msg.id || index}
                  className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'} animate-fade-in`}
                >
                  <div className={`p-3.5 rounded-2xl text-[13px] font-medium leading-relaxed ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-none shadow-sm shadow-blue-100'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                  <div className="flex items-center gap-1 mt-1 px-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                    <span>{formatTime(msg.timestamp)}</span>
                    {isMe && (
                      <span className="text-blue-500">
                        {msg.isRead ? <CheckCheck className="w-3.5 h-3.5 stroke-[2]" /> : <Check className="w-3.5 h-3.5 stroke-[2]" />}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Recruiter Bouncing Typing Indicator */}
          {isTyping && (
            <div className="self-start flex items-center bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm animate-pulse">
              <span className="text-xs font-bold text-gray-400 mr-2 uppercase tracking-wide">{activeChat.participantName} skriver</span>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Messaging input footer */}
        <form onSubmit={handleSend} className="p-3 border-t border-gray-100 bg-white sticky bottom-0 z-10 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Skriv ett svar..."
            className="flex-1 px-4 py-3 bg-gray-50 hover:bg-gray-100/70 focus:bg-white rounded-2xl border border-transparent focus:border-blue-100 outline-none focus:ring-2 focus:ring-blue-100 text-sm font-medium transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100 active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  }

  // Chats Thread List Screen
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center mb-1">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mina meddelanden</h2>
          <p className="text-xs text-gray-500">Direktkontakt med arbetsgivare du ansökt hos</p>
        </div>
        <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-2xl text-[10px] font-bold text-blue-700 uppercase">
          <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
          <span>DirektSvar Aktiv</span>
        </div>
      </div>

      {chats.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center shadow-sm py-16">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mx-auto mb-4 border border-blue-100/50">
            <MessageSquare className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h3 className="font-bold text-gray-900 text-lg">Inga konversationer än</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-[280px] mx-auto leading-relaxed">
            När du skickar in en snabbansökan på pass skapas en direktchatt med arbetsgivaren här.
          </p>
          <div className="mt-6">
            <button
              onClick={() => {
                audioService.playPop();
                onNavigateToFeed();
              }}
              className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-2xl text-xs shadow-md shadow-blue-100 hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95"
            >
              Hitta tillgängliga pass
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {chats.map(chat => {
            const hasUnread = chat.unreadCount > 0;
            return (
              <div
                key={chat.id}
                onClick={() => {
                  audioService.playClick();
                  onSelectChat(chat.id);
                }}
                className={`bg-white rounded-2xl p-4 border transition-all duration-200 cursor-pointer shadow-sm hover:translate-x-1 hover:shadow-md flex items-center justify-between gap-3 ${
                  hasUnread
                    ? 'border-blue-200 bg-blue-50/20'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative shrink-0">
                    <CompanyLogo companyName={chat.participantName} size="md" />
                    {hasUnread && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-full z-10"></span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="font-black text-gray-800 text-sm truncate pr-2">
                        {chat.participantName}
                      </h4>
                      <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap uppercase tracking-wider">
                        Aktiv
                      </span>
                    </div>
                    <p className="text-[10px] text-blue-600 font-bold mb-1 block uppercase tracking-wide truncate">
                      {chat.jobTitle || 'Extrajobb'}
                    </p>
                    <p className={`text-xs truncate ${hasUnread ? 'text-gray-900 font-bold' : 'text-gray-500 font-medium'}`}>
                      {chat.lastMessage}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-1.5">
                  {hasUnread && (
                    <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-sm shadow-blue-100 animate-bounce">
                      {chat.unreadCount}
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-blue-500 hover:underline">Chatta →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChatView;
