import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Lock,
  ShieldCheck,
  Share2,
  Copy,
  Check,
  X,
  Minus,
  Maximize2,
  Plus,
  Hash,
  Users,
  ChevronDown,
  Info,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { ChatMessageItem } from '../../hooks/useHermesChat.js';

export interface ChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  activeRoom: string;
  knownRooms: string[];
  messages: ChatMessageItem[];
  onSendMessage: (text: string) => Promise<boolean>;
  onSwitchRoom: (roomCode: string) => void;
  onStartFreshRoom: () => string;
  documentId: string;
  documentTitle: string;
  currentAuthorFingerprint: string;
  signalingUrl?: string;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  isOpen,
  onClose,
  onOpen,
  activeRoom,
  knownRooms,
  messages,
  onSendMessage,
  onSwitchRoom,
  onStartFreshRoom,
  documentId,
  documentTitle,
  currentAuthorFingerprint,
  signalingUrl,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [customRoomInput, setCustomRoomInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  // Floating Launcher Button in Bottom-Right Corner when closed
  if (!isOpen) {
    return (
      <div className="fixed bottom-5 right-5 z-40 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onOpen}
          className="group flex items-center space-x-2 bg-charcoal text-cream-50 pl-3 pr-3.5 py-2.5 rounded-full shadow-2xl border border-cream-border/30 hover:bg-charcoal/90 hover:scale-105 active:scale-95 transition-all cursor-pointer font-sans text-xs"
          title={`Open End-to-End Encrypted Chat (#${activeRoom})`}
          id="hermes-floating-chat-trigger"
        >
          <div className="relative flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-cream-50 group-hover:rotate-6 transition-transform" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-sage-dark ring-2 ring-charcoal animate-pulse" />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-semibold font-serif leading-tight">Chat</span>
            <span className="text-[9px] font-mono text-cream-subtle leading-tight">
              #{activeRoom.slice(0, 10)}
            </span>
          </div>
          {messages.length > 0 && (
            <span className="bg-sage text-charcoal font-bold px-1.5 py-0.2 rounded-full text-[10px] ml-1">
              {messages.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  // Build canonical share URL using the same link scheme as SignedDocs
  const getShareUrl = (room: string) => {
    const searchParams = new URLSearchParams(window.location.search);
    const signalParam = signalingUrl || searchParams.get('signal') || (import.meta.env?.VITE_SIGNALING_URL as string);
    const url = new URL(window.location.href);
    url.searchParams.set('doc', documentId);
    url.searchParams.set('room', room);
    if (signalParam) {
      url.searchParams.set('signal', signalParam);
    }
    return url.toString();
  };

  const currentRoomUrl = getShareUrl(activeRoom);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentRoomUrl);
    setCopiedLink(true);
    showNotification('Room link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const textToSend = inputText;
    setInputText('');
    setIsSending(true);

    try {
      await onSendMessage(textToSend);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  // Option 1: Start fresh room
  const handleCreateFreshRoom = () => {
    const freshId = onStartFreshRoom();
    setIsRoomModalOpen(false);

    // Update browser URL smoothly without reloading
    const freshUrl = getShareUrl(freshId);
    window.history.pushState({}, '', freshUrl);

    // Automatically copy fresh room link for instant peer sharing
    navigator.clipboard.writeText(freshUrl);
    showNotification(`Fresh room #${freshId} created & invite link copied!`);
  };

  // Option 2: Join or switch to existing room
  const handleJoinExistingRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = customRoomInput.trim();
    if (!raw) return;

    let targetRoom = raw;
    // If user pasted a full URL, extract room or doc param
    try {
      if (raw.startsWith('http://') || raw.startsWith('https://') || raw.includes('?')) {
        const parsed = new URL(raw.startsWith('http') ? raw : `http://dummy.com/${raw}`);
        const r = parsed.searchParams.get('room') || parsed.searchParams.get('doc');
        if (r) targetRoom = r;
      }
    } catch {
      // fallback to clean string
    }

    const cleanRoom = targetRoom.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!cleanRoom) return;

    onSwitchRoom(cleanRoom);
    setCustomRoomInput('');
    setIsRoomModalOpen(false);

    // Update URL query parameter
    const updatedUrl = getShareUrl(cleanRoom);
    window.history.pushState({}, '', updatedUrl);

    showNotification(`Switched to room #${cleanRoom}`);
  };

  // Switch to an existing room from the list
  const handleSelectRoom = (room: string) => {
    onSwitchRoom(room);
    setIsRoomModalOpen(false);
    const updatedUrl = getShareUrl(room);
    window.history.pushState({}, '', updatedUrl);
    showNotification(`Switched to room #${room}`);
  };

  // Format timestamp (e.g., 10:42 AM)
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Floating Minimized Bar
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center space-x-2 bg-charcoal text-cream-50 px-3.5 py-2 rounded-full shadow-2xl border border-cream-border/30 cursor-pointer hover:bg-charcoal/90 transition-all font-sans text-xs">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center space-x-2 focus:outline-none"
        >
          <div className="h-2 w-2 rounded-full bg-sage-light animate-pulse" />
          <MessageSquare className="h-4 w-4 text-cream-50" />
          <span className="font-semibold font-serif">Encrypted Chat</span>
          <span className="bg-charcoal-light/70 px-1.5 py-0.5 rounded text-[10px] font-mono text-cream-subtle">
            #{activeRoom.slice(0, 10)}
          </span>
          {messages.length > 0 && (
            <span className="bg-sage text-charcoal font-bold px-1.5 py-0.2 rounded-full text-[10px]">
              {messages.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setIsMinimized(false)}
          className="p-1 hover:text-sage transition-colors ml-1"
          title="Expand Chat"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onClose}
          className="p-1 hover:text-terracotta transition-colors"
          title="Close Chat"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[92vw] max-w-[400px] h-[540px] max-h-[85vh] bg-cream-50 border border-cream-border rounded-xl shadow-2xl flex flex-col font-sans overflow-hidden text-charcoal animate-in fade-in slide-in-from-bottom-3 duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="absolute top-14 left-4 right-4 z-30 bg-charcoal text-cream-50 px-3 py-2 rounded-lg text-xs font-medium shadow-lg border border-cream-border/20 flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="h-3.5 w-3.5 text-sage-light shrink-0" />
          <span className="truncate flex-1">{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-charcoal text-cream-50 border-b border-cream-border/20 shrink-0 select-none">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="p-1 rounded bg-cream-50/10 text-sage-light shrink-0">
            <Lock className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setIsRoomModalOpen(true)}
                className="font-bold text-xs font-serif text-cream-50 hover:text-sage-light transition-colors truncate text-left flex items-center space-x-1 cursor-pointer"
                title="Click to switch or create room"
              >
                <span className="truncate">#{activeRoom}</span>
                <ChevronDown className="h-3 w-3 opacity-70 shrink-0" />
              </button>
            </div>
            <div className="flex items-center space-x-1 text-[10px] text-cream-subtle font-mono">
              <span className="text-sage-light font-semibold">E2EE</span>
              <span>•</span>
              <span>AES-256 + ECDSA</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 shrink-0 text-cream-subtle">
          <button
            onClick={() => setIsRoomModalOpen(true)}
            className="p-1 rounded hover:bg-cream-50/10 hover:text-cream-50 transition-colors"
            title="Rooms & Options"
          >
            <Users className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleCopyLink}
            className="p-1 rounded hover:bg-cream-50/10 hover:text-cream-50 transition-colors"
            title="Copy E2EE Room Link"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-sage-light" /> : <Share2 className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded hover:bg-cream-50/10 hover:text-cream-50 transition-colors"
            title="Minimize"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-cream-50/10 hover:text-terracotta transition-colors"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Room Switcher / Management Overlay */}
      {isRoomModalOpen && (
        <div className="absolute inset-0 z-20 bg-cream-50 p-4 flex flex-col justify-between overflow-y-auto animate-in fade-in duration-150">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-cream-border">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-charcoal" />
                <h4 className="font-serif font-bold text-sm text-charcoal">Chat Rooms & E2EE</h4>
              </div>
              <button
                onClick={() => setIsRoomModalOpen(false)}
                className="p-1 rounded hover:bg-cream-subtle text-charcoal-muted hover:text-charcoal cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Current Room Info & Link */}
            <div className="mt-3 p-2.5 rounded-lg bg-cream-subtle border border-cream-border space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-charcoal-muted text-[11px] font-medium">Active Room:</span>
                <span className="font-mono font-semibold text-charcoal bg-white px-1.5 py-0.5 rounded border border-cream-border">
                  #{activeRoom}
                </span>
              </div>
              <p className="text-[11px] text-charcoal-muted leading-tight">
                All messages in this room are encrypted with an independent AES-256 key derived from this room code.
              </p>
              <button
                onClick={handleCopyLink}
                className="w-full mt-1.5 flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-white hover:bg-cream border border-cream-border rounded text-xs font-medium text-charcoal transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-sage-dark" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Room Invite Link'}</span>
              </button>
            </div>

            {/* Room Options: Start Fresh or Join Existing */}
            <div className="mt-4 space-y-3">
              <div className="text-[11px] font-semibold tracking-wider text-charcoal-muted uppercase">
                Room Options
              </div>

              {/* Option A: Start Fresh Room */}
              <button
                onClick={handleCreateFreshRoom}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-sage-light/60 hover:bg-sage-light border border-sage/30 text-charcoal transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-md bg-sage-dark text-cream-50 group-hover:scale-105 transition-transform">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold font-serif">Start Fresh Room</div>
                    <div className="text-[11px] text-charcoal-muted">Generate a new private E2EE chat room</div>
                  </div>
                </div>
                <Sparkles className="h-4 w-4 text-sage-dark opacity-70" />
              </button>

              {/* Option B: Default Document Room */}
              {activeRoom !== documentId && (
                <button
                  onClick={() => handleSelectRoom(documentId)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white hover:bg-cream-subtle border border-cream-border text-charcoal transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded-md bg-charcoal text-cream-50">
                      <Hash className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold font-serif">Document Room</div>
                      <div className="text-[11px] text-charcoal-muted">Return to main document #{documentId.slice(0, 12)}</div>
                    </div>
                  </div>
                </button>
              )}

              {/* Option C: Join Existing Room Input */}
              <form onSubmit={handleJoinExistingRoom} className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-medium text-charcoal">
                  Join Existing Room or Paste Link:
                </label>
                <div className="flex space-x-1.5">
                  <input
                    type="text"
                    value={customRoomInput}
                    onChange={(e) => setCustomRoomInput(e.target.value)}
                    placeholder="e.g. room_live_123 or full link"
                    className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-cream-border rounded-lg focus:outline-none focus:border-charcoal font-mono"
                  />
                  <button
                    type="submit"
                    disabled={!customRoomInput.trim()}
                    className="px-3 py-1.5 bg-charcoal text-cream-50 text-xs font-semibold rounded-lg hover:bg-charcoal/90 disabled:opacity-40 transition-opacity cursor-pointer shrink-0"
                  >
                    Join
                  </button>
                </div>
              </form>

              {/* Discovered / Known Rooms List */}
              {knownRooms.length > 1 && (
                <div className="pt-2">
                  <span className="text-[10px] font-semibold text-charcoal-muted uppercase tracking-wider block mb-1.5">
                    Discovered Rooms ({knownRooms.length})
                  </span>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {knownRooms.map((r) => (
                      <button
                        key={r}
                        onClick={() => handleSelectRoom(r)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs font-mono transition-colors text-left cursor-pointer ${
                          r === activeRoom
                            ? 'bg-cream-subtle font-bold text-charcoal border border-cream-border'
                            : 'hover:bg-cream-subtle text-charcoal-muted'
                        }`}
                      >
                        <span className="truncate">#{r}</span>
                        {r === activeRoom && (
                          <span className="text-[10px] text-sage-dark font-sans font-semibold">Active</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-cream-border text-center">
            <button
              onClick={() => setIsRoomModalOpen(false)}
              className="text-xs text-charcoal-muted hover:text-charcoal underline cursor-pointer"
            >
              Back to Chat
            </button>
          </div>
        </div>
      )}

      {/* Security Info Banner */}
      <div className="px-3 py-1.5 bg-cream-subtle/80 border-b border-cream-border flex items-center justify-between text-[10px] text-charcoal-muted shrink-0">
        <div className="flex items-center space-x-1.5 truncate">
          <ShieldCheck className="h-3 w-3 text-sage-dark shrink-0" />
          <span className="truncate">Client-side WebCrypto encryption & ECDSA signatures</span>
        </div>
        <button
          onClick={() => setIsRoomModalOpen(true)}
          className="text-sage-dark hover:underline font-semibold shrink-0 ml-2 cursor-pointer"
        >
          Rooms
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs bg-cream-light/40">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-charcoal-muted space-y-2">
            <div className="h-10 w-10 rounded-full bg-cream-subtle border border-cream-border flex items-center justify-center text-charcoal-muted">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="font-serif font-semibold text-sm text-charcoal">
              No messages in #{activeRoom}
            </div>
            <p className="text-[11px] max-w-xs leading-relaxed">
              Start the conversation or share this room link with your collaborators to chat in real time with end-to-end encryption.
            </p>
            <button
              onClick={handleCopyLink}
              className="mt-2 flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-cream-subtle border border-cream-border rounded-lg text-xs font-semibold text-charcoal shadow-2xs transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-sage-dark" /> : <Share2 className="h-3.5 w-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Invite Collaborator'}</span>
            </button>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.isSelf;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} space-y-0.5`}
              >
                {/* Author Info & Timestamp */}
                <div className="flex items-center space-x-1.5 px-1 text-[11px] text-charcoal-muted">
                  {!isSelf && (
                    <div
                      className="h-3.5 w-3.5 rounded-full flex items-center justify-center text-[9px] text-white font-bold"
                      style={{ backgroundColor: msg.authorColor || '#7A8B7B' }}
                    >
                      {msg.authorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-semibold text-charcoal">
                    {isSelf ? 'You' : msg.authorName}
                  </span>
                  <span className="font-mono text-[10px] text-charcoal-muted">
                    #{msg.authorShortId}
                  </span>
                  {msg.isVerified && (
                    <span
                      className="text-sage-dark flex items-center"
                      title="Cryptographically verified with author's ECDSA public key"
                    >
                      <ShieldCheck className="h-3 w-3" />
                    </span>
                  )}
                  <span className="text-[10px] text-charcoal-light">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed break-words shadow-2xs ${
                    isSelf
                      ? 'bg-charcoal text-cream-50 rounded-br-xs'
                      : 'bg-white text-charcoal border border-cream-border rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSend}
        className="p-2.5 bg-cream-50 border-t border-cream-border flex items-center space-x-2 shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Message #${activeRoom.slice(0, 12)} (E2EE)...`}
          className="flex-1 bg-white border border-cream-border rounded-lg px-3 py-2 text-xs text-charcoal placeholder:text-charcoal-light focus:outline-none focus:border-charcoal transition-colors font-sans"
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="h-8 w-8 rounded-lg bg-charcoal hover:bg-charcoal/90 text-cream-50 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer shadow-2xs"
          title="Send Encrypted Message"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
};
