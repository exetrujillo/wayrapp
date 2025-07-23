/**
 * Unit tests for Input component
 * Tests all props, states, validation, and accessibility features
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../Input';

describe('Input Component', () => {
  it('renders with default props', () => {
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('input');
  });

  it('renders with label', () => {
    render(<Input label="Email Address" id="email" />);
    
    const label = screen.getByLabelText('Email Address');
    expect(label).toBeInTheDocument();
    expect(screen.getByText('Email Address')).toBeInTheDocument();
  });

  it('shows required indicator when isRequired is true', () => {
    render(<Input label="Required Field" isRequired />);
    
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByText('*')).toHaveClass('text-error');
  });

  it('displays error message and applies error styling', () => {
    render(<Input label="Email" error="Invalid email address" id="email" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-error', 'focus:border-error');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    
    const errorMessage = screen.getByText('Invalid email address');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass('text-error');
    expect(errorMessage).toHaveAttribute('id', 'email-description');
  });

  it('displays helper text', () => {
    render(<Input helperText="Enter your email address" id="email" />);
    
    const helperText = screen.getByText('Enter your email address');
    expect(helperText).toBeInTheDocument();
    expect(helperText).toHaveClass('text-neutral-500');
    expect(helperText).toHaveAttribute('id', 'email-description');
  });

  it('shows success state with checkmark icon', () => {
    render(<Input isSuccess />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-success', 'focus:border-success');
    
    // Check for success checkmark icon
    const successIcon = input.parentElement?.querySelector('.text-success svg');
    expect(successIcon).toBeInTheDocument();
  });

  it('renders with left icon', () => {
    const leftIcon = <span data-testid="left-icon">@</span>;
    render(<Input leftIcon={leftIcon} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('pl-10');
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
  });

  it('renders with right icon', () => {
    const rightIcon = <span data-testid="right-icon">👁</span>;
    render(<Input rightIcon={rightIcon} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('pr-10');
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('handles interactive right icon', () => {
    const rightIcon = <button data-testid="toggle-visibility">👁</button>;
    render(<Input rightIcon={rightIcon} interactiveRightIcon />);
    
    const iconContainer = screen.getByTestId('toggle-visibility').parentElement;
    expect(iconContainer).toHaveClass('cursor-pointer');
    expect(iconContainer).not.toHaveClass('pointer-events-none');
  });

  it('applies full width styling', () => {
    render(<Input fullWidth />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('w-full');
    
    const container = input.closest('.mb-4');
    expect(container).toHaveClass('w-full');
  });

  it('handles disabled state', () => {
    render(<Input disabled />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    
    const container = input.closest('.mb-4');
    expect(container).toHaveClass('opacity-70');
  });

  it('handles focus and blur events', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    
    render(<Input onFocus={onFocus} onBlur={onBlur} />);
    
    const input = screen.getByRole('textbox');
    
    fireEvent.focus(input);
    expect(onFocus).toHaveBeenCalledTimes(1);
    
    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('handles value changes', () => {
    const onChange = jest.fn();
    render(<Input onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('test value');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('applies custom className', () => {
    render(<Input className="custom-input" />);
    
    expect(screen.getByRole('textbox')).toHaveClass('custom-input');
  });

  it('forwards HTML input attributes', () => {
    render(
      <Input
        type="email"
        placeholder="Enter email"
        maxLength={50}
        data-testid="email-input"
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('placeholder', 'Enter email');
    expect(input).toHaveAttribute('maxLength', '50');
    expect(input).toHaveAttribute('data-testid', 'email-input');
  });

  it('has proper accessibility attributes', () => {
    render(<Input label="Email" error="Invalid email" id="email" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'email-description');
  });

  it('associates label with input correctly', () => {
    render(<Input label="Email Address" id="email" />);
    
    const label = screen.getByText('Email Address');
    const input = screen.getByRole('textbox');
    
    expect(label).toHaveAttribute('for', 'email');
    expect(input).toHaveAttribute('id', 'email');
  });

  it('prioritizes error message over helper text', () => {
    render(
      <Input
        helperText="This is helper text"
        error="This is an error"
        id="test"
      />
    );
    
    expect(screen.getByText('This is an error')).toBeInTheDocument();
    expect(screen.queryByText('This is helper text')).not.toBeInTheDocument();
  });

  it('does not show success icon when right icon is provided', () => {
    const rightIcon = <span data-testid="custom-icon">🔍</span>;
    render(<Input isSuccess rightIcon={rightIcon} />);
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    
    // Success checkmark should not be present
    const input = screen.getByRole('textbox');
    const successIcon = input.parentElement?.querySelector('.text-success svg');
    expect(successIcon).not.toBeInTheDocument();
  });
});