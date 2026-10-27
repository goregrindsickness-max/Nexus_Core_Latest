import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorStr: string;
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: '#0c0e12',
  color: '#e4e4e7',
  padding: '24px',
  boxSizing: 'border-box',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};

const cardStyle: React.CSSProperties = {
  maxWidth: '520px',
  width: '100%',
  backgroundColor: '#12151e',
  border: '1px solid #27272a',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
};

const headerSubStyle: React.CSSProperties = {
  color: '#00ffcc',
  fontSize: '11px',
  fontWeight: 'bold',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  marginBottom: '8px'
};

const titleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
  color: '#fff'
};

const errorBoxStyle: React.CSSProperties = {
  backgroundColor: '#080a0f',
  border: '1px solid #1f2736',
  borderRadius: '6px',
  padding: '12px',
  color: '#ff3366',
  fontFamily: 'monospace',
  fontSize: '11px',
  maxHeight: '160px',
  overflowY: 'auto',
  whiteSpace: 'pre-wrap',
  marginBottom: '20px'
};

const buttonGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap'
};

const primaryBtnStyle: React.CSSProperties = {
  flex: '1',
  backgroundColor: '#00ffcc',
  color: '#000',
  border: 'none',
  padding: '10px 16px',
  borderRadius: '6px',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '13px'
};

const secondaryBtnStyle: React.CSSProperties = {
  flex: '1',
  backgroundColor: '#1f2736',
  color: '#d4d4d8',
  border: '1px solid #3f3f46',
  padding: '10px 16px',
  borderRadius: '6px',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '13px'
};

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
        <div style={containerStyle}>
          <div style={cardStyle}>
            <div style={headerSubStyle}>
              System Exception Intercepted
            </div>
            <h2 style={titleStyle}>
              Nexus Core Encountered an Unexpected Error
            </h2>
            <div style={errorBoxStyle}>
              {this.state.errorStr || 'Unknown runtime error'}
            </div>
            <div style={buttonGroupStyle}>
              <button
                onClick={() => window.location.reload()}
                style={primaryBtnStyle}
              >
                Reload App
              </button>
              <button
                onClick={() => {
                  try {
                    localStorage.clear();
                    sessionStorage.clear();
                  } catch (e) {}
                  window.location.reload();
                }}
                style={secondaryBtnStyle}
              >
                Clear Cache & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
