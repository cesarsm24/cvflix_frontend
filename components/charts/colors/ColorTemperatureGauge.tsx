import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Thermometer } from "lucide-react"

interface ColorTemperatureGaugeProps {
    temperature: {
        label: string  // "Muy Cálido", "Cálido", "Neutral", "Frío", "Muy Frío"
        value: number  // -1 a 1
    }
}

export function ColorTemperatureGauge({ temperature }: ColorTemperatureGaugeProps) {
    // Convertir de -1/+1 a 0-100%
    const percentage = ((temperature.value + 1) / 2) * 100

    // Kelvin aproximado (2000K = frío, 10000K = cálido)
    const kelvinApprox = 2000 + (temperature.value + 1) * 4000

    return (
        <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
                <CardTitle className="text-black text-xl font-semibold flex items-center gap-2">
                    <Thermometer size={24} />
                    Temperatura de Color
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Barra de temperatura con gradiente */}
                <div className="relative">
                    <div
                        className="h-16 rounded-lg overflow-hidden shadow-inner"
                        style={{
                            background: 'linear-gradient(to right, #1E88E5 0%, #42A5F5 20%, #90CAF9 35%, #E0E0E0 50%, #FFB74D 65%, #FF9800 80%, #E64A19 100%)'
                        }}
                    >
                        {/* Indicador de posición */}
                        <div
                            className="absolute top-0 bottom-0 w-1 bg-black transition-all duration-500 shadow-lg"
                            style={{
                                left: `${percentage}%`,
                                transform: 'translateX(-50%)'
                            }}
                        >
                            {/* Flecha superior */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-transparent border-b-black" />
                            {/* Flecha inferior */}
                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-transparent border-t-black" />
                        </div>
                    </div>

                    {/* Etiquetas de temperatura */}
                    <div className="flex justify-between mt-3 text-xs font-medium text-gray-600">
                        <span>Frío (2000K)</span>
                        <span>Neutral (6000K)</span>
                        <span>Cálido (10000K)</span>
                    </div>
                </div>

                {/* Valor central */}
                <div className="text-center py-4 bg-gray-50 rounded-lg">
                    <div className="text-4xl font-bold text-black mb-2">
                        {temperature.label}
                    </div>
                    <div className="text-lg text-gray-600">
                        ~{Math.round(kelvinApprox)}K
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                        Valor: {temperature.value.toFixed(2)}
                    </div>
                </div>

                {/* Interpretación profesional */}
                <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 text-center">
                        {temperature.value > 0.2 && "Tonos cálidos predominantes (naranjas/rojos). Común en atardeceres, escenas íntimas o de acción."}
                        {temperature.value >= -0.1 && temperature.value <= 0.2 && "Temperatura equilibrada (luz de día). Balance neutral típico de exteriores diurnos."}
                        {temperature.value < -0.1 && "Tonos fríos predominantes (azules). Típico de escenas nocturnas, tecnológicas o de suspenso."}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}