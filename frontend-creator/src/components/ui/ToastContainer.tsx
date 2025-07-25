import React from 'react';
import { Toast } from './Feedback';
import { useFormValidationContext } from '../../contexts/FormValidationContext';

interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxToasts?: number;
}

/**
 * Container component that displays toast notifications from the form validation context
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'top-right',
  maxToasts = 5,
}) => {
  const { messages, removeMessage } = useFormValidationContext();

  // Show only the most recent messages
  const visibleMessages = messages.slice(-maxToasts);

  if (visibleMessages.length === 0) {
    return null;
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 space-y-2`}>
      {visibleMessages.map((message, index) => (
        <div
          key={message.id}
          className="animate-fade-in-down"
          style={{
            animationDelay: `${index * 100}ms`,
          }}
        >
          <Toast
            type={message.type}
            message={message.message}
            onDismiss={() => removeMessage(message.id)}
            duration={0} // Duration is handled by the context
            position={position}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;