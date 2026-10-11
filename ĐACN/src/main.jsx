import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/rajdhani/latin-500.css'
import '@fontsource/rajdhani/latin-ext-500.css'
import '@fontsource/rajdhani/latin-600.css'
import '@fontsource/rajdhani/latin-ext-600.css'
import '@fontsource/rajdhani/latin-700.css'
import '@fontsource/rajdhani/latin-ext-700.css'
import App from './App.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
