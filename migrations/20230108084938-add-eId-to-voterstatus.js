'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("voterStatuses", "eId", {
      type: Sequelize.DataTypes.INTEGER,
    });
    await queryInterface.addConstraint("voterStatuses", {
      fields: ["eId"],
      type: "foreign key",
      references: {
        table: "elections",
        field: "id",
      },
    });
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("voterStatuses", "eId");
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
