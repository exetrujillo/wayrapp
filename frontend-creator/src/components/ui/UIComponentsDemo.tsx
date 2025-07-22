import React, { useState } from 'react';
import { Button, Card, Input, Modal, LoadingSpinner, Feedback, Toast } from './index';

export const UIComponentsDemo: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  const handleShowToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    setToastType(type);
    setShowToast(true);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1>UI Components Demo</h1>
      
      <section className="mb-8">
        <h2>Buttons</h2>
        <div className="flex flex-wrap gap-4 mb-4">
          <Button>Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="text">Text Button</Button>
        </div>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <Button size="sm">Small Button</Button>
          <Button>Medium Button</Button>
          <Button size="lg">Large Button</Button>
        </div>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <Button isLoading>Loading Button</Button>
          <Button disabled>Disabled Button</Button>
          <Button fullWidth>Full Width Button</Button>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <Button leftIcon={<span>👈</span>}>Left Icon</Button>
          <Button rightIcon={<span>👉</span>}>Right Icon</Button>
        </div>
      </section>
      
      <section className="mb-8">
        <h2>Inputs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Default Input" placeholder="Enter text" />
          <Input 
            label="Required Input" 
            placeholder="Required field" 
            isRequired 
          />
          <Input 
            label="With Helper Text" 
            placeholder="Enter email" 
            helperText="We'll never share your email" 
          />
          <Input 
            label="With Error" 
            placeholder="Enter password" 
            error="Password must be at least 8 characters" 
            value="pass" 
          />
          <Input 
            label="Success State" 
            placeholder="Valid input" 
            isSuccess 
            value="valid@example.com" 
          />
          <Input 
            label="With Left Icon" 
            placeholder="Search..." 
            leftIcon={<span>🔍</span>} 
          />
          <Input 
            label="With Right Icon" 
            placeholder="Password" 
            type="password" 
            rightIcon={<span>👁️</span>} 
            interactiveRightIcon 
          />
          <Input 
            label="Disabled Input" 
            placeholder="Cannot edit" 
            disabled 
            value="Disabled value" 
          />
        </div>
      </section>
      
      <section className="mb-8">
        <h2>Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <p>Default Card</p>
            <p className="text-neutral-500 mt-2">This is a simple card with default styling.</p>
          </Card>
          
          <Card variant="outlined">
            <p>Outlined Card</p>
            <p className="text-neutral-500 mt-2">This card has an outline instead of a shadow.</p>
          </Card>
          
          <Card 
            title="Card with Title" 
            subtitle="This is a subtitle"
          >
            <p className="text-neutral-500">Card content goes here.</p>
          </Card>
          
          <Card 
            title="Card with Actions" 
            headerAction={<Button size="sm">Action</Button>}
            footer={
              <div className="flex justify-end">
                <Button variant="secondary" size="sm">Cancel</Button>
                <Button size="sm" className="ml-2">Save</Button>
              </div>
            }
          >
            <p className="text-neutral-500">This card has a header action and footer buttons.</p>
          </Card>
          
          <Card 
            variant="elevated" 
            onClick={() => alert('Card clicked!')}
          >
            <p>Clickable Card</p>
            <p className="text-neutral-500 mt-2">Click me to trigger an action.</p>
          </Card>
          
          <Card padding="lg">
            <p>Card with Large Padding</p>
            <p className="text-neutral-500 mt-2">This card has extra padding around its content.</p>
          </Card>
        </div>
      </section>
      
      <section className="mb-8">
        <h2>Modals</h2>
        <div className="flex gap-4">
          <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
          <Button onClick={() => setIsConfirmModalOpen(true)} variant="secondary">Open Confirm Modal</Button>
        </div>
        
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Example Modal"
          footer={
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button className="ml-2" onClick={() => setIsModalOpen(false)}>Save</Button>
            </div>
          }
        >
          <p className="mb-4">This is an example modal dialog.</p>
          <p>You can put any content here, including forms, tables, or other components.</p>
        </Modal>
        
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title="Confirm Action"
          size="sm"
          footer={
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setIsConfirmModalOpen(false)}>Cancel</Button>
              <Button 
                variant="primary" 
                className="ml-2" 
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  handleShowToast('success');
                }}
              >
                Confirm
              </Button>
            </div>
          }
        >
          <p>Are you sure you want to perform this action?</p>
        </Modal>
      </section>
      
      <section className="mb-8">
        <h2>Loading Spinners</h2>
        <div className="flex items-center gap-8">
          <div>
            <p className="mb-2">Small</p>
            <LoadingSpinner size="sm" />
          </div>
          <div>
            <p className="mb-2">Medium</p>
            <LoadingSpinner />
          </div>
          <div>
            <p className="mb-2">Large</p>
            <LoadingSpinner size="lg" />
          </div>
          <div className="bg-primary-500 p-4 rounded-component">
            <p className="mb-2 text-white">White</p>
            <LoadingSpinner color="white" />
          </div>
        </div>
      </section>
      
      <section className="mb-8">
        <h2>Feedback Messages</h2>
        <div className="space-y-4">
          <Feedback type="success" message="Operation completed successfully!" />
          <Feedback type="error" message="An error occurred. Please try again." />
          <Feedback type="warning" message="This action cannot be undone." />
          <Feedback type="info" message="Your session will expire in 5 minutes." />
          <Feedback 
            type="success" 
            message="Dismissible message" 
            onDismiss={() => alert('Message dismissed')} 
          />
        </div>
        
        <div className="mt-6">
          <h3 className="mb-3">Toast Messages</h3>
          <div className="flex gap-3">
            <Button onClick={() => handleShowToast('success')}>Success Toast</Button>
            <Button onClick={() => handleShowToast('error')}>Error Toast</Button>
            <Button onClick={() => handleShowToast('warning')}>Warning Toast</Button>
            <Button onClick={() => handleShowToast('info')}>Info Toast</Button>
          </div>
        </div>
      </section>
      
      {showToast && (
        <Toast
          type={toastType}
          message={`This is a ${toastType} toast message!`}
          onDismiss={() => setShowToast(false)}
          duration={5000}
        />
      )}
    </div>
  );
};

export default UIComponentsDemo;