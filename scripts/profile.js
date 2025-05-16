document.addEventListener('DOMContentLoaded', function () {
    const currentUser = getCurrentUser();
    
    // Set profile information
    if (currentUser) {
        const avatar = document.querySelector('.account-avatar');
        const name = document.querySelector('.profile-name');
        if (avatar) avatar.textContent = currentUser.displayName.charAt(0);
        if (name) name.textContent = currentUser.displayName;
    }
    
    // Handle logout
    const logoutButton = document.querySelector('.logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', function () {
            logoutUser();
            window.location.href = 'login.html';
        });
    }
    
    //EMAIL MODAL FUNCTIONALITY
    const modal = document.getElementById('change-email-modal');
    const modalOverlay = document.querySelector('.modal-overlay');
    const closeModalBtn = document.querySelector('.close-modal');
    const cancelBtn = document.querySelector('.cancel-button');
    const changeEmailForm = document.getElementById('change-email-form');
    const newEmailInput = document.getElementById('new-email');
    const confirmEmailInput = document.getElementById('confirm-email');
    const emailMatchError = document.getElementById('email-match-error');
    
    function validateEmails() {
        if (newEmailInput && confirmEmailInput && emailMatchError) {
            if (newEmailInput.value !== confirmEmailInput.value) {
                emailMatchError.style.display = 'block';
                confirmEmailInput.classList.add('error-input');
                return false;
            } else {
                emailMatchError.style.display = 'none';
                confirmEmailInput.classList.remove('error-input');
                return true;
            }
        }
        return false;
    }
    
    if (confirmEmailInput) {
        confirmEmailInput.addEventListener('input', validateEmails);
    }
    if (newEmailInput) {
        newEmailInput.addEventListener('input', validateEmails);
    }
    
    function closeModal() {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            if (changeEmailForm) changeEmailForm.reset();
            
            if (emailMatchError) emailMatchError.style.display = 'none';
            if (confirmEmailInput) confirmEmailInput.classList.remove('error-input');
        }
    }
    
    const modifyMailBtn = document.getElementById('modify-mail-button');
    if (modifyMailBtn) {
        modifyMailBtn.addEventListener('click', function() {
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }
    
    // Handle form submission
    if (changeEmailForm) {
        changeEmailForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validateEmails()) {
                return;
            }
            
            const newEmail = newEmailInput.value;
            const password = document.getElementById('password').value;
            
            try {
                const successMessage = document.querySelector('.form-success-message');
                if (successMessage) successMessage.style.display = 'block';
                
                if (changeEmailForm) changeEmailForm.reset();
                
                setTimeout(closeModal, 3000);
            } catch (error) {
                console.error('Failed to update email:', error);
            }
        });
    }
    
    document.getElementById('modify-password-button')?.addEventListener('click', () => {
        alert('Change password functionality would go here');
    });
    
    document.getElementById('support-button')?.addEventListener('click', () => {
        alert('Support functionality would go here');
    });
    
    document.getElementById('delete-profile-button')?.addEventListener('click', function () {
        if (!currentUser) return;
        
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            try {
                deleteAllUserData(currentUser.id);
                deleteUserAccount(currentUser.id);
                alert('Your account has been deleted successfully.');
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Account deletion failed:', error);
                alert('Failed to delete account. Please try again.');
            }
        }
    });
});