import { useState, useCallback, useRef, createContext, useContext, useEffect } from "react";

interface LoadingContextType {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  addLoading: () => void;
  removeLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoadingState] = useState(false);
  const counterRef = useRef(0);

  const setLoading = useCallback((value: boolean) => {
    setLoadingState(value);
  }, []);

  const addLoading = useCallback(() => {
    counterRef.current += 1;
    setLoadingState(true);
  }, []);

  const removeLoading = useCallback(() => {
    counterRef.current = Math.max(0, counterRef.current - 1);
    if (counterRef.current === 0) {
      setLoadingState(false);
    }
  }, []);

  // Auto-cleanup: remove loading after navigation completes
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        counterRef.current = 0;
        setLoadingState(false);
      }, 5000); // Safety timeout after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [loading]);

  return (
    <LoadingContext.Provider value={{ loading, setLoading, addLoading, removeLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}
