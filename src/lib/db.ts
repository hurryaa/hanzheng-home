import { toast } from 'sonner';
import apiClient from './apiClient';
import { cloneDeep } from './helpers';

interface DBConnection {
  connected: boolean;
  lastConnected: Date | null;
  error?: string;
}

type CollectionName =
  | 'members'
  | 'recharges'
  | 'consumptions'
  | 'cardTypes'
  | 'systemSettings'
  | 'accounts'
  | 'operationLogs'
  | 'rolePermissions'
  | 'staffMembers'
  | 'teamGroups'
  | 'branchSettings';

type CollectionCache = Partial<Record<CollectionName, unknown>>;

const KNOWN_COLLECTIONS: CollectionName[] = [
  'members',
  'recharges',
  'consumptions',
  'cardTypes',
  'systemSettings',
  'accounts',
  'operationLogs',
  'rolePermissions',
  'staffMembers',
  'teamGroups',
  'branchSettings'
];

const persistQueue = new Map<CollectionName, Promise<void>>();

export class DBService {
  private static instance: DBService;
  private connection: DBConnection;
  private cache: CollectionCache;

  private constructor() {
    this.connection = {
      connected: false,
      lastConnected: null
    };
    this.cache = {};
  }

  public static getInstance(): DBService {
    if (!DBService.instance) {
      DBService.instance = new DBService();
    }
    return DBService.instance;
  }

  public async connect(force = false): Promise<void> {
    if (this.connection.connected && !force) {
      return;
    }

    try {
      const response = await apiClient.bootstrap();
      const data = response?.data ?? {};

      KNOWN_COLLECTIONS.forEach((collection) => {
        const value = data[collection];
        this.cache[collection] = cloneDeep(Array.isArray(value) || typeof value === 'object' ? value : []);
      });

      this.connection = {
        connected: true,
        lastConnected: new Date()
      };

      toast.success('数据库连接成功');
    } catch (error) {
      console.error('无法连接到数据库服务:', error);
      this.connection = {
        connected: false,
        lastConnected: null,
        error: error instanceof Error ? error.message : '未知错误'
      };
      toast.error('数据库连接失败，请检查服务器配置');
      throw error;
    }
  }

  public getConnectionStatus(): DBConnection {
    return { ...this.connection };
  }

  public isConnected(): boolean {
    return this.connection.connected;
  }

  public getCollection<T = unknown>(collection: CollectionName): T {
    if (!this.connection.connected) {
      throw new Error('数据库未连接');
    }

    if (!(collection in this.cache)) {
      this.cache[collection] = [];
    }

    return cloneDeep(this.cache[collection]) as T;
  }

  public saveCollection(collection: CollectionName, data: unknown): void {
    if (!this.connection.connected) {
      throw new Error('数据库未连接');
    }

    this.cache[collection] = cloneDeep(data);
    this.persist(collection);
  }

  public clearCollection(collection: CollectionName): void {
    if (!this.connection.connected) {
      throw new Error('数据库未连接');
    }

    this.cache[collection] = [];
    this.persist(collection);
  }

  public async refreshCollection(collection: CollectionName): Promise<void> {
    const response = await apiClient.getCollection(collection);
    const data = response?.data ?? [];
    this.cache[collection] = cloneDeep(data);
  }

  public getKnownCollections(): CollectionName[] {
    return [...KNOWN_COLLECTIONS];
  }

  public clearAll(): void {
    KNOWN_COLLECTIONS.forEach((collection) => {
      this.cache[collection] = [];
      this.persist(collection);
    });
  }

  private persist(collection: CollectionName) {
    const pending = persistQueue.get(collection);
    if (pending) {
      return;
    }

    const promise = apiClient
      .setCollection(collection, this.cache[collection])
      .catch((error) => {
        console.error(`同步集合 ${collection} 失败:`, error);
        toast.error('数据同步失败，请检查网络连接');
        this.connection.error = error instanceof Error ? error.message : '数据同步失败';
      })
      .finally(() => {
        persistQueue.delete(collection);
      });

    persistQueue.set(collection, promise);
  }
}

export type { CollectionName };
