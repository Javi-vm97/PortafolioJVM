/* Portfolio profesional — navegación, reveals, cubo y contacto */
(() => {
    'use strict';

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    const year = document.getElementById('year');
    const scrollProgress = document.getElementById('scrollProgress');
    const cursorLight = document.getElementById('cursorLight');

    if (year) year.textContent = new Date().getFullYear();

    // Reveal content progressively while keeping it immediately visible for users
    // who prefer reduced motion or browsers without IntersectionObserver.
    const revealItems = document.querySelectorAll('.reveal');
    if (reducedMotion || !('IntersectionObserver' in window)) {
        revealItems.forEach((item) => item.classList.add('visible'));
    } else {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const delay = Number(entry.target.dataset.delay || 0) * 90;
                window.setTimeout(() => entry.target.classList.add('visible'), delay);
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -35px' });
        revealItems.forEach((item) => observer.observe(item));
    }

    function closeMenu() {
        navLinks?.classList.remove('active');
        navToggle?.classList.remove('active');
        navToggle?.setAttribute('aria-expanded', 'false');
        navToggle?.setAttribute('aria-label', 'Abrir menú');
        document.body.style.overflow = '';
    }

    navToggle?.addEventListener('click', () => {
        const isOpen = !navLinks.classList.contains('active');
        navLinks.classList.toggle('active', isOpen);
        navToggle.classList.toggle('active', isOpen);
        navToggle.setAttribute('aria-expanded', String(isOpen));
        navToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            const selector = link.getAttribute('href');
            if (!selector || selector === '#') return;
            const target = document.querySelector(selector);
            if (!target) return;
            event.preventDefault();
            target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
            closeMenu();
        });
    });

    let lastY = window.scrollY;
    let scrollFrame = 0;
    function updateNavigation() {
        const y = window.scrollY;
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollProgress) scrollProgress.style.width = `${scrollable > 0 ? (y / scrollable) * 100 : 0}%`;
        navbar?.classList.toggle('scrolled', y > 20);
        if (navbar && y > 160 && Math.abs(y - lastY) > 10) {
            navbar.classList.toggle('nav-hidden', y > lastY);
            lastY = y;
        } else if (y <= 160) {
            navbar?.classList.remove('nav-hidden');
            lastY = y;
        }

        let activeId = '';
        document.querySelectorAll('main section[id]').forEach((section) => {
            if (y >= section.offsetTop - 160) activeId = section.id;
        });
        navLinks?.querySelectorAll('a').forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${activeId}`);
        });
    }
    window.addEventListener('scroll', () => {
        if (scrollFrame) return;
        scrollFrame = requestAnimationFrame(() => { updateNavigation(); scrollFrame = 0; });
    }, { passive: true });
    updateNavigation();

    // Ambient pointer lighting and subtle 3D depth on the profile card.
    if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
        window.addEventListener('pointermove', (event) => {
            if (cursorLight) {
                cursorLight.style.left = `${event.clientX}px`;
                cursorLight.style.top = `${event.clientY}px`;
            }
        }, { passive: true });

        const profileCard = document.querySelector('.profile-card');
        profileCard?.addEventListener('pointermove', (event) => {
            const rect = profileCard.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            profileCard.style.transform = `perspective(1000px) rotateY(${x * 7}deg) rotateX(${y * -6}deg) translateY(-4px)`;
        });
        profileCard?.addEventListener('pointerleave', () => { profileCard.style.transform = ''; });
    }

    // The experience rail fills as the recruiter reads the chronology.
    const timeline = document.querySelector('.timeline');
    const jobs = document.querySelectorAll('.job');
    const jobObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => entry.target.classList.toggle('is-inview', entry.isIntersecting));
    }, { threshold: 0.35 });
    jobs.forEach((job) => jobObserver.observe(job));

    function updateTimeline() {
        if (!timeline) return;
        const rect = timeline.getBoundingClientRect();
        const visibleDistance = window.innerHeight * 0.68 - rect.top;
        const progress = Math.max(0, Math.min(1, visibleDistance / rect.height));
        timeline.style.setProperty('--timeline-progress', progress.toFixed(3));
    }
    window.addEventListener('scroll', updateTimeline, { passive: true });
    window.addEventListener('resize', updateTimeline);
    updateTimeline();

    // Compact cloud deployment simulation. It runs only while visible.
    const deployConsole = document.getElementById('deployConsole');
    const deployTerminal = document.getElementById('deployTerminal');
    let terminalSession = 0;
    const terminalSleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

    async function typeTerminalLine(text, session, speed = 18) {
        if (!deployTerminal) return false;
        for (const character of text) {
            if (session !== terminalSession || document.hidden) return false;
            deployTerminal.textContent += character;
            await terminalSleep(speed);
        }
        deployTerminal.textContent += '\n';
        return true;
    }

    async function runDeploymentTerminal(session) {
        if (!deployTerminal) return;
        const steps = [
            ['javier@cloud:~$ terraform init', 16, 260],
            ['✓ infrastructure initialized', 9, 220],
            ['javier@cloud:~$ docker build -t app:prod .', 12, 260],
            ['[████████████] 100%  image ready', 7, 240],
            ['javier@cloud:~$ aws ecs update-service --force', 10, 300],
            ['✓ deployment completed · status: healthy', 8, 1500]
        ];

        while (session === terminalSession && !document.hidden) {
            deployTerminal.textContent = '';
            for (const [line, speed, pause] of steps) {
                const completed = await typeTerminalLine(line, session, speed);
                if (!completed) return;
                await terminalSleep(pause);
                if (deployTerminal.textContent.split('\n').length > 4) {
                    deployTerminal.textContent = deployTerminal.textContent.split('\n').slice(-3).join('\n');
                }
            }
            await terminalSleep(700);
        }
    }

    if (deployConsole && deployTerminal) {
        if (reducedMotion) {
            deployTerminal.textContent = 'javier@cloud:~$ aws ecs deploy --production\n✓ deployment completed · status: healthy\n';
        } else {
            const terminalObserver = new IntersectionObserver((entries) => {
                const visible = entries[0]?.isIntersecting;
                terminalSession += 1;
                if (visible) runDeploymentTerminal(terminalSession);
            }, { threshold: 0.25 });
            terminalObserver.observe(deployConsole);
        }
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMenu();
            closeCvModal();
        }
    });

    // CV preview modal.
    const cvModal = document.getElementById('cvModal');
    const openCvModalButton = document.getElementById('openCvModal');
    const closeCvModalButton = document.getElementById('closeCvModal');
    const cvFrame = document.getElementById('cvFrame');
    let cvTrigger = null;

    function openCvModal() {
        if (!cvModal) return;
        cvTrigger = document.activeElement;
        if (cvFrame && !cvFrame.hasAttribute('src')) cvFrame.src = cvFrame.dataset.src;
        cvModal.classList.add('is-open');
        cvModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('cv-modal-open');
        window.setTimeout(() => closeCvModalButton?.focus(), 60);
    }

    function closeCvModal() {
        if (!cvModal?.classList.contains('is-open')) return;
        cvModal.classList.remove('is-open');
        cvModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('cv-modal-open');
        cvTrigger?.focus();
    }

    openCvModalButton?.addEventListener('click', openCvModal);
    closeCvModalButton?.addEventListener('click', closeCvModal);
    cvModal?.querySelectorAll('[data-close-cv]').forEach((element) => element.addEventListener('click', closeCvModal));

    // Interactive technology cube.
    const cube = document.getElementById('skillsCube');
    if (cube) {
        const faces = {
            front: [['AWS', 'fab fa-aws'], ['ECS', 'fas fa-cubes'], ['EC2', 'fas fa-server'], ['Lambda', 'fas fa-bolt']],
            back: [['Java', 'fab fa-java'], ['Python', 'fab fa-python'], ['Node.js', 'fab fa-node-js'], ['.NET', 'fab fa-microsoft']],
            right: [['Docker', 'fab fa-docker'], ['Terraform', 'fas fa-cloud'], ['CI/CD', 'fas fa-arrows-rotate'], ['GitHub', 'fab fa-github']],
            left: [['ITIL', 'fas fa-certificate'], ['JIRA', 'fab fa-jira'], ['CMDB', 'fas fa-database'], ['SLA', 'fas fa-gauge-high']],
            top: [['SQL Server', 'fas fa-database'], ['Oracle', 'fas fa-circle-nodes'], ['MySQL', 'fas fa-database'], ['PostgreSQL', 'fas fa-database']],
            bottom: [['Linux', 'fab fa-linux'], ['SAP', 'fas fa-building'], ['REST API', 'fas fa-code'], ['Networks', 'fas fa-network-wired']]
        };

        Object.entries(faces).forEach(([faceName, skills]) => {
            const face = document.createElement('div');
            face.className = `cube-face ${faceName}`;
            skills.forEach(([name, icon]) => {
                const item = document.createElement('div');
                item.className = 'skill-item-cube';
                item.innerHTML = `<span class="skill-icon" aria-hidden="true"><i class="${icon}"></i></span><span class="skill-name">${name}</span>`;
                face.appendChild(item);
            });
            cube.appendChild(face);
        });

        let dragging = false;
        let previousX = 0;
        let previousY = 0;
        let rotateX = -18;
        let rotateY = 24;
        let rotateZ = 0;
        let animationId = 0;
        let previousFrame = 0;

        const renderCube = () => { cube.style.transform = `scale(var(--cube-scale, .94)) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`; };
        const animateCube = (timestamp) => {
            const frameScale = previousFrame ? Math.min((timestamp - previousFrame) / 16.67, 2) : 1;
            previousFrame = timestamp;
            if (!dragging) {
                rotateX += 0.035 * frameScale;
                rotateY += 0.12 * frameScale;
                rotateZ += 0.018 * frameScale;
            }
            renderCube();
            animationId = requestAnimationFrame(animateCube);
        };

        cube.addEventListener('pointerdown', (event) => {
            dragging = true;
            previousX = event.clientX;
            previousY = event.clientY;
            cube.classList.add('dragging');
            cube.setPointerCapture(event.pointerId);
        });
        cube.addEventListener('pointermove', (event) => {
            if (!dragging) return;
            rotateY += (event.clientX - previousX) * 0.45;
            rotateX -= (event.clientY - previousY) * 0.45;
            previousX = event.clientX;
            previousY = event.clientY;
            renderCube();
        });
        const stopDrag = () => { dragging = false; cube.classList.remove('dragging'); };
        cube.addEventListener('pointerup', stopDrag);
        cube.addEventListener('pointercancel', stopDrag);
        renderCube();
        if (!reducedMotion) animationId = requestAnimationFrame(animateCube);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && animationId) {
                cancelAnimationFrame(animationId);
                animationId = 0;
            }
            if (!document.hidden && !reducedMotion && !animationId) {
                previousFrame = 0;
                animationId = requestAnimationFrame(animateCube);
            }
        });
    }

    // Full contact form: prepares every field as a WhatsApp message.
    const whatsappContactForm = document.getElementById('whatsappContactForm');
    const whatsappFormStatus = document.getElementById('whatsappFormStatus');
    whatsappContactForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = new FormData(whatsappContactForm);
        const name = String(data.get('name') || '').trim();
        const email = String(data.get('email') || '').trim();
        const subject = String(data.get('subject') || '').trim();
        const visitorMessage = String(data.get('message') || '').trim();
        const message = [
            'Hola Javier, te contacto desde tu portafolio.',
            '',
            `Nombre: ${name}`,
            `Email: ${email}`,
            `Asunto: ${subject}`,
            '',
            'Mensaje:',
            visitorMessage
        ].join('\n');
        const whatsappUrl = `https://wa.me/522294109754?text=${encodeURIComponent(message)}`;
        const whatsappTab = window.open(whatsappUrl, '_blank');
        if (whatsappTab) whatsappTab.opener = null;
        if (whatsappFormStatus) whatsappFormStatus.textContent = 'WhatsApp abierto con tu mensaje listo para enviar.';
    });

    // WhatsApp contact form. It coordinates with the voice assistant so only one
    // floating dialog is visible at a time.
    const waWidget = document.getElementById('waWidget');
    const waFab = document.getElementById('waFab');
    const waClose = document.getElementById('waClose');
    const waSelect = document.getElementById('waSelect');
    const waTrigger = document.getElementById('waSelectTrigger');
    const waOptions = document.getElementById('waSelectOptions');
    let waReason = 'Oportunidad laboral';

    function closeWhatsApp() {
        waWidget?.classList.remove('open');
        document.getElementById('javi-fab-container')?.classList.remove('javi-fab-container--hidden');
    }

    waFab?.addEventListener('click', () => {
        const willOpen = !waWidget.classList.contains('open');
        const voicePanel = document.getElementById('javi-panel');
        const voiceFab = document.getElementById('javi-fab-container');
        if (willOpen) {
            voicePanel?.classList.remove('javi-panel--open');
            voicePanel?.setAttribute('aria-hidden', 'true');
            voiceFab?.classList.add('javi-fab-container--hidden');
        } else {
            voiceFab?.classList.remove('javi-fab-container--hidden');
        }
        waWidget.classList.toggle('open', willOpen);
    });
    waClose?.addEventListener('click', closeWhatsApp);
    waTrigger?.addEventListener('click', () => waSelect?.classList.toggle('open'));
    waOptions?.querySelectorAll('.wa-select-option').forEach((option) => {
        option.addEventListener('click', () => {
            waReason = option.dataset.value || 'Oportunidad laboral';
            waTrigger.querySelector('span').textContent = waReason;
            waOptions.querySelectorAll('.wa-select-option').forEach((item) => item.classList.remove('wa-select-option--active'));
            option.classList.add('wa-select-option--active');
            waSelect.classList.remove('open');
        });
    });
    document.addEventListener('click', (event) => {
        if (waSelect && !waSelect.contains(event.target)) waSelect.classList.remove('open');
    });
    document.getElementById('waSend')?.addEventListener('click', () => {
        const name = document.getElementById('waName')?.value.trim();
        const company = document.getElementById('waCompany')?.value.trim();
        const note = document.getElementById('waNote')?.value.trim();
        let message = `Hola Javier, soy ${name || 'un reclutador o visitante'}`;
        if (company) message += ` de ${company}`;
        message += `.\n\nMotivo: ${waReason}`;
        if (note) message += `\nContexto: ${note}`;
        window.open(`https://wa.me/522871254233?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
        closeWhatsApp();
    });
})();
