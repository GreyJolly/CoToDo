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
    
    // Handle email form submission with real updates
    if (changeEmailForm) {
        changeEmailForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validateEmails()) {
                return;
            }
            
            const newEmail = newEmailInput.value;
            const password = document.getElementById('password').value;
            
            try {
                // Update email in user data
                const success = updateUserEmail(currentUser.id, newEmail, password);
                
                if (success) {
                    const successMessage = document.querySelector('.form-success-message');
                    if (successMessage) successMessage.style.display = 'block';
                    
                    if (changeEmailForm) changeEmailForm.reset();
                    
                    setTimeout(closeModal, 3000);
                } else {
                    alert('Failed to update email. Please check your password.');
                }
            } catch (error) {
                console.error('Failed to update email:', error);
                alert('Error updating email: ' + error.message);
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
                // Update password in user data
                const success = updateUserPassword(currentUser.id, currentPassword, newPassword);
                
                if (success) {
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
                } else {
                    alert('Failed to update password. Please check your current password.');
                }
            } catch (error) {
                console.error('Failed to update password:', error);
                alert('Error updating password: ' + error.message);
            }
        });
    }
    
    // CHANGE USERNAME MODAL
    const usernameModal = document.getElementById('change-username-modal');
    const usernameModalOverlay = usernameModal?.querySelector('.modal-overlay');
    const usernameCloseModalBtn = usernameModal?.querySelector('.close-modal');
    const usernameCancelBtn = usernameModal?.querySelector('.cancel-button');
    const changeUsernameForm = document.getElementById('change-username-form');
    const currentUsernameInput = document.getElementById('current-username');
    const newUsernameInput = document.getElementById('new-username');
    const usernameError = document.getElementById('username-error');
    
    // Username validation
    function validateUsername(username) {
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        const isValid = usernameRegex.test(username);
        
        if (newUsernameInput && usernameError) {
            if (!isValid) {
                usernameError.style.display = 'block';
                newUsernameInput.classList.add('error-input');
                return false;
            } else {
                usernameError.style.display = 'none';
                newUsernameInput.classList.remove('error-input');
                return true;
            }
        }
        return false;
    }
    
    if (newUsernameInput) {
        newUsernameInput.addEventListener('input', function() {
            validateUsername(this.value);
        });
    }
    
    function closeUsernameModal() {
        if (usernameModal) {
            usernameModal.classList.remove('active');
            document.body.style.overflow = '';
            if (changeUsernameForm) changeUsernameForm.reset();
            
            if (usernameError) usernameError.style.display = 'none';
            if (newUsernameInput) newUsernameInput.classList.remove('error-input');
        }
    }
    
    // Add click handler for change username button
    const changeUsernameBtn = document.getElementById('change-username-button');
    if (changeUsernameBtn) {
        changeUsernameBtn.addEventListener('click', function() {
            if (currentUser && currentUser.displayName && currentUsernameInput) {
                currentUsernameInput.value = currentUser.displayName;
            }
            
            if (usernameModal) {
                usernameModal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    }
    
    if (usernameCloseModalBtn) {
        usernameCloseModalBtn.addEventListener('click', closeUsernameModal);
    }
    
    
    // Close username modal when clicking outside the form
    if (usernameModalOverlay) {
        usernameModalOverlay.addEventListener('click', function(e) {
            if (e.target === usernameModalOverlay) {
                closeUsernameModal();
            }
        });
    }
    
    // Handle username form submission with real updates
    if (changeUsernameForm) {
        changeUsernameForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const newUsername = newUsernameInput.value;
            const password = document.getElementById('username-password').value;
            
            if (!validateUsername(newUsername)) {
                return;
            }
            
            try {
                const success = updateUserUsername(currentUser.id, newUsername, password);
                
                if (success) {
                    const profileName = document.querySelector('.profile-name');
                    const avatarElement = document.querySelector('.account-avatar');
                    
                    if (profileName) profileName.textContent = newUsername;
                    if (avatarElement) avatarElement.textContent = newUsername.charAt(0);
                    
                    const successMessage = usernameModal.querySelector('.form-success-message');
                    if (successMessage) successMessage.style.display = 'block';
                    
                    if (newUsernameInput) newUsernameInput.value = '';
                    const passwordInput = document.getElementById('username-password');
                    if (passwordInput) passwordInput.value = '';
                    
                    setTimeout(closeUsernameModal, 3000);
                } else {
                    alert('Failed to update username. Please check your password or try a different username.');
                }
            } catch (error) {
                console.error('Failed to update username:', error);
                alert('Error updating username: ' + error.message);
            }
        });
    }
    
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

    document.getElementById('delete-profile-button')?.addEventListener('click', function () {
    if (!currentUser) return;

    // Show the confirmation popup
    const popup = document.getElementById('delete-confirm-popup');
        if (popup) {
            popup.style.display = 'flex';
            
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
                
                this.classList.toggle('fa-eye');
                this.classList.toggle('fa-eye-slash');
            }
        });
    });
});