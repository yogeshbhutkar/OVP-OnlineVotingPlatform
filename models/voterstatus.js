'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class voterStatus extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      voterStatus.belongsTo(models.election, {
        foreignKey: "eId",
      });
      // define association here
    }
    static addVoter({ id, password, eId}) {
      return this.create({
        id,
        role:"voter",
        password,
        status:"false",
        eId
      });
    }
  }
  voterStatus.init({
    id: {type:DataTypes.STRING,
      primaryKey: true
    },
    role: DataTypes.STRING,
    password: DataTypes.STRING,
    status: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'voterStatus',
  });
  return voterStatus;
};