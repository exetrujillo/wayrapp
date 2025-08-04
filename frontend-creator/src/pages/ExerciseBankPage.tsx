import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExerciseBank } from '../components/exercises/ExerciseBank';
import { Exercise } from '../utils/types';

export const ExerciseBankPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  const handleSelectExercise = (exercise: Exercise) => {
    console.log('Selected exercise:', exercise);
    // TODO: Implement exercise selection logic (e.g., for assignment to lessons)
  };

  const handleCreateExercise = () => {
    console.log('Create new exercise');
    // TODO: Implement exercise creation modal
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (!selectionMode) {
      setSelectedExercises([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('exercises.bank.pageTitle', 'Exercise Bank')}
              </h1>
              <p className="mt-2 text-gray-600">
                {t('exercises.bank.pageDescription', 'Manage your exercise library and assign exercises to lessons')}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={toggleSelectionMode}
                className={`px-4 py-2 text-sm font-medium rounded-md border ${
                  selectionMode
                    ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100'
                    : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {selectionMode 
                  ? t('exercises.bank.exitSelection', 'Exit Selection')
                  : t('exercises.bank.selectMode', 'Select Mode')
                }
              </button>
            </div>
          </div>
        </div>

        {/* Exercise Bank */}
        <ExerciseBank
          onSelectExercise={handleSelectExercise}
          onCreateExercise={handleCreateExercise}
          selectionMode={selectionMode}
          selectedExercises={selectedExercises}
          onSelectionChange={setSelectedExercises}
        />
      </div>
    </div>
  );
};