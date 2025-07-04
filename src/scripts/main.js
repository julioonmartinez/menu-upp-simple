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
    
    // Función para resaltar el enlace activo en el menú
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    const highlightNavigation = () => {
      let scrollPosition = window.scrollY + 150; // Offset para mejor detección
      
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
              link.classList.add('active');
            }
          });
        }
      });
    };
    
    window.addEventListener('scroll', highlightNavigation);
    highlightNavigation(); // Inicializar al cargar
  });