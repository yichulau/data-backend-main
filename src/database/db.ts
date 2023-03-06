import mysql from "mysql2/promise";

import { dbPoolConfig } from "../common";
import DBConnection from "./conn";

class Database {
  #pool;

  constructor() {
    this.#pool = mysql.createPool(dbPoolConfig);
  }

  async getConnection(): Promise<DBConnection> {
    try {
      const conn = await this.#pool.getConnection();
      return new DBConnection(conn);
    }
    catch (err) {
      throw err;
    }
  }

  async query(query: string, data: any[]): Promise<any[]> {
    data.forEach(item => {
      if (typeof item === "string") item.trim();
    });

    try {
      const result = await this.#pool.query(query, data);
      return result;
    }
    catch (err) {
      throw err;
    }
  }
}

export default new Database();