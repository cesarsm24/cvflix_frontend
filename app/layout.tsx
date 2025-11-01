/**
 * layout.tsx
 *
 * Componente raíz del layout de la aplicación Next.js. Define la estructura HTML
 * base, metadatos SEO y configuración global de estilos y analytics.
 *
 * Author: César Sánchez Montes
 * Course: Imagen Digital
 * Year: 2025
 * Version: 3.0.0
 *
 * Dependencies:
 *   - next: Framework React para aplicaciones web
 *   - next/font/google: Carga optimizada de fuentes de Google
 *   - @vercel/analytics: Servicio de analytics de Vercel
 *
 * Usage:
 *   El layout se aplica automáticamente a todas las páginas de la aplicación
 *   mediante el sistema de routing de Next.js App Router.
 */

import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

/**
 * Fuente principal Geist con subset latino.
 * Fuente sans-serif optimizada para interfaces de usuario.
 */
const _geist = Geist({ subsets: ["latin"] });

/**
 * Fuente monoespaciada Geist Mono con subset latino.
 * Utilizada para código y contenido técnico.
 */
const _geistMono = Geist_Mono({ subsets: ["latin"] });

/**
 * Metadatos de la aplicación.
 *
 * Define información SEO fundamental incluyendo título y descripción.
 * Utilizado por navegadores, motores de búsqueda y plataformas de redes sociales.
 */
export const metadata: Metadata = {
    title: 'CVFlix',
    description: 'CVFlix es una aplicación web que utiliza OpenCV para analizar escenas de películas o series. ' +
        'Detecta planos cinematográficos, iluminación, colores dominantes y actores presentes, y genera ' +
        'un informe visual detallado para cineastas y creadores de contenido.'
}

/**
 * Componente raíz del layout de la aplicación.
 *
 * Configura la estructura HTML base con idioma español, aplica estilos globales
 * mediante clases de Tailwind CSS e integra el sistema de analytics de Vercel
 * para seguimiento de métricas de uso.
 *
 * @param children - Componentes hijos que se renderizarán dentro del layout.
 *                   Incluye todas las páginas y componentes de la aplicación
 * @returns Estructura HTML completa con configuración global aplicada
 *
 * Notes:
 *   - El atributo lang="es" mejora accesibilidad y SEO para contenido en español
 *   - Las clases font-sans y antialiased optimizan la renderización tipográfica
 *   - Analytics se renderiza al final del body para no bloquear contenido principal
 */
export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="es">
        <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
        </body>
        </html>
    )
}