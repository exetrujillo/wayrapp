import React, { useState, useCallback } from 'react';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';
import { ContentList, ExerciseCard } from '../components/content';
import { Modal } from '../components/ui/Modal';
import { DynamicExerciseForm } from '../components/forms';
import { useTranslation } from 'react-i18next';
import { 
  useExercisesQuery, 
  useDeleteExerciseMutation
} from '../hooks/useExercises';
import { Exercise, PaginationParams } from '../utils/types';

const ExercisesPage: React.FC = () => {
  const { t } = useTranslation();

  const pageTitle = t('common.navigation.exercises');
  
  const [currentParams, setCurrentParams] = useState<PaginationParams>({
    page: 1,
    limit: 12,
    search: '',
  });
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Use TanStack Query hooks
  const { 
    data: exercisesResponse, 
    isLoading, 
    error, 
    refetch 
  } = useExercisesQuery(currentParams);

  const deleteExerciseMutation = useDeleteExerciseMutation();

  const exercises = exercisesResponse?.data || [];
  const pagination = exercisesResponse?.meta || null;

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setCurrentParams(prev => ({ ...prev, search: query, page: 1 }));
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentParams(prev => ({ ...prev, page }));
  }, []);

  // Handle exercise actions
  const handleViewExercise = (exercise: Exercise) => {
    setPreviewExercise(exercise);
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise);
  };

  const handleDeleteExercise = async (exercise: Exercise) => {
    if (window.confirm(t('creator.exercises.deleteConfirm', 'Are you sure you want to delete this exercise?'))) {
      try {
        await deleteExerciseMutation.mutateAsync(exercise.id);
      } catch (error) {
        console.error('Failed to delete exercise:', error);
      }
    }
  };

  const handlePreviewExercise = (exercise: Exercise) => {
    setPreviewExercise(exercise);
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string, selectedExercises: Exercise[]) => {
    if (action === 'delete') {
      if (window.confirm(t('creator.exercises.bulkDeleteConfirm', `Are you sure you want to delete ${selectedExercises.length} exercises?`))) {
        try {
          await Promise.all(selectedExercises.map(exercise => 
            deleteExerciseMutation.mutateAsync(exercise.id)
          ));
        } catch (error) {
          console.error('Failed to delete exercises:', error);
        }
      }
    }
  };

  // Handle form success
  const handleFormSuccess = () => {
    setCreateModalOpen(false);
    setEditingExercise(null);
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setCreateModalOpen(false);
    setEditingExercise(null);
  };

  // Render exercise preview
  const renderExercisePreview = (exercise: Exercise) => {
    const { data } = exercise;
    
    switch (exercise.exerciseType) {
      case 'translation':
        return (
          <div>
            <h4 className="font-semibold mb-2">{t('creator.components.exerciseCard.sourceText', 'Source Text')}</h4>
            <p className="mb-4 p-3 bg-neutral-50 rounded">{data['source_text'] || data['text']}</p>
            {data['target_text'] && (
              <>
                <h4 className="font-semibold mb-2">{t('creator.components.exerciseCard.targetText', 'Target Text')}</h4>
                <p className="p-3 bg-neutral-50 rounded">{data['target_text']}</p>
              </>
            )}
          </div>
        );
      case 'vof':
        return (
          <div>
            <h4 className="font-semibold mb-2">{t('creator.components.exerciseCard.question', 'Question')}</h4>
            <p className="mb-4 p-3 bg-neutral-50 rounded">{data['question']}</p>
            <h4 className="font-semibold mb-2">{t('creator.components.exerciseCard.options', 'Options')}</h4>
            <ul className="space-y-2">
              {data['options']?.map((option: string, index: number) => (
                <li key={index} className={`p-2 rounded ${index === data['correct_answer'] ? 'bg-green-100 text-green-800' : 'bg-neutral-50'}`}>
                  {option} {index === data['correct_answer'] && '✓'}
                </li>
              ))}
            </ul>
          </div>
        );
      case 'fill-in-the-blank':
        return (
          <div>
            <h4 className="font-semibold mb-2">{t('creator.components.exerciseCard.sentence', 'Sentence')}</h4>
            <p className="mb-4 p-3 bg-neutral-50 rounded">{data['sentence'] || data['text']}</p>
            {data['correct_answers'] && (
              <>
                <h4 className="font-semibold mb-2">{t('creator.components.exerciseCard.answers', 'Correct Answers')}</h4>
                <div className="flex flex-wrap gap-2">
                  {data['correct_answers'].map((answer: string, index: number) => (
                    <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                      {answer}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      default:
        return (
          <div>
            <h4 className="font-semibold mb-2">{t('creator.components.exerciseCard.rawData', 'Raw Data')}</h4>
            <pre className="p-3 bg-neutral-50 rounded text-sm overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        );
    }
  };

  // Render exercise item
  const renderExerciseItem = (exercise: Exercise, isSelected: boolean, onSelect: (exercise: Exercise) => void) => (
    <ExerciseCard
      key={exercise.id}
      exercise={exercise}
      isSelected={isSelected}
      onSelect={onSelect}
      onView={handleViewExercise}
      onEdit={handleEditExercise}
      onDelete={handleDeleteExercise}
      onPreview={handlePreviewExercise}
      showSelection={true}
      showActions={true}
    />
  );

  return (
    <>
      <PageTitle title={pageTitle} />
      <Layout title={pageTitle}>
        <ContentList
          title={pageTitle}
          items={exercises}
          isLoading={isLoading}
          error={error?.message || null}
          pagination={pagination}
          onRefresh={() => refetch()}
          onSearch={handleSearch}
          onPageChange={handlePageChange}
          onBulkAction={handleBulkAction}
          renderItem={renderExerciseItem}
          createButton={{
            label: t('creator.exercises.createNew', 'Create New Exercise'),
            onClick: () => setCreateModalOpen(true),
          }}
          bulkActions={[
            {
              id: 'delete',
              label: t('common.buttons.delete', 'Delete'),
              variant: 'outline',
              requiresConfirmation: true,
            },
          ]}
          searchPlaceholder={t('creator.pages.exercises.searchPlaceholder', 'Search exercises...')}
          emptyMessage={t('creator.pages.exercises.noExercises', 'No exercises found. Create your first exercise!')}
          emptyAction={{
            label: t('creator.exercises.createNew', 'Create New Exercise'),
            onClick: () => setCreateModalOpen(true),
          }}
        />

        {/* Create Exercise Modal */}
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title={t('creator.exercises.createNew', 'Create New Exercise')}
          size="xl"
        >
          <DynamicExerciseForm
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
            isModal={true}
          />
        </Modal>

        {/* Edit Exercise Modal */}
        {editingExercise && (
          <Modal
            isOpen={!!editingExercise}
            onClose={() => setEditingExercise(null)}
            title={t('creator.exercises.editExercise', 'Edit Exercise')}
            size="xl"
          >
            <DynamicExerciseForm
              initialData={editingExercise}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
              isModal={true}
            />
          </Modal>
        )}

        {/* Exercise Preview Modal */}
        {previewExercise && (
          <Modal
            isOpen={!!previewExercise}
            onClose={() => setPreviewExercise(null)}
            title={`${t('creator.components.exerciseCard.preview', 'Preview')}: ${previewExercise.exerciseType}`}
            size="lg"
          >
            <div className="space-y-4">
              {renderExercisePreview(previewExercise)}
            </div>
          </Modal>
        )}
      </Layout>
    </>
  );
};

export default ExercisesPage;