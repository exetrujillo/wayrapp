import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Feedback, { Toast } from '../Feedback';

describe('Feedback Component', () => {
  test('renders success feedback', () => {
    render(<Feedback type="success" message="Operation successful" />);
    const feedback = screen.getByText('Operation successful');
    expect(feedback).toBeInTheDocument();
    expect(feedback.parentElement?.parentElement).toHaveClass('bg-success');
    expect(feedback.parentElement?.parentElement).toHaveClass('text-success');
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('renders error feedback', () => {
    render(<Feedback type="error" message="An error occurred" />);
    const feedback = screen.getByText('An error occurred');
    expect(feedback).toBeInTheDocument();
    expect(feedback.parentElement?.parentElement).toHaveClass('bg-error');
    expect(feedback.parentElement?.parentElement).toHaveClass('text-error');
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  test('renders warning feedback', () => {
    render(<Feedback type="warning" message="Warning message" />);
    const feedback = screen.getByText('Warning message');
    expect(feedback).toBeInTheDocument();
    expect(feedback.parentElement?.parentElement).toHaveClass('bg-warning');
    expect(feedback.parentElement?.parentElement).toHaveClass('text-warning');
  });

  test('renders info feedback', () => {
    render(<Feedback type="info" message="Information message" />);
    const feedback = screen.getByText('Information message');
    expect(feedback).toBeInTheDocument();
    expect(feedback.parentElement?.parentElement).toHaveClass('bg-primary-500');
    expect(feedback.parentElement?.parentElement).toHaveClass('text-primary-500');
  });

  test('renders without icon when showIcon is false', () => {
    render(<Feedback type="success" message="No icon" showIcon={false} />);
    expect(screen.getByText('No icon')).toBeInTheDocument();
    expect(document.querySelector('svg')).not.toBeInTheDocument();
  });

  test('calls onDismiss when dismiss button is clicked', () => {
    const handleDismiss = jest.fn();
    render(
      <Feedback type="success" message="Dismissible message" onDismiss={handleDismiss} />
    );
    fireEvent.click(screen.getByLabelText('Dismiss'));
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  test('applies custom className', () => {
    render(
      <Feedback type="success" message="Custom class" className="custom-class" />
    );
    expect(screen.getByRole('status')).toHaveClass('custom-class');
  });
});

describe('Toast Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders toast with default position', () => {
    render(<Toast type="success" message="Toast message" />);
    const toast = screen.getByText('Toast message').parentElement?.parentElement?.parentElement;
    expect(toast).toHaveClass('fixed');
    expect(toast).toHaveClass('top-4');
    expect(toast).toHaveClass('right-4');
  });

  test('renders toast with custom position', () => {
    render(<Toast type="success" message="Toast message" position="bottom-left" />);
    const toast = screen.getByText('Toast message').parentElement?.parentElement?.parentElement;
    expect(toast).toHaveClass('bottom-4');
    expect(toast).toHaveClass('left-4');
  });

  test('auto-dismisses after duration', () => {
    const handleDismiss = jest.fn();
    render(
      <Toast 
        type="success" 
        message="Auto dismiss" 
        onDismiss={handleDismiss} 
        duration={2000} 
      />
    );
    
    expect(handleDismiss).not.toHaveBeenCalled();
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  test('does not auto-dismiss if duration is 0', () => {
    const handleDismiss = jest.fn();
    render(
      <Toast 
        type="success" 
        message="No auto dismiss" 
        onDismiss={handleDismiss} 
        duration={0} 
      />
    );
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    
    expect(handleDismiss).not.toHaveBeenCalled();
  });

  test('can be manually dismissed', () => {
    const handleDismiss = jest.fn();
    render(
      <Toast 
        type="success" 
        message="Manual dismiss" 
        onDismiss={handleDismiss} 
        duration={5000} 
      />
    );
    
    fireEvent.click(screen.getByLabelText('Dismiss'));
    expect(handleDismiss).toHaveBeenCalledTimes(1);
    
    // Fast-forward time - should not call onDismiss again
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });
});