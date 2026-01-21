import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Model loading error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      console.error('Rendering fallback due to error:', this.state.error);
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
