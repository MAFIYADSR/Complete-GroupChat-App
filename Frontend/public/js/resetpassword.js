function validateForm(event){
    const newpassword = document.getElementById('newpassword').value;
    const confirmpassword = document.getElementById('confirmpassword').value;

    if(newpassword !== confirmpassword){
        alert('password do not match, PLease enter the matching passwords!');
        event.preventDefault();
    }
}