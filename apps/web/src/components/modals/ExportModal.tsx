import React, { useState, useEffect } from 'react';
import { HermesExportBundle } from '@hermes/core';
import { X, Download, Copy, Check, ShieldCheck, FileCode, CheckCircle2 } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl glass-panel rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/20">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export Verifiable Audit Bundle</h3>
              <p className="text-xs text-slate-400">Standard .hermes.json cryptographic export</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 animate-pulse">
              Generating signed audit bundle...
            </div>
          ) : bundle ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Total Commits</p>
                  <p className="text-lg font-bold text-white mt-0.5">{bundle.commits.length}</p>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-mono">Authors</p>
                  <p className="text-lg font-bold text-cyan-400 mt-0.5">{bundle.authors.length}</p>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-slate-500 uppercase font-mono">DAG Heads</p>
                  <p className="text-lg font-bold text-emerald-400 mt-0.5">{bundle.heads.length}</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                  JSON Bundle Content
                </label>
                <div className="relative">
                  <pre className="h-64 overflow-auto rounded-xl bg-slate-950 p-4 font-mono text-[11px] text-slate-300 border border-slate-800/90 leading-relaxed">
                    {jsonString}
                  </pre>
                  <button
                    onClick={copyToClipboard}
                    className="absolute top-3 right-3 flex items-center space-x-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 px-2.5 py-1 text-xs text-slate-300 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
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
        <div className="flex items-center justify-between p-5 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-1.5 text-xs text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            <span>Private keys are never exported</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={downloadFile}
              disabled={!bundle || isLoading}
              className="flex items-center space-x-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-2 text-xs font-semibold text-white hover:from-cyan-500 hover:to-sky-500 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
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
