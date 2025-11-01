/**
 * help-button.tsx
 *
 * Componente de botón de ayuda flotante con diálogo informativo y síntesis de voz.
 * Proporciona guía paso a paso sobre el funcionamiento de la aplicación mediante
 * interfaz visual y audio accesible.
 *
 * Author: César Sánchez Montes
 * Course: Imagen Digital
 * Year: 2025
 * Version: 3.0.0
 *
 * Dependencies:
 *   - react: Gestión de estado con hooks
 *   - lucide-react: Iconos de interfaz (HelpCircle, Volume2, VolumeX)
 *   - @/components/ui/button: Componente de botón reutilizable
 *   - @/components/ui/dialog: Componente de diálogo modal
 *
 * Usage:
 *   import { HelpButton } from '@/components/help-button'
 *
 *   <HelpButton />
 *
 * Notes:
 *   Características de accesibilidad:
 *     - Síntesis de voz mediante Web Speech API en español (es-ES)
 *     - Preferencia por voz Microsoft Elena si está disponible
 *     - Controles de reproducción: iniciar/detener lectura
 *     - Velocidad de lectura configurada a 0.9x para mayor claridad
 *     - Etiquetas ARIA para lectores de pantalla
 *
 *   Contenido del diálogo:
 *     - Paso 1: Instrucciones de carga de video (formatos, límites)
 *     - Paso 2: Descripción del proceso de análisis automático
 *     - Paso 3: Visualización de resultados y reportes
 *     - Paso 4: Exportación de informes en formato PDF
 */

"use client"

import { useState } from "react"
import { HelpCircle, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

/**
 * Componente HelpButton.
 *
 * Renderiza botón flotante de ayuda que abre diálogo modal con guía de uso.
 * Implementa funcionalidad de lectura en voz alta mediante Web Speech API
 * para mejorar accesibilidad.
 *
 * @returns Fragmento con botón flotante y diálogo modal
 *
 * Notes:
 *   Estado interno:
 *     - open: Controla visibilidad del diálogo
 *     - isSpeaking: Indica si la síntesis de voz está activa
 *
 *   Posicionamiento:
 *     - Botón flotante en esquina superior derecha
 *     - Posición absoluta: right-6 top-20
 *     - z-index 50 para superposición sobre contenido
 *     - Transición de escala en hover para feedback visual
 *
 *   Gestión de síntesis de voz:
 *     - Cancelación automática al cerrar diálogo
 *     - Limpieza de estado al finalizar o producirse error
 *     - Selección dinámica de voz española disponible
 */
export function HelpButton() {
    /**
     * Estado de visibilidad del diálogo modal.
     *
     * @default false - Diálogo cerrado inicialmente
     */
    const [open, setOpen] = useState(false)

    /**
     * Estado de reproducción de síntesis de voz.
     *
     * @default false - Sin reproducción activa
     */
    const [isSpeaking, setIsSpeaking] = useState(false)

    /**
     * Gestiona síntesis de voz para lectura del contenido de ayuda.
     *
     * Utiliza Web Speech API para convertir texto a voz. Si la síntesis está
     * activa, la detiene. Si está inactiva, inicia nueva lectura con configuración
     * en español y velocidad reducida.
     *
     * Notes:
     *   Configuración de síntesis:
     *     - Idioma: es-ES (español de España)
     *     - Velocidad: 0.9 (90% de velocidad normal)
     *     - Voz preferida: Microsoft Elena o primera voz española disponible
     *
     *   Eventos gestionados:
     *     - onend: Actualiza estado al finalizar lectura
     *     - onerror: Maneja errores y limpia estado
     */
    const handleSpeak = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel()
            setIsSpeaking(false)
            return
        }

        const text = `
            ¿Cómo funciona CVFlix?
            
            Paso 1: Sube tu video.
            Arrastra y suelta tu archivo de video o haz clic para seleccionarlo.
            Acepta formatos MP4, MOV, AVI y más. El tamaño máximo es de 500MB.
            
            Paso 2: Análisis automático.
            Nuestro sistema procesará tu video analizando planos cinematográficos,
            movimientos de cámara, paleta de colores, iluminación, composición,
            e identificación de actores y personajes.
            Este proceso puede tardar unos minutos dependiendo de la duración del video.
            
            Paso 3: Visualiza los resultados.
            Una vez completado el análisis, podrás ver tu video junto con un reporte
            detallado en el panel lateral. El reporte incluye estadísticas, gráficos
            y análisis técnico de tu contenido audiovisual.
            
            Paso 4: Descarga tu informe.
            Exporta el análisis completo en formato PDF para compartirlo,
            presentarlo o guardarlo como referencia para futuros proyectos.
        `

        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'es-ES'
        utterance.rate = 0.9

        const voices = window.speechSynthesis.getVoices()
        const elenaVoice = voices.find(v => v.name.includes('Elena')) || voices.find(v => v.lang === 'es-ES')
        if (elenaVoice) {
            utterance.voice = elenaVoice
        }

        utterance.onend = () => {
            setIsSpeaking(false)
        }

        utterance.onerror = () => {
            setIsSpeaking(false)
        }

        window.speechSynthesis.speak(utterance)
        setIsSpeaking(true)
    }

    /**
     * Gestiona cierre del diálogo y limpieza de recursos.
     *
     * Cancela síntesis de voz activa antes de cerrar el diálogo para evitar
     * reproducción en segundo plano y liberar recursos del navegador.
     */
    const handleClose = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel()
            setIsSpeaking(false)
        }
        setOpen(false)
    }

    return (
        <>
            {/* Botón flotante de ayuda */}
            <Button
                onClick={() => setOpen(true)}
                size="icon"
                variant="default"
                className="absolute right-6 top-20 z-50 h-12 w-12 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer"
                aria-label="Ayuda"
            >
                <HelpCircle className="h-6 w-6" />
            </Button>

            {/* Diálogo modal con contenido de ayuda */}
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent className="max-w-2xl max-h-[85vh] border-2 border-white mt-10">
                    <DialogHeader>
                        <div className="flex items-center justify-between pr-5">
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <HelpCircle className="h-5 w-5" />
                                ¿Cómo funciona CVFlix?
                            </DialogTitle>
                            <Button
                                onClick={handleSpeak}
                                size="icon"
                                variant="outline"
                                className="h-9 w-9 cursor-pointer"
                                aria-label={isSpeaking ? "Detener lectura" : "Leer en voz alta"}
                            >
                                {isSpeaking ? (
                                    <VolumeX className="h-4 w-4" />
                                ) : (
                                    <Volume2 className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        <DialogDescription className="sr-only">
                            Guía de uso de la aplicación
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="space-y-3">
                            {/* Paso 1: Carga de vídeo */}
                            <div className="flex gap-3">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                                    1
                                </div>
                                <div>
                                    <h3 className="font-semibold text-base mb-0.5">Sube tu vídeo</h3>
                                    <p className="text-muted-foreground text-sm text-justify">
                                        Arrastra y suelta tu archivo de vídeo o haz clic para seleccionarlo.
                                        Acepta formatos MP4, MOV, AVI y más. El tamaño máximo es de 500MB.
                                    </p>
                                </div>
                            </div>

                            {/* Paso 2: Análisis automático */}
                            <div className="flex gap-3">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                                    2
                                </div>
                                <div>
                                    <h3 className="font-semibold text-base mb-0.5">Análisis automático</h3>
                                    <p className="text-muted-foreground text-sm text-justify">
                                        Nuestro sistema procesará tu vídeo analizando planos cinematográficos,
                                        movimientos de cámara, paleta de colores, iluminación, composición,
                                        e identificación de actores y personajes.
                                        Este proceso puede tardar unos minutos dependiendo de la duración del vídeo.
                                    </p>
                                </div>
                            </div>

                            {/* Paso 3: Visualización de resultados */}
                            <div className="flex gap-3">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                                    3
                                </div>
                                <div>
                                    <h3 className="font-semibold text-base mb-0.5">Visualiza los resultados</h3>
                                    <p className="text-muted-foreground text-sm text-justify">
                                        Una vez completado el análisis, podrás ver tu vídeo junto con un reporte
                                        detallado en el panel lateral. El reporte incluye estadísticas, gráficos
                                        y análisis técnico de tu contenido audiovisual.
                                    </p>
                                </div>
                            </div>

                            {/* Paso 4: Exportación de informe */}
                            <div className="flex gap-3">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                                    4
                                </div>
                                <div>
                                    <h3 className="font-semibold text-base mb-0.5">Descarga tu informe</h3>
                                    <p className="text-muted-foreground text-sm text-justify">
                                        Exporta el análisis completo en formato PDF para compartirlo,
                                        presentarlo o guardarlo como referencia para futuros proyectos.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleClose}
                        className="w-full cursor-pointer"
                    >
                        Entendido
                    </Button>
                </DialogContent>
            </Dialog>
        </>
    )
}