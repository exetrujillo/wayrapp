/**
 * Unit tests for Modal component
 * Tests modal behavior, accessibility, and interaction patterns
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Modal, ConfirmModal } from '../Modal';

// Mock createPortal to render in the same container
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (children: React.ReactNode) => children,
}));

describe('Modal Component', () => {
  beforeEach(() => {
    // Reset body overflow style
    document.body.style.overflow = 'unset';
  });

  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={jest.fn()}>
        Modal content
      </Modal>
    );
    
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()}>
        Modal content
      </Modal>
    );
    
    expect(screen.getByText('Modal content')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders with title', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Modal Title">
        Modal content
      </Modal>
    );
    
    expect(screen.getByText('Modal Title')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'modal-title');
  });

  it('renders with footer', () => {
    const footer = <button data-testid="footer-button">Footer Button</button>;
    
    render(
      <Modal isOpen={true} onClose={jest.fn()} footer={footer}>
        Modal content
      </Modal>
    );
    
    expect(screen.getByTestId('footer-button')).toBeInTheDocument();
  });

  it('applies different sizes correctly', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={jest.fn()} size="sm">
        Content
      </Modal>
    );
    
    let modal = screen.getByRole('dialog');
    expect(modal).toHaveClass('max-w-sm');

    rerender(
      <Modal isOpen={true} onClose={jest.fn()} size="md">
        Content
      </Modal>
    );
    modal = screen.getByRole('dialog');
    expect(modal).toHaveClass('max-w-md');

    rerender(
      <Modal isOpen={true} onClose={jest.fn()} size="lg">
        Content
      </Modal>
    );
    modal = screen.getByRole('dialog');
    expect(modal).toHaveClass('max-w-lg');

    rerender(
      <Modal isOpen={true} onClose={jest.fn()} size="xl">
        Content
      </Modal>
    );
    modal = screen.getByRole('dialog');
    expect(modal).toHaveClass('max-w-xl');
  });

  it('shows close button by default', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()}>
        Modal content
      </Modal>
    );
    
    const closeButton = screen.getByLabelText('Close modal');
    expect(closeButton).toBeInTheDocument();
  });

  it('hides close button when showCloseButton is false', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} showCloseButton={false}>
        Modal content
      </Modal>
    );
    
    expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        Modal content
      </Modal>
    );
    
    fireEvent.click(screen.getByLabelText('Close modal'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        Modal content
      </Modal>
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close on Escape when closeOnEsc is false', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={onClose} closeOnEsc={false}>
        Modal content
      </Modal>
    );
    
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when clicking outside modal', async () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        Modal content
      </Modal>
    );
    
    // Click on the backdrop (outside the modal)
    const backdrop = screen.getByRole('dialog').parentElement;
    fireEvent.mouseDown(backdrop!);
    
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('does not close when clicking inside modal', async () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={onClose}>
        Modal content
      </Modal>
    );
    
    // Click inside the modal
    fireEvent.mouseDown(screen.getByRole('dialog'));
    
    await waitFor(() => {
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it('does not close on outside click when closeOnOverlayClick is false', async () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={onClose} closeOnOverlayClick={false}>
        Modal content
      </Modal>
    );
    
    // Click on the backdrop
    const backdrop = screen.getByRole('dialog').parentElement;
    fireEvent.mouseDown(backdrop!);
    
    await waitFor(() => {
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it('sets body overflow to hidden when open', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()}>
        Modal content
      </Modal>
    );
    
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body overflow when closed', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={jest.fn()}>
        Modal content
      </Modal>
    );
    
    expect(document.body.style.overflow).toBe('hidden');
    
    rerender(
      <Modal isOpen={false} onClose={jest.fn()}>
        Modal content
      </Modal>
    );
    
    expect(document.body.style.overflow).toBe('unset');
  });

  it('has proper accessibility attributes', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()} title="Accessible Modal">
        Modal content
      </Modal>
    );
    
    const modal = screen.getByRole('dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');
  });
});

describe('ConfirmModal Component', () => {
  it('renders with default props', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        title="Confirm Action"
        message="Are you sure?"
      />
    );
    
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('renders with custom button text', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        title="Delete Item"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Keep"
      />
    );
    
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = jest.fn();
    render(
      <ConfirmModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={onConfirm}
        title="Confirm"
        message="Are you sure?"
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = jest.fn();
    render(
      <ConfirmModal
        isOpen={true}
        onClose={onClose}
        onConfirm={jest.fn()}
        title="Confirm"
        message="Are you sure?"
      />
    );
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows loading state on confirm button', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        title="Confirm"
        message="Are you sure?"
        isLoading={true}
      />
    );
    
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    expect(confirmButton).toBeDisabled();
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeDisabled();
  });

  it('applies different confirm button variants', () => {
    const { rerender } = render(
      <ConfirmModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        title="Confirm"
        message="Are you sure?"
        confirmVariant="primary"
      />
    );
    
    let confirmButton = screen.getByRole('button', { name: /confirm/i });
    expect(confirmButton).toHaveClass('btn-primary');

    rerender(
      <ConfirmModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        title="Confirm"
        message="Are you sure?"
        confirmVariant="secondary"
      />
    );
    
    confirmButton = screen.getByRole('button', { name: /confirm/i });
    expect(confirmButton).toHaveClass('btn-secondary');
  });
});