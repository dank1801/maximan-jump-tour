// ===========================
// NAVIGATION & HAMBURGER MENU
// ===========================

const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');

hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
        
        // Update active link
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    });
});

// ===========================
// SMOOTH SCROLL TO SECTIONS
// ===========================

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// ===========================
// SCHEDULE FILTER
// ===========================

const filterBtns = document.querySelectorAll('.filter-btn');
const eventCards = document.querySelectorAll('.event-card');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update active button
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');

        // Filter cards
        eventCards.forEach(card => {
            if (filter === 'all' || card.getAttribute('data-filter') === filter) {
                card.style.display = 'block';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 10);
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.display = 'none';
                }, 300);
            }
        });
    });
});

// Set initial display
eventCards.forEach(card => {
    card.style.transition = 'all 0.3s ease';
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
});

// ===========================
// CONTACT FORM
// ===========================

const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value
    };

    // Simulate form submission
    formMessage.classList.remove('success', 'error');
    formMessage.textContent = 'Nachricht wird gesendet...';
    formMessage.style.display = 'block';

    setTimeout(() => {
        formMessage.classList.add('success');
        formMessage.textContent = '✓ Nachricht erfolgreich gesendet! Wir werden uns bald bei dir melden.';
        contactForm.reset();
    }, 1000);

    setTimeout(() => {
        formMessage.style.display = 'none';
    }, 4000);
});

// ===========================
// ACTIVE NAV LINK ON SCROLL
// ===========================

window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section[id]');

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});

// ===========================
// SCROLL ANIMATIONS
// ===========================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.event-card, .news-card, .series-card, .stat-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ===========================
// DARK MODE TOGGLE (Optional)
// ===========================

// Check for saved dark mode preference or default to light mode
const darkMode = localStorage.getItem('darkMode') === 'true';

if (darkMode) {
    document.body.classList.add('dark-mode');
}

// ===========================
// NEWSLETTER FORM
// ===========================

const newsletterForm = document.querySelector('.newsletter-form');

newsletterForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = newsletterForm.querySelector('input[type="email"]').value;
    
    // Simulate newsletter signup
    console.log('Newsletter signup:', email);
    
    // Reset form
    newsletterForm.reset();
    
    // Show confirmation
    const btn = newsletterForm.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i>';
    btn.style.background = '#4CAF50';
    
    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
    }, 2000);
});

// ===========================
// SMOOTH SCROLL POLYFILL
// ===========================

if (!('scrollBehavior' in document.documentElement.style)) {
    const smoothscroll = () => {
        const currentScroll = document.documentElement.scrollTop || document.body.scrollTop;
        if (currentScroll > 0) {
            window.requestAnimationFrame(smoothscroll);
            window.scrollBy(0, -currentScroll / 8);
        }
    };
}

// ===========================
// PARALLAX EFFECT
// ===========================

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroBg = document.querySelector('.hero-overlay');
    
    if (heroBg) {
        heroBg.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// ===========================
// LOAD ANIMATIONS
// ===========================

window.addEventListener('load', () => {
    document.body.style.opacity = '1';
});

// ===========================
// UTILITY FUNCTIONS
// ===========================

function animateCounter(element, target, duration = 2000) {
    let current = 0;
    const increment = target / (duration / 16);
    
    const updateCounter = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target;
        }
    };
    
    updateCounter();
}

// Öffnen des Impressum Overlays
document.getElementById('impressumLink').addEventListener('click', function(e) {
  e.preventDefault();
  document.getElementById('impressumOverlay').style.display = 'flex';
});

// Schließen des Overlays
document.getElementById('closeOverlay').addEventListener('click', function() {
  document.getElementById('impressumOverlay').style.display = 'none';
});

// Klick außerhalb des Inhalts schließt auch das Overlay
window.addEventListener('click', function(e) {
  if (e.target.id === 'impressumOverlay') {
    document.getElementById('impressumOverlay').style.display = 'none';
  }
});

// ===========================
// EVENT LISTENERS
// ===========================

// Add smooth scroll to all anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

console.log('Maximan Jump Tour - Website Loaded Successfully! 🎿');
