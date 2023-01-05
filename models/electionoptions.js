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
      // define association here
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