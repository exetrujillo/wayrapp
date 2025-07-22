import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from '../Input';

describe('Input Component', () => {
  test('renders with default props', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  test('renders with label', () => {
    render(<Input label="Email" id="email" />);
    const label = screen.getByText('Email');
    expect(label).toBeInTheDocument();
    expect(label).toHaveAttribute('for', 'email');
  });

  test('renders with required indicator', () => {
    render(<Input label="Email" isRequired />);
    const requiredIndicator = screen.getByText('*');
    expect(requiredIndicator).toBeInTheDocument();
    expect(requiredIndicator).toHaveClass('text-error');
  });

  test('renders with error message', () => {
    render(<Input error="This field is required" id="test-input" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'test-input-description');
    
    const errorMessage = screen.getByText('This field is required');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass('text-error');
    expect(errorMessage).toHaveAttribute('id', 'test-input-description');
  });

  test('renders with helper text', () => {
    render(<Input helperText="Enter your email address" id="test-input" />);
    const helperText = screen.getByText('Enter your email address');
    expect(helperText).toBeInTheDocument();
    expect(helperText).toHaveClass('text-neutral-500');
    expect(helperText).toHaveAttribute('id', 'test-input-description');
  });

  test('renders with left icon', () => {
    const leftIcon = <span data-testid="left-icon">🔍</span>;
    render(<Input leftIcon={leftIcon} />);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('pl-10');
  });

  test('renders with right icon', () => {
    const rightIcon = <span data-testid="right-icon">✓</span>;
    render(<Input rightIcon={rightIcon} />);
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('pr-10');
  });

  test('renders with success state', () => {
    render(<Input isSuccess />);
    const successIcon = screen.getByRole('textbox').parentElement?.querySelector('svg');
    expect(successIcon).toBeInTheDocument();
  });

  test('renders with full width', () => {
    render(<Input fullWidth />);
    const container = screen.getByRole('textbox').closest('div');
    expect(container?.parentElement).toHaveClass('w-full');
  });

  test('handles focus and blur events', () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    
    render(<Input onFocus={handleFocus} onBlur={handleBlur} />);
    const input = screen.getByRole('textbox');
    
    fireEvent.focus(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    fireEvent.blur(input);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  test('handles value changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  test('renders in disabled state', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input.closest('div')?.parentElement).toHaveClass('opacity-70');
  });
});