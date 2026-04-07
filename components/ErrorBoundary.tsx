'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Dashboard error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center h-full bg-slate-800 rounded-lg border border-red-700">
          <div className="text-center p-4">
            <div className="text-red-400 text-sm font-semibold mb-1">Component error</div>
            <div className="text-slate-400 text-xs">Some data unavailable</div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
