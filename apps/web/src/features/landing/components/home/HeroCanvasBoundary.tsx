'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface HeroCanvasBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface HeroCanvasBoundaryState {
  hasError: boolean;
}

/** Shows the static logo fallback if WebGL/model loading fails. */
export class HeroCanvasBoundary extends Component<
  HeroCanvasBoundaryProps,
  HeroCanvasBoundaryState
> {
  state: HeroCanvasBoundaryState = { hasError: false };

  static getDerivedStateFromError(): HeroCanvasBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Intentionally silent: the static logo remains as the accessible fallback.
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
