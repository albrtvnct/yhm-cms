# Eduplay Kids Static Website Folder

Halo! Folder ini dibuat sesuai permintaan Anda di root project.

Namun, perlu diketahui bahwa proyek ini menggunakan **Next.js**. Agar website HTML, CSS, dan JS Anda dapat diakses dan di-host secara otomatis oleh browser di URL `/eduplaykids`, file-file tersebut **harus diletakkan di folder public**:

👉 **`public/eduplaykids/`** (sangat direkomendasikan)

### Cara Upload:
1. Masukkan file-file website Anda (seperti `index.html`, `style.css`, folder gambar/asset, dll) ke dalam folder `public/eduplaykids/`.
2. Setelah file dimasukkan ke `public/eduplaykids/`, file utama Anda (`index.html`) akan otomatis menggantikan halaman petunjuk default yang kami siapkan.
3. Anda bisa mengakses website tersebut di URL `/eduplaykids`.

### Mengapa di folder `public`?
Next.js secara default hanya menyajikan file statis yang berada di dalam direktori `public/`. File di luar folder `public` (seperti di root `./eduplaykids/` ini) tidak akan bisa diakses langsung melalui browser kecuali ada konfigurasi server tambahan (seperti custom routing atau rewrites).

Kami sudah menyiapkan folder `public/eduplaykids/` dengan file halaman penunjuk awal yang indah! Silakan salin file website Anda ke folder tersebut.
