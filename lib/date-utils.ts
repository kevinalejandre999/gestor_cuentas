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

/**
 * Obtiene fechas de inicio y fin de un período (usando hora local ajustada)
 * Esto evita problemas de zona horaria al filtrar transacciones
 */
export function getPeriodDates(period: "this-month" | "last-month" | "last-3-months" | "all"): { from: Date; to: Date } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  let from: Date;
  let to: Date;

  if (period === "this-month") {
    // Desde el día 1 a las 00:00:00
    from = new Date(currentYear, currentMonth, 1, 0, 0, 0);
    // Hasta el día actual a las 23:59:59
    to = new Date(currentYear, currentMonth, now.getDate(), 23, 59, 59);
  } else if (period === "last-month") {
    // Desde el día 1 del mes pasado
    from = new Date(currentYear, currentMonth - 1, 1, 0, 0, 0);
    // Hasta el último día del mes pasado a las 23:59:59
    const lastDayOfLastMonth = new Date(currentYear, currentMonth, 0).getDate();
    to = new Date(currentYear, currentMonth - 1, lastDayOfLastMonth, 23, 59, 59);
  } else if (period === "last-3-months") {
    // Desde hace 3 meses
    from = new Date(currentYear, currentMonth - 2, 1, 0, 0, 0);
    to = new Date(currentYear, currentMonth, now.getDate(), 23, 59, 59);
  } else {
    // "all" - desde el año 2000 hasta hoy
    from = new Date(2000, 0, 1, 0, 0, 0);
    to = new Date(currentYear, currentMonth, now.getDate(), 23, 59, 59);
  }

  return { from, to };
}

/**
 * Normaliza una fecha de transacción (ISO string) para comparación local
 * Ajusta el offset de zona horaria para obtener la fecha correcta en hora local
 */
export function normalizeTransactionDate(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  // Sumar el offset de zona horaria para obtener la fecha correcta en hora local
  const userTimezoneOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() + userTimezoneOffset);
}
