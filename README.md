# Aplikasi Penanda Waktu dan Lokasi Foto

Proyek ini adalah aplikasi web yang memungkinkan pengguna mengunggah foto dan secara otomatis dan backup foto yang telah dimodifikasi dengan menambahkan penanda waktu serta informasi lokasi berdasarkan data EXIF yang tertanam pada gambar. Aplikasi ini menyediakan antarmuka yang mudah digunakan untuk mengunggah gambar, menampilkan hasil yang telah dimodifikasi, dan mengunduh gambar akhir.

## Struktur Proyek

```
photo-timestamp-location-app
├── src
│   ├── index.html        # Dokumen HTML utama untuk aplikasi
│   ├── styles
│   │   └── main.css      # Gaya CSS untuk aplikasi
│   ├── scripts
│   │   └── app.js        # Kode JavaScript untuk pemrosesan gambar
├── README.md             # Dokumentasi proyek
```

## Instruksi Instalasi

1. **Klon repositori**:
   ```
   git clone https://github.com/shemilael/geotagging-added.git
   ```

2. **Masuk ke direktori proyek**:
   ```
   cd geotagging-added
   ```

3. **Buka file `index.html` di browser web Anda** untuk melihat aplikasi.

## Panduan Penggunaan

- Klik tombol "Upload" untuk memilih file gambar dari perangkat Anda.
- Aplikasi akan secara otomatis mengekstrak penanda waktu dan lokasi dari data EXIF gambar.
- Gambar yang telah dimodifikasi akan ditampilkan dengan penanda waktu dan lokasi yang ditambahkan.
- Anda dapat mengunduh gambar yang telah dimodifikasi dengan mengklik tautan unduh.

## Teknologi yang Digunakan

- HTML5
- CSS3
- JavaScript
- Library EXIF.js untuk membaca data EXIF

## Kontribusi

Kontribusi sangat diterima! Silakan ajukan pull request atau buka issue untuk saran maupun perbaikan.

## Lisensi

Proyek ini menggunakan lisensi MIT. Lihat file [LICENSE](https://github.com/shemilael/geotagging-added/blob/main/LICENSE)
