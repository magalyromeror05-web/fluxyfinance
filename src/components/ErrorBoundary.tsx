import React from "react";
import { logError } from "@/lib/errorLogger";
import { Button } from "@/components/ui/button";

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logError(error, window.location.pathname, {
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-sm text-center space-y-4">
            <p className="text-4xl">😕</p>
            <h1 className="text-xl font-bold text-foreground">Algo deu errado</h1>
            <p className="text-sm text-muted-foreground">
              Nossa equipe foi notificada automaticamente.
            </p>
            <Button onClick={() => { this.setState({ hasError: false }); window.location.href = "/dashboard"; }}>
              Voltar ao início
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
