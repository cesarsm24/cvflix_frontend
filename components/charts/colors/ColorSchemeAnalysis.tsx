import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Palette } from "lucide-react"

interface ColorSchemeAnalysisProps {
    colorScheme: {
        scheme: string
        description: string
        max_hue_difference: number
    }
    dominantColors: Array<{
        rgb: number[]
        hex: string
        percentage: number
        name: string
    }>
}

export function ColorSchemeAnalysis({ colorScheme, dominantColors }: ColorSchemeAnalysisProps) {
    // Tomar los 3 colores más dominantes
    const primaryColors = dominantColors.slice(0, 3)

    // Definición profesional de esquemas cromáticos
    const schemeDefinitions: { [key: string]: {
            technical: string
            application: string
            examples: string
        }} = {
        "Monocromático": {
            technical: "Variaciones de saturación y luminosidad de un único matiz (Δ<15°)",
            application: "Genera cohesión visual y enfoque. Usado para crear atmósferas minimalistas.",
            examples: "Dramas psicológicos, thrillers, cine noir"
        },
        "Análogo": {
            technical: "Colores adyacentes en el círculo cromático (15°<Δ<30°)",
            application: "Armonía natural y transiciones suaves. Ideal para narrativas realistas.",
            examples: "Películas de época, dramas familiares, documentales"
        },
        "Complementario": {
            technical: "Colores opuestos en el círculo cromático (60°<Δ<120°)",
            application: "Máximo contraste visual. Genera tensión dramática y energía.",
            examples: "Blockbusters, ciencia ficción, películas de acción"
        },
        "Triádico": {
            technical: "Tres colores equidistantes 120° en el círculo cromático (40°<Δ<60°)",
            application: "Balance vibrante. Múltiples puntos de interés visual.",
            examples: "Animación, fantasía, aventuras"
        },
        "Policromático": {
            technical: "Múltiples matices sin patrón definido (Δ variable)",
            application: "Diversidad cromática máxima. Expresividad y dinamismo.",
            examples: "Musicales, películas experimentales, surrealismo"
        }
    }

    const definition = schemeDefinitions[colorScheme.scheme] || schemeDefinitions["Policromático"]

    // Calcular el nivel de contraste
    const getContrastLevel = (diff: number): { level: string; color: string } => {
        if (diff < 15) return { level: "Muy Bajo", color: "#9E9E9E" }
        if (diff < 30) return { level: "Bajo", color: "#757575" }
        if (diff < 60) return { level: "Moderado", color: "#D32F2F" }
        if (diff < 120) return { level: "Alto", color: "#B71C1C" }
        return { level: "Muy Alto", color: "#8B0000" }
    }

    const contrast = getContrastLevel(colorScheme.max_hue_difference)

    return (
        <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
                <CardTitle className="text-black text-xl font-semibold flex items-center gap-2">
                    <Palette size={24} />
                    Análisis de Esquema Cromático
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Esquema identificado */}
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                    <div className="text-center mb-4">
                        <div className="inline-block px-4 py-2 bg-black text-white rounded-md text-sm font-bold uppercase tracking-wider mb-2">
                            {colorScheme.scheme}
                        </div>
                        <p className="text-sm text-gray-600 italic">
                            {colorScheme.description}
                        </p>
                    </div>

                    {/* Visualización de colores del esquema */}
                    <div className="flex gap-3 justify-center">
                        {primaryColors.map((color, index) => (
                            <div key={index} className="flex flex-col items-center">
                                <div
                                    className="w-20 h-20 rounded-lg border-2 border-gray-300 shadow-md mb-2"
                                    style={{ backgroundColor: color.hex }}
                                />
                                <div className="text-xs font-mono text-gray-700">
                                    {color.hex.toUpperCase()}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                    {color.percentage.toFixed(1)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Métricas técnicas */}
                <div className="space-y-4">
                    {/* Diferencia de matiz */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-black">
                                Diferencia Angular de Matiz (Hue)
                            </span>
                            <span className="text-sm font-bold text-black">
                                {colorScheme.max_hue_difference.toFixed(1)}°
                            </span>
                        </div>
                        <div className="h-8 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                            <div
                                className="h-full transition-all duration-500 ease-out flex items-center justify-end pr-3"
                                style={{
                                    width: `${(colorScheme.max_hue_difference / 180) * 100}%`,
                                    backgroundColor: contrast.color
                                }}
                            >
                                {colorScheme.max_hue_difference > 20 && (
                                    <span className="text-white text-xs font-bold">
                                        {colorScheme.max_hue_difference.toFixed(1)}°
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-gray-500">
                            <span>0° (Monocromático)</span>
                            <span>180° (Complementario)</span>
                        </div>
                    </div>

                    {/* Nivel de contraste */}
                    <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                        <span className="text-sm font-semibold text-black">
                            Nivel de Contraste Cromático
                        </span>
                        <span
                            className="text-sm font-bold px-3 py-1 rounded-md text-white"
                            style={{ backgroundColor: contrast.color }}
                        >
                            {contrast.level}
                        </span>
                    </div>
                </div>

                {/* Análisis profesional */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Definición Técnica
                        </h4>
                        <p className="text-sm text-gray-700">
                            {definition.technical}
                        </p>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Aplicación Cinematográfica
                        </h4>
                        <p className="text-sm text-gray-700">
                            {definition.application}
                        </p>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Géneros Asociados
                        </h4>
                        <p className="text-sm text-gray-700">
                            {definition.examples}
                        </p>
                    </div>
                </div>

            </CardContent>
        </Card>
    )
}