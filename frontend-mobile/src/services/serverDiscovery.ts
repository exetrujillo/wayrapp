import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Server interface representing a WayrApp content server
 */
export interface Server {
  id: string;
  name: string;
  description: string;
  url: string;
  languages: string[];
  region: string;
}

/**
 * Service for discovering and managing WayrApp servers
 */
class ServerDiscoveryService {
  private readonly SERVERS_URL = 'https://raw.githubusercontent.com/wayrapp/servers/main/servers.json';
  private readonly STORAGE_KEY = 'server_url';

  /**
   * Fetches the list of available WayrApp servers
   * Falls back to hardcoded servers if the fetch fails
   */
  async getServerList(): Promise<Server[]> {
    try {
      const response = await axios.get(this.SERVERS_URL);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch server list', error);
      return this.getFallbackServers();
    }
  }

  /**
   * Returns a hardcoded list of servers as a fallback
   */
  private getFallbackServers(): Server[] {
    return [
      {
        id: 'wayr-euskera',
        name: 'WayrApp Euskera',
        description: 'Learn Basque language and culture',
        url: 'https://euskera.wayrapp.com',
        languages: ['eu', 'es', 'fr'],
        region: 'Europe'
      },
      {
        id: 'wayr-quechua',
        name: 'WayrApp Quechua',
        description: 'Preserve and learn Quechua',
        url: 'https://quechua.wayrapp.com',
        languages: ['qu', 'es', 'en'],
        region: 'South America'
      },
      {
        id: 'wayr-guarani',
        name: 'WayrApp Guaraní',
        description: 'Learn Guaraní language',
        url: 'https://guarani.wayrapp.com',
        languages: ['gn', 'es', 'pt-BR'],
        region: 'South America'
      },
      {
        id: 'wayr-nahuatl',
        name: 'WayrApp Nahuatl',
        description: 'Ancient Aztec language preservation',
        url: 'https://nahuatl.wayrapp.com',
        languages: ['nah', 'es', 'en'],
        region: 'North America'
      },
      {
        id: 'wayr-aymara',
        name: 'WayrApp Aymara',
        description: 'Learn Aymara from the Andes',
        url: 'https://aymara.wayrapp.com',
        languages: ['aym', 'es', 'qu'],
        region: 'South America'
      }
    ];
  }

  /**
   * Saves the selected server URL to AsyncStorage
   */
  async saveServerUrl(url: string): Promise<void> {
    await AsyncStorage.setItem(this.STORAGE_KEY, url);
  }

  /**
   * Retrieves the saved server URL from AsyncStorage
   */
  async getServerUrl(): Promise<string | null> {
    return await AsyncStorage.getItem(this.STORAGE_KEY);
  }

  /**
   * Clears the saved server URL from AsyncStorage
   */
  async clearServerUrl(): Promise<void> {
    await AsyncStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Tests the connection to a server
   * Returns true if the server is reachable, false otherwise
   */
  async testServerConnection(url: string): Promise<boolean> {
    try {
      const response = await axios.get(`${url}/api/v1/health`);
      return response.status === 200;
    } catch (error) {
      console.error('Failed to connect to server', error);
      return false;
    }
  }
}

export default new ServerDiscoveryService();