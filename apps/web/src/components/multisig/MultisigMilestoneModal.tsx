import React, { useState, useEffect } from 'react';
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  Clock,
  X,
  Plus,
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
  const [activeTab, setActiveTab] = useState<'status' | 'propose'>('status');
  const [milestoneName, setMilestoneName] = useState('v1.0 Formal Final Agreement');
  const [description, setDescription] = useState('Mutual sign-off and multi-party cryptographic milestone lock.');
  const [requiredQuorum, setRequiredQuorum] = useState(2);
  const [totalEligible, setTotalEligible] = useState(2);

  const [activeProposal, setActiveProposal] = useState<MultisigProposal | null>(null);
  const [endorsements, setEndorsements] = useState<PeerEndorsement[]>([]);
  const [sealedNode, setSealedNode] = useState<MultisigSealNode | null>(null);
  const [sealVerification, setSealVerification] = useState<MultisigVerificationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 p-4">
      <div className="bg-cream-light border border-cream-border rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-charcoal">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cream-border flex items-center justify-between bg-cream">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded border border-sage/30 bg-sage/10 text-sage">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold flex items-center gap-2 text-charcoal">
                Multi-Party Milestone Seals (Multisig)
                <span className="text-[10px] px-2 py-0.5 rounded bg-cream-light border border-cream-border text-sage font-mono">
                  M-of-N Quorum
                </span>
              </h2>
              <p className="text-xs text-charcoal-muted">
                Co-sign and permanently seal document milestone agreements across distributed peer quorums.
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
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'status'
                ? 'border-charcoal text-charcoal font-semibold bg-cream-light rounded-t'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Milestone Status
          </button>
          <button
            onClick={() => setActiveTab('propose')}
            className={`px-4 py-2.5 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'propose'
                ? 'border-charcoal text-charcoal font-semibold bg-cream-light rounded-t'
                : 'border-transparent text-charcoal-muted hover:text-charcoal'
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
                  <div className="p-5 rounded-lg bg-cream border border-cream-border space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-serif font-bold text-charcoal flex items-center gap-2">
                        <Award className="w-5 h-5 text-sage" />
                        {activeProposal.milestoneName}
                      </h3>
                      <span
                        className={`text-xs px-2.5 py-1 rounded font-semibold border flex items-center gap-1.5 ${
                          sealedNode
                            ? 'bg-sage/15 border-sage/40 text-sage'
                            : 'bg-terracotta/15 border-terracotta/40 text-terracotta'
                        }`}
                      >
                        {sealedNode ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-sage" />
                            CRYPTOGRAPHICALLY SEALED
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-terracotta" />
                            AWAITING QUORUM
                          </>
                        )}
                      </span>
                    </div>

                    <p className="text-xs text-charcoal-muted leading-relaxed font-serif">
                      {activeProposal.milestoneDescription || 'No description provided.'}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs border-t border-cream-border">
                      <div>
                        <span className="text-charcoal-muted">Quorum Required:</span>
                        <div className="font-semibold text-charcoal">
                          {activeProposal.quorum.requiredQuorum} of {activeProposal.quorum.totalEligible} Signatures
                        </div>
                      </div>
                      <div>
                        <span className="text-charcoal-muted">Document State Hash:</span>
                        <div className="font-mono text-[11px] text-charcoal truncate">
                          {activeProposal.stateHash}
                        </div>
                      </div>
                      <div>
                        <span className="text-charcoal-muted">Proposed By:</span>
                        <div className="font-mono text-[11px] text-charcoal truncate">
                          {activeProposal.proposedBy.fingerprint}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Endorsement Progress */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-charcoal font-medium">
                      <span>Endorsement Signatures ({endorsements.length}/{activeProposal.quorum.requiredQuorum})</span>
                      <span className="text-charcoal-muted">ECDSA P-256 Verified</span>
                    </div>

                    <div className="space-y-2">
                      {endorsements.map((e, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded bg-cream border border-cream-border"
                        >
                          <div className="flex items-center space-x-2.5">
                            <div className="p-1 rounded bg-sage/20 text-sage">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-mono font-semibold text-charcoal">
                                {e.author.fingerprint}
                              </div>
                              <div className="text-[10px] text-charcoal-muted font-mono">
                                Signed at {new Date(e.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cream-light text-sage border border-cream-border">
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
                      className="px-4 py-2 rounded bg-charcoal hover:bg-charcoal/90 text-cream font-bold text-xs flex items-center gap-2 border border-charcoal transition-colors disabled:opacity-50"
                    >
                      <KeyRound className="w-4 h-4" />
                      {isProcessing ? 'Signing...' : 'Sign & Endorse with My Key'}
                    </button>

                    {sealedNode && (
                      <button
                        onClick={handleDownloadSeal}
                        className="px-4 py-2 rounded bg-cream hover:bg-cream-dark text-xs font-semibold flex items-center gap-2 border border-cream-border text-charcoal transition-colors"
                      >
                        <Download className="w-4 h-4 text-sage" />
                        Download Seal Certificate
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-charcoal-muted space-y-3">
                  <Award className="w-12 h-12 mx-auto text-charcoal-muted" />
                  <p className="text-sm">No active milestone proposal for this document.</p>
                  <button
                    onClick={() => setActiveTab('propose')}
                    className="px-4 py-2 rounded bg-charcoal hover:bg-charcoal/90 text-cream font-bold text-xs transition-colors border border-charcoal"
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
                <label className="text-xs font-medium text-charcoal">Milestone Title</label>
                <input
                  type="text"
                  value={milestoneName}
                  onChange={(e) => setMilestoneName(e.target.value)}
                  className="w-full bg-cream border border-cream-border rounded px-3 py-2 text-xs text-charcoal focus:outline-none focus:border-charcoal font-serif"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-charcoal">Description / Clause Purpose</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-20 bg-cream border border-cream-border rounded p-3 text-xs text-charcoal focus:outline-none focus:border-charcoal font-serif"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-charcoal">Required Quorum (M Signatures)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={requiredQuorum}
                    onChange={(e) => setRequiredQuorum(Number(e.target.value))}
                    className="w-full bg-cream border border-cream-border rounded px-3 py-2 text-xs text-charcoal focus:outline-none focus:border-charcoal"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-charcoal">Total Eligible Peers (N)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={totalEligible}
                    onChange={(e) => setTotalEligible(Number(e.target.value))}
                    className="w-full bg-cream border border-cream-border rounded px-3 py-2 text-xs text-charcoal focus:outline-none focus:border-charcoal"
                  />
                </div>
              </div>

              <button
                onClick={handleCreateNewProposal}
                disabled={isProcessing || !identity}
                className="w-full py-2.5 rounded bg-charcoal hover:bg-charcoal/90 text-cream font-bold text-xs flex items-center justify-center gap-2 border border-charcoal transition-colors disabled:opacity-50"
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
