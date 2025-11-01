/**
 * utils.ts
 *
 * Funciones utilitarias para la aplicación. Proporciona helper para fusión
 * condicional de clases CSS de Tailwind evitando conflictos de especificidad.
 *
 * Author: César Sánchez Montes
 * Course: Imagen Digital
 * Year: 2025
 * Version: 3.0.0
 *
 * Dependencies:
 *   - clsx: Construcción condicional de strings de clases CSS
 *   - tailwind-merge: Fusión inteligente de clases de Tailwind
 *
 * Usage:
 *   import { cn } from '@/lib/utils'
 *
 *   // Combinar clases estáticas y condicionales
 *   <div className={cn('base-class', isActive && 'active-class')} />
 *
 *   // Resolver conflictos de Tailwind
 *   <div className={cn('px-4 py-2', 'px-6')} />
 *   // Resultado: 'py-2 px-6' (px-6 sobrescribe px-4)
 *
 * Notes:
 *   Problema resuelto:
 *     Tailwind genera clases utilitarias que pueden conflictuar cuando
 *     se combinan múltiples fuentes (props, estado, variantes). La función
 *     cn resuelve estos conflictos manteniendo solo la clase más específica.
 *
 *   Casos de uso comunes:
 *     - Componentes con variantes condicionales
 *     - Fusión de clases de props con clases base
 *     - Sobrescritura de estilos en composición de componentes
 *
 *   Ventajas sobre concatenación simple:
 *     - Maneja valores condicionales (undefined, null, false)
 *     - Resuelve conflictos de Tailwind por especificidad
 *     - Elimina duplicados automáticamente
 *     - Soporta arrays, objetos y strings
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina y fusiona clases CSS con resolución de conflictos de Tailwind.
 *
 * Utiliza clsx para construcción condicional de clases y tailwind-merge
 * para resolver conflictos entre clases utilitarias de Tailwind. La función
 * acepta múltiples argumentos de diferentes tipos y retorna string optimizado.
 *
 * @param inputs - Valores de clase (strings, arrays, objetos, condicionales)
 * @returns String de clases CSS fusionadas sin conflictos
 *
 * Notes:
 *   Flujo de procesamiento:
 *     1. clsx procesa inputs y construye string de clases
 *        - Filtra valores falsy (undefined, null, false)
 *        - Aplana arrays anidados
 *        - Evalúa objetos { clase: condición }
 *     2. twMerge analiza clases de Tailwind resultantes
 *        - Detecta conflictos (ej: px-4 vs px-6)
 *        - Mantiene solo la clase más reciente por propiedad
 *        - Preserva clases no-Tailwind intactas
 *     3. Retorna string final optimizado
 *
 *   Ejemplos de resolución de conflictos:
 *     cn('px-2', 'px-4') → 'px-4'
 *     cn('text-red-500', 'text-blue-500') → 'text-blue-500'
 *     cn('p-4', 'px-6') → 'py-4 px-6'
 *     cn('bg-red-500', isActive && 'bg-green-500') → 'bg-green-500' (si isActive)
 *
 *   Tipos aceptados por ClassValue:
 *     - string: 'class-name'
 *     - number: 123 (convertido a string)
 *     - boolean/null/undefined: filtrados automáticamente
 *     - array: ['class-1', 'class-2']
 *     - objeto: { 'class-name': condition }
 *
 *   Rendimiento:
 *     Ambas librerías están optimizadas para uso frecuente en renderizado.
 *     La sobrecarga es mínima comparada con beneficios de mantenibilidad.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}