
let currentModal = null;

$(document).on('show.bs.modal',(event)=> {
    currentModal = event.target;
});


function showLoginModal() {
    if (currentModal) {
        $(currentModal).modal('hide');
    }
    $('#loginModal').modal('show');
}

function showForgotPassword() {
    if (currentModal) {
        $(currentModal).modal('hide');
    }
    $('#forgotPasswordModal').modal('show');
}


//function handles errors of login/signup/forgot-password
function handleError(target,message) {
    const existingErrorMessages = target.querySelectorAll('p');
    existingErrorMessages.forEach((errMessage) => {
        if(errMessage.id === 'errorMessage'){
            errMessage.remove();
        }
    });
    
    let errMessage = document.createElement('p');
    errMessage.id = 'errorMessage';
    errMessage.innerHTML = message;
    errMessage.style.color = 'red';
    errMessage.style.textDecoration = 'underline'
    target.append(errMessage);
}



//signup
function signUp(e){
    e.preventDefault();
    const userDetails = {
        username: e.target.username.value,
        email: e.target.signupEmail.value,
        phoneNumber: e.target.signupPhone.value,
        password: e.target.signupPassword.value
    }

    axios.post('http://localhost:3000/user/sign-up', userDetails)
    .then((res)=>{
        if(res.status === 201){
           alert(res.data.message);
           showLoginModal(); 
        }
    })
    .catch((err)=>{
        handleError(e.target,err.response.data.message);
    })
}

//login
function login(e) {
    e.preventDefault();
    const {loginEmail, loginPassword} = e.target;

    const loginDetails = {
        email: loginEmail.value, 
        password: loginPassword.value
    }

    axios.post('http://localhost:3000/user/login', loginDetails)
    .then((res) => {
       
        if (res.status == 200) {
            localStorage.setItem('token', res.data.token);
            alert(res.data.message);
            window.location.href = '../views/meetme.html';
        }
        else {
            throw new Error('failed to login')
        }
    })
    .catch(err => {
       handleError(e.target,err.response.data.message);
    })
}


//forgot-password
const resetForm = document.getElementById('resetPasswordForm');
resetForm.addEventListener('submit', (event)=> {
    event.preventDefault();
    resetPassword(event);
});

async function resetPassword(e) {
    const emailInput = document.getElementById('registeredEmail');
    const userInfo = {
        email: emailInput.value
    }
    try{
        const response = await axios.post('http://localhost:3000/password/forgotpassword', userInfo);
        handleError(e.target, response.data.message);
    }
    catch(err){
        handleError(e.target,err.response.data.message);
    }
   

}

