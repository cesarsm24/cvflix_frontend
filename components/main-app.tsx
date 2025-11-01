/**
 * main-app.tsx
 *
 * Componente principal de la aplicación de análisis cinematográfico. Gestiona
 * el flujo completo de procesamiento de video mediante Server-Sent Events (SSE),
 * visualización en tiempo real y generación de reportes finales.
 *
 * Author: César Sánchez Montes
 * Course: Imagen Digital
 * Year: 2025
 * Version: 3.0.0
 *
 * Dependencies:
 *   - react: Gestión de estado y efectos con hooks
 *   - @/components/ui/button: Componente de botón reutilizable
 *   - @/components/*: Componentes de UI (Navbar, Footer, UploadForm, etc.)
 *   - @/lib/types: Definiciones de tipos TypeScript
 *
 * Usage:
 *   import MainApp from '@/components/main-app'
 *
 *   <MainApp />
 *
 * Notes:
 *   Arquitectura de procesamiento:
 *     1. Usuario sube video y especifica título de contenido
 *     2. Validación de contenido en TMDB para obtener cast
 *     3. Envío de video al backend mediante FormData
 *     4. Recepción de análisis en tiempo real vía SSE
 *     5. Actualización de UI con frames procesados y métricas
 *     6. Generación de reporte final con datos agregados
 *
 *   Estados de procesamiento:
 *     - idle: Estado inicial, muestra formulario de carga
 *     - uploading: Validación de contenido en TMDB
 *     - processing: Análisis en ejecución con streaming SSE
 *     - completed: Análisis finalizado, muestra reporte
 *
 *   Sistema de eventos SSE:
 *     - info/video_info: Información del video (duración, fps, frames)
 *     - progress: Actualizaciones de progreso y cambios de paso
 *     - frame: Frame procesado con análisis cinematográfico
 *     - complete: Resultados finales y datos agregados
 *     - error: Errores durante procesamiento
 *
 *   Optimizaciones:
 *     - Proxy de imágenes TMDB para CORS
 *     - Cálculo de velocidad de procesamiento (fps)
 *     - Estimación de tiempo restante
 *     - Análisis en tiempo real en overlay del video
 */

"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { UploadForm } from "@/components/upload-form"
import { ProgressSidebar, PROCESSING_STEPS } from "@/components/progress-sidebar"
import { ReportSidebar } from "@/components/report-sidebar"
import { Footer } from "@/components/footer"
import { HelpButton } from "@/components/help-button"
import type {
  ProcessingStatus,
  DetectedActor,
  AnalysisReport,
  HistogramData,
  CameraTimelinePoint,
  CompositionData
} from "@/lib/types"

/**
 * URL base de la API del backend.
 * Configurable mediante variable de entorno NEXT_PUBLIC_API_URL.
 *
 * @constant
 * @default "http://localhost:8000" - Desarrollo local
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

/**
 * Componente MainApp.
 *
 * Aplicación principal que coordina flujo completo de análisis cinematográfico
 * desde carga de video hasta visualización de resultados. Implementa comunicación
 * bidireccional con backend mediante SSE para streaming en tiempo real.
 *
 * @returns Interfaz completa de la aplicación
 *
 * Notes:
 *   Estados principales:
 *     - status: Estado actual del flujo (idle/uploading/processing/completed)
 *     - report: Reporte final con resultados agregados
 *     - processedFrameUrl: Base64 del frame actual en procesamiento
 *     - detectedActors: Array de actores detectados con métricas
 *
 *   Refs para optimización:
 *     - imgRef: Referencia al elemento de imagen para manipulación DOM
 *     - frameCountRef: Contador de frames sin causar re-renders
 *     - videoDurationRef: Duración del video en memoria
 *     - contentTitleRef: Título del contenido en memoria
 *
 *   Flujo de procesamiento:
 *     handleStartProcessingAction() → searchContent() → processVideoWithSSE()
 *     → handleSSEEvent() → Actualización de estados → Renderizado
 */
export default function MainApp() {
  /**
   * Estado actual del proceso de análisis.
   *
   * @default "idle" - Estado inicial
   */
  const [status, setStatus] = useState<ProcessingStatus>("idle")

  /**
   * Paso actual del procesamiento mostrado en sidebar.
   */
  const [currentStep, setCurrentStep] = useState("")

  /**
   * Reporte final del análisis con todos los datos agregados.
   */
  const [report, setReport] = useState<AnalysisReport | null>(null)

  /**
   * URL Base64 del frame actual siendo procesado.
   */
  const [processedFrameUrl, setProcessedFrameUrl] = useState<string | null>(null)

  /**
   * URL Base64 del primer frame del video para inclusión en PDF.
   */
  const [firstFrameUrl, setFirstFrameUrl] = useState<string | null>(null)

  /**
   * Porcentaje de progreso del análisis [0-100].
   */
  const [progress, setProgress] = useState(0)

  /**
   * Número de rostros detectados en frame actual.
   */
  const [facesDetected, setFacesDetected] = useState(0)

  /**
   * Número de frames analizados hasta el momento.
   */
  const [shotsAnalyzed, setShotsAnalyzed] = useState(0)

  /**
   * Array de actores detectados con métricas de reconocimiento.
   */
  const [detectedActors, setDetectedActors] = useState<DetectedActor[]>([])

  /**
   * Título del contenido siendo analizado.
   */
  const [contentTitle, setContentTitle] = useState("")

  /**
   * Información técnica del video (duración, fps, frames totales).
   */
  const [videoInfo, setVideoInfo] = useState<{ duration: number; fps: number; total_frames: number } | null>(null)

  /**
   * Mensaje de estado de conexión con backend.
   */
  const [connectionStatus, setConnectionStatus] = useState<string>("Conectando...")

  /**
   * URL del poster del contenido desde TMDB (con proxy).
   */
  const [posterUrl, setPosterUrl] = useState<string | null>(null)

  /**
   * Datos de histograma RGB para gráfico de distribución de colores.
   */
  const [histogramData, setHistogramData] = useState<HistogramData | null>(null)

  /**
   * Timeline de movimientos de cámara para visualización temporal.
   */
  const [cameraTimeline, setCameraTimeline] = useState<CameraTimelinePoint[]>([])

  /**
   * Datos de composición para gráficos de regla de tercios y simetría.
   */
  const [compositionData, setCompositionData] = useState<CompositionData | null>(null)

  /**
   * Tipo de plano actual detectado en frame.
   */
  const [currentShotType, setCurrentShotType] = useState<string | null>(null)

  /**
   * Tipo de iluminación actual detectada en frame.
   */
  const [currentLighting, setCurrentLighting] = useState<string | null>(null)

  /**
   * Tipo de movimiento de cámara actual detectado.
   */
  const [currentCameraMovement, setCurrentCameraMovement] = useState<string | null>(null)

  /**
   * Emoción predominante detectada en rostros del frame actual.
   */
  const [currentEmotion, setCurrentEmotion] = useState<string | null>(null)

  /**
   * Información de optimizaciones aplicadas por backend.
   */
  const [optimizationInfo, setOptimizationInfo] = useState<{
    faceSkip?: number
    analysisSkip?: number
    compression?: boolean
  }>({})

  /**
   * Velocidad de procesamiento en frames por segundo.
   */
  const [processingSpeed, setProcessingSpeed] = useState(0)

  /**
   * Tiempo estimado restante en segundos.
   */
  const [estimatedTime, setEstimatedTime] = useState(0)

  /**
   * Referencia al elemento img para manipulación DOM directa.
   */
  const imgRef = useRef<HTMLImageElement | null>(null)

  /**
   * Contador de frames procesados en memoria (no causa re-renders).
   */
  const frameCountRef = useRef(0)

  /**
   * Duración del video en segundos almacenada en memoria.
   */
  const videoDurationRef = useRef(0)

  /**
   * Título del contenido almacenado en memoria.
   */
  const contentTitleRef = useRef("")

  /**
   * Timestamp del último frame recibido para cálculo de fps.
   */
  const lastFrameTimeRef = useRef<number>(Date.now())

  /**
   * Array de tiempos entre frames para cálculo de velocidad promedio.
   */
  const frameTimesRef = useRef<number[]>([])

  /**
   * Flag para evitar procesamiento duplicado de video_info.
   */
  const videoInfoReceivedRef = useRef(false)

  /**
   * Efecto de limpieza al desmontar componente.
   *
   * Actualmente vacío pero preparado para limpieza de recursos si necesario
   * (conexiones WebSocket, timers, etc.).
   */
  useEffect(() => {
    return () => {
      // Cleanup si es necesario
    }
  }, [])

  /**
   * Cancela análisis en progreso y resetea aplicación.
   *
   * Invocado desde ProgressSidebar mediante botón de cancelación.
   * Interrumpe procesamiento y retorna a estado inicial.
   */
  const handleCancelAnalysis = () => {
    console.log("🛑 Cancelando análisis...")
    resetAnalysis()
    alert("✅ Análisis cancelado")
  }

  /**
   * Busca contenido en TMDB para validación y obtención de cast.
   *
   * Realiza petición GET al endpoint /search-content del backend que
   * consulta TMDB API. Necesario para obtener actores del reparto y
   * validar existencia del contenido.
   *
   * @param title - Título del contenido a buscar en TMDB
   * @returns Objeto con resultado de búsqueda (found, id, title, type, poster_url)
   *
   * Notes:
   *   Parámetros de búsqueda:
   *     - query: Título ingresado por usuario
   *     - content_type: "auto" para búsqueda en películas y series
   *
   *   Respuesta exitosa:
   *     { success: true, content_id, type, poster_url }
   *
   *   Respuesta fallida:
   *     { found: false, error: mensaje }
   */
  const searchContent = async (title: string) => {
    try {
      const response = await fetch(`${API_URL}/search-content?query=${encodeURIComponent(title)}&content_type=auto`)
      if (!response.ok) {
        const errorData = await response.json()
        return { found: false, error: errorData.detail || "Error buscando contenido" }
      }
      const data = await response.json()

      if (data.success) {
        return {
          found: true,
          id: data.content_id,
          title: title,
          type: data.type,
          poster_url: data.poster_url
        }
      } else {
        return { found: false, error: data.message || "No se encontró contenido" }
      }
    } catch (error) {
      console.error("Error en búsqueda:", error)
      return { found: false, error: String(error) }
    }
  }

  /**
   * Procesa video mediante Server-Sent Events (SSE).
   *
   * Envía video al backend y establece stream SSE para recibir actualizaciones
   * en tiempo real del análisis. Utiliza Fetch API con streaming de respuesta
   * para procesamiento incremental de eventos.
   *
   * @param file - Archivo de video a procesar
   * @param title - Título del contenido para búsqueda de actores
   * @returns Promise que resuelve al completar stream o rechaza en error
   *
   * Notes:
   *   Formato de eventos SSE:
   *     event: tipo_evento\n
   *     data: {"campo": "valor"}\n
   *     \n
   *
   *   Procesamiento de stream:
   *     1. ReadableStream.getReader() obtiene reader del body
   *     2. TextDecoder decodifica chunks binarios a texto
   *     3. Buffer acumula líneas incompletas entre chunks
   *     4. Split por \n separa eventos individuales
   *     5. Parsing de líneas event: y data:
   *     6. JSON.parse de data y dispatch a handleSSEEvent()
   *
   *   Manejo de errores:
   *     - HTTP errors: Verifica response.ok antes de procesar
   *     - Stream errors: Try-catch en reader.read()
   *     - Parse errors: Try-catch en JSON.parse con log detallado
   */
  const processVideoWithSSE = async (file: File, title: string) => {
    return new Promise<void>((resolve, reject) => {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", title)
      formData.append("content_type", "auto")

      const url = `${API_URL}/api/process-video-sse`
      console.log("🚀 POST a:", url)

      fetch(url, {
        method: "POST",
        body: formData,
      })
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }

            if (!response.body) {
              throw new Error("No se recibió un stream de respuesta")
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ""
            let currentEvent = ""

            const processStream = () => {
              reader.read().then(({ done, value }) => {
                if (done) {
                  console.log("✅ Stream completado")
                  resolve()
                  return
                }

                buffer += decoder.decode(value, { stream: true })
                const lines = buffer.split("\n")
                buffer = lines.pop() || ""

                for (const line of lines) {
                  if (line.trim() === "") {
                    currentEvent = ""
                    continue
                  }

                  if (line.startsWith("event:")) {
                    currentEvent = line.substring(6).trim()
                    continue
                  }

                  if (line.startsWith("data:")) {
                    const dataStr = line.substring(5).trim()

                    try {
                      const data = JSON.parse(dataStr)
                      handleSSEEvent(data, currentEvent)
                    } catch (err) {
                      console.error("Error parseando SSE data:", err, dataStr)
                    }
                  }
                }

                processStream()
              }).catch(error => {
                console.error("❌ Error leyendo stream:", error)
                reject(error)
              })
            }

            processStream()
          })
          .catch(error => {
            console.error("❌ Error en fetch:", error)
            reject(error)
          })
    })
  }

  /**
   * Gestiona eventos SSE recibidos del backend.
   *
   * Procesa diferentes tipos de eventos actualizando estados correspondientes
   * y registrando información detallada para debugging. Implementa lógica de
   * negocio para cada tipo de evento del pipeline de análisis.
   *
   * @param data - Objeto con datos del evento SSE
   * @param eventType - Tipo de evento ("info", "progress", "frame", "complete", "error")
   *
   * Notes:
   *   Eventos procesados:
   *
   *     info/video_info:
   *       - Captura duración, fps y frames totales del video
   *       - Inicializa optimizaciones aplicadas por backend
   *       - Flag videoInfoReceivedRef previene procesamiento duplicado
   *
   *     progress:
   *       - Actualiza mensaje de estado y paso actual
   *       - Mapea mensajes del backend a pasos de PROCESSING_STEPS
   *       - Actualiza barra de progreso con porcentaje
   *
   *     frame:
   *       - Actualiza frame visualizado (Base64)
   *       - Captura análisis cinematográfico en tiempo real
   *       - Actualiza métricas de velocidad y tiempo estimado
   *       - Detecta tipo de plano, iluminación, movimiento y emociones
   *
   *     complete:
   *       - Recibe datos agregados finales (summaries)
   *       - Construye reporte final con todos los análisis
   *       - Aplica proxy a URLs de imágenes TMDB
   *       - Valida presencia de datos para gráficos
   *
   *     error:
   *       - Muestra alerta con mensaje de error
   *       - Resetea estado a "idle"
   *
   *   Proxy de imágenes TMDB:
   *     URLs de image.tmdb.org se reescriben mediante endpoint /image-proxy
   *     del backend para resolver problemas de CORS y rate limiting.
   *
   *   Logging extensivo:
   *     Cada evento registra información detallada para debugging y monitoreo
   *     del flujo de análisis, validación de datos y troubleshooting.
   */
  const handleSSEEvent = (data: any, eventType: string) => {
    // Log detallado de eventos
    if (eventType === "frame") {
      console.log(`📡 [FRAME] #${data.frame_number}:`, {
        hasFrameData: !!data.frame_data,
        frameDataLength: data.frame_data ? data.frame_data.length : 0,
        facesDetected: data.faces_detected,
        progress: data.progress,
        hasShotType: !!data.shot_type,
        hasLighting: !!data.lighting,
        hasComposition: !!data.composition,
        hasColors: !!data.colors,
        hasCameraMovement: !!data.camera_movement
      })
    } else {
      console.log(`📡 [${eventType}]:`, data)
    }

    // Evento: video_info
    if (eventType === "info" || (eventType === "video_info" && !videoInfoReceivedRef.current)) {
      console.log("ℹ️ Info del video:", data)
      videoInfoReceivedRef.current = true
      setVideoInfo({
        duration: data.duration || 0,
        fps: data.fps || 0,
        total_frames: data.total_frames || 0
      })
      videoDurationRef.current = Math.round(data.duration || 0)
      setCurrentStep("Cargando video")

      if (data.optimizations) {
        setOptimizationInfo({
          faceSkip: data.optimizations.face_detection_skip,
          analysisSkip: data.optimizations.full_analysis_skip,
          compression: data.optimizations.compression_enabled
        })
      }
    }

    // Evento: progress
    if (eventType === "progress") {
      if (data.message) {
        console.log("📊 Progreso:", data.message)

        if (data.message.includes("Video guardado")) {
          setCurrentStep("Cargando video")
        } else if (data.message.includes("Buscando") && data.message.includes("TMDB")) {
          setCurrentStep("Obteniendo reparto de TMDB")
        } else if (data.message.includes("Cargando actor") || data.message.includes("Descargando fotos")) {
          setCurrentStep("Cargando fotos de actores")
        } else if (data.message.includes("encodings")) {
          setCurrentStep("Inicializando análisis")
        } else if (data.message.includes("Procesando frames") || data.message.includes("Iniciando análisis") || data.message.includes("Analizando video")) {
          setCurrentStep("Detectando rostros")
        } else if (data.message.includes("Generando") || data.message.includes("resultados")) {
          setCurrentStep("Generando datos para gráficos")
        }
      }

      if (data.progress !== undefined) {
        setProgress(data.progress)
      }
    }

    // Evento: frame
    if (eventType === "frame") {
      if (data.frame_data) {
        setProcessedFrameUrl(data.frame_data)
        console.log("🖼️ Frame #" + data.frame_number + " actualizado")

        if (!firstFrameUrl) {
          setFirstFrameUrl(data.frame_data)
        }
      }

      if (data.progress !== undefined) {
        setProgress(data.progress)
      }

      if (data.faces_detected !== undefined) {
        setFacesDetected(data.faces_detected)
      }

      if (data.frame_number !== undefined) {
        frameCountRef.current = data.frame_number
        setShotsAnalyzed(data.frame_number)
      }

      if (data.fps_processing !== undefined) {
        setProcessingSpeed(data.fps_processing)
      }

      if (data.eta_seconds !== undefined) {
        setEstimatedTime(data.eta_seconds)
      }

      if (data.shot_type) {
        setCurrentShotType(data.shot_type.shot_type || data.shot_type.type)
        console.log("📐 Tipo de plano:", data.shot_type)
      }

      if (data.lighting) {
        setCurrentLighting(data.lighting.type)
        console.log("💡 Iluminación:", data.lighting)
      }

      if (data.camera_movement) {
        setCurrentCameraMovement(data.camera_movement.movement || data.camera_movement.type)
        console.log("🎞️ Movimiento cámara:", data.camera_movement)
      }

      if (data.faces && data.faces.length > 0) {
        const emotionsInFrame = data.faces
            .filter((face: any) => face.emotion)
            .map((face: any) => face.emotion.emotion)

        if (emotionsInFrame.length > 0) {
          setCurrentEmotion(emotionsInFrame[0])
        }
      }

      if (data.composition) {
        console.log("✨ Composición:", data.composition)
      }

      if (data.colors) {
        console.log("🎨 Colores:", data.colors)
      }

      const stepIndex = Math.min(
          Math.floor((data.progress || 0) / 100 * PROCESSING_STEPS.length),
          PROCESSING_STEPS.length - 1
      )
      if (stepIndex >= 0 && stepIndex < PROCESSING_STEPS.length) {
        setCurrentStep(PROCESSING_STEPS[stepIndex].label)
      }
    }

    // Evento: complete
    if (eventType === "complete") {
      console.log("✅ Análisis completado:", data)

      console.log("🔍 VERIFICACIÓN DE DATOS RECIBIDOS:")
      console.log("  - detected_actors:", data.detected_actors ? "✅" : "❌")
      console.log("  - shot_types_summary:", data.shot_types_summary ? "✅" : "❌")
      console.log("  - lighting_summary:", data.lighting_summary ? "✅" : "❌")
      console.log("  - emotions_summary:", data.emotions_summary ? "✅" : "❌")
      console.log("  - color_analysis_summary:", data.color_analysis_summary ? "✅" : "❌")
      console.log("  - camera_summary:", data.camera_summary ? "✅" : "❌")
      console.log("  - composition_summary:", data.composition_summary ? "✅" : "❌")
      console.log("  - histogram_data:", data.histogram_data ? "✅" : "❌")
      console.log("  - camera_timeline:", data.camera_timeline ? "✅" : "❌")
      console.log("  - composition_data:", data.composition_data ? "✅" : "❌")
      console.log("  - poster_url:", data.poster_url ? "✅" : "❌")

      setConnectionStatus("Completado")
      setStatus("completed")
      setProgress(100)
      setCurrentStep("Preparando informe final")

      if (data.detected_actors) {
        const actorsWithProxiedImages = data.detected_actors.map((actor: DetectedActor) => ({
          ...actor,
          foto_url: actor.foto_url.includes('image.tmdb.org')
              ? `${API_URL}/image-proxy?url=${encodeURIComponent(actor.foto_url)}`
              : actor.foto_url
        }))
        setDetectedActors(actorsWithProxiedImages)
        console.log(`👥 ${actorsWithProxiedImages.length} actores procesados`)
      }

      if (data.poster_url) {
        const proxiedPoster = data.poster_url.includes('image.tmdb.org')
            ? `${API_URL}/image-proxy?url=${encodeURIComponent(data.poster_url)}`
            : data.poster_url
        setPosterUrl(proxiedPoster)
        console.log("🎬 Poster URL configurado")
      }

      if (data.histogram_data) {
        setHistogramData(data.histogram_data)
        console.log("📊 Histograma capturado:", {
          hasR: Array.isArray(data.histogram_data.r),
          hasG: Array.isArray(data.histogram_data.g),
          hasB: Array.isArray(data.histogram_data.b),
          rLength: data.histogram_data.r?.length,
          gLength: data.histogram_data.g?.length,
          bLength: data.histogram_data.b?.length
        })
      } else {
        console.warn("⚠️ No se recibió histogram_data")
      }

      if (data.camera_timeline) {
        setCameraTimeline(data.camera_timeline)
        console.log("📹 Timeline capturado:", {
          isArray: Array.isArray(data.camera_timeline),
          length: data.camera_timeline.length,
          firstItem: data.camera_timeline[0]
        })
      } else {
        console.warn("⚠️ No se recibió camera_timeline")
      }

      if (data.composition_data) {
        setCompositionData(data.composition_data)
        console.log("✨ Composición capturada:", data.composition_data)
      } else {
        console.warn("⚠️ No se recibió composition_data")
      }

      console.log("📊 SUMMARIES RECIBIDOS:")
      if (data.shot_types_summary) {
        console.log("  shot_types_summary:", data.shot_types_summary)
      }
      if (data.lighting_summary) {
        console.log("  lighting_summary:", data.lighting_summary)
      }
      if (data.emotions_summary) {
        console.log("  emotions_summary:", data.emotions_summary)
      }
      if (data.color_analysis_summary) {
        console.log("  color_analysis_summary:", data.color_analysis_summary)
      }
      if (data.camera_summary) {
        console.log("  camera_summary:", data.camera_summary)
      }
      if (data.composition_summary) {
        console.log("  composition_summary:", data.composition_summary)
      }

      const finalReport: AnalysisReport = {
        title: contentTitleRef.current || "Video Analizado",
        duration: videoDurationRef.current ? `${videoDurationRef.current}s` : "N/A",
        shots: data.total_frames_processed || frameCountRef.current,
        detectedActors: data.detected_actors || [],
        cinematicPlanes: [],
        shot_types_summary: data.shot_types_summary,
        lighting_summary: data.lighting_summary,
        emotions_summary: data.emotions_summary,
        color_analysis_summary: data.color_analysis_summary,
        camera_summary: data.camera_summary,
        composition_summary: data.composition_summary,
        poster_url: data.poster_url,
        histogram_data: data.histogram_data,
        camera_timeline: data.camera_timeline,
        composition_data: data.composition_data,
      }

      console.log("📋 REPORTE FINAL GENERADO:")
      console.log("  - title:", finalReport.title)
      console.log("  - duration:", finalReport.duration)
      console.log("  - shots:", finalReport.shots)
      console.log("  - detectedActors:", finalReport.detectedActors?.length || 0)
      console.log("  - shot_types_summary:", finalReport.shot_types_summary ? "✅" : "❌")
      console.log("  - lighting_summary:", finalReport.lighting_summary ? "✅" : "❌")
      console.log("  - emotions_summary:", finalReport.emotions_summary ? "✅" : "❌")
      console.log("  - color_analysis_summary:", finalReport.color_analysis_summary ? "✅" : "❌")
      console.log("  - camera_summary:", finalReport.camera_summary ? "✅" : "❌")
      console.log("  - composition_summary:", finalReport.composition_summary ? "✅" : "❌")
      console.log("  - histogram_data:", finalReport.histogram_data ? "✅" : "❌")
      console.log("  - camera_timeline:", finalReport.camera_timeline ? "✅" : "❌")
      console.log("  - composition_data:", finalReport.composition_data ? "✅" : "❌")
      console.log("  - poster_url:", finalReport.poster_url ? "✅" : "❌")

      setReport(finalReport)
      console.log("✅ Reporte establecido en estado")
    }

    // Evento: error
    if (eventType === "error") {
      console.error("❌ Error del backend:", data)
      alert(`Error: ${data.message || data.error || "Error desconocido"}`)
      setStatus("idle")
      setConnectionStatus("Error")
    }
  }

  /**
   * Resetea todos los estados a valores iniciales.
   *
   * Limpia estado completo de la aplicación para permitir nuevo análisis.
   * Invocado al completar análisis o cancelarlo manualmente.
   *
   * Notes:
   *   Estados limpiados:
   *     - Estados React mediante setters
   *     - Refs mediante asignación directa
   *     - Arrays y objetos a valores iniciales
   *
   *   No requiere limpieza de:
   *     - Conexiones (SSE se cierra automáticamente al completar)
   *     - Timers (ninguno activo en estados idle/completed)
   *     - Event listeners (ninguno registrado globalmente)
   */
  const resetAnalysis = () => {
    console.log("🔄 Reseteando análisis...")

    setStatus("idle")
    setCurrentStep("")
    setReport(null)
    setProcessedFrameUrl(null)
    setFirstFrameUrl(null)
    setProgress(0)
    setDetectedActors([])
    setContentTitle("")
    setVideoInfo(null)
    setConnectionStatus("Conectando...")

    setPosterUrl(null)
    setHistogramData(null)
    setCameraTimeline([])
    setCompositionData(null)

    setCurrentShotType(null)
    setCurrentLighting(null)
    setCurrentCameraMovement(null)
    setCurrentEmotion(null)

    videoDurationRef.current = 0
    contentTitleRef.current = ""
    frameCountRef.current = 0
    setShotsAnalyzed(0)
    setFacesDetected(0)

    setOptimizationInfo({})
    setProcessingSpeed(0)
    setEstimatedTime(0)
    frameTimesRef.current = []
    lastFrameTimeRef.current = Date.now()
    videoInfoReceivedRef.current = false

    console.log("🔄 Reseteado completo")
  }

  /**
   * Inicia procesamiento de video tras validación de contenido.
   *
   * Orquesta flujo completo: validación TMDB → upload → procesamiento SSE.
   * Invocado desde UploadForm al enviar formulario con video y título.
   *
   * @param title - Título del contenido para búsqueda en TMDB
   * @param file - Archivo de video a procesar
   *
   * Notes:
   *   Flujo de ejecución:
   *     1. Reseteo de estados previos
   *     2. Establecer status "uploading"
   *     3. Búsqueda en TMDB mediante searchContent()
   *     4. Validación de existencia de contenido
   *     5. Si válido: establecer status "processing"
   *     6. Enviar video mediante processVideoWithSSE()
   *     7. Gestión automática de eventos vía handleSSEEvent()
   *
   *   Validación TMDB:
   *     Si contenido no encontrado, muestra alerta con error detallado
   *     y aborta procesamiento retornando a estado "idle".
   *
   *   Manejo de errores:
   *     Try-catch captura errores de red, timeouts o problemas del backend.
   *     Muestra alerta al usuario y resetea a estado "idle".
   */
  const handleStartProcessingAction = async (title: string, file: File) => {
    console.log("🚀 Iniciando procesamiento de:", title)

    setStatus("uploading")
    setReport(null)
    setProcessedFrameUrl(null)
    setFirstFrameUrl(null)
    setProgress(0)
    setDetectedActors([])
    setCurrentStep(PROCESSING_STEPS[0].label)
    setVideoInfo(null)
    setConnectionStatus("Validando contenido en TMDB...")

    setPosterUrl(null)
    setHistogramData(null)
    setCameraTimeline([])
    setCompositionData(null)

    setCurrentShotType(null)
    setCurrentLighting(null)
    setCurrentCameraMovement(null)
    setCurrentEmotion(null)

    videoDurationRef.current = 0
    frameCountRef.current = 0
    setShotsAnalyzed(0)
    setFacesDetected(0)

    setOptimizationInfo({})
    setProcessingSpeed(0)
    setEstimatedTime(0)
    frameTimesRef.current = []
    lastFrameTimeRef.current = Date.now()
    videoInfoReceivedRef.current = false

    setConnectionStatus("Buscando en TMDB...")
    const content = await searchContent(title)

    if (!content.found) {
      const errorMsg = content.error
          ? `No se encontró "${title}" en TMDB.\n\nDetalles: ${content.error}`
          : `No se encontró "${title}" en TMDB.\n\nVerifica el título e intenta de nuevo.`

      alert(`❌ ${errorMsg}`)
      console.error("Detalles del error:", content)
      setStatus("idle")
      return
    }

    console.log("✅ Contenido encontrado en TMDB:", content)
    setContentTitle(content.title || title)
    contentTitleRef.current = content.title || title

    setStatus("processing")
    setConnectionStatus("Subiendo y procesando video...")

    try {
      await processVideoWithSSE(file, title)
    } catch (error) {
      console.error("❌ Error en procesamiento:", error)
      alert(`Error procesando video: ${error}`)
      setStatus("idle")
    }
  }

  return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        {status === "idle" && <HelpButton />}

        <div className="flex flex-1 relative">
          {/* Área principal de contenido */}
          <div className="flex-1 p-8 relative">
            {/* Estado: idle - Formulario de carga */}
            {status === "idle" && (
                <div className="mx-auto max-w-4xl">
                  <UploadForm onStartProcessingAction={handleStartProcessingAction} disabled={false} />
                </div>
            )}

            {/* Estado: uploading - Spinner de validación TMDB */}
            {status === "uploading" && (
                <div className="flex h-[calc(100vh-80px)] items-center justify-center">
                  <div className="text-center max-w-md">
                    <div className="mb-6">
                      <div className="inline-block">
                        <div className="w-12 h-12 border-4 border-gray-300 border-t-white rounded-full animate-spin"></div>
                      </div>
                    </div>
                    <div className="text-lg text-white font-medium">{connectionStatus}</div>
                  </div>
                </div>
            )}

            {/* Estados: processing/completed - Visualización de video y análisis */}
            {(status === "processing" || status === "completed") && (
                <div className="flex h-[calc(100vh-80px)] items-center justify-center relative p-4">
                  {processedFrameUrl ? (
                      <div className="relative">
                        {/* Frame procesado con overlays de información */}
                        <img
                            ref={imgRef}
                            src={processedFrameUrl}
                            alt="Video procesado"
                            className="w-full h-auto rounded"
                            style={{ maxHeight: "70vh", objectFit: "contain" }}
                        />

                        {/* Overlay: Panel de análisis en tiempo real (solo durante processing) */}
                        {status === "processing" && (
                            <div className="absolute bottom-4 left-4 rounded-lg bg-black/80 px-4 py-3 text-white backdrop-blur-sm border border-white/30 shadow-xl">
                              <div className="text-sm font-bold mb-2 text-red-500">⚡ Análisis en Tiempo Real</div>

                              <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between gap-4">
                                  <span className="text-gray-400">Rostros:</span>
                                  <span className="font-semibold text-white">{facesDetected}</span>
                                </div>

                                <div className="flex justify-between gap-4">
                                  <span className="text-gray-400">Frame:</span>
                                  <span className="font-semibold text-white">{shotsAnalyzed}</span>
                                </div>

                                <div className="flex justify-between gap-4">
                                  <span className="text-gray-400">Progreso:</span>
                                  <span className="font-semibold text-red-400">{progress.toFixed(1)}%</span>
                                </div>

                                {processingSpeed > 0 && (
                                    <div className="flex justify-between gap-4 pt-1 border-t border-white/20">
                                      <span className="text-gray-400">Velocidad:</span>
                                      <span className="font-semibold text-green-400">{processingSpeed.toFixed(1)} fps</span>
                                    </div>
                                )}

                                {/* Análisis cinematográfico actual del frame */}
                                {(currentShotType || currentLighting || currentCameraMovement || currentEmotion) && (
                                    <div className="pt-2 mt-2 border-t border-white/20 space-y-1.5">
                                      {currentShotType && (
                                          <div className="flex justify-between gap-4">
                                            <span className="text-gray-400">📐 Plano:</span>
                                            <span className="font-semibold text-blue-400">{currentShotType}</span>
                                          </div>
                                      )}

                                      {currentLighting && (
                                          <div className="flex justify-between gap-4">
                                            <span className="text-gray-400">💡 Luz:</span>
                                            <span className="font-semibold text-yellow-400">{currentLighting}</span>
                                          </div>
                                      )}

                                      {currentCameraMovement && (
                                          <div className="flex justify-between gap-4">
                                            <span className="text-gray-400">🎞️ Cámara:</span>
                                            <span className="font-semibold text-purple-400">{currentCameraMovement}</span>
                                          </div>
                                      )}

                                      {currentEmotion && (
                                          <div className="flex justify-between gap-4">
                                            <span className="text-gray-400">😊 Emoción:</span>
                                            <span className="font-semibold text-pink-400">{currentEmotion}</span>
                                          </div>
                                      )}
                                    </div>
                                )}
                              </div>
                            </div>
                        )}

                        {/* Overlay: Top actores detectados (solo en completed) */}
                        {status === "completed" && detectedActors.length > 0 && (
                            <div className="absolute top-4 left-4 bg-black/80 text-white rounded-lg p-4 max-w-sm overflow-y-auto max-h-[60vh] backdrop-blur-sm border border-white/20">
                              <h3 className="font-bold text-lg mb-3">Top Actores Detectados</h3>
                              <ul className="space-y-3">
                                {detectedActors.slice(0, 5).map((actor, idx) => (
                                    <li key={actor.actor_id} className="flex items-center space-x-3 bg-white/10 rounded-lg p-2 hover:bg-white/20 transition-colors">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                          idx === 0 ? "bg-amber-500" : idx === 1 ? "bg-gray-400" : idx === 2 ? "bg-orange-600" : "bg-slate-600"
                                      }`}>
                                        {idx + 1}
                                      </div>
                                      <img
                                          src={actor.foto_url}
                                          alt={actor.nombre}
                                          className="w-12 h-12 rounded-full border-2 border-white/30 object-cover"
                                          onError={(e) => {
                                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect fill='%23666' width='48' height='48'/%3E%3Ctext x='50%25' y='50%25' fill='%23fff' font-size='20' text-anchor='middle' dy='.3em'%3E?%3C/text%3E%3C/svg%3E"
                                          }}
                                      />
                                      <div className="flex-1">
                                        <div className="text-sm font-semibold">{actor.nombre}</div>
                                        <div className="text-xs text-gray-300">{actor.personaje}</div>
                                      </div>
                                    </li>
                                ))}
                              </ul>
                            </div>
                        )}
                      </div>
                  ) : (
                      <div className="text-center max-w-md">
                        <div className="mb-6">
                          <div className="inline-block">
                            <div className="w-12 h-12 border-4 border-gray-300 border-t-white rounded-full animate-spin"></div>
                          </div>
                        </div>
                        <div className="text-lg text-white font-medium">
                          {connectionStatus}
                        </div>
                      </div>
                  )}
                </div>
            )}
          </div>

          {/* Sidebar lateral: ProgressSidebar o ReportSidebar según estado */}
          {(status === "processing" || status === "completed") && (
              <div className="w-96 border-l border-border bg-card sticky top-0 h-screen">
                {status === "processing" && (
                    <ProgressSidebar
                        currentStep={currentStep}
                        progress={progress}
                        facesDetected={facesDetected}
                        shotsAnalyzed={shotsAnalyzed}
                        optimizationInfo={optimizationInfo}
                        processingSpeed={processingSpeed}
                        estimatedTime={estimatedTime}
                        onCancel={handleCancelAnalysis}
                    />
                )}
                {status === "completed" && report && (
                    <ReportSidebar
                        report={report}
                        onNewAnalysisAction={resetAnalysis}
                        firstFrameUrl={firstFrameUrl}
                        posterUrl={posterUrl}
                    />
                )}
              </div>
          )}
        </div>

        <Footer />
      </div>
  )
}