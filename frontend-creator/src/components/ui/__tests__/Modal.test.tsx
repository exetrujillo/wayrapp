import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Modal, { ConfirmModal } from '../Modal';

// Mock createPortal to make testing easier
jest.mock('react-dom', () => {
  const original = jest.requireActual('react-dom');
  return {
    ...original,
    createPortal: (node: React.ReactNode) => node,
  };
});

describe('Modal Component', () => {
  test('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        Modal Content
      </Modal>
    );
    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });

  test('renders when open', () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        Modal Content
      </Modal>
    );
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  test('renders with title', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Modal Title">
        Modal Content
      </Modal>
    );
    expect(screen.getByText('Modal Title')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'modal-title');
  });

  test('renders with footer', () => {
    const footer = <button>Save</button>;
    render(
      <Modal isOpen={true} onClose={() => {}} footer={footer}>
        Modal Content
      </Modal>
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        Modal Content
      </Modal>
    );
    fireEvent.click(screen.getByLabelText('Close modal'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when Escape key is pressed', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        Modal Content
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('does not call onClose when Escape key is pressed and closeOnEsc is false', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} closeOnEsc={false}>
        Modal Content
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).not.toHaveBeenCalled();
  });

  test('calls onClose when clicking outside the modal', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        Modal Content
      </Modal>
    );
    // Click on the overlay (outside the modal content)
    fireEvent.mouseDown(document.querySelector('.fixed.inset-0')!);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('does not call onClose when clicking outside and closeOnOverlayClick is false', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} closeOnOverlayClick={false}>
        Modal Content
      </Modal>
    );
    fireEvent.mouseDown(document.querySelector('.fixed.inset-0')!);
    expect(handleClose).not.toHaveBeenCalled();
  });

  test('renders with different sizes', () => {
    const { rerender } = render(
      <Modal isOpen={true} onClose={() => {}} size="sm">
        Small Modal
      </Modal>
    );
    expect(screen.getByRole('dialog')).toHaveClass('max-w-sm');

    rerender(
      <Modal isOpen={true} onClose={() => {}} size="lg">
        Large Modal
      </Modal>
    );
    expect(screen.getByRole('dialog')).toHaveClass('max-w-lg');
  });
});

describe('ConfirmModal Component', () => {
  test('renders with title and message', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Confirm Action"
        message="Are you sure you want to proceed?"
      />
    );
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  test('renders with custom button text', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Confirm Action"
        message="Are you sure you want to proceed?"
        confirmText="Yes, do it"
        cancelText="No, cancel"
      />
    );
    expect(screen.getByRole('button', { name: 'Yes, do it' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No, cancel' })).toBeInTheDocument();
  });

  test('calls onConfirm when confirm button is clicked', () => {
    const handleConfirm = jest.fn();
    render(
      <ConfirmModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={handleConfirm}
        title="Confirm Action"
        message="Are you sure you want to proceed?"
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when cancel button is clicked', () => {
    const handleClose = jest.fn();
    render(
      <ConfirmModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={() => {}}
        title="Confirm Action"
        message="Are you sure you want to proceed?"
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('renders with loading state', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Confirm Action"
        message="Are you sure you want to proceed?"
        isLoading={true}
      />
    );
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    
    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(confirmButton.querySelector('svg')).toBeInTheDocument();
  });
});