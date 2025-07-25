import React from 'react';
// import { useTranslation } from 'react-i18next'; // TODO: Add translations when needed
import { Level, Section, Module, Lesson } from '../../utils/types';
import { LevelsSection } from './LevelsSection';
import { SectionsSection } from './SectionsSection';
import { ModulesSection } from './ModulesSection';
import { LessonsSection } from './LessonsSection';

interface HierarchicalNavigatorProps {
  courseId: string;
  selectedLevel?: string;
  selectedSection?: string;
  selectedModule?: string;
  onLevelSelect: (levelId: string) => void;
  onSectionSelect: (sectionId: string) => void;
  onModuleSelect: (moduleId: string) => void;
  onLessonClick: (lessonId: string) => void;
  
  // Modal handlers
  onCreateLevel: () => void;
  onEditLevel: (level: Level) => void;
  onDeleteLevel: (level: Level) => void;
  
  onCreateSection: () => void;
  onEditSection: (section: Section) => void;
  onDeleteSection: (section: Section) => void;
  
  onCreateModule: () => void;
  onEditModule: (module: Module) => void;
  onDeleteModule: (module: Module) => void;
  
  onCreateLesson: () => void;
  onEditLesson: (lesson: Lesson) => void;
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