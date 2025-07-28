// Script optimizado para Menu-Upp
document.addEventListener('DOMContentLoaded', () => {
  // Observer optimizado para animaciones
  const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in');
  
  if (animatedElements.length > 0) {
    const animationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('appear');
        }
      });
    }, {
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.1
    });
    
    animatedElements.forEach(element => {
      animationObserver.observe(element);
    });
  }
  
  // Navegación optimizada
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  
  if (sections.length > 0 && navLinks.length > 0) {
    let sectionPositions = [];
    let isScrolling = false;
    
    const calculateSectionPositions = () => {
      sectionPositions = Array.from(sections).map(section => ({
        id: section.getAttribute('id'),
        top: section.offsetTop,
        height: section.offsetHeight
      }));
    };
    
    const highlightNavigation = () => {
      if (isScrolling) return;
      
      isScrolling = true;
      
      requestAnimationFrame(() => {
        const scrollPosition = window.scrollY + 100;
        
        let activeSectionId = null;
        
        for (const section of sectionPositions) {
          if (scrollPosition >= section.top && scrollPosition < section.top + section.height) {
            activeSectionId = section.id;
            break;
          }
        }
        
        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          const isActive = href === `#${activeSectionId}`;
          
          if (isActive && !link.classList.contains('active')) {
            link.classList.add('active');
          } else if (!isActive && link.classList.contains('active')) {
            link.classList.remove('active');
          }
        });
        
        isScrolling = false;
      });
    };
    
    // Throttled scroll handler
    let scrollTimeout;
    const throttledScrollHandler = () => {
      if (scrollTimeout) return;
      
      scrollTimeout = setTimeout(() => {
        highlightNavigation();
        scrollTimeout = null;
      }, 16);
    };
    
    // Inicializar
    calculateSectionPositions();
    window.addEventListener('scroll', throttledScrollHandler, { passive: true });
    window.addEventListener('resize', calculateSectionPositions, { passive: true });
    highlightNavigation();
  }
  
  // Smooth scrolling optimizado
  const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
  
  smoothScrollLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href !== '#') {
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
  
  // Header scroll effect
  const header = document.querySelector('.header');
  if (header) {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state
  }
  
  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const sidenav = document.getElementById('sidenav');
  const closeSidenav = document.getElementById('closeSidenav');
  const sidenavOverlay = document.getElementById('sidenavOverlay');
  
  if (mobileToggle && sidenav) {
    mobileToggle.addEventListener('click', () => {
      sidenav.classList.add('active');
    });
    
    const closeMenu = () => {
      sidenav.classList.remove('active');
    };
    
    if (closeSidenav) closeSidenav.addEventListener('click', closeMenu);
    if (sidenavOverlay) sidenavOverlay.addEventListener('click', closeMenu);
  }
});