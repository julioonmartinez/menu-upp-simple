// src/services/analyticsService.ts
// Servicio de analytics para tracking de interacciones del menú

interface AnalyticsEvent {
  event: string;
  data: Record<string, any>;
  timestamp: number;
  sessionId: string;
  userAgent?: string;
  url?: string;
}

interface DishViewEvent {
  dishId: string;
  dishName?: string;
  categoryId?: string;
  viewDuration?: number;
  viewMode?: string;
  searchQuery?: string;
}

interface CategoryInteractionEvent {
  categoryId: string;
  categoryName?: string;
  source?: string;
  previousCategory?: string;
}

class AnalyticsService {
  private sessionId: string;
  private events: AnalyticsEvent[] = [];
  private observers: Map<string, IntersectionObserver> = new Map();
  private viewStartTimes: Map<string, number> = new Map();
  private currentCategory: string = '';
  private isInitialized: boolean = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.init();
  }

  private init() {
    if (this.isInitialized) return;
    
    this.setupGlobalListeners();
    this.isInitialized = true;
    
    console.log('Analytics service initialized with session:', this.sessionId);
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalListeners() {
    // Listen to custom events
    window.addEventListener('dishViewed', this.handleDishViewed.bind(this));
    window.addEventListener('categorySelected', this.handleCategorySelected.bind(this));
    window.addEventListener('menuPageView', this.handleMenuPageView.bind(this));
    window.addEventListener('dishFavoriteToggle', this.handleDishFavoriteToggle.bind(this));
    window.addEventListener('dishRated', this.handleDishRated.bind(this));
    window.addEventListener('viewModeChanged', this.handleViewModeChanged.bind(this));
    window.addEventListener('dishSearched', this.handleDishSearched.bind(this));

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_hidden', {});
      } else {
        this.trackEvent('page_visible', {});
      }
    });

    // Track scroll behavior
    let scrollTimeout: number;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        this.trackScrollPosition();
      }, 150);
    });
  }

  private handleDishViewed(event: CustomEvent) {
    const { dishId, categoryId, viewMode, searchQuery } = event.detail;
    
    this.trackEvent('dish_viewed', {
      dishId,
      categoryId,
      viewMode,
      searchQuery,
      scrollPosition: window.scrollY
    });
  }

  private handleCategorySelected(event: CustomEvent) {
    const { categoryId, categoryName, source } = event.detail;
    const previousCategory = this.currentCategory;
    
    this.trackEvent('category_selected', {
      categoryId,
      categoryName,
      source,
      previousCategory
    });
    
    this.currentCategory = categoryId;
  }

  private handleMenuPageView(event: CustomEvent) {
    const { restaurantId, restaurantUsername } = event.detail;
    
    this.trackEvent('menu_page_view', {
      restaurantId,
      restaurantUsername,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    });
  }

  private handleDishFavoriteToggle(event: CustomEvent) {
    const { dishId, dishName, isLiked } = event.detail;
    
    this.trackEvent('dish_favorite_toggle', {
      dishId,
      dishName,
      isLiked,
      action: isLiked ? 'add_favorite' : 'remove_favorite'
    });
  }

  private handleDishRated(event: CustomEvent) {
    const { dishId, dishName, rating } = event.detail;
    
    this.trackEvent('dish_rated', {
      dishId,
      dishName,
      rating,
      categoryId: this.currentCategory
    });
  }

  private handleViewModeChanged(event: CustomEvent) {
    const { viewMode, categoryId } = event.detail;
    
    this.trackEvent('view_mode_changed', {
      viewMode,
      categoryId
    });
  }

  private handleDishSearched(event: CustomEvent) {
    const { query, categoryId, resultCount } = event.detail;
    
    this.trackEvent('dish_searched', {
      query,
      categoryId,
      resultCount,
      queryLength: query.length
    });
  }

  private trackScrollPosition() {
    const scrollPercent = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );
    
    if (scrollPercent % 25 === 0) { // Track at 25%, 50%, 75%, 100%
      this.trackEvent('scroll_milestone', {
        scrollPercent,
        scrollPosition: window.scrollY
      });
    }
  }

  public trackEvent(eventName: string, data: Record<string, any>) {
    const event: AnalyticsEvent = {
      event: eventName,
      data: {
        ...data,
        sessionId: this.sessionId
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.events.push(event);
    
    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('📊 Analytics Event:', eventName, data);
    }

    // Send to analytics service (implement your backend endpoint)
    this.sendToAnalyticsService(event);
  }

  private async sendToAnalyticsService(event: AnalyticsEvent) {
    try {
      // Implementar envío a tu servicio de analytics
      // Por ejemplo, envío a Google Analytics 4, Mixpanel, etc.
      
      // Ejemplo con fetch a tu API:
      /*
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });
      */
      
      // Ejemplo con Google Analytics 4:
      if (typeof gtag !== 'undefined') {
        gtag('event', event.event, {
          custom_parameter_1: JSON.stringify(event.data),
          session_id: event.sessionId
        });
      }
      
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  public initDishViewObserver(selector: string = '.dish-wrapper'): IntersectionObserver {
    const observerId = `dish-observer-${Date.now()}`;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const dishId = entry.target.getAttribute('data-dish-id');
        
        if (entry.isIntersecting && dishId) {
          // Start tracking view time
          this.viewStartTimes.set(dishId, Date.now());
          
          // Track initial view
          this.trackEvent('dish_in_view', {
            dishId,
            intersectionRatio: entry.intersectionRatio
          });
          
        } else if (!entry.isIntersecting && dishId) {
          // Calculate view duration
          const startTime = this.viewStartTimes.get(dishId);
          if (startTime) {
            const viewDuration = Date.now() - startTime;
            this.viewStartTimes.delete(dishId);
            
            this.trackEvent('dish_out_of_view', {
              dishId,
              viewDuration,
              intersectionRatio: entry.intersectionRatio
            });
          }
        }
      });
    }, {
      threshold: [0.1, 0.5, 0.9],
      rootMargin: '0px 0px -10% 0px'
    });

    // Observe existing elements
    document.querySelectorAll(selector).forEach(el => {
      observer.observe(el);
    });

    this.observers.set(observerId, observer);
    return observer;
  }

  public trackCategoryInteraction(categoryId: string, additionalData: Record<string, any> = {}) {
    this.trackEvent('category_interaction', {
      categoryId,
      interactionType: 'click',
      ...additionalData
    });
  }

  public trackPerformanceMetrics() {
    if (typeof performance !== 'undefined' && performance.timing) {
      const timing = performance.timing;
      const metrics = {
        pageLoadTime: timing.loadEventEnd - timing.navigationStart,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        firstPaint: 0,
        firstContentfulPaint: 0
      };

      // Get paint metrics if available
      if (typeof performance.getEntriesByType === 'function') {
        const paintEntries = performance.getEntriesByType('paint');
        paintEntries.forEach(entry => {
          if (entry.name === 'first-paint') {
            metrics.firstPaint = entry.startTime;
          } else if (entry.name === 'first-contentful-paint') {
            metrics.firstContentfulPaint = entry.startTime;
          }
        });
      }

      this.trackEvent('performance_metrics', metrics);
    }
  }

  public getSessionEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  public clearSessionEvents() {
    this.events = [];
  }

  public destroy() {
    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.viewStartTimes.clear();
    this.isInitialized = false;
  }

  // Public methods for backward compatibility
  public recordView(itemId: string, itemType: string = 'dish') {
    this.trackEvent('item_view', {
      itemId,
      itemType,
      categoryId: this.currentCategory
    });
  }
}

// Create singleton instance
const analyticsService = new AnalyticsService();

// Export functions for backward compatibility
export const trackCategoryInteraction = (categoryId: string, additionalData?: Record<string, any>) => {
  analyticsService.trackCategoryInteraction(categoryId, additionalData);
};

export const recordView = (itemId: string, itemType: string = 'dish') => {
  analyticsService.recordView(itemId, itemType);
};

export const initDishViewObserver = (selector?: string) => {
  return analyticsService.initDishViewObserver(selector);
};

export const trackEvent = (eventName: string, data: Record<string, any>) => {
  analyticsService.trackEvent(eventName, data);
};

export const trackPerformanceMetrics = () => {
  analyticsService.trackPerformanceMetrics();
};

// Initialize performance tracking when page loads
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      trackPerformanceMetrics();
    }, 1000);
  });
}

export default analyticsService;