
const mssgBox = document.getElementById('chatContainer');
const imageInput = document.getElementById('fileInput');
// const socket = io();
const socket = io('http://localhost:3000');

const token = localStorage.getItem('token');

socket.on('message', async (mssgDetails, groupId) => {
    const user = await getCurrentUser();
    const currentGroup = document.getElementById('groupId').value;

    updateLocalStorage(mssgDetails.data.messageDetails);
    if (currentGroup === groupId) {
        showOnScreen(mssgDetails.data.messageDetails[0], user.data.userId);
    }
});


socket.on('groupUpdates', (updatedGroupDetails) => {
    updateAllUsers(updatedGroupDetails);
})

socket.on('groupCreation', async (groupDetails, groupId, flag) => {
    const user = await getCurrentUser();
    groupDetails.userIds.forEach((userId) => {
        if (userId == user.data.userId) {
            renderGroupOnScreen(groupDetails.groupName, groupId, flag);
        }
    })

})


//EventListeners
window.addEventListener('DOMContentLoaded', async () => {
    getMygroups();

});

imageInput.addEventListener('change', imageFileHandler);

mssgBox.addEventListener('scroll', scrollHandler);


function openGroupModal() {
    $('#createGroup').modal('show');
}

function closeGroupModal() {
    $('#createGroupForm')[0].reset();
    $('#createGroup').modal('hide');
}

function openEditGroupModal() {
    $('#editGroup').modal('show');
}

function closeEditGroupModal() {
    $('#editGroup').modal('hide');
}


async function updateAllUsers(groupDetails) {
    const groupToUpdate = document.getElementById(`group${groupDetails.groupId}`); //set in 304
    const editBtn = document.getElementById(`edit${groupDetails.groupId}`) //set in 226
    const user = await getCurrentUser();
    const updatedMemberIds = groupDetails.userIds;

    if (updatedMemberIds.includes(user.data.userId.toString())) {
        if (!groupToUpdate) {
            renderGroupOnScreen(groupDetails.groupName, groupDetails.groupId, groupDetails.adminId == user.data.userId);
            return;
        }
        groupToUpdate.textContent = '';
        groupToUpdate.textContent = groupDetails.groupName;
        return;
    }

    const currentOpenGroup = document.getElementById('groupId').value;

    if (currentOpenGroup) {
        if (currentOpenGroup == groupDetails.groupId) {
            document.getElementById('chatContainer').style.display = 'none';
        }
    }
    groupToUpdate.remove();

    if (editBtn) {
        editBtn.remove();
    }
}



async function imageFileHandler() {
    try {
        const groupId = document.getElementById('groupId').value;
        const file = imageInput.files[0];

        const formData = new FormData();
        formData.append('imageFile', file);
        formData.append('groupId', groupId);

        const mssgDetails = await axios.post('http://localhost:3000/chat/upload', formData, { headers: { 'Authorization': token } });

        socket.emit('message', mssgDetails, groupId);

    }
    catch (err) {
        console.error(err);
    }

}





async function createGroup(e) {
    try {
        e.preventDefault();
        const form = e.target;
        const selectedCheckedBoxes = form.querySelectorAll('input[type="checkbox"]:checked');

        if (!selectedCheckedBoxes || selectedCheckedBoxes.length == 0) {
            alert('please add the users');
            return;
        }
        const userIds = Array.from(selectedCheckedBoxes).map((checkbox) => {
            return checkbox.value;
        });

        const groupName = e.target.groupName.value;

        const groupDetails = {
            userIds: userIds,
            groupName: groupName
        }
        const response = await axios.post('http://localhost:3000/chat/create-group', groupDetails, { headers: { 'Authorization': token } });
        //if the current user is admin reponse should also contain boolean values of it 
        //(this is wrong, if user has created group then he's the admin);

        // socket.emit('groupCreation', )
        renderGroupOnScreen(response.data.group.groupName, response.data.group.id, true);
        closeGroupModal();
        socket.emit('groupCreation', groupDetails, response.data.group.id, false)
    }
    catch (err) {
        console.error(err.message)
    }
}


async function getMygroups() {
    try {
        const response = await Promise.all(
            [getCurrentUser(), axios.get('http://localhost:3000/chat/get-mygroups', { headers: { 'Authorization': token } })]
        );

        const userId = response[0].data.userId;
        const groupsArr = response[1].data.groups;

        groupsArr.forEach((group) => {
            if (group.adminId === userId) {
                renderGroupOnScreen(group.groupName, group.id, true);
            }
            else {
                renderGroupOnScreen(group.groupName, group.id, false);
            }
        })
    }
    catch (err) {
        alert(err.message);
    }
}


function renderGroupOnScreen(groupName, groupId, isAdmin) {
    const newGroup = document.createElement('div');
    newGroup.className = 'group';
    newGroup.id = `group${groupId}`
    newGroup.textContent = groupName;
    document.getElementById('dynamicGroupsContainer').appendChild(newGroup);

    if (isAdmin) {
        createEditButton(groupId);
    }

    newGroup.addEventListener('click', () => {
        newGroupHandler(groupId);
    });
}


function newGroupHandler(groupId) {
    document.getElementById('groupId').value = groupId;
    // console.log(groupId)

    document.getElementById('chatContainer').style.display = 'none';
    const sendMssgForm = document.getElementsByClassName('send-container');

    //FETCH
    getChat(groupId)
        .then(([userObject, messageObject]) => {
            const chatContainer = document.getElementById('chatContainer');
            chatContainer.innerHTML = '';
            chatContainer.style.display = 'block';
            sendMssgForm[0].style.display = 'flex';
            sendMssgForm[1].style.display = 'flex';

            messageObject.forEach((mssgObj) => {
                showOnScreen(mssgObj, userObject.data.userId);
            })
        })
}




function createEditButton(groupId) {

    const editBtn = document.createElement('button');
    editBtn.innerHTML = 'Edit';
    editBtn.className = 'group';
    editBtn.id = `edit${groupId}`;
    editBtn.style.backgroundColor = 'green';
    editBtn.addEventListener('mouseover', () => {
        editBtn.style.backgroundColor = 'lightgray';
    });
    editBtn.addEventListener('mouseout', () => {
        editBtn.style.backgroundColor = 'green';
    });
    editBtn.style.outline = 'none'
    document.getElementById('dynamicGroupsContainer').appendChild(editBtn);

    editBtn.addEventListener('click', async () => {
        document.getElementById('editGroupId').value = groupId;
        const [groupDetails, nonMembers] = await getTheGroupInfo(groupId);

        insertGroupDetails(groupDetails.data, nonMembers.data);
    });
}





function getTheGroupInfo(groupId) {
    return new Promise(async (resolve, reject) => {
        try {
            const [groupDetails, nonMembers] = await Promise.all(
                [
                    axios.get(`http://localhost:3000/chat/get-group/${groupId}`, { headers: { 'Authorization': token } }),
                    axios.get(`http://localhost:3000/chat/get-nonmembers?groupId=${groupId}`, { headers: { 'Authorization': token } })
                ]);
            const response = [groupDetails, nonMembers]
            resolve(response);
        }
        catch (err) {
            console.error(err.message);
            alert('Some problem in fetching group details');
        }
    })
}


function insertGroupDetails(groupObj, nonMembersObj) {
    const groupName = document.getElementById('editGroupName')
    groupName.value = groupObj.group.groupName;

    const membersList = document.getElementById('editMembersList');
    membersList.innerHTML = '';

    groupObj.users.forEach((user) => {
        const groupMember = document.createElement('li');
        groupMember.innerHTML = `<li class="list-group-item justify-content-between d-flex" style="display: block;">
        <div class="d-flex  align-items-center justify-content-between">
        <h6><strong class="mb-1">${user.username}</strong></h6>
        </div>
        <input type="checkbox" class="form-check-inline" name="users" value=${user.id} checked>
        </li>`
        membersList.appendChild(groupMember);
    });

    nonMembersObj.forEach((user) => {
        const nonMembers = document.createElement('li');
        nonMembers.innerHTML = `<li class="list-group-item justify-content-between d-flex" style="display: block;">
    <div class="d-flex  align-items-center justify-content-between">
    <h6><strong class="mb-1">${user.username}</strong></h6>
    </div>
    <input type="checkbox" class="form-check-inline" name="users" value=${user.id}>
    </li>`
        membersList.appendChild(nonMembers);
    })

    openEditGroupModal();
}


async function editGroupDetails(e) {
    try {
        e.preventDefault();
        const groupId = document.getElementById('editGroupId').value

        const form = e.target;
        const selectedCheckedBoxes = form.querySelectorAll('input[type="checkbox"]:checked');

        if (!selectedCheckedBoxes || selectedCheckedBoxes.length == 0) {
            alert('please add the users');
            return;
        }
        const userIds = Array.from(selectedCheckedBoxes).map((checkbox) => {
            return checkbox.value;
        });

        const groupName = e.target.editGroupName.value;
        const user = await getCurrentUser();

        const updatedGroupDetails = {
            userIds: userIds,
            groupName: groupName,
            groupId: groupId,
            adminId: user.data.userId
        }


        const response = await axios.post('http://localhost:3000/chat/update-group', updatedGroupDetails, { headers: { 'Authorization': token } })
        if (response.status === 201) {
            closeEditGroupModal();
            socket.emit('groupUpdates', updatedGroupDetails);
        }

    }
    catch {
        alert('updation api not working');
    }

}



async function fetchMembers() {
    try {
        const users = await axios.get('http://localhost:3000/chat/get-users', { headers: { 'Authorization': token } });

        if (users.status === 200) {
            document.getElementById('membersList').innerHTML = '';
            users.data.forEach((user) => {
                addUsersToCreateGroupModal(user);
            });

            openGroupModal();
        }
    }
    catch (err) {
        alert('something went wrong')
    }
}



function addUsersToCreateGroupModal(user) {
    const memberList = document.getElementById('membersList');

    const member = document.createElement('li');
    member.innerHTML = `<li class="list-group-item justify-content-between d-flex" style="display: block;">
                    <div class="d-flex  align-items-center justify-content-between">
                    <h6><strong class="mb-1">${user.username}</strong></h6>
                    </div>
                    <input type="checkbox" class="form-check-inline" name="users" value=${user.id}>
                    </li>`

    memberList.appendChild(member);
}




function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('messages')

    window.location.href = '../views/index.html';
}



function saveMessage(e) {
    e.preventDefault();
    const groupId = e.target.groupId.value;
    const message = document.getElementById('mssgInput').value;

    axios.post('http://localhost:3000/chat/message', { message: message, groupId: groupId }, { headers: { "Authorization": token } })
        .then((mssgDetails) => {
            socket.emit('message', mssgDetails, groupId);
        })
        .catch((err) => {
            console.error(err);
        })
}

function scrollHandler() {
    const isUserAtTop = mssgBox.scrollTop === 0;
    if (isUserAtTop) {
        console.log('user is at top of page')
    }
}



async function getChat(groupId) {

    let oldMessagesArray = JSON.parse(localStorage.getItem('messages'));
    if (oldMessagesArray) {
        if (oldMessagesArray.length == 0) {
            localStorage.removeItem('messages')

        }
    }

    oldMessagesArray = JSON.parse(localStorage.getItem('messages'));


    let groupIdFromLocal;

    if (oldMessagesArray) {

        if (oldMessagesArray.length > 0) {
            groupIdFromLocal = oldMessagesArray[oldMessagesArray.length - 1].groupId;
        }
        else {
            groupIdFromLocal = -1;

        }
    }

    // console.log(groupIdFromLocal)
    groupIdFromLocal = Number(groupIdFromLocal)

    if (groupIdFromLocal || groupIdFromLocal !== -1) {
        if (groupIdFromLocal !== groupId) {
            localStorage.removeItem('messages')

        }
    }


    oldMessagesArray = JSON.parse(localStorage.getItem('messages'));


    let lastMessageId;
    if (oldMessagesArray) {
        lastMessageId = oldMessagesArray[oldMessagesArray.length - 1].id;
    }
    else {
        lastMessageId = -1;
    }

    return new Promise(async (resolve, reject) => {
        try {
            if (!lastMessageId || lastMessageId == -1) {
                const response = await axios.all(
                    [getCurrentUser(), axios.get(`http://localhost:3000/chat/messages/${groupId}?lastMessageId=${lastMessageId}`, { headers: { "Authorization": token } })]

                );
                let newMessages = response[1].data;
                // console.log(newMessages);
                updateLocalStorage(newMessages);

                let newresponse = [await getCurrentUser(), newMessages]

                resolve(newresponse)
            }
            else {

                const response = await axios.all(
                    [getCurrentUser(), axios.get(`http://localhost:3000/chat/messages/${groupId}?lastMessageId=${lastMessageId}`, { headers: { "Authorization": token } })]

                );
                let newMessages = response[1].data;
                oldMessagesArray = JSON.parse(localStorage.getItem('messages'));


                const allmessages = oldMessagesArray.concat(newMessages);

                let newresponse = [await getCurrentUser(), allmessages]




                resolve(newresponse)

            }


        }
        catch (err) {
            console.error(err.message);
        }
    })


}


function updateLocalStorage(newMessagesArray) {

    let oldMessagesArray = JSON.parse(localStorage.getItem('messages'));

    if (oldMessagesArray) {
        newMessagesArray = [...oldMessagesArray, ...newMessagesArray];
    }
    else {
        newMessagesArray = [...newMessagesArray];
    }

    if (newMessagesArray.length > 12) {
        const mssgesLength = newMessagesArray.length;
        newMessagesArray = newMessagesArray.slice(mssgesLength - 12, mssgesLength);
    }

    localStorage.setItem('messages', JSON.stringify(newMessagesArray));
}


function showOnScreen(mssgObj, currentUserId) {

    if (mssgObj.isImage) {
        const div = document.createElement('div');
        const imageElement = document.createElement('img');
        if (mssgObj.user.id === currentUserId) {
            div.className = 'message left';
            div.innerHTML = `<b>You:</b>`;
            imageElement.id = 'image-container';
            imageElement.src = mssgObj.message;
            div.appendChild(imageElement);
            // Append the image element to the image container

            mssgBox.appendChild(div);
        }
        else {
            div.className = 'message right';
            div.innerHTML = `<b>${mssgObj.user.username}:</b>`;
            imageElement.id = 'image-container';
            imageElement.src = mssgObj.message;
            div.appendChild(imageElement);
            // Append the image element to the image container

            mssgBox.appendChild(div);
        }

    }
    else {
        const div = document.createElement('div');

        if (mssgObj.user.id === currentUserId) {
            div.className = 'message left';
            div.innerHTML = `<b>You:</b> ${mssgObj.message}`
        }
        else {
            div.className = 'message right';
            div.innerHTML = `<b>${mssgObj.user.username}:</b> ${mssgObj.message}`
        }

        mssgBox.appendChild(div);
        document.getElementById('mssgInput').value = null;
    }

    mssgBox.scrollTop = mssgBox.scrollHeight;
}




async function getCurrentUser() {
    try {
        return new Promise(async (resolve, reject) => {
            const user = await axios.get('http://localhost:3000/chat/get-user', { headers: { "Authorization": token } });
            resolve(user);
        })
    }
    catch (err) {
        console.log(err);
    }
}