const Sequelize = require('sequelize');
const sequelize = require('../util/database');


const ChatHistory = sequelize.define('chatHistory', {
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
    }

});


module.exports = ChatHistory;