import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  User,
  Palette,
  Check,
  ArrowRight,
  X,
  Sparkles,
  Copy,
} from 'lucide-react';
import { HermesIdentity } from '@hermes/crypto';

export interface AuthorIdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  identity: HermesIdentity | null;
  displayName: string;
  userColor: string;
  onSave: (name: string, color: string) => void;
}

export const AuthorIdentityModal: React.FC<AuthorIdentityModalProps> = ({
  isOpen,
  onClose,
  identity,
  displayName,
  userColor,
  onSave,
}) => {
  const [name, setName] = useState(displayName);
  const [selectedColor, setSelectedColor] = useState(userColor);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !identity) return null;

  const shortHex = identity.fingerprint.replace('hermes:', '').slice(0, 8);
  const cryptoAuthorId = `Author #${shortHex}`;

  const availableColors = [
    { label: 'Sage Slate', value: '#7A8B7B' },
    { label: 'Terracotta', value: '#C96846' },
    { label: 'Deep Charcoal', value: '#1A1A1A' },
    { label: 'Royal Indigo', value: '#6366F1' },
    { label: 'Emerald Forest', value: '#10B981' },
    { label: 'Amber Flame', value: '#F59E0B' },
    { label: 'Rose Wine', value: '#EC4899' },
    { label: 'Ocean Cyan', value: '#0EA5E9' },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(identity.fingerprint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || cryptoAuthorId;
    onSave(finalName, selectedColor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl border border-cream-border shadow-2xl overflow-hidden font-sans text-charcoal">
        {/* Top Decorative Header */}
        <div className="bg-cream px-6 py-5 border-b border-cream-border flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-cream-50 font-bold font-mono text-xs shadow-xs"
              style={{ backgroundColor: selectedColor }}
            >
              {name.trim().slice(0, 2).toUpperCase() || shortHex.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold font-serif text-charcoal flex items-center gap-1.5">
                <span>Collaborator Identity</span>
                <span className="text-[10px] bg-sage-light text-sage-dark border border-sage-border px-1.5 py-0.2 rounded font-mono font-medium">
                  ECDSA P-256
                </span>
              </h2>
              <p className="text-xs text-charcoal-muted">Choose your custom name & cursor styling</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-charcoal-muted hover:text-charcoal hover:bg-cream-subtle transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Cryptographic Author ID Pill */}
          <div className="bg-cream-subtle p-3.5 rounded-xl border border-cream-border space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-charcoal-muted flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-sage" />
                <span>Verified Author ID</span>
              </span>
              <span className="font-mono font-bold text-xs text-charcoal">{cryptoAuthorId}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-charcoal-muted pt-1 border-t border-cream-border/60">
              <span className="truncate max-w-[260px]" title={identity.fingerprint}>
                {identity.fingerprint}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-sage hover:underline flex items-center gap-0.5 ml-2 shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-sage-dark" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Custom Name Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal flex items-center justify-between">
              <span>Your Custom Name</span>
              <span className="text-[10px] text-charcoal-muted normal-case font-normal">
                Shown on live cursor & commits
              </span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-muted">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`e.g. Alice or ${cryptoAuthorId}`}
                maxLength={40}
                autoFocus
                className="w-full pl-9 pr-3 py-2.5 bg-cream-50 border border-cream-border rounded-xl text-sm font-semibold text-charcoal placeholder:text-charcoal-muted/50 focus:outline-none focus:border-charcoal focus:bg-white transition-all"
              />
            </div>
            <p className="text-[11px] text-charcoal-muted">
              Peers in the document room will see your live cursor labeled with this name and your unique Author ID.
            </p>
          </div>

          {/* Color Palette Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-sage" />
              <span>Cursor & Caret Color</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {availableColors.map((color) => {
                const isSelected = selectedColor === color.value;
                return (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setSelectedColor(color.value)}
                    className={`flex items-center space-x-2 p-2 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-charcoal bg-cream font-bold shadow-xs'
                        : 'border-cream-border hover:bg-cream-50 text-charcoal-muted'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10"
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="truncate text-[11px]">{color.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-charcoal-muted hover:text-charcoal hover:bg-cream-subtle transition-colors"
            >
              Skip for Now
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-charcoal text-cream-50 hover:bg-charcoal/90 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <span>Save & Collaborate</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
