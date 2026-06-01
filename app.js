/**
 * Finca Loma Bonita - Core Application Logic
 * Premium interactions, galleries, sliders, booking calculation, and SEO behaviors.
 */

document.addEventListener('DOMContentLoaded', () => {
    initHeaderScroll();
    initMobileMenu();
    initScrollSpy();
    initGallery();
    initRoomCarousel();
    initFAQAccordion();
    initBookingForm();
});

/**
 * 1. HEADER SCROLL EFFECT
 * Adds scrolled class to main header when user scrolls past 50px
 */
function initHeaderScroll() {
    const header = document.querySelector('.main-header');
    if (!header) return;

    const handleScroll = () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };

    // Run once on load to account for page refreshes in the middle of the page
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
}

/**
 * 2. MOBILE MENU TOGGLE
 * Handles mobile hamburger menu drawer interactions
 */
function initMobileMenu() {
    const toggleBtn = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (!toggleBtn || !navMenu) return;

    const toggleIcon = toggleBtn.querySelector('i');

    const toggleMenu = (e) => {
        e.stopPropagation();
        navMenu.classList.toggle('active');
        const isActive = navMenu.classList.contains('active');
        
        // Toggle hamburger / close icons
        if (isActive) {
            toggleIcon.classList.remove('fa-bars');
            toggleIcon.classList.add('fa-xmark');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        } else {
            toggleIcon.classList.remove('fa-xmark');
            toggleIcon.classList.add('fa-bars');
            document.body.style.overflow = '';
        }
    };

    const closeMenu = () => {
        if (navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            toggleIcon.classList.remove('fa-xmark');
            toggleIcon.classList.add('fa-bars');
            document.body.style.overflow = '';
        }
    };

    toggleBtn.addEventListener('click', toggleMenu);

    // Close menu when clicking on a nav link
    const navLinks = navMenu.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Close menu when clicking outside of it
    document.addEventListener('click', (e) => {
        if (navMenu.classList.contains('active') && !navMenu.contains(e.target) && e.target !== toggleBtn) {
            closeMenu();
        }
    });
}

/**
 * 3. SCROLL SPY
 * Highlights the active section in the navigation menu as the user scrolls
 */
function initScrollSpy() {
    const sections = document.querySelectorAll('section[id], header[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (!sections.length || !navLinks.length) return;

    const handleScrollSpy = () => {
        let currentSectionId = '';
        const scrollPosition = window.scrollY + 150; // offset for sticky header

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        if (currentSectionId) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                const href = link.getAttribute('href');
                if (href === `#${currentSectionId}` || (currentSectionId === 'inicio' && href === '#inicio')) {
                    link.classList.add('active');
                }
            });
        }
    };

    window.addEventListener('scroll', handleScrollSpy, { passive: true });
}

/**
 * 4. GALLERY FILTER & LIGHTBOX (CAROUSEL / SLIDER VERSION)
 * Handles categories filter tabs, horizontal carousel slider controls, dots, and lightbox
 */
function initGallery() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');
    const galleryCarousel = document.getElementById('gallery-carousel');
    const galleryPrevBtn = document.getElementById('gallery-prev');
    const galleryNextBtn = document.getElementById('gallery-next');
    const galleryDots = document.getElementById('gallery-dots');
    
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');

    if (!galleryItems.length || !galleryCarousel) return;

    let activeItems = Array.from(galleryItems); // Items currently visible under active filter
    let currentIndex = 0;

    // A. DOTS GENERATION & SYNCHRONIZATION
    const renderDots = () => {
        if (!galleryDots) return;
        galleryDots.innerHTML = '';
        
        activeItems.forEach((_, idx) => {
            const dot = document.createElement('span');
            dot.className = 'dot-g' + (idx === 0 ? ' active' : '');
            dot.setAttribute('data-index', idx);
            dot.addEventListener('click', () => {
                const targetItem = activeItems[idx];
                if (targetItem) {
                    galleryCarousel.scrollTo({
                        left: targetItem.offsetLeft - 10,
                        behavior: 'smooth'
                    });
                }
            });
            galleryDots.appendChild(dot);
        });
    };

    const updateActiveDot = () => {
        if (!galleryDots || !activeItems.length) return;
        
        const scrollLeft = galleryCarousel.scrollLeft;
        const containerCenter = scrollLeft + galleryCarousel.offsetWidth / 2;
        let closestIndex = 0;
        let minDistance = Infinity;

        activeItems.forEach((item, idx) => {
            const itemCenter = item.offsetLeft + item.offsetWidth / 2;
            const distance = Math.abs(itemCenter - containerCenter);
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = idx;
            }
        });

        const dotsG = galleryDots.querySelectorAll('.dot-g');
        dotsG.forEach((dot, idx) => {
            if (idx === closestIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    };

    // Listen to scroll to sync dots
    galleryCarousel.addEventListener('scroll', updateActiveDot, { passive: true });

    // B. CAROUSEL PREV/NEXT NAVIGATION
    if (galleryPrevBtn && galleryNextBtn) {
        const scrollAmount = 320; // average card width
        
        galleryPrevBtn.addEventListener('click', () => {
            galleryCarousel.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        });

        galleryNextBtn.addEventListener('click', () => {
            galleryCarousel.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });
    }

    // C. FILTER LOGIC
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button styling
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filterValue = button.getAttribute('data-filter');
            activeItems = [];

            galleryItems.forEach(item => {
                const category = item.getAttribute('data-category');
                
                if (filterValue === 'all' || category === filterValue) {
                    // Show item with display block and reset opacity/transform
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'scale(1)';
                    }, 50);
                    activeItems.push(item);
                } else {
                    // Hide item with display none
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 200);
                }
            });

            // Reset scroll position and regenerate dots
            galleryCarousel.scrollTo({ left: 0, behavior: 'auto' });
            setTimeout(() => {
                renderDots();
                updateActiveDot();
            }, 250);
        });
    });

    // D. LIGHTBOX OPEN
    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            const caption = item.querySelector('.gallery-caption');
            
            if (!img || !lightbox) return;

            // Find current index in the active list
            currentIndex = activeItems.indexOf(item);
            if (currentIndex === -1) currentIndex = 0;

            updateLightboxContent();
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden'; // Stop background scroll
        });
    });

    // E. LIGHTBOX UPDATE CONTENT
    const updateLightboxContent = () => {
        if (!activeItems[currentIndex] || !lightboxImg || !lightboxCaption) return;

        const currentImg = activeItems[currentIndex].querySelector('img');
        const currentCaption = activeItems[currentIndex].querySelector('.gallery-caption');

        lightboxImg.src = currentImg.src;
        lightboxImg.alt = currentImg.alt;
        lightboxCaption.textContent = currentCaption ? currentCaption.textContent : '';
        
        // Hide prev/next buttons if only 1 image
        if (activeItems.length <= 1) {
            if (lightboxPrev) lightboxPrev.style.display = 'none';
            if (lightboxNext) lightboxNext.style.display = 'none';
        } else {
            if (lightboxPrev) lightboxPrev.style.display = 'flex';
            if (lightboxNext) lightboxNext.style.display = 'flex';
        }
    };

    // F. LIGHTBOX NAVIGATION
    const showNext = () => {
        if (activeItems.length <= 1) return;
        currentIndex = (currentIndex + 1) % activeItems.length;
        updateLightboxContent();
    };

    const showPrev = () => {
        if (activeItems.length <= 1) return;
        currentIndex = (currentIndex - 1 + activeItems.length) % activeItems.length;
        updateLightboxContent();
    };

    const closeLightbox = () => {
        if (lightbox) {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    if (lightboxNext) lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); showNext(); });
    if (lightboxPrev) lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); showPrev(); });
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target === lightboxImg || e.target.classList.contains('lightbox-content')) {
                // Clicking background closes lightbox
                closeLightbox();
            }
        });
    }

    // Keyboard support for Lightbox
    document.addEventListener('keydown', (e) => {
        if (!lightbox || !lightbox.classList.contains('active')) return;
        
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') showNext();
        if (e.key === 'ArrowLeft') showPrev();
    });

    // Initial render
    renderDots();
}

/**
 * 5. ROOM CAROUSEL / SLIDER
 * Controls slide visibility, fade/slide animations, and automatic slideshow (autoplay)
 */
function initRoomCarousel() {
    const slider = document.getElementById('room-slider');
    const slides = document.querySelectorAll('.room-slide');
    const dots = document.querySelectorAll('.dot');
    
    if (!slides.length || !dots.length) return;

    let currentSlide = 0;
    let autoplayTimer = null;
    const autoplayInterval = 6000; // 6 seconds

    const showSlide = (index) => {
        // Handle wrapping
        if (index >= slides.length) index = 0;
        if (index < 0) index = slides.length - 1;

        currentSlide = index;

        // Toggle active class on slides
        slides.forEach((slide, i) => {
            if (i === currentSlide) {
                slide.classList.add('active');
                // Force display: block since stylesheet overrides it
                slide.style.display = 'block';
                slide.style.opacity = '0';
                setTimeout(() => {
                    slide.style.transition = 'opacity 0.5s ease';
                    slide.style.opacity = '1';
                }, 50);
            } else {
                slide.classList.remove('active');
                slide.style.display = 'none';
            }
        });

        // Toggle active class on dots
        dots.forEach((dot, i) => {
            if (i === currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    };

    // Set click listener on dots
    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            const slideIndex = parseInt(dot.getAttribute('data-slide'), 10);
            showSlide(slideIndex);
            resetAutoplay();
        });
    });

    // Autoplay implementation
    const startAutoplay = () => {
        autoplayTimer = setInterval(() => {
            showSlide(currentSlide + 1);
        }, autoplayInterval);
    };

    const resetAutoplay = () => {
        if (autoplayTimer) {
            clearInterval(autoplayTimer);
            startAutoplay();
        }
    };

    // Initialize first slide and start autoplay
    showSlide(0);
    startAutoplay();

    // Swipe support for mobile devices
    let touchStartX = 0;
    let touchEndX = 0;

    if (slider) {
        slider.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        slider.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
    }

    const handleSwipe = () => {
        const threshold = 50; // minimum distance in px
        if (touchStartX - touchEndX > threshold) {
            // swiped left, show next
            showSlide(currentSlide + 1);
            resetAutoplay();
        } else if (touchEndX - touchStartX > threshold) {
            // swiped right, show prev
            showSlide(currentSlide - 1);
            resetAutoplay();
        }
    };
}

/**
 * 6. FAQ ACCORDION
 * Handles smooth opening/closing heights of FAQ items with micro-interactions
 */
function initFAQAccordion() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            const faqAnswer = faqItem.querySelector('.faq-answer');
            const isActive = faqItem.classList.contains('active');

            // Close all other FAQ items for a clean experience
            document.querySelectorAll('.faq-item').forEach(item => {
                if (item !== faqItem && item.classList.contains('active')) {
                    item.classList.remove('active');
                    item.querySelector('.faq-answer').style.maxHeight = '0';
                }
            });

            // Toggle current FAQ item
            if (isActive) {
                faqItem.classList.remove('active');
                faqAnswer.style.maxHeight = '0';
            } else {
                faqItem.classList.add('active');
                faqAnswer.style.maxHeight = faqAnswer.scrollHeight + 'px';
            }
        });
    });
}

/**
 * 7. BOOKING FORM & WHATSAPP INTEGRATION
 * Prevents past dates, calculates basic validation, and builds the URL string to send to WhatsApp
 */
function initBookingForm() {
    const bookingForm = document.getElementById('whatsapp-booking-form');
    const formDateInput = document.getElementById('form-date');

    if (!bookingForm) return;

    // Set minimum date in form to today to avoid past bookings
    if (formDateInput) {
        const today = new Date();
        const yyyy = today.getFullYear();
        let mm = today.getMonth() + 1; // Months start at 0
        let dd = today.getDate();

        if (mm < 10) mm = '0' + mm;
        if (dd < 10) dd = '0' + dd;

        const formattedToday = `${yyyy}-${mm}-${dd}`;
        formDateInput.setAttribute('min', formattedToday);
    }

    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get form values
        const name = document.getElementById('form-name').value.trim();
        const plan = document.getElementById('form-plan').value;
        const date = document.getElementById('form-date').value;
        const adults = document.getElementById('form-adults').value;
        const kids = document.getElementById('form-kids').value || '0';
        const comments = document.getElementById('form-comments').value.trim();

        if (!name || !plan || !date || !adults) {
            alert('Por favor, completa todos los campos requeridos.');
            return;
        }

        // Format Date to a friendly string (DD/MM/YYYY)
        const dateObj = new Date(date + 'T00:00:00'); // enforce local time zone parsing
        const friendlyDate = dateObj.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Construct beautiful message
        let waMessage = `¡Hola Finca Loma Bonita! 🌟\n\n`;
        waMessage += `Me gustaría realizar una cotización con los siguientes detalles:\n\n`;
        waMessage += `👤 *Nombre:* ${name}\n`;
        waMessage += `📋 *Tipo de Plan:* ${plan}\n`;
        waMessage += `📅 *Fecha Deseada:* ${friendlyDate}\n`;
        waMessage += `👥 *Adultos:* ${adults}\n`;
        waMessage += `👶 *Niños (2-10 años):* ${kids}\n`;
        
        if (comments) {
            waMessage += `✉️ *Comentarios/Requerimientos:* ${comments}\n`;
        }
        
        waMessage += `\nQuedo atento(a) a la disponibilidad y tarifas. ¡Muchas gracias!`;

        // URL encode the message
        const encodedMessage = encodeURIComponent(waMessage);
        
        // Target phone number: +573102913182
        const whatsappNumber = '573102913182';
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

        // Redirect to WhatsApp in a new tab
        window.open(whatsappUrl, '_blank');
    });
}

/**
 * 8. ROOM SELECTION PRESET
 * Global helper called from accommodation buttons (onclick="setReservaPreset(...)")
 * Sets plan to "Hospedaje Campestre", pre-fills details, and scrolls to contact section.
 */
window.setReservaPreset = function(roomName) {
    const planSelect = document.getElementById('form-plan');
    const commentsTextarea = document.getElementById('form-comments');
    const contactSection = document.getElementById('contacto');

    if (planSelect) {
        planSelect.value = 'Hospedaje Campestre';
    }

    if (commentsTextarea) {
        commentsTextarea.value = `Hola, estoy interesado en cotizar hospedaje en la habitación: "${roomName}".`;
    }

    if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
    }
};
