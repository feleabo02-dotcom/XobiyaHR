import db from '../db.js';

export async function logAudit({ companyId, userId, action, tableName, recordId, oldData, newData }) {
  return db('audit_logs').insert({
    company_id: companyId,
    user_id: userId || null,
    action,
    table_name: tableName,
    record_id: String(recordId),
    old_data: oldData ? JSON.stringify(oldData) : null,
    new_data: newData ? JSON.stringify(newData) : null,
  });
}

export async function logStatusChange({ companyId, refType, refId, fromStatus, toStatus, userId, notes }) {
  return db('status_history').insert({
    company_id: companyId,
    ref_type: refType,
    ref_id: String(refId),
    from_status: fromStatus || null,
    to_status: toStatus,
    changed_by: userId || null,
    notes: notes || null,
  });
}

export async function logActivity({ companyId, userId, action, refType, refId, details }) {
  return db('activity_logs').insert({
    company_id: companyId,
    user_id: userId || null,
    action,
    ref_type: refType,
    ref_id: String(refId),
    details: details || null,
  });
}
