import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockAuthContextValues } from '../../../__tests__/utils/test-utils';
import { HierarchicalNavigator } from '../HierarchicalNavigator';
import { useLevelsQuery } from '../../../hooks/useLevels';
import { useSectionsQuery } from '../../../hooks/useSections';
import { useModulesQuery } from '../../../hooks/useModules';

// Mock the hooks
jest.mock('../../../hooks/useLevels');
jest.mock('../../../hooks/useSections');
jest.mock('../../../hooks/useModules');

const mockUseLevelsQuery = useLevelsQuery as jest.MockedFunction<typeof useLevelsQuery>;
const mockUseSectionsQuery = useSectionsQuery as jest.MockedFunction<typeof useSectionsQuery>;
const mockUseModulesQuery = useModulesQuery as jest.MockedFunction<typeof useModulesQuery>;

describe('HierarchicalNavigator', () => {
  const mockOnLevelSelect = jest.fn();
  const mockOnSectionSelect = jest.fn();
  const mockOnModuleSelect = jest.fn();
  const mockOnLessonClick = jest.fn();
  
  // Modal handlers
  const mockOnCreateLevel = jest.fn();
  const mockOnEditLevel = jest.fn();
  const mockOnDeleteLevel = jest.fn();
  const mockOnCreateSection = jest.fn();
  const mockOnEditSection = jest.fn();
  const mockOnDeleteSection = jest.fn();
  const mockOnCreateModule = jest.fn();
  const mockOnEditModule = jest.fn();
  const mockOnDeleteModule = jest.fn();
  const mockOnCreateLesson = jest.fn();
  const mockOnEditLesson = jest.fn();
  const mockOnDeleteLesson = jest.fn();

  const mockLevel = {
    id: 'level-1',
    courseId: 'course-1',
    code: 'A1',
    name: 'Beginner',
    order: 1,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  const mockSection = {
    id: 'section-1',
    levelId: 'level-1',
    name: 'Introduction',
    order: 1,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  const mockModule = {
    id: 'module-1',
    sectionId: 'section-1',
    moduleType: 'basic_lesson' as const,
    name: 'Basic Greetings',
    order: 1,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  const defaultProps = {
    courseId: 'course-1',
    onLevelSelect: mockOnLevelSelect,
    onSectionSelect: mockOnSectionSelect,
    onModuleSelect: mockOnModuleSelect,
    onLessonClick: mockOnLessonClick,
    onCreateLevel: mockOnCreateLevel,
    onEditLevel: mockOnEditLevel,
    onDeleteLevel: mockOnDeleteLevel,
    onCreateSection: mockOnCreateSection,
    onEditSection: mockOnEditSection,
    onDeleteSection: mockOnDeleteSection,
    onCreateModule: mockOnCreateModule,
    onEditModule: mockOnEditModule,
    onDeleteModule: mockOnDeleteModule,
    onCreateLesson: mockOnCreateLesson,
    onEditLesson: mockOnEditLesson,
    onDeleteLesson: mockOnDeleteLesson,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUseLevelsQuery.mockReturnValue({
      data: { data: [mockLevel], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    mockUseSectionsQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    mockUseModulesQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } },
      isLoading: false,
      isError: false,
      error: null,
    } as any);
  });

  it('should render levels section by default', () => {
    render(
      <HierarchicalNavigator {...defaultProps} />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    expect(screen.getByText('Levels')).toBeInTheDocument();
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('A1')).toBeInTheDocument();
  });

  it('should show loading state for levels', () => {
    mockUseLevelsQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    render(
      <HierarchicalNavigator {...defaultProps} />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should show error state for levels', () => {
    mockUseLevelsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to load levels'),
    } as any);

    render(
      <HierarchicalNavigator {...defaultProps} />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    expect(screen.getByText(/Failed to load levels/i)).toBeInTheDocument();
  });

  it('should call onLevelSelect when level is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <HierarchicalNavigator {...defaultProps} />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    const levelCard = screen.getByText('Beginner').closest('.level-card');
    await user.click(levelCard!);

    expect(mockOnLevelSelect).toHaveBeenCalledWith('level-1');
  });

  it('should show sections when level is selected', () => {
    mockUseSectionsQuery.mockReturnValue({
      data: { data: [mockSection], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(
      <HierarchicalNavigator {...defaultProps} selectedLevel="level-1" />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    expect(screen.getByText('Sections')).toBeInTheDocument();
    expect(screen.getByText('Introduction')).toBeInTheDocument();
  });

  it('should call onSectionSelect when section is clicked', async () => {
    const user = userEvent.setup();
    
    mockUseSectionsQuery.mockReturnValue({
      data: { data: [mockSection], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(
      <HierarchicalNavigator {...defaultProps} selectedLevel="level-1" />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    const sectionCard = screen.getByText('Introduction').closest('.section-card');
    await user.click(sectionCard!);

    expect(mockOnSectionSelect).toHaveBeenCalledWith('section-1');
  });

  it('should show modules when section is selected', () => {
    mockUseSectionsQuery.mockReturnValue({
      data: { data: [mockSection], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    mockUseModulesQuery.mockReturnValue({
      data: { data: [mockModule], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(
      <HierarchicalNavigator 
        {...defaultProps} 
        selectedLevel="level-1" 
        selectedSection="section-1" 
      />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    expect(screen.getByText('Modules')).toBeInTheDocument();
    expect(screen.getByText('Basic Greetings')).toBeInTheDocument();
  });

  it('should call onModuleSelect when module is clicked', async () => {
    const user = userEvent.setup();
    
    mockUseSectionsQuery.mockReturnValue({
      data: { data: [mockSection], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    mockUseModulesQuery.mockReturnValue({
      data: { data: [mockModule], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(
      <HierarchicalNavigator 
        {...defaultProps} 
        selectedLevel="level-1" 
        selectedSection="section-1" 
      />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    const moduleCard = screen.getByText('Basic Greetings').closest('.module-card');
    await user.click(moduleCard!);

    expect(mockOnModuleSelect).toHaveBeenCalledWith('module-1');
  });

  it('should show breadcrumb navigation', () => {
    mockUseSectionsQuery.mockReturnValue({
      data: { data: [mockSection], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(
      <HierarchicalNavigator 
        {...defaultProps} 
        selectedLevel="level-1" 
        selectedSection="section-1" 
      />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    expect(screen.getByText('Course')).toBeInTheDocument();
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    expect(screen.getByText('Introduction')).toBeInTheDocument();
  });

  it('should allow navigation back through breadcrumbs', async () => {
    const user = userEvent.setup();
    
    mockUseSectionsQuery.mockReturnValue({
      data: { data: [mockSection], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(
      <HierarchicalNavigator 
        {...defaultProps} 
        selectedLevel="level-1" 
        selectedSection="section-1" 
      />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    // Click on level breadcrumb to go back
    const levelBreadcrumb = screen.getByText('Beginner');
    await user.click(levelBreadcrumb);

    expect(mockOnLevelSelect).toHaveBeenCalledWith('level-1');
  });

  it('should show add buttons for each level', () => {
    render(
      <HierarchicalNavigator {...defaultProps} />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    expect(screen.getByText(/Add Level/i)).toBeInTheDocument();
  });

  it('should show add section button when level is selected', () => {
    mockUseSectionsQuery.mockReturnValue({
      data: { data: [mockSection], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(
      <HierarchicalNavigator {...defaultProps} selectedLevel="level-1" />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    expect(screen.getByText(/Add Section/i)).toBeInTheDocument();
  });

  it('should show empty state when no levels exist', () => {
    mockUseLevelsQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(
      <HierarchicalNavigator {...defaultProps} />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    expect(screen.getByText(/No levels found/i)).toBeInTheDocument();
    expect(screen.getByText(/Create your first level/i)).toBeInTheDocument();
  });

  it('should show empty state when no sections exist for selected level', () => {
    mockUseSectionsQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 0 } },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(
      <HierarchicalNavigator {...defaultProps} selectedLevel="level-1" />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    expect(screen.getByText(/No sections found/i)).toBeInTheDocument();
  });

  it('should handle selection state correctly', () => {
    render(
      <HierarchicalNavigator {...defaultProps} selectedLevel="level-1" />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    const levelCard = screen.getByText('Beginner').closest('.level-card');
    expect(levelCard).toHaveClass('selected');
  });

  it('should fetch data for correct parent IDs', () => {
    render(
      <HierarchicalNavigator 
        {...defaultProps} 
        selectedLevel="level-1" 
        selectedSection="section-1" 
      />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    expect(mockUseLevelsQuery).toHaveBeenCalledWith('course-1', undefined);
    expect(mockUseSectionsQuery).toHaveBeenCalledWith('level-1', undefined);
    expect(mockUseModulesQuery).toHaveBeenCalledWith('section-1', undefined);
  });
});