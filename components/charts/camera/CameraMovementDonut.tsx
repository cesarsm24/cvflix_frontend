import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Video } from "lucide-react"

interface CameraMovementDonutProps {
    data: {
        [key: string]: number // Porcentaje de cada tipo de movimiento
    }
}

export function CameraMovementDonut({ data }: CameraMovementDonutProps) {
    if (!data || Object.keys(data).length === 0) return null

    // Paleta de colores Netflix (grises y rojos)
    const COLORS = {
        "Estático": "#E5E5E5",
        "Pan": "#BDBDBD",
        "Tilt": "#757575",
        "Zoom": "#D32F2F",
        "Dolly": "#B71C1C",
        "Tracking": "#9E9E9E"
    }

    // Transformar datos para el gráfico
    const chartData = Object.entries(data).map(([name, value]) => ({
        name,
        value,
        percentage: value
    }))

    // Encontrar el movimiento dominante
    const dominantMovement = chartData.reduce((max, item) =>
        item.value > max.value ? item : max
    )

    // Custom label para mostrar porcentajes
    const renderCustomLabel = (entry: any) => {
        return entry.percentage > 5 ? `${entry.percentage.toFixed(1)}%` : ''
    }

    return (
        <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
                <CardTitle className="text-black text-xl font-semibold flex items-center gap-2">
                    <Video size={24} />
                    Distribución de Movimientos de Cámara
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={130}
                            paddingAngle={2}
                            dataKey="value"
                            label={renderCustomLabel}
                            labelLine={false}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[entry.name as keyof typeof COLORS] || "#757575"}
                                    stroke="white"
                                    strokeWidth={2}
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

                {/* Movimiento dominante */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 text-center">
                        Movimiento predominante: <span className="text-black font-semibold">
                            {dominantMovement.name}
                        </span> con {dominantMovement.percentage.toFixed(1)}% del video
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}