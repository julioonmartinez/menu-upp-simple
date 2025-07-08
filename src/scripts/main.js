// Función para activar las animaciones cuando los elementos entran en el viewport
document.addEventListener('DOMContentLoaded', () => {
    // Observer para las animaciones 
    const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .scale-in');
    
    const animationObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('appear');
          // Opcional: dejar de observar el elemento una vez que ha aparecido
          // animationObserver.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -100px 0px',
      threshold: 0.1
    });
    
    animatedElements.forEach(element => {
      animationObserver.observe(element);
    });
    
    // Función optimizada para resaltar el enlace activo en el menú
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    // Cache de las posiciones de las secciones para evitar lecturas repetidas
    let sectionPositions = [];
    let isScrolling = false;
    
    // Función para calcular y cachear las posiciones de las secciones
    const calculateSectionPositions = () => {
      sectionPositions = Array.from(sections).map(section => ({
        id: section.getAttribute('id'),
        top: section.offsetTop,
        height: section.offsetHeight
      }));
    };
    
    // Función optimizada para resaltar navegación
    const highlightNavigation = () => {
      if (isScrolling) return;
      
      isScrolling = true;
      
      requestAnimationFrame(() => {
        const scrollPosition = window.scrollY + 150; // Offset para mejor detección
        
        // Encontrar la sección activa
        let activeSectionId = null;
        
        for (const section of sectionPositions) {
          if (scrollPosition >= section.top && scrollPosition < section.top + section.height) {
            activeSectionId = section.id;
            break;
          }
        }
        
        // Actualizar clases solo si es necesario
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
    
    // Throttled scroll handler para mejor performance
    let scrollTimeout;
    const throttledScrollHandler = () => {
      if (scrollTimeout) return;
      
      scrollTimeout = setTimeout(() => {
        highlightNavigation();
        scrollTimeout = null;
      }, 16); // ~60fps
    };
    
    // Inicializar posiciones de secciones
    calculateSectionPositions();
    
    // Event listeners optimizados
    window.addEventListener('scroll', throttledScrollHandler, { passive: true });
    window.addEventListener('resize', () => {
      // Recalcular posiciones en resize
      calculateSectionPositions();
    }, { passive: true });
    
    // Inicializar al cargar
    highlightNavigation();
  });