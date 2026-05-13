import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './AuthContext'
import { FavoritesProvider } from './FavoritesContext'
import { WatchProgressProvider } from './WatchProgressContext'

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <FavoritesProvider>
      <WatchProgressProvider>
        <App />
      </WatchProgressProvider>
    </FavoritesProvider>
  </AuthProvider>,
)
