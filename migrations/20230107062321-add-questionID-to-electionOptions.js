'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("electionOptions", "questionId", {
      type: Sequelize.DataTypes.INTEGER,
      onDelete: "CASCADE",
    });
    await queryInterface.addConstraint("electionOptions", {
      fields: ["questionId"],
      type: "foreign key",
      onDelete: "CASCADE",
      references: {
        table: "electionQuestions",
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
    await queryInterface.removeColumn("electionOptions", "questionId");
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
