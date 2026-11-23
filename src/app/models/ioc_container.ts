import { Database, MockDatabase } from './database';

export class IoCContainer {
  private static instance: IoCContainer | null = null;
  private readonly database: Database;

  private constructor() {
    this.database = new MockDatabase();
  }

  static getInstance(): IoCContainer {
    if (!IoCContainer.instance) {
      IoCContainer.instance = new IoCContainer();
    }

    return IoCContainer.instance;
  }

  getDatabase(): Database {
    return this.database;
  }
}

export const iocContainer = IoCContainer.getInstance();

export default function IoCModule() {
  return null;
}
