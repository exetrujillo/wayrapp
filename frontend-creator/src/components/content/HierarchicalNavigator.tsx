import React from 'react';
// import { useTranslation } from 'react-i18next'; // TODO: Add translations when needed
import { Level, Section, Module, Lesson } from '../../utils/types';
import { LevelsSection } from './LevelsSection';
import { SectionsSection } from './SectionsSection';
import { ModulesSection } from './ModulesSection';
import { LessonsSection } from './LessonsSection';

/**
 * Props for the HierarchicalNavigator component
 */
interface HierarchicalNavigatorProps {
  /** ID of the course to display content for */
  courseId: string;
  /** Currently selected level ID */
  selectedLevel?: string;
  /** Currently selected section ID */
  selectedSection?: string;
  /** Currently selected module ID */
  selectedModule?: string;
  
  // Selection handlers
  /** Handler for level selection */
  onLevelSelect: (levelId: string) => void;
  /** Handler for section selection */
  onSectionSelect: (sectionId: string) => void;
  /** Handler for module selection */
  onModuleSelect: (moduleId: string) => void;
  /** Handler for lesson click */
  onLessonClick: (lessonId: string) => void;
  
  // Level modal handlers
  /** Handler for creating a new level */
  onCreateLevel: () => void;
  /** Handler for editing an existing level */
  onEditLevel: (level: Level) => void;
  /** Handler for deleting a level */
  onDeleteLevel: (level: Level) => void;
  
  // Section modal handlers
  /** Handler for creating a new section */
  onCreateSection: () => void;
  /** Handler for editing an existing section */
  onEditSection: (section: Section) => void;
  /** Handler for deleting a section */
  onDeleteSection: (section: Section) => void;
  
  // Module modal handlers
  /** Handler for creating a new module */
  onCreateModule: () => void;
  /** Handler for editing an existing module */
  onEditModule: (module: Module) => void;
  /** Handler for deleting a module */
  onDeleteModule: (module: Module) => void;
  
  // Lesson modal handlers
  /** Handler for creating a new lesson */
  onCreateLesson: () => void;
  /** Handler for editing an existing lesson */
  onEditLesson: (lesson: Lesson) => void;
  /** Handler for deleting a lesson */
  onDeleteLesson: (lesson: Lesson) => void;
}

/**
 * Main hierarchical navigation component that manages the course content structure
 * Renders appropriate sections based on current selection state
 * Handles breadcrumb navigation and context switching
 */
export const HierarchicalNavigator: React.FC<HierarchicalNavigatorProps> = ({
  courseId,
  selectedLevel,
  selectedSection,
  selectedModule,
  onLevelSelect,
  onSectionSelect,
  onModuleSelect,
  onLessonClick,
  onCreateLevel,
  onEditLevel,
  onDeleteLevel,
  onCreateSection,
  onEditSection,
  onDeleteSection,
  onCreateModule,
  onEditModule,
  onDeleteModule,
  onCreateLesson,
  onEditLesson,
  onDeleteLesson,
}) => {
  // const { t } = useTranslation(); // TODO: Add translations when needed

  return (
    <div className="hierarchical-navigator space-y-8">
      {/* Always show levels */}
      <LevelsSection
        courseId={courseId}
        selectedLevel={selectedLevel}
        onLevelSelect={onLevelSelect}
        onCreateLevel={onCreateLevel}
        onEditLevel={onEditLevel}
        onDeleteLevel={onDeleteLevel}
      />

      {/* Show sections when a level is selected */}
      {selectedLevel && (
        <div className="ml-6 border-l-2 border-neutral-200 pl-6">
          <SectionsSection
            levelId={selectedLevel}
            selectedSection={selectedSection}
            onSectionSelect={onSectionSelect}
            onCreateSection={onCreateSection}
            onEditSection={onEditSection}
            onDeleteSection={onDeleteSection}
          />
        </div>
      )}

      {/* Show modules when a section is selected */}
      {selectedLevel && selectedSection && (
        <div className="ml-12 border-l-2 border-neutral-200 pl-6">
          <ModulesSection
            sectionId={selectedSection}
            selectedModule={selectedModule}
            onModuleSelect={onModuleSelect}
            onCreateModule={onCreateModule}
            onEditModule={onEditModule}
            onDeleteModule={onDeleteModule}
          />
        </div>
      )}

      {/* Show lessons when a module is selected */}
      {selectedLevel && selectedSection && selectedModule && (
        <div className="ml-18 border-l-2 border-neutral-200 pl-6">
          <LessonsSection
            moduleId={selectedModule}
            onLessonClick={onLessonClick}
            onCreateLesson={onCreateLesson}
            onEditLesson={onEditLesson}
            onDeleteLesson={onDeleteLesson}
          />
        </div>
      )}
    </div>
  );
};

export default HierarchicalNavigator;