'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class electionQuestions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      electionQuestions.belongsTo(models.election, {
        foreignKey: "electionId",
      });
    }

    static addQuestion({ question, description, electionId }) {
      return this.create({
        question,
        description,
        electionId,
      });
    }

    static getElectionQuestions(electionId){
      return this.findAll({
        where: {
          electionId,
        }
      })
    }

  }

  

  electionQuestions.init({
    question: DataTypes.STRING,
    description: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'electionQuestions',
  });
  return electionQuestions;
};