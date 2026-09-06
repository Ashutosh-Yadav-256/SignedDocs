#!/usr/bin/env node
import * as fs from 'node:fs';
import * as path from 'node:path';
import { HermesExportBundle, HermesVerifier } from '@hermes/core';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    console.log(`
╔══════════════════════════════════════════════════════════════════════════╗
║                    HERMESDOCS STANDALONE CLI VERIFIER                    ║
║         Local-First Cryptographic Provenance & Merkle DAG Auditor        ║
╚══════════════════════════════════════════════════════════════════════════╝

Usage:
  hermes verify <path-to-file.hermes.json>
  hermes inspect <path-to-file.hermes.json>

Options:
  --help, -h       Show this help message
  --json           Output raw JSON audit report
`);
    process.exit(0);
  }

  const isJson = args.includes('--json');
  const filteredArgs = args.filter((a) => !a.startsWith('-'));
  const filePath = filteredArgs[filteredArgs.length - 1];

  if (!filePath || !fs.existsSync(filePath)) {
    console.error(`\x1b[31mError: File not found at path: ${filePath}\x1b[0m`);
    process.exit(1);
  }

  let bundle: HermesExportBundle;
  try {
    const rawData = fs.readFileSync(path.resolve(filePath), 'utf-8');
    bundle = JSON.parse(rawData);
  } catch (err: any) {
    console.error(`\x1b[31mError: Failed to parse JSON file: ${err.message}\x1b[0m`);
    process.exit(1);
  }

  if (!isJson) {
    console.log(`\n\x1b[36mAuditing bundle:\x1b[0m ${path.resolve(filePath)}`);
    console.log(`\x1b[36mDocument Title:\x1b[0m  ${bundle?.document?.title || 'Unknown'}`);
    console.log(`\x1b[36mDocument ID:\x1b[0m     ${bundle?.document?.id || 'Unknown'}`);
    console.log(`\x1b[36mTotal Commits:\x1b[0m   ${bundle?.commits?.length || 0}`);
    console.log('──────────────────────────────────────────────────────────────────────────');
  }

  const report = await HermesVerifier.verifyExportBundle(bundle);

  if (isJson) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.verdict === 'VALID' ? 0 : 1);
  }

  // Display commit-by-commit audit log
  console.log('\x1b[1mCommit Verification Log:\x1b[0m');
  for (const detail of report.details) {
    const shortId = detail.commitId.slice(0, 12);
    const shortFp = detail.authorFingerprint?.slice(0, 15) || 'unknown';
    const dateStr = detail.timestamp ? new Date(detail.timestamp).toISOString() : '';

    if (detail.isValid) {
      console.log(`  \x1b[32m✔ [VALID]\x1b[0m ${shortId}... | Author: ${shortFp} | ${dateStr}`);
    } else {
      console.log(`  \x1b[31m✖ [${detail.verdict}]\x1b[0m ${shortId}... | Error: ${detail.error}`);
    }
  }

  console.log('──────────────────────────────────────────────────────────────────────────');
  console.log(`\x1b[1mAudit Summary:\x1b[0m ${report.summary}`);
  console.log(`\x1b[1mDAG Connectivity:\x1b[0m ${report.isDAGConnected ? '\x1b[32mConnected\x1b[0m' : '\x1b[33mDisconnected / Incomplete\x1b[0m'}`);
  console.log(`\x1b[1mCycle Check:\x1b[0m      ${report.hasCycles ? '\x1b[31mCycles Detected!\x1b[0m' : '\x1b[32mClean Acyclic DAG\x1b[0m'}`);
  console.log(`\x1b[1mDAG Heads:\x1b[0m        ${report.heads.map((h) => h.slice(0, 8)).join(', ')}`);
  console.log('──────────────────────────────────────────────────────────────────────────');

  if (report.verdict === 'VALID') {
    console.log(`\x1b[32m\x1b[1m[VALID]\x1b[0m\n`);
    console.log(`\x1b[32m  ✓ Commit schemas valid\x1b[0m`);
    console.log(`\x1b[32m  ✓ Update hashes valid\x1b[0m`);
    console.log(`\x1b[32m  ✓ Commit IDs valid\x1b[0m`);
    console.log(`\x1b[32m  ✓ ECDSA signatures valid\x1b[0m`);
    console.log(`\x1b[32m  ✓ DAG references valid\x1b[0m`);
    console.log(`\x1b[32m  ✓ Document reconstruction successful\x1b[0m\n`);
    console.log(`\x1b[33m  ℹ Timestamp authenticity is not independently proven.\x1b[0m\n`);
    process.exit(0);
  } else if (report.verdict === 'INCOMPLETE') {
    console.log(`\x1b[33m\x1b[1m[INCOMPLETE]\x1b[0m\n`);
    console.log(`\x1b[33m  ⚠ Missing parent commits detected in DAG history.\x1b[0m\n`);
    process.exit(2);
  } else {
    console.log(`\x1b[31m\x1b[1m[INVALID]\x1b[0m\n`);
    console.log(`\x1b[31m  ✖ Security check failed: signatures, hashes, or DAG acyclicity invalid.\x1b[0m\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal verifier error:', err);
  process.exit(1);
});
