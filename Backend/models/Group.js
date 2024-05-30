const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const Group = sequelize.define('groups', {
    id:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,    
    },

    groupName:{
        type: Sequelize.STRING,
        allowNull: false,
    },

    adminId:{
        type: Sequelize.INTEGER,
        allowNull:false
    },

    totalUsers:{
        type: Sequelize.INTEGER,
        allowNull: false
    }
});


module.exports = Group;