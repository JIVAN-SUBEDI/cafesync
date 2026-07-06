// const db = require('../config/database.js');

// class BaseModel {
//   constructor(tableName) {
//     this.tableName = tableName;
//   }

//   async findById(id) {
//     const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
//     const result = await db.query(query, [id]);
//     return result.rows[0];
//   }

//   async findAll(conditions = {}, limit = 100, offset = 0) {
//     let query = `SELECT * FROM ${this.tableName}`;
//     const values = [];
//     const whereClauses = [];

//     Object.keys(conditions).forEach((key, index) => {
//       whereClauses.push(`${key} = $${index + 1}`);
//       values.push(conditions[key]);
//     });

//     if (whereClauses.length > 0) {
//       query += ` WHERE ${whereClauses.join(' AND ')}`;
//     }

//     query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
//     values.push(limit, offset);

//     const result = await db.query(query, values);
//     return result.rows;
//   }

//   async create(data) {
//     const keys = Object.keys(data);
//     const values = Object.values(data);
//     const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    
//     const query = `
//       INSERT INTO ${this.tableName} (${keys.join(', ')})
//       VALUES (${placeholders})
//       RETURNING *
//     `;
    
//     const result = await db.query(query, values);
//     return result.rows[0];
//   }

//   async update(id, data) {
//     const keys = Object.keys(data);
//     const values = Object.values(data);
//     const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
    
//     const query = `
//       UPDATE ${this.tableName}
//       SET ${setClause}
//       WHERE id = $${keys.length + 1}
//       RETURNING *
//     `;
    
//     const result = await db.query(query, [...values, id]);
//     return result.rows[0];
//   }

//   async delete(id) {
//     const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
//     const result = await db.query(query, [id]);
//     return result.rows[0];
//   }

//   async count(conditions = {}) {
//     let query = `SELECT COUNT(*) FROM ${this.tableName}`;
//     const values = [];
//     const whereClauses = [];

//     Object.keys(conditions).forEach((key, index) => {
//       whereClauses.push(`${key} = $${index + 1}`);
//       values.push(conditions[key]);
//     });

//     if (whereClauses.length > 0) {
//       query += ` WHERE ${whereClauses.join(' AND ')}`;
//     }

//     const result = await db.query(query, values);
//     return parseInt(result.rows[0].count, 10);
//   }
// }

// module.exports = BaseModel;


// src/models/BaseModel.js
const db = require('../config/database.js');

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
  }

  /* ======================
     FIND BY ID
  ====================== */
  async findById(id) {
    const query = `
      SELECT * 
      FROM ${this.tableName} 
      WHERE id = $1
      LIMIT 1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  /* ======================
     FIND ALL
     Indexed conditions
  ====================== */
  async findAll(conditions = {}, limit = 100, offset = 0) {
    let query = `SELECT * FROM ${this.tableName}`;
    const values = [];
    const whereClauses = [];

    Object.entries(conditions).forEach(([key, value], index) => {
      whereClauses.push(`${key} = $${index + 1}`);
      values.push(value);
    });

    if (whereClauses.length) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    query += ` ORDER BY id DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await db.query(query, values);
    return result.rows;
  }

  /* ======================
     CREATE
     Fast insert
  ====================== */
  async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO ${this.tableName} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING id
    `;
    
    const result = await db.query(query, values);
    return result.rows[0];
  }

  /* ======================
     UPDATE
  ====================== */
  async update(id, data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    
    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}
      WHERE id = $${keys.length + 1}
      RETURNING id
    `;
    
    const result = await db.query(query, [...values, id]);
    return result.rows[0];
  }

  /* ======================
     DELETE
  ====================== */
  async delete(id) {
    const query = `
      DELETE FROM ${this.tableName}
      WHERE id = $1
      RETURNING id
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  /* ======================
     COUNT
     Indexed count
  ====================== */
  async count(conditions = {}) {
    let query = `SELECT COUNT(*)::int FROM ${this.tableName}`;
    const values = [];
    const whereClauses = [];

    Object.entries(conditions).forEach(([key, value], index) => {
      whereClauses.push(`${key} = $${index + 1}`);
      values.push(value);
    });

    if (whereClauses.length) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    const result = await db.query(query, values);
    return result.rows[0].count;
  }
}

module.exports = BaseModel;
