import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Activity } from "lucide-react"

interface BrightnessDistributionChartProps {
    zones: {
        shadows: number
        midtones: number
        highlights: number
    }
}

export function BrightnessDistributionChart({ zones }: BrightnessDistributionChartProps) {
    // Crear datos simulados de distribución
    const data = [
        { range: "0-42", value: zones.shadows * 50, zone: "Sombras" },
        { range: "43-85", value: zones.shadows * 50, zone: "Sombras" },
        { range: "86-128", value: zones.midtones * 100, zone: "Medios" },
        { range: "129-170", value: zones.midtones * 100, zone: "Medios" },
        { range: "171-213", value: zones.highlights * 50, zone: "Luces" },
        { range: "214-255", value: zones.highlights * 50, zone: "Luces" }
    ]

    return (
        <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
                <CardTitle className="text-black text-xl font-semibold flex items-center gap-2">
                    <Activity size={24} />
                    Distribución de Brillo
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorBrightness" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#B71C1C" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#B71C1C" stopOpacity={0.1}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis
                            dataKey="range"
                            stroke="#666"
                            tick={{ fill: '#666', fontSize: 11 }}
                            label={{
                                value: 'Rango de Brillo (0-255)',
                                position: 'insideBottom',
                                offset: -5,
                                style: { fill: '#666', fontWeight: 500, fontSize: 12 }
                            }}
                        />
                        <YAxis
                            stroke="#666"
                            tick={{ fill: '#666', fontSize: 11 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}
                            labelStyle={{ color: '#000', fontWeight: 'bold' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#B71C1C"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorBrightness)"
                        />
                    </AreaChart>
                </ResponsiveContainer>

                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-gray-800">
                                {(zones.shadows * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-gray-600">Sombras</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-600">
                                {(zones.midtones * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-gray-600">Medios</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-400">
                                {(zones.highlights * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-gray-600">Luces</div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}