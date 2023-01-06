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
       election.belongsTo(models.Users, {
        foreignKey: "userId",
      });
    }

    static getElections(userId){
      return this.findAll({
        where: {
          userId,
        }
      })
    }

    static async remove(id, userId) {
      return this.destroy({
        where: {
          id,
          userId,
        },
      });
    }

    static addElection({ name, url, userId }) {
      return this.create({
        name: name,
        url: url,
        isRunning: false,
        isEnded: false,
        userId,
      });
    }

    setElectionTitle(val){
      return this.update({name:val})
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