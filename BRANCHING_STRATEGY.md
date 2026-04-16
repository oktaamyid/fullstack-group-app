# Branching Strategy

Dokumen ini dipakai sebagai panduan kolaborasi karena project dibagi per role/dev.

## Tujuan

- Menjaga `main` tetap bersih, stabil, dan bisa dijadikan baseline bersama.
- Mengurangi konflik merge antar fitur.
- Membuat ownership fitur jelas per branch.

## Aturan Umum

- `main` hanya berisi:
  - konfigurasi awal project
  - baseline arsitektur
  - hasil merge fitur yang sudah direview
- Semua pengerjaan fitur dilakukan di branch turunan dari `main`.
- Satu branch fokus ke satu scope fitur utama.

## Konvensi Nama Branch

Gunakan format berikut:

```bash
feature/<role>-<fitur>
```

Opsional untuk bugfix:

```bash
fix/<role>-<isu>
```

Contoh:

- `feature/frontend-auth-ui`
- `feature/backend-fixed-cost-crud`
- `feature/data-monthly-budget-rules`
- `fix/frontend-loading-transition`

## Pembagian Role (Template)

Sesuaikan dengan tim, contoh baseline:

- Frontend Dev
  - UI screen integration
  - routing dan state UI
  - PWA client behavior
- Backend Dev
  - API endpoint dan validation
  - business rules DSL/fixed cost
  - auth/session logic
- Data/DB Dev
  - schema dan migration
  - query optimization
  - data consistency rules

## Alur Kolaborasi

1. Sync branch lokal dengan `main` terbaru.
2. Buat branch fitur dari `main`.
3. Implementasi + test di branch fitur.
4. Rebase/merge `main` ke branch fitur jika ada update besar.
5. Buat Pull Request ke `main`.
6. Review dan resolve comment.
7. Merge hanya saat status build dan review aman.

## Definition of Done (PR ke Main)

- Scope sesuai branch (tidak campur fitur lain).
- Build lulus minimal di area yang diubah.
- Tidak ada secret/env sensitif yang ter-commit.
- README/dokumen terkait ikut diperbarui bila flow berubah.

## Catatan untuk Project Ini

Karena project ini dibagi per role/dev, jadikan `main` sebagai pondasi konfigurasi awal. Seluruh implementasi fitur berikutnya harus dilakukan di branch masing-masing dan masuk ke `main` lewat PR.
