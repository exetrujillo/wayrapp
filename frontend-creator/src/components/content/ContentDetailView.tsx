import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { LoadingSpinner } from "../ui/LoadingSpinner";

interface ContentDetailViewProps<T> {
  title: string;
  item: T | null;
  isLoading: boolean;
  error: string | null;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onClose?: () => void;
  renderContent: (item: T) => React.ReactNode;
  renderEditForm?: (item: T, onSave: (updatedItem: T) => void, onCancel: () => void) => React.ReactNode;
  actions?: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    variant?: "primary" | "secondary" | "outline" | "text";
    onClick: (item: T) => void;
    requiresConfirmation?: boolean;
    confirmationMessage?: string;
  }>;
}

export function ContentDetailView<T extends { id: string }>({
  title,
  item,
  isLoading,
  error,
  onEdit,
  onDelete,
  onClose,
  renderContent,
  renderEditForm,
  actions = [],
}: ContentDetailViewProps<T>) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEdit = () => {
    if (renderEditForm) {
      setIsEditing(true);
    } else if (onEdit && item) {
      onEdit(item);
    }
  };

  const handleSave = (_updatedItem: T) => {
    setIsEditing(false);
    // The parent component should handle the actual save logic
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (item && onDelete) {
      onDelete(item);
      setShowDeleteConfirm(false);
    }
  };

  const handleActionClick = (action: typeof actions[0]) => {
    if (!item) return;

    if (action.requiresConfirmation) {
      const message = action.confirmationMessage || 
        t('creator.components.contentDetailView.actionConfirm', {
          action: action.label,
          defaultValue: 'Are you sure you want to {{action}}?'
        });
      
      if (window.confirm(message)) {
        action.onClick(item);
      }
    } else {
      action.onClick(item);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-12">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          {t('creator.components.contentDetailView.errorTitle', 'Error Loading Content')}
        </h3>
        <p className="text-neutral-600 mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t('common.buttons.retry', 'Retry')}
        </Button>
      </Card>
    );
  }

  if (!item) {
    return (
      <Card className="text-center py-12">
        <div className="text-neutral-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          {t('creator.components.contentDetailView.notFound', 'Content Not Found')}
        </h3>
        <p className="text-neutral-600">
          {t('creator.components.contentDetailView.notFoundMessage', 'The requested content could not be found.')}
        </p>
      </Card>
    );
  }

  return (
    <div className="content-detail-view">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {onClose && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              }
            >
              {t('common.buttons.back', 'Back')}
            </Button>
          )}
          <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
        </div>

        <div className="flex items-center space-x-2">
          {/* Custom Actions */}
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || 'outline'}
              size="sm"
              onClick={() => handleActionClick(action)}
              leftIcon={action.icon}
            >
              {action.label}
            </Button>
          ))}

          {/* Edit Button */}
          {(onEdit || renderEditForm) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              }
            >
              {t('common.buttons.edit', 'Edit')}
            </Button>
          )}

          {/* Delete Button */}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-error border-error hover:bg-error hover:text-white"
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              }
            >
              {t('common.buttons.delete', 'Delete')}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <Card>
        {isEditing && renderEditForm ? (
          renderEditForm(item, handleSave, handleCancelEdit)
        ) : (
          renderContent(item)
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title={t('creator.components.contentDetailView.deleteConfirmTitle', 'Confirm Delete')}
        >
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              {t('creator.components.contentDetailView.deleteConfirmTitle', 'Confirm Delete')}
            </h3>
            <p className="text-neutral-600 mb-6">
              {t('creator.components.contentDetailView.deleteConfirmMessage', 'This action cannot be undone. Are you sure you want to delete this item?')}
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {t('common.buttons.cancel', 'Cancel')}
              </Button>
              <Button
                variant="primary"
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 border-red-600"
              >
                {t('common.buttons.delete', 'Delete')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ContentDetailView;