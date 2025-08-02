# Servicios de Restaurantes Anónimos - Frontend

Esta documentación describe cómo usar los servicios de restaurantes anónimos en el frontend de Astro con TypeScript.

## 📁 Estructura de Archivos

```
src/
├── interfaces/
│   └── anonymousRestaurant.ts          # Interfaces TypeScript
├── services/
│   ├── anonymousRestaurantService.ts   # Servicio principal
│   ├── anonymousCategoryService.ts     # Servicio de categorías
│   ├── anonymousDishService.ts         # Servicio de platillos
│   ├── anonymousServices.ts            # Exportaciones centralizadas
│   └── deviceIdService.ts             # Gestión de device ID
└── examples/
    └── anonymousRestaurantExample.ts   # Ejemplos de uso
```

## 🚀 Instalación y Configuración

### 1. Variables de Entorno

Asegúrate de tener configurada la variable de entorno en tu `.env`:

```env
PUBLIC_API_URL=http://localhost:8000
```

### 2. Importaciones

```typescript
// Importación individual
import { anonymousRestaurantService } from '../services/anonymousRestaurantService';
import { anonymousCategoryService } from '../services/anonymousCategoryService';
import { anonymousDishService } from '../services/anonymousDishService';

// Importación centralizada
import {
  anonymousRestaurantService,
  anonymousCategoryService,
  anonymousDishService,
  AnonymousServicesManager,
  getDeviceId
} from '../services/anonymousServices';
```

## 📋 Uso Básico

### Crear un Restaurante Anónimo

```typescript
import { anonymousRestaurantService } from '../services/anonymousServices';

const restaurantData = {
  name: "Mi Restaurante",
  description: "Descripción del restaurante",
  address: "Dirección del restaurante",
  phone: "+5215512345678",
  primaryColor: "#FF5733",
  secondaryColor: "#33FF57"
};

const result = await anonymousRestaurantService.createAnonymousRestaurant(restaurantData);

if (result.success) {
  console.log('✅ Restaurante creado:', result.data!.restaurant.name);
  console.log('🔑 Claim Code:', result.data!.claim_code);
  console.log('⏰ Días restantes:', result.data!.days_remaining);
  
  // Guardar claim code para reclamación posterior
  anonymousRestaurantService.utils.saveClaimCode(result.data!.claim_code);
} else {
  console.error('❌ Error:', result.error);
}
```

### Crear Categorías

```typescript
import { anonymousCategoryService } from '../services/anonymousServices';

const categoryData = {
  name: "Platos Principales",
  description: "Platos principales del menú",
  order: 1
};

const result = await anonymousCategoryService.createAnonymousCategory(categoryData);

if (result.success) {
  console.log('✅ Categoría creada:', result.data!.name);
} else {
  console.error('❌ Error:', result.error);
}
```

### Crear Platillos

```typescript
import { anonymousDishService } from '../services/anonymousServices';

const dishData = {
  name: "Pizza Margherita",
  description: "Pizza clásica con tomate y mozzarella",
  price: 180.00,
  categoryId: "category_id_here",
  inStock: true
};

const result = await anonymousDishService.createAnonymousDish(dishData);

if (result.success) {
  console.log('✅ Platillo creado:', result.data!.name);
  console.log('💰 Precio:', anonymousDishService.utils.formatPrice(result.data!.price));
} else {
  console.error('❌ Error:', result.error);
}
```

## 🎯 Reclamación de Restaurantes

### Verificar Restaurante por Claim Code

```typescript
const claimCode = "ABC123DEF456";
const result = await anonymousRestaurantService.getAnonymousRestaurantByClaimCode(claimCode);

if (result.success && result.data!.restaurant) {
  const restaurant = result.data!.restaurant;
  console.log('🏪 Restaurante:', restaurant.name);
  console.log('⏰ Días restantes:', restaurant.days_remaining);
  console.log('🎯 Puede reclamarse:', result.data!.can_claim);
} else {
  console.error('❌ Restaurante no encontrado o expirado');
}
```

### Reclamar Restaurante

```typescript
const claimRequest = {
  claim_code: "ABC123DEF456",
  email: "usuario@ejemplo.com",
  password: "contraseña123",
  name: "Juan Pérez"
};

const result = await anonymousRestaurantService.claimAnonymousRestaurant(claimRequest);

if (result.success) {
  console.log('✅ Restaurante reclamado exitosamente');
  console.log('👤 Usuario creado:', result.data!.user.name);
  console.log('🏪 Restaurante asignado:', result.data!.restaurant.name);
  
  // Limpiar claim code guardado
  anonymousRestaurantService.utils.clearSavedClaimCode();
} else {
  console.error('❌ Error reclamando:', result.error);
}
```

## 🔍 Consultas y Filtros

### Obtener Restaurantes del Dispositivo

```typescript
const result = await anonymousRestaurantService.getAnonymousRestaurantsByDevice();

if (result.success) {
  const restaurants = result.data!.restaurants;
  
  restaurants.forEach(restaurant => {
    console.log(`🏪 ${restaurant.name} - ${restaurant.days_remaining} días restantes`);
  });
}
```

### Obtener Categorías

```typescript
const result = await anonymousCategoryService.getAnonymousCategoriesByDevice();

if (result.success) {
  const categories = result.data!.categories;
  
  // Ordenar por orden
  const sortedCategories = anonymousCategoryService.utils.sortCategoriesByOrder(categories);
  
  sortedCategories.forEach(category => {
    console.log(`📂 ${category.name} - ${category.description}`);
  });
}
```

### Obtener Platillos con Filtros

```typescript
const result = await anonymousDishService.getAnonymousDishesByDevice({
  categoryId: "category_id",
  limit: 10,
  page: 1,
  search: "pizza"
});

if (result.success) {
  const dishes = result.data!.dishes;
  
  // Filtrar por categoría
  const categoryDishes = anonymousDishService.utils.filterDishesByCategory(dishes, "category_id");
  
  // Ordenar por precio
  const sortedByPrice = anonymousDishService.utils.sortDishesByPrice(dishes, true);
  
  // Buscar por término
  const searchResults = anonymousDishService.utils.searchDishes(dishes, "pizza");
  
  console.log(`🍽️ Platillos encontrados: ${dishes.length}`);
  console.log(`💰 Platillo más barato: ${sortedByPrice[0]?.name}`);
}
```

## 🛠️ Utilidades

### Device ID

```typescript
import { getDeviceId, regenerateDeviceId, clearDeviceId } from '../services/anonymousServices';

// Obtener device ID actual
const deviceId = getDeviceId();
console.log('📱 Device ID:', deviceId);

// Regenerar device ID (útil para pruebas)
const newDeviceId = regenerateDeviceId();

// Limpiar device ID
clearDeviceId();
```

### Utilidades de Restaurantes

```typescript
const utils = anonymousRestaurantService.utils;

// Generar código de ejemplo
const exampleCode = utils.generateExampleClaimCode();

// Calcular días restantes
const daysRemaining = utils.calculateDaysRemaining("2024-01-15T00:00:00Z");

// Verificar si puede reclamarse
const canClaim = utils.canClaimRestaurant(restaurant);

// Obtener URL de reclamación
const claimUrl = utils.getClaimUrl("ABC123DEF456");

// Formatear fecha de expiración
const expirationDate = utils.formatExpirationDate("2024-01-15T00:00:00Z");

// Verificar si está expirado
const isExpired = utils.isExpired(restaurant);

// Obtener estado del restaurante
const status = utils.getRestaurantStatus(restaurant); // 'active' | 'expired' | 'claimed'
```

### Utilidades de Platillos

```typescript
const utils = anonymousDishService.utils;

// Formatear precio
const formattedPrice = utils.formatPrice(180.50); // "$180.50"

// Verificar stock
const inStock = utils.isInStock(dish);

// Calcular precio promedio
const averagePrice = utils.calculateAveragePrice(dishes);

// Obtener platillo más caro/barato
const mostExpensive = utils.getMostExpensiveDish(dishes);
const cheapest = utils.getCheapestDish(dishes);
```

## 📊 Gestión Completa con AnonymousServicesManager

### Crear Restaurante Completo

```typescript
import { AnonymousServicesManager } from '../services/anonymousServices';

const restaurantData = { /* datos del restaurante */ };
const categories = [ /* array de categorías */ ];
const dishes = [ /* array de platillos */ ];

const result = await AnonymousServicesManager.createCompleteAnonymousRestaurant(
  restaurantData,
  categories,
  dishes
);

if (result.success) {
  console.log('✅ Restaurante completo creado');
  console.log('📂 Categorías:', result.data!.categories.length);
  console.log('🍽️ Platillos:', result.data!.dishes.length);
}
```

### Obtener Todos los Datos

```typescript
const result = await AnonymousServicesManager.getAllAnonymousData();

if (result.success) {
  const { restaurants, categories, dishes } = result.data!;
  console.log(`🏪 Restaurantes: ${restaurants.length}`);
  console.log(`📂 Categorías: ${categories.length}`);
  console.log(`🍽️ Platillos: ${dishes.length}`);
}
```

### Obtener Estadísticas

```typescript
const result = await AnonymousServicesManager.getAnonymousDataStats();

if (result.success) {
  const stats = result.data!;
  console.log(`📊 Restaurantes activos: ${stats.active_restaurants}`);
  console.log(`⏰ Restaurantes expirados: ${stats.expired_restaurants}`);
  console.log(`🎯 Restaurantes reclamados: ${stats.claimed_restaurants}`);
  console.log(`📂 Categorías totales: ${stats.total_categories}`);
  console.log(`🍽️ Platillos totales: ${stats.total_dishes}`);
}
```

## 🔐 Seguridad y Validación

### Validación de Datos

Los servicios incluyen validación automática de datos:

- **Restaurantes**: Nombre requerido, longitud máxima, validación de colores
- **Categorías**: Nombre requerido, longitud máxima, orden válido
- **Platillos**: Nombre y precio requeridos, precio positivo, categoría válida

### Device ID

- Se genera automáticamente y persiste en localStorage
- Se usa para identificar al creador de contenido anónimo
- Permite editar/eliminar solo el contenido propio

### Claim Codes

- Códigos únicos de 12 caracteres alfanuméricos
- Se guardan automáticamente en localStorage
- Permiten reclamación posterior del restaurante

## 🎨 Integración con UI

### Ejemplo con React/Astro

```typescript
// Componente de creación de restaurante
const CreateAnonymousRestaurant = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await anonymousRestaurantService.createAnonymousRestaurant(formData);
      setResult(response);
      
      if (response.success) {
        // Guardar claim code
        anonymousRestaurantService.utils.saveClaimCode(response.data!.claim_code);
        
        // Mostrar mensaje de éxito
        alert(`¡Restaurante creado! Código de reclamación: ${response.data!.claim_code}`);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Nombre del restaurante"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required
      />
      {/* Más campos... */}
      <button type="submit" disabled={loading}>
        {loading ? 'Creando...' : 'Crear Restaurante'}
      </button>
    </form>
  );
};
```

### Ejemplo de Contador de Expiración

```typescript
const ExpirationCounter = ({ expiresAt }: { expiresAt: string }) => {
  const [daysRemaining, setDaysRemaining] = useState(0);
  
  useEffect(() => {
    const calculateDays = () => {
      const days = anonymousRestaurantService.utils.calculateDaysRemaining(expiresAt);
      setDaysRemaining(days);
    };
    
    calculateDays();
    const interval = setInterval(calculateDays, 60000); // Actualizar cada minuto
    
    return () => clearInterval(interval);
  }, [expiresAt]);
  
  return (
    <div className="expiration-counter">
      <p>⏰ Tiempo restante: {daysRemaining} días</p>
      {daysRemaining <= 0 && (
        <p className="expired">⚠️ Este restaurante ha expirado</p>
      )}
    </div>
  );
};
```

## 🧪 Testing

### Ejemplo de Test

```typescript
import { AnonymousRestaurantExample } from '../examples/anonymousRestaurantExample';

// Ejecutar ejemplos
const runExamples = async () => {
  console.log('🧪 Ejecutando ejemplos...');
  
  // Crear restaurante completo
  await AnonymousRestaurantExample.createCompleteRestaurantExample();
  
  // Obtener estadísticas
  await AnonymousRestaurantExample.getStatsExample();
  
  // Gestionar categorías y platillos
  await AnonymousRestaurantExample.manageCategoriesAndDishesExample();
  
  // Buscar y filtrar
  await AnonymousRestaurantExample.searchAndFilterDishesExample();
};

runExamples();
```

## 📝 Notas Importantes

1. **Device ID**: Se genera automáticamente y persiste entre sesiones
2. **Claim Codes**: Se guardan en localStorage para reclamación posterior
3. **Expiración**: Los restaurantes expiran automáticamente a los 30 días
4. **Validación**: Todos los datos se validan antes de enviarse al servidor
5. **Errores**: Todos los métodos retornan objetos con `success` y `error`
6. **Tipos**: Todas las interfaces están tipadas con TypeScript

## 🔄 Flujo Típico

1. **Crear restaurante anónimo** → Obtener claim code
2. **Agregar categorías y platillos** → Construir menú completo
3. **Compartir claim code** → Permitir reclamación
4. **Reclamar restaurante** → Convertir a restaurante normal
5. **Gestionar como usuario registrado** → Acceso completo

Este sistema permite crear menús rápidamente sin registro, manteniendo la posibilidad de reclamar y convertir a un restaurante completo más adelante. 