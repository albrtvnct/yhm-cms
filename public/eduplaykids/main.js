        // Animasi scrolling
        document.addEventListener('DOMContentLoaded', function() {
            // Tambahkan class fade-in ke elemen saat di-scroll
            const fadeElements = document.querySelectorAll('.hero-text, .hero-image, .stat-item, .course-card, .trending-card, .testimonial-left, .testimonial-right');
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('fade-in');
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.1
            });
            
            fadeElements.forEach(element => {
                observer.observe(element);
            });
            
            // Tab navigasi untuk kursus populer
            const courseTabs = document.querySelectorAll('.course-tab');
            
            courseTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    // Hapus kelas aktif dari semua tab
                    courseTabs.forEach(t => t.classList.remove('active'));
                    // Tambahkan kelas aktif ke tab yang diklik
                    tab.classList.add('active');
                    
                    // Di sini Anda bisa menambahkan logika untuk menampilkan konten tab yang sesuai
                    // Contoh: tampilkan kursus berdasarkan kategori yang dipilih
                });
            });
            
            // Animasi hover untuk kartu kursus
            const courseCards = document.querySelectorAll('.course-card, .trending-card');
            
            courseCards.forEach(card => {
                card.addEventListener('mouseenter', () => {
                    card.style.transform = 'translateY(-10px)';
                    card.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.1)';
                });
                
                card.addEventListener('mouseleave', () => {
                    card.style.transform = 'translateY(0)';
                    card.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.1)';
                });
            });
            
            
            // Toggle menu mobile
            const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
            const navList = document.querySelector('.nav-list');
            
            if (mobileMenuBtn) {
                mobileMenuBtn.addEventListener('click', () => {
                    navList.style.display = navList.style.display === 'flex' ? 'none' : 'flex';
                    if (navList.style.display === 'flex') {
                        navList.style.flexDirection = 'column';
                        navList.style.position = 'absolute';
                        navList.style.top = '60px';
                        navList.style.right = '10px';
                        navList.style.backgroundColor = 'white';
                        navList.style.padding = '20px';
                        navList.style.borderRadius = '5px';
                        navList.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
                        navList.style.zIndex = '1000';
                    }
                });
            }
        });
