import { Exercise, ExerciseType } from './types';

/**
 * Extract searchable text content from exercise data based on exercise type
 * @param exercise The exercise to extract content from
 * @returns Array of searchable text strings
 */
export const extractExerciseContent = (exercise: Exercise): string[] => {
    const { exerciseType, data } = exercise;
    const content: string[] = [];

    switch (exerciseType) {
        case 'translation':
            if (data.source_text) content.push(data.source_text);
            if (data.target_text) content.push(data.target_text);
            if (data.source_language) content.push(data.source_language);
            if (data.target_language) content.push(data.target_language);
            break;

        case 'fill-in-the-blank':
            if (data.text) content.push(data.text);
            if (data.blanks && Array.isArray(data.blanks)) {
                data.blanks.forEach((blank: any) => {
                    if (blank.correct_answers && Array.isArray(blank.correct_answers)) {
                        content.push(...blank.correct_answers);
                    }
                });
            }
            break;

        case 'vof':
            if (data.statement) content.push(data.statement);
            if (data.explanation) content.push(data.explanation);
            break;

        case 'pairs':
            if (data.pairs && Array.isArray(data.pairs)) {
                data.pairs.forEach((pair: any) => {
                    if (pair.left) content.push(pair.left);
                    if (pair.right) content.push(pair.right);
                });
            }
            break;

        case 'informative':
            if (data.content) {
                // Strip HTML tags for search
                const textContent = data.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                content.push(textContent);
            }
            if (data.media_url) content.push(data.media_url);
            break;

        case 'ordering':
            if (data.items && Array.isArray(data.items)) {
                data.items.forEach((item: any) => {
                    if (item.content) content.push(item.content);
                });
            }
            break;

        default:
            // For unknown types, try to extract any string values
            const extractStrings = (obj: any): string[] => {
                const strings: string[] = [];
                if (typeof obj === 'string') {
                    strings.push(obj);
                } else if (typeof obj === 'object' && obj !== null) {
                    Object.values(obj).forEach(value => {
                        strings.push(...extractStrings(value));
                    });
                }
                return strings;
            };
            content.push(...extractStrings(data));
    }

    return content.filter(text => text && text.trim().length > 0);
};

/**
 * Search exercises by content, type, or metadata
 * @param exercises Array of exercises to search
 * @param searchTerm Search term to match against
 * @param caseSensitive Whether search should be case sensitive
 * @returns Filtered array of exercises that match the search term
 */
export const searchExercises = (
    exercises: Exercise[],
    searchTerm: string,
    caseSensitive: boolean = false
): Exercise[] => {
    if (!searchTerm || searchTerm.trim().length === 0) {
        return exercises;
    }

    const normalizedSearchTerm = caseSensitive ? searchTerm : searchTerm.toLowerCase();

    return exercises.filter(exercise => {
        // Search in exercise type
        const exerciseType = caseSensitive ? exercise.exerciseType : exercise.exerciseType.toLowerCase();
        if (exerciseType.includes(normalizedSearchTerm)) {
            return true;
        }

        // Search in exercise ID
        const exerciseId = caseSensitive ? exercise.id : exercise.id.toLowerCase();
        if (exerciseId.includes(normalizedSearchTerm)) {
            return true;
        }

        // Search in exercise content
        const contentStrings = extractExerciseContent(exercise);
        return contentStrings.some(content => {
            const normalizedContent = caseSensitive ? content : content.toLowerCase();
            return normalizedContent.includes(normalizedSearchTerm);
        });
    });
};

/**
 * Get search suggestions based on exercise content
 * @param exercises Array of exercises to analyze
 * @param maxSuggestions Maximum number of suggestions to return
 * @returns Array of suggested search terms
 */
export const getSearchSuggestions = (
    exercises: Exercise[],
    maxSuggestions: number = 10
): string[] => {
    const wordFrequency = new Map<string, number>();

    exercises.forEach(exercise => {
        const contentStrings = extractExerciseContent(exercise);
        contentStrings.forEach(content => {
            // Extract words (simple tokenization)
            const words = content
                .toLowerCase()
                .replace(/[^a-zA-Z0-9\s]/g, ' ')
                .split(/\s+/)
                .filter(word => word.length > 2); // Only words longer than 2 characters

            words.forEach(word => {
                wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
            });
        });
    });

    // Sort by frequency and return top suggestions
    return Array.from(wordFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxSuggestions)
        .map(([word]) => word);
};

/**
 * Highlight search terms in text
 * @param text Text to highlight
 * @param searchTerm Term to highlight
 * @param caseSensitive Whether search should be case sensitive
 * @returns Text with highlighted search terms
 */
export const highlightSearchTerm = (
    text: string,
    searchTerm: string,
    caseSensitive: boolean = false
): string => {
    if (!searchTerm || searchTerm.trim().length === 0) {
        return text;
    }

    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, flags);

    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
};

/**
 * Advanced search with multiple criteria
 * @param exercises Array of exercises to search
 * @param criteria Search criteria object
 * @returns Filtered array of exercises
 */
export interface ExerciseSearchCriteria {
    searchTerm?: string;
    exerciseTypes?: ExerciseType[];
    caseSensitive?: boolean;
    contentOnly?: boolean; // Search only in content, not metadata
}

export const advancedSearchExercises = (
    exercises: Exercise[],
    criteria: ExerciseSearchCriteria
): Exercise[] => {
    let filteredExercises = exercises;

    // Filter by exercise types
    if (criteria.exerciseTypes && criteria.exerciseTypes.length > 0) {
        filteredExercises = filteredExercises.filter(exercise =>
            criteria.exerciseTypes!.includes(exercise.exerciseType)
        );
    }

    // Filter by search term
    if (criteria.searchTerm && criteria.searchTerm.trim().length > 0) {
        const normalizedSearchTerm = criteria.caseSensitive
            ? criteria.searchTerm
            : criteria.searchTerm.toLowerCase();

        filteredExercises = filteredExercises.filter(exercise => {
            // Search in content
            const contentStrings = extractExerciseContent(exercise);
            const contentMatch = contentStrings.some(content => {
                const normalizedContent = criteria.caseSensitive ? content : content.toLowerCase();
                return normalizedContent.includes(normalizedSearchTerm);
            });

            if (criteria.contentOnly) {
                return contentMatch;
            }

            // Also search in metadata if not content-only
            const exerciseType = criteria.caseSensitive ? exercise.exerciseType : exercise.exerciseType.toLowerCase();
            const exerciseId = criteria.caseSensitive ? exercise.id : exercise.id.toLowerCase();

            return contentMatch ||
                exerciseType.includes(normalizedSearchTerm) ||
                exerciseId.includes(normalizedSearchTerm);
        });
    }

    return filteredExercises;
};