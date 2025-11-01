/**
 * accordion.tsx
 *
 * Componentes de acordeón accesible construidos sobre Radix UI Accordion.
 * Proporciona interfaz plegable para organizar contenido en secciones expandibles
 * con animaciones suaves y soporte completo de teclado.
 *
 * Author: César Sánchez Montes
 * Course: Imagen Digital
 * Year: 2025
 * Version: 3.0.0
 *
 * Dependencies:
 *   - react: Librería base de componentes
 *   - @radix-ui/react-accordion: Primitivas accesibles de acordeón
 *   - lucide-react: Iconos (ChevronDownIcon)
 *   - @/lib/utils: Función cn para fusión de clases
 *
 * Usage:
 *   import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
 *
 *   <Accordion type="single" collapsible>
 *     <AccordionItem value="item-1">
 *       <AccordionTrigger>¿Pregunta 1?</AccordionTrigger>
 *       <AccordionContent>Respuesta 1</AccordionContent>
 *     </AccordionItem>
 *     <AccordionItem value="item-2">
 *       <AccordionTrigger>¿Pregunta 2?</AccordionTrigger>
 *       <AccordionContent>Respuesta 2</AccordionContent>
 *     </AccordionItem>
 *   </Accordion>
 *
 * Notes:
 *   Características de accesibilidad:
 *     - Navegación por teclado (Tab, Enter, Space, Arrow keys)
 *     - Atributos ARIA automáticos (aria-expanded, aria-controls)
 *     - Focus ring visible en modo teclado
 *     - Estados disabled completamente accesibles
 *
 *   Modos de acordeón disponibles:
 *     - type="single": Solo un item expandido a la vez
 *     - type="multiple": Múltiples items expandidos simultáneamente
 *     - collapsible: Permite colapsar item activo en modo single
 *
 *   Animaciones:
 *     - animate-accordion-down: Expansión suave de contenido
 *     - animate-accordion-up: Colapso suave de contenido
 *     - Rotación de chevron 180° en transición
 */

'use client'

import * as React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDownIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Componente raíz de Accordion.
 *
 * Contenedor principal que gestiona estado de expansión/colapso de items.
 * Wrapper directo de AccordionPrimitive.Root con data-slot para identificación.
 *
 * @param props - Props heredadas de Radix UI Accordion.Root
 * @returns Componente raíz de acordeón
 *
 * Notes:
 *   Props principales:
 *     - type: "single" | "multiple" - Modo de expansión
 *     - collapsible: boolean - Permite colapsar en modo single
 *     - defaultValue: string | string[] - Items expandidos inicialmente
 *     - value: string | string[] - Control controlado de estado
 *     - onValueChange: Callback de cambio de estado
 *
 *   data-slot:
 *     Atributo para identificación en selectores CSS y testing.
 */
function Accordion({
                     ...props
                   }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

/**
 * Componente de item individual del acordeón.
 *
 * Contenedor de un par trigger/content expandible. Incluye borde inferior
 * excepto en último item para separación visual entre secciones.
 *
 * @param className - Clases CSS adicionales
 * @param props - Props heredadas de Radix UI Accordion.Item
 * @returns Item de acordeón con estilos base
 *
 * Notes:
 *   Estilos aplicados:
 *     - border-b: Borde inferior para separación
 *     - last:border-b-0: Sin borde en último item
 *
 *   Props requeridas:
 *     - value: string - Identificador único del item
 */
function AccordionItem({
                         className,
                         ...props
                       }: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
      <AccordionPrimitive.Item
          data-slot="accordion-item"
          className={cn('border-b last:border-b-0', className)}
          {...props}
      />
  )
}

/**
 * Componente de trigger (botón) del acordeón.
 *
 * Botón interactivo que expande/colapsa contenido asociado. Incluye icono
 * chevron con animación de rotación y estados de focus accesibles.
 *
 * @param className - Clases CSS adicionales
 * @param children - Contenido del trigger (típicamente texto)
 * @param props - Props heredadas de Radix UI Accordion.Trigger
 * @returns Botón trigger con estilos e icono
 *
 * Notes:
 *   Características visuales:
 *     - Chevron rotación 180° al expandir
 *     - Subrayado en hover
 *     - Ring de focus visible
 *     - Opacidad reducida cuando disabled
 *
 *   Estructura:
 *     Header > Trigger > (children + ChevronIcon)
 *
 *   Transiciones:
 *     - all: Transición general para cambios de estado
 *     - duration-200: Rotación de chevron en 200ms
 *
 *   Selector de estado:
 *     [&[data-state=open]>svg]: Aplica rotación a chevron cuando expandido
 */
function AccordionTrigger({
                            className,
                            children,
                            ...props
                          }: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
      <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
            data-slot="accordion-trigger"
            className={cn(
                'focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
                className,
            )}
            {...props}
        >
          {children}
          <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
  )
}

/**
 * Componente de contenido expandible del acordeón.
 *
 * Contenedor del contenido que se muestra/oculta mediante animaciones.
 * Implementa transiciones suaves mediante data-state attributes.
 *
 * @param className - Clases CSS adicionales
 * @param children - Contenido a mostrar cuando expandido
 * @param props - Props heredadas de Radix UI Accordion.Content
 * @returns Contenedor animado de contenido
 *
 * Notes:
 *   Animaciones aplicadas:
 *     - data-[state=open]: animate-accordion-down
 *     - data-[state=closed]: animate-accordion-up
 *
 *   Estas animaciones deben estar definidas en configuración de Tailwind
 *   en tailwind.config.js para funcionar correctamente.
 *
 *   Estructura:
 *     Content (animado) > div (padding) > children
 *
 *   Padding:
 *     - pt-0: Sin padding superior (trigger ya tiene padding)
 *     - pb-4: Padding inferior para espaciado con siguiente item
 *
 *   overflow-hidden:
 *     Necesario para clip de contenido durante animaciones de altura.
 */
function AccordionContent({
                            className,
                            children,
                            ...props
                          }: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
      <AccordionPrimitive.Content
          data-slot="accordion-content"
          className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
          {...props}
      >
        <div className={cn('pt-0 pb-4', className)}>{children}</div>
      </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }