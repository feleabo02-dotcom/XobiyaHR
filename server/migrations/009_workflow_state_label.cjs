exports.up = async function (knex) {
  const hasLabel = await knex.schema.hasColumn('workflow_states', 'label');
  if (!hasLabel) {
    await knex.schema.alterTable('workflow_states', (t) => {
      t.string('label', 100);
    });
  }
};

exports.down = async function (knex) {
  const hasLabel = await knex.schema.hasColumn('workflow_states', 'label');
  if (hasLabel) {
    await knex.schema.alterTable('workflow_states', (t) => {
      t.dropColumn('label');
    });
  }
};
