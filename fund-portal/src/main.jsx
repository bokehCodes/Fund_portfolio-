import React, { Component } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { SettingsProvider } from './context/Settings'
import { AuthProvider } from './context/Auth'
import { configError } from './lib/supabase'
import './styles.css'

class AppErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    console.error('Application rendering failed.', error)
  }

  render() {
    if (this.state.error) {
      return (
        <main className="fatal" role="alert">
          <div>
            <h1>Something went wrong</h1>
            <p>{this.state.error.message}</p>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  configError
    ? <main className="fatal" role="alert"><p>{configError}</p></main>
    : (
      <BrowserRouter>
        <SettingsProvider>
          <AuthProvider>
            <AppErrorBoundary><App /></AppErrorBoundary>
          </AuthProvider>
        </SettingsProvider>
      </BrowserRouter>
    )
)
