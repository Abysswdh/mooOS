# 🐄 MooOS - SaaS Command Center untuk Koperasi Sapi Perah Modern

MooOS adalah sebuah sistem operasi cerdas (SaaS) yang mendigitalisasi seluruh rantai operasional koperasi peternak sapi perah. Sistem ini menjembatani celah komunikasi antara admin di kantor dan pekerja di kandang melalui integrasi **Telegram Bot Real-Time**, serta sistem **MRP (Material Requirements Planning)** yang menghasilkan rekomendasi tugas harian secara dinamis.

---

## 🌟 Arsitektur & Core Value Proposition

MooOS tidak hanya sekadar menampilkan angka statis, namun menghadirkan data *real-time* yang dapat divalidasi langsung:

1. **MRP-Driven Dynamic Checklist**
   Sistem di backend secara terus-menerus mengevaluasi kondisi bisnis (seperti stok pakan yang menipis atau fluktuasi harga pasar) dan secara otomatis men-generate *task* harian yang dapat langsung dieksekusi oleh Admin.
2. **Real-Time Telegram Integration (Polling Engine)**
   Pekerja lapangan (PJ Kandang) tidak perlu menginstal aplikasi baru; mereka menggunakan Telegram. Laporan pemberian pakan, hasil perah susu, dan status kesehatan sapi dikirim via Bot dan muncul seketika di dashboard web Admin melalui arsitektur *Server-Sent Events (SSE)*.
3. **Automated SHU Distribution**
   Pendapatan (penjualan susu & pupuk) dan pengeluaran (pakan & operasional) dihitung secara otomatis. Laba Bersih Koperasi (Sisa Hasil Usaha / SHU) didistribusikan secara proporsional secara otomatis berdasarkan kepemilikan sapi aktif tiap anggota.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS 4, shadcn/ui.
- **Backend**: FastAPI (Python), SQLAlchemy.
- **Real-Time Layer**: Server-Sent Events (SSE) via FastAPI.
- **Bot Engine**: `pyTelegramBotAPI` (Berjalan paralel dengan server FastAPI).

---

## 🚀 Panduan Eksekusi (Run Locally)

Untuk kenyamanan evaluasi juri, kami telah menyediakan *batch script* yang akan secara otomatis menginstal seluruh *dependencies* dan menjalankan layanan secara bersamaan.

### Prasyarat
- Node.js (v18+)
- Python (v3.10+)

### Langkah Menjalankan
1. *Clone* atau download .ZIP dan ekstrak repositori ini ke komputer Anda.
2. *Double Click* (Jalankan) file **`start_mooos.bat`** di direktori *root*.
3. Script akan berjalan di latar belakang (Terminal *minimized*) untuk menyalakan Backend (Port 8000) dan Frontend (Port 3000).
4. Browser akan otomatis terbuka di `http://localhost:3000` dalam waktu kurang lebih 15 detik. Jika dependency belum terinstall namun browser sudah terbuka, silahkan reload browser saat dependency telah selesai
6. Untuk menghentikan semua layanan secara bersih, silakan jalankan **`stop_mooos.bat`**.

> **Note**: Database telah kami lengkapi dengan *seed script* (data simulasi operasional selama 30 hari ke belakang) agar grafik finansial dan analitik dapat langsung diinspeksi.

---

## 🧪 Skenario Pengujian Integrasi Telegram (Judge Testing)

Fitur Telegram adalah komponen krusial dari ekosistem MooOS. Juri dapat menguji integrasi *real-time* ini langsung melalui perangkat Juri sendiri:

1. **Persiapan Token**
   Pastikan file `backend/.env` telah terisi dengan variabel `TELEGRAM_BOT_TOKEN`. (Silakan gunakan token bot yang telah kami lampirkan di dokumen *submission*).
2. **Dapatkan Telegram ID Juri**
   Buka aplikasi Telegram di HP Anda, cari bot **`@userinfobot`**, tekan Start, dan catat *Telegram ID* berupa deretan angka yang diberikan.
3. **Mulai Percakapan dengan Bot MooOS**
   Cari bot MooOS kami di Telegram dan tekan **`Start`**.
4. **Registrasi di Dashboard**
   Di aplikasi web MooOS, masuk ke menu **Pengaturan** (di bilah navigasi kiri bawah). Masukkan *Telegram ID* Anda pada kolom `Telegram ID PJ Kandang` dan simpan. Sistem akan meregistrasi perangkat Anda sebagai Penanggung Jawab Kandang.
5. **Uji Real-Time Action**
   Buka menu **Harga Pasar** di aplikasi web, lalu perbarui harga Pakan atau Susu. Sistem akan mendemonstrasikan kapabilitas pengiriman pesan instan langsung ke HP Anda!
