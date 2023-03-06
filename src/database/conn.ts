import { PoolConnection } from "mysql2/promise";

export default class DBConnection {
  #conn;

  constructor(conn: PoolConnection) {
    this.#conn = conn;
  }

  async startTrxn (): Promise<void> {
    try {
      await this.#conn.beginTransaction();
      return;
    }
    catch (err) {
      throw err;
    }
  }

  async query (query: string, data: any[]): Promise<any[]> {
    data.forEach(item => {
      if (typeof item === "string") item.trim();
    });

    try {
      const result = await this.#conn.query(query, data);
      return result;
    }
    catch (err) {
      throw err;
    }
  }

  async commit (): Promise<void> {
    try {
      await this.#conn.commit();
      return;
    }
    catch (err) {
      throw err;
    }
  }

  async rollback (): Promise<void> {
    try {
      await this.#conn.rollback();
      return;
    }
    catch (err) {
      throw err;
    }
  }

  release (): void {
    return this.#conn.release();
  }
}