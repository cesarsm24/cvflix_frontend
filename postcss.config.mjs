/**
 * postcss.config.mjs
 *
 * Archivo de configuración de PostCSS. Define plugins de procesamiento CSS
 * utilizados durante compilación de estilos, específicamente integración con
 * Tailwind CSS v4.
 *
 * Author: César Sánchez Montes
 * Course: Imagen Digital
 * Year: 2025
 * Version: 3.0.0
 *
 * Dependencies:
 *   - postcss: Herramienta de transformación CSS
 *   - @tailwindcss/postcss: Plugin oficial de Tailwind CSS v4 para PostCSS
 *
 * Usage:
 *   Este archivo se carga automáticamente por el sistema de build de Next.js
 *   durante procesamiento de archivos CSS y aplicación de transformaciones.
 *
 * Notes:
 *   Plugins configurados:
 *     - @tailwindcss/postcss: Procesa directivas y clases de Tailwind CSS
 *
 *   Diferencias con Tailwind v3:
 *     Tailwind CSS v4 utiliza @tailwindcss/postcss en lugar de tailwindcss
 *     como plugin de PostCSS. Este plugin maneja todas las transformaciones
 *     de Tailwind incluyendo directivas @import, @theme y generación de
 *     clases utilitarias.
 *
 *   Orden de procesamiento:
 *     PostCSS procesa archivos CSS en orden según configuración de plugins.
 *     @tailwindcss/postcss debe ejecutarse antes que otros plugins que
 *     dependan de output de Tailwind (como autoprefixer, cssnano).
 */

/** @type {import('postcss-load-config').Config} */
const config = {
  /**
   * Definición de plugins de PostCSS.
   *
   * Objeto donde claves son nombres de plugins y valores son opciones
   * de configuración (objeto vacío para configuración por defecto).
   */
  plugins: {
    /**
     * Plugin de Tailwind CSS v4 para PostCSS.
     *
     * Procesa directivas de Tailwind (@import "tailwindcss") y genera
     * clases utilitarias basadas en configuración y uso en componentes.
     *
     * Configuración vacía {} utiliza valores por defecto:
     *   - Escaneo automático de archivos según extensiones comunes
     *   - Generación JIT (Just-In-Time) de clases
     *   - Purga automática de CSS no utilizado en producción
     */
    '@tailwindcss/postcss': {},
  },
}

export default config