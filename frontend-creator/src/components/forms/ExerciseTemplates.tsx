/**
 * Exercise Templates Component
 * 
 * This component provides pre-built exercise templates for quick creation
 * of common exercise patterns.
 * 
 * @module ExerciseTemplates
 * @category Components
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ExerciseType } from '../../utils/types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ExerciseTemplatesProps {
  /** Exercise type to show templates for */
  exerciseType: ExerciseType;
  /** Callback when template is applied */
  onApply: (templateData: Record<string, any>) => void;
  /** Callback when modal is closed */
  onClose: () => void;
}

interface ExerciseTemplate {
  id: string;
  name: string;
  description: string;
  data: Record<string, any>;
  tags: string[];
}

// ============================================================================
// Template Definitions
// ============================================================================

const EXERCISE_TEMPLATES: Record<ExerciseType, ExerciseTemplate[]> = {
  translation: [
    {
      id: 'basic-greeting',
      name: 'Basic Greeting',
      description: 'Simple greeting translation exercise',
      data: {
        source_text: 'Hello, how are you?',
        target_text: 'Hola, ¿cómo estás?',
        hints: ['Remember to use the informal "tú" form', 'Don\'t forget the question marks'],
      },
      tags: ['beginner', 'greetings', 'basic'],
    },
    {
      id: 'restaurant-order',
      name: 'Restaurant Order',
      description: 'Ordering food at a restaurant',
      data: {
        source_text: 'I would like to order a pizza and a salad, please.',
        target_text: 'Me gustaría pedir una pizza y una ensalada, por favor.',
        hints: ['Use "me gustaría" for polite requests', 'Remember the gender of nouns'],
      },
      tags: ['intermediate', 'food', 'restaurant'],
    },
    {
      id: 'directions',
      name: 'Asking for Directions',
      description: 'How to ask for directions in the target language',
      data: {
        source_text: 'Excuse me, where is the nearest bank?',
        target_text: 'Disculpe, ¿dónde está el banco más cercano?',
        hints: ['Use "disculpe" for formal situations', '"Más cercano" means "nearest"'],
      },
      tags: ['intermediate', 'directions', 'travel'],
    },
  ],
  'translation-word-bank': [
    {
      id: 'basic-introduction',
      name: 'Basic Introduction',
      description: 'Translate a simple self-introduction using word bank',
      data: {
        source_text: 'Me llamo María y soy estudiante',
        target_text: 'My name is María and I am a student',
        word_bank: [
          'My', 'name', 'is', 'María', 'and', 'I', 'am', 'a', 'student',
          'teacher', 'doctor', 'called', 'your', 'his', 'she', 'we'
        ],
        correct_words: ['My', 'name', 'is', 'María', 'and', 'I', 'am', 'a', 'student'],
      },
      tags: ['beginner', 'introduction', 'basic', 'identity'],
    },
    {
      id: 'daily-routine',
      name: 'Daily Routine',
      description: 'Describe daily activities with word selection',
      data: {
        source_text: 'Yo desayuno a las ocho de la mañana',
        target_text: 'I have breakfast at eight in the morning',
        word_bank: [
          'I', 'have', 'breakfast', 'at', 'eight', 'in', 'the', 'morning',
          'lunch', 'dinner', 'nine', 'ten', 'evening', 'night', 'afternoon', 'eat'
        ],
        correct_words: ['I', 'have', 'breakfast', 'at', 'eight', 'in', 'the', 'morning'],
      },
      tags: ['beginner', 'daily-routine', 'time', 'meals'],
    },
    {
      id: 'family-description',
      name: 'Family Description',
      description: 'Describe family members using word bank',
      data: {
        source_text: 'Mi hermana es muy inteligente y amable',
        target_text: 'My sister is very intelligent and kind',
        word_bank: [
          'My', 'sister', 'is', 'very', 'intelligent', 'and', 'kind',
          'brother', 'mother', 'father', 'smart', 'nice', 'funny', 'tall', 'beautiful', 'his'
        ],
        correct_words: ['My', 'sister', 'is', 'very', 'intelligent', 'and', 'kind'],
      },
      tags: ['beginner', 'family', 'adjectives', 'descriptions'],
    },
    {
      id: 'weather-description',
      name: 'Weather Description',
      description: 'Describe weather conditions with word selection',
      data: {
        source_text: 'Hoy hace mucho calor y sol',
        target_text: 'Today it is very hot and sunny',
        word_bank: [
          'Today', 'it', 'is', 'very', 'hot', 'and', 'sunny',
          'cold', 'rainy', 'cloudy', 'windy', 'snowy', 'warm', 'cool', 'yesterday', 'tomorrow'
        ],
        correct_words: ['Today', 'it', 'is', 'very', 'hot', 'and', 'sunny'],
      },
      tags: ['beginner', 'weather', 'adjectives', 'daily-life'],
    },
  ],
  'fill-in-the-blank': [
    {
      id: 'verb-conjugation',
      name: 'Verb Conjugation',
      description: 'Practice verb conjugations in context',
      data: {
        text: 'I ___ to the store yesterday and ___ some groceries.',
        blanks: [
          {
            position: 0,
            correctAnswers: ['went'],
            hints: ['Past tense of "go"'],
          },
          {
            position: 1,
            correctAnswers: ['bought', 'purchased'],
            hints: ['Past tense of "buy"'],
          },
        ],
      },
      tags: ['grammar', 'verbs', 'past-tense'],
    },
    {
      id: 'articles',
      name: 'Articles Practice',
      description: 'Practice using definite and indefinite articles',
      data: {
        text: '___ cat is sleeping on ___ chair in ___ living room.',
        blanks: [
          {
            position: 0,
            correctAnswers: ['The'],
            hints: ['Definite article for specific cat'],
          },
          {
            position: 1,
            correctAnswers: ['a', 'the'],
            hints: ['Could be indefinite or definite'],
          },
          {
            position: 2,
            correctAnswers: ['the'],
            hints: ['Definite article for specific room'],
          },
        ],
      },
      tags: ['grammar', 'articles', 'beginner'],
    },
  ],
  vof: [
    {
      id: 'basic-facts',
      name: 'Basic Facts',
      description: 'Simple true/false statements about common knowledge',
      data: {
        statement: 'The sun rises in the east.',
        isTrue: true,
        explanation: 'The sun always rises in the east and sets in the west due to Earth\'s rotation.',
      },
      tags: ['facts', 'beginner', 'science'],
    },
    {
      id: 'grammar-rule',
      name: 'Grammar Rule',
      description: 'Test understanding of grammar rules',
      data: {
        statement: 'In English, adjectives always come after the noun they describe.',
        isTrue: false,
        explanation: 'In English, adjectives typically come BEFORE the noun (e.g., "red car", not "car red").',
      },
      tags: ['grammar', 'intermediate', 'rules'],
    },
  ],
  pairs: [
    {
      id: 'colors-objects',
      name: 'Colors and Objects',
      description: 'Match colors with common objects',
      data: {
        pairs: [
          { left: 'Red', right: 'Apple' },
          { left: 'Blue', right: 'Sky' },
          { left: 'Green', right: 'Grass' },
          { left: 'Yellow', right: 'Sun' },
        ],
      },
      tags: ['vocabulary', 'colors', 'beginner'],
    },
    {
      id: 'countries-capitals',
      name: 'Countries and Capitals',
      description: 'Match countries with their capital cities',
      data: {
        pairs: [
          { left: 'France', right: 'Paris' },
          { left: 'Spain', right: 'Madrid' },
          { left: 'Italy', right: 'Rome' },
          { left: 'Germany', right: 'Berlin' },
        ],
      },
      tags: ['geography', 'intermediate', 'culture'],
    },
  ],
  informative: [
    {
      id: 'lesson-intro',
      name: 'Lesson Introduction',
      description: 'Introduction to a new grammar topic',
      data: {
        title: 'Introduction to Present Tense',
        content: 'The present tense is used to describe actions that are happening now or that happen regularly. In this lesson, we will learn how to form and use the present tense in everyday conversations.\n\nKey points to remember:\n• Present tense describes current actions\n• It can also describe habitual actions\n• The verb form changes based on the subject',
        media: null,
      },
      tags: ['grammar', 'introduction', 'present-tense'],
    },
    {
      id: 'cultural-note',
      name: 'Cultural Note',
      description: 'Information about cultural context',
      data: {
        title: 'Greeting Customs',
        content: 'In many Spanish-speaking countries, it\'s common to greet people with a kiss on the cheek or a warm handshake. The specific greeting can vary by region and relationship between people.\n\nFormal situations typically use handshakes, while friends and family often use cheek kisses. Understanding these customs helps you navigate social situations more effectively.',
        media: {
          type: 'image',
          url: 'https://example.com/greeting-customs.jpg',
          alt: 'People greeting with handshakes and cheek kisses',
        },
      },
      tags: ['culture', 'social', 'greetings'],
    },
  ],
  ordering: [
    {
      id: 'sentence-order',
      name: 'Sentence Word Order',
      description: 'Arrange words to form a correct sentence',
      data: {
        items: [
          { id: '1', text: 'I', order: 0 },
          { id: '2', text: 'am', order: 1 },
          { id: '3', text: 'learning', order: 2 },
          { id: '4', text: 'Spanish', order: 3 },
          { id: '5', text: 'today', order: 4 },
        ],
      },
      tags: ['grammar', 'sentence-structure', 'beginner'],
    },
    {
      id: 'story-sequence',
      name: 'Story Sequence',
      description: 'Put story events in chronological order',
      data: {
        items: [
          { id: '1', text: 'Maria woke up early', order: 0 },
          { id: '2', text: 'She had breakfast', order: 1 },
          { id: '3', text: 'She went to work', order: 2 },
          { id: '4', text: 'She came home in the evening', order: 3 },
          { id: '5', text: 'She went to bed', order: 4 },
        ],
      },
      tags: ['reading', 'sequence', 'intermediate'],
    },
  ],
};

// ============================================================================
// Main Component
// ============================================================================

export const ExerciseTemplates: React.FC<ExerciseTemplatesProps> = ({
  exerciseType,
  onApply,
  onClose,
}) => {
  const { t } = useTranslation();
  const [selectedTemplate, setSelectedTemplate] = useState<ExerciseTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Get templates for the current exercise type
  const templates = useMemo(() => {
    return EXERCISE_TEMPLATES[exerciseType] || [];
  }, [exerciseType]);

  // Get all available tags
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    templates.forEach(template => {
      template.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [templates]);

  // Filter templates based on search and tags
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = searchTerm === '' || 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.some(tag => template.tags.includes(tag));
      
      return matchesSearch && matchesTags;
    });
  }, [templates, searchTerm, selectedTags]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleApplyTemplate = (template: ExerciseTemplate) => {
    onApply(template.data);
  };

  const handlePreviewTemplate = (template: ExerciseTemplate) => {
    setSelectedTemplate(template);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('creator.templates.title', 'Exercise Templates')}
      size="lg"
    >
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search */}
          <div>
            <label htmlFor="template-search" className="block text-sm font-medium text-gray-700 mb-1">
              {t('creator.templates.search', 'Search Templates')}
            </label>
            <input
              type="text"
              id="template-search"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('creator.templates.searchPlaceholder', 'Search by name or description...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Tag Filters */}
          {availableTags.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('creator.templates.filterByTags', 'Filter by Tags')}
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map(template => (
              <Card key={template.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {template.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewTemplate(template)}
                    >
                      {t('creator.templates.preview', 'Preview')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleApplyTemplate(template)}
                    >
                      {t('creator.templates.apply', 'Apply')}
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-2 text-center py-8 text-gray-500">
              {t('creator.templates.noTemplates', 'No templates found matching your criteria')}
            </div>
          )}
        </div>

        {/* Template Preview Modal */}
        {selectedTemplate && (
          <Modal
            isOpen={true}
            onClose={() => setSelectedTemplate(null)}
            title={selectedTemplate.name}
            size="md"
          >
            <div className="space-y-4">
              <p className="text-gray-600">{selectedTemplate.description}</p>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">
                  {t('creator.templates.previewData', 'Template Data:')}
                </h4>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-auto max-h-64">
                  {JSON.stringify(selectedTemplate.data, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedTemplate(null)}
                >
                  {t('common.close', 'Close')}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    handleApplyTemplate(selectedTemplate);
                    setSelectedTemplate(null);
                  }}
                >
                  {t('creator.templates.apply', 'Apply Template')}
                </Button>
              </div>
            </div>
          </Modal>
        )}

        {/* Modal Actions */}
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('common.close', 'Close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ExerciseTemplates;