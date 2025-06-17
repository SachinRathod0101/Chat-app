import React, { Component } from "react";

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div className="text-center mt-20 text-red-500">Something went wrong. Please try again.</div>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;