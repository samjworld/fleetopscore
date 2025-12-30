import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logger } from '../utils/logger.ts';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component to catch rendering errors in the component tree.
 */
// Fix: Explicitly extend Component from react and initialize state in constructor for better TS compatibility
export class ErrorBoundary extends Component<Props, State> {
  // Fix: Explicitly define state type for inheritance recognition
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error using the optimized logger
    logger.error('System Fault Exception', { 
        name: error.name,
        message: error.message, 
        stack: error.stack,
        componentStack: errorInfo.componentStack 
    });
    // Fix: Accessing setState through any cast for inheritance recognition
    (this as any).setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    // Fix: state and props are now correctly identified via Component inheritance
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-800">
            <div className="bg-red-50 dark:bg-red-950/20 p-8 flex flex-col items-center text-center border-b border-red-100 dark:border-red-900/30">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-600 dark:text-red-500">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">System Fault Detected</h2>
              <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm font-medium">
                The application encountered an unrecoverable rendering exception. Terminal state has been logged.
              </p>
            </div>
            
            <div className="p-8 space-y-6">
              {/* Fix: Accessing error property from the state object inherited from Component */}
              {this.state.error && (
                <div className="bg-slate-900 rounded-xl p-4 overflow-auto max-h-48 text-left border border-slate-800 shadow-inner">
                  <p className="text-red-400 font-mono text-xs mb-2 font-bold">FAULT_CORE: {this.state.error.message}</p>
                  <pre className="text-slate-500 font-mono text-[10px] whitespace-pre-wrap leading-relaxed">
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={this.handleReload}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-blue-500/20"
                >
                  <RefreshCw size={18} /> Restart Terminal
                </button>
                <button
                  onClick={this.handleGoHome}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  <Home size={18} /> Home Interface
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Fix: Accessing children through any cast of this for inherited props
    return (this as any).props.children;
  }
}