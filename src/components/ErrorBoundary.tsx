import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="bg-[#000000] border border-[#1A1A1A] rounded-xl p-4 flex flex-col items-center justify-center h-full min-h-[120px] text-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-500 mb-2 shrink-0" />
          <div className="text-[10px] font-mono font-black text-red-400 uppercase tracking-widest leading-tight">PRICE UNCONFIGURED</div>
        </div>
      );
    }

    return this.props.children;
  }
}
