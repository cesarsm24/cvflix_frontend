/**
 * page.tsx
 *
 * Página principal de la aplicación. Gestiona el flujo de autenticación mediante
 * renderizado condicional entre pantalla de login y aplicación principal.
 *
 * Author: César Sánchez Montes
 * Course: Imagen Digital
 * Year: 2025
 * Version: 3.0.0
 *
 * Dependencies:
 *   - react: Gestión de estado con hooks
 *   - @/components/login-screen: Componente de pantalla de inicio de sesión
 *   - @/components/main-app: Componente principal de la aplicación
 *
 * Usage:
 *   Renderizado automático como página raíz de la aplicación mediante
 *   Next.js App Router en la ruta '/'.
 *
 * Notes:
 *   - Utiliza directiva "use client" para habilitar hooks de React
 *   - Estado local determina visibilidad de componentes mediante renderizado condicional
 *   - Transición de login a app principal mediante callback onCompleteAction
 */

"use client"

import { useState } from "react"
import { LoginScreen } from "@/components/login-screen"
import MainApp from "@/components/main-app"

/**
 * Componente principal de la página Home.
 *
 * Implementa sistema de autenticación básico mediante control de visibilidad.
 * Muestra LoginScreen inicialmente y transfiere control a MainApp tras
 * completar acción de login.
 *
 * @returns Contenedor principal con componente activo según estado de autenticación
 *
 * Notes:
 *   Flujo de navegación:
 *     1. Estado inicial: showApp = false → Renderiza LoginScreen
 *     2. Usuario completa acción en LoginScreen
 *     3. Callback onCompleteAction ejecuta setShowApp(true)
 *     4. Re-renderizado: showApp = true → Renderiza MainApp
 *
 *   Clases aplicadas:
 *     - min-h-screen: Altura mínima de viewport completo
 *     - bg-background: Color de fondo del tema definido en variables CSS
 */
export default function Home() {
    /**
     * Estado de visibilidad de la aplicación principal.
     * Controla transición entre pantalla de login y aplicación.
     *
     * @default false - Muestra LoginScreen al cargar la página
     */
    const [showApp, setShowApp] = useState(false)

    return (
        <main className="min-h-screen bg-background">
            {!showApp ? <LoginScreen onCompleteAction={() => setShowApp(true)} /> : <MainApp />}
        </main>
    )
}