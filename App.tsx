import React, { useState, useEffect, useRef } from 'react';
import { Message, ChatSession } from './types';
import { getAlfaaChatResponse } from './services/geminiService';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Menu, 
  ShieldCheck, 
  Send, 
  Sparkles,
  X,
  History,
  MoreVertical,
  AlertTriangle
} from 'lucide-react';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('alap_v1_sessions');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSessions(parsed);
      if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
    } else {
      createNewSession();
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('alap_v1_sessions', JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions, currentSessionId, isLoading]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Discussion',
      messages: [],
      createdAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const deleteSession = (id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (filtered.length === 0) {
        const ns: ChatSession = { id: Date.now().toString(), title: 'New Discussion', messages: [], createdAt: Date.now() };
        setCurrentSessionId(ns.id);
        return [ns];
      }
      if (currentSessionId === id) setCurrentSessionId(filtered[0].id);
      return filtered;
    });
    setSessionToDelete(null);
  };

  const activeSession = sessions.find(s => s.id === currentSessionId) || sessions[0];

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    const updatedMessages = [...activeSession.messages, userMessage];
    
    setSessions(prev => prev.map(s => 
      s.id === currentSessionId 
        ? { ...s, messages: updatedMessages, title: s.messages.length === 0 ? input.slice(0, 30) : s.title } 
        : s
    ));
    setInput('');
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = { id: assistantMessageId, role: 'assistant', content: '', timestamp: Date.now() };

    setSessions(prev => prev.map(s => 
      s.id === currentSessionId ? { ...s, messages: [...updatedMessages, assistantMessage] } : s
    ));

    try {
      await getAlfaaChatResponse(updatedMessages, (partialText) => {
        setSessions(prev => prev.map(s => 
          s.id === currentSessionId 
            ? { 
                ...s, 
                messages: s.messages.map(m => m.id === assistantMessageId ? { ...m, content: partialText } : m) 
              } 
            : s
        ));
      });
    } catch (err) {
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { 
              ...s, 
              messages: s.messages.map(m => m.id === assistantMessageId ? { ...m, content: "Protocol interruption: Please verify your connection and re-send." } : m) 
            } 
          : s
      ));
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  return (
    <div className="flex h-[100dvh] bg-[#FCF8F3] text-[#171717] overflow-hidden relative font-sans">
      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 mb-4">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold serif-heading text-[#002147] mb-2">Delete Discussion?</h3>
              <p className="text-sm text-neutral-500 serif-body leading-relaxed mb-6">
                This action cannot be undone. All inscriptions in this historical thread will be permanently erased.
              </p>
              <div className="flex flex-col w-full gap-2">
                <button 
                  onClick={() => deleteSession(sessionToDelete)}
                  className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-sm touch-target"
                >
                  Confirm Deletion
                </button>
                <button 
                  onClick={() => setSessionToDelete(null)}
                  className="w-full py-3 px-4 bg-white border border-[#E8E2D9] hover:bg-[#F8F5F1] text-neutral-600 font-semibold rounded-xl transition-all active:scale-[0.98] touch-target"
                >
                  Retain Discussion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Classical Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 lg:static lg:block
        transition-transform duration-300 ease-in-out bg-white border-r border-[#E8E2D9] flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-neutral-100">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-[#002147] rounded-md flex items-center justify-center shadow-sm">
              <span className="text-white serif-heading text-xl">A</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg serif-heading text-[#002147] tracking-tight">ALAP</span>
              <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-bold leading-none mt-1">ALAP Engine</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="touch-target p-2 lg:hidden text-neutral-400 hover:text-neutral-900">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <button 
            onClick={createNewSession}
            className="w-full py-3 px-4 bg-white border border-[#E8E2D9] hover:bg-[#F8F5F1] rounded-lg flex items-center justify-center space-x-2 transition-all shadow-sm active:scale-[0.98] text-[#002147] font-semibold text-sm touch-target"
          >
            <Plus size={18} />
            <span>New Discussion</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-1 pb-6 scrollbar-hide">
          <div className="flex items-center space-x-2 px-2 py-4">
            <History size={14} className="text-neutral-400" />
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Historical Threads</span>
          </div>
          {sessions.map(s => (
            <div 
              key={s.id}
              onClick={() => {
                setCurrentSessionId(s.id);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={`
                group relative p-3 rounded-lg cursor-pointer flex items-center space-x-3 transition-all
                ${currentSessionId === s.id 
                  ? 'bg-[#F3EFE9] border border-[#E8E2D9]' 
                  : 'hover:bg-[#F8F5F1] border border-transparent'}
              `}
            >
              <MessageSquare size={16} className={currentSessionId === s.id ? 'text-[#002147]' : 'text-neutral-400'} />
              <span className="truncate flex-1 text-sm font-medium text-neutral-700">{s.title || 'Untitled'}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); setSessionToDelete(s.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-600 transition-all touch-target"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-neutral-100 bg-[#F8F5F1]/30">
          <div className="flex items-center space-x-3 p-3 rounded-lg border border-[#E8E2D9]/50 bg-white shadow-sm">
            <ShieldCheck size={16} className="text-[#002147]" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Secured Interface</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Classical Canvas */}
      <main className="flex-1 flex flex-col relative bg-[#FCF8F3] overflow-hidden">
        {/* Header */}
        <header className="h-16 lg:h-20 flex items-center px-4 md:px-8 border-b border-[#E8E2D9] bg-white/70 backdrop-blur-md z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="touch-target mr-3 p-2 rounded-lg border border-[#E8E2D9] text-neutral-600 lg:hidden"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex-1 flex flex-col min-w-0">
            <h2 className="font-bold text-base lg:text-lg text-[#002147] tracking-tight serif-heading truncate">
              {activeSession?.title || 'Interaction'}
            </h2>
            <div className="flex items-center space-x-2 text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">
              <Sparkles size={10} className="text-[#C5A059]" />
              <span className="truncate">ALAP Engine</span>
            </div>
          </div>
          
          <button className="touch-target p-2 text-neutral-400">
            <MoreVertical size={18} />
          </button>
        </header>

        {/* Conversation Stream */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-0 md:px-4 py-6 space-y-8 scroll-smooth z-10 custom-scrollbar">
          {activeSession?.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-12 px-6">
              <div className="w-16 h-16 bg-white border border-[#E8E2D9] rounded-2xl flex items-center justify-center shadow-sm mb-8 transform rotate-3">
                <span className="text-3xl serif-heading text-[#002147]">A</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#002147] mb-6 serif-heading">ALAP</h1>
              <p className="text-neutral-500 text-base leading-relaxed mb-10 serif-body max-w-sm">
                A refined intelligence instrument powered by <strong>AlfaaX</strong>.
              </p>
              
              <div className="grid grid-cols-1 gap-3 w-full">
                {[
                  "Draft a professional summary",
                  "বাংলায় একটি কবিতা লেখো",
                  "Who is your developer?"
                ].map(text => (
                  <button 
                    key={text}
                    onClick={() => setInput(text)}
                    className="p-4 bg-white border border-[#E8E2D9] rounded-xl text-sm font-medium text-neutral-600 transition-all hover:bg-[#F8F5F1] active:scale-95 shadow-sm touch-target"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8 pb-4">
              {activeSession?.messages.map((msg) => (
                <div key={msg.id} className="flex flex-col space-y-2 animate-fadeIn px-4 md:px-0">
                  <div className={`flex items-center space-x-2 mb-1 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                      {msg.role === 'user' ? 'Inscribed' : 'ALAP Response'}
                    </span>
                  </div>
                  <div className={`
                    relative rounded-2xl px-5 py-4 shadow-sm border
                    ${msg.role === 'user' 
                      ? 'bg-white border-[#E8E2D9] text-[#002147] self-end max-w-[90%]' 
                      : 'bg-white border-[#E8E2D9] text-neutral-800 self-start max-w-[95%]'}
                  `}>
                    <MarkdownRenderer content={msg.content} />
                    
                    {!msg.content && msg.role === 'assistant' && (
                      <div className="flex space-x-2 py-4 items-center">
                        <div className="w-1.5 h-1.5 bg-[#002147] rounded-full animate-pulse"></div>
                        <div className="w-1.5 h-1.5 bg-[#002147] rounded-full animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-1.5 h-1.5 bg-[#002147] rounded-full animate-pulse [animation-delay:0.4s]"></div>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest ml-2">Reasoning...</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Control Center (Fixed Bottom) */}
        <div className="px-4 py-4 md:py-6 bg-white/70 backdrop-blur-md border-t border-[#E8E2D9] z-30">
          <div className="max-w-3xl mx-auto flex flex-col space-y-3">
            <div className="relative group bg-white border border-[#E8E2D9] rounded-2xl shadow-sm transition-all focus-within:border-neutral-400">
              <div className="flex items-end p-2 md:p-3">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 1024) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask ALAP..."
                  className="w-full bg-transparent border-none focus:ring-0 resize-none py-3 px-3 md:px-4 max-h-40 min-h-[44px] text-neutral-800 placeholder-neutral-400 text-sm md:text-base leading-relaxed"
                  rows={1}
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={`
                    mb-1 touch-target p-3 rounded-xl transition-all flex items-center justify-center
                    ${!input.trim() || isLoading 
                      ? 'text-neutral-200' 
                      : 'text-white bg-[#002147] hover:bg-neutral-900 active:scale-95 shadow-md'}
                  `}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-neutral-100 border-t-[#002147] rounded-full animate-spin"></div>
                  ) : (
                    <Send size={20} />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-[0.2em] whitespace-nowrap">
                Justice For Hadi
              </span>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        textarea {
          -webkit-appearance: none;
          appearance: none;
        }
      `}</style>
    </div>
  );
};

export default App;