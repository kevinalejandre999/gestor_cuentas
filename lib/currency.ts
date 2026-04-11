// Configuración de monedas
export const CURRENCY_CONFIG: Record<string, { 
  symbol: string; 
  decimals: number; 
  locale: string;
  isPrefix: boolean;
}> = {
  USD: { symbol: "US$", decimals: 2, locale: "en-US", isPrefix: true },
  EUR: { symbol: "€", decimals: 2, locale: "es-ES", isPrefix: true },
  PYG: { symbol: "Gs.", decimals: 0, locale: "es-PY", isPrefix: false },
  ARS: { symbol: "$", decimals: 2, locale: "es-AR", isPrefix: true },
  BRL: { symbol: "R$", decimals: 2, locale: "pt-BR", isPrefix: true },
  CLP: { symbol: "$", decimals: 0, locale: "es-CL", isPrefix: true },
  COP: { symbol: "$", decimals: 0, locale: "es-CO", isPrefix: true },
  MXN: { symbol: "$", decimals: 2, locale: "es-MX", isPrefix: true },
};

export function formatCurrency(amount: number, currency: string = "PYG"): string {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.PYG;
  
  // Para PYG y monedas sin decimales
  if (config.decimals === 0) {
    const formatted = Math.round(amount).toLocaleString(config.locale);
    return config.isPrefix 
      ? `${config.symbol} ${formatted}`
      : `${formatted} ${config.symbol}`;
  }
  
  // Para monedas con decimales
  const formatted = amount.toLocaleString(config.locale, {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  });
  
  return config.isPrefix 
    ? `${config.symbol} ${formatted}`
    : `${formatted} ${config.symbol}`;
}

// Función para formatear número con separadores de miles mientras se escribe
export function formatNumberInput(value: string, currency: string = "PYG"): string {
  // Remover todo excepto números
  const numericValue = value.replace(/[^0-9]/g, "");
  
  if (!numericValue) return "";
  
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.PYG;
  const number = parseInt(numericValue, 10);
  
  return number.toLocaleString(config.locale);
}

// Función para parsear valor formateado a número
export function parseFormattedNumber(value: string): number {
  // Remover separadores de miles
  const cleanValue = value.replace(/\./g, "").replace(/,/g, ".");
  return parseFloat(cleanValue) || 0;
}
