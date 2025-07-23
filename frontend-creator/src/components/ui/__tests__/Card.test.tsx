/**
 * Unit tests for Card component
 * Tests all variants, padding options, and interactive features
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from '../Card';

describe('Card Component', () => {
  it('renders with default props', () => {
    render(<Card>Card content</Card>);
    
    const card = screen.getByText('Card content').closest('div');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('card', 'rounded-component', 'bg-white', 'shadow-md', 'p-6');
  });

  it('renders different variants correctly', () => {
    const { rerender } = render(<Card variant="default">Default</Card>);
    let card = screen.getByText('Default').closest('div');
    expect(card).toHaveClass('bg-white', 'shadow-md');

    rerender(<Card variant="outlined">Outlined</Card>);
    card = screen.getByText('Outlined').closest('div');
    expect(card).toHaveClass('bg-white', 'border', 'border-neutral-200');

    rerender(<Card variant="elevated">Elevated</Card>);
    card = screen.getByText('Elevated').closest('div');
    expect(card).toHaveClass('bg-white', 'shadow-lg');
  });

  it('applies different padding options correctly', () => {
    const { rerender } = render(<Card padding="none">No padding</Card>);
    let card = screen.getByText('No padding').closest('div');
    expect(card).not.toHaveClass('p-3', 'p-6', 'p-8');

    rerender(<Card padding="sm">Small padding</Card>);
    card = screen.getByText('Small padding').closest('div');
    expect(card?.querySelector('div')).toHaveClass('p-3');

    rerender(<Card padding="md">Medium padding</Card>);
    card = screen.getByText('Medium padding').closest('div');
    expect(card?.querySelector('div')).toHaveClass('p-6');

    rerender(<Card padding="lg">Large padding</Card>);
    card = screen.getByText('Large padding').closest('div');
    expect(card?.querySelector('div')).toHaveClass('p-8');
  });

  it('renders with title only', () => {
    render(<Card title="Card Title">Content</Card>);
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Title')).toHaveClass('text-lg', 'font-medium', 'text-neutral-900');
    
    // Check for header border
    const header = screen.getByText('Card Title').closest('div');
    expect(header).toHaveClass('border-b', 'border-neutral-100');
  });

  it('renders with title and subtitle', () => {
    render(
      <Card title="Card Title" subtitle="Card subtitle">
        Content
      </Card>
    );
    
    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card subtitle')).toBeInTheDocument();
    expect(screen.getByText('Card subtitle')).toHaveClass('text-sm', 'text-neutral-500');
  });

  it('renders with header action', () => {
    const headerAction = <button data-testid="header-action">Action</button>;
    
    render(
      <Card title="Card Title" headerAction={headerAction}>
        Content
      </Card>
    );
    
    expect(screen.getByTestId('header-action')).toBeInTheDocument();
    
    // Check that header has flex layout for title and action
    const header = screen.getByText('Card Title').closest('div');
    expect(header).toHaveClass('flex', 'justify-between', 'items-center');
  });

  it('renders with footer', () => {
    const footer = <div data-testid="card-footer">Footer content</div>;
    
    render(<Card footer={footer}>Content</Card>);
    
    expect(screen.getByTestId('card-footer')).toBeInTheDocument();
    
    // Check for footer border
    const footerContainer = screen.getByTestId('card-footer').closest('div');
    expect(footerContainer).toHaveClass('border-t', 'border-neutral-100');
  });

  it('handles click events when onClick is provided', () => {
    const handleClick = jest.fn();
    render(<Card onClick={handleClick}>Clickable card</Card>);
    
    const card = screen.getByText('Clickable card').closest('div');
    expect(card).toHaveClass('cursor-pointer', 'hover:shadow-lg', 'transition-shadow');
    expect(card).toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('tabIndex', '0');
    
    fireEvent.click(card!);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not add interactive styles when onClick is not provided', () => {
    render(<Card>Non-clickable card</Card>);
    
    const card = screen.getByText('Non-clickable card').closest('div');
    expect(card).not.toHaveClass('cursor-pointer', 'hover:shadow-lg');
    expect(card).not.toHaveAttribute('role', 'button');
    expect(card).not.toHaveAttribute('tabIndex');
  });

  it('applies custom className', () => {
    render(<Card className="custom-card">Content</Card>);
    
    const card = screen.getByText('Content').closest('div');
    expect(card).toHaveClass('custom-card');
  });

  it('renders complex content structure correctly', () => {
    const headerAction = <button>Edit</button>;
    const footer = <div>Footer actions</div>;
    
    render(
      <Card
        title="Complex Card"
        subtitle="With all features"
        headerAction={headerAction}
        footer={footer}
        padding="lg"
      >
        <p>Main content goes here</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      </Card>
    );
    
    // Check all parts are rendered
    expect(screen.getByText('Complex Card')).toBeInTheDocument();
    expect(screen.getByText('With all features')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Main content goes here')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Footer actions')).toBeInTheDocument();
  });

  it('maintains proper structure without header or footer', () => {
    render(<Card>Just content</Card>);
    
    const card = screen.getByText('Just content').closest('div');
    
    // Should not have header or footer borders
    expect(card?.querySelector('.border-b')).not.toBeInTheDocument();
    expect(card?.querySelector('.border-t')).not.toBeInTheDocument();
  });

  it('handles keyboard interaction when clickable', () => {
    const handleClick = jest.fn();
    render(<Card onClick={handleClick}>Keyboard accessible</Card>);
    
    const card = screen.getByText('Keyboard accessible').closest('div');
    
    // Should be focusable
    expect(card).toHaveAttribute('tabIndex', '0');
    
    // Focus the card
    card?.focus();
    expect(document.activeElement).toBe(card);
  });

  it('applies correct padding to header and footer', () => {
    const footer = <div data-testid="footer">Footer</div>;
    
    render(
      <Card title="Title" footer={footer} padding="sm">
        Content
      </Card>
    );
    
    // Header should have same padding as specified
    const header = screen.getByText('Title').closest('div');
    expect(header).toHaveClass('p-3');
    
    // Footer should have same padding as specified
    const footerContainer = screen.getByTestId('footer').closest('div');
    expect(footerContainer).toHaveClass('p-3');
  });
});