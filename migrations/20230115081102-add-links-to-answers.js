'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("electionAnswers", "vId", {
      type: Sequelize.DataTypes.INTEGER,
      onDelete: "CASCADE",
    });
    
    await queryInterface.addConstraint("electionAnswers", {
      fields: ["vId"],
      type: "foreign key",
      onDelete: "CASCADE",
      references: {
        table: "voterStatuses",
        field: "id",
      },
    });

    await queryInterface.addColumn("electionAnswers", "electionId", {
      type: Sequelize.DataTypes.INTEGER,
      onDelete: "CASCADE",
    });
    await queryInterface.addConstraint("electionAnswers", {
      fields: ["electionId"],
      type: "foreign key",
      onDelete: "CASCADE",
      references: {
        table: "elections",
        field: "id",
      },
    });

    await queryInterface.addColumn("electionAnswers", "questionId", {
      type: Sequelize.DataTypes.INTEGER,
      onDelete: "CASCADE",
    });
    await queryInterface.addConstraint("electionAnswers", {
      fields: ["questionId"],
      type: "foreign key",
      onDelete: "CASCADE",
      references: {
        table: "electionQuestions",
        field: "id",
      },
    });

    await queryInterface.addColumn("electionAnswers", "chosenOption", {
      type: Sequelize.DataTypes.INTEGER,
      onDelete: "CASCADE",
      allowNull: false,
    });
    await queryInterface.addConstraint("electionAnswers", {
      fields: ["chosenOption"],
      type: "foreign key",
      onDelete: "CASCADE",
      references: {
        table: "electionOptions",
        field: "id",
      },
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },
)},
  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn("electionAnswers", "vId");
    await queryInterface.removeColumn("electionAnswers", "electionId");
    await queryInterface.removeColumn("electionAnswers", "questionId");
    await queryInterface.removeColumn("electionAnswers", "chosenOption");
  }
};
