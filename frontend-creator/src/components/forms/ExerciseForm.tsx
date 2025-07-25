import React from "react";
import { DynamicExerciseForm } from "./DynamicExerciseForm";
import { Exercise } from "../../utils/types";

interface ExerciseFormProps {
  initialData?: Exercise;
  onSuccess?: (exercise: Exercise) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export const ExerciseForm: React.FC<ExerciseFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
  isModal = false,
}) => {
  return (
    <DynamicExerciseForm
      initialData={initialData}
      onSuccess={onSuccess}
      onCancel={onCancel}
      isModal={isModal}
    />
  );
};

export default ExerciseForm;