import React, { useState, useEffect } from 'react';
import { HermesExportBundle } from '@hermes/core';
import { X, Download, Copy, Check, ShieldCheck } from 'lucide-react';

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  getBundle: () => Promise<HermesExportBundle>;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, getBundle }) => {
  const [bundle, setBundle] = useState<HermesExportBundle | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getBundle()
        .then((b) => {
          setBundle(b);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Failed to generate export bundle', err);
          setIsLoading(false);
        });
    }
  }, [isOpen, getBundle]);

  if (!isOpen) return null;

  const jsonString = bundle ? JSON.stringify(bundle, null, 2) : '';

  const downloadFile = () => {
    if (!bundle) return;
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bundle.document.title.toLowerCase().replace(/\s+/g, '_')}.hermes.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-cream-light rounded-lg border border-cream-border overflow-hidden flex flex-col max-h-[90vh] text-charcoal">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-cream-border">
          <div className="flex items-center space-x-3">
            <div className="rounded border border-sage/30 bg-sage/10 p-2 text-sage">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-serif text-charcoal">Export Verifiable Audit Bundle</h3>
              <p className="text-xs text-charcoal-muted">Standard .hermes.json cryptographic export</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1.5 text-charcoal-muted hover:bg-cream hover:text-charcoal transition-colors border border-transparent hover:border-cream-border"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="py-16 text-center text-charcoal-muted">
              Generating signed audit bundle...
            </div>
          ) : bundle ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-cream border border-cream-border rounded-lg p-3 text-center">
                  <p className="text-[10px] text-charcoal-muted uppercase font-mono tracking-wider">Total Commits</p>
                  <p className="text-lg font-bold font-mono text-charcoal mt-0.5">{bundle.commits.length}</p>
                </div>
                <div className="bg-cream border border-cream-border rounded-lg p-3 text-center">
                  <p className="text-[10px] text-charcoal-muted uppercase font-mono tracking-wider">Authors</p>
                  <p className="text-lg font-bold font-mono text-sage mt-0.5">{bundle.authors.length}</p>
                </div>
                <div className="bg-cream border border-cream-border rounded-lg p-3 text-center">
                  <p className="text-[10px] text-charcoal-muted uppercase font-mono tracking-wider">DAG Heads</p>
                  <p className="text-lg font-bold font-mono text-terracotta mt-0.5">{bundle.heads.length}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-charcoal mb-1.5 block">
                  JSON Bundle Content
                </label>
                <div className="relative">
                  <pre className="h-64 overflow-auto rounded-lg bg-cream p-4 font-mono text-[11px] text-charcoal border border-cream-border leading-relaxed">
                    {jsonString}
                  </pre>
                  <button
                    onClick={copyToClipboard}
                    className="absolute top-3 right-3 flex items-center space-x-1.5 rounded bg-cream-light hover:bg-cream border border-cream-border px-2.5 py-1 text-xs text-charcoal transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-sage" />
                        <span className="text-sage font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-charcoal-muted" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-5 border-t border-cream-border bg-cream">
          <div className="flex items-center space-x-1.5 text-xs text-sage">
            <ShieldCheck className="h-4 w-4" />
            <span className="font-medium">Private keys are never exported</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="rounded px-4 py-2 text-xs font-semibold text-charcoal-muted hover:text-charcoal hover:bg-cream-dark transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={downloadFile}
              disabled={!bundle || isLoading}
              className="flex items-center space-x-1.5 rounded bg-charcoal text-cream px-4 py-2 text-xs font-semibold hover:bg-charcoal/90 transition-colors border border-charcoal disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>Download .hermes.json</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
