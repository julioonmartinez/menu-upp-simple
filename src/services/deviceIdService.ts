// app/services/deviceIdService.ts
const DEVICE_ID_KEY = 'menu_device_id';

/**
 * Genera y administra un ID de dispositivo único para analíticas
 * Este ID persistirá en localStorage para poder identificar dispositivos únicos
 */
export function getDeviceId() {
  if (typeof window === 'undefined') {
    // Estamos en SSR, no hay localStorage
    return 'server-side';
  }

  try {
    // Intentar obtener el deviceId existente
    let deviceId = localStorage.getItem('analytics_device_id');
    
    // Si no existe, crear uno nuevo
    if (!deviceId) {
      // Generar un ID único usando timestamp + random para casi garantizar unicidad
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      console.log(`Generando nuevo device ID: ${deviceId}`);
      
      // Guardarlo en localStorage
      localStorage.setItem('analytics_device_id', deviceId);
    }
    
    return deviceId;
  } catch (error) {
    // Si hay algún error (ej. localStorage deshabilitado), usar un ID temporal
    console.error('Error al acceder a localStorage:', error);
    return `temp_${Date.now()}`;
  }
}

/**
 * Opcional: Regenera el ID del dispositivo 
 * Útil para pruebas o para usuarios que quieran resetear su perfil
 */
export function regenerateDeviceId() {
  if (typeof window === 'undefined') return;
  
  try {
    const newDeviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('analytics_device_id', newDeviceId);
    console.log(`Device ID regenerado: ${newDeviceId}`);
    return newDeviceId;
  } catch (error) {
    console.error('Error al regenerar device ID:', error);
    return null;
  }
}

export function clearDeviceId(): void {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.removeItem(DEVICE_ID_KEY);
  }
}