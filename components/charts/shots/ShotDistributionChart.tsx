import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ShotDistributionProps {
    data: {
        [key: string]: number
    }
}

export function ShotDistributionChart({ data }: ShotDistributionProps) {
    if (!data || Object.keys(data).length === 0) return null

    const sortedData = Object.entries(data)
        .map(([shotType, percentage]) => ({
            name: shotType,
            value: percentage
        }))
        .sort((a, b) => b.value - a.value)

    const DARK_RED = "#B71C1C" // Rojo oscuro elegante
    const maxValue = Math.max(...sortedData.map(d => d.value))

    return (
        <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
                <CardTitle className="text-black text-xl font-semibold">
                    Distribución de Tipos de Plano
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {sortedData.map((item, index) => (
                    <div key={index} className="flex items-center gap-6">
                        {/* Nombre del plano */}
                        <div className="w-48 text-left">
                            <span className="text-black font-medium text-lg">
                                {item.name}
                            </span>
                        </div>

                        {/* Barra de progreso */}
                        <div className="flex-1 relative">
                            <div className="h-10 bg-gray-100 rounded-md overflow-hidden relative">
                                <div
                                    className="h-full rounded-md transition-all duration-500 ease-out flex items-center justify-end pr-4"
                                    style={{
                                        width: `${(item.value / maxValue) * 100}%`,
                                        backgroundColor: DARK_RED
                                    }}
                                >
                                    {/* Porcentaje dentro de la barra */}
                                    <span className="text-white font-bold text-lg">
                                        {item.value.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}