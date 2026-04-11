// Utilidades para manejo de fechas con zona horaria

/**
 * Convierte una fecha de input (YYYY-MM-DD) a objeto Date en hora local
 * sin afectar por zona horaria UTC
 */
export function parseInputDate(dateString: string): Date {
  // Parsear la fecha como año-mes-dia
  const [year, month, day] = dateString.split('-').map(Number);
  // Crear fecha a las 12:00 del mediodia para evitar problemas de zona horaria
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Formatea una fecha para mostrar en formato local (DD/MM/YYYY)
 */
export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  // Ajustar para zona horaria local sumando el offset
  const userTimezoneOffset = d.getTimezoneOffset() * 60000;
  const localDate = new Date(d.getTime() + userTimezoneOffset);
  
  return localDate.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Convierte una fecha a string YYYY-MM-DD para inputs
 */
export function toInputDateString(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  // Ajustar para zona horaria local
  const userTimezoneOffset = d.getTimezoneOffset() * 60000;
  const localDate = new Date(d.getTime() + userTimezoneOffset);
  
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Formatea fecha para API (ISO string pero ajustado a hora local)
 */
export function formatDateForAPI(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  // Crear fecha a las 12:00 para evitar cambio de día por zona horaria
  const date = new Date(year, month - 1, day, 12, 0, 0);
  return date.toISOString();
}
