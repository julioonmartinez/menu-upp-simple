//cartStore20.ts
import { writable, derived } from 'svelte/store';
import type { CartItem, PromotionCartItem, ShoppingCart } from '../interfaces/dish';


// Crear interfaz para el estado del carrito
interface CartState {
  cart: ShoppingCart,
  isOpen: boolean;
  lastAddedItem: CartItem | PromotionCartItem | null;
  showNotification: boolean;
}

// Estado inicial del carrito
const initialState: CartState = {
  cart: {
    items: [],
    promotions:[],
    totalItems:0,
    subtotal:0,
    taxes:0,
    discount:0,
    total:0,
  },
  isOpen: false,
  lastAddedItem: null,
  showNotification: false
};
// Función para calcular los totales
function calculateTotals(state: CartState) {
  // Calcular subtotal de items individuales
  const itemsSubtotal = state.cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Calcular subtotal de promociones
  const promoSubtotal = state.cart.promotions.reduce((sum, promo) => sum + promo.totalPrice, 0);
  
  // Calcular subtotal total
  const subtotal = itemsSubtotal + promoSubtotal;
  
  // Calcular impuestos (16%)
  const taxes = subtotal * 0.16;
  
  // Calcular total de items
  const totalItems = state.cart.items.reduce((sum, item) => sum + item.quantity, 0) + 
                     state.cart.promotions.reduce((sum, promo) => sum + promo.quantity, 0);
  
  // Actualizar el carrito con los cálculos
  return {
    ...state.cart,
    totalItems,
    subtotal,
    taxes,
    // Aquí puedes aplicar códigos de descuento si los tienes
    total: subtotal + taxes
  };
}


// Función para crear el store del carrito
function createCartStore() {
  // Verificamos si estamos en el navegador
  const isBrowser = typeof window !== 'undefined';
  
  const { subscribe, set, update } = writable<CartState>(initialState);

  // Intentar cargar del localStorage al iniciar (solo en el cliente)
  if (isBrowser) {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if(parsed){
          update(state =>({
            ... state,
            cart: parsed
          }))
        }
        // if (parsed && Array.isArray(parsed.items)) {
        //   update(state => ({
        //     ...state,
        //     items: parsed.items
        //   }));
        // }
      }
    } catch (e) {
      console.error('Error loading cart from localStorage', e);
    }
  }

  // Función para guardar en localStorage
  const saveToLocalStorage = (cart: ShoppingCart) => {
    if (isBrowser) {
      try {
        localStorage.setItem('cart', JSON.stringify(cart));
      } catch (e) {
        console.error('Error saving cart to localStorage', e);
      }
    }
  };
  
  // Función para cargar items guardados
  const loadSavedShoppingCart = () => {
    if (isBrowser) {
      try {
        const shoppingCart = localStorage.getItem('cart');
        return shoppingCart ? JSON.parse(shoppingCart) : null;
      } catch (e) {
        console.error('Error loading saved items', e);
        return [];
      }
    }
    return [];
  };

  return {
    subscribe,
    
    // Cargar items guardados
    getSavedItems: () => {
      return loadSavedShoppingCart();
    },
  
    
    // Agregar un item al carrito
    addItem: (item: CartItem) => {
      update(state => {
        const existingIndex = state.cart.items.findIndex(i => 
          i.id === item.id && 
          JSON.stringify(i.selectedOptions) === JSON.stringify(item.selectedOptions)
        );
        
        let newItems  ;
        let cart : ShoppingCart;
        if (existingIndex >= 0) {
          // Actualizar item existente
          newItems = [...state.cart.items];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + item.quantity,
            totalPrice: newItems[existingIndex].totalPrice + item.totalPrice
          };

        } else {
          // Agregar nuevo item
          newItems = [...state.cart. items, item];
        }
        cart = {
          ... state.cart,
          items: newItems
        }

        // Calcular totales automáticamente
          cart = calculateTotals({ ...state, cart });
        saveToLocalStorage(cart);
        state.cart = cart
        
        return {
          ...state,
          cart: cart,
          lastAddedItem: item,
          showNotification: true
        };
      });
      
      // Ocultar notificación después de 3 segundos
      setTimeout(() => {
        update(state => ({
          ...state,
          showNotification: false
        }));
      }, 3000);
    },

    //Agregar Promos al carrito
    addPromo:(promo:PromotionCartItem )=> {
      console.log('addPromo', promo)
        update(state=>{
            const existingIndex = state.cart.promotions.findIndex(i=>
                i.id === promo.promotionId 
                // &&
                // JSON.stringify(i.selectedOptions) === JSON.stringify(item.selectedOptions)

            );
            let newPromos : PromotionCartItem[] ;
            let cart : ShoppingCart;
            if(existingIndex >= 0 ){
                //actualizar promo
                newPromos = [...state.cart.promotions];
                newPromos[existingIndex] = {
                    ...newPromos[existingIndex],
                    quantity: newPromos[existingIndex].quantity + promo.quantity,
                    totalPrice: newPromos[existingIndex].totalPrice + promo.totalPrice
                };
              
            }else{
                //Agregar nuevo item
                newPromos = [...state.cart.promotions, promo ];
                console.log(promo, newPromos)
            }
            cart = {
              ...state.cart,
              promotions: newPromos
            }
            cart = calculateTotals({ ...state, cart });
            saveToLocalStorage(cart);
            state.cart = cart;
            // Calcular totales automáticamente
    
            return {
                ...state,
                cart: cart,
                lastAddedItem: promo,
                showNotification : true
            }
        });
         // Ocultar notificación después de 3 segundos
      setTimeout(() => {
        update(state => ({
          ...state,
          showNotification: false
        }));
      }, 3000);

    },
    
    // Remover un item del carrito
    removeItem: (itemId: string | number, optionsString: string = '') => {
      update(state => {
        const newItems = state.cart.items.filter(item => {
          if (item.id !== itemId) return true;
          if (optionsString && JSON.stringify(item.selectedOptions) !== optionsString) return true;
          return false;
        });
        let cart: ShoppingCart ={
          ...state.cart,
          items: newItems
        }
        cart = calculateTotals({ ...state, cart });
        saveToLocalStorage(cart);
        
        return {
          ...state,
          cart: cart
        };
      });
    },

    //Remover Oferta
    removePromo(promoId: string | number, ){
      update(state=>{
        const newPromos = state.cart.promotions.filter(promos=>{
          if(promos.id !== promoId) return true;

        });
        let cart : ShoppingCart = {
          ...state.cart,
          promotions: newPromos
        };
        cart = calculateTotals({ ...state, cart });
        saveToLocalStorage(cart)

        
        return {
          ...state,
          cart: cart
        }
      })
    },
    
    // Actualizar cantidad de un item
    updateQuantity: (itemId: string | number, quantity: number, optionsString: string = '') => {
      update(state => {
        const newItems = state.cart.items.map(item => {
          if (item.id === itemId && 
            (optionsString === '' || JSON.stringify(item.selectedOptions) === optionsString)) {
            const newQuantity = Math.max(1, quantity);
            return {
              ...item,
              quantity: newQuantity,
              totalPrice: (item.totalPrice / item.quantity) * newQuantity
            };
          }
          return item;
        });
        let cart: ShoppingCart ={
          ...state.cart,
          items: newItems
        }
        cart = calculateTotals({ ...state, cart });
        saveToLocalStorage(cart);
        
        return {
          ...state,
          // items: newItems,
          cart: cart
          
        };
      });
    },
    //Actualizar la cantidad de una promo
    updateQuantityPromo:( promoID: string | number, quantity: number )=> {
      update(state => {
        const newPromos = state.cart.promotions.map(promo =>{
          if(promo.id === promoID){
            const newQuantity = Math.max(1, quantity)
            return {
              ...promo,
              quantity: newQuantity,
              totalPrice: (promo.totalPrice / promo.quantity) * newQuantity
            };
          }
          console.log(promo)
          return promo
        });
        let cart : ShoppingCart = {
          ...state.cart,
          promotions: newPromos
        };
        cart = calculateTotals({ ...state, cart });
        saveToLocalStorage(cart);
        return {
          ...state,
          cart: cart
        }
      })
    },
    
    // Limpiar todo el carrito
    clearCart: () => {
      update(state => {
        let cart: ShoppingCart = {
          ...state.cart,
          items: [],
          promotions: [],
        }
        cart = calculateTotals({ ...state, cart });
        saveToLocalStorage(cart);
        return {
          ...state,
          cart: cart,

        };
      });
    },
    
    // Abrir el panel del carrito
    openCart: () => {
      update(state => ({
        ...state,
        isOpen: true
      }));
    },
    
    // Cerrar el panel del carrito
    closeCart: () => {
      update(state => ({
        ...state,
        isOpen: false
      }));
    },
    
    // Alternar el panel del carrito
    toggleCart: () => {
      update(state => ({
        ...state,
        isOpen: !state.isOpen
      }));
    },
    
    // Cerrar la notificación manualmente
    closeNotification: () => {
      update(state => ({
        ...state,
        showNotification: false
      }));
    }
  };
}

// Crear y exportar el store
export const cartStore = createCartStore();

// Propiedades derivadas útiles
// total de productos
export const cartCount = derived(
  cartStore,
  $cartStore => $cartStore.cart.items.reduce((sum, item) => sum + item.quantity, 0) + $cartStore.cart.promotions.reduce((sum, promo)=> sum + promo.quantity, 0)
);
// price
export const cartTotal = derived(
  cartStore,
  $cartStore => $cartStore.cart.items.reduce((sum, item) => sum + item.totalPrice, 0) + $cartStore.cart.promotions.reduce((sum, promo)=> sum  + promo.totalPrice, 0)
);

export const cartIsEmpty = derived(
  cartStore,
  $cartStore => ($cartStore.cart.items.length === 0  ) && ($cartStore.cart.promotions.length === 0)
);