// Optimizaciones generales de rendimiento para evitar redistribuciones forzadas
document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Optimizar todos los event listeners de scroll con throttling
  const throttle = (func, limit) => {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  };
  
  // 2. Optimizar lecturas de propiedades del DOM
  const batchDOMReads = (callback) => {
    requestAnimationFrame(() => {
      callback();
    });
  };
  
  // 3. Optimizar todos los scroll listeners existentes
  const optimizeScrollListeners = () => {
    // Buscar todos los elementos que podrían tener scroll listeners
    const scrollableElements = document.querySelectorAll('[data-scroll-optimize]');
    
    scrollableElements.forEach(element => {
      const originalOnScroll = element.onscroll;
      if (originalOnScroll) {
        element.onscroll = throttle(originalOnScroll, 16);
      }
    });
  };
  
  // 4. Optimizar resize listeners
  const optimizeResizeListeners = () => {
    const resizeElements = document.querySelectorAll('[data-resize-optimize]');
    
    resizeElements.forEach(element => {
      const originalOnResize = element.onresize;
      if (originalOnResize) {
        element.onresize = throttle(originalOnResize, 100);
      }
    });
  };
  
  // 5. Prevenir zoom en inputs móviles (evita reflows)
  const preventZoomOnInputs = () => {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      if (input.type !== 'file') {
        input.style.fontSize = '16px';
      }
    });
  };
  
  // 6. Optimizar animaciones CSS
  const optimizeAnimations = () => {
    const animatedElements = document.querySelectorAll('.animate-on-scroll, .fade-in, .slide-in-left, .slide-in-right, .scale-in');
    
    animatedElements.forEach(element => {
      // Asegurar que las animaciones usen transform y opacity
      element.style.willChange = 'transform, opacity';
      
      // Limpiar will-change después de la animación
      element.addEventListener('animationend', () => {
        element.style.willChange = 'auto';
      }, { once: true });
      
      element.addEventListener('transitionend', () => {
        element.style.willChange = 'auto';
      }, { once: true });
    });
  };
  
  // 7. Optimizar imágenes para evitar layout shifts
  const optimizeImages = () => {
    const images = document.querySelectorAll('img[data-optimize]');
    
    images.forEach(img => {
      // Asegurar que las imágenes tengan dimensiones explícitas
      if (!img.style.width && !img.style.height) {
        img.style.width = '100%';
        img.style.height = 'auto';
      }
      
      // Lazy loading nativo
      if (!img.loading) {
        img.loading = 'lazy';
      }
    });
  };
  
  // 8. Optimizar IntersectionObserver para mejor performance
  const createOptimizedObserver = (callback, options = {}) => {
    return new IntersectionObserver((entries) => {
      requestAnimationFrame(() => {
        entries.forEach(callback);
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
      ...options
    });
  };
  
  // 9. Debounce para funciones costosas
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
  
  // 10. Optimizar smooth scrolling
  const optimizeSmoothScrolling = () => {
    const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
    
    smoothScrollLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href !== '#') {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            // Usar scrollIntoView con opciones optimizadas
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
              inline: 'nearest'
            });
          }
        }
      });
    });
  };
  
  // Ejecutar todas las optimizaciones
  const runOptimizations = () => {
    optimizeScrollListeners();
    optimizeResizeListeners();
    preventZoomOnInputs();
    optimizeAnimations();
    optimizeImages();
    optimizeSmoothScrolling();
  };
  
  // Ejecutar optimizaciones iniciales
  runOptimizations();
  
  // Re-ejecutar optimizaciones cuando se añadan elementos dinámicamente
  const observer = new MutationObserver((mutations) => {
    let shouldReoptimize = false;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        shouldReoptimize = true;
      }
    });
    
    if (shouldReoptimize) {
      // Debounce para evitar múltiples ejecuciones
      clearTimeout(window.optimizationTimeout);
      window.optimizationTimeout = setTimeout(runOptimizations, 100);
    }
  });
  
  // Observar cambios en el DOM
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Exponer funciones útiles globalmente
  window.PerformanceOptimizations = {
    throttle,
    debounce,
    batchDOMReads,
    createOptimizedObserver
  };
  
  console.log('🚀 Optimizaciones de rendimiento aplicadas');
}); 