# File Upload System — Backend

Express 5 + TypeScript (ESM) + Prisma 7 (`@prisma/adapter-pg`) + Postgres + Redis, backing the upload strategies demoed in the sibling `file-upload-system-frontend` repo. See that repo's README for the full architecture diagram, strategy comparison, and the reasoning behind the resilience/design decisions below — this one stays focused on what's actually in this repo.

## API surface

### `/api/uploads` — local upload strategies (`src/routes/upload.routes.ts`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/single` | Traditional whole-file upload (multer memoryStorage, hashed + deduped, stored under `storage/traditional/<uploadId>/`) |
| POST | `/init` | Create/resume/dedupe a chunked-upload session by file hash |
| POST | `/chunk` | Upload one chunk (checksum-verified on arrival); merges + hash-verifies on the last chunk |
| GET | `/:uploadId/status` | Poll a chunked upload's status/progress |
| DELETE | `/:uploadId` | Abort a chunked upload (wipes its chunk files, marks it `FAILED`) |
| GET | `/` | List uploads (query-filterable, see `listUploadsQuerySchema`) |
| GET | `/:uploadId` | Read one upload's full DB record |
| GET | `/:uploadId/download` | Download a completed upload's file |
| DELETE | `/:uploadId/permanent` | Permanently delete an upload (disk file + DB row + Redis cleanup) |
| GET | `/:uploadId/chunks` | List an in-progress upload's chunks as tracked in Redis |
| GET | `/:uploadId/chunks/:chunkIndex` | Get one chunk's status from Redis |
| DELETE | `/:uploadId/chunks/:chunkIndex` | Delete one chunk's Redis record |
| DELETE | `/:uploadId/chunks` | Delete all Redis chunk records for an upload |

Rate limits are route-specific: tight on `/init` (session creation is cheap to abuse), loose on `/chunk` (a legitimate large upload makes many of these), moderate on `/single`.

### `/api/cloudinary` — direct-to-Cloudinary strategy (`src/routes/cloudinary.routes.ts`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/sign` | Sign an upload request so the client can upload straight to Cloudinary |
| POST | `/save` | Persist a completed Cloudinary upload as a `CloudinaryAsset` row |
| GET | `/` | List saved Cloudinary assets (query-filterable) |
| GET | `/:id` | Read one Cloudinary asset |
| DELETE | `/:id` | Delete a Cloudinary asset (Cloudinary + DB) |

A global rate limiter (1000 req / 15 min per IP) applies to all `/api/*` routes on top of the route-specific limits above.

## Data model (`prisma/schema.prisma`)

- **`Upload`** — the local chunked-upload flow. `fileHash` is unique (whole-file dedup); tracks `status` (`NEW` → `UPLOADING` → `MERGING` → `COMPLETED`/`FAILED`) and chunk progress (`totalChunks`/`uploadedChunks`). Traditional single-file uploads get an `Upload` row too (`totalChunks: 1`), for the same dedup/tracking the other strategy has.
- **`CloudinaryAsset`** — records for files uploaded directly to Cloudinary (`publicId` and `fileHash` both unique).

Per-chunk checksums (SHA-256, verified on arrival before bytes are written to disk) and in-progress chunk bookkeeping live in Redis, not Postgres — see `src/services/chunk/`.

## Setup

```bash
npm install
docker compose up -d     # starts Redis (see docker-compose.yml)
npx prisma migrate dev   # applies migrations against DATABASE_URL
npm run dev
```

Required env vars (`.env`, see `.env.example`):

| Var | Purpose |
|---|---|
| `PORT` | HTTP port |
| `DATABASE_URL` | Postgres connection string |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Cloudinary account credentials, used to sign uploads |
| `REDIS_URL` | Redis connection string (defaults to `redis://localhost:6380` with the bundled `docker-compose.yml`) |

`npm run cleanup:orphans` deletes uploads stuck in `NEW`/`UPLOADING`/`FAILED` for more than 24h (and their on-disk chunks). Run manually or wire it to a host cron entry — deliberately not scheduled in-process, since a single-instance demo gains nothing from that over a documented script and it adds real operational risk (no distributed lock) if ever scaled to multiple instances.
