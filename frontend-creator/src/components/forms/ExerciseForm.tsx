import React from "react";
import { DynamicExerciseForm } from "./DynamicExerciseForm";
import { Exercise, CreateExerciseRequest } from "../../utils/types";
import { exerciseService } from "../../services/exerciseService";

interface ExerciseFormProps {
  initialData?: Exercise;
  onSuccess?: (exercise: Exercise) => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
  isModal?: boolean;
  enablePreview?: boolean;
  enableTemplates?: boolean;
}

export const ExerciseForm: React.FC<ExerciseFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
  onError,
  isModal = false,
  enablePreview = true,
  enableTemplates = true,
}) => {
  const handleSubmit = async (data: CreateExerciseRequest): Promise<Exercise> => {
    try {
      if (initialData) {
        // Update existing exercise
        return await exerciseService.updateExercise(initialData.id, data);
      } else {
        // Create new exercise
        return await exerciseService.createExercise(data);
      }
    } catch (error: any) {
      console.error('Exercise submission error:', error);
      throw error;
    }
  };

  return (
    <DynamicExerciseForm
      initialData={initialData}
      onSubmit={handleSubmit}
      onSuccess={onSuccess}
      onCancel={onCancel}
      onError={onError}
      enablePreview={enablePreview}
      enableTemplates={enableTemplates}
      isModal={isModal}
    />
  );
};

export default ExerciseForm;