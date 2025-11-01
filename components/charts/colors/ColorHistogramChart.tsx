import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { BarChart3 } from "lucide-react"

interface ColorHistogramChartProps {
    histogram: {
        red: number[]    // Array de 256 valores
        green: number[]  // Array de 256 valores
        blue: number[]   // Array de 256 valores
    }
}

// Tipo para cada punto del gráfico
interface HistogramDataPoint {
    range: number
    binLabel: string
    red: number
    green: number
    blue: number
}

export function ColorHistogramChart({ histogram }: ColorHistogramChartProps) {
    if (!histogram || !histogram.red || !histogram.green || !histogram.blue) return null

    // Transformar los datos para Recharts
    // Agrupar cada 8 bins para reducir puntos (256 -> 32 puntos)
    const groupSize = 8
    const chartData: HistogramDataPoint[] = []

    for (let i = 0; i < 256; i += groupSize) {
        const binLabel = `${i}-${i + groupSize - 1}`

        // Sumar los valores del grupo
        const redSum = histogram.red.slice(i, i + groupSize).reduce((a, b) => a + b, 0)
        const greenSum = histogram.green.slice(i, i + groupSize).reduce((a, b) => a + b, 0)
        const blueSum = histogram.blue.slice(i, i + groupSize).reduce((a, b) => a + b, 0)

        chartData.push({
            range: i,
            binLabel: binLabel,
            red: redSum,
            green: greenSum,
            blue: blueSum
        })
    }

    // Encontrar el valor máximo para normalizar
    const maxValue = Math.max(
        ...chartData.map(d => Math.max(d.red, d.green, d.blue))
    )

    return (
        <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
                <CardTitle className="text-black text-xl font-semibold flex items-center gap-2">
                    <BarChart3 size={24} />
                    Histograma RGB
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={chartData}>
                        <defs>
                            {/* Gradientes para cada canal */}
                            <linearGradient id="colorRed" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#EF5350" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#EF5350" stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#66BB6A" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#66BB6A" stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#42A5F5" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#42A5F5" stopOpacity={0.1}/>
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                            vertical={false}
                        />

                        <XAxis
                            dataKey="range"
                            stroke="#666"
                            tick={{ fill: '#666', fontSize: 11 }}
                            label={{
                                value: 'Intensidad (0-255)',
                                position: 'insideBottom',
                                offset: -5,
                                style: { fill: '#666', fontWeight: 500, fontSize: 12 }
                            }}
                            tickFormatter={(value: number) => value.toString()}
                        />

                        <YAxis
                            stroke="#666"
                            tick={{ fill: '#666', fontSize: 11 }}
                            label={{
                                value: 'Frecuencia',
                                angle: -90,
                                position: 'insideLeft',
                                style: { fill: '#666', fontWeight: 500, fontSize: 12 }
                            }}
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
                            labelFormatter={(value: number) => {
                                const data = chartData.find(d => d.range === value)
                                return `Rango: ${data?.binLabel || value}`
                            }}
                            formatter={(value: number, name: string) => [
                                Math.round(value).toLocaleString(),
                                name === 'red' ? 'Rojo' : name === 'green' ? 'Verde' : 'Azul'
                            ]}
                        />

                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="line"
                            formatter={(value: string) => {
                                const names: { [key: string]: string } = {
                                    red: 'Canal Rojo',
                                    green: 'Canal Verde',
                                    blue: 'Canal Azul'
                                }
                                return <span className="text-black text-sm font-medium">{names[value]}</span>
                            }}
                        />

                        {/* Áreas de cada canal */}
                        <Area
                            type="monotone"
                            dataKey="red"
                            stroke="#EF5350"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorRed)"
                        />
                        <Area
                            type="monotone"
                            dataKey="green"
                            stroke="#66BB6A"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorGreen)"
                        />
                        <Area
                            type="monotone"
                            dataKey="blue"
                            stroke="#42A5F5"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorBlue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>

                {/* Interpretación profesional */}
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Interpretación del Histograma
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span className="font-semibold text-black">Canal Rojo</span>
                            </div>
                            <p className="text-xs text-gray-600">
                                Tonos cálidos y piel
                            </p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="font-semibold text-black">Canal Verde</span>
                            </div>
                            <p className="text-xs text-gray-600">
                                Vegetación y naturales
                            </p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                <span className="font-semibold text-black">Canal Azul</span>
                            </div>
                            <p className="text-xs text-gray-600">
                                Cielos y tonos fríos
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-600 pt-2">
                        <span className="font-semibold">Zonas 0-85:</span> Sombras y negros •
                        <span className="font-semibold"> 86-170:</span> Medios tonos •
                        <span className="font-semibold"> 171-255:</span> Altas luces y blancos
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}