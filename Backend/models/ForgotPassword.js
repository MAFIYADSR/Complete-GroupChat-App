const Sequelize = require('sequelize');
const sequelize = require('../util/database');

const ForgotPassword = sequelize.define('forgotPassword', {
    id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true
    },

    active: Sequelize.BOOLEAN,

});




module.exports = ForgotPassword;