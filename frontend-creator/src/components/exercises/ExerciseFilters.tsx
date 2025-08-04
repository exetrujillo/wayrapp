import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExerciseType } from '../../utils/types';

interface ExerciseFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  typeFilter: ExerciseType | 'all';
  onTypeFilterChange: (type: ExerciseType | 'all') => void;
  usageFilter: 'all' | 'used' | 'unused';
  onUsageFilterChange: (usage: 'all' | 'used' | 'unused') => void;
  difficultyFilter: 'all' | 'easy' | 'medium' | 'hard';
  onDifficultyFilterChange: (difficulty: 'all' | 'easy' | 'medium' | 'hard') => void;
}

export const ExerciseFilters: React.FC<ExerciseFiltersProps> = ({
  searchTerm,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  usageFilter,
  onUsageFilterChange,
  difficultyFilter,
  onDifficultyFilterChange,
}) => {
  const { t } = useTranslation();

  const exerciseTypes: (ExerciseType | 'all')[] = [
    'all',
    'translation',
    'fill-in-the-blank',
    'vof',
    'pairs',
    'informative',
    'ordering',
  ];

  const clearAllFilters = () => {
    onSearchChange('');
    onTypeFilterChange('all');
    onUsageFilterChange('all');
    onDifficultyFilterChange('all');
  };

  const hasActiveFilters = searchTerm || typeFilter !== 'all' || usageFilter !== 'all' || difficultyFilter !== 'all';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Search */}
      <div>
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
          {t('exercises.filters.search', 'Search exercises')}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            id="search"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder={t('exercises.filters.searchPlaceholder', 'Search by content, type, or keywords...')}
          />
        </div>
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Exercise Type Filter */}
        <div>
          <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-2">
            {t('exercises.filters.type', 'Exercise Type')}
          </label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value as ExerciseType | 'all')}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            {exerciseTypes.map((type) => (
              <option key={type} value={type}>
                {type === 'all' 
                  ? t('exercises.filters.allTypes', 'All Types')
                  : t(`exercises.types.${type}`, type.replace('_', ' ').toUpperCase())
                }
              </option>
            ))}
          </select>
        </div>

        {/* Usage Filter */}
        <div>
          <label htmlFor="usage-filter" className="block text-sm font-medium text-gray-700 mb-2">
            {t('exercises.filters.usage', 'Usage Status')}
          </label>
          <select
            id="usage-filter"
            value={usageFilter}
            onChange={(e) => onUsageFilterChange(e.target.value as 'all' | 'used' | 'unused')}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">{t('exercises.filters.allUsage', 'All Exercises')}</option>
            <option value="used">{t('exercises.filters.used', 'Used in Lessons')}</option>
            <option value="unused">{t('exercises.filters.unused', 'Not Used')}</option>
          </select>
        </div>

        {/* Difficulty Filter */}
        <div>
          <label htmlFor="difficulty-filter" className="block text-sm font-medium text-gray-700 mb-2">
            {t('exercises.filters.difficulty', 'Difficulty')}
          </label>
          <select
            id="difficulty-filter"
            value={difficultyFilter}
            onChange={(e) => onDifficultyFilterChange(e.target.value as 'all' | 'easy' | 'medium' | 'hard')}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">{t('exercises.filters.allDifficulties', 'All Difficulties')}</option>
            <option value="easy">{t('exercises.filters.easy', 'Easy')}</option>
            <option value="medium">{t('exercises.filters.medium', 'Medium')}</option>
            <option value="hard">{t('exercises.filters.hard', 'Hard')}</option>
          </select>
        </div>

        {/* Clear Filters */}
        <div className="flex items-end">
          <button
            type="button"
            onClick={clearAllFilters}
            disabled={!hasActiveFilters}
            className={`w-full px-4 py-2 text-sm font-medium rounded-md border ${
              hasActiveFilters
                ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                : 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
            }`}
          >
            {t('exercises.filters.clear', 'Clear Filters')}
          </button>
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
          <span className="text-sm text-gray-600">
            {t('exercises.filters.activeFilters', 'Active filters:')}
          </span>
          
          {searchTerm && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {t('exercises.filters.searchTag', 'Search: "{{term}}"', { term: searchTerm })}
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-600"
              >
                <span className="sr-only">Remove search filter</span>
                <svg className="w-2 h-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                  <path strokeLinecap="round" strokeWidth="1.5" d="m1 1 6 6m0-6L1 7" />
                </svg>
              </button>
            </span>
          )}

          {typeFilter !== 'all' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {t(`exercises.types.${typeFilter}`, typeFilter.replace('_', ' ').toUpperCase())}
              <button
                type="button"
                onClick={() => onTypeFilterChange('all')}
                className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-green-400 hover:bg-green-200 hover:text-green-600"
              >
                <span className="sr-only">Remove type filter</span>
                <svg className="w-2 h-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                  <path strokeLinecap="round" strokeWidth="1.5" d="m1 1 6 6m0-6L1 7" />
                </svg>
              </button>
            </span>
          )}

          {usageFilter !== 'all' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {t(`exercises.filters.${usageFilter}`, usageFilter)}
              <button
                type="button"
                onClick={() => onUsageFilterChange('all')}
                className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-400 hover:bg-purple-200 hover:text-purple-600"
              >
                <span className="sr-only">Remove usage filter</span>
                <svg className="w-2 h-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                  <path strokeLinecap="round" strokeWidth="1.5" d="m1 1 6 6m0-6L1 7" />
                </svg>
              </button>
            </span>
          )}

          {difficultyFilter !== 'all' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              {t(`exercises.filters.${difficultyFilter}`, difficultyFilter)}
              <button
                type="button"
                onClick={() => onDifficultyFilterChange('all')}
                className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-orange-400 hover:bg-orange-200 hover:text-orange-600"
              >
                <span className="sr-only">Remove difficulty filter</span>
                <svg className="w-2 h-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                  <path strokeLinecap="round" strokeWidth="1.5" d="m1 1 6 6m0-6L1 7" />
                </svg>
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};