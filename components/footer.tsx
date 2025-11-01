/**
 * footer.tsx
 *
 * Componente de pie de página de la aplicación. Muestra información de copyright,
 * autoría del proyecto y atribución de fuentes de datos externas.
 *
 * Author: César Sánchez Montes
 * Course: Imagen Digital
 * Year: 2025
 * Version: 3.0.0
 *
 * Dependencies:
 *   - react: Librería base de componentes
 *
 * Usage:
 *   import { Footer } from '@/components/footer'
 *
 *   <Footer />
 *
 * Notes:
 *   Estructura de layout:
 *     - Distribución horizontal en tres columnas mediante flexbox
 *     - Columna izquierda: Aviso de copyright
 *     - Columna central: Información de autoría y contexto académico
 *     - Columna derecha: Atribución de TMDB como proveedor de datos
 *
 *   Responsividad:
 *     - Tamaños de texto adaptativos: xs en móvil, sm en desktop
 *     - Logo TMDB escalable: 60px en móvil, 100px en desktop
 *     - Padding y espaciado ajustables mediante breakpoints de Tailwind
 */

/**
 * Componente Footer.
 *
 * Renderiza pie de página con diseño tripartito que incluye información legal,
 * créditos de desarrollo y atribución de API externa. Implementa estilos
 * semitransparentes para integración visual con el tema oscuro.
 *
 * @returns Elemento footer con contenido informativo y enlaces externos
 *
 * Notes:
 *   Estilos aplicados:
 *     - bg-black/20: Fondo negro con 20% de opacidad
 *     - border-white/30: Borde superior blanco con 30% de opacidad
 *     - text-gray-400: Texto secundario en gris medio
 *     - text-foreground: Texto destacado con color primario del tema
 *
 *   Accesibilidad:
 *     - Enlace externo con rel="noopener noreferrer" para seguridad
 *     - Atributo target="_blank" para apertura en nueva pestaña
 *     - Atributo alt descriptivo en imagen de logo
 *     - loading="lazy" para carga diferida de imagen
 */
export function Footer() {
    return (
        <footer className="bg-black/20 text-foreground border-t border-white/30">
            <div className="container mx-auto py-6 px-4">
                <div className="flex items-center justify-between gap-4">
                    {/* Sección izquierda: Aviso de copyright */}
                    <div className="flex-1 text-left">
                        <p className="text-xs md:text-sm text-gray-400">
                            © 2025 Todos los derechos reservados
                        </p>
                    </div>

                    {/* Sección central: Información de autoría */}
                    <div className="flex-1 text-center">
                        <p className="text-xs md:text-sm text-gray-400">
                            Desarrollado por{" "}
                            <span className="text-foreground font-medium">
                César Sánchez Montes
              </span>
                        </p>
                        <p className="text-xs md:text-sm text-gray-400 mt-1">
                            Asignatura de Imagen Digital • 2025
                        </p>
                    </div>

                    {/* Sección derecha: Atribución de TMDB */}
                    <div className="flex-1 flex items-center justify-end gap-2">
                        <p className="text-xs md:text-sm text-gray-400">
                            Film Data provided by
                        </p>
                        <a
                            href="https://www.themoviedb.org/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <img
                                alt="TMDB Logo"
                                loading="lazy"
                                width="100"
                                height="17"
                                decoding="async"
                                className="w-[60px] h-[17px] md:w-[100px] md:h-auto"
                                src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
                            />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}