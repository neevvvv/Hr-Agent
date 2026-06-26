import db from '../db/connection.js';

/**
 * Append an audit log entry.
 */
export async function logAudit({
  actorUserId, entityType, entityId, action,
  field = null, oldValue = null, newValue = null, aiAssisted = false,
}) {
  await db.query(`
    INSERT INTO audit_log
      (actor_user_id, entity_type, entity_id, action, field, old_value, new_value, ai_assisted)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    actorUserId, entityType, entityId, action,
    field, oldValue?.toString() ?? null, newValue?.toString() ?? null, aiAssisted,
  ]);
}