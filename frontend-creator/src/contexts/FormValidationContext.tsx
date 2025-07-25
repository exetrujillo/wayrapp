import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ValidationMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
  duration?: number;
}

interface FormValidationContextValue {
  // Global validation messages
  messages: ValidationMessage[];
  addMessage: (type: ValidationMessage['type'], message: string, duration?: number) => string;
  removeMessage: (id: string) => void;
  clearMessages: () => void;
  
  // Form submission state
  isSubmitting: boolean;
  setSubmitting: (submitting: boolean) => void;
  
  // Success feedback helpers
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const FormValidationContext = createContext<FormValidationContextValue | undefined>(undefined);

interface FormValidationProviderProps {
  children: ReactNode;
}

export const FormValidationProvider: React.FC<FormValidationProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<ValidationMessage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addMessage = useCallback((
    type: ValidationMessage['type'], 
    message: string, 
    duration = 5000
  ): string => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newMessage: ValidationMessage = {
      id,
      type,
      message,
      timestamp: Date.now(),
      duration,
    };

    setMessages(prev => [...prev, newMessage]);

    // Auto-remove message after duration
    if (duration > 0) {
      setTimeout(() => {
        removeMessage(id);
      }, duration);
    }

    return id;
  }, []);

  const removeMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const setSubmitting = useCallback((submitting: boolean) => {
    setIsSubmitting(submitting);
  }, []);

  // Convenience methods for different message types
  const showSuccess = useCallback((message: string, duration = 5000) => {
    return addMessage('success', message, duration);
  }, [addMessage]);

  const showError = useCallback((message: string, duration = 8000) => {
    return addMessage('error', message, duration);
  }, [addMessage]);

  const showWarning = useCallback((message: string, duration = 6000) => {
    return addMessage('warning', message, duration);
  }, [addMessage]);

  const showInfo = useCallback((message: string, duration = 5000) => {
    return addMessage('info', message, duration);
  }, [addMessage]);

  const value: FormValidationContextValue = {
    messages,
    addMessage,
    removeMessage,
    clearMessages,
    isSubmitting,
    setSubmitting,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <FormValidationContext.Provider value={value}>
      {children}
    </FormValidationContext.Provider>
  );
};

export const useFormValidationContext = (): FormValidationContextValue => {
  const context = useContext(FormValidationContext);
  if (!context) {
    throw new Error('useFormValidationContext must be used within a FormValidationProvider');
  }
  return context;
};

export default FormValidationContext;