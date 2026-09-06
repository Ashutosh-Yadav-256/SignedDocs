# Zero-Cost Architecture Guide

HermesDocs is designed from the ground up to operate with **$0 infrastructure and zero recurring costs**.

## How Zero Cost Is Achieved

| Layer | Traditional Cloud Architecture | HermesDocs Zero-Cost Architecture | Cost |
| :--- | :--- | :--- | :--- |
| **Document State** | Cloud SQL / Postgres / Redis backend | Client-side Yjs CRDT in browser memory | **$0.00** |
| **History & Storage** | AWS S3 / DynamoDB database | Local IndexedDB in browser | **$0.00** |
| **Cryptography** | Cloud KMS / HSM servers | Native browser WebCrypto API (ECDSA P-256) | **$0.00** |
| **Same-Machine Sync** | WebSockets through cloud load balancer | Browser `BroadcastChannel` (cross-tab) | **$0.00** |
| **P2P Collaboration** | Dedicated TURN / relay servers | WebRTC direct DataChannels + Free Google STUN | **$0.00** |
| **Signaling Relay** | Managed PubSub / Socket.io hosting | Zero-dependency local/LAN Node.js relay | **$0.00** |
| **Hosting & Verifier** | Serverless compute / Lambda | Static hosting (GitHub Pages, Cloudflare Pages, Vercel) + Offline CLI | **$0.00** |

## Free Deployment Options
1. **Local / Air-Gapped**: Run completely offline via `npm run dev` or static file opening.
2. **Cloudflare Pages / GitHub Pages**: Deploy the `apps/web/dist` static bundle for free unlimited bandwidth hosting.
3. **Local Signaling**: Run `npm run signal` on your local network or router for peer discovery across devices on the same Wi-Fi.
