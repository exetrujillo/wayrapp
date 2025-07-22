import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage service for managing persistent data in the app
 */
class StorageService {
  /**
   * Stores a value in AsyncStorage
   */
  async setItem(key: string, value: any): Promise<void> {
    try {
      const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves a value from AsyncStorage
   * If parseJson is true, the value will be parsed as JSON
   */
  async getItem<T>(key: string, parseJson = true): Promise<T | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;
      return parseJson ? JSON.parse(value) : value as unknown as T;
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return null;
    }
  }

  /**
   * Removes a value from AsyncStorage
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  }

  /**
   * Clears all values from AsyncStorage
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  /**
   * Gets all keys from AsyncStorage
   */
  async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  /**
   * Stores authentication data
   */
  async setAuthData(token: string, userId: string): Promise<void> {
    await this.setItem('auth_token', token);
    await this.setItem('user_id', userId);
  }

  /**
   * Clears authentication data
   */
  async clearAuthData(): Promise<void> {
    await this.removeItem('auth_token');
    await this.removeItem('user_id');
  }
}

export default new StorageService();