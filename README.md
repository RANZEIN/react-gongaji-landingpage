# Gongaji Landing Page

Landing page resmi ekosistem **Gongaji** (`Gongaji App`, `Qursus`, dan `DonasiQu`), dibangun dengan React, TypeScript, Vite, dan Tailwind CSS v4.

```bash
npm install
npm run dev      # http://localhost:5173
npm run typecheck
npm run build    # production build in dist/
```

## Struktur Utama

- `src/components/ui/gongaji-landing.tsx`: Komponen landing page utama (`GongajiLanding`) dengan scroll choreography, gateway slider & video, katalog fitur bento, mentor wall, paket biaya Qursus, section DonasiQu, dan mini-game *Lempar Fitur*.
- `src/components/ui/article-pages.tsx`: Halaman direktori (`/artikel`) dan pembaca artikel (`/artikel/:uuid`) terintegrasi ke Public Article API Gongaji.
- `src/data/gongaji.ts`: Konten statis, daftar aset `public/assets/`, tautan produk, serta tipe & helper Public Article API.
- `api/article.ts` & `api/article/[uuid].ts`: Serverless proxy untuk deployment Vercel (`/api/article`).
- `Dockerfile`, `nginx.default.conf.template`, `cloudbuild.yaml`: Konfigurasi container Nginx + reverse proxy untuk deployment Google Cloud Run.
