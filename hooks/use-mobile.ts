/**
 * use-mobile.tsx
 *
 * Hook personalizado para detección de dispositivos móviles basado en ancho de viewport.
 * Utiliza matchMedia API para escuchar cambios de tamaño de ventana en tiempo real.
 *
 * Author: César Sánchez Montes
 * Course: Imagen Digital
 * Year: 2025
 * Version: 3.0.0
 *
 * Dependencies:
 *   - react: Hooks useState y useEffect
 *
 * Usage:
 *   import { useIsMobile } from '@/hooks/use-mobile'
 *
 *   function MyComponent() {
 *     const isMobile = useIsMobile()
 *
 *     return (
 *       <div>
 *         {isMobile ? <MobileView /> : <DesktopView />}
 *       </div>
 *     )
 *   }
 *
 * Notes:
 *   Breakpoint definido:
 *     - MOBILE_BREAKPOINT = 768px (estándar tablet/móvil)
 *     - Dispositivo móvil: ancho < 768px
 *     - Dispositivo desktop: ancho >= 768px
 *
 *   Ventajas sobre window.innerWidth directo:
 *     - Reactivo a cambios de tamaño de ventana
 *     - Utiliza matchMedia para mejor rendimiento
 *     - Limpieza automática de event listeners
 *     - Sincronización con media queries CSS
 *
 *   Estado inicial undefined:
 *     Durante SSR o primera renderización en cliente, isMobile es undefined
 *     hasta completar primer efecto. El operador !! lo convierte a false.
 */

import * as React from 'react'

/**
 * Breakpoint en píxeles que define límite entre móvil y desktop.
 * Valores menores a este breakpoint se consideran dispositivos móviles.
 *
 * @constant
 * @default 768 - Breakpoint estándar md de Tailwind
 */
const MOBILE_BREAKPOINT = 768

/**
 * Hook useIsMobile.
 *
 * Detecta si el dispositivo actual es móvil basándose en ancho de viewport.
 * Escucha cambios de tamaño mediante matchMedia para actualizar valor reactivamente.
 *
 * @returns Boolean indicando si el viewport es móvil (true) o desktop (false)
 *
 * Notes:
 *   Implementación:
 *     1. Estado inicial undefined para compatibilidad SSR
 *     2. useEffect ejecuta en montaje y configura listener
 *     3. matchMedia crea media query listener para breakpoint
 *     4. onChange actualiza estado cuando query cambia
 *     5. addEventListener registra listener en objeto MediaQueryList
 *     6. setIsMobile inicial establece valor basado en viewport actual
 *     7. Cleanup function remueve listener al desmontar
 *
 *   matchMedia vs resize event:
 *     - matchMedia dispara solo cuando cruza breakpoint específico
 *     - resize event dispara en cada cambio de píxel
 *     - matchMedia tiene mejor rendimiento para detección de breakpoints
 *
 *   Doble operador !!:
 *     Convierte undefined inicial a false booleano explícito.
 *     Previene valores undefined en lógica condicional de componentes.
 */
export function useIsMobile() {
  /**
   * Estado de detección de dispositivo móvil.
   *
   * @default undefined - Valor inicial antes de ejecutar efecto
   */
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  /**
   * Efecto de configuración de listener de media query.
   *
   * Configura MediaQueryList para breakpoint móvil, registra listener de cambios
   * y establece valor inicial. Limpia listener al desmontar componente.
   *
   * Notes:
   *   Media query construida:
   *     `(max-width: 767px)` para MOBILE_BREAKPOINT = 768
   *
   *   Flujo de ejecución:
   *     1. Crea MediaQueryList con max-width query
   *     2. Define función onChange que actualiza estado
   *     3. Registra onChange como listener del MediaQueryList
   *     4. Establece valor inicial basado en innerWidth actual
   *     5. Retorna cleanup function que remueve listener
   *
   *   Sincronización:
   *     El listener detecta cambios cuando viewport cruza breakpoint,
   *     sincronizando automáticamente con media queries CSS que usen
   *     mismo valor de breakpoint.
   */
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener('change', onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isMobile
}