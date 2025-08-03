import React from "react";
import { UnifiedEntityForm } from "./UnifiedEntityForm";
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
  isModal: _isModal = false,
}) => {
  return (
    <UnifiedEntityForm
      entityType="exercise"
      mode={initialData ? "edit" : "create"}
      initialData={initialData || {}}
      onSubmit={async (data) => {
        // Handle exercise submission
        console.log('Submitting exercise:', data);
      }}
      {...(onSuccess && { onSuccess: (_result, data) => onSuccess(data as Exercise) })}
      {...(onCancel && { onCancel })}
    />
  );
};

export default ExerciseForm;