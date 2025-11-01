import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Smile,          // Feliz
    Zap,            // Sorprendido
    Minus,          // Neutral
    Frown,          // Disgustado
    Skull,          // Miedo
    CloudRain,      // Triste
    Flame           // Enfadado
} from "lucide-react"

interface EmotionMoodGaugeProps {
    emotionDistribution: {
        [key: string]: number
    }
    dominantEmotion: string
}

export function EmotionMoodGauge({
                                     emotionDistribution,
                                     dominantEmotion
                                 }: EmotionMoodGaugeProps) {

    // Paleta Netflix: de gris claro (positivo) a rojo oscuro (negativo)
    const emotions = [
        {
            name: "Feliz",
            icon: Smile,
            color: "#E5E5E5",
            range: [0, 25.7]
        },
        {
            name: "Sorprendido",
            icon: Zap,           // ⚡ para sorpresa
            color: "#BDBDBD",
            range: [25.7, 51.4]
        },
        {
            name: "Neutral",
            icon: Minus,         // ➖ para neutral
            color: "#757575",
            range: [51.4, 77.1]
        },
        {
            name: "Disgustado",
            icon: Frown,
            color: "#424242",
            range: [77.1, 102.8]
        },
        {
            name: "Miedo",
            icon: Skull,
            color: "#E57373",
            range: [102.8, 128.5]
        },
        {
            name: "Triste",
            icon: CloudRain,
            color: "#D32F2F",
            range: [128.5, 154.2]
        },
        {
            name: "Enfadado",
            icon: Flame,         // 🔥 para enfado
            color: "#B71C1C",
            range: [154.2, 180]
        }
    ]

    const getDominantEmotionAngle = () => {
        const emotion = emotions.find(e => e.name === dominantEmotion)
        if (!emotion) return 90

        const [start, end] = emotion.range
        return start + (end - start) / 2
    }

    const needleAngle = getDominantEmotionAngle()
    const dominantPercentage = emotionDistribution[dominantEmotion] || 0
    const DominantIcon = emotions.find(e => e.name === dominantEmotion)?.icon || Minus

    return (
        <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
                <CardTitle className="text-black text-xl font-semibold">
                    Medidor de Estado Emocional
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-4">
                {/* Gauge SVG */}
                <div className="relative w-full max-w-md h-64">
                    <svg viewBox="0 0 300 160" className="w-full h-full">
                        {/* Arcos de colores */}
                        {emotions.map((emotion, index) => {
                            const [startAngle, endAngle] = emotion.range
                            const startRad = (startAngle - 180) * Math.PI / 180
                            const endRad = (endAngle - 180) * Math.PI / 180

                            const radius = 100
                            const centerX = 150
                            const centerY = 130

                            const startX = centerX + radius * Math.cos(startRad)
                            const startY = centerY + radius * Math.sin(startRad)
                            const endX = centerX + radius * Math.cos(endRad)
                            const endY = centerY + radius * Math.sin(endRad)

                            const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0

                            return (
                                <path
                                    key={index}
                                    d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`}
                                    fill="none"
                                    stroke={emotion.color}
                                    strokeWidth="24"
                                    strokeLinecap="round"
                                />
                            )
                        })}

                        {/* Líneas divisorias */}
                        {emotions.slice(0, -1).map((emotion, index) => {
                            const angle = emotion.range[1]
                            const angleRad = (angle - 180) * Math.PI / 180
                            const innerRadius = 76
                            const outerRadius = 124

                            return (
                                <line
                                    key={`divider-${index}`}
                                    x1={150 + innerRadius * Math.cos(angleRad)}
                                    y1={130 + innerRadius * Math.sin(angleRad)}
                                    x2={150 + outerRadius * Math.cos(angleRad)}
                                    y2={130 + outerRadius * Math.sin(angleRad)}
                                    stroke="white"
                                    strokeWidth="2"
                                />
                            )
                        })}

                        {/* Aguja */}
                        <g className="transition-all duration-700 ease-out">
                            <line
                                x1="150"
                                y1="130"
                                x2={150 + 85 * Math.cos((needleAngle - 180) * Math.PI / 180)}
                                y2={130 + 85 * Math.sin((needleAngle - 180) * Math.PI / 180)}
                                stroke="#000000"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                            <circle cx="150" cy="130" r="8" fill="#000000" />
                            <circle cx="150" cy="130" r="5" fill="white" />
                        </g>
                    </svg>

                    {/* Iconos posicionados alrededor del gauge */}
                    {emotions.map((emotion, index) => {
                        const angle = emotion.range[0] + (emotion.range[1] - emotion.range[0]) / 2
                        const angleRad = (angle - 180) * Math.PI / 180
                        const iconRadius = 140

                        const x = 150 + iconRadius * Math.cos(angleRad)
                        const y = 130 + iconRadius * Math.sin(angleRad)

                        const IconComponent = emotion.icon

                        return (
                            <div
                                key={`icon-${index}`}
                                className="absolute"
                                style={{
                                    left: `${(x / 300) * 100}%`,
                                    top: `${(y / 160) * 100}%`,
                                    transform: 'translate(-50%, -50%)'
                                }}
                            >
                                <IconComponent
                                    size={24}
                                    color={emotion.color}
                                    strokeWidth={2.5}
                                />
                            </div>
                        )
                    })}
                </div>

                {/* Información central */}
                <div className="text-center mt-4">
                    <div className="mb-2 flex justify-center">
                        <DominantIcon
                            size={56}
                            color={emotions.find(e => e.name === dominantEmotion)?.color || "#757575"}
                            strokeWidth={2}
                        />
                    </div>
                    <div className="text-2xl font-bold text-black">
                        {dominantEmotion}
                    </div>
                    <div className="text-lg text-gray-600 mt-1">
                        {dominantPercentage.toFixed(1)}% del contenido
                    </div>
                </div>

                {/* Leyenda de emociones */}
                <div className="grid grid-cols-7 gap-2 mt-6 w-full">
                    {emotions.map((emotion, index) => {
                        const IconComponent = emotion.icon
                        return (
                            <div
                                key={index}
                                className="flex flex-col items-center gap-1"
                            >
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-300"
                                    style={{ backgroundColor: emotion.color }}
                                >
                                    <IconComponent
                                        size={16}
                                        color={
                                            // Texto oscuro para fondos claros, claro para oscuros
                                            index < 3 ? "#424242" : "#FFFFFF"
                                        }
                                        strokeWidth={2.5}
                                    />
                                </div>
                                <span className="text-xs text-gray-600 text-center leading-tight">
                                    {emotion.name}
                                </span>
                            </div>
                        )
                    })}
                </div>

                {/* Descripción */}
                <div className="mt-6 pt-4 border-t border-gray-200 w-full">
                    <p className="text-sm text-gray-600 text-center">
                        La aguja indica la emoción predominante detectada en el análisis del video.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}