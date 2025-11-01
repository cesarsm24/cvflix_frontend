import jsPDF from "jspdf"
import type { AnalysisReport, ColorPalette } from "./types"
import { Chart } from 'chart.js/auto'

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

/**
 * GENERADOR DE PDF ESTILO NETFLIX - CVFlix
 * SIN simulación de datos - Solo usa datos reales del backend
 *
 * ✅ VERSIÓN PARCHEADA - Maneja correctamente paleta de colores y movimientos de cámara
 */

// ==================== CONFIGURACIÓN NETFLIX ====================
const NETFLIX_RED = "#E50914"
const DARK_RED = "#B71C1C"
const BLACK = "#000000"
const WHITE = "#FFFFFF"
const DARK_GRAY = "#141414"
const MID_GRAY = "#757575"
const LIGHT_GRAY = "#E5E5E5"

const colors = {
  red: [229, 9, 20] as [number, number, number],
  darkRed: [183, 28, 28] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  lightGray: [245, 245, 245] as [number, number, number],
  mediumGray: [117, 117, 117] as [number, number, number],
}

// ==================== FUNCIONES DE GENERACIÓN DE GRÁFICOS ====================

/**
 * Gráfico de barras horizontales para tipos de plano (SIN EJES - solo barras)
 */
async function generateShotDistributionChart(
    data: Record<string, number>
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 700
      canvas.height = 400

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        console.warn('No se pudo obtener contexto 2D para shot distribution')
        resolve('')
        return
      }

      const sortedData = Object.entries(data)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 8)

      if (sortedData.length === 0) {
        console.warn('No hay datos para shot distribution')
        resolve('')
        return
      }

      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: sortedData.map(([name]) => name),
          datasets: [{
            data: sortedData.map(([, value]) => value),
            backgroundColor: DARK_RED,
            borderRadius: 4,
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: false,
          animation: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
          },
          scales: {
            x: {
              display: false,
              beginAtZero: true,
              max: 100
            },
            y: {
              display: false
            }
          },
          layout: {
            padding: {
              left: 120,
              right: 20,
              top: 10,
              bottom: 10
            }
          }
        },
        plugins: [{
          id: 'barLabels',
          afterDatasetsDraw(chart) {
            const ctx = chart.ctx
            const meta = chart.getDatasetMeta(0)

            chart.data.datasets[0].data.forEach((value, index) => {
              const bar = meta.data[index]
              const label = chart.data.labels?.[index] as string

              // Etiqueta del tipo de plano (izquierda)
              ctx.fillStyle = BLACK
              ctx.font = 'bold 13px sans-serif'
              ctx.textAlign = 'right'
              ctx.textBaseline = 'middle'
              ctx.fillText(
                  label,
                  (bar as any).x - (bar as any).width - 10,
                  (bar as any).y
              )

              // Porcentaje dentro de la barra
              ctx.fillStyle = 'white'
              ctx.font = 'bold 14px sans-serif'
              ctx.textAlign = 'right'
              ctx.textBaseline = 'middle'
              ctx.fillText(
                  `${(value as number).toFixed(1)}%`,
                  (bar as any).x - 10,
                  (bar as any).y
              )
            })
          }
        }]
      })

      setTimeout(() => {
        const imgData = canvas.toDataURL('image/png')
        chart.destroy()
        resolve(imgData)
      }, 100)
    } catch (error) {
      console.error('Error generando shot distribution chart:', error)
      resolve('')
    }
  })
}

/**
 * Donut de distribución de emociones (COLORES ROJO Y NEGRO)
 */
async function generateEmotionDonutChart(
    distribution: Record<string, number>
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 500
      canvas.height = 500

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        console.warn('No se pudo obtener contexto 2D para emotion donut')
        resolve('')
        return
      }

      const emotions = Object.entries(distribution)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 7)

      if (emotions.length === 0) {
        console.warn('No hay datos de emociones')
        resolve('')
        return
      }

      // NUEVA PALETA: Rojo y Negro
      const EMOTION_COLORS = {
        "Feliz": "#FFFFFF",
        "Triste": "#424242",
        "Neutral": "#757575",
        "Enfadado": "#E50914",
        "Sorprendido": "#9E9E9E",
        "Miedo": "#B71C1C",
        "Disgustado": "#000000"
      }

      const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: emotions.map(([name]) => name),
          datasets: [{
            data: emotions.map(([, value]) => value),
            backgroundColor: emotions.map(([name]) =>
                EMOTION_COLORS[name as keyof typeof EMOTION_COLORS] || "#757575"
            ),
            borderWidth: 3,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: false,
          animation: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { size: 12, weight: 'bold' },
                color: BLACK,
                padding: 15,
                boxWidth: 20
              }
            },
            tooltip: { enabled: false }
          }
        },
        plugins: [{
          id: 'doughnutLabels',
          afterDatasetsDraw(chart) {
            const ctx = chart.ctx
            const meta = chart.getDatasetMeta(0)
            meta.data.forEach((arc: any, index) => {
              const value = emotions[index][1]
              if (value > 5) {
                const angle = (arc.startAngle + arc.endAngle) / 2
                const radius = (arc.innerRadius + arc.outerRadius) / 2
                const x = arc.x + Math.cos(angle) * radius
                const y = arc.y + Math.sin(angle) * radius

                const emotionName = emotions[index][0]
                const bgColor = EMOTION_COLORS[emotionName as keyof typeof EMOTION_COLORS]

                // Texto blanco para colores oscuros, negro para claros
                ctx.fillStyle = (bgColor === "#FFFFFF" || bgColor === "#9E9E9E") ? 'black' : 'white'
                ctx.font = 'bold 14px sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(`${value.toFixed(1)}%`, x, y)
              }
            })
          }
        }]
      })

      setTimeout(() => {
        const imgData = canvas.toDataURL('image/png')
        chart.destroy()
        resolve(imgData)
      }, 100)
    } catch (error) {
      console.error('Error generando emotion donut chart:', error)
      resolve('')
    }
  })
}

/**
 * Medidor semicircular de emoción dominante (VERDE/AMARILLO/ROJO CON ICONOS)
 */
async function generateEmotionGaugeChart(
    dominantEmotion: string,
    percentage: number
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 600
      canvas.height = 400

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve('')
        return
      }

      // Fondo blanco
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const centerX = 300
      const centerY = 280
      const radius = 150

      // Emociones con iconos y colores verde/amarillo/rojo
      const emotions = [
        { name: "Feliz", emoji: "😊", color: "#4CAF50", start: 0, end: 25.7 },
        { name: "Sorprendido", emoji: "⚡", color: "#8BC34A", start: 25.7, end: 51.4 },
        { name: "Neutral", emoji: "😐", color: "#FFEB3B", start: 51.4, end: 77.1 },
        { name: "Disgustado", emoji: "😖", color: "#FFC107", start: 77.1, end: 102.8 },
        { name: "Miedo", emoji: "💀", color: "#FF9800", start: 102.8, end: 128.5 },
        { name: "Triste", emoji: "🌧️", color: "#FF5722", start: 128.5, end: 154.2 },
        { name: "Enfadado", emoji: "🔥", color: "#F44336", start: 154.2, end: 180 }
      ]

      ctx.lineWidth = 24
      emotions.forEach(emotion => {
        ctx.beginPath()
        ctx.arc(
            centerX,
            centerY,
            radius,
            (emotion.start - 180) * Math.PI / 180,
            (emotion.end - 180) * Math.PI / 180
        )
        ctx.strokeStyle = emotion.color
        ctx.stroke()
      })

      // Dibujar emojis/iconos en cada sección
      emotions.forEach(emotion => {
        const angle = (emotion.start + emotion.end) / 2
        const angleRad = (angle - 180) * Math.PI / 180
        const iconRadius = 195
        const x = centerX + iconRadius * Math.cos(angleRad)
        const y = centerY + iconRadius * Math.sin(angleRad)

        ctx.font = '24px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(emotion.emoji, x, y)
      })

      // Encontrar ángulo de la emoción dominante
      const emotion = emotions.find(e => e.name === dominantEmotion)
      const angle = emotion ? (emotion.start + emotion.end) / 2 : 90

      // Dibujar aguja
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      const needleAngle = (angle - 180) * Math.PI / 180
      ctx.lineTo(
          centerX + (radius - 15) * Math.cos(needleAngle),
          centerY + (radius - 15) * Math.sin(needleAngle)
      )
      ctx.strokeStyle = BLACK
      ctx.lineWidth = 4
      ctx.stroke()

      // Centro de la aguja
      ctx.beginPath()
      ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI)
      ctx.fillStyle = BLACK
      ctx.fill()
      ctx.beginPath()
      ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI)
      ctx.fillStyle = WHITE
      ctx.fill()

      // Texto central
      const emotionEmoji = emotion?.emoji || "😐"
      ctx.font = 'bold 48px Arial'
      ctx.fillStyle = BLACK
      ctx.textAlign = 'center'
      ctx.fillText(emotionEmoji, centerX, centerY + 60)

      ctx.font = 'bold 24px sans-serif'
      ctx.fillText(dominantEmotion, centerX, centerY + 100)

      ctx.font = '18px sans-serif'
      ctx.fillStyle = MID_GRAY
      ctx.fillText(`${percentage.toFixed(1)}% del contenido`, centerX, centerY + 125)

      setTimeout(() => {
        const imgData = canvas.toDataURL('image/png')
        resolve(imgData)
      }, 100)
    } catch (error) {
      console.error('Error generando emotion gauge:', error)
      resolve('')
    }
  })
}

/**
 * Histograma RGB
 */
async function generateColorHistogramChart(
    data: { r: number[]; g: number[]; b: number[] }
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 300

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve('')
        return
      }

      const labels = Array.from({ length: 256 }, (_, i) => i)

      const chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Rojo',
              data: data.r,
              borderColor: 'rgba(229, 9, 20, 0.7)',
              backgroundColor: 'rgba(229, 9, 20, 0.1)',
              fill: true,
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.3
            },
            {
              label: 'Verde',
              data: data.g,
              borderColor: 'rgba(76, 175, 80, 0.7)',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              fill: true,
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.3
            },
            {
              label: 'Azul',
              data: data.b,
              borderColor: 'rgba(33, 150, 243, 0.7)',
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              fill: true,
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: false,
          animation: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                font: { size: 12, weight: 'bold' },
                color: BLACK,
                boxWidth: 30
              }
            },
            tooltip: { enabled: false }
          },
          scales: {
            x: {
              display: true,
              grid: { display: false },
              ticks: {
                maxTicksLimit: 8,
                font: { size: 10 },
                color: MID_GRAY
              }
            },
            y: {
              display: true,
              grid: { color: 'rgba(0,0,0,0.05)' },
              ticks: {
                font: { size: 10 },
                color: MID_GRAY
              }
            }
          }
        }
      })

      setTimeout(() => {
        const imgData = canvas.toDataURL('image/png')
        chart.destroy()
        resolve(imgData)
      }, 100)
    } catch (error) {
      console.error('Error generando histogram:', error)
      resolve('')
    }
  })
}

/**
 * ✅ PARCHEADO: Gráfico de análisis de esquema cromático
 */
async function generateColorSchemeChart(
    scheme: string,
    maxHueDifference: number,
    dominantColors: ColorPalette[]
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 600
      canvas.height = 350

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve('')
        return
      }

      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Título
      ctx.font = 'bold 20px sans-serif'
      ctx.fillStyle = BLACK
      ctx.textAlign = 'center'
      ctx.fillText('Esquema Cromático', 300, 30)

      // Esquema identificado
      ctx.fillStyle = BLACK
      ctx.fillRect(200, 50, 200, 40)
      ctx.font = 'bold 16px sans-serif'
      ctx.fillStyle = WHITE
      ctx.textAlign = 'center'
      ctx.fillText(scheme.toUpperCase(), 300, 75)

      // ✅ PARCHE: Filtrar colores válidos ANTES de usarlos
      const colors = dominantColors
          .filter(c => {
            if (!c) return false

            const hasHex = typeof c.hex === 'string' && c.hex.length > 0
            const hasRgb = Array.isArray(c.rgb) && c.rgb.length >= 3

            // ✅ CRÍTICO: El backend envía 'percentage', NO 'frequency'
            const freq = c.percentage || c.frequency || (c as any).appearances || 0
            const hasFreq = typeof freq === 'number' && freq >= 0

            return hasHex && hasRgb && hasFreq
          })
          .slice(0, 3)

      console.log(`🎨 Colores válidos: ${colors.length}/${dominantColors.length}`)

      if (colors.length === 0) {
        console.warn("⚠️ No hay colores válidos para scheme chart")
        ctx.font = '14px sans-serif'
        ctx.fillStyle = BLACK
        ctx.textAlign = 'center'
        ctx.fillText('Datos insuficientes', 300, 200)
        resolve(canvas.toDataURL('image/png'))
        return
      }

      // Colores dominantes
      const boxWidth = 80
      const startX = 300 - (colors.length * boxWidth) / 2

      colors.forEach((color, index) => {
        const x = startX + index * boxWidth + 10

        ctx.fillStyle = color.hex
        ctx.fillRect(x, 110, boxWidth - 20, boxWidth - 20)

        ctx.strokeStyle = '#ccc'
        ctx.lineWidth = 2
        ctx.strokeRect(x, 110, boxWidth - 20, boxWidth - 20)

        ctx.font = '11px monospace'
        ctx.fillStyle = BLACK
        ctx.textAlign = 'center'
        ctx.fillText(color.hex.toUpperCase(), x + (boxWidth - 20) / 2, 180)

        ctx.font = '10px sans-serif'
        ctx.fillStyle = MID_GRAY
        // Usar percentage o frequency
        const freq = color.percentage || color.frequency || (color as any).appearances || 0
        ctx.fillText(`${freq.toFixed(1)}%`, x + (boxWidth - 20) / 2, 195)
      })

      // Barra de diferencia de matiz
      ctx.font = 'bold 14px sans-serif'
      ctx.fillStyle = BLACK
      ctx.textAlign = 'left'
      ctx.fillText('Diferencia Angular de Matiz', 50, 230)

      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`${maxHueDifference.toFixed(1)}°`, 550, 230)

      const barWidth = 500
      const barX = 50
      const barY = 240

      ctx.fillStyle = '#f0f0f0'
      ctx.fillRect(barX, barY, barWidth, 30)

      const fillWidth = (maxHueDifference / 180) * barWidth
      const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0)
      gradient.addColorStop(0, '#9E9E9E')
      gradient.addColorStop(0.5, '#D32F2F')
      gradient.addColorStop(1, '#8B0000')

      ctx.fillStyle = gradient
      ctx.fillRect(barX, barY, fillWidth, 30)

      ctx.strokeStyle = '#ccc'
      ctx.lineWidth = 1
      ctx.strokeRect(barX, barY, barWidth, 30)

      if (maxHueDifference > 20) {
        ctx.font = 'bold 12px sans-serif'
        ctx.fillStyle = WHITE
        ctx.textAlign = 'right'
        ctx.fillText(`${maxHueDifference.toFixed(1)}°`, barX + fillWidth - 5, barY + 20)
      }

      // Escala
      ctx.font = '10px sans-serif'
      ctx.fillStyle = MID_GRAY
      ctx.textAlign = 'left'
      ctx.fillText('0° (Monocromático)', barX, barY + 45)
      ctx.textAlign = 'right'
      ctx.fillText('180° (Complementario)', barX + barWidth, barY + 45)

      // Nivel de contraste
      let contrastLevel = "Muy Bajo"
      if (maxHueDifference >= 120) contrastLevel = "Muy Alto"
      else if (maxHueDifference >= 60) contrastLevel = "Alto"
      else if (maxHueDifference >= 30) contrastLevel = "Moderado"
      else if (maxHueDifference >= 15) contrastLevel = "Bajo"

      ctx.font = 'bold 14px sans-serif'
      ctx.fillStyle = BLACK
      ctx.textAlign = 'left'
      ctx.fillText('Nivel de Contraste:', 50, 300)

      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(contrastLevel, 550, 300)

      setTimeout(() => {
        const imgData = canvas.toDataURL('image/png')
        resolve(imgData)
      }, 100)
    } catch (error) {
      console.error('Error generando color scheme chart:', error)
      resolve('')
    }
  })
}

/**
 * Gauge de temperatura de color
 */
async function generateColorTemperatureGauge(
    temperature: { label: string; value: number }
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 600
      canvas.height = 350

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve('')
        return
      }

      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Título
      ctx.font = 'bold 20px sans-serif'
      ctx.fillStyle = BLACK
      ctx.textAlign = 'center'
      ctx.fillText('Temperatura de Color', 300, 30)

      // Barra de gradiente
      const barWidth = 500
      const barHeight = 50
      const barX = 50
      const barY = 70

      const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0)
      gradient.addColorStop(0, '#1E88E5')
      gradient.addColorStop(0.2, '#42A5F5')
      gradient.addColorStop(0.35, '#90CAF9')
      gradient.addColorStop(0.5, '#E0E0E0')
      gradient.addColorStop(0.65, '#FFB74D')
      gradient.addColorStop(0.8, '#FF9800')
      gradient.addColorStop(1, '#E64A19')

      ctx.fillStyle = gradient
      ctx.fillRect(barX, barY, barWidth, barHeight)

      ctx.strokeStyle = '#ccc'
      ctx.lineWidth = 2
      ctx.strokeRect(barX, barY, barWidth, barHeight)

      // Indicador
      const percentage = ((temperature.value + 1) / 2) * 100
      const indicatorX = barX + (percentage / 100) * barWidth

      ctx.fillStyle = BLACK
      ctx.fillRect(indicatorX - 2, barY - 10, 4, barHeight + 20)

      // Flechas
      ctx.beginPath()
      ctx.moveTo(indicatorX, barY - 10)
      ctx.lineTo(indicatorX - 6, barY - 18)
      ctx.lineTo(indicatorX + 6, barY - 18)
      ctx.closePath()
      ctx.fill()

      ctx.beginPath()
      ctx.moveTo(indicatorX, barY + barHeight + 10)
      ctx.lineTo(indicatorX - 6, barY + barHeight + 18)
      ctx.lineTo(indicatorX + 6, barY + barHeight + 18)
      ctx.closePath()
      ctx.fill()

      // Etiquetas
      ctx.font = '11px sans-serif'
      ctx.fillStyle = MID_GRAY
      ctx.textAlign = 'left'
      ctx.fillText('Frío (2000K)', barX, barY + barHeight + 35)
      ctx.textAlign = 'center'
      ctx.fillText('Neutral (6000K)', barX + barWidth / 2, barY + barHeight + 35)
      ctx.textAlign = 'right'
      ctx.fillText('Cálido (10000K)', barX + barWidth, barY + barHeight + 35)

      // Valor central
      const kelvinApprox = Math.round(2000 + (temperature.value + 1) * 4000)

      ctx.font = 'bold 36px sans-serif'
      ctx.fillStyle = BLACK
      ctx.textAlign = 'center'
      ctx.fillText(temperature.label, 300, 200)

      ctx.font = '20px sans-serif'
      ctx.fillStyle = MID_GRAY
      ctx.fillText(`~${kelvinApprox}K`, 300, 230)

      ctx.font = '14px sans-serif'
      ctx.fillText(`Valor: ${temperature.value.toFixed(2)}`, 300, 255)

      // Interpretación
      ctx.font = '12px sans-serif'
      ctx.fillStyle = MID_GRAY
      let interpretation = ''
      if (temperature.value > 0.2) {
        interpretation = 'Tonos cálidos predominantes (naranjas/rojos)'
      } else if (temperature.value >= -0.1) {
        interpretation = 'Temperatura equilibrada (luz de día)'
      } else {
        interpretation = 'Tonos fríos predominantes (azules)'
      }
      ctx.textAlign = 'center'
      ctx.fillText(interpretation, 300, 290)

      setTimeout(() => {
        const imgData = canvas.toDataURL('image/png')
        resolve(imgData)
      }, 100)
    } catch (error) {
      console.error('Error generando temperature gauge:', error)
      resolve('')
    }
  })
}

/**
 * Radar de composición (SIN PUNTUACIÓN)
 */
async function generateCompositionRadarChart(
    data: { rule_of_thirds: number; symmetry: number; balance: number; depth_cues: number }
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 500
      canvas.height = 500

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve('')
        return
      }

      const chart = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: ['Regla de Tercios', 'Simetría', 'Balance', 'Profundidad'],
          datasets: [{
            data: [
              data.rule_of_thirds,
              data.symmetry,
              data.balance,
              data.depth_cues
            ],
            backgroundColor: 'rgba(183, 28, 28, 0.2)',
            borderColor: DARK_RED,
            borderWidth: 3,
            pointBackgroundColor: DARK_RED,
            pointBorderColor: WHITE,
            pointBorderWidth: 2,
            pointRadius: 6
          }]
        },
        options: {
          responsive: false,
          animation: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
          },
          scales: {
            r: {
              min: 0,
              max: 1,
              ticks: {
                stepSize: 0.25,
                font: { size: 10 },
                color: MID_GRAY,
                backdropColor: 'transparent'
              },
              grid: {
                color: 'rgba(0,0,0,0.1)'
              },
              pointLabels: {
                font: { size: 13, weight: 'bold' },
                color: BLACK
              }
            }
          }
        }
      })

      setTimeout(() => {
        const imgData = canvas.toDataURL('image/png')
        chart.destroy()
        resolve(imgData)
      }, 100)
    } catch (error) {
      console.error('Error generando composition radar:', error)
      resolve('')
    }
  })
}

/**
 * Gráfico de zonas de iluminación (heatmap)
 */
async function generateLightingZonesChart(
    zones: { shadows: number; midtones: number; highlights: number }
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 600
      canvas.height = 300

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve('')
        return
      }

      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Título
      ctx.font = 'bold 18px sans-serif'
      ctx.fillStyle = BLACK
      ctx.textAlign = 'center'
      ctx.fillText('Distribución de Zonas de Luz', 300, 30)

      const shadowsPercent = zones.shadows * 100
      const midtonesPercent = zones.midtones * 100
      const highlightsPercent = zones.highlights * 100

      const zoneData = [
        { name: 'Sombras (0-85)', value: shadowsPercent, color: '#212121' },
        { name: 'Medios Tonos (85-170)', value: midtonesPercent, color: '#757575' },
        { name: 'Altas Luces (170-255)', value: highlightsPercent, color: '#BDBDBD' }
      ]

      let yPos = 60
      zoneData.forEach((zone, index) => {
        // Etiqueta y valor
        ctx.font = 'bold 14px sans-serif'
        ctx.fillStyle = BLACK
        ctx.textAlign = 'left'
        ctx.fillText(zone.name, 50, yPos + 15)

        ctx.textAlign = 'right'
        ctx.fillText(`${zone.value.toFixed(1)}%`, 550, yPos + 15)

        // Barra
        const barWidth = 450
        const barHeight = 40
        const barX = 50
        const barY = yPos + 25

        ctx.fillStyle = '#f0f0f0'
        ctx.fillRect(barX, barY, barWidth, barHeight)

        const fillWidth = (zone.value / 100) * barWidth
        ctx.fillStyle = zone.color
        ctx.fillRect(barX, barY, fillWidth, barHeight)

        ctx.strokeStyle = '#ccc'
        ctx.lineWidth = 1
        ctx.strokeRect(barX, barY, barWidth, barHeight)

        // Porcentaje dentro de la barra
        if (zone.value > 15) {
          ctx.font = 'bold 12px sans-serif'
          ctx.fillStyle = (index === 2) ? BLACK : WHITE
          ctx.textAlign = 'right'
          ctx.fillText(`${zone.value.toFixed(1)}%`, barX + fillWidth - 10, barY + barHeight / 2 + 5)
        }

        yPos += 75
      })

      setTimeout(() => {
        const imgData = canvas.toDataURL('image/png')
        resolve(imgData)
      }, 100)
    } catch (error) {
      console.error('Error generando lighting zones:', error)
      resolve('')
    }
  })
}

/**
 * Gráfico de tipos de iluminación
 */
async function generateLightingTypesChart(
    distribution: Record<string, number>
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 600
      canvas.height = 300

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve('')
        return
      }

      const sortedData = Object.entries(distribution)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 6)

      if (sortedData.length === 0) {
        resolve('')
        return
      }

      const LIGHTING_COLORS = {
        "High-key": "#BDBDBD",
        "Low-key": "#212121",
        "Normal": "#757575",
        "Natural": "#9E9E9E",
        "Artificial": "#616161",
        "Mixed": "#424242"
      }

      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: sortedData.map(([name]) => name),
          datasets: [{
            data: sortedData.map(([, value]) => value),
            backgroundColor: sortedData.map(([name]) =>
                LIGHTING_COLORS[name as keyof typeof LIGHTING_COLORS] || "#757575"
            ),
            borderRadius: 4,
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: false,
          animation: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
            title: {
              display: true,
              text: 'Tipos de Iluminación',
              font: { size: 18, weight: 'bold' },
              color: BLACK,
              padding: { bottom: 20 }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              max: 100,
              grid: { display: false },
              ticks: {
                callback: (value) => `${value}%`,
                font: { size: 11 },
                color: MID_GRAY
              }
            },
            y: {
              grid: { display: false },
              ticks: {
                font: { size: 13, weight: 'bold' },
                color: BLACK
              }
            }
          }
        },
        plugins: [{
          id: 'barLabels',
          afterDatasetsDraw(chart) {
            const ctx = chart.ctx
            chart.data.datasets[0].data.forEach((value, index) => {
              const meta = chart.getDatasetMeta(0)
              const bar = meta.data[index]
              ctx.fillStyle = 'white'
              ctx.font = 'bold 13px sans-serif'
              ctx.textAlign = 'right'
              ctx.textBaseline = 'middle'
              ctx.fillText(
                  `${(value as number).toFixed(1)}%`,
                  (bar as any).x - 10,
                  (bar as any).y
              )
            })
          }
        }]
      })

      setTimeout(() => {
        const imgData = canvas.toDataURL('image/png')
        chart.destroy()
        resolve(imgData)
      }, 100)
    } catch (error) {
      console.error('Error generando lighting types:', error)
      resolve('')
    }
  })
}

/**
 * Gauge de exposición
 */
async function generateExposureGauge(
    overexposed: number,
    underexposed: number
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 600
      canvas.height = 300

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve('')
        return
      }

      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Título
      ctx.font = 'bold 18px sans-serif'
      ctx.fillStyle = BLACK
      ctx.textAlign = 'center'
      ctx.fillText('Control de Exposición', 300, 30)

      // Sobreexposición
      ctx.font = 'bold 14px sans-serif'
      ctx.fillStyle = BLACK
      ctx.textAlign = 'left'
      ctx.fillText('Píxeles Quemados (Sobreexposición)', 50, 80)

      const overPercent = overexposed * 100
      ctx.textAlign = 'right'
      ctx.fillText(`${overPercent.toFixed(2)}%`, 550, 80)

      const barWidth = 450
      const barHeight = 35

      ctx.fillStyle = '#f0f0f0'
      ctx.fillRect(50, 90, barWidth, barHeight)

      const overFillWidth = (overPercent / 10) * barWidth
      ctx.fillStyle = '#B71C1C'
      ctx.fillRect(50, 90, Math.min(overFillWidth, barWidth), barHeight)

      ctx.strokeStyle = '#ccc'
      ctx.lineWidth = 1
      ctx.strokeRect(50, 90, barWidth, barHeight)

      // Subexposición
      ctx.font = 'bold 14px sans-serif'
      ctx.fillStyle = BLACK
      ctx.textAlign = 'left'
      ctx.fillText('Píxeles Perdidos (Subexposición)', 50, 170)

      const underPercent = underexposed * 100
      ctx.textAlign = 'right'
      ctx.fillText(`${underPercent.toFixed(2)}%`, 550, 170)

      ctx.fillStyle = '#f0f0f0'
      ctx.fillRect(50, 180, barWidth, barHeight)

      const underFillWidth = (underPercent / 10) * barWidth
      ctx.fillStyle = '#212121'
      ctx.fillRect(50, 180, Math.min(underFillWidth, barWidth), barHeight)

      ctx.strokeStyle = '#ccc'
      ctx.lineWidth = 1
      ctx.strokeRect(50, 180, barWidth, barHeight)

      // Interpretación
      ctx.font = '12px sans-serif'
      ctx.fillStyle = MID_GRAY
      ctx.textAlign = 'center'
      let interpretation = ''
      if (overPercent > 1 || underPercent > 1) {
        interpretation = '⚠️ Atención: Pérdida significativa de información'
      } else {
        interpretation = '✓ Exposición controlada correctamente'
      }
      ctx.fillText(interpretation, 300, 250)

      setTimeout(() => {
        const imgData = canvas.toDataURL('image/png')
        resolve(imgData)
      }, 100)
    } catch (error) {
      console.error('Error generando exposure gauge:', error)
      resolve('')
    }
  })
}

/**
 * Donut de movimientos de cámara (COLORES ROJO/NEGRO)
 */
async function generateCameraMovementDonutChart(
    distribution: Record<string, number>
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 500
      canvas.height = 500

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve('')
        return
      }

      const movements = Object.entries(distribution)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 7)

      if (movements.length === 0) {
        resolve('')
        return
      }

      // NUEVA PALETA: Rojo y Negro
      const CAMERA_COLORS = {
        "Estático": "#FFFFFF",
        "Static": "#FFFFFF",
        "Pan": "#E50914",
        "Tilt": "#B71C1C",
        "Zoom": "#000000",
        "Tracking": "#424242",
        "Dolly": "#757575",
        "Crane": "#9E9E9E"
      }

      const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: movements.map(([name]) => name),
          datasets: [{
            data: movements.map(([, value]) => value),
            backgroundColor: movements.map(([name]) =>
                CAMERA_COLORS[name as keyof typeof CAMERA_COLORS] || "#757575"
            ),
            borderWidth: 3,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: false,
          animation: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { size: 12, weight: 'bold' },
                color: BLACK,
                padding: 15,
                boxWidth: 20
              }
            },
            tooltip: { enabled: false }
          }
        },
        plugins: [{
          id: 'doughnutLabels',
          afterDatasetsDraw(chart) {
            const ctx = chart.ctx
            const meta = chart.getDatasetMeta(0)
            meta.data.forEach((arc: any, index) => {
              const value = movements[index][1]
              if (value > 5) {
                const angle = (arc.startAngle + arc.endAngle) / 2
                const radius = (arc.innerRadius + arc.outerRadius) / 2
                const x = arc.x + Math.cos(angle) * radius
                const y = arc.y + Math.sin(angle) * radius

                const movementName = movements[index][0]
                const bgColor = CAMERA_COLORS[movementName as keyof typeof CAMERA_COLORS]

                ctx.fillStyle = (bgColor === "#FFFFFF" || bgColor === "#9E9E9E") ? 'black' : 'white'
                ctx.font = 'bold 14px sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(`${value.toFixed(1)}%`, x, y)
              }
            })
          }
        }]
      })

      setTimeout(() => {
        const imgData = canvas.toDataURL('image/png')
        chart.destroy()
        resolve(imgData)
      }, 100)
    } catch (error) {
      console.error('Error generando camera movement donut:', error)
      resolve('')
    }
  })
}

/**
 * Timeline de movimientos de cámara
 */
async function generateCameraTimelineChart(
    timeline: Array<{ frame: number; type: string; intensity: number }>
): Promise<string> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 700
      canvas.height = 300

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve('')
        return
      }

      if (!timeline || timeline.length === 0) {
        resolve('')
        return
      }

      // Agrupar por intervalos de 10 segundos (asumiendo 30 fps)
      const intervals: Record<number, Record<string, number>> = {}
      timeline.forEach(item => {
        const timestamp = item.frame / 30 // convertir frame a segundos
        const interval = Math.floor(timestamp / 10) * 10
        if (!intervals[interval]) intervals[interval] = {}
        intervals[interval][item.type] = (intervals[interval][item.type] || 0) + 1
      })

      const sortedIntervals = Object.keys(intervals).map(Number).sort((a, b) => a - b)
      const labels = sortedIntervals.map(i => `${i}s`)

      const movementTypes = Array.from(
          new Set(timeline.map(item => item.type))
      ).slice(0, 5)

      const TIMELINE_COLORS = {
        "Estático": "#FFFFFF",
        "Static": "#FFFFFF",
        "Pan": "#E50914",
        "Tilt": "#B71C1C",
        "Zoom": "#000000",
        "Tracking": "#424242",
        "Dolly": "#757575",
        "Crane": "#9E9E9E"
      }

      const datasets = movementTypes.map(type => ({
        label: type,
        data: sortedIntervals.map(interval => intervals[interval][type] || 0),
        backgroundColor: TIMELINE_COLORS[type as keyof typeof TIMELINE_COLORS] || "#757575",
        borderWidth: 0
      }))

      const chart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets },
        options: {
          responsive: false,
          animation: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                font: { size: 10, weight: 'bold' },
                color: BLACK,
                boxWidth: 15
              }
            },
            tooltip: { enabled: false },
            title: {
              display: true,
              text: 'Evolución Temporal de Movimientos',
              font: { size: 14, weight: 'bold' },
              color: BLACK
            }
          },
          scales: {
            x: {
              stacked: true,
              grid: { display: false },
              ticks: {
                font: { size: 9 },
                color: MID_GRAY,
                maxRotation: 45,
                minRotation: 45
              }
            },
            y: {
              stacked: true,
              grid: { color: 'rgba(0,0,0,0.05)' },
              ticks: {
                font: { size: 10 },
                color: MID_GRAY
              }
            }
          }
        }
      })

      setTimeout(() => {
        const imgData = canvas.toDataURL('image/png')
        chart.destroy()
        resolve(imgData)
      }, 100)
    } catch (error) {
      console.error('Error generando camera timeline:', error)
      resolve('')
    }
  })
}

/**
 * Cargar imagen desde URL
 */
function loadImage(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas")
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            resolve(canvas.toDataURL("image/jpeg"))
          } else {
            resolve(null)
          }
        } catch (error) {
          console.error('Error convirtiendo imagen:', error)
          resolve(null)
        }
      }

      img.onerror = (error) => {
        console.error('Error cargando imagen:', url, error)
        resolve(null)
      }

      let finalUrl = url
      if (url.includes('image.tmdb.org')) {
        const encodedUrl = encodeURIComponent(url)
        finalUrl = `${API_URL}/image-proxy?url=${encodedUrl}`
        console.log(`🔄 Usando proxy TMDB: ${finalUrl}`)
      } else if (!url.startsWith("http")) {
        finalUrl = `${API_URL}${url}`
      }

      img.src = finalUrl
    } catch (error) {
      console.error('Error en loadImage:', error)
      resolve(null)
    }
  })
}

// ==================== GENERADOR PRINCIPAL ====================

export async function generateNetflixPDF(
    report: AnalysisReport,
    firstFrameUrl?: string,
    posterUrl?: string
) {
  try {
    console.log("🎬 Generando PDF estilo Netflix...")
    console.log("📊 Datos del reporte recibidos:", {
      title: report.title,
      hasHistogram: !!report.histogram_data,
      hasTimeline: !!report.camera_timeline,
      hasComposition: !!report.composition_data,
      hasShotTypes: !!report.shot_types_summary,
      hasEmotions: !!report.emotions_summary,
      hasColorAnalysis: !!report.color_analysis_summary,
      hasLighting: !!report.lighting_summary,
      hasCamera: !!report.camera_summary,
      actorsCount: report.detectedActors?.length || 0
    })

    // Validación básica
    if (!report || !report.title) {
      throw new Error('El reporte debe tener al menos un título')
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPos = 20
    let pageNumber = 0
    const totalPages = 8

    // ==================== FUNCIONES AUXILIARES ====================

    function addPage() {
      doc.addPage()
      pageNumber++
      yPos = 20
    }

    function addHeader() {
      doc.setFillColor(...colors.red)
      doc.rect(0, 0, pageWidth, 15, "F")
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(255, 255, 255)
      doc.text("CVFlix", 15, 10)
    }

    function addFooter(page: number, total: number) {
      doc.setFontSize(9)
      doc.setTextColor(...colors.mediumGray)
      doc.setFont("helvetica", "normal")
      doc.text(
          `Página ${page} de ${total}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
      )
    }

    function addSectionTitle(title: string) {
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(...colors.darkRed)
      doc.text(title, 15, yPos)
      yPos += 10
    }

    // ==================== PÁGINA 1: PORTADA ====================
    console.log("📄 Generando página 1: Portada...")

    doc.setFillColor(...colors.black)
    doc.rect(0, 0, pageWidth, pageHeight, "F")

    doc.setFillColor(...colors.red)
    doc.rect(0, 0, pageWidth, 15, "F")
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(255, 255, 255)
    doc.text("CVFlix", 15, 10)

    // Cargar y mostrar el poster si existe
    let posterImage: string | null = null
    if (posterUrl || report.poster_url) {
      const posterUrlToUse = posterUrl || report.poster_url
      if (posterUrlToUse) {
        console.log(`🎬 Cargando poster: ${posterUrlToUse}`)
        posterImage = await loadImage(posterUrlToUse)
      }
    }

    // Si hay poster, ajustar el layout
    if (posterImage) {
      const posterWidth = 60
      const posterHeight = 90
      const posterX = (pageWidth - posterWidth) / 2
      const posterY = 30

      try {
        doc.addImage(posterImage, "JPEG", posterX, posterY, posterWidth, posterHeight, undefined, "FAST")
        doc.setDrawColor(255, 255, 255)
        doc.setLineWidth(0.5)
        doc.rect(posterX, posterY, posterWidth, posterHeight)
        yPos = posterY + posterHeight + 20
      } catch (error) {
        console.error("❌ Error agregando poster:", error)
        yPos = pageHeight / 2 - 40
      }
    } else {
      yPos = pageHeight / 2 - 40
    }

    doc.setFontSize(32)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(255, 255, 255)
    const titleLines = doc.splitTextToSize(report.title, pageWidth - 40)
    doc.text(titleLines, pageWidth / 2, yPos, { align: "center" })
    yPos += titleLines.length * 12

    doc.setFontSize(16)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...colors.lightGray)
    doc.text("Análisis Cinematográfico Completo", pageWidth / 2, yPos + 10, { align: "center" })

    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.text(`Duración: ${report.duration}`, 30, yPos + 20)
    doc.text(`Frames: ${report.shots}`, 30, yPos + 27)
    doc.text(`Actores: ${report.detectedActors?.length || 0}`, 30, yPos + 34)

    addFooter(pageNumber + 1, totalPages)

    // ==================== PÁGINA 2: ACTORES Y PLANOS ====================
    console.log("📄 Generando página 2: Actores y Planos...")
    addPage()
    addHeader()

    addSectionTitle("ACTORES/ACTRICES RECONOCID@S")

    if (report.detectedActors && report.detectedActors.length > 0) {
      const actorsToShow = report.detectedActors.slice(0, 6)
      const actorImages = await Promise.all(
          actorsToShow.map(actor => actor.foto_url ? loadImage(actor.foto_url) : Promise.resolve(null))
      )

      for (let i = 0; i < actorsToShow.length; i++) {
        if (yPos > pageHeight - 30) break

        const actor = actorsToShow[i]

        if (i % 2 === 0) {
          doc.setFillColor(245, 245, 245)
          doc.roundedRect(15, yPos, pageWidth - 30, 18, 2, 2, "F")
        }

        const actorImg = actorImages[i]
        if (actorImg) {
          try {
            doc.addImage(actorImg, "JPEG", 18, yPos + 2, 14, 14, undefined, "FAST")
          } catch (error) {
            console.error("Error agregando imagen de actor:", error)
          }
        }

        const badgeColors: [number, number, number][] = [
          [255, 193, 7],
          [192, 192, 192],
          [205, 127, 50],
          [117, 117, 117]
        ]
        const selectedColor = badgeColors[Math.min(i, 3)]
        doc.setFillColor(selectedColor[0], selectedColor[1], selectedColor[2])
        doc.circle(36, yPos + 9, 2.5, "F")
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(7)
        doc.setFont("helvetica", "bold")
        doc.text(`${i + 1}`, 36, yPos + 10, { align: "center" })

        doc.setTextColor(0, 0, 0)
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.text(actor.nombre, 42, yPos + 7)

        doc.setTextColor(117, 117, 117)
        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.text(actor.personaje, 42, yPos + 12)

        doc.setTextColor(183, 28, 28)
        doc.setFontSize(11)
        doc.setFont("helvetica", "bold")
        const similitud = (actor.similitud !== undefined && actor.similitud !== null)
            ? actor.similitud.toFixed(0)
            : '0'
        doc.text(`${similitud}%`, pageWidth - 20, yPos + 10, { align: "right" })

        yPos += 20
      }
      yPos += 10
    } else {
      doc.setFontSize(10)
      doc.setTextColor(...colors.mediumGray)
      doc.text("No se detectaron actores en este análisis", 15, yPos)
      yPos += 10
    }

    // Gráfico de planos (SIN EJES)
    if (report.shot_types_summary?.distribution) {
      if (yPos > pageHeight - 80) {
        addFooter(pageNumber + 1, totalPages)
        addPage()
        addHeader()
      }

      addSectionTitle("PLANOS CINEMATOGRÁFICOS")

      const shotChart = await generateShotDistributionChart(report.shot_types_summary.distribution)
      if (shotChart) {
        doc.addImage(shotChart, "PNG", 15, yPos, pageWidth - 30, 70, undefined, "FAST")
      } else {
        doc.setFontSize(10)
        doc.setTextColor(...colors.mediumGray)
        doc.text("No hay datos suficientes para mostrar distribución de planos", 15, yPos)
      }
    } else {
      addSectionTitle("PLANOS CINEMATOGRÁFICOS")
      doc.setFontSize(10)
      doc.setTextColor(...colors.mediumGray)
      doc.text("No hay datos de tipos de plano en este análisis", 15, yPos)
    }

    addFooter(pageNumber + 1, totalPages)

    // ==================== PÁGINA 3: EMOCIONES ====================
    console.log("📄 Generando página 3: Emociones...")
    addPage()
    addHeader()

    addSectionTitle("DETECCIÓN DE EMOCIONES")

    if (report.emotions_summary?.distribution) {
      // DONUT (arriba)
      const emotionDonut = await generateEmotionDonutChart(report.emotions_summary.distribution)
      if (emotionDonut) {
        doc.addImage(emotionDonut, "PNG", (pageWidth - 85) / 2, yPos, 85, 85, undefined, "FAST")
        yPos += 95
      }

      // GAUGE (abajo con margen)
      const emotionGauge = await generateEmotionGaugeChart(
          report.emotions_summary.most_common || "Neutral",
          report.emotions_summary.distribution[report.emotions_summary.most_common || "Neutral"] || 0
      )
      if (emotionGauge) {
        doc.addImage(emotionGauge, "PNG", (pageWidth - 85) / 2, yPos, 85, 85, undefined, "FAST")
      }
    } else {
      doc.setFontSize(10)
      doc.setTextColor(...colors.mediumGray)
      doc.text("No hay datos de emociones en este análisis", 15, yPos)
    }

    addFooter(pageNumber + 1, totalPages)

    // ==================== PÁGINA 4: COLOR (histograma y paleta) ====================
    console.log("📄 Generando página 4: Análisis de Color...")
    addPage()
    addHeader()

    addSectionTitle("ANÁLISIS DE COLOR")

// Histograma RGB
    if (report.histogram_data) {
      const histogram = await generateColorHistogramChart(report.histogram_data)
      if (histogram) {
        doc.addImage(histogram, "PNG", 15, yPos, pageWidth - 30, 50, undefined, "FAST")
        yPos += 60
      }
    } else {
      doc.setFontSize(10)
      doc.setTextColor(...colors.mediumGray)
      doc.text("No hay datos de histograma RGB", 15, yPos)
      yPos += 10
    }

// ✅ PARCHEADO: Paleta de colores - Validación mejorada
    if (report.color_analysis_summary?.global_palette && Array.isArray(report.color_analysis_summary.global_palette)) {
      console.log("🎨 DEBUG Paleta COMPLETA:", report.color_analysis_summary.global_palette)
      console.log("🎨 Primer color estructura:", JSON.stringify(report.color_analysis_summary.global_palette[0], null, 2))

      const colorsPalette = report.color_analysis_summary.global_palette.slice(0, 5)

      // Filtrar solo colores válidos (más tolerante)
      const validColors = colorsPalette.filter(c => {
        console.log("🔍 Validando color:", c)
        const hasHex = c && typeof c.hex === 'string' && c.hex.length > 0
        const hasRgb = c && Array.isArray(c.rgb) && c.rgb.length >= 3
        // ✅ CAMBIO CRÍTICO: Usar percentage primero
        const hasFreq = c && (typeof c.percentage === 'number' || typeof c.frequency === 'number' || typeof (c as any).appearances === 'number')
        console.log("  - hasHex:", hasHex, "| hasRgb:", hasRgb, "| hasFreq:", hasFreq)
        return hasHex && hasRgb && hasFreq
      })

      console.log(`✅ Colores válidos en paleta: ${validColors.length}/${colorsPalette.length}`)

      if (validColors.length > 0) {
        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(0, 0, 0)
        doc.text("Paleta de Colores Dominantes", 15, yPos)
        yPos += 8

        // Ajustar ancho según colores disponibles
        const boxWidth = (pageWidth - 40) / validColors.length
        const boxHeight = 25

        validColors.forEach((color, index) => {
          const x = 15 + index * boxWidth

          // Dibujar cuadrado de color
          doc.setFillColor(color.rgb[0], color.rgb[1], color.rgb[2])
          doc.rect(x, yPos, boxWidth - 2, boxHeight, "F")

          // Borde
          doc.setDrawColor(200, 200, 200)
          doc.setLineWidth(0.5)
          doc.rect(x, yPos, boxWidth - 2, boxHeight)

          // HEX en negrita
          doc.setFont("helvetica", "bold")
          doc.setFontSize(9)
          doc.setTextColor(0, 0, 0)
          doc.text(color.hex.toUpperCase(), x + (boxWidth - 2) / 2, yPos + boxHeight + 6, { align: "center" })

          // ✅ CAMBIO CRÍTICO: Porcentaje - usar percentage primero
          const freq = color.percentage || color.frequency || (color as any).appearances || 0
          doc.setFont("helvetica", "normal")
          doc.setFontSize(8)
          doc.setTextColor(117, 117, 117)
          doc.text(`${freq.toFixed(1)}%`, x + (boxWidth - 2) / 2, yPos + boxHeight + 11, { align: "center" })
        })

        yPos += boxHeight + 20
      } else {
        console.warn("⚠️ Todos los colores fueron rechazados por validación:", colorsPalette)
        doc.setFontSize(10)
        doc.setTextColor(...colors.mediumGray)
        doc.text("Datos de paleta incompletos", 15, yPos)
        yPos += 10
      }
    } else {
      console.warn("⚠️ No se encontró global_palette en color_analysis_summary")
      doc.setFontSize(10)
      doc.setTextColor(...colors.mediumGray)
      doc.text("No hay datos de paleta de colores", 15, yPos)
      yPos += 10
    }

    addFooter(pageNumber + 1, totalPages)

    // ==================== PÁGINA 5: COLOR SCHEME Y TEMPERATURA ====================
    console.log("📄 Generando página 5: Análisis Cromático Avanzado...")
    addPage()
    addHeader()

    addSectionTitle("ANÁLISIS CROMÁTICO AVANZADO")

    // Color Scheme Analysis
    if (report.color_analysis_summary?.most_common_scheme) {
      const schemeChart = await generateColorSchemeChart(
          report.color_analysis_summary.most_common_scheme,
          report.color_analysis_summary.avg_hue_difference || 45,
          report.color_analysis_summary.global_palette || []
      )
      if (schemeChart) {
        doc.addImage(schemeChart, "PNG", 15, yPos, pageWidth - 30, 60, undefined, "FAST")
        yPos += 70
      }
    } else {
      doc.setFontSize(10)
      doc.setTextColor(...colors.mediumGray)
      doc.text("No hay datos de esquema cromático", 15, yPos)
      yPos += 10
    }

    // Color Temperature Gauge
    if (report.color_analysis_summary?.most_common_temperature) {
      const tempValue = report.color_analysis_summary.most_common_temperature === "Cálido" ? 0.5 :
          report.color_analysis_summary.most_common_temperature === "Frío" ? -0.5 : 0

      const tempChart = await generateColorTemperatureGauge({
        label: report.color_analysis_summary.most_common_temperature,
        value: tempValue
      })
      if (tempChart) {
        doc.addImage(tempChart, "PNG", 15, yPos, pageWidth - 30, 60, undefined, "FAST")
      }
    } else {
      doc.setFontSize(10)
      doc.setTextColor(...colors.mediumGray)
      doc.text("No hay datos de temperatura de color", 15, yPos)
    }

    addFooter(pageNumber + 1, totalPages)

    // ==================== PÁGINA 6: COMPOSICIÓN ====================
    console.log("📄 Generando página 6: Composición Visual...")
    addPage()
    addHeader()

    addSectionTitle("COMPOSICIÓN VISUAL")

    if (report.composition_summary) {
      const compositionData = {
        rule_of_thirds: (report.composition_summary.avg_rule_of_thirds || 0) / 100,
        symmetry: (report.composition_summary.avg_symmetry || 0) / 100,
        balance: (report.composition_summary.avg_balance || 0) / 100,
        depth_cues: 0.5
      }

      const radarChart = await generateCompositionRadarChart(compositionData)
      if (radarChart) {
        const chartSize = 80
        doc.addImage(radarChart, "PNG", (pageWidth - chartSize) / 2, yPos, chartSize, chartSize, undefined, "FAST")
      }
    } else {
      doc.setFontSize(10)
      doc.setTextColor(...colors.mediumGray)
      doc.text("No hay datos de composición en este análisis", 15, yPos)
    }

    addFooter(pageNumber + 1, totalPages)

    // ==================== PÁGINA 7: ILUMINACIÓN ====================
    console.log("📄 Generando página 7: Análisis de Iluminación...")
    addPage()
    addHeader()

    addSectionTitle("ANÁLISIS DE ILUMINACIÓN")

    // 1. Zonas de luz (heatmap)
    if (report.lighting_summary?.exposure) {
      const zonesChart = await generateLightingZonesChart(report.lighting_summary.exposure.zones)
      if (zonesChart) {
        doc.addImage(zonesChart, "PNG", 15, yPos, pageWidth - 30, 52, undefined, "FAST")
        yPos += 58
      }
    } else if (report.lighting_summary) {
      const defaultZones = { shadows: 0.33, midtones: 0.34, highlights: 0.33 }
      const zonesChart = await generateLightingZonesChart(defaultZones)
      if (zonesChart) {
        doc.addImage(zonesChart, "PNG", 15, yPos, pageWidth - 30, 52, undefined, "FAST")
        yPos += 58
      }
    }

    // 2. Tipos de iluminación
    if (report.lighting_summary?.distribution) {
      const typesChart = await generateLightingTypesChart(report.lighting_summary.distribution)
      if (typesChart) {
        doc.addImage(typesChart, "PNG", 15, yPos, pageWidth - 30, 52, undefined, "FAST")
        yPos += 58
      }
    }

    // 3. Gauge de exposición
    if (report.lighting_summary?.exposure) {
      const exposureChart = await generateExposureGauge(
          report.lighting_summary.exposure.overexposed_pixels,
          report.lighting_summary.exposure.underexposed_pixels
      )
      if (exposureChart) {
        doc.addImage(exposureChart, "PNG", 15, yPos, pageWidth - 30, 52, undefined, "FAST")
      }
    } else if (report.lighting_summary) {
      const exposureChart = await generateExposureGauge(0.01, 0.01)
      if (exposureChart) {
        doc.addImage(exposureChart, "PNG", 15, yPos, pageWidth - 30, 52, undefined, "FAST")
      }
    }

    if (!report.lighting_summary) {
      doc.setFontSize(10)
      doc.setTextColor(...colors.mediumGray)
      doc.text("No hay datos de iluminación en este análisis", 15, yPos)
    }

    addFooter(pageNumber + 1, totalPages)

    // ==================== PÁGINA 8: MOVIMIENTOS CÁMARA ====================
    console.log("📄 Generando página 8: Movimientos de Cámara...")
    addPage()
    addHeader()

    addSectionTitle("MOVIMIENTOS DE CÁMARA")

    // ✅ PARCHEADO: Usar movement_counts en lugar de distribution
    const cameraDistribution = (report.camera_summary as any)?.movement_counts || report.camera_summary?.distribution

    console.log("📹 DEBUG Camera Summary:", {
      exists: !!report.camera_summary,
      hasDistribution: !!report.camera_summary?.distribution,
      hasMovementCounts: !!(report.camera_summary as any)?.movement_counts,
      cameraDistribution: cameraDistribution,
      distributionKeys: cameraDistribution ? Object.keys(cameraDistribution) : [],
      hasTimeline: !!report.camera_timeline,
      timelineLength: report.camera_timeline?.length
    })

    if (cameraDistribution && Object.keys(cameraDistribution).length > 0) {
      console.log("✅ Generando gráficos de cámara con distribution:", cameraDistribution)

      // Convertir counts a porcentajes si es necesario
      const total = Object.values(cameraDistribution).reduce((sum: number, val) => sum + (val as number), 0)
      const distributionPercent: Record<string, number> = {}

      for (const [key, value] of Object.entries(cameraDistribution)) {
        distributionPercent[key] = ((value as number) / total) * 100
      }

      console.log("📊 Distribución en porcentajes:", distributionPercent)

      // DONUT (arriba)
      const cameraDonut = await generateCameraMovementDonutChart(distributionPercent)
      if (cameraDonut) {
        doc.addImage(cameraDonut, "PNG", (pageWidth - 85) / 2, yPos, 85, 85, undefined, "FAST")
        yPos += 95
      } else {
        console.warn("⚠️ No se pudo generar donut de cámara")
      }

      // TIMELINE (abajo con margen)
      if (report.camera_timeline && Array.isArray(report.camera_timeline) && report.camera_timeline.length > 0) {
        console.log(`✅ Timeline tiene ${report.camera_timeline.length} puntos`)
        const timeline = await generateCameraTimelineChart(report.camera_timeline)
        if (timeline) {
          doc.addImage(timeline, "PNG", (pageWidth - 85) / 2, yPos, 85, 52, undefined, "FAST")
        } else {
          console.warn("⚠️ No se pudo generar timeline de cámara")
        }
      } else {
        console.warn("⚠️ Timeline vacío o inválido:", report.camera_timeline?.length || 0)
      }
    } else {
      console.error("❌ Camera summary sin distribución válida:", report.camera_summary)
      doc.setFontSize(10)
      doc.setTextColor(...colors.mediumGray)
      doc.text("No hay datos de movimientos de cámara en este análisis", 15, yPos)
    }

    addFooter(pageNumber + 1, totalPages)

    // Guardar
    const filename = `CVFlix - ${report.title}.pdf`
    doc.save(filename)
    console.log(`✅ PDF generado exitosamente: ${filename}`)

  } catch (error) {
    console.error('❌ Error generando PDF:', error)
    throw error
  }
}