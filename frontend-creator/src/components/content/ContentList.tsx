import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
// Drag and drop imports are handled by individual draggable components
import { DroppableContainer } from './DroppableContainer';
import { DraggableItem } from './DraggableItem';
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { LoadingSpinner, ListSkeleton } from "../ui";
import { ErrorDisplay } from "../error";
import { PaginatedResponse, PaginationParams } from "../../utils/types";

interface ContentListProps<T> {
  title?: string;
  data: T[]; // Changed from items to data for consistency
  isLoading: boolean;
  error: any; // Changed from string | null to any for better error handling
  pagination: PaginatedResponse<T>["meta"] | null;
  onRefresh?: (params?: PaginationParams) => void;
  onSearch: (query: string) => void;
  onPageChange: (page: number) => void;
  onItemSelect?: (item: T) => void;
  onBulkAction?: (action: string, items: T[]) => void;
  renderItem: (
    item: T,
    isSelected: boolean,
    onSelect: (item: T) => void,
    dragHandleProps?: any
  ) => React.ReactNode;
  createButton?: {
    label: string;
    onClick: () => void;
  };
  bulkActions?: Array<{
    id: string;
    label: string;
    variant?: "primary" | "secondary" | "outline" | "text";
    requiresConfirmation?: boolean;
  }>;
  searchPlaceholder?: string;
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  // New props for enhanced error handling
  retryCount?: number;
  maxRetries?: number;
  showSkeletonOnLoad?: boolean;
  skeletonCount?: number;
  // New props for drag-and-drop support
  enableDragDrop?: boolean;
  onDragEnd?: (startIndex: number, endIndex: number) => void;
  dragDisabled?: boolean;
}

export function ContentList<T extends { id: string }>({
  title,
  data,
  isLoading,
  error,
  pagination,
  onRefresh,
  onSearch,
  onPageChange,
  onItemSelect,
  onBulkAction,
  renderItem,
  createButton,
  bulkActions = [],
  searchPlaceholder,
  emptyMessage,
  emptyAction,
  retryCount = 0,
  maxRetries = 3,
  showSkeletonOnLoad = true,
  skeletonCount = 3,
  enableDragDrop = false,
  onDragEnd,
  dragDisabled = false,
}: ContentListProps<T>) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchDebounceTimer, setSearchDebounceTimer] =
    useState<number | null>(null);

  // Debounced search
  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);

      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer as unknown as NodeJS.Timeout);
      }

      const timer = setTimeout(() => {
        onSearch(query);
      }, 300);

      setSearchDebounceTimer(timer as unknown as number);
    },
    [onSearch, searchDebounceTimer]
  );

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer as unknown as NodeJS.Timeout);
      }
    };
  }, [searchDebounceTimer]);

  // Handle item selection
  const handleItemSelect = (item: T) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(item.id)) {
      newSelected.delete(item.id);
    } else {
      newSelected.add(item.id);
    }
    setSelectedItems(newSelected);
    onItemSelect?.(item);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedItems.size === data.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(data.map(item => item.id)));
    }
  };

  // Handle bulk action
  const handleBulkAction = async (actionId: string) => {
    const action = bulkActions.find(a => a.id === actionId);
    if (!action || selectedItems.size === 0) return;

    if (action.requiresConfirmation) {
      const confirmed = window.confirm(
        t('creator.components.contentList.bulkActionConfirm', {
          action: action.label,
          count: selectedItems.size,
          defaultValue: `Are you sure you want to ${action.label.toLowerCase()} {{count}} items?`
        })
      );
      if (!confirmed) return;
    }

    const selectedItemObjects = data.filter(item =>
      selectedItems.has(item.id)
    );
    onBulkAction?.(actionId, selectedItemObjects);
    setSelectedItems(new Set());
  };

  // Generate pagination buttons
  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const pages = [];
    const currentPage = pagination.page;
    const totalPages = pagination.totalPages;

    // Always show first page
    if (currentPage > 3) {
      pages.push(1);
      if (currentPage > 4) pages.push('...');
    }

    // Show pages around current page
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
      pages.push(i);
    }

    // Always show last page
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) pages.push('...');
      pages.push(totalPages);
    }

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-neutral-500">
          {t('creator.components.contentList.showing', {
            start: (currentPage - 1) * pagination.limit + 1,
            end: Math.min(currentPage * pagination.limit, pagination.total),
            total: pagination.total,
            defaultValue: 'Showing {{start}} to {{end}} of {{total}} results'
          })}
        </div>
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            {t('common.buttons.previous', 'Previous')}
          </Button>
          {pages.map((page, index) => (
            <Button
              key={index}
              variant={page === currentPage ? 'primary' : 'outline'}
              size="sm"
              disabled={page === '...'}
              onClick={() => typeof page === 'number' ? onPageChange(page) : undefined}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            {t('common.buttons.next', 'Next')}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="content-list">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
        {createButton && (
          <Button onClick={createButton.onClick}>
            {createButton.label}
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder={searchPlaceholder || t('creator.components.contentList.searchPlaceholder', 'Search...')}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            leftIcon={
              <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
        <Button
          variant="outline"
          onClick={() => onRefresh?.()}
          leftIcon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        >
          {t('common.buttons.refresh', 'Refresh')}
        </Button>
      </div>

      {/* Bulk Actions */}
      {bulkActions.length > 0 && selectedItems.size > 0 && (
        <div className="mb-4 p-4 bg-primary-50 rounded-component border border-primary-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-primary-700">
              {t('creator.components.contentList.selectedCount', {
                count: selectedItems.size,
                defaultValue: '{{count}} items selected'
              })}
            </span>
            <div className="flex space-x-2">
              {bulkActions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={() => handleBulkAction(action.id)}
                >
                  {action.label}
                </Button>
              ))}
              <Button
                variant="text"
                size="sm"
                onClick={() => setSelectedItems(new Set())}
              >
                {t('common.buttons.cancel', 'Cancel')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6">
          <ErrorDisplay
            error={error}
            onRetry={() => onRefresh?.()}
            retryCount={retryCount}
            maxRetries={maxRetries}
            variant="card"
            title="Failed to load content"
            showRetryButton={true}
            showDismissButton={false}
          />
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        showSkeletonOnLoad ? (
          <ListSkeleton count={skeletonCount} />
        ) : (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-gray-600">Loading content...</span>
          </div>
        )
      ) : data.length === 0 && !error ? (
        /* Empty State */
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="text-neutral-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-neutral-500 mb-4">
            {emptyMessage || t('creator.components.contentList.noItems', 'No items found')}
          </p>
          {emptyAction && (
            <Button onClick={emptyAction.onClick}>
              {emptyAction.label}
            </Button>
          )}
        </div>
      ) : (
        /* Content List */
        <div className="space-y-4">
          {/* Select All Header */}
          {bulkActions.length > 0 && (
            <div className="flex items-center p-4 bg-neutral-50 rounded-component">
              <input
                type="checkbox"
                checked={selectedItems.size === data.length && data.length > 0}
                onChange={handleSelectAll}
                className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
              />
              <span className="text-sm text-neutral-600">
                {t('creator.components.contentList.selectAll', 'Select all')}
              </span>
            </div>
          )}

          {/* Items */}
          {enableDragDrop && onDragEnd ? (
            <DroppableContainer 
              onReorder={(startIndex, endIndex) => onDragEnd(startIndex, endIndex)}
              className="space-y-4"
            >
              {data.map((item, index) => (
                <DraggableItem
                  key={item.id}
                  item={item}
                  index={index}
                  isSelected={selectedItems.has(item.id)}
                  onSelect={handleItemSelect}
                  renderItem={renderItem}
                  isDragDisabled={dragDisabled}
                />
              ))}
            </DroppableContainer>
          ) : (
            data.map((item) => (
              <div key={item.id}>
                {renderItem(item, selectedItems.has(item.id), handleItemSelect, undefined)}
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
}

export default ContentList;