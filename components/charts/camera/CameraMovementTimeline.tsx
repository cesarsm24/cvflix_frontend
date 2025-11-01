import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts"
import { Film } from "lucide-react"

interface CameraMovementTimelineProps {
    movementDistribution: {
        [key: string]: number
    }
    dominantMovement: string
}

export function CameraMovementTimeline({ movementDistribution, dominantMovement }: CameraMovementTimelineProps) {

    // Paleta de colores profesional
    const MOVEMENT_COLORS: { [key: string]: string } = {
        "Estático": "#E5E5E5",
        "Pan": "#BDBDBD",
        "Tilt": "#9E9E9E",
        "Zoom": "#D32F2F",
        "Dolly": "#B71C1C",
        "Tracking": "#757575"
    }

    // Definiciones profesionales de movimientos
    const movementDefinitions: { [key: string]: {
            technical: string
            usage: string
        }} = {
        "Estático": {
            technical: "Cámara fija en trípode o soporte estable",
            usage: "Diálogos, planos contemplativos, énfasis en actuaciones"
        },
        "Pan": {
            technical: "Rotación horizontal sobre eje vertical fijo (paneo)",
            usage: "Seguimiento lateral, revelación de espacio, conexión entre elementos"
        },
        "Tilt": {
            technical: "Rotación vertical sobre eje horizontal fijo (cabeceo)",
            usage: "Seguimiento vertical, revelación de altura, cambio de perspectiva"
        },
        "Zoom": {
            technical: "Cambio de distancia focal sin mover la cámara",
            usage: "Enfatizar detalles, crear tensión, transiciones dramáticas"
        },
        "Dolly": {
            technical: "Desplazamiento físico de la cámara (traveling)",
            usage: "Inmersión en escena, crear profundidad, seguir personajes"
        },
        "Tracking": {
            technical: "Seguimiento continuo del sujeto en movimiento",
            usage: "Mantener sujeto en cuadro, escenas de acción, persecuciones"
        }
    }

    // Preparar datos para el gráfico de barras horizontales
    const chartData = Object.entries(movementDistribution)
        .sort((a, b) => b[1] - a[1]) // Ordenar de mayor a menor
        .map(([name, value]) => ({
            name,
            value,
            percentage: value
        }))

    // Calcular métricas
    const totalStatic = movementDistribution["Estático"] || 0
    const totalDynamic = 100 - totalStatic
    const mostDynamicMovement = chartData.filter(m => m.name !== "Estático")[0]

    return (
        <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
                <CardTitle className="text-black text-xl font-semibold flex items-center gap-2">
                    <Film size={24} />
                    Análisis de Movimientos de Cámara
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Gráfico de barras horizontales */}
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                        data={chartData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                            horizontal={false}
                        />
                        <XAxis
                            type="number"
                            stroke="#666"
                            tick={{ fill: '#666', fontSize: 12 }}
                            domain={[0, 100]}
                            tickFormatter={(value) => `${value}%`}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            stroke="#666"
                            tick={{ fill: '#000', fontSize: 13, fontWeight: 500 }}
                            width={70}
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
                            formatter={(value: number) => [`${value.toFixed(1)}%`, 'Porcentaje del video']}
                        />
                        <Bar
                            dataKey="value"
                            radius={[0, 4, 4, 0]}
                            label={{
                                position: 'right',
                                formatter: (value: number) => `${value.toFixed(1)}%`,
                                fill: '#000',
                                fontSize: 12,
                                fontWeight: 'bold'
                            }}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={MOVEMENT_COLORS[entry.name] || "#757575"}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>

                {/* Métricas clave */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Cámara Estática
                        </div>
                        <div className="text-3xl font-bold text-black">
                            {totalStatic.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                            {totalStatic > 60 ? "Estilo contemplativo" : "Equilibrado"}
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Movimiento Dinámico
                        </div>
                        <div className="text-3xl font-bold text-black">
                            {totalDynamic.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                            {mostDynamicMovement?.name || "N/A"} predomina
                        </div>
                    </div>
                </div>

                {/* Análisis del movimiento dominante */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            Movimiento Predominante en el Video
                        </h4>
                        <div className="flex items-center gap-2 mb-2">
                            <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: MOVEMENT_COLORS[dominantMovement] || "#757575" }}
                            />
                            <span className="text-lg font-bold text-black">
                                {dominantMovement}
                            </span>
                            <span className="text-sm text-gray-600">
                                ({movementDistribution[dominantMovement]?.toFixed(1)}%)
                            </span>
                        </div>
                        <p className="text-sm text-gray-700">
                            <span className="font-semibold">Técnica: </span>
                            {movementDefinitions[dominantMovement]?.technical || "N/A"}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                            <span className="font-semibold">Uso cinematográfico: </span>
                            {movementDefinitions[dominantMovement]?.usage || "N/A"}
                        </p>
                    </div>
                </div>

                {/* Clasificación de estilo */}
                <div className="pt-4 border-t border-gray-200 bg-gray-50 rounded-lg p-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Estilo Cinematográfico del Video
                    </h4>
                    <p className="text-sm text-gray-700">
                        {totalStatic > 70
                            ? "Estilo clásico contemplativo - Enfoque en composición, diálogos y actuaciones. Similar a Wes Anderson o Stanley Kubrick."
                            : totalStatic > 40
                                ? "Estilo equilibrado estándar - Balance entre estabilidad y dinamismo. Típico de dramas y comedias contemporáneas."
                                : movementDistribution["Dolly"] > 15 || movementDistribution["Tracking"] > 15
                                    ? "Estilo dinámico moderno - Alta movilidad de cámara. Similar a Paul Greengrass o Emmanuel Lubezki."
                                    : "Estilo híbrido - Combina diferentes técnicas según las necesidades narrativas."}
                    </p>
                </div>

            </CardContent>
        </Card>
    )
}