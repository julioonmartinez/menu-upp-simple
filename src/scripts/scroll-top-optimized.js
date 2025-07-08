// Script optimizado para el botón de volver arriba
document.addEventListener('DOMContentLoaded', () => {
  const scrollTop = document.getElementById('scrollTop');
  if (!scrollTop) return;
  
  let isVisible = false;
  let ticking = false;
  
  // Función optimizada para manejar el scroll
  const handleScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const shouldBeVisible = window.scrollY > 300;
        
        // Solo actualizar si el estado cambia
        if (shouldBeVisible !== isVisible) {
          isVisible = shouldBeVisible;
          
          if (isVisible) {
            scrollTop.classList.add('active');
          } else {
            scrollTop.classList.remove('active');
          }
        }
        
        ticking = false;
      });
      
      ticking = true;
    }
  };
  
  // Event listener optimizado
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  // Inicializar estado
  handleScroll();
}); 