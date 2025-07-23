/**
 * Navigation type definitions for the WayrApp Mobile application
 */

// Server Navigator Types
export type ServerStackParamList = {
  ServerSelection: undefined;
  ServerDetails: { serverId: string };
  ManualServerEntry: undefined;
};

// Auth Navigator Types
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Main Navigator Types
export type MainStackParamList = {
  Dashboard: undefined;
  Course: { courseId: string };
  Lesson: { lessonId: string };
  Profile: undefined;
  Settings: undefined;
};

// Combined Root Stack Types
export type RootStackParamList = ServerStackParamList & AuthStackParamList & MainStackParamList;

// Navigation Props Types
export type NavigationProps<T extends keyof RootStackParamList> = {
  navigation: any; // Will be properly typed by React Navigation
  route: {
    params: RootStackParamList[T];
    name: T;
  };
};

// Screen Component Types
export type ServerSelectionScreenProps = NavigationProps<'ServerSelection'>;
export type ServerDetailsScreenProps = NavigationProps<'ServerDetails'>;
export type ManualServerEntryScreenProps = NavigationProps<'ManualServerEntry'>;
export type LoginScreenProps = NavigationProps<'Login'>;
export type RegisterScreenProps = NavigationProps<'Register'>;
export type ForgotPasswordScreenProps = NavigationProps<'ForgotPassword'>;
export type DashboardScreenProps = NavigationProps<'Dashboard'>;
export type CourseScreenProps = NavigationProps<'Course'>;
export type LessonScreenProps = NavigationProps<'Lesson'>;
export type ProfileScreenProps = NavigationProps<'Profile'>;
export type SettingsScreenProps = NavigationProps<'Settings'>;

// Navigation State Types
export interface NavigationState {
  isAuthenticated: boolean;
  hasSelectedServer: boolean;
  currentRoute?: string;
  previousRoute?: string;
}

// Deep Link Types
export interface DeepLinkConfig {
  screens: {
    [K in keyof RootStackParamList]: string;
  };
}

export const DEEP_LINK_CONFIG: DeepLinkConfig = {
  screens: {
    ServerSelection: 'servers',
    ServerDetails: 'servers/:serverId',
    ManualServerEntry: 'servers/manual',
    Login: 'auth/login',
    Register: 'auth/register',
    ForgotPassword: 'auth/forgot-password',
    Dashboard: 'dashboard',
    Course: 'courses/:courseId',
    Lesson: 'lessons/:lessonId',
    Profile: 'profile',
    Settings: 'settings',
  },
};

// Animation Types
export interface TransitionConfig {
  gestureDirection: 'horizontal' | 'vertical';
  transitionSpec: {
    open: {
      animation: 'timing' | 'spring';
      config: {
        duration?: number;
        stiffness?: number;
        damping?: number;
      };
    };
    close: {
      animation: 'timing' | 'spring';
      config: {
        duration?: number;
        stiffness?: number;
        damping?: number;
      };
    };
  };
  cardStyleInterpolator: (props: any) => any;
}

// Navigation Events
export type NavigationEvent = 
  | 'focus'
  | 'blur'
  | 'state'
  | 'beforeRemove'
  | 'tabPress'
  | 'tabLongPress';

export interface NavigationEventData {
  type: NavigationEvent;
  target?: string;
  data?: any;
}