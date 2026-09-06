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
      className={`bg-cream-light border border-cream-border rounded-lg p-6 text-charcoal ${
        isStandaloneTab ? 'h-[calc(100vh-140px)] flex flex-col' : 'max-w-3xl w-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-cream-border mb-6">
        <div className="flex items-center space-x-3">
          <div className="rounded border border-sage/30 bg-sage/10 p-2 text-sage">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold font-serif text-charcoal">Cryptographic Audit & Offline Verifier</h2>
            <p className="text-xs text-charcoal-muted">
              Validates ECDSA signatures, update hashes, and Merkle DAG integrity
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="rounded p-1.5 text-charcoal-muted hover:bg-cream hover:text-charcoal transition-colors border border-transparent hover:border-cream-border"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Main Area */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver
              ? 'border-sage bg-sage/5'
              : 'border-cream-border bg-cream hover:border-charcoal-muted'
          }`}
        >
          <UploadCloud className="h-8 w-8 text-sage mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-charcoal">
            Drag and Drop any <span className="text-sage font-mono">.hermes.json</span> audit file
          </h4>
          <p className="text-xs text-charcoal-muted mt-1 mb-3">
            Runs fully offline in your browser using WebCrypto (zero network requests)
          </p>
          <label className="inline-block cursor-pointer bg-charcoal hover:bg-charcoal/90 text-cream text-xs font-semibold px-4 py-2 rounded border border-charcoal transition-colors">
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
          <div className="py-12 text-center text-charcoal-muted flex items-center justify-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin text-sage" />
            <span>Auditing cryptographic signatures & hashes...</span>
          </div>
        ) : report ? (
          <div className="space-y-4">
            {/* Verdict Card */}
            <div
              className={`p-5 rounded-lg border ${
                report.verdict === 'VALID'
                  ? 'bg-sage/10 border-sage/40 text-charcoal'
                  : report.verdict === 'INCOMPLETE'
                    ? 'bg-terracotta/10 border-terracotta/40 text-charcoal'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {report.verdict === 'VALID' ? (
                    <ShieldCheck className="h-8 w-8 text-sage" />
                  ) : report.verdict === 'INCOMPLETE' ? (
                    <AlertTriangle className="h-8 w-8 text-terracotta" />
                  ) : (
                    <ShieldAlert className="h-8 w-8 text-rose-600" />
                  )}
                  <div>
                    <h3
                      className={`text-lg font-bold font-serif ${
                        report.verdict === 'VALID'
                          ? 'text-sage'
                          : report.verdict === 'INCOMPLETE'
                            ? 'text-terracotta'
                            : 'text-rose-700'
                      }`}
                    >
                      {report.verdict === 'VALID'
                        ? '100% Cryptographically Verified'
                        : report.verdict === 'INCOMPLETE'
                          ? 'Incomplete Merkle DAG'
                          : 'Cryptographic Audit Failed'}
                    </h3>
                    <p className="text-xs text-charcoal-muted mt-0.5">{report.summary}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono bg-cream-light px-3 py-1 rounded border border-cream-border text-charcoal font-bold">
                    {report.verifiedCommits} / {report.totalCommits} Commits Valid
                  </span>
                </div>
              </div>
            </div>

            {/* Commit Breakdown Log */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-charcoal-muted uppercase tracking-wider font-mono">
                Verified Commit Chain
              </h4>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {report.details.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded bg-cream border border-cream-border text-xs font-mono text-charcoal"
                  >
                    <div className="flex items-center space-x-2">
                      {item.isValid ? (
                        <CheckCircle2 className="h-4 w-4 text-sage" />
                      ) : (
                        <XCircle className="h-4 w-4 text-terracotta" />
                      )}
                      <span className="font-bold">{item.commitId.slice(0, 12)}...</span>
                      <span className="text-charcoal-muted">|</span>
                      <span className="text-charcoal-muted">
                        {item.authorFingerprint?.slice(0, 14)}...
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {item.timestamp && (
                        <span className="text-charcoal-muted">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                          item.isValid
                            ? 'bg-sage/10 text-sage border-sage/30'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
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
