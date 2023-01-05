'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class election extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
       election.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }
  }
  election.init({
    name: DataTypes.STRING,
    url: DataTypes.STRING,
    isRunning: DataTypes.BOOLEAN,
    isEnded: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'election',
  });
  return election;
};