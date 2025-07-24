import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';
import { ContentList, ExerciseCard } from '../components/content';
import { Modal } from '../components/ui/Modal';
import { useTranslation } from 'react-i18next';
import { exerciseService } from '../services/exerciseService';
import { Exercise, PaginationParams, PaginatedResponse } from '../utils/types';

const ExercisesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pageTitle = t('common.navigation.exercises');
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginatedResponse<Exercise>['meta'] | null>(null);
  const [currentParams, setCurrentParams] = useState<PaginationParams>({
    page: 1,
    limit: 12,
    search: '',
  });
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);

  // Fetch exercises
  const fetchExercises = useCallback(async (params?: PaginationParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const finalParams = { ...currentParams, ...params };
      setCurrentParams(finalParams);
      
      const response = await exerciseService.getExercises(finalParams);
      setExercises(response.data);
      setPagination(response.meta);
    } catch (err: any) {
      setError(err.message || t('common.messages.error', 'An error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [currentParams, t]);

  // Initial load
  useEffect(() => {
    fetchExercises();
  }, []);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    fetchExercises({ ...currentParams, search: query, page: 1 });
  }, [currentParams, fetchExercises]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    fetchExercises({ ...currentParams, page });
  }, [currentParams, fetchExercises]);

  // Handle exercise actions
  const handleViewExercise = (exercise: Exercise) => {
    navigate(`/exercises/${exercise.id}`);
  };

  const handleEditExercise = (exercise: Exercise) => {
    navigate(`/exercises/${exercise.id}/edit`);
  };

  const handleDeleteExercise = async (exercise: Exercise) => {
    try {
      await exerciseService.deleteExercise(exercise.id);
      fetchExercises(); // Refresh the list
    } catch (err: any) {
      setError(err.message || t('common.messages.error', 'An error occurred'));
    }
  };

  const handlePreviewExercise = (exercise: Exercise) => {
    setPreviewExercise(exercise);
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string, selectedExercises: Exercise[]) => {
    try {
      if (action === 'delete') {
        await Promise.all(selectedExercises.map(exercise => exerciseService.deleteExercise(exercise.id)));
        fetchExercises(); // Refresh the list
      }
    } catch (err: any) {
      setError(err.message || t('common.messages.error', 'An error occurred'));
    }
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
      case 'multiple_choice':
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
      case 'fill_in_the_blank':
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
          error={error}
          pagination={pagination}
          onRefresh={fetchExercises}
          onSearch={handleSearch}
          onPageChange={handlePageChange}
          onBulkAction={handleBulkAction}
          renderItem={renderExerciseItem}
          createButton={{
            label: t('creator.exercises.createNew', 'Create New Exercise'),
            onClick: () => navigate('/exercises/create'),
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
            onClick: () => navigate('/exercises/create'),
          }}
        />

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