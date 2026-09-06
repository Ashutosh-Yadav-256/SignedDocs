import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Radio,
  Camera,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Copy,
  Download,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  AirGapFountain,
  AirGapReceiver,
  AirGapFrame,
} from '@hermes/core';

interface AirGapSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  documentText: string;
  onApplyReconstructedPayload: (payload: string) => void;
}

export const AirGapSyncModal: React.FC<AirGapSyncModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  documentText,
  onApplyReconstructedPayload,
}) => {
  const [activeTab, setActiveTab] = useState<'transmit' | 'receive'>('transmit');

  // Transmit State
  const [frames, setFrames] = useState<AirGapFrame[]>([]);
  const [rawFrameStrings, setRawFrameStrings] = useState<string[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [fps, setFps] = useState(6); // 6 frames/sec
  const [sessionId, setSessionId] = useState('');

  // Receive State
  const receiverRef = useRef<AirGapReceiver>(new AirGapReceiver());
  const [manualInput, setManualInput] = useState('');
  const [receiveSession, setReceiveSession] = useState(receiverRef.current.getSession());
  const [reconstructedText, setReconstructedText] = useState<string | null>(null);

  // Initialize transmitter when modal opens
  useEffect(() => {
    if (isOpen && documentText) {
      AirGapFountain.createFrames(documentText, 180).then((res) => {
        setSessionId(res.sessionId);
        setFrames(res.frames);
        setRawFrameStrings(res.rawFrameStrings);
        setCurrentFrameIndex(0);
      });
    }
  }, [isOpen, documentText]);

  // Transmit Animation Loop
  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentFrameIndex((prev) => (prev + 1) % frames.length);
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [isPlaying, frames.length, fps]);

  if (!isOpen) return null;

  const currentFrame = frames[currentFrameIndex];
  const currentRawString = rawFrameStrings[currentFrameIndex] || '';

  const handleIngestFrame = async (rawStr: string) => {
    const res = await receiverRef.current.ingestRawString(rawStr);
    setReceiveSession(res.session);
    if (res.isComplete && res.payload) {
      setReconstructedText(res.payload);
    }
  };

  const handleSimulateSelfIngest = async () => {
    // Pipe all generated frames sequentially to test instant optical reconstruction
    receiverRef.current.reset();
    for (const raw of rawFrameStrings) {
      const res = await receiverRef.current.ingestRawString(raw);
      setReceiveSession(res.session);
      if (res.isComplete && res.payload) {
        setReconstructedText(res.payload);
      }
    }
  };

  const handleApplyToDocument = () => {
    if (reconstructedText) {
      onApplyReconstructedPayload(reconstructedText);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                Air-Gapped Optical Sneakernet Sync
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono">
                  Fountain QR
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                100% wireless & offline synchronization across physical air gaps using animated optical QR streams.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 pt-2">
          <button
            onClick={() => setActiveTab('transmit')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'transmit'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-4 h-4" />
            1. Transmit Optical Stream
          </button>
          <button
            onClick={() => setActiveTab('receive')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'receive'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            2. Ingest & Reconstruct
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'transmit' && (
            <div className="space-y-6">
              {frames.length > 0 ? (
                <div className="flex flex-col items-center space-y-4">
                  {/* Optical Projector Display Frame */}
                  <div className="w-full max-w-sm aspect-square bg-slate-950 border-2 border-cyan-500/50 rounded-2xl p-6 flex flex-col items-center justify-center relative shadow-2xl shadow-cyan-950/50">
                    <div className="text-center space-y-2">
                      <div className="p-4 bg-white rounded-xl shadow-inner inline-block">
                        <QrCode className="w-36 h-36 text-slate-950" />
                      </div>
                      <div className="font-mono text-xs text-cyan-400 font-semibold">
                        Frame {currentFrameIndex + 1} / {frames.length}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500 truncate max-w-[240px]">
                        Session: {sessionId} • CRC: {currentFrame?.checksum}
                      </div>
                    </div>

                    {/* Active Scanline Effect */}
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent top-1/2 -translate-y-1/2 animate-pulse opacity-60" />
                  </div>

                  {/* Wire String Representation */}
                  <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 break-all">
                    <span className="text-cyan-400 font-bold">QR Payload: </span>
                    {currentRawString}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between w-full max-w-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition-all"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setCurrentFrameIndex(0)}
                        className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-400 font-medium">Speed:</span>
                      {[4, 6, 10, 15].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => setFps(rate)}
                          className={`px-2 py-1 rounded text-xs font-mono font-semibold transition-all ${
                            fps === rate
                              ? 'bg-cyan-500 text-slate-950'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {rate}fps
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">Loading document frames...</div>
              )}
            </div>
          )}

          {activeTab === 'receive' && (
            <div className="space-y-6">
              {/* Receiver Status Bar */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span className="text-xs font-semibold text-slate-200">
                      Optical Stream Progress: {receiveSession.receivedCount} / {receiveSession.totalFrames || '?'} Frames ({receiveSession.progressPercentage}%)
                    </span>
                  </div>
                  {receiveSession.isComplete ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 100% RECONSTRUCTED
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-slate-500">
                      Session: {receiveSession.sessionId || 'Listening...'}
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                    style={{ width: `${receiveSession.progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Simulation / Manual Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-300">
                    Paste Optical QR Frame (or run simulation)
                  </label>
                  <button
                    onClick={handleSimulateSelfIngest}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Simulate Full Optical Stream Scan
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="e.g. HAG1:sessionId:0:4:checksum:payload"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    onClick={() => {
                      if (manualInput.trim()) {
                        handleIngestFrame(manualInput.trim());
                        setManualInput('');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition-all"
                  >
                    Ingest Frame
                  </button>
                </div>
              </div>

              {/* Reconstructed Content Preview */}
              {reconstructedText && (
                <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Payload Bit-Exact Reconstructed ({reconstructedText.length} bytes)
                    </span>
                    <button
                      onClick={handleApplyToDocument}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all"
                    >
                      Apply to Editor
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 rounded-xl font-mono text-xs text-slate-300 max-h-40 overflow-y-auto border border-slate-800">
                    {reconstructedText}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
