import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetInfo } from '@react-native-community/netinfo';

/**
 * Service for managing offline functionality
 */
class OfflineService {
  private readonly OFFLINE_COURSES_KEY = 'offline_courses';
  private readonly OFFLINE_PROGRESS_KEY = 'offline_progress';

  /**
   * Checks if the device is online
   */
  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  /**
   * Stores a course package for offline use
   */
  async storeCoursePackage(courseId: string, coursePackage: any): Promise<void> {
    try {
      const offlineCourses = await this.getOfflineCourses();
      offlineCourses[courseId] = {
        data: coursePackage,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(this.OFFLINE_COURSES_KEY, JSON.stringify(offlineCourses));
    } catch (error) {
      console.error('Failed to store course package offline', error);
      throw error;
    }
  }

  /**
   * Retrieves a stored course package
   */
  async getCoursePackage(courseId: string): Promise<any | null> {
    try {
      const offlineCourses = await this.getOfflineCourses();
      return offlineCourses[courseId]?.data || null;
    } catch (error) {
      console.error('Failed to retrieve offline course package', error);
      return null;
    }
  }

  /**
   * Gets all stored offline courses
   */
  async getOfflineCourses(): Promise<Record<string, { data: any; timestamp: number }>> {
    try {
      const offlineCoursesJson = await AsyncStorage.getItem(this.OFFLINE_COURSES_KEY);
      return offlineCoursesJson ? JSON.parse(offlineCoursesJson) : {};
    } catch (error) {
      console.error('Failed to get offline courses', error);
      return {};
    }
  }

  /**
   * Stores progress data for offline synchronization
   */
  async storeProgressData(lessonId: string, answers: any[]): Promise<void> {
    try {
      const offlineProgress = await this.getOfflineProgress();
      offlineProgress.push({
        lessonId,
        answers,
        timestamp: Date.now(),
      });
      await AsyncStorage.setItem(this.OFFLINE_PROGRESS_KEY, JSON.stringify(offlineProgress));
    } catch (error) {
      console.error('Failed to store offline progress', error);
      throw error;
    }
  }

  /**
   * Gets all stored offline progress data
   */
  async getOfflineProgress(): Promise<Array<{ lessonId: string; answers: any[]; timestamp: number }>> {
    try {
      const offlineProgressJson = await AsyncStorage.getItem(this.OFFLINE_PROGRESS_KEY);
      return offlineProgressJson ? JSON.parse(offlineProgressJson) : [];
    } catch (error) {
      console.error('Failed to get offline progress', error);
      return [];
    }
  }

  /**
   * Removes a progress item from offline storage
   */
  async removeProgressItem(index: number): Promise<void> {
    try {
      const offlineProgress = await this.getOfflineProgress();
      offlineProgress.splice(index, 1);
      await AsyncStorage.setItem(this.OFFLINE_PROGRESS_KEY, JSON.stringify(offlineProgress));
    } catch (error) {
      console.error('Failed to remove offline progress item', error);
      throw error;
    }
  }

  /**
   * Clears all offline data
   */
  async clearOfflineData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.OFFLINE_COURSES_KEY);
      await AsyncStorage.removeItem(this.OFFLINE_PROGRESS_KEY);
    } catch (error) {
      console.error('Failed to clear offline data', error);
      throw error;
    }
  }
}

export default new OfflineService();