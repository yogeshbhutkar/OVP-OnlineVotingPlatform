'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class electionAnswers extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      electionAnswers.belongsTo(models.voterStatus, {
        foreignKey: "vId",
      });
      electionAnswers.belongsTo(models.election, {
        foreignKey: "electionId",
      });
      electionAnswers.belongsTo(models.electionQuestions, {
        foreignKey: "questionId",
      });
      electionAnswers.belongsTo(models.electionOptions, {
        foreignKey: "chosenOption",
      });
    }
  }
  electionAnswers.init({
  }, {
    sequelize,
    modelName: 'electionAnswers',
  });
  return electionAnswers;
};