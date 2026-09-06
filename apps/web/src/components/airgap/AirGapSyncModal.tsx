import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Radio,
  Camera,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  X,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4">
      <div className="bg-cream-light border border-cream-border rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-charcoal">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cream-border flex items-center justify-between bg-cream">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded border border-sage/30 bg-sage/10 text-sage">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold flex items-center gap-2 text-charcoal">
                Air-Gapped Optical Sneakernet Sync
                <span className="text-[10px] px-2 py-0.5 rounded bg-cream-light border border-cream-border text-sage font-mono">
                  Fountain QR
                </span>
              </h2>
              <p className="text-xs text-charcoal-muted">
                100% wireless & offline synchronization across physical air gaps using animated optical QR streams.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-charcoal-muted hover:text-charcoal hover:bg-cream-dark transition-colors border border-transparent hover:border-cream-border"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-cream-border bg-cream px-6 pt-2 text-xs">
          <button
            onClick={() => setActiveTab('transmit')}
            className={`px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'transmit'
                ? 'border-charcoal text-charcoal font-semibold bg-cream-light rounded-t'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <Play className="w-4 h-4" />
            1. Transmit Optical Stream
          </button>
          <button
            onClick={() => setActiveTab('receive')}
            className={`px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'receive'
                ? 'border-charcoal text-charcoal font-semibold bg-cream-light rounded-t'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'
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
                  <div className="w-full max-w-sm aspect-square bg-cream border-2 border-cream-border rounded-lg p-6 flex flex-col items-center justify-center relative">
                    <div className="text-center space-y-2">
                      <div className="p-4 bg-cream-light border border-cream-border rounded inline-block">
                        <QrCode className="w-36 h-36 text-charcoal" />
                      </div>
                      <div className="font-mono text-xs text-charcoal font-semibold">
                        Frame {currentFrameIndex + 1} / {frames.length}
                      </div>
                      <div className="font-mono text-[10px] text-charcoal-muted truncate max-w-[240px]">
                        Session: {sessionId} • CRC: {currentFrame?.checksum}
                      </div>
                    </div>
                  </div>

                  {/* Wire String Representation */}
                  <div className="w-full bg-cream border border-cream-border rounded-lg p-3 font-mono text-[11px] text-charcoal break-all">
                    <span className="text-sage font-bold">QR Payload: </span>
                    {currentRawString}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between w-full max-w-sm">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="p-2.5 rounded bg-charcoal hover:bg-charcoal/90 text-cream font-bold transition-colors border border-charcoal"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setCurrentFrameIndex(0)}
                        className="p-2.5 rounded bg-cream hover:bg-cream-dark text-charcoal border border-cream-border transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-charcoal-muted font-medium">Speed:</span>
                      {[4, 6, 10, 15].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => setFps(rate)}
                          className={`px-2 py-1 rounded text-xs font-mono font-semibold transition-colors border ${
                            fps === rate
                              ? 'bg-charcoal text-cream border-charcoal'
                              : 'bg-cream text-charcoal-muted border-cream-border hover:text-charcoal'
                          }`}
                        >
                          {rate}fps
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-charcoal-muted">Loading document frames...</div>
              )}
            </div>
          )}

          {activeTab === 'receive' && (
            <div className="space-y-6">
              {/* Receiver Status Bar */}
              <div className="p-4 rounded-lg bg-cream border border-cream-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Radio className="w-4 h-4 text-sage" />
                    <span className="text-xs font-semibold text-charcoal">
                      Optical Stream Progress: {receiveSession.receivedCount} / {receiveSession.totalFrames || '?'} Frames ({receiveSession.progressPercentage}%)
                    </span>
                  </div>
                  {receiveSession.isComplete ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sage/15 border border-sage/40 text-sage flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 100% RECONSTRUCTED
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-charcoal-muted">
                      Session: {receiveSession.sessionId || 'Listening...'}
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-cream-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sage transition-all duration-300"
                    style={{ width: `${receiveSession.progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Simulation / Manual Input */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-charcoal">
                    Paste Optical QR Frame (or run simulation)
                  </label>
                  <button
                    onClick={handleSimulateSelfIngest}
                    className="text-xs text-sage hover:text-sage font-medium flex items-center gap-1"
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
                    className="flex-1 bg-cream border border-cream-border rounded px-3 py-2 text-xs font-mono text-charcoal focus:outline-none focus:border-charcoal"
                  />
                  <button
                    onClick={() => {
                      if (manualInput.trim()) {
                        handleIngestFrame(manualInput.trim());
                        setManualInput('');
                      }
                    }}
                    className="px-4 py-2 rounded bg-charcoal hover:bg-charcoal/90 text-cream font-bold text-xs transition-colors border border-charcoal"
                  >
                    Ingest Frame
                  </button>
                </div>
              </div>

              {/* Reconstructed Content Preview */}
              {reconstructedText && (
                <div className="p-4 rounded-lg bg-sage/10 border border-sage/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sage flex items-center gap-1.5 font-serif">
                      <CheckCircle2 className="w-4 h-4" />
                      Payload Bit-Exact Reconstructed ({reconstructedText.length} bytes)
                    </span>
                    <button
                      onClick={handleApplyToDocument}
                      className="px-3 py-1.5 rounded bg-charcoal hover:bg-charcoal/90 text-cream font-bold text-xs transition-colors border border-charcoal"
                    >
                      Apply to Editor
                    </button>
                  </div>
                  <pre className="p-3 bg-cream-light rounded font-mono text-xs text-charcoal max-h-40 overflow-y-auto border border-cream-border">
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
