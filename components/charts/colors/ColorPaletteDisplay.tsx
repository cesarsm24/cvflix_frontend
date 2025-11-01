import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Palette } from "lucide-react"

interface ColorPaletteDisplayProps {
    dominantColors: Array<{
        rgb: number[]      // [R, G, B]
        hex: string        // "#RRGGBB"
        percentage: number // 0-100
        name: string       // "Dark Gray", "Brown", etc.
    }>
}

export function ColorPaletteDisplay({ dominantColors }: ColorPaletteDisplayProps) {
    if (!dominantColors || dominantColors.length === 0) return null

    // Tomar los primeros 5 colores
    const colors = dominantColors.slice(0, 5)
    const mostDominant = colors[0]

    return (
        <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
                <CardTitle className="text-black text-xl font-semibold flex items-center gap-2">
                    <Palette size={24} />
                    Paleta de Colores Dominantes
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Barra de colores proporcional */}
                <div className="flex h-24 rounded-lg overflow-hidden shadow-md">
                    {colors.map((color, index) => (
                        <div
                            key={index}
                            className="relative transition-all duration-300 hover:scale-105 hover:z-10"
                            style={{
                                width: `${color.percentage}%`,
                                backgroundColor: color.hex
                            }}
                            title={`${color.name} - ${color.percentage.toFixed(1)}%`}
                        >
                            {/* Porcentaje dentro de la barra */}
                            {color.percentage > 10 && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-white font-bold text-lg drop-shadow-lg">
                                        {color.percentage.toFixed(1)}%
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Leyenda de colores */}
                <div className="grid grid-cols-5 gap-3">
                    {colors.map((color, index) => (
                        <div key={index} className="flex flex-col items-center gap-2">
                            {/* Muestra de color */}
                            <div
                                className="w-full h-12 rounded-md border-2 border-gray-200 shadow-sm"
                                style={{ backgroundColor: color.hex }}
                            />
                            {/* Nombre */}
                            <div className="text-center">
                                <div className="text-xs font-semibold text-black leading-tight">
                                    {color.name}
                                </div>
                                <div className="text-xs text-gray-500 font-mono mt-0.5">
                                    {color.hex.toUpperCase()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Resumen */}
                <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 text-center">
                        Color predominante: <span className="text-black font-semibold">{mostDominant.name}</span> con {mostDominant.percentage.toFixed(1)}%
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}