# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Music City is a decentralized music streaming platform built on the Internet Computer (IC) blockchain. It combines a Next.js frontend with Motoko smart contracts and Web3Auth for authentication.

## Architecture

### Frontend Stack
- **Framework**: Next.js 15.2.4 with React 19
- **UI**: Tailwind CSS with Radix UI components and shadcn/ui
- **Authentication**: Web3Auth for social login + IC Internet Identity/NFID
- **State Management**: React Context (useAuth hook)
- **Data Storage**: Mock database (lib/mock-database.ts) for user profiles

### Backend Stack
- **Blockchain**: Internet Computer (IC) with Motoko canisters
- **Canisters**: 
  - `music_city_backend`: Core business logic (users, tracks, NFTs, transactions)
  - `storage_index`: File storage management
  - `storage_bucket`: Asset storage bucket
- **Agent**: @dfinity/agent for IC integration

### Authentication Flow
1. **Web3Auth**: Social login (Google, Facebook, Twitter, etc.) via `/components/web3-auth.tsx`
2. **IC Identity**: Internet Identity or NFID for IC canister calls
3. **Hybrid Auth**: Users can use both Web3Auth (for wallet) and IC identity (for canister interactions)

## Common Development Commands

### Frontend Development
```bash
# Start development server
npm run dev

# Build production
npm run build

# Run linting
npm run lint

# Start production server  
npm start
```

### IC Canister Development
```bash
# Start local IC replica
dfx start --clean --background

# Deploy all canisters
dfx deploy

# Deploy specific canister
dfx deploy music_city_backend

# Get canister ID
dfx canister id music_city_backend

# Stop local replica
dfx stop
```

### Testing Backend Functions
```bash
# Register a user
dfx canister call music_city_backend registerUser '("Alex", variant { artist }, "Bio", "LA", vec {"Pop"}, "/img.png", null)'

# Create a track
dfx canister call music_city_backend createTrack '("Electric Dreams", "3:24", "Pop", "/cover.jpg", "/audio.mp3", 10, "2025-08-01", "Desc")'

# List tracks
dfx canister call music_city_backend listTracks '()'

# Stream track (increments plays, credits royalties)
dfx canister call music_city_backend streamTrack '(1)'
```

## Key File Locations

### Frontend
- **Pages**: `/app/*` (Next.js App Router)
- **Components**: `/components/` (UI components)
- **Hooks**: `/hooks/use-auth.tsx` (authentication state)
- **Types**: `/lib/types.ts` (shared TypeScript types)
- **IC Integration**: `/lib/ic/` (agent, backend, auth, storage)
- **Mock Data**: `/lib/mock-database.ts` (user profiles, development data)

### Backend (Motoko)
- **Main Canister**: `/src/music_city_backend/main.mo`
- **Types**: `/src/music_city_backend/types.mo`
- **User Logic**: `/src/music_city_backend/users.mo`
- **Track Logic**: `/src/music_city_backend/tracks.mo`
- **NFT Logic**: `/src/music_city_backend/nfts.mo`
- **Storage**: `/src/storage/` (file storage canisters)

### Configuration
- **IC Config**: `/dfx.json` (canister definitions)
- **Next.js Config**: `/next.config.mjs`
- **Tailwind**: `/tailwind.config.ts`
- **Package Info**: `/package.json`

## Development Workflow

### Adding New Features
1. Update types in `/lib/types.ts` if needed
2. Implement Motoko backend logic in `/src/music_city_backend/`
3. Add frontend integration in `/lib/ic/backend.ts`
4. Create/update UI components in `/components/`
5. Update mock database if needed for development

### Environment Setup
- Web3Auth requires `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID` in `.env.local`
- IC network config via `NEXT_PUBLIC_DFX_NETWORK` (local/ic)
- Local development uses `http://127.0.0.1:4943` for IC replica

### State Management
- User authentication state: `useAuth()` hook
- IC backend state: Singleton actor pattern in `/lib/ic/backend.ts`
- Local user data: Mock database with localStorage persistence

## Important Notes

- All IC calls require proper identity setup via `setIdentity()` in backend.ts
- Frontend uses both Web3Auth (wallet) and IC identity (canisters) simultaneously
- Mock database used for rapid frontend development without IC dependency
- Asset storage uses separate bucket canister for files/images
- All monetary values use bigint for precision in IC interactions
- User profiles can exist in both mock DB (frontend) and IC backend (blockchain)