const { CronJob } = require('cron');
const { Op } = require('sequelize');
const ArchievedChat = require('../models/ArchievedChat');
const ChatHistory = require('../models/ChatHistory');
const sequelize = require('../util/database');

const job = new CronJob(
    '35 13 * 4 *',
    archeiveChatsAndDeleteOldChats,
    null,
    false,
    'Asia/Kolkata'
);

async function archeiveChatsAndDeleteOldChats() {
    try {
        const transaction = await sequelize.transaction();

        const date = new Date();
        const sevenDaysBefore = date.setDate(new Date().getDate());
       
        const archievedChats = await ChatHistory.findAll({
            attributes: ['id', 'message', 'isImage', 'userId', 'groupId'],
            where: {
                updatedAt: {
                    [Op.lt]: sevenDaysBefore
                }
            }
        });

        try {
            for (const chat of archievedChats) {
                await ArchievedChat.create({
                    id: chat.id,
                    message: chat.message,
                    isImage: chat.isImage,
                    userId: chat.userId,
                    groupId: chat.groupId
                }, {
                    transaction: transaction
                });

                await ChatHistory.destroy({
                    where: { id: chat.id },
                    transaction: transaction
                });
            }

            await transaction.commit();
            console.log('Chats archived and deleted successfully.');

        } 
        catch(err){
            throw new Error('Error in archiving and deleting old chats');
        }
    } 
    catch(err){
        console.log('Error starting transaction:', err.message);
        await transaction.rollback();
    }
}



module.exports = {
    job
};
