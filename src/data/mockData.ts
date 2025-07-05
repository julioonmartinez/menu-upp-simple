// src/data/mockData.ts
import type { Restaurant, LinkTree, LinkType } from '../interfaces';

export const mockRestaurant: Restaurant = {
  id: "rest-001",
  name: "La Bella Vita",
  username: "labellavita",
  description: "Auténtica cocina italiana en el corazón de la ciudad",
  isPremium: true,
  
  address: "Calle Roma 123, Ciudad de México",
  phone: "+52 55 1234 5678",
  email: "hola@labellavita.com",
  website: "https://labellavita.com",
  
  schedule: "Lun-Dom: 12:00 - 22:00",
  
  logo: "/images/restaurants/labellavita/logo.webp",
  imageProfile: "/images/restaurants/labellavita/profile.webp",
  imageCover: "/images/restaurants/labellavita/cover.webp",
  primaryColor: "#D32F2F",
  secondaryColor: "#388E3C",
  
  socialLinks: {
    instagram: "https://instagram.com/labellavita",
    facebook: "https://facebook.com/labellavita",
    whatsapp: "5551234567",
    twitter: "https://twitter.com/labellavita"
  },
  
  features: ["delivery", "takeaway", "outdoor_seating"],
  cuisineType: ["italiana", "mediterranea"],
  paymentMethods: ["efectivo", "tarjeta", "online"],
  priceRange: "medium",
  
  active: true,
  planType: "premium"
};

export const mockLinkTree: LinkTree = {
  id: "linktree-001",
  restaurantId: "rest-001",
  title: "La Bella Vita",
  description: "Descubre nuestra auténtica cocina italiana",
  
  profileImage: {
    url: "/images/restaurants/labellavita/logo.webp",
    width: 400,
    height: 400,
    format: "webp"
  },
  coverImage: {
    url: "/images/restaurants/labellavita/cover.webp",
    width: 1200,
    height: 600,
    format: "webp"
  },
  
  backgroundColor: "#FFF8F0",
  linksBackgroundColor: "#FFFFFF",
  linksColor: "#2C2C2C",
  socialMediaBackgroundColor: "#D32F2F",
  socialMediaTextColor: "#FFFFFF",
  textColor: "#2C2C2C",
  buttonStyle: "rounded",
  theme: "light",
  ctaBackgroundColor: "#D32F2F",
  ctaTextColor: "#FFFFFF",
  
  links: [
    {
      id: "link-001",
      title: "Ver nuestro menú",
      url: "/labellavita/menu",
      icon: "menu",
      description: "Descubre nuestros platillos auténticos",
      type: "menu" as LinkType,
      order: 1,
      active: true,
      analytics: { clicks: 245 }
    },
    {
      id: "link-002",
      title: "Hacer reservación",
      url: "https://reservas.labellavita.com",
      icon: "calendar",
      description: "Reserva tu mesa ahora",
      type: "website" as LinkType,
      order: 2,
      active: true,
      analytics: { clicks: 189 }
    },
    {
      id: "link-003",
      title: "Pedir a domicilio",
      url: "https://delivery.labellavita.com",
      icon: "delivery",
      description: "Disfruta en casa",
      type: "store" as LinkType,
      order: 3,
      active: true,
      analytics: { clicks: 312 }
    },
    {
      id: "link-004",
      title: "Nuestros eventos",
      url: "https://eventos.labellavita.com",
      icon: "event",
      description: "Celebra con nosotros",
      type: "website" as LinkType,
      order: 4,
      active: true,
      analytics: { clicks: 67 }
    },
    {
      id: "link-005",
      title: "Galería de fotos",
      url: "https://galeria.labellavita.com",
      icon: "gallery",
      description: "Conoce nuestro ambiente",
      type: "custom" as LinkType,
      order: 5,
      active: true,
      analytics: { clicks: 134 }
    }
  ],
  
  isPublic: true,
  customSlug: "labellavita",
  
  analytics: {
    totalVisits: 1247,
    totalClicks: 947,
    uniqueVisitors: 892
  }
};

// Restaurante Tacos El Rey
const mockTacosElRey: Restaurant = {
  id: "rest-002",
  name: "Tacos El Rey",
  username: "tacos_el_rey",
  description: "Los mejores tacos de la ciudad desde 1985",
  isPremium: false,
  
  address: "Av. Revolución 456, Col. Del Valle, CDMX",
  phone: "+52 55 9876 5432",
  email: "contacto@tacoselrey.mx",
  website: "https://tacoselrey.mx",
  
  schedule: "Lun-Sáb: 10:00 - 23:00, Dom: 10:00 - 21:00",
  
  logo: "/images/restaurants/tacoselrey/logo.webp",
  imageCover: "/images/restaurants/tacoselrey/cover.webp",
  primaryColor: "#FF6B35",
  secondaryColor: "#F7931E",
  
  socialLinks: {
    instagram: "https://instagram.com/tacoselrey",
    facebook: "https://facebook.com/tacoselrey",
    whatsapp: "5559876543",
    tiktok: "https://tiktok.com/@tacoselrey"
  },
  
  features: ["takeaway", "delivery", "outdoor_seating"],
  cuisineType: ["mexicana", "tradicional", "street food"],
  paymentMethods: ["efectivo", "tarjeta"],
  priceRange: "low",
  
  active: true,
  planType: "basic"
};

const mockTacosElReyLinkTree: LinkTree = {
  id: "linktree-002",
  restaurantId: "rest-002",
  title: "Tacos El Rey",
  description: "Tradición familiar desde 1985",
  
  profileImage: {
    url: "/images/restaurants/tacoselrey/logo.webp",
    width: 400,
    height: 400,
    format: "webp"
  },
  coverImage: {
    url: "/images/restaurants/tacoselrey/cover.webp",
    width: 1200,
    height: 600,
    format: "webp"
  },
  
  backgroundColor: "#FFF5E6",
  linksBackgroundColor: "#FFFFFF",
  linksColor: "#2C2C2C",
  socialMediaBackgroundColor: "#FF6B35",
  socialMediaTextColor: "#FFFFFF",
  textColor: "#2C2C2C",
  buttonStyle: "rounded",
  theme: "light",
  ctaBackgroundColor: "#FF6B35",
  ctaTextColor: "#FFFFFF",
  
  links: [
    {
      id: "link-taco-001",
      title: "Ver nuestra carta",
      url: "/tacoselrey/menu",
      icon: "menu",
      description: "Tacos tradicionales y especialidades",
      type: "menu" as LinkType,
      order: 1,
      active: true,
      analytics: { clicks: 324 }
    },
    {
      id: "link-taco-002",
      title: "Pedir en línea",
      url: "https://pedidos.tacoselrey.mx",
      icon: "delivery",
      description: "Delivery y para llevar",
      type: "store" as LinkType,
      order: 2,
      active: true,
      analytics: { clicks: 456 }
    },
    {
      id: "link-taco-003",
      title: "Promociones del día",
      url: "https://tacoselrey.mx/promociones",
      icon: "event",
      description: "Ofertas especiales diarias",
      type: "website" as LinkType,
      order: 3,
      active: true,
      analytics: { clicks: 198 }
    },
    {
      id: "link-taco-004",
      title: "Ubicaciones",
      url: "https://tacoselrey.mx/sucursales",
      icon: "location",
      description: "Encuentra la sucursal más cercana",
      type: "website" as LinkType,
      order: 4,
      active: true,
      analytics: { clicks: 89 }
    }
  ],
  
  isPublic: true,
  customSlug: "tacoselrey",
  
  analytics: {
    totalVisits: 2156,
    totalClicks: 1067,
    uniqueVisitors: 1834
  }
};

// Restaurante Sushi Zen
const mockSushiZen: Restaurant = {
  id: "rest-003",
  name: "Sushi Zen",
  username: "sushi_zen",
  description: "Experiencia gastronómica japonesa auténtica",
  isPremium: true,
  
  address: "Polanco, Av. Presidente Masaryk 234, CDMX",
  phone: "+52 55 2468 1357",
  email: "reservas@sushizen.com.mx",
  website: "https://sushizen.com.mx",
  
  schedule: "Mar-Dom: 13:00 - 23:00, Lun: Cerrado",
  
  logo: "/images/restaurants/sushizen/logo.webp",
  imageCover: "/images/restaurants/sushizen/cover.webp",
  primaryColor: "#1976D2",
  secondaryColor: "#388E3C",
  
  socialLinks: {
    instagram: "https://instagram.com/sushizen_mx",
    facebook: "https://facebook.com/sushizen",
    whatsapp: "5552468135",
    youtube: "https://youtube.com/@sushizen"
  },
  
  features: ["delivery", "takeaway", "outdoor_seating", "private_dining"],
  cuisineType: ["japonesa", "sushi", "sashimi", "premium"],
  paymentMethods: ["efectivo", "tarjeta", "online", "amex"],
  priceRange: "high",
  
  active: true,
  planType: "premium"
};

const mockSushiZenLinkTree: LinkTree = {
  id: "linktree-003",
  restaurantId: "rest-003",
  title: "Sushi Zen",
  description: "Arte culinario japonés",
  
  profileImage: {
    url: "/images/restaurants/sushizen/logo.webp",
    width: 400,
    height: 400,
    format: "webp"
  },
  coverImage: {
    url: "/images/restaurants/sushizen/cover.webp",
    width: 1200,
    height: 600,
    format: "webp"
  },
  
  backgroundColor: "#F3F8FF",
  linksBackgroundColor: "#FFFFFF",
  linksColor: "#2C2C2C",
  socialMediaBackgroundColor: "#1976D2",
  socialMediaTextColor: "#FFFFFF",
  textColor: "#2C2C2C",
  buttonStyle: "rounded",
  theme: "light",
  ctaBackgroundColor: "#1976D2",
  ctaTextColor: "#FFFFFF",
  
  links: [
    {
      id: "link-sushi-001",
      title: "Carta Omakase",
      url: "/sushizen/menu",
      icon: "menu",
      description: "Experiencia culinaria dirigida por el chef",
      type: "menu" as LinkType,
      order: 1,
      active: true,
      analytics: { clicks: 178 }
    },
    {
      id: "link-sushi-002",
      title: "Reservar mesa",
      url: "https://reservas.sushizen.com.mx",
      icon: "calendar",
      description: "Mesa para experiencia completa",
      type: "website" as LinkType,
      order: 2,
      active: true,
      analytics: { clicks: 289 }
    },
    {
      id: "link-sushi-003",
      title: "Eventos privados",
      url: "https://sushizen.com.mx/eventos",
      icon: "event",
      description: "Celebraciones especiales",
      type: "website" as LinkType,
      order: 3,
      active: true,
      analytics: { clicks: 145 }
    },
    {
      id: "link-sushi-004",
      title: "Maridajes de sake",
      url: "https://sushizen.com.mx/sake",
      icon: "wine",
      description: "Cata de sakes premium",
      type: "custom" as LinkType,
      order: 4,
      active: true,
      analytics: { clicks: 92 }
    },
    {
      id: "link-sushi-005",
      title: "Galería",
      url: "https://gallery.sushizen.com.mx",
      icon: "gallery",
      description: "Nuestras creaciones artísticas",
      type: "custom" as LinkType,
      order: 5,
      active: true,
      analytics: { clicks: 134 }
    }
  ],
  
  isPublic: true,
  customSlug: "sushizen",
  
  analytics: {
    totalVisits: 987,
    totalClicks: 838,
    uniqueVisitors: 756
  }
};

// Mock data para múltiples restaurantes
export const mockRestaurants: Record<string, { restaurant: Restaurant; linkTree: LinkTree }> = {
  "labellavita": {
    restaurant: mockRestaurant,
    linkTree: mockLinkTree
  },
  "tacoselrey": {
    restaurant: mockTacosElRey,
    linkTree: mockTacosElReyLinkTree
  },
  "sushizen": {
    restaurant: mockSushiZen,
    linkTree: mockSushiZenLinkTree
  }
};

// Función para simular la API
export function getMockRestaurantProfile(username: string) {
  const data = mockRestaurants[username];
  if (!data) {
    throw new Error(`Restaurant with username "${username}" not found`);
  }
  return data;
}