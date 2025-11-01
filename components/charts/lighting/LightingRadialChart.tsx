import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface LightingRadialChartProps {
    data: {
        [key: string]: number // Porcentaje de cada tipo de iluminación
    }
}

export function LightingRadialChart({ data }: LightingRadialChartProps) {
    if (!data || Object.keys(data).length === 0) return null

    // Transformar datos para el gráfico radar
    const chartData = Object.entries(data).map(([type, percentage]) => ({
        type: type
            .replace(" (Luz Alta)", "")
            .replace(" (Luz Baja)", "")
            .replace("Iluminación ", ""),
        value: percentage,
        fullMark: 100
    }))

    const DARK_RED = "#B71C1C" // Rojo Netflix oscuro

    // Encontrar el tipo dominante
    const dominantType = Object.entries(data).sort((a, b) => b[1] - a[1])[0]

    return (
        <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
                <CardTitle className="text-black text-xl font-semibold">
                    Distribución de Iluminación
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                    <RadarChart data={chartData}>
                        <PolarGrid
                            stroke="#e5e7eb"
                            strokeWidth={1}
                        />
                        <PolarAngleAxis
                            dataKey="type"
                            tick={{
                                fill: '#000',
                                fontSize: 14,
                                fontWeight: 500
                            }}
                        />
                        <PolarRadiusAxis
                            angle={90}
                            domain={[0, 100]}
                            tick={{
                                fill: '#666',
                                fontSize: 12
                            }}
                            tickFormatter={(value) => `${value}%`}
                        />
                        <Radar
                            name="Porcentaje"
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
                            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Porcentaje']}
                            cursor={{ stroke: DARK_RED, strokeWidth: 1 }}
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

                {/* Tipo dominante */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                        Tipo de iluminación predominante: <span className="text-black font-semibold">
                            {dominantType?.[0]}
                        </span> con {dominantType?.[1].toFixed(1)}%
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}