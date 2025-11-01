/**
 * use-toast.ts
 *
 * Hook personalizado y sistema de gestión global de notificaciones toast.
 * Implementa patrón de estado compartido sin Context API para máximo rendimiento,
 * inspirado en la librería react-hot-toast.
 *
 * Author: César Sánchez Montes
 * Course: Imagen Digital
 * Year: 2025
 * Version: 3.0.0
 *
 * Dependencies:
 *   - react: Hooks useState y useEffect
 *   - @/components/ui/toast: Tipos y componentes de toast
 *
 * Usage:
 *   import { useToast } from '@/hooks/use-toast'
 *
 *   function MyComponent() {
 *     const { toast } = useToast()
 *
 *     const handleClick = () => {
 *       toast({
 *         title: "Operación exitosa",
 *         description: "Los cambios han sido guardados",
 *         variant: "default"
 *       })
 *     }
 *
 *     return <button onClick={handleClick}>Guardar</button>
 *   }
 *
 * Notes:
 *   Arquitectura de estado:
 *     - Estado compartido en memoria (memoryState) fuera de React
 *     - Array de listeners para sincronización con componentes
 *     - Reducer puro para transformaciones de estado
 *     - Sistema de timers para auto-eliminación de toasts
 *
 *   Ventajas del patrón:
 *     - No requiere Provider en árbol de componentes
 *     - Invocación desde cualquier parte del código (incluso fuera de React)
 *     - Rendimiento óptimo sin re-renders innecesarios
 *     - Estado persistente entre montajes/desmontajes
 *
 *   Configuración:
 *     - TOAST_LIMIT: Máximo 1 toast visible simultáneamente
 *     - TOAST_REMOVE_DELAY: 1,000,000ms para remoción del DOM
 */

'use client'

import * as React from 'react'

import type { ToastActionElement, ToastProps } from '@/components/ui/toast'

/**
 * Número máximo de toasts visibles simultáneamente.
 *
 * @constant
 * @default 1 - Un toast a la vez para evitar sobrecarga visual
 */
const TOAST_LIMIT = 1

/**
 * Delay en milisegundos antes de remover toast del DOM tras dismiss.
 *
 * @constant
 * @default 1000000 - Aproximadamente 16.7 minutos
 */
const TOAST_REMOVE_DELAY = 1000000

/**
 * Tipo extendido de toast con identificador y contenido opcional.
 *
 * Combina ToastProps base con propiedades adicionales para gestión
 * de toasts individuales en el sistema.
 */
type ToasterToast = ToastProps & {
  /** Identificador único del toast */
  id: string
  /** Título opcional del toast */
  title?: React.ReactNode
  /** Descripción opcional del toast */
  description?: React.ReactNode
  /** Elemento de acción opcional (botón, enlace) */
  action?: ToastActionElement
}

/**
 * Tipos de acciones disponibles para el reducer.
 *
 * Define constantes para dispatch de acciones en sistema de toasts.
 */
const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
} as const

/**
 * Contador global para generación de IDs únicos.
 * Incrementa de forma circular para prevenir overflow.
 */
let count = 0

/**
 * Genera identificador único para toast.
 *
 * Utiliza contador global con incremento modular para generar IDs
 * únicos sin riesgo de overflow. El módulo Number.MAX_SAFE_INTEGER
 * asegura que count nunca exceda límite seguro de JavaScript.
 *
 * @returns String representando ID único del toast
 *
 * Notes:
 *   Seguridad numérica:
 *     Number.MAX_SAFE_INTEGER = 9,007,199,254,740,991
 *     Módulo asegura que count se reinicia a 0 al alcanzar límite.
 */
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

/**
 * Tipo de las claves del objeto actionTypes.
 */
type ActionType = typeof actionTypes

/**
 * Unión discriminada de acciones del reducer.
 *
 * Define estructura de cada tipo de acción con sus payloads específicos.
 */
type Action =
    | {
  type: ActionType['ADD_TOAST']
  toast: ToasterToast
}
    | {
  type: ActionType['UPDATE_TOAST']
  toast: Partial<ToasterToast>
}
    | {
  type: ActionType['DISMISS_TOAST']
  toastId?: ToasterToast['id']
}
    | {
  type: ActionType['REMOVE_TOAST']
  toastId?: ToasterToast['id']
}

/**
 * Interface del estado del sistema de toasts.
 */
interface State {
  /** Array de toasts actualmente gestionados */
  toasts: ToasterToast[]
}

/**
 * Mapa de timeouts activos para remoción programada de toasts.
 * Utiliza ID de toast como clave y timeout ID como valor.
 */
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * Programa remoción diferida de toast tras dismiss.
 *
 * Añade toast a cola de remoción estableciendo timeout que dispatch
 * acción REMOVE_TOAST tras TOAST_REMOVE_DELAY. Previene timeouts
 * duplicados verificando existencia previa en mapa.
 *
 * @param toastId - Identificador del toast a remover
 *
 * Notes:
 *   Flujo de remoción:
 *     1. Verifica si ya existe timeout para este toast
 *     2. Si existe, retorna sin crear nuevo timeout (idempotencia)
 *     3. Crea setTimeout para dispatch de REMOVE_TOAST
 *     4. Almacena timeout ID en mapa para tracking
 *     5. Al ejecutar timeout: elimina entrada del mapa y dispatch acción
 *
 *   Propósito del delay:
 *     Permite completar animaciones de salida antes de remover del DOM.
 *     El valor alto (1M ms) sugiere remoción manual o persistencia extendida.
 */
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: 'REMOVE_TOAST',
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

/**
 * Reducer puro para transformaciones de estado de toasts.
 *
 * Procesa acciones y retorna nuevo estado sin mutar el original.
 * Implementa lógica de negocio para añadir, actualizar, descartar
 * y remover toasts del estado global.
 *
 * @param state - Estado actual del sistema de toasts
 * @param action - Acción a procesar con su payload
 * @returns Nuevo estado tras aplicar transformación
 *
 * Notes:
 *   Casos del switch:
 *     - ADD_TOAST: Añade toast al inicio, limita a TOAST_LIMIT
 *     - UPDATE_TOAST: Actualiza propiedades de toast específico
 *     - DISMISS_TOAST: Marca toast como cerrado y programa remoción
 *     - REMOVE_TOAST: Elimina toast del array de estado
 *
 *   Side effects en DISMISS_TOAST:
 *     Contiene llamada a addToRemoveQueue (side effect) por simplicidad.
 *     Podría extraerse a acción separada para pureza estricta del reducer.
 */
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
            t.id === action.toast.id ? { ...t, ...action.toast } : t,
        ),
      }

    case 'DISMISS_TOAST': {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
            t.id === toastId || toastId === undefined
                ? {
                  ...t,
                  open: false,
                }
                : t,
        ),
      }
    }
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

/**
 * Array de funciones listener para sincronización con componentes React.
 * Cada componente que use useToast registra su setState aquí.
 */
const listeners: Array<(state: State) => void> = []

/**
 * Estado global en memoria del sistema de toasts.
 * Persiste fuera del ciclo de vida de React para compartir entre componentes.
 */
let memoryState: State = { toasts: [] }

/**
 * Dispatch de acciones al reducer y notificación a listeners.
 *
 * Aplica acción al estado mediante reducer, actualiza memoryState
 * y notifica a todos los listeners registrados para sincronización
 * con componentes React.
 *
 * @param action - Acción a procesar
 *
 * Notes:
 *   Flujo de dispatch:
 *     1. Aplica reducer al estado actual con acción
 *     2. Actualiza memoryState con nuevo estado
 *     3. Itera listeners y ejecuta cada uno con nuevo estado
 *     4. Cada listener (setState) actualiza su componente
 */
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

/**
 * Tipo de toast sin propiedad id (generada automáticamente).
 */
type Toast = Omit<ToasterToast, 'id'>

/**
 * Función imperativa para mostrar toast.
 *
 * Crea y muestra nuevo toast con ID autogenerado. Retorna objeto con
 * métodos para actualizar o descartar el toast programáticamente.
 *
 * @param props - Propiedades del toast a mostrar
 * @returns Objeto con id del toast y métodos dismiss/update
 *
 * Notes:
 *   Métodos retornados:
 *     - id: Identificador del toast creado
 *     - dismiss(): Cierra el toast inmediatamente
 *     - update(props): Actualiza propiedades del toast
 *
 *   Uso típico:
 *     const myToast = toast({ title: "Cargando..." })
 *     // ... operación asíncrona
 *     myToast.update({ title: "Completado!" })
 *     myToast.dismiss()
 *
 *   Callback onOpenChange:
 *     Conecta estado interno de componente Toast con sistema de dismiss.
 *     Cuando Toast UI se cierra (open=false), ejecuta dismiss automáticamente.
 */
function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
      dispatch({
        type: 'UPDATE_TOAST',
        toast: { ...props, id },
      })
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id })

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

/**
 * Hook useToast.
 *
 * Proporciona acceso al estado de toasts y función toast para mostrar
 * notificaciones. Sincroniza componente con estado global mediante
 * sistema de listeners.
 *
 * @returns Objeto con estado de toasts, función toast y función dismiss
 *
 * Notes:
 *   Sincronización:
 *     1. Estado local inicializado con memoryState actual
 *     2. useEffect registra setState como listener al montar
 *     3. Cada dispatch notifica a setState causando re-render
 *     4. Cleanup remueve setState de listeners al desmontar
 *
 *   Retorno:
 *     - toasts: Array de toasts actualmente activos
 *     - toast: Función para mostrar nuevos toasts
 *     - dismiss: Función para cerrar toast específico o todos
 *
 *   Dependencia [state]:
 *     Asegura que efecto se re-ejecute si setState cambia,
 *     previniendo memory leaks con listeners obsoletos.
 */
function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  }
}

export { useToast, toast }