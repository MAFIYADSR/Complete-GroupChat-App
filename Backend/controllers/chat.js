const { Sequelize } = require('sequelize');
const ChatHistory = require('../models/ChatHistory')
const User = require('../models/User');
const { Op } = require('sequelize');
const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const S3service = require('../services/s3service');
const sequelize = require('../util/database');
const { json } = require('body-parser');
require('dotenv').config();

exports.postMessage = async (req, res) => {
    try {
        const user = req.user;
        const { message, groupId } = req.body;
        console.log(`>>>>>>>>>${user.id}`)
        const mssgResponse = await ChatHistory.create({ message: message, userId: user.id, groupId: groupId })

        if (!message) {
            throw new Error('Something wrong in creating history')
        }

        // console.log(mssgResponse.message);
        const messageDetails = [
            {
                id: mssgResponse.id,
                message: mssgResponse.message,
                isImage: mssgResponse.isImage,
                groupId: mssgResponse.groupId,
                user: {
                    username: user.username,
                    id: user.id
                }
            }
        ]
        res.status(201).json({ success: true, messageDetails: messageDetails });
    }
    catch (err) {
        res.status(500).json(err.message || 'Something went wrong')
    }
}



exports.getMessages = async (req, res) => {
    try {
        const lastMessageId = req.query.lastMessageId;
        const { groupId } = req.params;


        // console.log(`>>>>>>>>>>>lastmessageid = ${lastMessageId}`)
        let messages;

        if (!lastMessageId || lastMessageId == -1) {    //I have to work here
            messages = await ChatHistory.findAll({
                attributes: ['id', 'message', 'isImage', 'groupId'],
                where: {
                    groupId: Number(groupId)
                },
                include: [{
                    model: User,
                    attributes: ['id', 'username']
                }],
                order: [['updatedAt', 'ASC']]
            });
            // console.log(messages)

            res.status(200).json(messages);


        }
        else {

            
            messages = await ChatHistory.findAll({
                attributes: ['id', 'message', 'isImage', 'groupId'],
                where: {
                    groupId: Number(groupId),
                    id: {
                        [Sequelize.Op.gt]: Number(lastMessageId) 
                    }
                },
                include: [{
                    model: User,
                    attributes: ['id', 'username']
                }],
                order: [['updatedAt', 'ASC']]
            });
            // messages = json(messages);
            console.log(messages)
            res.status(200).json(messages);

        }


    

    }
    catch (err) {
        res.status(500).json(err.message || 'Something went wrong');
    }
};


exports.getUsers = async (req, res) => {
    try {
        const users = await User.findAll(
            {
                attributes: ['id', 'username'],
                where: {
                    id: {
                        [Op.not]: req.user.id
                    }
                }
            });
        if (!users) {
            throw new Error('Error in fetching Users')
        }

        res.status(200).json(users);
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
}



exports.createGroup = async (req, res) => {
    try {
        const user = req.user;
        const { userIds, groupName } = req.body;

        if (!userIds || userIds.length == 0) {
            return res.status(400).json({ message: 'Bad request.Please add users' });
        }

        userIds.push(user.id);
        const totalUsers = userIds.length;

        const group = await user.createGroup({ groupName: groupName, adminId: user.id, totalUsers: totalUsers });

        if (!group) {
            throw new Error('error in group creation');
        }

        const setUsers = await group.addUsers(userIds);
        res.status(201).json({ group, message: 'Group creation is successfull' })
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}


exports.getCurrentUserGroups = async (req, res) => {
    try {
        const groups = await req.user.getGroups();
        if (groups) {
            return res.status(200).json({ succes: true, groups });
        }
        throw new Error('Cannot fetch the groups');
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}


exports.fetchGroupDetails = async (req, res) => {
    try {
        const user = req.user;
        const { groupId } = req.params;

        let group = await user.getGroups({ where: { id: groupId } });
        group = group[0];
        const users = await group.getUsers();

        res.status(200).json({ succes: true, group, users });
    }
    catch (err) {
        console.log(err);
    }

}


exports.getUsersNotInGroup = async (req, res) => {
    try {
        const { groupId } = req.query;
        const groupUserIds = await GroupMember.findAll({
            attributes: ['userId'],
            where: { groupId: groupId }
        });

        const nonMembers = await User.findAll({
            attributes: ['id', 'username'],
            where: {
                id: {
                    [Op.notIn]: groupUserIds.map(groupUserId => groupUserId.userId)
                }
            }
        });

        res.status(200).json(nonMembers);
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}


exports.updateGroup = async (req, res) => {
    try {
        const { userIds, groupName, groupId } = req.body;

        if (!userIds || userIds.length == 0) {
            return res.status(400).json({ message: 'Bad request.Please add users' });
        }

        const group = await Group.findByPk(groupId);
        Group.update({ groupName: groupName }, { where: { id: groupId } });

        await group.setUsers(null);

        await group.addUsers(userIds);

        res.status(201).json({ message: 'updated successfully' })
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}


exports.imageHandler = async (req, res) => {
    try {
        const user = req.user;
        const { groupId } = req.body;
        const imageFile = req.file;

        const fileName = `chat-images/group${groupId}/user${user.id}/${Date.now()}-${imageFile.originalname}`;
        const fileUrl = await S3service.uploadToS3(imageFile.buffer, fileName);

        const mssgResponse = await user.createChatHistory({
            message: fileUrl,
            isImage: true,
            groupId
        });

        // console.log(mssgResponse);
        const messageDetails = [
            {
                id: mssgResponse.id,
                message: mssgResponse.message,
                isImage: mssgResponse.isImage,
                user: {
                    username: user.username,
                    id: user.id
                }
            }
        ]

        res.status(201).json({ success: true, messageDetails: messageDetails });

    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}
