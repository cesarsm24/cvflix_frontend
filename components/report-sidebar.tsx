/**
 * report-sidebar.tsx
 *
 * Componente de barra lateral de reporte final del análisis cinematográfico.
 * Muestra resultados completos, métricas de detección y proporciona funcionalidad
 * de exportación PDF y compartir en múltiples plataformas.
 *
 * Author: César Sánchez Montes
 * Course: Imagen Digital
 * Year: 2025
 * Version: 3.0.0
 *
 * Dependencies:
 *   - react: Gestión de estado con hooks
 *   - lucide-react: Iconos de interfaz (Download, Share2, Check, Copy, Mail, MessageCircle, Loader2)
 *   - @/components/ui/button: Componente de botón reutilizable
 *   - @/components/ui/dropdown-menu: Componente de menú desplegable
 *   - @/lib/types: Definición de tipos TypeScript
 *   - @/lib/pdf-generator: Generador de reportes PDF con gráficos
 *
 * Usage:
 *   import { ReportSidebar } from '@/components/report-sidebar'
 *
 *   <ReportSidebar
 *     report={analysisReport}
 *     onNewAnalysisAction={() => handleNewAnalysis()}
 *     firstFrameUrl="https://..."
 *     posterUrl="https://..."
 *   />
 *
 * Notes:
 *   Funcionalidades de compartir:
 *     - Copiar texto formateado al portapapeles
 *     - Compartir vía WhatsApp (formato corto optimizado)
 *     - Compartir vía Email (formato completo)
 *     - API nativa de compartir (Web Share API) si está disponible
 *
 *   Generación de PDF:
 *     - Utiliza Chart.js para renderizado de gráficos sin DOM
 *     - Incluye poster y primer frame del contenido analizado
 *     - Formato Netflix-style con paleta cromática consistente
 *
 *   Estructura visual:
 *     - Poster del contenido (si disponible)
 *     - Información básica (título, duración, frames)
 *     - Contador de actores detectados
 *     - Top 5 actores con ranking visual (medallas)
 *     - Resumen de análisis cinematográfico
 *     - Controles de exportación y compartir
 */

"use client"

import { Button } from "@/components/ui/button"
import { Download, Share2, Check, Copy, Mail, MessageCircle, Loader2 } from "lucide-react"
import { useState } from "react"
import type { AnalysisReport } from "@/lib/types"
import { generateNetflixPDF } from "@/lib/pdf-generator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Props del componente ReportSidebar.
 */
interface ReportSidebarProps {
  /** Objeto de reporte con resultados completos del análisis */
  report: AnalysisReport
  /** Callback para iniciar nuevo análisis */
  onNewAnalysisAction: () => void
  /** URL del primer frame del video para inclusión en PDF */
  firstFrameUrl?: string | null
  /** URL del poster del contenido para visualización y PDF */
  posterUrl?: string | null
}

/**
 * Componente ReportSidebar.
 *
 * Renderiza panel lateral con resultados finales del análisis cinematográfico.
 * Implementa visualización de métricas, actores detectados, análisis técnico
 * y controles de exportación/compartir con múltiples formatos.
 *
 * @param report - Objeto de reporte con todos los datos del análisis
 * @param onNewAnalysisAction - Función para reiniciar aplicación con nuevo análisis
 * @param firstFrameUrl - URL del primer frame para inclusión en PDF
 * @param posterUrl - URL del poster para visualización y exportación
 * @returns Panel lateral con reporte completo y controles de acción
 *
 * Notes:
 *   Estados internos:
 *     - copied: Indica si texto fue copiado al portapapeles
 *     - isGeneratingPDF: Controla estado de carga durante generación PDF
 *
 *   Formatos de compartir:
 *     - 'full': Formato extenso con todas las métricas y actores (email, copiar)
 *     - 'short': Formato resumido optimizado para mensajería (WhatsApp)
 *
 *   Sistema de ranking de actores:
 *     - Posición 1: Medalla dorada (bg-yellow-600)
 *     - Posición 2: Medalla plateada (bg-zinc-500)
 *     - Posición 3: Medalla bronce (bg-orange-600)
 *     - Posiciones 4-5: Indicador neutro (bg-zinc-700)
 */
export function ReportSidebar({ report, onNewAnalysisAction, firstFrameUrl, posterUrl }: ReportSidebarProps) {
  /**
   * Estado de confirmación de copiado al portapapeles.
   *
   * @default false - Sin acción de copiado reciente
   */
  const [copied, setCopied] = useState(false)

  /**
   * Estado de generación de PDF en progreso.
   *
   * @default false - Sin generación activa
   */
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  /** Detecta disponibilidad de Web Share API en navegador actual */
  const isShareSupported = typeof navigator !== 'undefined' && 'share' in navigator

  /**
   * Genera y descarga reporte PDF con gráficos integrados.
   *
   * Utiliza Chart.js para renderizado de gráficos sin necesidad de elementos DOM.
   * Incluye poster, primer frame y visualizaciones de todas las métricas analizadas.
   * Implementa gestión de errores con alertas al usuario.
   *
   * Notes:
   *   Proceso de generación:
   *     1. Establece estado isGeneratingPDF a true
   *     2. Invoca generateNetflixPDF con datos del reporte
   *     3. Chart.js genera gráficos en memoria
   *     4. jsPDF ensambla documento final
   *     5. Descarga automática mediante save()
   *     6. Restaura estado a false
   *
   *   Manejo de errores:
   *     - Captura excepciones durante generación
   *     - Registra error en consola para debugging
   *     - Muestra alerta al usuario con mensaje descriptivo
   */
  const handleDownloadPDF = async () => {
    try {
      setIsGeneratingPDF(true)
      console.log('📄 Generando PDF con Chart.js...')

      await generateNetflixPDF( report, firstFrameUrl || undefined, posterUrl || undefined)

      console.log('✅ PDF generado correctamente')
    } catch (error) {
      console.error('❌ Error generando PDF:', error)
      alert('Error al generar el PDF. Por favor, intenta de nuevo.')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  /**
   * Genera texto formateado para compartir análisis.
   *
   * @param format - Tipo de formato ('full' para completo, 'short' para resumido)
   * @returns String formateado con resultados del análisis
   *
   * Notes:
   *   Formato 'short':
   *     - Título del contenido
   *     - Número de actores detectados
   *     - Número de frames analizados
   *     - Firma de CVFlix
   *     - Optimizado para WhatsApp (límite de caracteres)
   *
   *   Formato 'full':
   *     - Encabezado con separador visual
   *     - Top 5 actores con porcentajes de similitud
   *     - Análisis cinematográfico completo (planos, iluminación, color, etc.)
   *     - Estadísticas de duración y frames
   *     - Firma de CVFlix
   *     - Adecuado para email y portapapeles
   */
  const generateShareText = (format: 'full' | 'short' = 'full') => {
    if (format === 'short') {
      return `**ANÁLISIS CVFLIX - ${report.title}**\n\n${report.detectedActors.length} actores detectados con IA + OpenCV\n${report.shots} frames analizados\n\nGenerado con CVFlix - Análisis cinematográfico con IA + OpenCV`
    }

    return `
**ANÁLISIS CVFLIX - ${report.title}**
${'='.repeat(50)}

**ACTORES/ACTRICES DETECTADOS (${report.detectedActors.length})**
${report.detectedActors.slice(0, 5).map((actor, i) =>
        `${i + 1}. ${actor.nombre} (${actor.personaje}) - ${actor.similitud}%`
    ).join('\n')}
${report.detectedActors.length > 5 ? `\n... y ${report.detectedActors.length - 5} más` : ''}

**ANÁLISIS CINEMATOGRÁFICO**
${report.shot_types_summary?.most_common ? `• Plano dominante: ${report.shot_types_summary.most_common}` : ''}
${report.lighting_summary?.most_common ? `• Iluminación: ${report.lighting_summary.most_common}` : ''}
${report.color_analysis_summary?.most_common_temperature ? `• Temperatura de color: ${report.color_analysis_summary.most_common_temperature}` : ''}
${report.color_analysis_summary?.most_common_scheme ? `• Esquema cromático: ${report.color_analysis_summary.most_common_scheme}` : ''}
${report.camera_summary?.most_common ? `• Movimiento de cámara: ${report.camera_summary.most_common}` : ''}
${report.emotions_summary?.most_common ? `• Emoción predominante: ${report.emotions_summary.most_common}` : ''}
${report.composition_summary ? `• Composición: ${report.composition_summary.total_analyzed} frames (Tercios: ${report.composition_summary.avg_rule_of_thirds?.toFixed(2)}, Simetría: ${report.composition_summary.avg_symmetry?.toFixed(2)})` : ''}

**ESTADÍSTICAS**
- Duración: ${report.duration}
- Frames analizados: ${report.shots}

Generado con CVFlix - Análisis cinematográfico con IA + OpenCV
    `.trim()
  }

  /**
   * Copia texto completo del análisis al portapapeles.
   *
   * Utiliza Clipboard API para copiar formato completo. Muestra confirmación
   * visual temporal mediante estado 'copied'. Implementa fallback con alert
   * si la API no está disponible o falla.
   *
   * Notes:
   *   Flujo de ejecución:
   *     1. Genera texto en formato 'full'
   *     2. Intenta escribir en portapapeles
   *     3. Establece copied=true por 2 segundos
   *     4. Catch: muestra alert con texto para copia manual
   */
  const handleCopyText = async () => {
    const shareText = generateShareText('full')

    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      alert("No se pudo copiar. Intenta manualmente:\n\n" + shareText)
    }
  }

  /**
   * Abre WhatsApp con texto pre-cargado del análisis.
   *
   * Genera texto en formato 'short' optimizado para mensajería, codifica URL
   * y abre WhatsApp Web en nueva pestaña mediante URI scheme.
   */
  const handleShareWhatsApp = () => {
    const text = generateShareText('short')
    const encodedText = encodeURIComponent(text)
    window.open(`https://wa.me/?text=${encodedText}`, '_blank')
  }

  /**
   * Abre cliente de email con análisis pre-cargado.
   *
   * Genera email con asunto y cuerpo formateados. Utiliza formato 'full'
   * para proporcionar información completa. Codifica parámetros para URL.
   */
  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Análisis CVFlix - ${report.title}`)
    const body = encodeURIComponent(generateShareText('full'))
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  /**
   * Activa diálogo nativo de compartir del sistema operativo.
   *
   * Utiliza Web Share API para acceder a opciones de compartir nativas del
   * dispositivo (apps instaladas, AirDrop, etc.). Maneja silenciosamente
   * AbortError cuando usuario cancela diálogo.
   *
   * Notes:
   *   Disponibilidad:
   *     - Principalmente dispositivos móviles
   *     - Algunos navegadores desktop modernos
   *     - Requiere contexto seguro (HTTPS)
   */
  const handleNativeShare = async () => {
    if (isShareSupported) {
      try {
        await navigator.share({
          title: `Análisis CVFlix - ${report.title}`,
          text: generateShareText('full')
        })
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error("Error sharing:", error)
        }
      }
    } else {
      alert("Compartir no está disponible en este navegador")
    }
  }

  return (
      <div className="w-96 h-screen bg-gradient-to-b from-zinc-900 via-zinc-900 to-black border-l border-zinc-800 flex flex-col overflow-hidden">
        {/* Sección de encabezado */}
        <div className="p-6 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-1 h-10 bg-red-600 rounded-full"></div>
            <div>
              <h2 className="text-xl font-bold text-white">Análisis Completado</h2>
              <p className="text-xs text-zinc-400">Resultados finales</p>
            </div>
          </div>
        </div>

        {/* Sección de contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Tarjeta de poster del contenido */}
          {(posterUrl || report.poster_url) && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 flex flex-col items-center">
                <img
                    src={posterUrl || report.poster_url}
                    alt={`Poster de ${report.title}`}
                    className="w-full max-w-[160px] rounded-lg shadow-lg border-2 border-zinc-700 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                />
              </div>
          )}

          {/* Tarjeta de información básica del contenido */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <h3 className="text-sm font-semibold text-zinc-400 mb-2">Contenido Analizado</h3>
            <p className="text-lg font-bold text-white">{report.title}</p>
            <p className="text-xs text-zinc-500 mt-1">
              {report.duration} • {report.shots} frames analizados
            </p>
          </div>

          {/* Tarjeta de métrica destacada: actores detectados */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <p className="text-xs text-zinc-400 mb-2">Actores/Actrices Detectad@s</p>
            <p className="text-3xl font-bold text-red-500">{report.detectedActors.length}</p>
          </div>

          {/* Tarjeta de top actores con sistema de ranking */}
          {report.detectedActors.length > 0 && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Top Actores/Actrices</h3>

                <div className="space-y-2">
                  {report.detectedActors.slice(0, 5).map((actor, idx) => (
                      <div
                          key={actor.actor_id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50 hover:bg-zinc-800/50 transition-colors"
                      >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            idx === 0 ? "bg-yellow-600 text-white" :
                                idx === 1 ? "bg-zinc-500 text-white" :
                                    idx === 2 ? "bg-orange-600 text-white" :
                                        "bg-zinc-700 text-zinc-300"
                        }`}>
                          {idx + 1}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{actor.nombre}</p>
                          <p className="text-xs text-zinc-400 truncate">{actor.personaje}</p>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold text-red-500">{actor.similitud}%</p>
                        </div>
                      </div>
                  ))}
                </div>

                {report.detectedActors.length > 5 && (
                    <p className="text-xs text-zinc-500 text-center mt-3 pt-3 border-t border-zinc-800">
                      +{report.detectedActors.length - 5} actores/actrices más
                    </p>
                )}
              </div>
          )}

          {/* Tarjeta de análisis cinematográfico técnico */}
          {(report.shot_types_summary || report.lighting_summary || report.color_analysis_summary || report.camera_summary || report.emotions_summary || report.composition_summary) && (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Análisis Cinematográfico</h3>

                <div className="space-y-3 text-xs">
                  {report.shot_types_summary?.most_common && (
                      <div className="flex justify-between py-2 border-b border-zinc-800">
                        <span className="text-zinc-400">Plano dominante:</span>
                        <span className="text-white font-semibold">{report.shot_types_summary.most_common}</span>
                      </div>
                  )}

                  {report.lighting_summary?.most_common && (
                      <div className="flex justify-between py-2 border-b border-zinc-800">
                        <span className="text-zinc-400">Iluminación:</span>
                        <span className="text-white font-semibold">{report.lighting_summary.most_common}</span>
                      </div>
                  )}

                  {report.color_analysis_summary?.most_common_temperature && (
                      <div className="flex justify-between py-2 border-b border-zinc-800">
                        <span className="text-zinc-400">Temperatura:</span>
                        <span className="text-white font-semibold">{report.color_analysis_summary.most_common_temperature}</span>
                      </div>
                  )}

                  {report.color_analysis_summary?.most_common_scheme && (
                      <div className="flex justify-between py-2 border-b border-zinc-800">
                        <span className="text-zinc-400">Esquema cromático:</span>
                        <span className="text-white font-semibold">{report.color_analysis_summary.most_common_scheme}</span>
                      </div>
                  )}

                  {report.camera_summary?.most_common && (
                      <div className="flex justify-between py-2 border-b border-zinc-800">
                        <span className="text-zinc-400">Movimiento cámara:</span>
                        <span className="text-white font-semibold">{report.camera_summary.most_common}</span>
                      </div>
                  )}

                  {report.emotions_summary?.most_common && (
                      <div className="flex justify-between py-2 border-b border-zinc-800">
                        <span className="text-zinc-400">Emoción predominante:</span>
                        <span className="text-white font-semibold">{report.emotions_summary.most_common}</span>
                      </div>
                  )}

                  {report.composition_summary && (
                      <div className="flex justify-between py-2">
                        <span className="text-zinc-400">Composición:</span>
                        <span className="text-white font-semibold">
                        Tercios: {report.composition_summary.avg_rule_of_thirds?.toFixed(1)}% |
                        Simetría: {report.composition_summary.avg_symmetry?.toFixed(1)}%
                      </span>
                      </div>
                  )}
                </div>
              </div>
          )}

        </div>

        {/* Sección de controles de acción */}
        <div className="p-6 space-y-2 border-t border-zinc-800 bg-black/50">
          {/* Botón de descarga de PDF con estado de carga */}
          <Button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="w-full bg-red-600 cursor-pointer hover:bg-red-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generando PDF...
                </>
            ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Descargar PDF con Gráficos
                </>
            )}
          </Button>

          {/* Menú desplegable de opciones de compartir */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                  variant="outline"
                  className="w-full cursor-pointer border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      ¡Copiado!
                    </>
                ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartir Análisis
                    </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-56 bg-zinc-900 border border-white/40"
                align="end"
            >
              <DropdownMenuLabel className="text-zinc-400 text-xs">
                Opciones de compartir
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />

              <DropdownMenuItem
                  onClick={handleCopyText}
                  className="text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copiar texto completo
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-zinc-800" />

              <DropdownMenuItem
                  onClick={handleShareWhatsApp}
                  className="text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </DropdownMenuItem>

              <DropdownMenuItem
                  onClick={handleShareEmail}
                  className="text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </DropdownMenuItem>

              {isShareSupported && (
                  <>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem
                        onClick={handleNativeShare}
                        className="text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Más opciones...
                    </DropdownMenuItem>
                  </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Botón de reinicio para nuevo análisis */}
          <Button
              className="w-full cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors"
              onClick={onNewAnalysisAction}
          >
            Nuevo Análisis
          </Button>
        </div>
      </div>
  )
}