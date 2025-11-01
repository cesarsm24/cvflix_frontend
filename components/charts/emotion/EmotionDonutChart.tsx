import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface EmotionDistributionProps {
    data: {
        [key: string]: number // Porcentaje de cada emoción
    }
}

export function EmotionDistribution({ data }: EmotionDistributionProps) {
    if (!data || Object.keys(data).length === 0) return null

    // Paleta de colores Netflix (rojos, negros, grises, blancos)
    const EMOTION_COLORS: { [key: string]: string } = {
        "Feliz": "#B71C1C",        // Rojo Netflix oscuro
        "Triste": "#424242",       // Gris oscuro
        "Neutral": "#757575",      // Gris medio
        "Enfadado": "#D32F2F",     // Rojo más claro
        "Sorprendido": "#E57373",  // Rojo suave
        "Miedo": "#212121",        // Negro
        "Disgustado": "#9E9E9E"    // Gris claro
    }

    const chartData = Object.entries(data)
        .map(([emotion, percentage]) => ({
            name: emotion,
            value: percentage,
            color: EMOTION_COLORS[emotion] || "#757575"
        }))
        .sort((a, b) => b.value - a.value)

    const renderCustomLabel = (entry: any) => {
        const percent = entry.value.toFixed(1)
        return percent > 5 ? `${percent}%` : '' // Solo mostrar si > 5%
    }

    return (
        <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
                <CardTitle className="text-black text-xl font-semibold">
                    Distribución de Emociones
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomLabel}
                            outerRadius={120}
                            innerRadius={60}
                            dataKey="value"
                            paddingAngle={2}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                    stroke="#fff"
                                    strokeWidth={3}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                            formatter={(value: number) => `${value.toFixed(1)}%`}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            formatter={(value) => (
                                <span className="text-black text-sm font-medium">{value}</span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Emoción dominante */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                        Emoción dominante: <span className="text-black font-semibold">{chartData[0]?.name}</span> con {chartData[0]?.value.toFixed(1)}%
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}