/**
 * progress-sidebar.tsx
 *
 * Componente de barra lateral de progreso para visualización en tiempo real del
 * procesamiento de video. Muestra etapas del análisis, métricas de rendimiento
 * y estadísticas de detección.
 *
 * Author: César Sánchez Montes
 * Course: Imagen Digital
 * Year: 2025
 * Version: 3.0.0
 *
 * Dependencies:
 *   - react: Gestión de estado y efectos con hooks
 *   - lucide-react: Iconos de interfaz (Loader2, CheckCircle2, Circle, XCircle)
 *   - @/components/ui/button: Componente de botón reutilizable
 *   - @/lib/types: Definición de tipos TypeScript
 *
 * Usage:
 *   import { ProgressSidebar } from '@/components/progress-sidebar'
 *
 *   <ProgressSidebar
 *     currentStep="Detectando rostros"
 *     progress={45}
 *     facesDetected={12}
 *     shotsAnalyzed={156}
 *     processingSpeed={2.5}
 *     estimatedTime={120}
 *     onCancel={() => handleCancel()}
 *   />
 *
 * Notes:
 *   Estructura de pasos de procesamiento:
 *     - Inicio: Carga inicial del video
 *     - Datos: Obtención de información de TMDB y actores
 *     - Análisis: Inicialización del sistema
 *     - Rostros: Detección, reconocimiento y análisis emocional
 *     - Cinematografía: Análisis de planos, composición, iluminación y color
 *     - Finalización: Generación de datos y preparación de informe
 *
 *   Animaciones implementadas:
 *     - Barra de progreso con transición suave mediante interpolación
 *     - Indicadores de estado animados (spinner en paso actual)
 *     - Revelación progresiva de pasos mediante visibleSteps
 *     - Pulso en indicador de procesamiento activo
 */

import { Loader2, CheckCircle2, Circle, XCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import type { ProcessingStep } from "@/lib/types"

/**
 * Definición de etapas del proceso de análisis de video.
 *
 * Array ordenado de pasos que representa el flujo completo del pipeline de
 * procesamiento. Cada paso incluye etiqueta descriptiva, icono emoji y
 * sección para agrupación visual.
 */
export const PROCESSING_STEPS: ProcessingStep[] = [
    { label: "Cargando video", icon: "▶️", section: "Inicio" },
    { label: "Obteniendo reparto de TMDB", icon: "🎬", section: "Datos" },
    { label: "Cargando fotos de actores", icon: "👥", section: "Datos" },
    { label: "Inicializando análisis", icon: "🎥", section: "Análisis" },
    { label: "Detectando rostros", icon: "👤", section: "Rostros" },
    { label: "Reconociendo actores", icon: "🔍", section: "Rostros" },
    { label: "Detectando emociones", icon: "😊", section: "Rostros" },
    { label: "Analizando tipos de plano", icon: "📐", section: "Cinematografía" },
    { label: "Analizando composición", icon: "✨", section: "Cinematografía" },
    { label: "Detectando iluminación", icon: "💡", section: "Cinematografía" },
    { label: "Analizando colores", icon: "🎨", section: "Cinematografía" },
    { label: "Detectando movimiento de cámara", icon: "🎞️", section: "Cinematografía" },
    { label: "Generando datos para gráficos", icon: "📊", section: "Finalización" },
    { label: "Preparando informe final", icon: "📋", section: "Finalización" }
]

/**
 * Props del componente ProgressSidebar.
 */
interface ProgressSidebarProps {
    /** Etiqueta del paso actual en ejecución */
    currentStep: string
    /** Porcentaje de progreso total del análisis [0-100] */
    progress: number
    /** Número de rostros detectados hasta el momento */
    facesDetected?: number
    /** Número de planos cinematográficos analizados */
    shotsAnalyzed?: number
    /** Información de optimizaciones aplicadas al procesamiento */
    optimizationInfo?: {
        faceSkip?: number
        analysisSkip?: number
        compression?: boolean
    }
    /** Velocidad de procesamiento en frames por segundo */
    processingSpeed?: number
    /** Tiempo estimado restante en segundos */
    estimatedTime?: number
    /** Callback para cancelar el procesamiento */
    onCancel?: () => void
}

/**
 * Componente ProgressSidebar.
 *
 * Renderiza barra lateral con visualización detallada del progreso de análisis.
 * Implementa sistema de pasos agrupados por sección, métricas en tiempo real
 * y control de cancelación.
 *
 * @param currentStep - Paso actual en ejecución del pipeline
 * @param progress - Porcentaje de completitud del análisis
 * @param facesDetected - Contador de rostros detectados
 * @param shotsAnalyzed - Contador de planos analizados
 * @param processingSpeed - Velocidad de procesamiento en fps
 * @param estimatedTime - Tiempo restante estimado en segundos
 * @param onCancel - Función para cancelar el procesamiento
 * @returns Panel lateral con información de progreso
 *
 * Notes:
 *   Estados internos:
 *     - animatedProgress: Progreso con interpolación suave
 *     - visibleSteps: Índices de pasos visibles actualmente
 *     - fps: Velocidad de procesamiento redondeada
 *
 *   Efectos implementados:
 *     - Interpolación de barra de progreso cada 50ms
 *     - Actualización de fps redondeado a 1 decimal
 *     - Gestión de visibilidad de pasos (actual y siguiente)
 *
 *   Estructura visual:
 *     - Encabezado: Título, barra de progreso y métricas
 *     - Cuerpo: Lista de pasos agrupados por sección
 *     - Footer: Indicador de estado y botón de cancelación
 */
export function ProgressSidebar({
                                    currentStep,
                                    progress,
                                    facesDetected = 0,
                                    shotsAnalyzed = 0,
                                    processingSpeed = 0,
                                    estimatedTime = 0,
                                    onCancel
                                }: ProgressSidebarProps) {
    /**
     * Progreso animado con interpolación suave.
     * Evita saltos bruscos en la barra de progreso.
     *
     * @default 0
     */
    const [animatedProgress, setAnimatedProgress] = useState(0)

    /**
     * Índices de pasos visibles en la lista.
     * Controla revelación progresiva de pasos del proceso.
     *
     * @default []
     */
    const [visibleSteps, setVisibleSteps] = useState<number[]>([])

    /**
     * Velocidad de procesamiento redondeada.
     * Valor en frames por segundo con 1 decimal.
     *
     * @default 0
     */
    const [fps, setFps] = useState(0)

    /** Índice del paso actual en el array PROCESSING_STEPS */
    const currentStepIndex = PROCESSING_STEPS.findIndex(s => s.label === currentStep)

    /**
     * Efecto de interpolación suave de progreso.
     *
     * Actualiza animatedProgress gradualmente cada 50ms aplicando
     * interpolación lineal del 15% de la diferencia. Proporciona
     * transición visual fluida en la barra de progreso.
     */
    useEffect(() => {
        const interval = setInterval(() => {
            setAnimatedProgress(prev => {
                const diff = progress - prev
                if (Math.abs(diff) < 0.1) return progress
                return prev + diff * 0.15
            })
        }, 50)
        return () => clearInterval(interval)
    }, [progress])

    /**
     * Efecto de actualización de velocidad de procesamiento.
     *
     * Redondea processingSpeed a 1 decimal para visualización limpia.
     */
    useEffect(() => {
        if (processingSpeed > 0) {
            setFps(Math.round(processingSpeed * 10) / 10)
        }
    }, [processingSpeed])

    /**
     * Efecto de gestión de visibilidad de pasos.
     *
     * Agrega paso actual y siguiente a la lista de visibles.
     * Implementa revelación progresiva conforme avanza el procesamiento.
     */
    useEffect(() => {
        if (currentStepIndex >= 0) {
            setVisibleSteps(prev => {
                const newVisible = [...prev]
                if (!newVisible.includes(currentStepIndex)) {
                    newVisible.push(currentStepIndex)
                    if (currentStepIndex + 1 < PROCESSING_STEPS.length) {
                        newVisible.push(currentStepIndex + 1)
                    }
                }
                return newVisible
            })
        }
    }, [currentStepIndex])

    /**
     * Agrupa pasos por sección para organización visual.
     *
     * Reduce PROCESSING_STEPS a objeto indexado por sección,
     * añadiendo índice original a cada paso.
     */
    const groupedSteps = Object.entries(
        PROCESSING_STEPS.reduce((acc, step, idx) => {
            if (!acc[step.section]) acc[step.section] = []
            acc[step.section].push({ ...step, index: idx })
            return acc
        }, {} as Record<string, any[]>)
    )

    /**
     * Formatea tiempo en segundos a formato legible.
     *
     * @param seconds - Tiempo en segundos a formatear
     * @returns String formateado como "Xs" o "Xm Ys"
     *
     * Notes:
     *   Formatos de salida:
     *     - < 60 segundos: "45s"
     *     - >= 60 segundos: "2m 15s"
     */
    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${Math.round(seconds)}s`
        const mins = Math.floor(seconds / 60)
        const secs = Math.round(seconds % 60)
        return `${mins}m ${secs}s`
    }

    return (
        <div className="w-96 h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black border-l border-zinc-800 flex flex-col overflow-hidden">
            {/* Sección de encabezado con título y barra de progreso */}
            <div className="p-6 pb-4 border-b border-zinc-800">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-10 bg-red-600 rounded-full"></div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Procesamiento</h2>
                        <p className="text-xs text-zinc-400">Análisis en progreso</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-sm">Progreso</span>
                        <span className="text-red-500 font-bold text-lg">{Math.round(animatedProgress)}%</span>
                    </div>

                    <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-300"
                            style={{ width: `${animatedProgress}%` }}
                        />
                    </div>

                    {/* Tarjetas de métricas de detección */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-zinc-800/50 rounded-lg p-2.5">
                            <p className="text-xs text-zinc-400 mb-1">Rostros</p>
                            <p className="text-xl font-bold text-red-400">{facesDetected}</p>
                        </div>
                        <div className="bg-zinc-800/50 rounded-lg p-2.5">
                            <p className="text-xs text-zinc-400 mb-1">Planos</p>
                            <p className="text-xl font-bold text-blue-400">{shotsAnalyzed}</p>
                        </div>
                    </div>

                    {/* Indicador de velocidad de procesamiento */}
                    {fps > 0 && (
                        <div className="flex items-center justify-between text-xs bg-zinc-800/30 rounded-lg p-2 mt-2">
                            <span className="text-zinc-400">Velocidad</span>
                            <span className="text-green-400 font-semibold">{fps} fps</span>
                        </div>
                    )}

                    {/* Indicador de tiempo estimado restante */}
                    {estimatedTime > 0 && (
                        <div className="flex items-center justify-between text-xs text-zinc-400">
                            <span>Tiempo restante</span>
                            <span className="font-mono text-red-400">{formatTime(estimatedTime)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Sección de lista de pasos agrupados por sección */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {groupedSteps.map(([section, steps]) => (
                    <div key={section}>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-px flex-1 bg-zinc-800"></div>
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-2">
                                {section}
                            </span>
                            <div className="h-px flex-1 bg-zinc-800"></div>
                        </div>

                        <div className="space-y-2">
                            {steps.map((step) => {
                                const isCompleted = step.index < currentStepIndex
                                const isCurrent = step.index === currentStepIndex
                                const isPending = step.index > currentStepIndex
                                const isVisible = visibleSteps.includes(step.index) || isCompleted || isCurrent

                                if (!isVisible) return null

                                return (
                                    <div
                                        key={step.label}
                                        className={`flex items-start gap-3 rounded-lg border transition-all duration-300 p-3 ${
                                            isCurrent
                                                ? "border-red-600 bg-red-600/10"
                                                : isCompleted
                                                    ? "border-zinc-700 bg-zinc-800/30"
                                                    : "border-zinc-800 bg-zinc-900/20 opacity-50"
                                        }`}
                                    >
                                        <div className="mt-0.5 flex-shrink-0">
                                            {isCompleted && (
                                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                            )}
                                            {isCurrent && (
                                                <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                                            )}
                                            {isPending && (
                                                <Circle className="w-5 h-5 text-zinc-700" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p
                                                className={`text-sm font-medium truncate ${
                                                    isCurrent
                                                        ? "text-white"
                                                        : isCompleted
                                                            ? "text-zinc-300"
                                                            : "text-zinc-600"
                                                }`}
                                            >
                                                {step.label}
                                            </p>
                                            {isCurrent && (
                                                <p className="text-xs text-red-400 mt-1">En proceso...</p>
                                            )}
                                            {isCompleted && (
                                                <p className="text-xs text-green-500/70 mt-1">Completado</p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Sección de footer con indicador de estado y botón de cancelación */}
            <div className="p-6 space-y-3 border-t border-zinc-800 bg-black/50">
                <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-zinc-400">Procesando</span>
                    </div>
                </div>

                {onCancel && (
                    <Button
                        onClick={onCancel}
                        variant="destructive"
                        className="w-full cursor-pointer bg-red-600 hover:bg-red-700 text-white font-semibold transition-all"
                    >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancelar Análisis
                    </Button>
                )}
            </div>
        </div>
    )
}