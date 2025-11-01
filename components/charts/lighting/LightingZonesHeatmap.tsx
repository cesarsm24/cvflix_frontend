import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera } from "lucide-react"

interface LightingZonesHeatmapProps {
    exposure: {
        zones: {
            shadows: number      // 0-1 (porcentaje de sombras)
            midtones: number     // 0-1 (porcentaje de medios tonos)
            highlights: number   // 0-1 (porcentaje de altas luces)
        }
        overexposed_pixels: number  // 0-1
        underexposed_pixels: number // 0-1
    }
}

export function LightingZonesHeatmap({ exposure }: LightingZonesHeatmapProps) {
    const { zones, overexposed_pixels, underexposed_pixels } = exposure

    // Convertir a porcentajes
    const shadowsPercent = zones.shadows * 100
    const midtonesPercent = zones.midtones * 100
    const highlightsPercent = zones.highlights * 100

    // Determinar tipo de iluminación predominante
    const getLightingType = () => {
        if (shadowsPercent > 50) return "Low Key"
        if (highlightsPercent > 50) return "High Key"
        return "Equilibrada"
    }

    return (
        <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
                <CardTitle className="text-black text-xl font-semibold flex items-center gap-2">
                    <Camera size={24} />
                    Distribución de Zonas de Luz
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Visualización de zonas */}
                <div className="space-y-4">
                    {/* Sombras (0-85) */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-black">
                                Sombras (0-85)
                            </span>
                            <span className="text-sm font-bold text-black">
                                {shadowsPercent.toFixed(1)}%
                            </span>
                        </div>
                        <div className="h-10 bg-gray-100 rounded-md overflow-hidden">
                            <div
                                className="h-full transition-all duration-500 ease-out flex items-center justify-end pr-3"
                                style={{
                                    width: `${shadowsPercent}%`,
                                    backgroundColor: '#212121' // Negro/gris muy oscuro
                                }}
                            >
                                {shadowsPercent > 15 && (
                                    <span className="text-white text-sm font-bold">
                                        {shadowsPercent.toFixed(1)}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Medios Tonos (85-170) */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-black">
                                Medios Tonos (85-170)
                            </span>
                            <span className="text-sm font-bold text-black">
                                {midtonesPercent.toFixed(1)}%
                            </span>
                        </div>
                        <div className="h-10 bg-gray-100 rounded-md overflow-hidden">
                            <div
                                className="h-full transition-all duration-500 ease-out flex items-center justify-end pr-3"
                                style={{
                                    width: `${midtonesPercent}%`,
                                    backgroundColor: '#757575' // Gris medio
                                }}
                            >
                                {midtonesPercent > 15 && (
                                    <span className="text-white text-sm font-bold">
                                        {midtonesPercent.toFixed(1)}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Altas Luces (170-255) */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-black">
                                Altas Luces (170-255)
                            </span>
                            <span className="text-sm font-bold text-black">
                                {highlightsPercent.toFixed(1)}%
                            </span>
                        </div>
                        <div className="h-10 bg-gray-100 rounded-md overflow-hidden">
                            <div
                                className="h-full transition-all duration-500 ease-out flex items-center justify-end pr-3"
                                style={{
                                    width: `${highlightsPercent}%`,
                                    backgroundColor: '#BDBDBD' // Gris claro
                                }}
                            >
                                {highlightsPercent > 15 && (
                                    <span className="text-black text-sm font-bold">
                                        {highlightsPercent.toFixed(1)}%
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Advertencias de sobre/subexposición */}
                {(overexposed_pixels > 0.01 || underexposed_pixels > 0.01) && (
                    <div className="pt-4 border-t border-gray-200 space-y-2">
                        {overexposed_pixels > 0.01 && (
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 bg-red-600 rounded-full" />
                                <span className="text-gray-600">
                                    Sobreexposición: <span className="text-black font-semibold">
                                        {(overexposed_pixels * 100).toFixed(2)}%
                                    </span> de píxeles quemados
                                </span>
                            </div>
                        )}
                        {underexposed_pixels > 0.01 && (
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-3 h-3 bg-gray-900 rounded-full" />
                                <span className="text-gray-600">
                                    Subexposición: <span className="text-black font-semibold">
                                        {(underexposed_pixels * 100).toFixed(2)}%
                                    </span> de píxeles perdidos
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Interpretación profesional */}
                <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                        Tipo de iluminación: <span className="text-black font-semibold">
                            {getLightingType()}
                        </span>
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                        {shadowsPercent > 50
                            ? "Predominan las sombras - Estilo cinematográfico Low Key, típico de escenas dramáticas o de suspenso."
                            : highlightsPercent > 50
                                ? "Predominan las altas luces - Estilo High Key, asociado a comedias o escenas optimistas."
                                : midtonesPercent > 50
                                    ? "Predominan los medios tonos - Iluminación natural y equilibrada, común en documentales o drama realista."
                                    : "Distribución equilibrada de todas las zonas de luz."}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}