// ==========================================
// PUERTA A PUERTA - Main JavaScript
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initMobileMenu();
    initCounterAnimation();
    initQuickQuote();
    initFlashMessages();
});

// === NAVBAR SCROLL ===
function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });
}

// === MOBILE MENU ===
function initMobileMenu() {
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navMenu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
        menu.classList.toggle('active');
        toggle.classList.toggle('active');
    });

    // Close menu when clicking a link
    menu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('active');
            toggle.classList.remove('active');
        });
    });
}

// === COUNTER ANIMATION ===
function initCounterAnimation() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(el) {
    const target = parseInt(el.dataset.count);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        el.textContent = Math.floor(current).toLocaleString();
    }, 16);
}

// === QUICK QUOTE CALCULATOR ===
function initQuickQuote() {
    const form = document.getElementById('quickQuoteForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const distancia = parseFloat(form.querySelector('[name="distancia"]').value) || 0;
        const peso = parseFloat(form.querySelector('[name="peso"]').value) || 0;
        const tipo = form.querySelector('[name="tipo_servicio"]').value;

        try {
            const response = await fetch('/api/cotizar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ distancia, peso, tipo_servicio: tipo })
            });

            const data = await response.json();
            const resultDiv = document.getElementById('quoteResult');
            document.getElementById('quotePrice').textContent = data.precio_total.toFixed(2);
            document.getElementById('qDistPrice').textContent = data.precio_distancia.toFixed(2);
            document.getElementById('qWeightPrice').textContent = data.precio_peso.toFixed(2);
            document.getElementById('qMultiplier').textContent = data.multiplicador;
            resultDiv.classList.remove('hidden');

            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (err) {
            console.error('Error al cotizar:', err);
        }
    });
}

// === FLASH MESSAGES AUTO-DISMISS ===
function initFlashMessages() {
    document.querySelectorAll('.flash-message').forEach(msg => {
        setTimeout(() => {
            msg.style.animation = 'slideIn .3s ease reverse forwards';
            setTimeout(() => msg.remove(), 300);
        }, 5000);
    });
}
