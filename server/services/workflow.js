import db from '../db.js';

function getUserRoles(user) {
  const roles = new Set([user.role, ...(user.roles || [])].filter(Boolean));
  if (user.isSuperAdmin) roles.add('super_admin');
  return roles;
}

export async function assertWorkflowTransition({ module, fromStatus, toStatus, action, user }) {
  const transition = await db('workflow_transitions')
    .where({ module, from_state: fromStatus, to_state: toStatus, action })
    .first();

  if (!transition) {
    throw new Error(`Transition not allowed: ${module} ${fromStatus} -> ${toStatus}`);
  }

  if (transition.role_required) {
    const roles = getUserRoles(user);
    if (!roles.has(transition.role_required)) {
      throw new Error(`Transition requires role: ${transition.role_required}`);
    }
  }

  return transition;
}

export async function getWorkflowConfig(moduleName) {
  const states = await db('workflow_states')
    .where({ module: moduleName })
    .orderBy('sequence');
  const transitions = await db('workflow_transitions')
    .where({ module: moduleName })
    .orderBy(['from_state', 'to_state']);

  return { states, transitions };
}
