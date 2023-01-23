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

      election.hasMany(models.electionQuestions, {
        foreignKey: "electionId",
        onDelete: "CASCADE",
      });

      election.hasMany(models.voterStatus, {
        foreignKey: "eId",
        onDelete: "CASCADE",
      });

      
    }

    static getElections(userId){
      return this.findAll({
        where: {
          userId,
        }
      })
    }

    static async remove(id) {
      return this.destroy({
        where: {
          id
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

    setRunningTrue(){
      return this.update({isRunning: true})
    }

    setRunningFalse(){
      return this.update({isRunning: false})
    }

    markDone(){
      return this.update({isEnded:true})
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