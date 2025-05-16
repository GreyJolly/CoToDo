document.addEventListener('DOMContentLoaded', function () {
    const currentUser = getCurrentUser();
    
    // Set profile information
    if (currentUser) {
        const avatar = document.querySelector('.account-avatar');
        const name = document.querySelector('.profile-name');
        if (avatar) avatar.textContent = currentUser.displayName.charAt(0);
        if (name) name.textContent = currentUser.displayName;
    }
    
    // Handle logout with popup
    const logoutButton = document.querySelector('.logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', function () {
            // Show the logout confirmation popup
            const popup = document.getElementById('logout-confirm-popup');
            if (popup) {
                popup.style.display = 'flex';
                
                // Setup event listeners for the buttons
                popup.querySelector('.cancel-popup-button').onclick = function () {
                    popup.style.display = 'none';
                };

                popup.querySelector('.confirm-button').onclick = function () {
                    try {
                        logoutUser();
                        popup.style.display = 'none';
                        window.location.href = 'login.html';
                    } catch (error) {
                        console.error('Logout failed:', error);
                        popup.style.display = 'none';
                    }
                };

                // Close popup when clicking outside
                popup.onclick = function (e) {
                    if (e.target === popup) {
                        popup.style.display = 'none';
                    }
                };
            }
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
    
    // CHANGE PASSWORD MODAL
    const passwordModal = document.getElementById('change-password-modal');
    const passwordModalOverlay = passwordModal?.querySelector('.modal-overlay');
    const passwordCloseModalBtn = passwordModal?.querySelector('.close-modal');
    const passwordCancelBtn = passwordModal?.querySelector('.cancel-button');
    const changePasswordForm = document.getElementById('change-password-form');
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const passwordMatchError = document.getElementById('password-match-error');
    const strengthProgress = passwordModal?.querySelector('.strength-progress');
    const strengthText = passwordModal?.querySelector('.strength-text span');
    
    function checkPasswordStrength(password) {
        let strength = 0;

        if (password.length >= 8) strength += 1;
        if (password.length >= 12) strength += 1;
        
        if (/[0-9]/.test(password)) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[^0-9a-zA-Z]/.test(password)) strength += 1;
        
        if (strengthProgress && strengthText) {
            if (strength < 3) {
                strengthProgress.className = 'strength-progress weak';
                strengthText.textContent = 'Weak';
            } else if (strength < 5) {
                strengthProgress.className = 'strength-progress medium';
                strengthText.textContent = 'Medium';
            } else if (strength < 6) {
                strengthProgress.className = 'strength-progress strong';
                strengthText.textContent = 'Strong';
            } else {
                strengthProgress.className = 'strength-progress very-strong';
                strengthText.textContent = 'Very Strong';
            }
        }
        
        return strength;
    }
    
    function validatePasswords() {
        if (newPasswordInput && confirmPasswordInput && passwordMatchError) {
            if (newPasswordInput.value !== confirmPasswordInput.value) {
                passwordMatchError.style.display = 'block';
                confirmPasswordInput.classList.add('error-input');
                return false;
            } else {
                passwordMatchError.style.display = 'none';
                confirmPasswordInput.classList.remove('error-input');
                return true;
            }
        }
        return false;
    }
    
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            checkPasswordStrength(this.value);
            if (confirmPasswordInput && confirmPasswordInput.value) {
                validatePasswords();
            }
        });
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validatePasswords);
    }
    
    // Close password modal function
    function closePasswordModal() {
        if (passwordModal) {
            passwordModal.classList.remove('active');
            document.body.style.overflow = '';
            if (changePasswordForm) changePasswordForm.reset();
            
            if (strengthProgress) {
                strengthProgress.className = 'strength-progress';
                strengthProgress.style.width = '0%';
            }
            if (strengthText) {
                strengthText.textContent = 'Weak';
            }
            
            if (passwordMatchError) passwordMatchError.style.display = 'none';
            if (confirmPasswordInput) confirmPasswordInput.classList.remove('error-input');
        }
    }
    
    const modifyPasswordBtn = document.getElementById('modify-password-button');
    if (modifyPasswordBtn) {
        modifyPasswordBtn.addEventListener('click', function() {
            if (passwordModal) {
                passwordModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    }
    
    if (passwordCloseModalBtn) {
        passwordCloseModalBtn.addEventListener('click', closePasswordModal);
    }
    
    if (passwordModalOverlay) {
        passwordModalOverlay.addEventListener('click', function(e) {
            if (e.target === passwordModalOverlay) {
                closePasswordModal();
            }
        });
    }
    
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validatePasswords()) {
                return;
            }
            
            const currentPassword = currentPasswordInput.value;
            const newPassword = newPasswordInput.value;
            
            const strength = checkPasswordStrength(newPassword);
            if (strength < 3) {
                alert('Please choose a stronger password');
                return;
            }
            try {
                const successMessage = passwordModal.querySelector('.form-success-message');
                if (successMessage) successMessage.style.display = 'block';
                
                if (changePasswordForm) changePasswordForm.reset();
            
                if (strengthProgress) {
                    strengthProgress.className = 'strength-progress';
                    strengthProgress.style.width = '0%';
                }
                if (strengthText) {
                    strengthText.textContent = 'Weak';
                }
                
                setTimeout(closePasswordModal, 3000);
            } catch (error) {
                console.error('Failed to update password:', error);
            }
        });
    }
    
    document.getElementById('support-button')?.addEventListener('click', () => {
        alert('Support functionality would go here');
    });
    
    document.getElementById('delete-profile-button')?.addEventListener('click', function () {
        if (!currentUser) return;
    
        // Show the confirmation popup
        const popup = document.getElementById('delete-confirm-popup');
        if (popup) {
            popup.style.display = 'flex';
            
            // Setup event listeners for the buttons
            popup.querySelector('.cancel-popup-button').onclick = function () {
                popup.style.display = 'none';
            };

            popup.querySelector('.confirm-button').onclick = function () {
                try {
                    deleteAllUserData(currentUser.id);
                    deleteUserAccount(currentUser.id);
                    popup.style.display = 'none';
                    alert('Your account has been deleted successfully.');
                    window.location.href = 'login.html';
                } catch (error) {
                    console.error('Account deletion failed:', error);
                    alert('Failed to delete account. Please try again.');
                    popup.style.display = 'none';
                }
            };

            // Close popup when clicking outside
            popup.onclick = function (e) {
                if (e.target === popup) {
                    popup.style.display = 'none';
                }
            };
        }
    });

    // Toggle password visibility
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            
            if (passwordInput) {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                
                // Cambia l'icona
                this.classList.toggle('fa-eye');
                this.classList.toggle('fa-eye-slash');
            }
        });
    });
});