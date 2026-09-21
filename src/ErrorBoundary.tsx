import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorStr: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorStr: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorStr: error.toString() + "\n" + error.stack };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', fontFamily: 'monospace', padding: '20px', whiteSpace: 'pre-wrap', backgroundColor: '#000', width: '100vw', height: '100vh', overflow: 'auto' }}>
          <h1>Rendering Error</h1>
          <p>{this.state.errorStr}</p>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
