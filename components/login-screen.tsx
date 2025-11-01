/**
 * login-screen.tsx
 *
 * Componente de pantalla de bienvenida con video introductorio. Reproduce animación
 * de entrada que finaliza con transición automática hacia la aplicación principal.
 *
 * Author: César Sánchez Montes
 * Course: Imagen Digital
 * Year: 2025
 * Version: 3.0.0
 *
 * Dependencies:
 *   - react: Gestión de estado y efectos con hooks
 *
 * Usage:
 *   import { LoginScreen } from '@/components/login-screen'
 *
 *   <LoginScreen onCompleteAction={() => setShowApp(true)} />
 *
 * Notes:
 *   Flujo de ejecución:
 *     1. Montaje del componente e intento de reproducción automática
 *     2. Reproducción de video introductorio (/animation.mp4)
 *     3. Al finalizar video: fade out de 1 segundo
 *     4. Callback onCompleteAction ejecutado tras transición
 *
 *   Características técnicas:
 *     - Video a pantalla completa con object-cover para mantener aspect ratio
 *     - Overlay oscuro (30% opacidad) sobre video para mejorar legibilidad
 *     - Reproducción automática con fallback silencioso si navegador bloquea
 *     - Atributo playsInline para compatibilidad iOS
 *     - Video muted para permitir autoplay en navegadores modernos
 */

"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Props del componente LoginScreen.
 */
interface LoginScreenProps {
    /**
     * Callback ejecutado tras finalizar animación de entrada.
     * Utilizado para transicionar hacia la aplicación principal.
     */
    onCompleteAction: () => void
}

/**
 * Componente LoginScreen.
 *
 * Renderiza pantalla de bienvenida con video introductorio a pantalla completa.
 * Gestiona reproducción automática, transiciones y navegación hacia contenido
 * principal mediante callback.
 *
 * @param onCompleteAction - Función callback ejecutada tras completar animación
 * @returns Contenedor de pantalla completa con video introductorio
 *
 * Notes:
 *   Gestión de reproducción:
 *     - useEffect inicial intenta reproducir video automáticamente
 *     - Captura y registra errores de autoplay (políticas del navegador)
 *     - Video configurado como muted para cumplir políticas de autoplay
 *
 *   Transición de salida:
 *     - handleVideoEnd establece videoEnded a true
 *     - Clase opacity-0 aplicada con duration-1000 (1 segundo)
 *     - setTimeout sincronizado con duración del fade out
 *     - onCompleteAction ejecutado tras completar transición visual
 *
 *   Capas visuales (z-index implícito por orden):
 *     1. Video de fondo (capa base)
 *     2. Overlay oscuro (bg-black/30)
 */
export function LoginScreen({ onCompleteAction }: LoginScreenProps) {
    /**
     * Referencia al elemento video del DOM.
     * Permite control programático de reproducción.
     */
    const videoRef = useRef<HTMLVideoElement>(null)

    /**
     * Estado de finalización del video.
     * Controla aplicación de transición de fade out.
     *
     * @default false - Video en reproducción o no iniciado
     */
    const [videoEnded, setVideoEnded] = useState(false)

    /**
     * Efecto de inicialización de reproducción automática.
     *
     * Se ejecuta una vez al montar el componente. Intenta reproducir video
     * automáticamente manejando posibles rechazos por políticas del navegador.
     *
     * Notes:
     *   Políticas de autoplay:
     *     - Navegadores modernos requieren interacción previa del usuario
     *     - Videos muted pueden reproducirse automáticamente sin interacción
     *     - Errores capturados y registrados sin interrumpir experiencia
     */
    useEffect(() => {
        const video = videoRef.current
        if (video) {
            video.play().catch((error) => {
                console.log("Autoplay prevented:", error)
            })
        }
    }, [])

    /**
     * Gestiona finalización del video e inicia transición de salida.
     *
     * Activa fade out de 1 segundo y programa ejecución de callback tras
     * completar transición visual para mantener sincronización entre
     * animación y cambio de estado.
     *
     * Notes:
     *   Sincronización temporal:
     *     - setVideoEnded(true): Activa clase opacity-0 con duration-1000
     *     - setTimeout(1000ms): Espera finalización de transición CSS
     *     - onCompleteAction(): Ejecuta navegación tras fade out completo
     */
    const handleVideoEnd = () => {
        setVideoEnded(true)
        setTimeout(() => {
            onCompleteAction()
        }, 1000)
    }

    return (
        <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-black">
            <div className={`absolute inset-0 transition-opacity duration-1000 ${videoEnded ? 'opacity-0' : 'opacity-100'}`}>
                <video
                    ref={videoRef}
                    className="absolute inset-0 h-full w-full object-cover"
                    onEnded={handleVideoEnd}
                    playsInline
                    muted
                    autoPlay
                >
                    <source src="/animation.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-black/30" />
            </div>
        </div>
    )
}