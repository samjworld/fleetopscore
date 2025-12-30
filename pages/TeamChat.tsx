import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Send, Edit2, Trash2, Hash, Users, X, Check, Search, 
  MessageSquare, MoreVertical, Smile
} from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  description: string;
}

interface Message {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: string;
  edited?: boolean;
}

const CHANNELS: Channel[] = [
  { id: 'general', name: 'General', description: 'Company-wide announcements and chatter' },
  { id: 'operations', name: 'Operations', description: 'Site updates and coordination' },
  { id: 'maintenance', name: 'Maintenance', description: 'Repairs, parts, and service logs' },
  { id: 'logistics', name: 'Logistics', description: 'Inventory and supply chain' },
  { id: 'safety', name: 'Safety', description: 'Safety incidents and protocols' },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm1',
    channelId: 'general',
    senderId: 'admin_1',
    senderName: 'Command Center Admin',
    senderRole: 'Super Admin',
    content: 'Welcome to the new FleetOps team chat! Please keep communication professional.',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'm2',
    channelId: 'operations',
    senderId: 'd1',
    senderName: 'Mike Ross',
    senderRole: 'Driver',
    content: 'Heading to Sector 4 for the excavation job. Traffic is heavy on the main gate.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'm3',
    channelId: 'maintenance',
    senderId: 'mech_1',
    senderName: 'Mechanic Mike',
    senderRole: 'Technician',
    content: 'Just finished the hydraulic check on the Crane C2. It needs a new seal kit.',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
];

export const TeamChat = () => {
  const { user } = useAuth();
  const [activeChannelId, setActiveChannelId] = useState<string>('general');
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInputText, setEditInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChannel = CHANNELS.find(c => c.id === activeChannelId);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannelId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      channelId: activeChannelId,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      content: inputText,
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, newMessage]);
    setInputText('');
  };

  const startEditing = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditInputText(msg.content);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditInputText('');
  };

  const saveEdit = (id: string) => {
    if (!editInputText.trim()) return;
    
    setMessages(messages.map(msg => 
      msg.id === id 
        ? { ...msg, content: editInputText, edited: true } 
        : msg
    ));
    setEditingMessageId(null);
    setEditInputText('');
  };

  const deleteMessage = (id: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      setMessages(messages.filter(msg => msg.id !== id));
    }
  };

  const activeMessages = messages.filter(m => m.channelId === activeChannelId);

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in duration-500">
      
      {/* Sidebar - Channels */}
      <div className="w-72 bg-slate-50 dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <h2 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
               <MessageSquare size={18} className="text-white" />
            </div>
            Direct Comms
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Departmental Nodes
          </div>
          {CHANNELS.map(channel => (
            <button
              key={channel.id}
              onClick={() => setActiveChannelId(channel.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all ${
                activeChannelId === channel.id
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 translate-x-1'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <Hash size={16} className={activeChannelId === channel.id ? 'text-blue-100' : 'text-slate-300 dark:text-slate-600'} />
              <span className="uppercase tracking-widest text-[11px]">{channel.name}</span>
            </button>
          ))}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>Network Encrypted</span>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">
        
        {/* Chat Header */}
        <div className="h-20 px-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0 sticky top-0 z-10">
            <div>
              <div className="flex items-center gap-3">
                 <Hash size={24} className="text-blue-600" />
                 <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-xl">{activeChannel?.name}</h3>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{activeChannel?.description}</p>
            </div>
            
            {/* Mobile Channel Switcher */}
            <div className="md:hidden">
               <select 
                 className="text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl px-4 py-2 outline-none"
                 value={activeChannelId}
                 onChange={(e) => setActiveChannelId(e.target.value)}
               >
                 {CHANNELS.map(c => <option key={c.id} value={c.id}>#{c.name.toUpperCase()}</option>)}
               </select>
            </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30 dark:bg-slate-950/30 custom-scrollbar">
           {activeMessages.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-6 opacity-20 py-20">
                <MessageSquare size={120} strokeWidth={1} />
                <p className="font-black uppercase tracking-[0.3em] text-sm">Awaiting First Packet...</p>
             </div>
           ) : (
             activeMessages.map((msg, index) => {
               const isMe = msg.senderId === user?.id;
               const isConsecutive = index > 0 && activeMessages[index - 1].senderId === msg.senderId;
               
               return (
                 <div 
                   key={msg.id} 
                   className={`group flex gap-4 ${isMe ? 'flex-row-reverse' : 'flex-row'} ${isConsecutive ? 'mt-1' : 'mt-6'}`}
                 >
                    {/* Avatar */}
                    {!isConsecutive ? (
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 shadow-lg transition-transform hover:scale-110 ${
                        isMe ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {msg.senderName.charAt(0)}
                      </div>
                    ) : (
                      <div className="w-12 shrink-0" />
                    )}

                    {/* Message Body */}
                    <div className={`flex flex-col max-w-[80%] sm:max-w-[65%] ${isMe ? 'items-end' : 'items-start'}`}>
                       {!isConsecutive && (
                         <div className="flex items-baseline gap-3 mb-2 px-2">
                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{msg.senderName}</span>
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{msg.senderRole}</span>
                            <span className="text-[9px] text-slate-400 font-mono">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                         </div>
                       )}

                       {editingMessageId === msg.id ? (
                         <div className="flex flex-col gap-3 w-full min-w-[280px] bg-white dark:bg-slate-800 p-4 rounded-[1.5rem] shadow-2xl border-2 border-blue-500 animate-in zoom-in duration-200">
                            <textarea 
                              className="w-full text-sm p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:text-white resize-none font-medium"
                              rows={3}
                              value={editInputText}
                              onChange={(e) => setEditInputText(e.target.value)}
                              autoFocus
                            />
                            <div className="flex justify-end gap-3">
                               <button onClick={cancelEditing} className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Abort</button>
                               <button onClick={() => saveEdit(msg.id)} className="px-5 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">Commit</button>
                            </div>
                         </div>
                       ) : (
                         <div className="relative group/bubble flex items-center gap-3">
                           {isMe && (
                             <div className="opacity-0 group-hover/bubble:opacity-100 transition-all flex gap-1 translate-x-2">
                                <button onClick={() => startEditing(msg)} className="p-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-blue-500 shadow-md"><Edit2 size={12} /></button>
                                <button onClick={() => deleteMessage(msg.id)} className="p-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-red-500 shadow-md"><Trash2 size={12} /></button>
                             </div>
                           )}

                           <div className={`px-6 py-4 text-sm shadow-sm relative font-medium leading-relaxed ${
                             isMe 
                               ? 'bg-blue-600 text-white rounded-[1.5rem] rounded-tr-sm shadow-blue-500/20' 
                               : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-[1.5rem] rounded-tl-sm'
                           }`}>
                             {msg.content}
                             {msg.edited && <span className="ml-3 text-[9px] font-black uppercase opacity-40 italic tracking-widest">(MODIFIED)</span>}
                           </div>

                           {!isMe && (
                             <div className="opacity-0 group-hover/bubble:opacity-100 transition-all flex gap-1 -translate-x-2">
                                <button className="p-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-blue-500 shadow-md"><Smile size={12} /></button>
                             </div>
                           )}
                         </div>
                       )}
                    </div>
                 </div>
               );
             })
           )}
           <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
           <form onSubmit={handleSendMessage} className="flex items-end gap-4 max-w-6xl mx-auto">
              <div className="flex-1 relative">
                 <textarea
                   className="w-full pl-6 pr-12 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-slate-950 transition-all resize-none text-sm dark:text-white shadow-inner font-medium"
                   placeholder={`Transmitting to #${activeChannel?.name.toUpperCase()}...`}
                   rows={1}
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter' && !e.shiftKey) {
                       e.preventDefault();
                       handleSendMessage(e);
                     }
                   }}
                 />
                 <button type="button" className="absolute right-4 top-4 text-slate-300 hover:text-blue-500 transition-colors">
                    <Smile size={24} />
                 </button>
              </div>
              <button 
                type="submit" 
                disabled={!inputText.trim()}
                className="p-4 bg-blue-600 text-white rounded-[1.2rem] hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xl shadow-blue-500/40 transition-all hover:scale-110 active:scale-95"
              >
                 <Send size={24} />
              </button>
           </form>
           <p className="text-[9px] font-black text-center text-slate-400 uppercase tracking-[0.2em] mt-4">
             Terminal encryption active. departmental logs are archived in global nexus.
           </p>
        </div>
      </div>
    </div>
  );
};