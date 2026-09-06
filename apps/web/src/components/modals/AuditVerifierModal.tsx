import React, { useState } from 'react';
import { AuditReport, HermesExportBundle, HermesVerifier } from '@hermes/core';
import {
  FileCheck2,
  UploadCloud,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  GitCommit,
  User,
  Clock,
  RefreshCw,
  X,
} from 'lucide-react';

export interface AuditVerifierModalProps {
  currentBundle?: HermesExportBundle | null;
  onClose?: () => void;
  isStandaloneTab?: boolean;
}

export const AuditVerifierModal: React.FC<AuditVerifierModalProps> = ({
  currentBundle,
  onClose,
  isStandaloneTab = false,
}) => {
  const [bundle, setBundle] = useState<HermesExportBundle | null>(currentBundle || null);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const runAudit = async (b: HermesExportBundle) => {
    setIsVerifying(true);
    setBundle(b);
    try {
      const rep = await HermesVerifier.verifyExportBundle(b);
      setReport(rep);
    } catch (err) {
      console.error('Audit failed with error', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        runAudit(parsed);
      } catch {
        alert('Invalid JSON file. Please select a valid .hermes.json file.');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      className={`glass-panel rounded-2xl border border-slate-800 shadow-2xl p-6 ${
        isStandaloneTab ? 'h-[calc(100vh-140px)] flex flex-col' : 'max-w-3xl w-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
        <div className="flex items-center space-x-2.5">
          <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Cryptographic Audit & Offline Verifier</h2>
            <p className="text-xs text-slate-400">
              Validates ECDSA signatures, update hashes, and Merkle DAG integrity
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Main Area */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
            dragOver
              ? 'border-cyan-400 bg-cyan-500/5'
              : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
          }`}
        >
          <UploadCloud className="h-8 w-8 text-cyan-400 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-200">
            Drag and Drop any <span className="text-cyan-400 font-mono">.hermes.json</span> audit file
          </h4>
          <p className="text-xs text-slate-500 mt-1 mb-3">
            Runs fully offline in your browser using WebCrypto (zero network requests)
          </p>
          <label className="inline-block cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-lg border border-slate-700 transition-colors">
            <span>Browse Files</span>
            <input
              type="file"
              accept=".json,.hermes.json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
          </label>
        </div>

        {/* Audit Results */}
        {isVerifying ? (
          <div className="py-12 text-center text-slate-400 animate-pulse flex items-center justify-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin text-cyan-400" />
            <span>Auditing cryptographic signatures & hashes...</span>
          </div>
        ) : report ? (
          <div className="space-y-4">
            {/* Verdict Card */}
            <div
              className={`p-5 rounded-2xl border ${
                report.verdict === 'VALID'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : report.verdict === 'INCOMPLETE'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-rose-500/10 border-rose-500/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {report.verdict === 'VALID' ? (
                    <ShieldCheck className="h-8 w-8 text-emerald-400" />
                  ) : report.verdict === 'INCOMPLETE' ? (
                    <AlertTriangle className="h-8 w-8 text-amber-400" />
                  ) : (
                    <ShieldAlert className="h-8 w-8 text-rose-400" />
                  )}
                  <div>
                    <h3
                      className={`text-lg font-bold ${
                        report.verdict === 'VALID'
                          ? 'text-emerald-400'
                          : report.verdict === 'INCOMPLETE'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                      }`}
                    >
                      {report.verdict === 'VALID'
                        ? '100% Cryptographically Verified'
                        : report.verdict === 'INCOMPLETE'
                          ? 'Incomplete Merkle DAG'
                          : 'Cryptographic Audit Failed'}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">{report.summary}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800 text-white font-bold">
                    {report.verifiedCommits} / {report.totalCommits} Commits Valid
                  </span>
                </div>
              </div>
            </div>

            {/* Commit Breakdown Log */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase font-mono">
                Verified Commit Chain
              </h4>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {report.details.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs font-mono"
                  >
                    <div className="flex items-center space-x-2">
                      {item.isValid ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-400" />
                      )}
                      <span className="text-white font-bold">{item.commitId.slice(0, 12)}...</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-400">
                        {item.authorFingerprint?.slice(0, 14)}...
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {item.timestamp && (
                        <span className="text-slate-500">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          item.isValid
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {item.verdict}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
