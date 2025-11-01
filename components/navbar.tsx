/**
 * navbar.tsx
 *
 * Componente de barra de navegación superior de la aplicación. Muestra logotipo
 * de la marca con enlace a página principal.
 *
 * Author: César Sánchez Montes
 * Course: Imagen Digital
 * Year: 2025
 * Version: 3.0.0
 *
 * Dependencies:
 *   - next/image: Componente optimizado de imágenes de Next.js
 *   - next/link: Componente de navegación client-side de Next.js
 *
 * Usage:
 *   import { Navbar } from '@/components/navbar'
 *
 *   <Navbar />
 *
 * Notes:
 *   Optimizaciones aplicadas:
 *     - Image component con priority para carga inmediata del logo
 *     - Dimensiones fijas (60x60) para evitar layout shift
 *     - height auto calculada para mantener aspect ratio
 *     - Transición de escala en hover para feedback visual
 *
 *   Estilos aplicados:
 *     - Altura fija: h-16 (64px)
 *     - Fondo: bg-card (color de tema)
 *     - Borde inferior con opacidad: border-white/30
 *     - Padding horizontal: px-8
 *     - Margen izquierdo del logo: ml-24 para espaciado adicional
 */

import Image from "next/image"
import Link from "next/link"

/**
 * Componente Navbar.
 *
 * Renderiza barra de navegación superior con logotipo centrado verticalmente.
 * Implementa navegación mediante Link de Next.js para transiciones optimizadas
 * sin recarga de página.
 *
 * @returns Elemento nav con estructura de barra de navegación
 *
 * Notes:
 *   Características del logo:
 *     - Dimensiones originales: 60x60 píxeles
 *     - Altura renderizada: 48px (h-12)
 *     - Ancho calculado automáticamente manteniendo proporción
 *     - Transición de escala: hover:scale-105 (105% en hover)
 *     - Duración de transición: 200ms
 *
 *   Accesibilidad:
 *     - Atributo alt descriptivo para lectores de pantalla
 *     - Cursor pointer para indicar interactividad
 *     - Link envolvente para área clickeable ampliada
 */
export function Navbar() {
    return (
        <nav className="bg-card border-b border-white/30 shadow-md">
            <div className="flex h-16 items-center px-8">
                {/* Sección de logo con espaciado adicional */}
                <div className="flex items-center gap-3 ml-24">
                    <Link href="/" className="flex items-center">
                        <Image
                            src="/logo.png"
                            alt="CVFlix Logo"
                            width={60}
                            height={60}
                            className="h-12 w-auto cursor-pointer transition-transform duration-200 hover:scale-105"
                            priority
                        />
                    </Link>
                </div>
            </div>
        </nav>
    )
}