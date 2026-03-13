import { HashRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './context/ThemeContext'
import { ServerConfigProvider } from './context/ServerConfigContext'
import { ActiveEHRProvider } from './context/ActiveEHRContext'
import { ActiveCompositionProvider } from './context/ActiveCompositionContext'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { EHRPage } from './pages/EHRPage'
import { TemplatePage } from './pages/TemplatePage'
import { CompositionPage } from './pages/CompositionPage'
import { AqlPage } from './pages/AqlPage'
import { SettingsPage } from './pages/SettingsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ServerConfigProvider>
          <ActiveEHRProvider>
            <ActiveCompositionProvider>
              <HashRouter>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/ehr" element={<EHRPage />} />
                    <Route path="/templates" element={<TemplatePage />} />
                    <Route path="/compositions" element={<CompositionPage />} />
                    <Route path="/aql" element={<AqlPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Routes>
                </Layout>
              </HashRouter>
            </ActiveCompositionProvider>
          </ActiveEHRProvider>
        </ServerConfigProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
