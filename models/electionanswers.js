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
        onDelete: "CASCADE",
      });
      electionAnswers.belongsTo(models.election, {
        foreignKey: "electionId",
        onDelete: "CASCADE",
      });
      electionAnswers.belongsTo(models.electionQuestions, {
        foreignKey: "questionId",
        onDelete: "CASCADE",
      });
      electionAnswers.belongsTo(models.electionOptions, {
        foreignKey: "chosenOption",
        onDelete: "CASCADE",
      });

    }
    static addResponse({ voterId, electionId, questionId, chosenOption }) {
      return this.create({
        vId:voterId,
        electionId:electionId,
        questionId:questionId,
        chosenOption:chosenOption,
      });
    }

    static getAllAnswers(questionId){
      return this.findAll({
        where: {
          questionId,
        }
      })
    }

    static getAllAnswersOptionId(chosenOption){
      return this.findAll({
        where: {
          chosenOption,
        }
      })
    }
  }
  electionAnswers.init({
  }, {
    sequelize,
    modelName: 'electionAnswers',
  });
  return electionAnswers;
};