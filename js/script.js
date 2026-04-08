/* ============================================
   PORTFOLIO - ariel-tonato.me inspired JS
   Loader, scroll reveals, cube, interactions
   ============================================ */

// --- Loader ---
window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    const main = document.getElementById('mainContent');

    setTimeout(() => {
        loader.classList.add('hidden');
        main.classList.add('visible');
    }, 800);

    // Safety: force hide after 5s
    setTimeout(() => {
        loader.classList.add('hidden');
        main.classList.add('visible');
    }, 5000);
});

// --- Year ---
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// --- Scroll Reveal ---
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const delay = entry.target.dataset.delay || 0;
            setTimeout(() => entry.target.classList.add('visible'), delay * 120);
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// --- Odometer / Flip-clock Stat Counter ---
function buildOdometer(statEl) {
    const value = statEl.dataset.value;
    const suffix = statEl.dataset.suffix || '';
    const container = statEl.querySelector('.hero-stat-value');
    if (!container) return;

    // Create a digit column for each character in the value
    const digits = value.split('');
    digits.forEach((d, i) => {
        const digit = parseInt(d);
        const col = document.createElement('div');
        col.className = 'hero-stat-digit';

        const inner = document.createElement('div');
        inner.className = 'hero-stat-digit-inner';
        // Build 0-9 then land on target digit
        for (let n = 0; n <= 9; n++) {
            const span = document.createElement('span');
            span.textContent = n;
            inner.appendChild(span);
        }
        col.appendChild(inner);
        container.appendChild(col);

        // Stagger each digit slightly
        inner.style.transitionDelay = `${i * 0.2}s`;
    });

    // Add suffix
    if (suffix) {
        const suffixEl = document.createElement('span');
        suffixEl.className = 'hero-stat-suffix';
        suffixEl.textContent = suffix;
        container.appendChild(suffixEl);
    }
}

function animateOdometer(statEl) {
    const value = statEl.dataset.value;
    const digitCols = statEl.querySelectorAll('.hero-stat-digit-inner');

    value.split('').forEach((d, i) => {
        const target = parseInt(d);
        const inner = digitCols[i];
        if (!inner) return;
        // Each span is 3.2rem tall, move up by target * 3.2rem
        inner.style.transform = `translateY(-${target * 3.2}rem)`;
    });

    // Show labels after animation
    setTimeout(() => statEl.classList.add('counted'), 800);
}

// Build all odometers on load
document.querySelectorAll('.hero-stat').forEach(el => buildOdometer(el));

// Trigger animation on scroll
const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateOdometer(entry.target);
            statObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.hero-stat').forEach(el => statObserver.observe(el));

// --- Services Carousel ---
(() => {
    const track = document.getElementById('svcTrack');
    if (!track) return;
    const pages = track.querySelectorAll('.svc-page');
    const prevArrow = document.getElementById('svcPrev');
    const nextArrow = document.getElementById('svcNext');
    const dotsBox = document.getElementById('svcDots');
    let svcIndex = 0;
    let svcAutoPlay;

    pages.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'svc-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => goTo(i));
        dotsBox.appendChild(dot);
    });

    function goTo(index) {
        svcIndex = ((index % pages.length) + pages.length) % pages.length;
        track.style.transform = `translateX(-${svcIndex * 100}%)`;
        dotsBox.querySelectorAll('.svc-dot').forEach((d, i) => {
            d.classList.toggle('active', i === svcIndex);
        });
        resetAuto();
    }

    prevArrow.addEventListener('click', () => goTo(svcIndex - 1));
    nextArrow.addEventListener('click', () => goTo(svcIndex + 1));

    function resetAuto() {
        clearInterval(svcAutoPlay);
        svcAutoPlay = setInterval(() => goTo(svcIndex + 1), 15000);
    }

    resetAuto();
})();

// --- Project Sidebar Interaction ---
const sidebarCards = document.querySelectorAll('.projects-sidebar__card');
const bentoCards = document.querySelectorAll('.projects-bento__card');

function setActiveProject(projectId) {
    sidebarCards.forEach(card => card.classList.toggle('projects-sidebar__card--active', card.dataset.project === projectId));
    bentoCards.forEach(card => card.classList.toggle('projects-bento__card--active', card.dataset.project === projectId));
}
sidebarCards.forEach(card => card.addEventListener('click', () => setActiveProject(card.dataset.project)));
bentoCards.forEach(card => card.addEventListener('click', (e) => { if (!e.target.closest('.project-detail-btn')) setActiveProject(card.dataset.project); }));

// Bento cards scroll reveal
const bentoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); bentoObserver.unobserve(entry.target); } });
}, { threshold: 0.15 });
bentoCards.forEach(card => bentoObserver.observe(card));

// --- Project Modal ---
const modal = document.getElementById('projectModal');
const closeModalBtn = document.getElementById('closeModal');
const projectIframe = document.getElementById('projectIframe');
const modalOpenTab = document.getElementById('modalOpenTab');

if (modal) {
    document.querySelectorAll('.project-detail-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = btn.dataset.url;
            projectIframe.src = url;
            modalOpenTab.href = url;
            modal.classList.add('active');
        });
    });
    closeModalBtn.addEventListener('click', () => { modal.classList.remove('active'); projectIframe.src = ''; });
    modal.addEventListener('click', (e) => { if (e.target === modal) { modal.classList.remove('active'); projectIframe.src = ''; } });
}

// --- Navbar ---
const navbar = document.getElementById('navbar');
let lastScrollY = window.scrollY;
let ticking = false;

function onNavScroll() {
    const y = window.scrollY;

    if (y > 80) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');

    if (y < 50) {
        navbar.classList.remove('nav-hidden');
        lastScrollY = y;
        return;
    }

    const diff = y - lastScrollY;
    if (Math.abs(diff) > 8) {
        navbar.classList.toggle('nav-hidden', diff > 0);
        lastScrollY = y;
    }
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(() => { onNavScroll(); ticking = false; });
        ticking = true;
    }
}, { passive: true });

// --- Active nav link ---
window.addEventListener('scroll', () => {
    let current = '';
    document.querySelectorAll('section[id]').forEach(section => {
        if (scrollY >= section.offsetTop - 200) {
            current = section.getAttribute('id');
        }
    });
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
}, { passive: true });

// --- Smooth scroll ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Close mobile menu
            const navLinks = document.getElementById('navLinks');
            const navToggle = document.getElementById('navToggle');
            if (navLinks && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                navToggle.classList.remove('active');
            }
        }
    });
});

// --- Mobile toggle ---
const navToggle = document.getElementById('navToggle');
const navLinksEl = document.getElementById('navLinks');

if (navToggle && navLinksEl) {
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinksEl.classList.toggle('active');
    });
}

// --- 3D Skills Cube ---
const skillsCube = document.getElementById('skillsCube');

if (skillsCube) {
    const skills = {
        front: [
            { name: 'HTML', icon: '\uD83C\uDF10', color: '#e34c26' },
            { name: 'CSS', icon: '\uD83C\uDFA8', color: '#264de4' },
            { name: 'JavaScript', icon: '\u26A1', color: '#f0db4f' },
            { name: 'React', icon: '\u269B\uFE0F', color: '#61dafb' }
        ],
        back: [
            { name: 'Node.js', icon: '\uD83D\uDFE2', color: '#68a063' },
            { name: '.Net', icon: '\uD83D\uDE80', color: '#ffffff' },
            { name: 'Laravel', icon: '\uD83D\uDD0C', color: '#00d4ff' },
            { name: 'Microservices', icon: '\uD83D\uDD37', color: '#a855f7' }
        ],
        right: [
            { name: 'AWS', icon: '\u2601\uFE0F', color: '#ff9900' },
            { name: 'Docker', icon: '\uD83D\uDC33', color: '#0db7ed' },
            { name: 'CI/CD', icon: '\uD83D\uDD04', color: '#00ff88' },
            { name: 'GitHub', icon: '\uD83E\uDD16', color: '#2088ff' }
        ],
        left: [
            { name: 'UI/UX', icon: '\u2728', color: '#ff6b6b' },
            { name: 'Responsive', icon: '\uD83D\uDCF1', color: '#4ecdc4' },
            { name: 'Testing', icon: '\uD83E\uDDEA', color: '#95e1d3' },
            { name: 'Security', icon: '\uD83D\uDD12', color: '#f38181' }
        ],
        top: [
            { name: 'MySQL', icon: '\uD83C\uDF43', color: '#47a248' },
            { name: 'PostgreSQL', icon: '\uD83D\uDC18', color: '#336791' },
            { name: 'Oracle', icon: '\uD83D\uDCBE', color: '#dc382d' },
            { name: 'Aurora', icon: '\uD83D\uDC97', color: '#e10098' }
        ],
        bottom: [
            { name: 'Git', icon: '\uD83D\uDCE6', color: '#f05032' },
            { name: 'Linux', icon: '\uD83D\uDC27', color: '#fcc624' },
            { name: 'Cloud', icon: '\uD83D\uDC9A', color: '#009639' },
            { name: 'Monitoring', icon: '\u2699\uFE0F', color: '#326ce5' }
        ]
    };

    Object.keys(skills).forEach(face => {
        const faceEl = document.createElement('div');
        faceEl.className = `cube-face ${face}`;
        skills[face].forEach(skill => {
            const el = document.createElement('div');
            el.className = 'skill-item-cube';
            el.innerHTML = `
                <div class="skill-icon" style="color:${skill.color}">${skill.icon}</div>
                <div class="skill-name">${skill.name}</div>
            `;
            faceEl.appendChild(el);
        });
        skillsCube.appendChild(faceEl);
    });

    // Drag
    let isDragging = false, prevX = 0, prevY = 0;
    let rotationX = -20, rotationY = 25;
    let velocityX = 0, velocityY = 0, inertiaFrame = null;

    function applyCubeTransform() {
        skillsCube.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
    }

    function startInertia() {
        cancelAnimationFrame(inertiaFrame);
        const friction = 0.95, stop = 0.05;
        const animate = () => {
            rotationY += velocityX;
            rotationX -= velocityY;
            velocityX *= friction;
            velocityY *= friction;
            applyCubeTransform();
            if (Math.abs(velocityX) > stop || Math.abs(velocityY) > stop)
                inertiaFrame = requestAnimationFrame(animate);
        };
        inertiaFrame = requestAnimationFrame(animate);
    }

    skillsCube.addEventListener('pointerdown', (e) => {
        isDragging = true;
        prevX = e.clientX; prevY = e.clientY;
        skillsCube.classList.add('dragging', 'paused');
        cancelAnimationFrame(inertiaFrame);
        skillsCube.setPointerCapture(e.pointerId);
        e.preventDefault();
    });

    skillsCube.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - prevX, dy = e.clientY - prevY;
        rotationY += dx * 0.5;
        rotationX -= dy * 0.5;
        velocityX = dx * 0.09;
        velocityY = dy * 0.09;
        applyCubeTransform();
        prevX = e.clientX; prevY = e.clientY;
        e.preventDefault();
    });

    skillsCube.addEventListener('pointerup', () => {
        isDragging = false;
        skillsCube.classList.remove('paused', 'dragging');
        startInertia();
    });

    skillsCube.addEventListener('pointercancel', () => {
        isDragging = false;
        skillsCube.classList.remove('paused', 'dragging');
        startInertia();
    });
}

// --- Matrix Background ---
const matrixBg = document.getElementById('matrixBg');
if (matrixBg) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*(){}[]|/=+-_<>?!:;^~';
    const symbols = '{}[]()@#$%&*=+<>?!:;/|^~';
    const total = 1500;
    let html = '';
    for (let i = 0; i < total; i++) {
        const isBright = Math.random() < 0.12;
        const char = isBright
            ? symbols[Math.floor(Math.random() * symbols.length)]
            : chars[Math.floor(Math.random() * chars.length)];
        const delay = (Math.random() * 4).toFixed(2);
        html += `<span class="${isBright ? 'bright' : ''}" style="animation-delay:${delay}s">${char}</span>`;
    }
    matrixBg.innerHTML = html;

    // Animate random characters changing
    const allSpans = matrixBg.querySelectorAll('span');
    const allChars = chars + symbols;

    setInterval(() => {
        for (let j = 0; j < 60; j++) {
            const idx = Math.floor(Math.random() * allSpans.length);
            const span = allSpans[idx];
            span.textContent = allChars[Math.floor(Math.random() * allChars.length)];
            if (Math.random() < 0.06) span.classList.toggle('bright');
        }
    }, 60);
}

// --- WhatsApp Widget ---
const waWidget = document.getElementById('waWidget');
const waFab = document.getElementById('waFab');
const waClose = document.getElementById('waClose');
const waSend = document.getElementById('waSend');

if (waFab) {
    waFab.addEventListener('click', () => waWidget.classList.toggle('open'));
    waClose.addEventListener('click', () => waWidget.classList.remove('open'));

    // Custom select
    const waSelect = document.getElementById('waSelect');
    const waSelectTrigger = document.getElementById('waSelectTrigger');
    const waSelectOptions = document.getElementById('waSelectOptions');
    let waReasonValue = 'Solicitar información';

    waSelectTrigger.addEventListener('click', () => waSelect.classList.toggle('open'));

    waSelectOptions.querySelectorAll('.wa-select-option').forEach(opt => {
        opt.addEventListener('click', () => {
            waReasonValue = opt.dataset.value;
            waSelectTrigger.querySelector('span').textContent = waReasonValue;
            waSelectOptions.querySelectorAll('.wa-select-option').forEach(o => o.classList.remove('wa-select-option--active'));
            opt.classList.add('wa-select-option--active');
            waSelect.classList.remove('open');
        });
    });

    document.addEventListener('click', (e) => {
        if (!waSelect.contains(e.target)) waSelect.classList.remove('open');
    });

    waSend.addEventListener('click', () => {
        const name = document.getElementById('waName').value.trim();
        const company = document.getElementById('waCompany').value.trim();
        const reason = waReasonValue;
        const note = document.getElementById('waNote').value.trim();

        let msg = `Hola Javier, soy *${name || 'un visitante'}*`;
        if (company) msg += ` de *${company}*`;
        msg += `.\n\n*Motivo:* ${reason}`;
        if (note) msg += `\n*Nota:* ${note}`;
        msg += `\n\nEnviado desde el portafolio web.`;

        const encoded = encodeURIComponent(msg);
        window.open(`https://wa.me/522871254233?text=${encoded}`, '_blank');
        waWidget.classList.remove('open');
    });
}
