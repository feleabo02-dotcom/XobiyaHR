exports.up = function (knex) {
  return knex.schema.alterTable('departments', (t) => {
    t.foreign('manager_id').references('workers.id').onDelete('SET NULL');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('departments', (t) => {
    t.dropForeign('manager_id');
  });
};
