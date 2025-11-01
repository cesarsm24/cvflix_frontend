/**
 * theme-provider.tsx
 *
 * Componente proveedor de contexto de temas para la aplicación. Envuelve next-themes
 * para proporcionar funcionalidad de cambio de tema (claro/oscuro) a toda la aplicación.
 *
 * Author: César Sánchez Montes
 * Course: Imagen Digital
 * Year: 2025
 * Version: 3.0.0
 *
 * Dependencies:
 *   - react: Librería base de componentes
 *   - next-themes: Sistema de gestión de temas para Next.js
 *
 * Usage:
 *   import { ThemeProvider } from '@/components/theme-provider'
 *
 *   <ThemeProvider attribute="class" defaultTheme="dark">
 *     <App />
 *   </ThemeProvider>
 *
 * Notes:
 *   Este componente actúa como wrapper de NextThemesProvider para mantener
 *   consistencia en la arquitectura de la aplicación y facilitar futuras
 *   extensiones de funcionalidad relacionada con temas.
 *
 *   Configuración recomendada:
 *     - attribute="class": Aplica tema mediante clase CSS en elemento root
 *     - defaultTheme="dark": Tema inicial de la aplicación
 *     - enableSystem: Detecta preferencia de sistema operativo
 *     - storageKey: Clave para persistencia en localStorage
 */

'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

/**
 * Componente ThemeProvider.
 *
 * Proveedor de contexto de temas que envuelve NextThemesProvider de next-themes.
 * Permite acceso global a funcionalidad de cambio de tema mediante hook useTheme
 * en componentes descendientes.
 *
 * @param children - Componentes hijos que tendrán acceso al contexto de tema
 * @param props - Props adicionales pasadas directamente a NextThemesProvider
 * @returns Proveedor de contexto con configuración de temas
 *
 * Notes:
 *   Directiva "use client":
 *     Necesaria porque next-themes requiere APIs del navegador (localStorage,
 *     matchMedia) no disponibles en Server Components de Next.js.
 *
 *   Spread de props:
 *     Todas las props de ThemeProviderProps se pasan directamente al proveedor
 *     subyacente, permitiendo configuración flexible desde componente padre.
 *
 *   Acceso al contexto:
 *     Componentes descendientes pueden usar: const { theme, setTheme } = useTheme()
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}