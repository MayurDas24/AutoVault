import { BrowserRouter } from 'react-router-dom'
import './App.css'
import { AppRoutes } from './AppRoutes'
import { AppProviders } from './providers/AppProviders'

function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  )
}

export default App