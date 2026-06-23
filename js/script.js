/* ============================================
   PORTFOLIO - Javier Vidal Miguel
   Loader, scroll reveals, cube, interactions
   ============================================ */

// --- Wormhole / Galaxy Star Field ---
(() => {
    const canvas = document.getElementById('starField');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w, h, cx, cy, stars;
    const STAR_COUNT = 600;
    const MAX_DEPTH = 1500;

    function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
        cx = w / 2;
        cy = h / 2;
    }

    function createStars() {
        stars = [];
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push(newStar());
        }
    }

    function newStar() {
        // Distribute in a 3D cylinder around center
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * Math.max(w, h) * 0.6;
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            z: Math.random() * MAX_DEPTH,
            size: Math.random() * 1.5 + 0.5,
            baseOpacity: Math.random() * 0.5 + 0.3,
            twinkleSpeed: Math.random() * 0.03 + 0.008,
            twinkleOffset: Math.random() * Math.PI * 2,
            // Spiral properties
            orbitRadius: radius,
            angle: angle,
            orbitSpeed: (Math.random() * 0.0004 + 0.0001) * (Math.random() < 0.5 ? 1 : -1),
            // Color tint
            hue: Math.random() < 0.15 ? 230 + Math.random() * 40 : 0, // some blue/purple tinted
            colored: Math.random() < 0.15
        };
    }

    let time = 0;
    const WARP_SPEED = 1.5;

    function draw() {
        ctx.clearRect(0, 0, w, h);

        time += 1;

        for (const s of stars) {
            // Move toward viewer (warp)
            s.z -= WARP_SPEED;

            // Spiral rotation
            s.angle += s.orbitSpeed;
            s.x = Math.cos(s.angle) * s.orbitRadius;
            s.y = Math.sin(s.angle) * s.orbitRadius;

            // Reset if past camera
            if (s.z <= 0) {
                s.z = MAX_DEPTH;
                s.orbitRadius = Math.random() * Math.max(w, h) * 0.6;
                s.angle = Math.random() * Math.PI * 2;
                s.x = Math.cos(s.angle) * s.orbitRadius;
                s.y = Math.sin(s.angle) * s.orbitRadius;
            }

            // Project 3D -> 2D
            const scale = 300 / s.z;
            const px = s.x * scale + cx;
            const py = s.y * scale + cy;

            // Off screen? skip
            if (px < -10 || px > w + 10 || py < -10 || py > h + 10) continue;

            // Size grows as star approaches
            const size = s.size * scale * 0.5;
            const clampedSize = Math.min(size, 4);

            // Twinkle
            const twinkle = Math.sin(time * s.twinkleSpeed + s.twinkleOffset);
            const depthFade = 1 - s.z / MAX_DEPTH;
            const opacity = (s.baseOpacity + twinkle * 0.2) * depthFade;

            // Draw star
            ctx.beginPath();
            ctx.arc(px, py, Math.max(0.3, clampedSize), 0, Math.PI * 2);

            if (s.colored) {
                ctx.fillStyle = `hsla(${s.hue}, 60%, 75%, ${Math.max(0.05, opacity)})`;
            } else {
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.05, opacity)})`;
            }
            ctx.fill();

            // Streak/trail for close stars (warp effect)
            if (s.z < 300 && clampedSize > 1) {
                const trailLen = (1 - s.z / 300) * 15;
                const dx = px - cx;
                const dy = py - cy;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const nx = dx / dist;
                const ny = dy / dist;

                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px + nx * trailLen, py + ny * trailLen);
                ctx.strokeStyle = `rgba(200, 210, 255, ${opacity * 0.3})`;
                ctx.lineWidth = clampedSize * 0.5;
                ctx.stroke();
            }

            // Glow for bright close stars
            if (depthFade > 0.7 && clampedSize > 1.5) {
                ctx.beginPath();
                ctx.arc(px, py, clampedSize * 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(180, 190, 255, ${opacity * 0.06})`;
                ctx.fill();
            }
        }

        requestAnimationFrame(draw);
    }

    // --- Static background layer: nebulas + planets ---
    const bgCanvas = document.createElement('canvas');
    bgCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:-1;pointer-events:none;';
    document.body.prepend(bgCanvas);
    const bgCtx = bgCanvas.getContext('2d');

    function drawBackground() {
        bgCanvas.width = w;
        bgCanvas.height = h;
        bgCtx.clearRect(0, 0, w, h);

        // Nebula clouds
        const nebulas = [
            { x: w * 0.15, y: h * 0.25, r: 250, color: [90, 50, 180] },
            { x: w * 0.8, y: h * 0.6, r: 300, color: [40, 80, 160] },
            { x: w * 0.5, y: h * 0.85, r: 200, color: [120, 40, 100] },
            { x: w * 0.9, y: h * 0.15, r: 180, color: [50, 100, 140] },
        ];

        for (const n of nebulas) {
            const grad = bgCtx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
            grad.addColorStop(0, `rgba(${n.color[0]},${n.color[1]},${n.color[2]}, 0.06)`);
            grad.addColorStop(0.4, `rgba(${n.color[0]},${n.color[1]},${n.color[2]}, 0.03)`);
            grad.addColorStop(1, 'transparent');
            bgCtx.fillStyle = grad;
            bgCtx.fillRect(0, 0, w, h);
        }

        // Planets
        const planets = [
            { x: w * 0.88, y: h * 0.22, r: 18, color: '#4a3a6a', ring: true, ringColor: 'rgba(129,140,248,0.12)' },
            { x: w * 0.12, y: h * 0.7, r: 10, color: '#2a4a5a', ring: false },
            { x: w * 0.65, y: h * 0.92, r: 25, color: '#3a2a4a', ring: true, ringColor: 'rgba(180,140,220,0.08)' },
        ];

        for (const p of planets) {
            // Planet body
            const pGrad = bgCtx.createRadialGradient(p.x - p.r * 0.3, p.y - p.r * 0.3, 0, p.x, p.y, p.r);
            pGrad.addColorStop(0, p.color);
            pGrad.addColorStop(1, 'rgba(5,5,15,0.8)');
            bgCtx.beginPath();
            bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            bgCtx.fillStyle = pGrad;
            bgCtx.fill();

            // Atmosphere glow
            const glowGrad = bgCtx.createRadialGradient(p.x, p.y, p.r * 0.8, p.x, p.y, p.r * 2.5);
            glowGrad.addColorStop(0, 'rgba(129,140,248,0.04)');
            glowGrad.addColorStop(1, 'transparent');
            bgCtx.beginPath();
            bgCtx.arc(p.x, p.y, p.r * 2.5, 0, Math.PI * 2);
            bgCtx.fillStyle = glowGrad;
            bgCtx.fill();

            // Ring
            if (p.ring) {
                bgCtx.beginPath();
                bgCtx.ellipse(p.x, p.y, p.r * 2.2, p.r * 0.5, -0.3, 0, Math.PI * 2);
                bgCtx.strokeStyle = p.ringColor;
                bgCtx.lineWidth = 1.5;
                bgCtx.stroke();
            }
        }

        // Distant galaxies (small spiral smudges)
        const galaxies = [
            { x: w * 0.35, y: h * 0.15, size: 30 },
            { x: w * 0.75, y: h * 0.45, size: 20 },
        ];

        for (const g of galaxies) {
            bgCtx.save();
            bgCtx.translate(g.x, g.y);
            bgCtx.rotate(0.5);
            const gGrad = bgCtx.createRadialGradient(0, 0, 0, 0, 0, g.size);
            gGrad.addColorStop(0, 'rgba(180, 170, 220, 0.08)');
            gGrad.addColorStop(0.5, 'rgba(129, 140, 248, 0.03)');
            gGrad.addColorStop(1, 'transparent');
            bgCtx.fillStyle = gGrad;
            bgCtx.beginPath();
            bgCtx.ellipse(0, 0, g.size, g.size * 0.4, 0, 0, Math.PI * 2);
            bgCtx.fill();
            bgCtx.restore();
        }
    }

    resize();
    createStars();
    drawBackground();
    draw();

    window.addEventListener('resize', () => {
        resize();
        drawBackground();
    });
})();

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
    const viewport = track.parentElement;
    const allCards = Array.from(track.querySelectorAll('.svc-card'));
    const mobileMQ = window.matchMedia('(max-width: 768px)');
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

    function updateCenterCard() {
        if (!mobileMQ.matches) {
            allCards.forEach(c => c.classList.remove('svc-card--center'));
            return;
        }
        const vRect = viewport.getBoundingClientRect();
        const vCenter = vRect.left + vRect.width / 2;
        let closest = null;
        let closestDist = Infinity;
        allCards.forEach(card => {
            const cRect = card.getBoundingClientRect();
            const cCenter = cRect.left + cRect.width / 2;
            const dist = Math.abs(cCenter - vCenter);
            if (dist < closestDist) { closestDist = dist; closest = card; }
        });
        allCards.forEach(c => c.classList.toggle('svc-card--center', c === closest));
    }

    function scrollToCard(idx) {
        const clamped = Math.max(0, Math.min(allCards.length - 1, idx));
        allCards[clamped].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    prevArrow.addEventListener('click', () => {
        if (mobileMQ.matches) {
            const curr = allCards.findIndex(c => c.classList.contains('svc-card--center'));
            scrollToCard((curr >= 0 ? curr : 0) - 1);
        } else {
            goTo(svcIndex - 1);
        }
    });
    nextArrow.addEventListener('click', () => {
        if (mobileMQ.matches) {
            const curr = allCards.findIndex(c => c.classList.contains('svc-card--center'));
            scrollToCard((curr >= 0 ? curr : 0) + 1);
        } else {
            goTo(svcIndex + 1);
        }
    });

    let scrollTick = false;
    viewport.addEventListener('scroll', () => {
        if (!scrollTick) {
            requestAnimationFrame(() => { updateCenterCard(); scrollTick = false; });
            scrollTick = true;
        }
    }, { passive: true });
    window.addEventListener('resize', updateCenterCard);
    mobileMQ.addEventListener('change', updateCenterCard);
    setTimeout(updateCenterCard, 100);

    function resetAuto() {
        clearInterval(svcAutoPlay);
        if (mobileMQ.matches) return;
        svcAutoPlay = setInterval(() => goTo(svcIndex + 1), 15000);
    }

    resetAuto();
})();

// --- Project Sidebar Interaction ---
const sidebarCards = document.querySelectorAll('.projects-sidebar__card');
const bentoCards = document.querySelectorAll('.projects-bento__card');
const projectsBento = document.getElementById('projectsBento');
const projectsBentoPrev = document.getElementById('projectsBentoPrev');
const projectsBentoNext = document.getElementById('projectsBentoNext');
const projMobileMQ = window.matchMedia('(max-width: 768px)');

function setActiveProject(projectId) {
    sidebarCards.forEach(card => card.classList.toggle('projects-sidebar__card--active', card.dataset.project === projectId));
    bentoCards.forEach(card => card.classList.toggle('projects-bento__card--active', card.dataset.project === projectId));
}

function scrollBentoToProject(projectId) {
    const card = Array.from(bentoCards).find(c => c.dataset.project === projectId);
    if (card) card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}

function updateProjectsCenter() {
    if (!projMobileMQ.matches || !projectsBento) {
        bentoCards.forEach(c => c.classList.remove('projects-bento__card--center'));
        return;
    }
    const vRect = projectsBento.getBoundingClientRect();
    const vCenter = vRect.left + vRect.width / 2;
    let closest = null;
    let closestDist = Infinity;
    bentoCards.forEach(card => {
        const cRect = card.getBoundingClientRect();
        const cCenter = cRect.left + cRect.width / 2;
        const dist = Math.abs(cCenter - vCenter);
        if (dist < closestDist) { closestDist = dist; closest = card; }
    });
    bentoCards.forEach(c => c.classList.toggle('projects-bento__card--center', c === closest));
    if (closest) {
        const projectId = closest.dataset.project;
        sidebarCards.forEach(card => card.classList.toggle('projects-sidebar__card--active', card.dataset.project === projectId));
    }
}

sidebarCards.forEach(card => card.addEventListener('click', () => {
    setActiveProject(card.dataset.project);
    if (projMobileMQ.matches) scrollBentoToProject(card.dataset.project);
}));
bentoCards.forEach(card => card.addEventListener('click', (e) => { if (!e.target.closest('.project-detail-btn')) setActiveProject(card.dataset.project); }));

if (projectsBento) {
    let projScrollTick = false;
    projectsBento.addEventListener('scroll', () => {
        if (!projScrollTick) {
            requestAnimationFrame(() => { updateProjectsCenter(); projScrollTick = false; });
            projScrollTick = true;
        }
    }, { passive: true });
    window.addEventListener('resize', updateProjectsCenter);
    projMobileMQ.addEventListener('change', updateProjectsCenter);
    setTimeout(updateProjectsCenter, 100);
}

if (projectsBentoPrev) projectsBentoPrev.addEventListener('click', () => {
    const cards = Array.from(bentoCards);
    const curr = cards.findIndex(c => c.classList.contains('projects-bento__card--center'));
    const prev = Math.max(0, (curr >= 0 ? curr : 0) - 1);
    cards[prev].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
});
if (projectsBentoNext) projectsBentoNext.addEventListener('click', () => {
    const cards = Array.from(bentoCards);
    const curr = cards.findIndex(c => c.classList.contains('projects-bento__card--center'));
    const next = Math.min(cards.length - 1, (curr >= 0 ? curr : 0) + 1);
    cards[next].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
});

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
const modalFallback = document.getElementById('modalFallback');
const modalFallbackImg = document.getElementById('modalFallbackImg');
const modalFallbackTitle = document.getElementById('modalFallbackTitle');
const modalFallbackDesc = document.getElementById('modalFallbackDesc');
const modalFallbackCta = document.getElementById('modalFallbackCta');

function closeProjectModal() {
    modal.classList.remove('active');
    projectIframe.src = '';
    if (modalFallback) modalFallback.hidden = true;
    projectIframe.style.display = '';
}

if (modal) {
    document.querySelectorAll('.project-detail-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = btn.dataset.url;
            const blocked = btn.dataset.blocked === 'true';
            modalOpenTab.href = url;

            if (blocked && modalFallback) {
                const card = btn.closest('.projects-bento__card');
                const img = card?.querySelector('.projects-bento__media img');
                const title = card?.querySelector('.projects-bento__title')?.textContent || '';
                const desc = card?.querySelector('.projects-bento__desc')?.textContent || '';
                if (img) { modalFallbackImg.src = img.src; modalFallbackImg.alt = img.alt || ''; }
                modalFallbackTitle.textContent = title;
                modalFallbackDesc.textContent = desc;
                modalFallbackCta.href = url;
                projectIframe.style.display = 'none';
                projectIframe.src = '';
                modalFallback.hidden = false;
            } else {
                if (modalFallback) modalFallback.hidden = true;
                projectIframe.style.display = '';
                projectIframe.src = url;
            }
            modal.classList.add('active');
        });
    });
    closeModalBtn.addEventListener('click', closeProjectModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeProjectModal(); });
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
        const href = this.getAttribute('href');
        // Bail if href was swapped to an external URL or is just "#"
        if (!href || !href.startsWith('#') || href.length < 2) return;
        e.preventDefault();
        const target = document.querySelector(href);
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
    waFab.addEventListener('click', () => {
        const willOpen = !waWidget.classList.contains('open');
        const javiPanel = document.getElementById('javi-panel');
        const javiFabContainer = document.getElementById('javi-fab-container');
        if (willOpen) {
            // Auto-close + hide Javier IA widget (FAB + label too)
            if (javiPanel) {
                javiPanel.classList.remove('javi-panel--open');
                javiPanel.setAttribute('aria-hidden', 'true');
            }
            if (javiFabContainer) javiFabContainer.classList.add('javi-fab-container--hidden');
        } else {
            // Closing WhatsApp -> bring Javier IA back
            if (javiFabContainer) javiFabContainer.classList.remove('javi-fab-container--hidden');
        }
        waWidget.classList.toggle('open');
    });
    waClose.addEventListener('click', () => {
        waWidget.classList.remove('open');
        const javiFabContainer = document.getElementById('javi-fab-container');
        if (javiFabContainer) javiFabContainer.classList.remove('javi-fab-container--hidden');
    });

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

// --- Store Showcase 360 ---
(() => {
    const stage = document.getElementById('storeStage');
    if (!stage) return;
    const products = Array.from(stage.querySelectorAll('.store-product'));
    const prevBtn = document.getElementById('storePrev');
    const nextBtn = document.getElementById('storeNext');
    const dotsBox = document.getElementById('storeDots');
    let currentIdx = 0;
    let isAnimating = false;

    function formatPrice(amount) {
        const n = parseInt(amount, 10);
        if (isNaN(n)) return amount;
        return n.toLocaleString('en-US');
    }

    function updatePriceFor(product) {
        const activePlan = product.querySelector('.store-plan-btn--active');
        if (!activePlan) return;
        const price = activePlan.dataset.price || '0';
        const period = activePlan.dataset.period || '';
        const amountEl = product.querySelector('.store-price__amount');
        const periodEl = product.querySelector('.store-price__period');
        if (amountEl) amountEl.textContent = formatPrice(price);
        if (periodEl) periodEl.textContent = period;
    }

    // Plan switcher per product
    products.forEach(product => {
        product.querySelectorAll('.store-plan-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                product.querySelectorAll('.store-plan-btn').forEach(b => b.classList.remove('store-plan-btn--active'));
                btn.classList.add('store-plan-btn--active');
                updatePriceFor(product);
            });
        });
    });

    // Dots
    products.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'store-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Producto ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        dotsBox.appendChild(dot);
    });

    function goTo(newIdx) {
        if (isAnimating) return;
        const n = products.length;
        newIdx = ((newIdx % n) + n) % n;
        if (newIdx === currentIdx) return;
        isAnimating = true;

        const currentProduct = products[currentIdx];
        const nextProduct = products[newIdx];
        const direction = newIdx > currentIdx || (currentIdx === n - 1 && newIdx === 0) ? 'right' : 'left';

        if (direction === 'right') {
            currentProduct.classList.remove('store-product--active');
            currentProduct.classList.add('store-product--exit-left');
            nextProduct.style.transform = 'rotateY(-90deg) scale(0.7)';
            nextProduct.style.opacity = '0';
            nextProduct.style.visibility = 'visible';
        } else {
            currentProduct.classList.remove('store-product--active');
            currentProduct.classList.add('store-product--exit-right');
            nextProduct.style.transform = 'rotateY(90deg) scale(0.7)';
            nextProduct.style.opacity = '0';
            nextProduct.style.visibility = 'visible';
        }

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                nextProduct.classList.add('store-product--active');
                nextProduct.style.transform = '';
                nextProduct.style.opacity = '';
            });
        });

        dotsBox.querySelectorAll('.store-dot').forEach((d, i) => {
            d.classList.toggle('active', i === newIdx);
        });

        currentIdx = newIdx;

        setTimeout(() => {
            currentProduct.classList.remove('store-product--exit-left', 'store-product--exit-right');
            currentProduct.style.transform = '';
            currentProduct.style.opacity = '';
            currentProduct.style.visibility = '';
            isAnimating = false;
        }, 700);
    }

    prevBtn.addEventListener('click', () => goTo(currentIdx - 1));
    nextBtn.addEventListener('click', () => goTo(currentIdx + 1));

    // Keyboard nav
    document.addEventListener('keydown', (e) => {
        const tiendaSection = document.getElementById('tienda');
        if (!tiendaSection) return;
        const rect = tiendaSection.getBoundingClientRect();
        const visible = rect.top < window.innerHeight && rect.bottom > 0;
        if (!visible) return;
        if (e.key === 'ArrowLeft') goTo(currentIdx - 1);
        if (e.key === 'ArrowRight') goTo(currentIdx + 1);
    });

    // Touch swipe support
    let touchStartX = 0;
    let touchEndX = 0;
    stage.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    stage.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) goTo(currentIdx + 1);
            else goTo(currentIdx - 1);
        }
    }, { passive: true });
})();
