const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const ArchievedChat = sequelize.define('archievedChat', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },

    message: {
        type: Sequelize.TEXT,
        allowNull: false,
    },

    isImage: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
    },

    userId: {
        type: Sequelize.INTEGER
    },

    groupId: {
        type: Sequelize.INTEGER
    }
});


module.exports = ArchievedChat;