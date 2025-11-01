import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Layout } from "lucide-react"

interface CompositionRadarChartProps {
    composition: {
        rule_of_thirds: number    // 0-1
        symmetry: number           // 0-1
        balance: number            // 0-1
        depth_cues: number         // 0-1
    }
}

export function CompositionRadarChart({ composition }: CompositionRadarChartProps) {

    // Convertir valores de 0-1 a 0-100 para mejor visualización
    const chartData = [
        {
            metric: "Regla de Tercios",
            value: composition.rule_of_thirds * 100,
            fullMark: 100
        },
        {
            metric: "Simetría",
            value: composition.symmetry * 100,
            fullMark: 100
        },
        {
            metric: "Balance Visual",
            value: composition.balance * 100,
            fullMark: 100
        },
        {
            metric: "Profundidad",
            value: composition.depth_cues * 100,
            fullMark: 100
        }
    ]

    // Calcular puntuación global
    const globalScore = (
        composition.rule_of_thirds +
        composition.symmetry +
        composition.balance +
        composition.depth_cues
    ) / 4 * 100

    // Determinar calidad de composición
    const getCompositionQuality = (score: number): { level: string; color: string; description: string } => {
        if (score >= 75) return {
            level: "Excelente",
            color: "#2E7D32",
            description: "Composición profesional con equilibrio visual óptimo"
        }
        if (score >= 60) return {
            level: "Buena",
            color: "#388E3C",
            description: "Composición sólida con elementos bien distribuidos"
        }
        if (score >= 45) return {
            level: "Aceptable",
            color: "#757575",
            description: "Composición funcional con margen de mejora"
        }
        if (score >= 30) return {
            level: "Mejorable",
            color: "#D32F2F",
            description: "Composición básica que requiere atención"
        }
        return {
            level: "Deficiente",
            color: "#B71C1C",
            description: "Composición desequilibrada que necesita revisión"
        }
    }

    const quality = getCompositionQuality(globalScore)

    // Definiciones profesionales
    const metricDefinitions: { [key: string]: string } = {
        "Regla de Tercios": "Posicionamiento de elementos en puntos de intersección de líneas que dividen el encuadre en tercios horizontal y verticalmente. Fundamental en fotografía y cine.",
        "Simetría": "Distribución equilibrada de elementos visuales respecto a un eje central. Crea orden y estabilidad formal.",
        "Balance Visual": "Distribución del peso visual entre áreas del encuadre. Evita sobrecarga en una zona y mantiene armonía compositiva.",
        "Profundidad": "Uso de capas, perspectiva lineal y solapamiento para crear sensación tridimensional. Añade dimensión narrativa."
    }

    // Encontrar la métrica más fuerte y más débil
    const sortedMetrics = [...chartData].sort((a, b) => b.value - a.value)
    const strongest = sortedMetrics[0]
    const weakest = sortedMetrics[sortedMetrics.length - 1]

    const DARK_RED = "#B71C1C"

    return (
        <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
                <CardTitle className="text-black text-xl font-semibold flex items-center gap-2">
                    <Layout size={24} />
                    Análisis de Composición
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Puntuación global */}
                <div className="text-center bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        Puntuación de Composición
                    </div>
                    <div className="flex items-center justify-center gap-4">
                        <div className="text-5xl font-bold text-black">
                            {globalScore.toFixed(0)}
                        </div>
                        <div className="text-left">
                            <div
                                className="text-xl font-bold mb-1"
                                style={{ color: quality.color }}
                            >
                                {quality.level}
                            </div>
                            <div className="text-xs text-gray-600">
                                sobre 100
                            </div>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                        {quality.description}
                    </p>
                </div>

                {/* Gráfico radar */}
                <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={chartData}>
                        <PolarGrid
                            stroke="#e5e7eb"
                            strokeWidth={1}
                        />
                        <PolarAngleAxis
                            dataKey="metric"
                            tick={{
                                fill: '#000',
                                fontSize: 13,
                                fontWeight: 500
                            }}
                        />
                        <PolarRadiusAxis
                            angle={90}
                            domain={[0, 100]}
                            tick={{
                                fill: '#666',
                                fontSize: 11
                            }}
                            tickFormatter={(value) => `${value}%`}
                        />
                        <Radar
                            name="Valor"
                            dataKey="value"
                            stroke={DARK_RED}
                            fill={DARK_RED}
                            fillOpacity={0.25}
                            strokeWidth={2.5}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                            labelStyle={{
                                color: '#000',
                                fontWeight: 'bold',
                                marginBottom: '4px'
                            }}
                            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Puntuación']}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            formatter={(value) => (
                                <span className="text-black text-sm font-medium">{value}</span>
                            )}
                        />
                    </RadarChart>
                </ResponsiveContainer>

                {/* Análisis de fortalezas y debilidades */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">
                            Fortaleza Principal
                        </div>
                        <div className="text-lg font-bold text-green-900">
                            {strongest.metric}
                        </div>
                        <div className="text-sm text-green-700 mt-1">
                            {strongest.value.toFixed(1)}%
                        </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">
                            Área de Mejora
                        </div>
                        <div className="text-lg font-bold text-red-900">
                            {weakest.metric}
                        </div>
                        <div className="text-sm text-red-700 mt-1">
                            {weakest.value.toFixed(1)}%
                        </div>
                    </div>
                </div>

                {/* Definiciones técnicas */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Métricas de Composición
                    </h4>
                    {chartData.map((metric, index) => (
                        <div key={index} className="text-sm">
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-black">
                                    {metric.metric}
                                </span>
                                <span className="text-gray-600">
                                    {metric.value.toFixed(1)}%
                                </span>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                {metricDefinitions[metric.metric]}
                            </p>
                        </div>
                    ))}
                </div>

            </CardContent>
        </Card>
    )
}