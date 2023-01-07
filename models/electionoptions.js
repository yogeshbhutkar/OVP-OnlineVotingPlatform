'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class electionOptions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      electionOptions.belongsTo(models.electionQuestions, {
        foreignKey: "questionId",
        onDelete: "CASCADE",
      });
      electionOptions.hasMany(models.electionAnswers, {
        foreignKey: "chosenOption",
      });
      // define association here
    }

    static getOptions(questionId){
      return this.findAll({
        where: {
          questionId,
        }
      })
    }

    static addOptions({ option, questionId }) {
      return this.create({
        option,
        questionId,
      });
    }
  }
  electionOptions.init({
    option: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'electionOptions',
  });
  return electionOptions;
};