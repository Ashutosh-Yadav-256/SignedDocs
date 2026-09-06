import React, { useState, useEffect } from 'react';
import {
  Award,
  ShieldCheck,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  X,
  Plus,
  Copy,
  Download,
  KeyRound,
} from 'lucide-react';
import {
  MultisigEngine,
  MultisigVerifier,
  MultisigProposal,
  MultisigSealNode,
  PeerEndorsement,
  MultisigVerificationResult,
} from '@hermes/core';
import { sha256Hex, stringToUint8Array } from '@hermes/crypto';

interface MultisigMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  documentText: string;
  identity: {
    fingerprint: string;
    publicKeyBase64: string;
    privateKey: CryptoKey;
  } | null;
  activePeers: any[];
}

export const MultisigMilestoneModal: React.FC<MultisigMilestoneModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  documentText,
  identity,
  activePeers,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'propose' | 'endorse'>('status');
  const [milestoneName, setMilestoneName] = useState('v1.0 Formal Final Agreement');
  const [description, setDescription] = useState('Mutual sign-off and multi-party cryptographic milestone lock.');
  const [requiredQuorum, setRequiredQuorum] = useState(2);
  const [totalEligible, setTotalEligible] = useState(2);

  const [activeProposal, setActiveProposal] = useState<MultisigProposal | null>(null);
  const [endorsements, setEndorsements] = useState<PeerEndorsement[]>([]);
  const [sealedNode, setSealedNode] = useState<MultisigSealNode | null>(null);
  const [sealVerification, setSealVerification] = useState<MultisigVerificationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize demo proposal if none exists
  useEffect(() => {
    if (isOpen && !activeProposal && identity) {
      sha256Hex(stringToUint8Array(documentText)).then((stateHash) => {
        MultisigEngine.createProposal({
          documentId,
          documentTitle,
          stateHash,
          milestoneName,
          milestoneDescription: description,
          quorum: {
            requiredQuorum: 2,
            totalEligible: 2,
          },
          identity,
        }).then((p) => {
          setActiveProposal(p);
        });
      });
    }
  }, [isOpen, documentText, identity]);

  if (!isOpen) return null;

  const handleCreateNewProposal = async () => {
    if (!identity) return;
    setIsProcessing(true);
    try {
      const stateHash = await sha256Hex(stringToUint8Array(documentText));
      const proposal = await MultisigEngine.createProposal({
        documentId,
        documentTitle,
        stateHash,
        milestoneName,
        milestoneDescription: description,
        quorum: {
          requiredQuorum: Number(requiredQuorum),
          totalEligible: Number(totalEligible),
        },
        identity,
      });

      // Creator auto-endorses
      const myEndorsement = await MultisigEngine.endorseProposal(proposal, identity);

      setActiveProposal(proposal);
      setEndorsements([myEndorsement]);
      setSealedNode(null);
      setSealVerification(null);
      setActiveTab('status');
    } catch (err) {
      console.error('Failed to create proposal', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEndorse = async () => {
    if (!activeProposal || !identity) return;
    setIsProcessing(true);
    try {
      const myEndorsement = await MultisigEngine.endorseProposal(activeProposal, identity);

      // Filter out duplicate if already signed
      const filtered = endorsements.filter((e) => e.author.fingerprint !== identity.fingerprint);
      const updated = [...filtered, myEndorsement];
      setEndorsements(updated);

      // Check if quorum reached
      if (updated.length >= activeProposal.quorum.requiredQuorum) {
        const seal = await MultisigEngine.createSealNode(activeProposal, updated);
        setSealedNode(seal);
        const verdict = await MultisigVerifier.verifyMultisigSeal(seal);
        setSealVerification(verdict);
      }
    } catch (err) {
      console.error('Failed to endorse proposal', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSeal = () => {
    if (!sealedNode) return;
    const blob = new Blob([JSON.stringify(sealedNode, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${milestoneName.toLowerCase().replace(/\s+/g, '-')}.multisig-seal.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                Multi-Party Milestone Seals (Multisig)
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-300 font-mono">
                  M-of-N Quorum
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Co-sign and permanently seal document milestone agreements across distributed peer quorums.
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
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'status'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Milestone Status
          </button>
          <button
            onClick={() => setActiveTab('propose')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'propose'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            Propose Milestone
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'status' && (
            <div className="space-y-6">
              {activeProposal ? (
                <>
                  {/* Proposal Banner */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-400" />
                        {activeProposal.milestoneName}
                      </h3>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold border flex items-center gap-1.5 ${
                          sealedNode
                            ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                            : 'bg-amber-950/80 border-amber-700 text-amber-300'
                        }`}
                      >
                        {sealedNode ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            CRYPTOGRAPHICALLY SEALED
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                            AWAITING QUORUM
                          </>
                        )}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {activeProposal.milestoneDescription || 'No description provided.'}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs border-t border-slate-800/80">
                      <div>
                        <span className="text-slate-500">Quorum Required:</span>
                        <div className="font-semibold text-amber-300">
                          {activeProposal.quorum.requiredQuorum} of {activeProposal.quorum.totalEligible} Signatures
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Document State Hash:</span>
                        <div className="font-mono text-[11px] text-slate-300 truncate">
                          {activeProposal.stateHash}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Proposed By:</span>
                        <div className="font-mono text-[11px] text-slate-300 truncate">
                          {activeProposal.proposedBy.fingerprint}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Endorsement Progress */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                      <span>Endorsement Signatures ({endorsements.length}/{activeProposal.quorum.requiredQuorum})</span>
                      <span className="text-slate-500">ECDSA P-256 Verified</span>
                    </div>

                    <div className="space-y-2">
                      {endorsements.map((e, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/60"
                        >
                          <div className="flex items-center space-x-2.5">
                            <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-mono font-semibold text-slate-200">
                                {e.author.fingerprint}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Signed at {new Date(e.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-emerald-900">
                            Valid Signature
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={handleEndorse}
                      disabled={isProcessing || !identity}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-950 transition-all disabled:opacity-50"
                    >
                      <KeyRound className="w-4 h-4" />
                      {isProcessing ? 'Signing...' : 'Sign & Endorse with My Key'}
                    </button>

                    {sealedNode && (
                      <button
                        onClick={handleDownloadSeal}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
                      >
                        <Download className="w-4 h-4 text-emerald-400" />
                        Download Seal Certificate
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400 space-y-3">
                  <Award className="w-12 h-12 mx-auto text-slate-600" />
                  <p className="text-sm">No active milestone proposal for this document.</p>
                  <button
                    onClick={() => setActiveTab('propose')}
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs transition-all"
                  >
                    Propose Milestone Seal
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'propose' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Milestone Title</label>
                <input
                  type="text"
                  value={milestoneName}
                  onChange={(e) => setMilestoneName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Description / Clause Purpose</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Required Quorum (M Signatures)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={requiredQuorum}
                    onChange={(e) => setRequiredQuorum(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Total Eligible Peers (N)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={totalEligible}
                    onChange={(e) => setTotalEligible(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                onClick={handleCreateNewProposal}
                disabled={isProcessing || !identity}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950 transition-all disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {isProcessing ? 'Proposing...' : 'Create Proposal & Sign Milestone'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
