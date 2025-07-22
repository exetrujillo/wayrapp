import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Card from '../Card';

describe('Card Component', () => {
  test('renders with default props', () => {
    render(<Card>Card Content</Card>);
    const card = screen.getByText('Card Content');
    expect(card.parentElement).toHaveClass('card');
    expect(card.parentElement).toHaveClass('bg-white');
    expect(card.parentElement).toHaveClass('shadow-md');
    expect(card.parentElement).toHaveClass('rounded-component');
  });

  test('renders with different padding sizes', () => {
    const { rerender } = render(<Card padding="sm">Small Padding</Card>);
    let content = screen.getByText('Small Padding');
    expect(content).toHaveClass('p-3');

    rerender(<Card padding="lg">Large Padding</Card>);
    content = screen.getByText('Large Padding');
    expect(content).toHaveClass('p-8');

    rerender(<Card padding="none">No Padding</Card>);
    content = screen.getByText('No Padding');
    expect(content).not.toHaveClass('p-3');
    expect(content).not.toHaveClass('p-6');
    expect(content).not.toHaveClass('p-8');
  });

  test('renders with different variants', () => {
    const { rerender } = render(<Card variant="outlined">Outlined Card</Card>);
    let card = screen.getByText('Outlined Card').parentElement;
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('border-neutral-200');

    rerender(<Card variant="elevated">Elevated Card</Card>);
    card = screen.getByText('Elevated Card').parentElement;
    expect(card).toHaveClass('shadow-lg');
  });

  test('renders with title and subtitle', () => {
    render(<Card title="Card Title" subtitle="Card Subtitle">Card Content</Card>);
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  test('renders with header action', () => {
    const headerAction = <button>Action</button>;
    render(<Card title="Card Title" headerAction={headerAction}>Card Content</Card>);
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  test('renders with footer', () => {
    const footer = <div>Footer Content</div>;
    render(<Card footer={footer}>Card Content</Card>);
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
    expect(screen.getByText('Footer Content').parentElement).toHaveClass('border-t');
  });

  test('handles onClick event', () => {
    const handleClick = jest.fn();
    render(<Card onClick={handleClick}>Clickable Card</Card>);
    const card = screen.getByText('Clickable Card').parentElement;
    expect(card).toHaveClass('cursor-pointer');
    expect(card).toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('tabIndex', '0');
    
    fireEvent.click(card!);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies custom className', () => {
    render(<Card className="custom-class">Custom Card</Card>);
    const card = screen.getByText('Custom Card').parentElement;
    expect(card).toHaveClass('custom-class');
  });
});