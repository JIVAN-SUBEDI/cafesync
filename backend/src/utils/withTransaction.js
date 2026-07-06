const db = require("../config/database"); // change path to your real db file

async function withTransaction(work) {
  const client = await db.getClient();

  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = withTransaction;