/** Additive and repeatable on both existing databases and fresh installs. */
module.exports = async function sessionVersion(connection) {
  const [columns] = await connection.query(
    "SHOW COLUMNS FROM users LIKE 'session_version'"
  );
  if (!columns.length) {
    await connection.query(
      'ALTER TABLE users ADD COLUMN session_version INT UNSIGNED NOT NULL DEFAULT 0'
    );
  }
};
