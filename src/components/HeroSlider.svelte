<script>
  export let slides = [
    {
      imageUrl: '/demo/slider1.webp',
      title: 'Digitaliza tu menú en minutos',
      subtitle: 'Crea y comparte tu carta digital fácilmente.'
    },
    {
      imageUrl: '/demo/slider2.webp',
      title: 'Haz tu menú irresistible',
      subtitle: 'Aumenta tus ventas mostrando tus platillos de forma atractiva.'
    },
    {
      imageUrl: '/demo/slider3.webp',
      title: 'Comparte tu menú por WhatsApp',
      subtitle: 'Tus clientes siempre tendrán tu carta a la mano.'
    }
  ];
  let current = 0;
  let interval = null;
  function next() { current = (current + 1) % slides.length; }
  function goTo(i) { current = i; }
  import { onMount, onDestroy } from 'svelte';
  onMount(() => { interval = setInterval(next, 5000); });
  onDestroy(() => { clearInterval(interval); });
</script>
<section class="hero-slider-svelte">
  <div class="slider-img-wrapper">
    {#each slides as slide, i}
      <img src={slide.imageUrl} alt={slide.title} class:active={i === current} class="slider-img" />
    {/each}
    <div class="slider-overlay"></div>
    <div class="slider-content compact">
      <h1>{slides[current].title}</h1>
      <p>{slides[current].subtitle}</p>
      <a href="/login" class="btn btn-primary btn-lg compact-cta">Crea tu menú</a>
    </div>
    <div class="slider-dots compact-dots">
      {#each slides as _, i}
        <button class:active={i === current} on:click={() => goTo(i)} aria-label={`Ir a slide ${i+1}`}></button>
      {/each}
    </div>
  </div>
</section>
<style>
.hero-slider-svelte {
  position: relative;
  width: 100vw;
  min-height: 40vh;
  margin-top: 60px;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.slider-img-wrapper {
  position: relative;
  width: 100vw;
  min-height: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.slider-img {
  position: absolute;
  width: 100vw;
  height: 40vh;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.7s;
  z-index: 1;
}
.slider-img.active {
  opacity: 1;
  z-index: 2;
}
.slider-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(135deg, rgba(13,27,42,0.5) 0%, rgba(255,107,53,0.2) 100%);
  z-index: 3;
}
.slider-content.compact {
  position: absolute;
  top: 50%; left: 50%; transform: translate(-50%, -50%);
  z-index: 4;
  color: var(--text-inverse);
  text-align: center;
  max-width: 90vw;
  padding: 1.2rem 1.2rem 0.5rem 1.2rem;
  background: rgba(0,0,0,0.10);
  border-radius: 1rem;
}
.slider-content.compact h1 {
  font-size: clamp(1.2rem, 4vw, 2.1rem);
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 8px rgba(0,0,0,0.18);
  line-height: 1.1;
}
.slider-content.compact p {
  font-size: clamp(0.95rem, 1.5vw, 1.1rem);
  margin-bottom: 1.1rem;
  color: var(--text-inverse);
  line-height: 1.3;
}
.btn.compact-cta {
  font-size: 1rem;
  padding: 0.5rem 1.2rem;
  border-radius: 0.7rem;
  margin-bottom: 1.2rem;
  margin-top: 0.2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
}
.slider-dots.compact-dots {

  position: absolute;
  bottom: 1.1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 6;
  display: flex;
  gap: 0.7rem;
  justify-content: center;
}
.slider-dots.compact-dots button {
  min-width: 8px;
  width: 8px; height: 8px;
  border-radius: 50%;
  border: none;
  background: var(--bg-accent);
  opacity: 0.6;
  transition: background 0.2s, opacity 0.2s, transform 0.15s;
  cursor: pointer;
}
.slider-dots.compact-dots button.active {
  background: var(--primary-color);
  opacity: 1;
  transform: scale(1.2);
}
.slider-dots.compact-dots button:focus {
  outline: 2px solid var(--primary-color);
}
@media (max-width: 768px) {
  .slider-img, .slider-img-wrapper {
    height: 28vh;
    min-height: 28vh;
  }
  .slider-content.compact {
    padding: 0.7rem 0.5rem 0.3rem 0.5rem;
    border-radius: 0.7rem;
  }
  .slider-content.compact h1 {
    font-size: 1.1rem;
  }
  .btn.compact-cta {
    font-size: 0.95rem;
    padding: 0.4rem 0.9rem;
    border-radius: 0.5rem;
  }
  .slider-dots.compact-dots {
    gap: 0.5rem;
    bottom: 0.7rem;
  }
  .slider-dots.compact-dots button {
    width: 7px; height: 7px;
  }
}
</style> 