/**
 * types.ts
 *
 * Definiciones de tipos TypeScript para el sistema de análisis cinematográfico.
 * Especifica interfaces para estados, reportes, datos de streaming SSE y estructuras
 * de datos para visualizaciones y métricas del análisis.
 *
 * Author: César Sánchez Montes
 * Course: Imagen Digital
 * Year: 2025
 * Version: 3.0.0
 *
 * Dependencies:
 *   Ninguna - Archivo de tipos puros sin dependencias externas
 *
 * Usage:
 *   import type { AnalysisReport, DetectedActor, SSEFrameData } from '@/lib/types'
 *
 *   const report: AnalysisReport = {
 *     title: "Blade Runner 2049",
 *     duration: "2:43",
 *     shots: 1250,
 *     detectedActors: [...],
 *     ...
 *   }
 *
 * Notes:
 *   Categorías de tipos:
 *     - Estados de procesamiento: ProcessingStatus, ProcessingStep
 *     - Detección de actores: DetectedActor
 *     - Análisis cinematográfico: ShotTypesSummary, LightingSummary, etc.
 *     - Paleta de colores: ColorPalette, ColorAnalysisSummary
 *     - Datos para gráficos: HistogramData, CameraTimelinePoint, CompositionData
 *     - Datos temporales: TemporalData, KeyFrame
 *     - Reporte completo: AnalysisReport
 *     - Streaming SSE: SSEFrameData
 *
 *   Convenciones:
 *     - Interfaces para objetos estructurados
 *     - Types para uniones y aliases
 *     - Propiedades opcionales con '?' donde aplique
 *     - Nombres descriptivos en español para dominio de negocio
 */

/**
 * Estados posibles del proceso de análisis.
 *
 * - idle: Estado inicial sin procesamiento activo
 * - uploading: Archivo en proceso de carga al servidor
 * - processing: Análisis en ejecución
 * - completed: Análisis finalizado con éxito
 */
export type ProcessingStatus = "idle" | "uploading" | "processing" | "completed"

/**
 * Paso individual del proceso de análisis.
 *
 * Define estructura de cada etapa mostrada en barra de progreso.
 */
export interface ProcessingStep {
    /** Etiqueta descriptiva del paso */
    label: string
    /** Emoji representativo del paso */
    icon: string
    /** Sección a la que pertenece el paso para agrupación visual */
    section: string
}

/**
 * Actor detectado mediante reconocimiento facial.
 *
 * Contiene información del actor, personaje interpretado y métricas
 * de detección y similitud.
 */
export interface DetectedActor {
    /** ID único del actor en TMDB */
    actor_id: number
    /** Nombre completo del actor */
    nombre: string
    /** Nombre del personaje interpretado */
    personaje: string
    /** URL de la foto del actor desde TMDB */
    foto_url: string
    /** Número total de detecciones en el video */
    detecciones: number
    /** Porcentaje de similitud promedio */
    similitud: number
    /** Porcentaje de similitud más alto registrado */
    similitud_maxima?: number
}

/**
 * Resumen de distribución de tipos de plano cinematográfico.
 *
 * Agrupa resultados del análisis de encuadres detectados en el video.
 */
export interface ShotTypesSummary {
    /** Número total de frames analizados */
    total_analyzed: number
    /** Distribución de tipos de plano con sus frecuencias */
    distribution: Record<string, number>
    /** Tipo de plano más frecuente */
    most_common?: string
}

/**
 * Resumen de análisis de iluminación.
 *
 * Incluye distribución de tipos de iluminación y análisis de exposición.
 */
export interface LightingSummary {
    /** Número total de frames analizados */
    total_analyzed: number
    /** Distribución de tipos de iluminación con frecuencias */
    distribution: Record<string, number>
    /** Tipo de iluminación más frecuente */
    most_common?: string
    /** Análisis detallado de exposición */
    exposure?: {
        /** Distribución de píxeles por zona tonal */
        zones: {
            shadows: number
            midtones: number
            highlights: number
        }
        /** Número de píxeles sobreexpuestos */
        overexposed_pixels: number
        /** Número de píxeles subexpuestos */
        underexposed_pixels: number
    }
}

/**
 * Resumen de análisis de emociones faciales.
 *
 * Agrupa resultados de detección emocional en rostros identificados.
 */
export interface EmotionsSummary {
    /** Número total de rostros con emoción detectada */
    total_detected: number
    /** Distribución de emociones con frecuencias */
    distribution: Record<string, number>
    /** Emoción más frecuente */
    most_common?: string
}

/**
 * Color individual de paleta cromática.
 *
 * Define estructura de color con múltiples representaciones y métricas.
 */
export interface ColorPalette {
    /** Representación hexadecimal del color */
    hex: string
    /** Valores RGB como array [r, g, b] */
    rgb: number[]
    /** Nombre descriptivo del color */
    name: string
    /** Porcentaje de presencia en paleta global */
    percentage?: number
    /** Frecuencia de aparición en frames */
    frequency?: number
    /** Número de frames donde aparece el color */
    appearances?: number
}

/**
 * Resumen de análisis cromático del video.
 *
 * Incluye temperatura de color, esquemas cromáticos y paleta global.
 */
export interface ColorAnalysisSummary {
    /** Distribución de temperaturas de color (cálido/frío/neutro) */
    temperature_distribution: Record<string, number>
    /** Temperatura de color más frecuente */
    most_common_temperature?: string
    /** Distribución de esquemas cromáticos */
    color_scheme_distribution: Record<string, number>
    /** Esquema cromático más frecuente */
    most_common_scheme?: string
    /** Paleta de colores dominantes del video completo */
    global_palette?: ColorPalette[]
    /** Diferencia promedio de matiz entre frames consecutivos */
    avg_hue_difference?: number
}

/**
 * Resumen de análisis de movimiento de cámara.
 *
 * Agrupa resultados de detección de movimientos cinematográficos.
 */
export interface CameraSummary {
    /** Número total de frames analizados */
    total_analyzed: number
    /** Distribución de tipos de movimiento con frecuencias */
    distribution: Record<string, number>
    /** Tipo de movimiento más frecuente */
    most_common?: string
}

/**
 * Datos de histograma RGB para visualización.
 *
 * Contiene distribución acumulada de valores de cada canal de color.
 */
export interface HistogramData {
    /** Array de 256 valores para canal rojo */
    r: number[]
    /** Array de 256 valores para canal verde */
    g: number[]
    /** Array de 256 valores para canal azul */
    b: number[]
    /** Número de frames procesados para el histograma */
    frames_count: number
}

/**
 * Punto individual en timeline de movimiento de cámara.
 *
 * Representa estado de cámara en frame específico.
 */
export interface CameraTimelinePoint {
    /** Número de frame */
    frame: number
    /** Tipo de movimiento detectado */
    type: string
    /** Intensidad del movimiento [0-1] */
    intensity: number
}

/**
 * Datos detallados de análisis de composición.
 *
 * Arrays paralelos con métricas de composición por frame.
 */
export interface CompositionData {
    /** Scores de regla de tercios por frame */
    rule_of_thirds_scores: number[]
    /** Scores de simetría por frame */
    symmetry_scores: number[]
    /** Scores de balance visual por frame */
    balance_scores: number[]
    /** Conteo de líneas detectadas por frame */
    lines_count: number[]
}

/**
 * Resumen agregado de análisis de composición.
 *
 * Métricas promediadas de composición visual del video.
 */
export interface CompositionSummary {
    /** Número total de frames analizados */
    total_analyzed: number
    /** Score promedio de regla de tercios */
    avg_rule_of_thirds?: number
    /** Score promedio de simetría */
    avg_symmetry?: number
    /** Score promedio de balance visual */
    avg_balance?: number
    /** Promedio de líneas detectadas por frame */
    avg_lines?: number
}

/**
 * Datos temporales para visualizaciones de timeline.
 *
 * Series temporales de diferentes métricas a lo largo del video.
 */
export interface TemporalData {
    /** Timeline de emociones: [frame, emoción] */
    emotions_timeline: Array<[number, string]>
    /** Timeline de tipos de plano: [frame, tipo] */
    shot_types_timeline: Array<[number, string]>
    /** Timeline de iluminación: [frame, tipo] */
    lighting_timeline: Array<[number, string]>
    /** Timeline de conteo de rostros: [frame, cantidad] */
    faces_timeline: Array<[number, number]>
}

/**
 * Frame clave del video con contexto.
 *
 * Representa momento significativo extraído del análisis.
 */
export interface KeyFrame {
    /** Número del frame en el video */
    frame_number: number
    /** Frame codificado en Base64 */
    frame_base64: string
    /** Razón por la cual este frame es significativo */
    reason: string
}

/**
 * Reporte completo de análisis cinematográfico.
 *
 * Estructura principal que agrupa todos los resultados del análisis
 * incluyendo actores detectados, métricas cinematográficas y datos
 * para visualizaciones.
 */
export interface AnalysisReport {
    /** Título del contenido analizado */
    title: string
    /** Duración formateada del video */
    duration: string
    /** Número total de frames analizados */
    shots: number
    /** Array de actores detectados ordenados por frecuencia */
    detectedActors: DetectedActor[]
    /** Lista de planos cinematográficos detectados */
    cinematicPlanes: string[]
    /** Tipo de iluminación predominante */
    lighting?: string
    /** Descripción de composición visual */
    composition?: string
    /** Resumen de tipos de plano */
    shot_types_summary?: ShotTypesSummary
    /** Resumen de análisis de iluminación */
    lighting_summary?: LightingSummary
    /** Resumen de análisis de emociones */
    emotions_summary?: EmotionsSummary
    /** Resumen de análisis cromático */
    color_analysis_summary?: ColorAnalysisSummary
    /** Resumen de movimiento de cámara */
    camera_summary?: CameraSummary
    /** Resumen de análisis de composición */
    composition_summary?: CompositionSummary
    /** Datos temporales para timelines */
    temporal_data?: TemporalData
    /** Frames clave extraídos del video */
    key_frames?: KeyFrame[]
    /** URL del poster del contenido desde TMDB */
    poster_url?: string
    /** Datos de histograma RGB para gráfico */
    histogram_data?: HistogramData
    /** Timeline de movimientos de cámara para gráfico */
    camera_timeline?: CameraTimelinePoint[]
    /** Datos detallados de composición para gráficos */
    composition_data?: CompositionData
}

/**
 * Estructura de datos recibidos mediante Server-Sent Events.
 *
 * Define formato de eventos streaming enviados por backend durante
 * procesamiento en tiempo real. Adaptado a estructura del backend CVFlix.
 */
export interface SSEFrameData {
    /** Tipo de evento (progress, frame, complete, error) */
    type?: string

    /** Mensaje descriptivo del evento */
    message?: string
    /** Porcentaje de progreso [0-100] */
    progress?: number

    /** Duración del video en segundos */
    duration?: number
    /** Frames por segundo del video */
    fps?: number
    /** Número total de frames del video */
    total_frames?: number
    /** Ancho del video en píxeles */
    width?: number
    /** Alto del video en píxeles */
    height?: number

    /** Número del frame actual siendo procesado */
    frame_number?: number
    /** Frame procesado codificado en Base64 */
    frame_data?: string

    /** Número de rostros detectados en frame actual */
    faces_detected?: number
    /** Array de rostros detectados con detalles */
    faces?: Array<{
        /** Bounding box [x, y, w, h] */
        box: number[]
        /** Indica si el rostro fue reconocido como actor */
        recognized: boolean
        /** Nombre del actor reconocido */
        actor?: string
        /** Nombre del personaje */
        personaje?: string
        /** Porcentaje de similitud con foto de referencia */
        similitud?: number
        /** Emoción detectada en el rostro */
        emotion?: {
            emotion: string
            confidence: number
        }
    }>

    /** Tipo de plano detectado en frame actual */
    shot_type?: {
        type: string
        confidence: number
    }
    /** Métricas de composición del frame */
    composition?: {
        rule_of_thirds: number
        symmetry: number
        balance: number
        lines: number
    }
    /** Análisis de iluminación del frame */
    lighting?: {
        type: string
        brightness: number
        contrast: number
    }
    /** Análisis cromático del frame */
    colors?: {
        dominant_colors: string[]
        temperature: string
        scheme: string
    }
    /** Movimiento de cámara detectado */
    camera_movement?: {
        type: string
        intensity: number
    }

    /** Velocidad de procesamiento en frames por segundo */
    fps_processing?: number
    /** Tiempo estimado restante en segundos */
    eta_seconds?: number
    /** Tiempo de procesamiento transcurrido en segundos */
    processing_time?: number
    /** Número total de frames procesados hasta el momento */
    total_frames_processed?: number

    /** Número de actores cargados desde TMDB */
    actors_loaded?: number
    /** Número total de actores en el cast */
    actors_count?: number
    /** URL del poster desde TMDB */
    poster_url?: string

    /** Array de actores detectados (evento complete) */
    detected_actors?: DetectedActor[]
    /** Número total de actores únicos detectados */
    total_actors_detected?: number
    /** Resumen de movimiento de cámara (evento complete) */
    camera_summary?: CameraSummary
    /** Resumen de tipos de plano (evento complete) */
    shot_types_summary?: ShotTypesSummary
    /** Resumen de iluminación (evento complete) */
    lighting_summary?: LightingSummary
    /** Resumen de emociones (evento complete) */
    emotions_summary?: EmotionsSummary
    /** Resumen de análisis cromático (evento complete) */
    color_analysis_summary?: ColorAnalysisSummary
    /** Resumen de composición (evento complete) */
    composition_summary?: CompositionSummary
    /** Datos temporales para timelines (evento complete) */
    temporal_data?: TemporalData
    /** Frames clave del video (evento complete) */
    key_frames?: KeyFrame[]

    /** Datos de histograma RGB (evento complete) */
    histogram_data?: HistogramData
    /** Timeline de movimiento de cámara (evento complete) */
    camera_timeline?: CameraTimelinePoint[]
    /** Datos de composición para gráficos (evento complete) */
    composition_data?: CompositionData

    /** Mensaje de error si procesamiento falló */
    error?: string

    /** Información de optimizaciones aplicadas */
    optimizations?: {
        /** Número de frames saltados en detección facial */
        face_detection_skip: number
        /** Número de frames saltados en análisis completo */
        full_analysis_skip: number
        /** Indica si compresión está habilitada */
        compression_enabled: boolean
        /** Indica si se usa procesador global compartido */
        using_global_processor?: boolean
        /** Indica si modo de datos para gráficos está activo */
        graph_data_mode?: boolean
    }
}

/**
 * Alias de compatibilidad retroactiva.
 *
 * Mantiene referencia al nombre anterior para evitar breaking changes.
 */
export type WebSocketFrameData = SSEFrameData