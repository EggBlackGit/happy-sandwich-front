import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import router from './router'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'sandwich',
    themes: {
      sandwich: {
        dark: false,
        colors: {
          background: '#f9fafb',
          surface: '#ffffff',
          primary: '#f97316',
          secondary: '#34d399',
          accent: '#fed7aa',
        },
      },
    },
  },
})

createApp(App).use(router).use(vuetify).mount('#app')
