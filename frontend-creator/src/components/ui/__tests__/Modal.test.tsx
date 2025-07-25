import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../__tests__/utils/test-utils';
import { Modal } from '../Modal';

describe('Modal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when overlay is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    // Click on the overlay (backdrop) - simulate clicking outside the modal content
    const overlay = screen.getByRole('dialog').parentElement!;
    await user.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onClose when modal content is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    // Click on the modal content
    const modalContent = screen.getByText('Modal content');
    await user.click(modalContent);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should call onClose when Escape key is pressed', async () => {
    const user = userEvent.setup();
    
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    await user.keyboard('{Escape}');

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should render with custom size', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal" size="lg">
        <p>Modal content</p>
      </Modal>
    );

    const modalDialog = screen.getByRole('dialog');
    expect(modalDialog).toHaveClass('max-w-lg');
  });

  it('should render with default styling', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    const modalDialog = screen.getByRole('dialog');
    expect(modalDialog).toHaveClass('bg-white', 'rounded-component');
  });

  it('should render footer when provided', () => {
    const footer = (
      <div>
        <button>Cancel</button>
        <button>Save</button>
      </div>
    );

    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal" footer={footer}>
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('should not render footer when not provided', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    // Footer should not be present
    const modalContent = screen.getByRole('dialog');
    expect(modalContent.querySelector('[data-testid="modal-footer"]')).not.toBeInTheDocument();
  });

  it('should trap focus within modal', async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <button>Outside button</button>
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          <button>Inside button 1</button>
          <button>Inside button 2</button>
        </Modal>
      </div>
    );

    // Focus should be trapped within the modal
    const insideButton1 = screen.getByRole('button', { name: /inside button 1/i });
    const insideButton2 = screen.getByRole('button', { name: /inside button 2/i });
    const closeButton = screen.getByRole('button', { name: /close/i });

    // Tab through modal elements
    await user.tab();
    expect(closeButton).toHaveFocus();

    await user.tab();
    expect(insideButton1).toHaveFocus();

    await user.tab();
    expect(insideButton2).toHaveFocus();

    // Should cycle back to close button
    await user.tab();
    expect(closeButton).toHaveFocus();
  });

  it('should prevent body scroll when modal is open', () => {
    const { rerender } = render(
      <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    // Body should not have overflow hidden initially
    expect(document.body.style.overflow).not.toBe('hidden');

    // Open modal
    rerender(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    // Body should have overflow hidden when modal is open
    expect(document.body.style.overflow).toBe('hidden');

    // Close modal
    rerender(
      <Modal isOpen={false} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    // Body overflow should be restored
    expect(document.body.style.overflow).toBe('');
  });

  it('should handle multiple modals correctly', () => {
    render(
      <div>
        <Modal isOpen={true} onClose={mockOnClose} title="First Modal">
          <p>First modal content</p>
        </Modal>
        <Modal isOpen={true} onClose={jest.fn()} title="Second Modal">
          <p>Second modal content</p>
        </Modal>
      </div>
    );

    expect(screen.getByText('First Modal')).toBeInTheDocument();
    expect(screen.getByText('Second Modal')).toBeInTheDocument();
    expect(screen.getByText('First modal content')).toBeInTheDocument();
    expect(screen.getByText('Second modal content')).toBeInTheDocument();
  });

  it('should render modal content correctly', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );

    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('should disable close actions when closeOnOverlayClick is false', async () => {
    const user = userEvent.setup();
    
    render(
      <Modal 
        isOpen={true} 
        onClose={mockOnClose} 
        title="Test Modal" 
        closeOnOverlayClick={false}
      >
        <p>Modal content</p>
      </Modal>
    );

    // Click on overlay should not close modal
    const overlay = screen.getByRole('dialog').parentElement!;
    await user.click(overlay);

    expect(mockOnClose).not.toHaveBeenCalled();

    // Escape key should still work
    await user.keyboard('{Escape}');
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should disable close actions when closeOnEsc is false', async () => {
    const user = userEvent.setup();
    
    render(
      <Modal 
        isOpen={true} 
        onClose={mockOnClose} 
        title="Test Modal" 
        closeOnEsc={false}
      >
        <p>Modal content</p>
      </Modal>
    );

    // Escape key should not close modal
    await user.keyboard('{Escape}');
    expect(mockOnClose).not.toHaveBeenCalled();

    // Close button should still work
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});