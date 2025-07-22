import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner Component', () => {
  test('renders with default props', () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
    expect(spinner.querySelector('svg')).toHaveClass('h-8 w-8');
    expect(spinner.querySelector('svg')).toHaveClass('text-primary-500');
  });

  test('renders with small size', () => {
    render(<LoadingSpinner size="sm" />);
    const spinner = screen.getByRole('status');
    expect(spinner.querySelector('svg')).toHaveClass('h-4 w-4');
  });

  test('renders with large size', () => {
    render(<LoadingSpinner size="lg" />);
    const spinner = screen.getByRole('status');
    expect(spinner.querySelector('svg')).toHaveClass('h-12 w-12');
  });

  test('renders with secondary color', () => {
    render(<LoadingSpinner color="secondary" />);
    const spinner = screen.getByRole('status');
    expect(spinner.querySelector('svg')).toHaveClass('text-secondary-200');
  });

  test('renders with white color', () => {
    render(<LoadingSpinner color="white" />);
    const spinner = screen.getByRole('status');
    expect(spinner.querySelector('svg')).toHaveClass('text-white');
  });

  test('applies custom className', () => {
    render(<LoadingSpinner className="custom-class" />);
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('custom-class');
  });
});