import { LanguageProvider } from '@/i18n'
import AgentApp from './AgentApp'

export default function App() {
  return (
    <LanguageProvider>
      <AgentApp />
    </LanguageProvider>
  )
}
