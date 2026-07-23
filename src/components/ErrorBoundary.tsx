import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center text-red-600">
          <p className="font-bold">Something went wrong</p>
          <pre className="text-xs mt-2 whitespace-pre-wrap">
            {this.state.error?.message || "Unknown error"}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}