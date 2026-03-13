# Fullstack Group App

Setup awal project fullstack dengan:
- Backend: Express (`backend/`)
- Frontend: React + Vite (`frontend/`)

## Prerequisites
- Node.js 20+
- npm 10+

## Install
Semua dependency sudah diinstall saat setup awal. Jika clone ulang project:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

## Run Development
Jalankan backend + frontend bersamaan dari root:

```bash
npm run dev
```

Default:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

Catatan: jika port 5173 dipakai proses lain, Vite otomatis pindah port (mis. 5174).

## Backend Environment
Salin file contoh env:

```bash
copy backend\.env.example backend\.env
```

Isi default:
- `PORT=5000`
- `FRONTEND_URL=http://localhost:5173`

## Health Check
- Endpoint: `GET /api/health`
- Frontend sudah memanggil endpoint ini saat pertama kali render.
