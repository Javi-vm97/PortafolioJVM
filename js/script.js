// Particles animation
const particlesContainer = document.getElementById('particles');
if (particlesContainer) {
for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%'; // mejor distribución inicial
    particle.style.animationDelay = Math.random() * 15 + 's';
    particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
    particlesContainer.appendChild(particle);
}
}


// 3D Profile image effect
const profile3d = document.getElementById('profile3d');

if (profile3d) {
  profile3d.addEventListener('mousemove', (e) => {
    const rect = profile3d.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;

    profile3d.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  profile3d.addEventListener('mouseleave', () => {
    profile3d.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
  });
}

// 3D Skills Cube
const skillsCube = document.getElementById('skillsCube');

if (skillsCube) {
const skills = {
    front: [
        { name: 'HTML', icon: '🌐', color: '#e34c26' },
        { name: 'CSS', icon: '🎨', color: '#264de4' },
        { name: 'JavaScript', icon: '⚡', color: '#f0db4f' },
        { name: 'React', icon: '⚛️', color: '#61dafb' }
    ],
    back: [
        { name: 'Node.js', icon: '🟢', color: '#68a063' },
        { name: '.Net', icon: '🚀', color: '#ffffff' },
        { name: 'Lavarel', icon: '🔌', color: '#00d4ff' },
        { name: 'Microservices', icon: '🔷', color: '#a855f7' }
    ],
    right: [
        { name: 'AWS', icon: '☁️', color: '#ff9900' },
        { name: 'Docker', icon: '🐳', color: '#0db7ed' },
        { name: 'CI/CD', icon: '🔄', color: '#00ff88' },
        { name: 'GitHub', icon: '🤖', color: '#2088ff' }
    ],
    left: [
        { name: 'UI/UX', icon: '✨', color: '#ff6b6b' },
        { name: 'Responsive', icon: '📱', color: '#4ecdc4' },
        { name: 'Testing', icon: '🧪', color: '#95e1d3' },
        { name: 'Security', icon: '🔒', color: '#f38181' }
    ],
    top: [
        { name: 'MYSQL', icon: '🍃', color: '#47a248' },
        { name: 'PostgreSQL', icon: '🐘', color: '#336791' },
        { name: 'Oracle', icon: '💾', color: '#dc382d' },
        { name: 'Aurora', icon: '💗', color: '#e10098' }
    ],
    bottom: [
        { name: 'Git', icon: '📦', color: '#f05032' },
        { name: 'Linux', icon: '🐧', color: '#fcc624' },
        { name: 'Cloud', icon: '💚', color: '#009639' },
        { name: 'Monitoring', icon: '⚙️', color: '#326ce5' }
    ]
};

Object.keys(skills).forEach(face => {
    const faceEl = document.createElement('div');
    faceEl.className = `cube-face ${face}`;

    skills[face].forEach(skill => {
        const skillEl = document.createElement('div');
        skillEl.className = 'skill-item-cube';
        skillEl.innerHTML = `
            <div class="skill-icon" style="color: ${skill.color}">${skill.icon}</div>
            <div class="skill-name">${skill.name}</div>
        `;
        faceEl.appendChild(skillEl);
    });

    skillsCube.appendChild(faceEl);
});



// Cube drag controls (Mouse + Touch con Pointer Events) 
let isDragging = false;
let prevX = 0;
let prevY = 0;
let rotationX = -20; // posición inicial bonita
let rotationY = 25;
let velocityX = 0;
let velocityY = 0;
let inertiaFrame = null;

function applyCubeTransform() {
  skillsCube.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
}

applyCubeTransform();

// Inercia suave al soltar (opcional)
function startInertia() {
  cancelAnimationFrame(inertiaFrame);

  const friction = 0.95;
  const stopThreshold = 0.05;

  const animate = () => {
    rotationY += velocityX;
    rotationX -= velocityY;

    velocityX *= friction;
    velocityY *= friction;

    applyCubeTransform();

    if (Math.abs(velocityX) > stopThreshold || Math.abs(velocityY) > stopThreshold) {
      inertiaFrame = requestAnimationFrame(animate);
    }
  };

  inertiaFrame = requestAnimationFrame(animate);
}

// ✅ pointerdown
skillsCube.addEventListener('pointerdown', (e) => {
  isDragging = true;

  // ✅ Sincroniza con el ángulo actual visible antes de arrastrar
const currentTransform = getComputedStyle(skillsCube).transform;
if (currentTransform && currentTransform !== 'none') {
  const values = currentTransform.match(/matrix3d\((.+)\)/);
  if (values) {
    const m = values[1].split(',').map(v => parseFloat(v.trim()));
    // Aproximación de ángulos desde matrix3d
    rotationY = Math.atan2(m[0], m[2]) * (180 / Math.PI);
    rotationX = Math.atan2(m[9], m[10]) * (180 / Math.PI);
  }
}
    prevX = e.clientX;
    prevY = e.clientY;

  // ✅ mata la animación CSS mientras el usuario arrastra
  skillsCube.classList.add('dragging');
  skillsCube.classList.add('paused'); // si quieres mantener tu lógica existente

  cancelAnimationFrame(inertiaFrame);

  // ✅ captura el pointer
  skillsCube.setPointerCapture(e.pointerId);

  e.preventDefault();
});

// ✅ pointermove
skillsCube.addEventListener('pointermove', (e) => {
  if (!isDragging) return;

  const dx = e.clientX - prevX;
  const dy = e.clientY - prevY;

  rotationY += dx * 0.4;
  rotationX -= dy * 0.4;

  // ✅ velocidad para inercia
  velocityX = dx * 0.08;
  velocityY = dy * 0.08;

  applyCubeTransform();

  prevX = e.clientX;
  prevY = e.clientY;

  e.preventDefault();
});

// ✅ pointerup
skillsCube.addEventListener('pointerup', () => {
  isDragging = false;
    // ✅ guarda la posición final como nuevo "inicio" de la animación
    skillsCube.style.setProperty('--rx', `${rotationX}deg`);
    skillsCube.style.setProperty('--ry', `${rotationY}deg`);

  // ✅ vuelve a permitir animación automática (si la quieres)
  skillsCube.classList.remove('paused');
  skillsCube.classList.remove('dragging');

  //startInertia();
});

// ✅ pointercancel
skillsCube.addEventListener('pointercancel', () => {
  isDragging = false;
  skillsCube.classList.remove('paused');
  // skillsCube.classList.remove('dragging');
  startInertia();
});


}

// Project Modal
const modal = document.getElementById('projectModal');
const closeModal = document.getElementById('closeModal');
const projectIframe = document.getElementById('projectIframe');
const projectButtons = document.querySelectorAll('.project-detail-btn');

projectButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const url = btn.getAttribute('data-url');
        projectIframe.src = url;
        modal.classList.add('active');
    });
});

closeModal.addEventListener('click', () => {
    modal.classList.remove('active');
    projectIframe.src = '';
});

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('active');
        projectIframe.src = '';
    }
});

// Store Carousel
const carousel = document.getElementById('storeCarousel');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dotsContainer = document.getElementById('carouselDots');
const slides = carousel.querySelectorAll('.store-slide');
let currentSlide = 0;

// Create dots
slides.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.className = 'dot' + (index === 0 ? ' active' : '');
    dot.addEventListener('click', () => goToSlide(index));
    dotsContainer.appendChild(dot);
});

function updateCarousel() {
    carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
    document.querySelectorAll('.dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

function goToSlide(index) {
    currentSlide = index;
    updateCarousel();
}

prevBtn.addEventListener('click', () => {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateCarousel();
});

nextBtn.addEventListener('click', () => {
    currentSlide = (currentSlide + 1) % slides.length;
    updateCarousel();
});

// Auto advance carousel
setInterval(() => {
    currentSlide = (currentSlide + 1) % slides.length;
    updateCarousel();
}, 5000);

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Intersection Observer
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

document.querySelectorAll('.fade-in, .skill-card, .project-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
    observer.observe(el);
});

// Active nav link on scroll
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    let current = '';
    document.querySelectorAll('section').forEach(section => {
        const sectionTop = section.offsetTop;
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});
