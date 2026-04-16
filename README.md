# Fullstack Group App

Main branch dipakai sebagai baseline konfigurasi awal project. Implementasi fitur dilakukan di branch terpisah per role/dev.

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

## Workflow Branch (Per Role/Dev)

Main branch:
- Hanya untuk baseline project, konfigurasi bersama, dan stabilisasi.
- Tidak dipakai untuk development fitur harian.

Feature branch:
- Setiap role/dev wajib punya branch sendiri.
- Penamaan branch disarankan:

```bash
feature/<role>-<nama-fitur>
```

Contoh:
- `feature/frontend-home-dashboard`
- `feature/backend-fixed-cost-api`
- `feature/data-transaction-schema`

Alur kerja:
1. Buat branch dari `main`.
2. Kerjakan satu scope fitur per branch.
3. Pull perubahan terbaru `main` secara berkala.
4. Buat Pull Request ke `main` saat fitur siap review.

Dokumen detail pembagian scope bisa dilihat di `BRANCHING_STRATEGY.md`.

## Backend Environment
Salin file contoh env:

```bash
copy backend\.env.example backend\.env
```

Isi default:
- `PORT=5000`
- `FRONTEND_URL=http://localhost:5173`

Tambahkan koneksi PostgreSQL lokal di `backend/.env`:
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

## Database (PostgreSQL Local)

1. Pastikan PostgreSQL lokal aktif.
2. Buat database lokal:

```sql
CREATE DATABASE livo_local;
```

3. Jalankan backend:

```bash
npm run dev --prefix backend
```

Saat startup, backend melakukan test query `SELECT 1`.
Jika koneksi gagal, backend akan berhenti dan menampilkan error di terminal.

4. Uji koneksi database secara langsung (simple SELECT):

```bash
npm run db:test --prefix backend
```

## Health Check
- Endpoint: `GET /api/health`
- Database check: `GET /api/db-health`
- Frontend sudah memanggil endpoint ini saat pertama kali render.
