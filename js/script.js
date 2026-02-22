function revealText(el, startDelay, stepDelay) {
    const words = el.textContent.split(' ');
    el.textContent = '';
    let charIndex = 0;
    words.forEach((word, wi) => {
        const wordSpan = document.createElement('span');
        wordSpan.style.display = 'inline-block';
        [...word].forEach((char) => {
            const letter = document.createElement('span');
            letter.className = 'reveal-letter';
            letter.textContent = char;
            letter.style.animationDelay = `${startDelay + charIndex * stepDelay}s`;
            wordSpan.appendChild(letter);
            charIndex++;
        });
        el.appendChild(wordSpan);
        if (wi < words.length - 1) {
            const space = document.createElement('span');
            space.className = 'reveal-letter';
            space.textContent = '\u00A0';
            space.style.animationDelay = `${startDelay + charIndex * stepDelay}s`;
            el.appendChild(space);
            charIndex++;
        }
    });
    return charIndex;
}

const heroName = document.getElementById('heroName');
let nameChars = 0;
if (heroName) {
    nameChars = revealText(heroName, 0, 0.06);
}

const heroSubtitle = document.getElementById('heroSubtitle');
if (heroSubtitle) {
    const subtitleDelay = nameChars * 0.06 + 0.4;
    revealText(heroSubtitle, subtitleDelay, 0.03);
}

const particlesContainer = document.getElementById('particles');
if (particlesContainer) {
for (let i = 0; i < 50; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%'; // distribución inicial
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
let rotationX = -20; // posición inicial
let rotationY = 25;
let velocityX = 0;
let velocityY = 0;
let inertiaFrame = null;

function applyCubeTransform() {
  skillsCube.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
}

applyCubeTransform();

// Inercia suave al soltar
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

//  pointerdown
skillsCube.addEventListener('pointerdown', (e) => {
  isDragging = true;

  // Sincroniza con el ángulo actual visible antes de arrastrar
const currentTransform = getComputedStyle(skillsCube).transform;
if (currentTransform && currentTransform !== 'none') {
  const values = currentTransform.match(/matrix3d\((.+)\)/);
  if (values) {
    const m = values[1].split(',').map(v => parseFloat(v.trim()));
    rotationY = Math.atan2(m[0], m[2]) * (180 / Math.PI);
    rotationX = Math.atan2(m[9], m[10]) * (180 / Math.PI);
  }
}
    prevX = e.clientX;
    prevY = e.clientY;

  skillsCube.classList.add('dragging');
  skillsCube.classList.add('paused'); 

  cancelAnimationFrame(inertiaFrame);

  skillsCube.setPointerCapture(e.pointerId);

  e.preventDefault();
});

// pointermove
skillsCube.addEventListener('pointermove', (e) => {
  if (!isDragging) return;

  const dx = e.clientX - prevX;
  const dy = e.clientY - prevY;

  rotationY += dx * 0.5;
  rotationX -= dy * 0.5;

  velocityX = dx * 0.09;
  velocityY = dy * 0.09;

  applyCubeTransform();

  prevX = e.clientX;
  prevY = e.clientY;

  e.preventDefault();
});

//  pointerup
skillsCube.addEventListener('pointerup', () => {
  isDragging = false;
    skillsCube.style.setProperty('--rx', `${rotationX}deg`);
    skillsCube.style.setProperty('--ry', `${rotationY}deg`);

  skillsCube.classList.remove('paused');
  skillsCube.classList.remove('dragging');

});

}skillsCube.addEventListener('pointercancel', () => {
  isDragging = false;
  skillsCube.classList.remove('paused');
  startInertia();
});




// Project Modal
const modal = document.getElementById('projectModal');
const closeModal = document.getElementById('closeModal');
const projectIframe = document.getElementById('projectIframe');
const modalOpenTab = document.getElementById('modalOpenTab');
const projectButtons = document.querySelectorAll('.project-detail-btn');

projectButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = btn.getAttribute('data-url');
        projectIframe.src = url;
        modalOpenTab.href = url;
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

// Projects Sidebar Interaction (assandev style)
const sidebarCards = document.querySelectorAll('.projects-sidebar__card');
const bentoCards = document.querySelectorAll('.projects-bento__card');

function setActiveProject(projectId) {
    sidebarCards.forEach(card => {
        card.classList.toggle('projects-sidebar__card--active', card.dataset.project === projectId);
    });
    bentoCards.forEach(card => {
        card.classList.toggle('projects-bento__card--active', card.dataset.project === projectId);
    });
}

sidebarCards.forEach(card => {
    card.addEventListener('click', () => {
        setActiveProject(card.dataset.project);
    });
});

bentoCards.forEach(card => {
    card.addEventListener('click', (e) => {
        if (e.target.closest('.project-detail-btn')) return;
        setActiveProject(card.dataset.project);
    });
});


// Services Carousel (4-card pages)
(() => {
    const track = document.getElementById('svcTrack');
    const pages = track.querySelectorAll('.svc-page');
    const prevArrow = document.getElementById('svcPrev');
    const nextArrow = document.getElementById('svcNext');
    const dotsBox = document.getElementById('svcDots');
    let svcIndex = 0;
    let svcAutoPlay;

    // Create dots for each page
    pages.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'svc-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Página ${i + 1}`);
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

const carousel = document.getElementById('storeCarousel');
const carouselContainer = document.querySelector('.store-carousel-container');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dotsContainer = document.getElementById('carouselDots');
const slides = carousel.querySelectorAll('.store-slide');
let currentSlide = 0;
let autoPlayInterval;

// Drag/Swipe variables
let isDraggingCarousel = false;
let startPos = 0;
let currentTranslate = 0;
let prevTranslate = 0;
let animationID = 0;

// Create dots
slides.forEach((_, index) => {
  const dot = document.createElement('div');
  dot.className = 'dot' + (index === 0 ? ' active' : '');
  dot.addEventListener('click', () => goToSlide(index));
  dotsContainer.appendChild(dot);
});

function updateCarousel(smooth = true) {
  if (smooth) {
    carousel.style.transition = 'transform 0.5s ease-in-out';
  }
  carousel.style.transform = `translateX(-${currentSlide * 100}%)`;
  document.querySelectorAll('.dot').forEach((dot, index) => {
    dot.classList.toggle('active', index === currentSlide);
  });
}

function goToSlide(index) {
  currentSlide = index;
  updateCarousel();
  resetAutoPlay();
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % slides.length;
  updateCarousel();
}

function prevSlide() {
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  updateCarousel();
}

prevBtn.addEventListener('click', () => {
  prevSlide();
  resetAutoPlay();
});

nextBtn.addEventListener('click', () => {
  nextSlide();
  resetAutoPlay();
});

// Mouse Drag Events
carouselContainer.addEventListener('mousedown', dragStart);
carouselContainer.addEventListener('mousemove', drag);
carouselContainer.addEventListener('mouseup', dragEnd);
carouselContainer.addEventListener('mouseleave', dragEnd);

// Touch Events
carouselContainer.addEventListener('touchstart', dragStart, { passive: true });
carouselContainer.addEventListener('touchmove', drag, { passive: false });
carouselContainer.addEventListener('touchend', dragEnd);

function dragStart(event) {
  isDraggingCarousel = true;
  startPos = getPositionX(event);
  animationID = requestAnimationFrame(animation);
  carouselContainer.classList.add('dragging');
  clearInterval(autoPlayInterval);
}

function drag(event) {
  if (!isDraggingCarousel) return;

  const currentPosition = getPositionX(event);
  currentTranslate = prevTranslate + currentPosition - startPos;

  const maxTranslate = 0;
  const minTranslate = -(slides.length - 1) * carouselContainer.offsetWidth;

  if (currentTranslate > maxTranslate) {
    currentTranslate = maxTranslate + (currentTranslate - maxTranslate) * 0.3;
  } else if (currentTranslate < minTranslate) {
    currentTranslate = minTranslate + (currentTranslate - minTranslate) * 0.3;
  }
}

function dragEnd() {
  if (!isDraggingCarousel) return;

  isDraggingCarousel = false;
  cancelAnimationFrame(animationID);
  carouselContainer.classList.remove('dragging');

  const movedBy = currentTranslate - prevTranslate;
  const threshold = carouselContainer.offsetWidth * 0.2; // 20% threshold

  if (movedBy < -threshold && currentSlide < slides.length - 1) {
    currentSlide += 1;
  } else if (movedBy > threshold && currentSlide > 0) {
    currentSlide -= 1;
  }

  setPositionByIndex();
  resetAutoPlay();
}

function getPositionX(event) {
  return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
}

function animation() {
  setSliderPosition();
  if (isDraggingCarousel) requestAnimationFrame(animation);
}

function setSliderPosition() {
  carousel.style.transition = 'none';
  carousel.style.transform = `translateX(${currentTranslate}px)`;
}

function setPositionByIndex() {
  currentTranslate = currentSlide * -carouselContainer.offsetWidth;
  prevTranslate = currentTranslate;
  updateCarousel();
}

function resetAutoPlay() {
  clearInterval(autoPlayInterval);
  autoPlayInterval = setInterval(() => {
    nextSlide();
  }, 5000);
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') {
    prevSlide();
    resetAutoPlay();
  } else if (e.key === 'ArrowRight') {
    nextSlide();
    resetAutoPlay();
  }
});

// Initialize
setPositionByIndex();
resetAutoPlay();

// Pause on hover
carouselContainer.addEventListener('mouseenter', () => {
  clearInterval(autoPlayInterval);
});

carouselContainer.addEventListener('mouseleave', () => {
  if (!isDraggingCarousel) {
    resetAutoPlay();
  }
});


const statCounterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const text = el.textContent.trim();
            const match = text.match(/^(\d+)(.*)$/);
            if (match) {
                const target = parseInt(match[1]);
                const suffix = match[2];
                const duration = 2000;
                const start = performance.now();
                el.textContent = '0' + suffix;
                function update(now) {
                    const elapsed = now - start;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    const current = Math.round(target * eased);
                    el.textContent = current + suffix;
                    if (progress < 1) requestAnimationFrame(update);
                }
                requestAnimationFrame(update);
            }
            statCounterObserver.unobserve(el);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number').forEach(el => {
    statCounterObserver.observe(el);
});

// Skill cards staggered slide-in
const skillsGrid = document.querySelector('.skills-grid');
if (skillsGrid) {
    const skillSlideObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const cards = skillsGrid.querySelectorAll('.skill-card.slide-in');
                cards.forEach((card, i) => {
                    setTimeout(() => {
                        card.classList.add('visible');
                    }, i * 200);
                });
                skillSlideObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    skillSlideObserver.observe(skillsGrid);
}

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

const scrollRevealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            scrollRevealObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.15,
    rootMargin: '0px 0px -60px 0px'
});

document.querySelectorAll('.section-title, .skill-card, .projects-bento__card, .fade-in, .stat-card, .experience-content, .booking-container, .contact-item').forEach(el => {
    scrollRevealObserver.observe(el);
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
(() => {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  let lastScrollY = window.scrollY;
  let ticking = false;

  function onScroll() {
    const currentY = window.scrollY;

    // Visible solo en parte de arriba
    if (currentY < 50) {
      navbar.classList.remove('nav-hidden');
      lastScrollY = currentY;
      return;
    }

    // Umbral para que no parpadee
    const diff = currentY - lastScrollY;

    if (Math.abs(diff) > 8) {
      if (diff > 0) {
        // bajando
        navbar.classList.add('nav-hidden');
      } else {
        // subiendo
        navbar.classList.remove('nav-hidden');
      }
      lastScrollY = currentY;
    }
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        onScroll();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();
