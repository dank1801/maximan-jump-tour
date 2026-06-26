// ===========================
// ADVANCED SCROLL ANIMATIONS
// ===========================

class ScrollReveal {
    constructor() {
        this.reveals = document.querySelectorAll('[data-reveal]');
        this.init();
    }

    init() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.reveal(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.15 });

            this.reveals.forEach(el => observer.observe(el));
        } else {
            // Fallback for older browsers
            this.reveals.forEach(el => this.reveal(el));
        }
    }

    reveal(element) {
        element.style.animation = `fadeInUp 0.8s ease-out forwards`;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new ScrollReveal();
});

// ===========================
// COUNTER ANIMATIONS
// ===========================

const countElements = document.querySelectorAll('[data-count]');

const startCounting = () => {
    countElements.forEach(element => {
        if (!element.dataset.counted) {
            const target = parseInt(element.getAttribute('data-count'));
            const duration = 2000;
            const start = Date.now();

            const animate = () => {
                const now = Date.now();
                const progress = (now - start) / duration;

                if (progress < 1) {
                    const current = Math.floor(target * progress);
                    element.textContent = current;
                    requestAnimationFrame(animate);
                } else {
                    element.textContent = target;
                    element.dataset.counted = 'true';
                }
            };

            animate();
        }
    });
};

// Start counting when section comes into view
const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            startCounting();
        }
    });
}, { threshold: 0.5 });

document.querySelector('.statistics')?.forEach(section => {
    countObserver.observe(section);
});

// ===========================
// HOVER EFFECTS
// ===========================

document.querySelectorAll('.event-card, .series-card, .news-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });

    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// ===========================
// FADE IN ON LOAD
// ===========================

window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});

// ===========================
// PROGRESSIVE IMAGE LOADING
// ===========================

const images = document.querySelectorAll('img[data-src]');

if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// ===========================
// SMOOTH NUMBER COUNTER
// ===========================

function smoothCount(element, target, duration = 1000) {
    let start = 0;
    const range = target - start;
    let current = start;
    const increment = target > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));

    const timer = setInterval(() => {
        current += increment;
        element.textContent = current;

        if (current === target) {
            clearInterval(timer);
        }
    }, stepTime);
}

// ===========================
// TEXT ANIMATION
// ===========================

function animateText(element, text, speed = 50) {
    let index = 0;
    element.textContent = '';

    const type = () => {
        if (index < text.length) {
            element.textContent += text.charAt(index);
            index++;
            setTimeout(type, speed);
        }
    };

    type();
}

// ===========================
// RIPPLE EFFECT
// ===========================

document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');

        this.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    });
});

// Add ripple CSS dynamically
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }

    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

console.log('Advanced Animations Loaded! ✨');