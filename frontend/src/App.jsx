import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [health, setHealth] = useState('Checking backend connection...')

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health')
        const data = await response.json()
        setHealth(`${data.status.toUpperCase()}: ${data.message}`)
      } catch {
        setHealth('Cannot connect to backend. Make sure backend server is running on port 5000.')
      }
    }

    checkHealth()
  }, [])

  return (
    <main className="app">
      <h1>NYAWIT GROUP</h1>
      <p>Ready to War on Fullstack Course.</p>
      <p className="status">{health}</p>
    </main>
  )
}

export default App
