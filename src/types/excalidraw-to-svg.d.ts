declare module 'excalidraw-to-svg' {
  interface ExcalidrawElement {
    id: string
    type: string
    x: number
    y: number
    width: number
    height: number
    angle: number
    strokeColor: string
    backgroundColor: string
    fillStyle: string
    strokeWidth: number
    strokeStyle: string
    roughness: number
    opacity: number
    [key: string]: any
  }

  interface ExcalidrawAppState {
    viewBackgroundColor?: string
    [key: string]: any
  }

  interface ExcalidrawData {
    elements: ExcalidrawElement[]
    appState?: ExcalidrawAppState
    files?: Record<string, any>
  }

  interface ExportOptions {
    exportPadding?: number
    exportBackground?: boolean
    viewBackgroundColor?: string
    exportWithDarkMode?: boolean
    exportScale?: number
  }

  function excalidrawToSvg(
    excalidrawData: ExcalidrawData,
    options?: ExportOptions
  ): Promise<string>

  export = excalidrawToSvg
}