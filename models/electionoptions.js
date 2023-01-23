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
        onDelete: "CASCADE",
      });
      // define association here
    }

    static async removeOption(id) {
      return this.destroy({
        where: {
          id,
        },
      });
    }

    static getOptions(questionId){
      return this.findAll({
        where: {
          questionId,
        }
      })
    }

    setOption(option){
      return this.update({option})
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