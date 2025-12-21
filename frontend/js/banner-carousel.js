/**
 * Banner Carousel Component
 * Handles auto-sliding, manual navigation, and rendering of banners.
 * Logic:
 * - Render banners from data source
 * - Auto-slide every 7 seconds
 * - Reset timer on any interaction (click arrows/dots)
 * - Smooth slide transition
 * - Infinite Loop (Bidirectional)
 */
class BannerCarousel {
    constructor(containerSelector, banners) {
        this.container = document.querySelector(containerSelector);
        this.banners = banners;
        this.isTransitioning = false;
        this.timer = null;
        this.interval = 7000; // 7 seconds

        // Clone First and Last for Infinite Loop
        // Structure: [Clone Last] [0] [1] ... [N] [Clone First]
        // Indices:       0        1   2  ... N+1     N+2
        this.totalSlides = this.banners.length + 2;
        this.currentIndex = 1; // Start at real first slide

        if (!this.container) {
            console.error('Banner container not found:', containerSelector);
            return;
        }

        this.init();
    }

    init() {
        this.render();
        this.startTimer();
        this.addEventListeners();
    }

    render() {
        // Create full list of slides: [Last, ...Originals, First]
        const slides = [
            this.banners[this.banners.length - 1],
            ...this.banners,
            this.banners[0]
        ];

        this.container.innerHTML = `
            <div class="relative w-full h-full overflow-hidden group rounded-2xl">
                <!-- Slides Container -->
                <div class="banner-slides relative w-full h-full flex transition-transform duration-500 ease-in-out" 
                     style="transform: translateX(-100%);">
                    ${slides.map((banner, index) => this.createSlideHTML(banner, index)).join('')}
                </div>

                <!-- Navigation Arrows -->
                <button class="absolute left-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" data-action="prev">
                    <span class="material-symbols-outlined">chevron_left</span>
                </button>
                <button class="absolute right-4 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" data-action="next">
                    <span class="material-symbols-outlined">chevron_right</span>
                </button>

                <!-- Pagination Indicators -->
                <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    ${this.banners.map((_, index) => `
                        <button class="h-2 rounded-full transition-all duration-300 shadow-sm bg-white/50 w-2 hover:bg-white/80" data-index="${index}"></button>
                    `).join('')}
                </div>
            </div>
        `;

        this.slidesContainer = this.container.querySelector('.banner-slides');
        this.dots = this.container.querySelectorAll('[data-index]');
        this.updateDots(); // Initial update
    }

    createSlideHTML(banner, index) {
        return `
            <div class="min-w-full w-full h-full relative shrink-0">
                <div class="absolute inset-0 bg-cover bg-center"
                     style="background-image: url('${banner.image}');">
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                
                ${banner.isDefault ? `
                <div class="absolute top-6 right-6 md:top-10 md:right-10 z-20 animate-fade-in">
                    <img src="../../assets/image/favicon.png" class="w-12 h-12 md:w-20 md:h-20 drop-shadow-lg opacity-90 hover:scale-110 transition-transform duration-300" alt="EViENT Logo">
                </div>
                ` : ''}

                <div class="absolute bottom-0 left-0 w-full p-6 md:p-12 flex flex-col items-start gap-3 md:gap-4 animate-slide-up">
                    ${banner.isHighlight ? `
                    <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/90 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm">
                        <span class="material-symbols-outlined text-[14px]">star</span> Nổi bật
                    </span>` : ''}
                    
                    <h1 class="text-2xl md:text-5xl font-bold text-white leading-tight max-w-3xl drop-shadow-lg line-clamp-2">
                        ${banner.title}
                    </h1>

                    ${(banner.date || banner.location) ? `
                    <div class="flex flex-wrap gap-3 md:gap-4 text-gray-200 text-sm md:text-base font-medium">
                        ${banner.date ? `<span class="flex items-center gap-1"><span class="material-symbols-outlined text-primary">calendar_today</span> ${banner.date}</span>` : ''}
                        ${banner.location ? `<span class="flex items-center gap-1"><span class="material-symbols-outlined text-primary">location_on</span> ${banner.location}</span>` : ''}
                    </div>` : ''}
                    
                    <div class="mt-2 flex gap-3">
                        <a href="${banner.bookingLink || '#'}" class="flex items-center justify-center rounded-xl h-10 md:h-12 px-6 md:px-8 bg-primary hover:bg-primary-hover text-white text-sm md:text-base font-bold transition-all shadow-lg hover:shadow-primary/50 hover:-translate-y-0.5">
                            Đặt vé ngay
                        </a>
                        <a href="${banner.detailLink || '#'}" class="flex items-center justify-center rounded-xl h-10 md:h-12 px-5 md:px-6 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-sm md:text-base font-bold transition-all border border-white/20 hover:border-white/40">
                            Chi tiết
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    startTimer() {
        this.stopTimer();
        this.timer = setInterval(() => {
            this.nextSlide(true);
        }, this.interval);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    resetTimer() {
        this.stopTimer();
        this.startTimer();
    }

    nextSlide(isAuto = false) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        this.currentIndex++;
        this.updateSlidePosition();
        if (!isAuto) this.resetTimer();

        // Handle Infinite Loop (Forward)
        if (this.currentIndex === this.totalSlides - 1) {
            // We reached the Clone First slide. Wait for transition, then jump to Real First.
            setTimeout(() => {
                this.disableTransition();
                this.currentIndex = 1;
                this.updateSlidePosition();

                // Force Reflow
                this.slidesContainer.offsetHeight;

                this.enableTransition();
                this.isTransitioning = false;
            }, 500); // 500ms duration
        } else {
            setTimeout(() => {
                this.isTransitioning = false;
            }, 500);
        }
    }

    prevSlide() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        this.currentIndex--;
        this.updateSlidePosition();
        this.resetTimer();

        // Handle Infinite Loop (Backward)
        if (this.currentIndex === 0) {
            // We reached the Clone Last slide. Wait for transition, then jump to Real Last.
            setTimeout(() => {
                this.disableTransition();
                this.currentIndex = this.totalSlides - 2;
                this.updateSlidePosition();

                // Force Reflow
                this.slidesContainer.offsetHeight;

                this.enableTransition();
                this.isTransitioning = false;
            }, 500);
        } else {
            setTimeout(() => {
                this.isTransitioning = false;
            }, 500);
        }
    }

    goToSlide(index) {
        if (this.isTransitioning) return;
        // index is 0-based from dots, need to map to 1-based real slides
        let targetIndex = index + 1;
        if (targetIndex === this.currentIndex) return;

        this.currentIndex = targetIndex;
        this.updateSlidePosition();
        this.resetTimer();
    }

    updateSlidePosition() {
        if (!this.slidesContainer) return;
        this.slidesContainer.style.transform = `translateX(-${this.currentIndex * 100}%)`;
        this.updateDots();
    }

    updateDots() {
        // Calculate logical index (0 .. N-1)
        let logicalIndex = 0;
        if (this.currentIndex === 0) {
            logicalIndex = this.banners.length - 1; // Clone Last -> Real Last
        } else if (this.currentIndex === this.totalSlides - 1) {
            logicalIndex = 0; // Clone First -> Real First
        } else {
            logicalIndex = this.currentIndex - 1;
        }

        this.dots.forEach((dot, index) => {
            if (index === logicalIndex) {
                dot.className = 'h-2 rounded-full transition-all duration-300 shadow-sm bg-white w-8';
            } else {
                dot.className = 'h-2 rounded-full transition-all duration-300 shadow-sm bg-white/50 w-2 hover:bg-white/80';
            }
        });
    }

    disableTransition() {
        this.slidesContainer.style.transition = 'none';
    }

    enableTransition() {
        this.slidesContainer.style.transition = 'transform 500ms ease-in-out';
    }

    addEventListeners() {
        // Arrows
        const nextBtn = this.container.querySelector('[data-action="next"]');
        const prevBtn = this.container.querySelector('[data-action="prev"]');

        if (nextBtn) nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.nextSlide();
        });
        if (prevBtn) prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.prevSlide();
        });

        // Dots
        this.dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                e.preventDefault();
                const index = parseInt(e.target.dataset.index);
                this.goToSlide(index);
            });
        });

        // Swipe support (Touch)
        let touchStartX = 0;
        let touchEndX = 0;

        this.container.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        this.container.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });

        const handleSwipe = () => {
            const swipeThreshold = 50;
            if (touchStartX - touchEndX > swipeThreshold) {
                this.nextSlide(); // Swipe Left -> Next
            }
            if (touchEndX - touchStartX > swipeThreshold) {
                this.prevSlide(); // Swipe Right -> Prev
            }
        };
    }
}

// Data Source - Centralized Banner Data
const bannerData = [
    {
        id: 1,
        image: '../../assets/image/banner.png',
        title: 'Trải nghiệm sự kiện đẳng cấp cùng EViENT',
        isDefault: true,
        isHighlight: true,
        bookingLink: 'event-detail.html',
        detailLink: 'event-detail.html'
    },
    {
        id: 2,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5rAulyOoZSi14akh-35GWyQf53Is0h_kqMR82owxRsehutOKfQSK0ObJvSNWEvV0xgEoTFnJWwalXUZTFXN0ksKJ_Va4BGs2legkbDqLftE3RjfRCq-Gb0gExw1TQpBXq7abWX319g1QeBWsEX5Ff45FubVNEF0GWfkGJENRjrc7cho7iiloViOsRqX-xqsdMYZqbUe_mD_ueZ9nO4nAAsH9YHIBtRLNm3QWnOhDYkx2GA3W2iu4HDYyWSSmp2Pxre9P7uKwBVoM',
        title: 'Đại nhạc hội EDM: Lights of Saigon 2025',
        date: '20/11/2025',
        location: 'SVĐ Quân Khu 7, TP.HCM',
        isHighlight: true,
        bookingLink: 'event-detail.html',
        detailLink: 'event-detail.html'
    },
    {
        id: 3,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQS5ixvFPmc-a-NhUUG35htf-hP08m3hRrl-rF2awGhd6AuRAH7tsEYlevO-rqGG4E0GyWdBkHaIuwSiQuKkQoRVMq83M23WAVzafYyhtKuPhFh97kFvMUltKhQFyq-L0707UqM22GLdtsNF0n6sg7VMTotoWgFOgV3cXYpniBPsYeE7cLnnrfwyyGHNuxG7rBBHplSWE-tgot4a-wukIvBg0Bdj_LOxsl7pNxTvRSPi2Syu_4NuBAEXYnfbBhfXXvshYNzeDxduI',
        title: 'Tech Summit 2025: Kỷ nguyên AI',
        date: '22/10/2025',
        location: 'Trung tâm Hội nghị Quốc gia',
        isHighlight: false,
        bookingLink: 'event-detail.html',
        detailLink: 'event-detail.html'
    },
    {
        id: 4,
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkjTVAkTTaF3ZcXyhQeu0pLjIpWtMP5HFegR9yOa955TxhYl39YbKKsMgO0UbAiIo7rmdgfq9mBmM5p_5Qn6WjG6nQcfNEswKGJhRivcWhJx6qa5GFHwfJFLg1pQphDM1uQlKTcqzprX1o9qJPv0kQzNCMxUUAzg0RAq7DXCkvGZYuiaA2EfyEbdBy9uBe0H_EB2KyKX-tb5EVVjokluc64m8sj8_Mf21QmDFaNHZsPZWJVItgQHGTCApYtKnHi4RWlH9G_22ZSm8',
        title: 'Triển lãm Nghệ thuật Đương đại "Sống"',
        date: '25/10/2025',
        location: 'Viencom Center for Contemporary Art',
        isHighlight: false,
        bookingLink: 'event-detail.html',
        detailLink: 'event-detail.html'
    }
];

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if the element exists
    if (document.getElementById('banner-carousel')) {
        new BannerCarousel('#banner-carousel', bannerData);
    }
});
