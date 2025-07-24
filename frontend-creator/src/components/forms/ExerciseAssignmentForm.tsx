import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from 'react-beautiful-dnd';
import { exerciseAssignmentSchema, ExerciseAssignmentFormData } from '../../utils/validation';
import { lessonService } from '../../services/lessonService';
import { exerciseService } from '../../services/exerciseService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Feedback } from '../ui/Feedback';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Exercise, ExerciseAssignment } from '../../utils/types';

interface ExerciseAssignmentFormProps {
    lessonId: string;
    onSuccess?: (assignments: ExerciseAssignment[]) => void;
}

const ExerciseAssignmentForm: React.FC<ExerciseAssignmentFormProps> = ({ lessonId, onSuccess }) => {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [isLoadingExercises, setIsLoadingExercises] = useState(false);
    const [assignedExercises, setAssignedExercises] = useState<ExerciseAssignment[]>([]);
    const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        reset,
        setValue,
        formState: { errors },
    } = useForm<ExerciseAssignmentFormData>({
        resolver: zodResolver(exerciseAssignmentSchema),
        defaultValues: {
            lessonId,
            exercise_id: '',
            order: assignedExercises.length,
        },
    });

    // Fetch available exercises
    useEffect(() => {
        const fetchExercises = async () => {
            setIsLoadingExercises(true);
            try {
                const response = await exerciseService.getExercises({ limit: 100 });
                setExercises(response.data);
            } catch (error: any) {
                setFeedback({
                    type: 'error',
                    message: error.message || t('common.messages.error', 'An error occurred'),
                });
            } finally {
                setIsLoadingExercises(false);
            }
        };

        fetchExercises();
    }, [t]);

    // Fetch existing exercise assignments for this lesson
    useEffect(() => {
        const fetchAssignments = async () => {
            if (!lessonId) return;

            setIsLoadingAssignments(true);
            try {
                const assignments = await lessonService.getLessonExercises(lessonId);
                setAssignedExercises(assignments);
            } catch (error: any) {
                setFeedback({
                    type: 'error',
                    message: error.message || t('common.messages.error', 'An error occurred'),
                });
            } finally {
                setIsLoadingAssignments(false);
            }
        };

        fetchAssignments();
    }, [lessonId, t]);

    // Update the default order when assigned exercises change
    useEffect(() => {
        setValue('order', assignedExercises.length);
    }, [assignedExercises, setValue]);

    const onSubmit = async (data: ExerciseAssignmentFormData) => {
        setIsSubmitting(true);
        setFeedback(null);

        try {
            const response = await lessonService.assignExerciseToLesson(lessonId, {
                exercise_id: data.exercise_id,
                order: data.order,
            });

            setFeedback({
                type: 'success',
                message: t('creator.forms.exerciseAssignment.successMessage', 'Exercise assigned successfully!'),
            });

            // Update the list of assigned exercises
            setAssignedExercises([...assignedExercises, response]);

            // Reset the form
            reset({
                lessonId,
                exercise_id: '',
                order: assignedExercises.length + 1,
            });

            if (onSuccess) {
                onSuccess([...assignedExercises, response]);
            }
        } catch (error: any) {
            setFeedback({
                type: 'error',
                message: error.message || t('common.messages.error', 'An error occurred'),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemoveAssignment = async (assignmentId: string) => {
        try {
            await lessonService.removeExerciseFromLesson(lessonId, assignmentId);

            // Update the list of assigned exercises
            const updatedAssignments = assignedExercises.filter(a => a.id !== assignmentId);
            setAssignedExercises(updatedAssignments);

            setFeedback({
                type: 'success',
                message: t('creator.forms.exerciseAssignment.removeSuccess', 'Exercise removed successfully!'),
            });

            if (onSuccess) {
                onSuccess(updatedAssignments);
            }
        } catch (error: any) {
            setFeedback({
                type: 'error',
                message: error.message || t('common.messages.error', 'An error occurred'),
            });
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        if (sourceIndex === destinationIndex) return;

        // Reorder the assignments
        const reorderedAssignments = Array.from(assignedExercises);
        const [removed] = reorderedAssignments.splice(sourceIndex, 1);
        if (removed) {
            reorderedAssignments.splice(destinationIndex, 0, removed);
        }

        // Update the UI immediately for better UX
        setAssignedExercises(reorderedAssignments);

        // Update the order in the backend
        try {
            // Update the order for each affected assignment
            const updatePromises = reorderedAssignments.map((assignment, index) =>
                lessonService.updateExerciseAssignment(lessonId, assignment.id, { order: index })
            );

            await Promise.all(updatePromises);

            setFeedback({
                type: 'success',
                message: t('creator.forms.exerciseAssignment.reorderSuccess', 'Exercise order updated successfully!'),
            });

            if (onSuccess) {
                onSuccess(reorderedAssignments);
            }
        } catch (error: any) {
            // If there's an error, revert to the previous state
            setFeedback({
                type: 'error',
                message: error.message || t('common.messages.error', 'An error occurred'),
            });

            // Refetch the assignments to ensure we have the correct order
            const assignments = await lessonService.getLessonExercises(lessonId);
            setAssignedExercises(assignments);
        }
    };

    // Find exercise details by ID
    const getExerciseById = (id: string) => {
        return exercises.find(exercise => exercise.id === id);
    };

    // Get exercise type display name
    const getExerciseTypeName = (type: string) => {
        const typeMap: Record<string, string> = {
            translation: t('creator.exerciseTypes.translation', 'Translation'),
            'fill-in-the-blank': t('creator.exerciseTypes.fillInTheBlank', 'Fill in the Blank'),
            vof: t('creator.exerciseTypes.vof', 'Verify or False'),
            pairs: t('creator.exerciseTypes.pairs', 'Pairs'),
            informative: t('creator.exerciseTypes.informative', 'Informative'),
            ordering: t('creator.exerciseTypes.ordering', 'Ordering'),
        };

        return typeMap[type] || type;
    };

    // Get a preview of the exercise content
    const getExercisePreview = (exercise: Exercise) => {
        if (!exercise || !exercise.data) return '';

        switch (exercise.exerciseType) {
            case 'translation':
                return exercise.data['source_text'] || '';
            case 'fill-in-the-blank':
                return exercise.data['text'] || '';
            case 'vof':
                return exercise.data['question'] || '';
            case 'pairs':
                return `${exercise.data['pairs']?.length || 0} pairs`;
            case 'informative':
                return exercise.data['content'] || '';
            case 'ordering':
                return `${exercise.data['items']?.length || 0} items`;
            default:
                return '';
        }
    };

    if (isLoadingExercises || isLoadingAssignments) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {feedback && (
                <Feedback
                    type={feedback.type}
                    message={feedback.message}
                    onDismiss={() => setFeedback(null)}
                />
            )}

            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                    {t('creator.forms.exerciseAssignment.title', 'Assign Exercise to Lesson')}
                </h2>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label htmlFor="exercise_id" className="block text-sm font-medium text-neutral-700 mb-1">
                            {t('creator.forms.exerciseAssignment.exerciseId', 'Select Exercise')}
                            <span className="text-error ml-1">*</span>
                        </label>
                        <Controller
                            name="exercise_id"
                            control={control}
                            render={({ field }) => (
                                <select
                                    id="exercise_id"
                                    className="input w-full"
                                    {...field}
                                    disabled={isSubmitting}
                                >
                                    <option value="">
                                        {t('creator.forms.exerciseAssignment.selectExercise', '-- Select an exercise --')}
                                    </option>
                                    {exercises.map(exercise => (
                                        <option key={exercise.id} value={exercise.id}>
                                            {getExerciseTypeName(exercise.exerciseType)} - {getExercisePreview(exercise).substring(0, 50)}
                                            {getExercisePreview(exercise).length > 50 ? '...' : ''}
                                        </option>
                                    ))}
                                </select>
                            )}
                        />
                        {errors.exercise_id && (
                            <p className="mt-1 text-sm text-error">{errors.exercise_id.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="order" className="block text-sm font-medium text-neutral-700 mb-1">
                            {t('creator.forms.exerciseAssignment.order', 'Order')}
                            <span className="text-error ml-1">*</span>
                        </label>
                        <Input
                            id="order"
                            type="number"
                            min={0}
                            {...register('order', { valueAsNumber: true })}
                            disabled={isSubmitting}
                            {...(errors.order?.message && { error: errors.order.message })}
                        />
                    </div>

                    <div className="flex justify-end space-x-2">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            isLoading={isSubmitting}
                        >
                            {t('creator.forms.exerciseAssignment.assign', 'Assign Exercise')}
                        </Button>
                    </div>
                </form>
            </Card>

            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                    {t('creator.forms.exerciseAssignment.assignedExercises', 'Assigned Exercises')}
                </h2>

                {assignedExercises.length === 0 ? (
                    <p className="text-neutral-500">
                        {t('creator.forms.exerciseAssignment.noExercises', 'No exercises assigned to this lesson yet.')}
                    </p>
                ) : (
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="exercises">
                            {(provided: DroppableProvided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="space-y-2"
                                >
                                    {assignedExercises.map((assignment, index) => {
                                        const exercise = getExerciseById(assignment.exercise_id);

                                        return (
                                            <Draggable key={assignment.id} draggableId={assignment.id} index={index}>
                                                {(provided: DraggableProvided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className="border border-neutral-200 rounded-lg p-4 bg-white flex justify-between items-center"
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <div className="bg-neutral-200 rounded-full w-6 h-6 flex items-center justify-center">
                                                                {index + 1}
                                                            </div>
                                                            <div>
                                                                {exercise ? (
                                                                    <>
                                                                        <p className="font-medium">
                                                                            {getExerciseTypeName(exercise.exerciseType)}
                                                                        </p>
                                                                        <p className="text-sm text-neutral-600 truncate max-w-md">
                                                                            {getExercisePreview(exercise)}
                                                                        </p>
                                                                    </>
                                                                ) : (
                                                                    <p className="text-error">
                                                                        {t('creator.forms.exerciseAssignment.exerciseNotFound', 'Exercise not found')}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleRemoveAssignment(assignment.id)}
                                                        >
                                                            {t('common.buttons.remove', 'Remove')}
                                                        </Button>
                                                    </div>
                                                )}
                                            </Draggable>
                                        );
                                    })}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                )}
            </Card>
        </div>
    );
};

export default ExerciseAssignmentForm;