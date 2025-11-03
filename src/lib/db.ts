import { toast } from "sonner";

// 模拟数据库连接配置
interface DBConfig {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
  initDB: boolean;
  initData: boolean;
}

// 模拟数据库连接状态
interface DBConnection {
  connected: boolean;
  config: DBConfig;
  lastConnected: Date | null;
}

// 数据库服务类
export class DBService {
  private static instance: DBService;
  private connection: DBConnection;
  private models: Record<string, any> = {};
  
  private constructor() {
    // 初始化连接配置
    this.connection = {
      connected: false,
      config: this.loadConfig(),
      lastConnected: null
    };
    
    // 注册数据模型
    this.registerModels();
  }
  
  // 单例模式获取实例
  public static getInstance(): DBService {
    if (!DBService.instance) {
      DBService.instance = new DBService();
    }
    return DBService.instance;
  }
  
  // 加载环境配置
  private loadConfig(): DBConfig {
    // 在真实环境中，这里会从process.env读取配置
    // 这里使用模拟数据
    return {
      host: import.meta.env.DB_HOST || 'localhost',
      port: import.meta.env.DB_PORT || '27017',
      user: import.meta.env.DB_USER || 'admin',
      password: import.meta.env.DB_PASSWORD || 'password',
      database: import.meta.env.DB_NAME || 'steam_bath_db',
      initDB: import.meta.env.INIT_DB !== 'false',
      initData: import.meta.env.INIT_DATA !== 'false'
    };
  }
  
  // 注册数据模型
  private registerModels() {
    // 会员模型
    this.models.members = {
      collection: 'members',
      schema: {
        id: 'string',
        name: 'string',
        phone: 'string',
        card: {
          type: 'object',
          optional: true,
          properties: {
            id: 'string',
            type: 'string',
            totalCount: 'number',
            usedCount: 'number',
            remainingCount: 'number',
            expiryDate: 'string'
          }
        },
        joinDate: 'string',
        balance: 'number',
        status: 'string'
      }
    };
    
    // 充值记录模型
    this.models.recharges = {
      collection: 'recharges',
      schema: {
        id: 'string',
        memberId: 'string',
        memberName: 'string',
        phone: 'string',
        time: 'string',
        amount: 'number',
        balance: 'number',
        paymentMethod: 'string',
        operator: 'string',
        notes: { type: 'string', optional: true }
      }
    };
    
    // 消费记录模型
    this.models.consumptions = {
      collection: 'consumptions',
      schema: {
        id: 'string',
        memberId: 'string',
        memberName: 'string',
        phone: 'string',
        time: 'string',
        service: 'string',
        category: 'string',
        amount: 'number',
        paymentMethod: 'string',
        status: 'string',
        operator: 'string',
        usedCard: 'boolean'
      }
    };
    
    // 次卡类型模型
    this.models.cardTypes = {
      collection: 'cardTypes',
      schema: {
        id: 'string',
        name: 'string',
        description: 'string',
        price: 'number',
        count: 'number',
        validityDays: 'number',
        active: 'boolean'
      }
    };
  }
  
  // 连接数据库
  public connect(): boolean {
    try {
      // 模拟连接过程
      console.log(`连接数据库: ${this.connection.config.host}:${this.connection.config.port}/${this.connection.config.database}`);
      
      // 模拟连接成功
      this.connection.connected = true;
      this.connection.lastConnected = new Date();
      
      // 如果需要初始化数据库且数据库为空
      // 检查是否需要初始化数据库
     if (this.connection.config.initDB && this.isDatabaseEmpty()) {
       this.initializeDatabase();
       toast.info('数据库初始化完成');
     }
     
     toast.success('数据库连接成功');
      return true;
    } catch (error) {
      console.error('数据库连接失败:', error);
      toast.error('数据库连接失败');
      this.connection.connected = false;
      return false;
    }
  }
  
  // 检查数据库是否为空
  private isDatabaseEmpty(): boolean {
    // 检查主要集合是否为空
    const collections = Object.values(this.models).map(m => m.collection);
    return collections.every(collection => {
      const data = localStorage.getItem(collection);
      return !data || JSON.parse(data).length === 0;
    });
  }
  
  // 初始化数据库
  private initializeDatabase() {
    console.log('初始化数据库结构...');
    
    // 为每个模型创建集合(在localStorage中)
    Object.values(this.models).forEach(model => {
      if (!localStorage.getItem(model.collection)) {
        localStorage.setItem(model.collection, JSON.stringify([]));
        console.log(`创建集合: ${model.collection}`);
      }
    });
    
    // 如果需要初始化数据
    if (this.connection.config.initData) {
      this.initializeData();
    }
    
    toast.success('数据库初始化完成');
  }
  
  // 初始化基础数据
  private initializeData() {
    console.log('初始化基础数据...');
    
    // 这里可以添加初始数据
    // 例如: 默认的次卡类型
    const cardTypes = [
      {
        id: 'CT1001',
        name: '月卡',
        description: '30天内有效，不限次数',
        price: 398,
        count: 999,
        validityDays: 30,
        active: true
      },
      {
        id: 'CT1002',
        name: '10次卡',
        description: '10次汗蒸服务',
        price: 198,
        count: 10,
        validityDays: 90,
        active: true
      },
      {
        id: 'CT1003',
        name: '20次卡',
        description: '20次汗蒸服务',
        price: 358,
        count: 20,
        validityDays: 180,
        active: true
      }
    ];
    
    localStorage.setItem('cardTypes', JSON.stringify(cardTypes));
    console.log('初始化次卡类型数据');
  }
  
  // 获取集合数据
  public getCollection(collection: string): any[] {
    if (!this.connection.connected) {
      throw new Error('数据库未连接');
    }
    
    const data = localStorage.getItem(collection);
    return data ? JSON.parse(data) : [];
  }
  
  // 保存集合数据
  public saveCollection(collection: string, data: any[]): void {
    if (!this.connection.connected) {
      throw new Error('数据库未连接');
    }
    
    localStorage.setItem(collection, JSON.stringify(data));
  }
  
  // 获取连接状态
  public getConnectionStatus(): DBConnection {
    return { ...this.connection };
  }
}