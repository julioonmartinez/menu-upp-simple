// Script optimizado para manejar el menú lateral y el cambio de apariencia del header al hacer scroll
document.addEventListener('DOMContentLoaded', () => {
  const header = document.getElementById('header');
  const mobileToggle = document.getElementById('mobileToggle');
  const sidenav = document.getElementById('sidenav');
  const closeSidenav = document.getElementById('closeSidenav');
  const sidenavOverlay = document.getElementById('sidenavOverlay');
  const navLinks = document.querySelectorAll('.nav-links a');
  
  // Verificar que todos los elementos necesarios existen
  if (!header || !mobileToggle || !sidenav || !closeSidenav || !sidenavOverlay) {
    console.warn('Algunos elementos del header no se encontraron');
    return;
  }
  
  // Variables para optimización de scroll
  let isScrolled = false;
  let ticking = false;
  
  // Función para abrir el menú lateral
  const openSidenav = () => {
    sidenav.classList.add('active');
    document.body.classList.add('sidenav-open');
  };
  
  // Función para cerrar el menú lateral
  const closeSidenavFunc = () => {
    sidenav.classList.remove('active');
    document.body.classList.remove('sidenav-open');
  };
  
  // Toggle menú lateral
  mobileToggle.addEventListener('click', openSidenav);
  closeSidenav.addEventListener('click', closeSidenavFunc);
  sidenavOverlay.addEventListener('click', closeSidenavFunc);
  
  // Función optimizada para manejar el scroll del header
  const handleHeaderScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const shouldBeScrolled = window.scrollY > 50;
        
        // Solo actualizar si el estado cambia
        if (shouldBeScrolled !== isScrolled) {
          isScrolled = shouldBeScrolled;
          
          if (isScrolled) {
            header.classList.add('scrolled');
          } else {
            header.classList.remove('scrolled');
          }
        }
        
        ticking = false;
      });
      
      ticking = true;
    }
  };
  
  // Event listener optimizado para scroll
  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  
  // Cerrar menú lateral al hacer clic en un enlace
  navLinks.forEach(link => {
    link.addEventListener('click', closeSidenavFunc);
  });
  
  // Función optimizada para manejar el tamaño de pantalla
  let lastWidth = window.innerWidth;
  const checkScreenSize = () => {
    const currentWidth = window.innerWidth;
    
    // Solo ejecutar si el ancho cambió significativamente
    if (Math.abs(currentWidth - lastWidth) < 50) return;
    
    lastWidth = currentWidth;
    
    if (currentWidth >= 992) {
      // Si es pantalla grande, añadir el nav al header
      if (document.querySelector('.header .nav') === null) {
        const sidenavNav = document.querySelector('.sidenav .nav');
        const containerNav = document.querySelector('.header .container-nav');
        
        if (sidenavNav && containerNav) {
          const navClone = sidenavNav.cloneNode(true);
          containerNav.appendChild(navClone);
          
          // Añadir event listeners a los enlaces del nav clonado
          const headerNavLinks = document.querySelectorAll('.header .nav-links a');
          headerNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
              e.preventDefault();
              const href = link.getAttribute('href');
              if (href) {
                const target = document.querySelector(href);
                if (target) {
                  target.scrollIntoView({ behavior: 'smooth' });
                }
              }
            });
          });
        }
      }
    } else {
      // Si es pantalla pequeña, eliminar el nav del header si existe
      const headerNav = document.querySelector('.header .nav');
      if (headerNav !== null) {
        headerNav.remove();
      }
    }
  };
  
  // Comprobar tamaño de pantalla al cargar y al redimensionar
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize, { passive: true });
  
  // Inicializar estado del header
  handleHeaderScroll();
}); 