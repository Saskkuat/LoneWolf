import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from "./LanguageContext"; // Import the provider

createRoot(document.getElementById('root')).render(
  // <StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider> 
  // </StrictMode>,
)
