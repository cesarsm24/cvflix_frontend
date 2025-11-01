/**
 * upload-form.tsx
 *
 * Componente de formulario de carga de video para análisis cinematográfico.
 * Implementa validación de duración, preview del video y soporte para drag & drop.
 *
 * Author: César Sánchez Montes
 * Course: Imagen Digital
 * Year: 2025
 * Version: 3.0.0
 *
 * Dependencies:
 *   - react: Gestión de estado con hooks
 *   - lucide-react: Iconos de interfaz (Film, FileVideo, X, AlertCircle, HelpCircle)
 *   - @/components/ui/button: Componente de botón reutilizable
 *   - @/components/ui/input: Componente de campo de entrada
 *   - @/components/ui/label: Componente de etiqueta de formulario
 *   - @/components/ui/alert: Componente de alerta para mensajes de error
 *
 * Usage:
 *   import { UploadForm } from '@/components/upload-form'
 *
 *   <UploadForm
 *     onStartProcessingAction={(title, file) => handleProcess(title, file)}
 *     disabled={isProcessing}
 *   />
 *
 * Notes:
 *   Validaciones implementadas:
 *     - Duración máxima: 30 segundos
 *     - Tipo de archivo: Solo formatos de video
 *     - Título obligatorio: Campo no vacío
 *
 *   Características de UX:
 *     - Zona de arrastrar y soltar con feedback visual
 *     - Preview del video cargado con controles nativos
 *     - Información de archivo (nombre, tamaño en MB)
 *     - Alertas descriptivas para errores de validación
 *     - Botón de eliminación para limpiar selección
 *
 *   Gestión de memoria:
 *     - Revocación de Object URLs para prevenir memory leaks
 *     - Limpieza automática al cambiar o eliminar video
 */

"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Film, FileVideo, X, AlertCircle, HelpCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

/**
 * Props del componente UploadForm.
 */
interface UploadFormProps {
  /** Callback ejecutado al enviar formulario con título y archivo válidos */
  onStartProcessingAction: (title: string, file: File) => void
  /** Deshabilita todos los controles del formulario durante procesamiento */
  disabled?: boolean
}

/**
 * Componente UploadForm.
 *
 * Renderiza formulario de carga con validación de video, preview y soporte
 * para selección mediante click o drag & drop. Valida duración del video
 * antes de permitir envío del formulario.
 *
 * @param onStartProcessingAction - Función callback con título y archivo validados
 * @param disabled - Estado de deshabilitación de controles
 * @returns Formulario completo de carga de video
 *
 * Notes:
 *   Estados internos:
 *     - title: Título del contenido ingresado por usuario
 *     - file: Objeto File del video seleccionado
 *     - videoPreview: Object URL para preview del video
 *     - dragActive: Indica si usuario está arrastrando archivo sobre zona
 *     - error: Mensaje de error de validación (null si válido)
 *     - showHelp: Control de visibilidad de ayuda contextual
 *
 *   Validación de duración:
 *     Utiliza elemento video temporal para cargar metadata y verificar
 *     duración antes de aceptar el archivo. Rechaza videos > 30 segundos.
 *
 *   Formatos soportados:
 *     Cualquier formato con MIME type "video/*" (MP4, MOV, AVI, WebM, etc.)
 */
export function UploadForm({ onStartProcessingAction, disabled }: UploadFormProps) {
  /**
   * Título del contenido ingresado por el usuario.
   *
   * @default ""
   */
  const [title, setTitle] = useState("")

  /**
   * Archivo de video seleccionado.
   *
   * @default null - Sin archivo seleccionado
   */
  const [file, setFile] = useState<File | null>(null)

  /**
   * Object URL para preview del video en elemento <video>.
   *
   * @default null - Sin preview disponible
   */
  const [videoPreview, setVideoPreview] = useState<string | null>(null)

  /**
   * Indica si usuario está arrastrando archivo sobre zona de drop.
   *
   * @default false - Sin acción de arrastre activa
   */
  const [dragActive, setDragActive] = useState(false)

  /**
   * Mensaje de error de validación.
   *
   * @default null - Sin errores de validación
   */
  const [error, setError] = useState<string | null>(null)

  /**
   * Control de visibilidad de ayuda contextual.
   *
   * @default false - Ayuda oculta
   */
  const [showHelp, setShowHelp] = useState(false)

  /**
   * Gestiona eventos de arrastre sobre zona de drop.
   *
   * Previene comportamiento por defecto del navegador y actualiza estado
   * visual de la zona de drop según tipo de evento (enter/over/leave).
   *
   * @param e - Evento de arrastre del navegador
   *
   * Notes:
   *   Eventos gestionados:
   *     - dragenter: Usuario entra a zona con archivo
   *     - dragover: Usuario mantiene archivo sobre zona
   *     - dragleave: Usuario sale de zona con archivo
   */
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  /**
   * Valida duración del video mediante elemento temporal.
   *
   * Crea elemento video en memoria, carga metadata del archivo y verifica
   * que la duración no exceda 30 segundos. Establece mensaje de error
   * descriptivo si validación falla.
   *
   * @param videoFile - Archivo de video a validar
   * @returns Promise que resuelve true si válido, false si inválido
   *
   * Notes:
   *   Proceso de validación:
   *     1. Crea elemento <video> temporal (no renderizado)
   *     2. Configura preload='metadata' para carga rápida
   *     3. Asigna handlers onloadedmetadata y onerror
   *     4. Crea Object URL del archivo y lo asigna a video.src
   *     5. Espera carga de metadata
   *     6. Verifica video.duration <= 30 segundos
   *     7. Revoca Object URL para liberar memoria
   *     8. Resuelve Promise con resultado de validación
   *
   *   Manejo de errores:
   *     - Error de carga: Archivo corrupto o formato no soportado
   *     - Duración excedida: Video mayor a 30 segundos
   */
  const validateVideo = (videoFile: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.preload = 'metadata'

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        if (video.duration > 30) {
          setError(`El vídeo dura ${Math.round(video.duration)}s. Por favor, sube un vídeo de máximo 30 segundos.`)
          resolve(false)
        } else {
          setError(null)
          resolve(true)
        }
      }

      video.onerror = () => {
        setError("No se pudo cargar el vídeo. Por favor, intenta con otro archivo.")
        resolve(false)
      }

      video.src = URL.createObjectURL(videoFile)
    })
  }

  /**
   * Gestiona evento de soltar archivo en zona de drop.
   *
   * Procesa archivo soltado, valida tipo y duración, y actualiza estado
   * del formulario con archivo válido o muestra error apropiado.
   *
   * @param e - Evento de soltar del navegador
   *
   * Notes:
   *   Flujo de procesamiento:
   *     1. Previene comportamiento por defecto
   *     2. Desactiva estado visual de drag
   *     3. Extrae primer archivo de dataTransfer
   *     4. Verifica tipo MIME "video/*"
   *     5. Valida duración mediante validateVideo()
   *     6. Si válido: establece file y crea preview
   *     7. Si inválido: muestra mensaje de error
   */
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type.startsWith("video/")) {
        const isValid = await validateVideo(droppedFile)
        if (isValid) {
          setFile(droppedFile)
          setVideoPreview(URL.createObjectURL(droppedFile))
        }
      } else {
        setError("Por favor selecciona un archivo de vídeo válido")
      }
    }
  }

  /**
   * Gestiona selección de archivo mediante input file.
   *
   * Procesa archivo seleccionado mediante diálogo del sistema, valida
   * tipo y duración, y actualiza estado del formulario.
   *
   * @param e - Evento de cambio del input file
   *
   * Notes:
   *   Comportamiento idéntico a handleDrop pero activado mediante
   *   click en zona o input file tradicional.
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type.startsWith("video/")) {
        const isValid = await validateVideo(selectedFile)
        if (isValid) {
          setFile(selectedFile)
          setVideoPreview(URL.createObjectURL(selectedFile))
        }
      } else {
        setError("Por favor selecciona un archivo de vídeo válido")
      }
    }
  }

  /**
   * Elimina video seleccionado y limpia estado del formulario.
   *
   * Revoca Object URL para liberar memoria, limpia estados de archivo,
   * preview y error.
   *
   * Notes:
   *   Limpieza de memoria:
   *     URL.revokeObjectURL() es crítico para prevenir memory leaks.
   *     Object URLs permanecen en memoria hasta revocación explícita
   *     o cierre de documento.
   */
  const handleRemoveVideo = () => {
    setFile(null)
    setError(null)
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview)
      setVideoPreview(null)
    }
  }

  /**
   * Gestiona envío del formulario.
   *
   * Previene comportamiento por defecto, valida presencia de título y archivo,
   * y ejecuta callback con datos validados.
   *
   * @param e - Evento de envío del formulario
   *
   * Notes:
   *   Validación final antes de callback asegura que siempre se envían
   *   datos completos y válidos a componente padre.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title && file) {
      onStartProcessingAction(title, file)
    }
  }

  /** Validación combinada de formulario completo */
  const isFormValid = title.trim() !== "" && file !== null && !error

  return (
      <div className="relative min-h-screen">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-8">
          {/* Encabezado del formulario */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground">Análisis Cinematográfico</h1>
            <p className="mt-2 text-muted-foreground">Sube tu escena y obtén un análisis profesional</p>
          </div>

          {/* Contenedor principal del formulario */}
          <div className="rounded-lg border-2 border-white/20 bg-card p-8 shadow-lg">
            <div className="space-y-6">
              {/* Campo de título */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="title" className="text-base font-semibold text-foreground">
                    Título de la película o serie
                  </Label>
                </div>
                <Input
                    id="title"
                    type="text"
                    placeholder="Ej: Blade Runner 2049"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={disabled}
                    className="h-12 border border-white/20 bg-background/50 text-foreground shadow-sm"
                />
              </div>

              {/* Campo de carga de video */}
              <div className="space-y-2">
                <Label htmlFor="video" className="text-base font-semibold text-foreground">
                  Escena (máximo 30 segundos)
                </Label>

                {/* Alerta de error de validación */}
                {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Zona de drag & drop o preview del video */}
                {!file ? (
                    <div
                        className={`relative rounded-lg border border-dashed transition-colors ${
                            dragActive
                                ? "border-primary bg-primary/10"
                                : "border-white/20 bg-background/50 hover:border-primary/50 shadow-sm"
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                      <Input
                          id="video"
                          type="file"
                          accept="video/*"
                          onChange={handleFileChange}
                          disabled={disabled}
                          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                      />
                      <div className="flex flex-col items-center justify-center gap-4 p-12">
                        <div className="rounded-full bg-primary/10 p-4">
                          <FileVideo className="h-10 w-10 text-primary" />
                        </div>
                        <div className="text-center">
                          <p className="text-base font-medium text-foreground">
                            Arrastra tu vídeo aquí o haz clic para seleccionar
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Formatos soportados: MP4, MOV, AVI (máx. 30 segundos)
                          </p>
                        </div>
                      </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                      {/* Preview del video con botón de eliminación */}
                      <div className="relative overflow-hidden rounded-lg border border-white/20 bg-black shadow-sm">
                        <video
                            src={videoPreview || undefined}
                            controls
                            className="h-auto w-full"
                            style={{ maxHeight: "400px" }}
                        >
                          Tu navegador no soporta la reproducción de vídeo.
                        </video>
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={handleRemoveVideo}
                            className="absolute cursor-pointer right-2 top-2 h-8 w-8 rounded-full"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Información del archivo */}
                      <div className="flex items-center gap-2 rounded-md border border-white/20 bg-primary/5 p-3 text-sm text-foreground shadow-sm">
                        <Film className="h-4 w-4 text-primary" />
                        <span className="font-medium">{file.name}</span>
                        <span className="ml-auto text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* Botón de envío del formulario */}
          <Button
              type="submit"
              size="lg"
              disabled={!isFormValid || disabled}
              className="h-14 w-full cursor-pointer bg-primary text-lg font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl disabled:opacity-50"
          >
            {disabled ? "Procesando..." : "Iniciar Análisis Cinematográfico"}
          </Button>
        </form>

      </div>
  )
}