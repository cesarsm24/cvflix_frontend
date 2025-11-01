/**
 * next.config.mjs
 *
 * Archivo de configuración de Next.js. Define opciones de compilación,
 * optimización de imágenes y comportamiento del servidor de desarrollo.
 *
 * Author: César Sánchez Montes
 * Course: Imagen Digital
 * Year: 2025
 * Version: 3.0.0
 *
 * Dependencies:
 *   - next: Framework Next.js
 *
 * Usage:
 *   Este archivo se carga automáticamente por Next.js al iniciar el servidor
 *   de desarrollo o durante el proceso de build de producción.
 *
 * Notes:
 *   Configuraciones aplicadas:
 *     - typescript.ignoreBuildErrors: Permite build con errores TypeScript
 *     - images.unoptimized: Desactiva optimización automática de imágenes
 *     - devIndicators: Oculta indicadores de desarrollo en UI
 *
 *   Propósito de cada opción:
 *     ignoreBuildErrors:
 *       Útil durante desarrollo activo o cuando se priorizan deploys rápidos
 *       sobre seguridad de tipos. No recomendado para producción final.
 *
 *     unoptimized:
 *       Desactiva procesamiento de imágenes por Next.js Image Optimization API.
 *       Necesario cuando se despliega en hosting estático o sin Node.js server.
 *       Reduce tiempo de build pero elimina optimizaciones automáticas.
 *
 *     devIndicators:
 *       Oculta indicadores visuales de prerendering y compilación en desarrollo.
 *       Proporciona interfaz más limpia durante desarrollo y demostraciones.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Configuración de TypeScript.
   *
   * Controla comportamiento del compilador TypeScript durante build.
   */
  typescript: {
    /**
     * Ignora errores de TypeScript durante build de producción.
     *
     * Permite completar build exitosamente incluso con errores de tipos.
     * Útil para iteración rápida pero puede ocultar problemas potenciales.
     *
     * @default false - Build falla ante errores TypeScript
     */
    ignoreBuildErrors: true,
  },

  /**
   * Configuración de optimización de imágenes.
   *
   * Controla procesamiento de imágenes por Next.js Image component.
   */
  images: {
    /**
     * Desactiva optimización automática de imágenes.
     *
     * Sirve imágenes sin procesamiento, útil para exports estáticos
     * o cuando se utiliza CDN externo para optimización.
     *
     * @default false - Optimización habilitada
     */
    unoptimized: true,
  },

  /**
   * Desactiva indicadores de desarrollo en UI.
   *
   * Oculta overlays de prerendering y compilación en modo desarrollo
   * para interfaz más limpia durante pruebas y demostraciones.
   *
   * @default true - Indicadores visibles
   */
  devIndicators: false,
}

export default nextConfig;