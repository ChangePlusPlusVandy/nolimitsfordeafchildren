import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import { BrowserRouter, Route, Routes } from 'react-router'
import { Auth0Provider } from '@auth0/auth0-react'
import config from './config.ts'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import UserDetailsPage from './domains/users/pages/UserDetailsPage.tsx'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Auth0Provider
      domain={config.auth0.domain}
      clientId={config.auth0.clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/users/:id" element={<UserDetailsPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </Auth0Provider>
  </StrictMode>,
)
