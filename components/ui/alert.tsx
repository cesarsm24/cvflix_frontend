/**
 * alert.tsx
 *
 * Componentes de alerta para mostrar mensajes informativos, advertencias y errores.
 * Implementa sistema de variantes con soporte para iconos y contenido estructurado
 * mediante CSS Grid.
 *
 * Author: César Sánchez Montes
 * Course: Imagen Digital
 * Year: 2025
 * Version: 3.0.0
 *
 * Dependencies:
 *   - react: Librería base de componentes
 *   - class-variance-authority: Sistema de variantes de estilos
 *   - @/lib/utils: Función cn para fusión de clases
 *
 * Usage:
 *   import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
 *   import { AlertCircle } from 'lucide-react'
 *
 *   // Alerta básica
 *   <Alert>
 *     <AlertTitle>Título</AlertTitle>
 *     <AlertDescription>Descripción del mensaje</AlertDescription>
 *   </Alert>
 *
 *   // Alerta con icono y variante destructive
 *   <Alert variant="destructive">
 *     <AlertCircle />
 *     <AlertTitle>Error</AlertTitle>
 *     <AlertDescription>Ha ocurrido un error</AlertDescription>
 *   </Alert>
 *
 * Notes:
 *   Variantes disponibles:
 *     - default: Estilo neutro con colores de card
 *     - destructive: Estilo de error con colores destructivos
 *
 *   Sistema de layout con CSS Grid:
 *     - Sin icono: grid-cols-[0_1fr] (columna invisible + contenido)
 *     - Con icono: has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr]
 *     - Icono en columna 1, título y descripción en columna 2
 *
 *   Accesibilidad:
 *     - role="alert": Anuncia cambios a lectores de pantalla
 *     - Estructura semántica con título y descripción separados
 *     - Contraste adecuado en ambas variantes
 */

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/**
 * Definición de variantes de estilos para Alert mediante CVA.
 *
 * Configura clases base y variantes de estilo utilizando class-variance-authority
 * para gestión consistente de estilos condicionales.
 *
 * Notes:
 *   Clases base:
 *     - Layout: Grid responsivo con columnas condicionales según presencia de icono
 *     - Espaciado: px-4 py-3 para padding interno
 *     - Tipografía: text-sm para contenido
 *     - Bordes: rounded-lg border
 *     - Icono: Estilos específicos mediante selectores [&>svg]
 *
 *   Selector has-[>svg]:
 *     Aplica estilos cuando alerta contiene elemento svg hijo directo.
 *     Cambia grid-cols y añade gap-x-3 para espaciado de icono.
 *
 *   Selectores de icono:
 *     - [&>svg]:size-4: Tamaño 4 (16px)
 *     - [&>svg]:translate-y-0.5: Ajuste vertical para alineación
 *     - [&>svg]:text-current: Hereda color de texto del contenedor
 */
const alertVariants = cva(
    'relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current',
    {
        variants: {
            /**
             * Variantes de estilo visual de la alerta.
             */
            variant: {
                /**
                 * Variante default para mensajes informativos neutros.
                 * Utiliza colores de card del sistema de diseño.
                 */
                default: 'bg-card text-card-foreground',
                /**
                 * Variante destructive para mensajes de error.
                 * Utiliza colores destructive con opacidad reducida en descripción.
                 */
                destructive:
                    'text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90',
            },
        },
        defaultVariants: {
            /** Variante por defecto si no se especifica */
            variant: 'default',
        },
    },
)

/**
 * Componente raíz de Alert.
 *
 * Contenedor principal de la alerta con role="alert" para accesibilidad.
 * Aplica variantes de estilo mediante CVA y permite clases adicionales.
 *
 * @param className - Clases CSS adicionales
 * @param variant - Variante de estilo ("default" | "destructive")
 * @param props - Props estándar de div
 * @returns Contenedor de alerta con estilos aplicados
 *
 * Notes:
 *   Props extendidas:
 *     Combina props de 'div' nativo con VariantProps de CVA para
 *     type-safety en variantes de estilo.
 *
 *   role="alert":
 *     Landmark ARIA que anuncia contenido a lectores de pantalla
 *     inmediatamente sin requerir navegación del usuario.
 *
 *   data-slot:
 *     Identificador para selectores CSS específicos y testing.
 */
function Alert({
                   className,
                   variant,
                   ...props
               }: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
    return (
        <div
            data-slot="alert"
            role="alert"
            className={cn(alertVariants({ variant }), className)}
            {...props}
        />
    )
}

/**
 * Componente AlertTitle.
 *
 * Título de la alerta con truncamiento de texto en una línea.
 * Posicionado en columna 2 del grid para alineación con icono opcional.
 *
 * @param className - Clases CSS adicionales
 * @param props - Props estándar de div
 * @returns Contenedor de título con estilos aplicados
 *
 * Notes:
 *   Estilos aplicados:
 *     - col-start-2: Inicia en columna 2 (después de icono)
 *     - line-clamp-1: Trunca texto a una línea con ellipsis
 *     - min-h-4: Altura mínima para alineación consistente
 *     - font-medium: Peso de fuente medio para jerarquía
 *     - tracking-tight: Espaciado de letras reducido
 *
 *   Uso típico:
 *     Texto corto descriptivo del tipo de alerta o mensaje principal.
 */
function AlertTitle({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="alert-title"
            className={cn(
                'col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight',
                className,
            )}
            {...props}
        />
    )
}

/**
 * Componente AlertDescription.
 *
 * Descripción detallada de la alerta. Soporta múltiples párrafos con
 * interlineado relajado para legibilidad.
 *
 * @param className - Clases CSS adicionales
 * @param props - Props estándar de div
 * @returns Contenedor de descripción con estilos aplicados
 *
 * Notes:
 *   Estilos aplicados:
 *     - col-start-2: Inicia en columna 2 (alineado con título)
 *     - grid justify-items-start: Subgrid para elementos internos
 *     - gap-1: Espaciado entre elementos internos
 *     - text-muted-foreground: Color secundario para jerarquía
 *     - [&_p]:leading-relaxed: Interlineado aumentado en párrafos
 *
 *   Selector de párrafos:
 *     [&_p] aplica leading-relaxed a todos los elementos <p> descendientes
 *     para mejorar legibilidad en textos largos.
 *
 *   Uso típico:
 *     Texto explicativo detallado, instrucciones o información adicional
 *     sobre la alerta. Puede contener múltiples párrafos.
 */
function AlertDescription({
                              className,
                              ...props
                          }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="alert-description"
            className={cn(
                'text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed',
                className,
            )}
            {...props}
        />
    )
}

export { Alert, AlertTitle, AlertDescription }