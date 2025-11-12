declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'vuetify/styles'
declare module 'vuetify/labs/VDataTable'

/// <reference types="vite/client" />
