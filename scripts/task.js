// task.js
function getAppData() {
    const data = localStorage.getItem('todoAppData');
    return data ? JSON.parse(data) : { lists: [] };
}

function getCurrentTaskId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('taskId');
}

function getCurrentListId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('listId');
}

function loadTaskData() {
    const appData = getAppData();
    const listId = getCurrentListId();
    const taskId = getCurrentTaskId();
    
    if (!listId || !taskId) {
        console.error('Missing listId or taskId in URL');
        return null;
    }

    const list = appData.lists.find(l => l.id === listId);
    if (!list) {
        console.error('List not found');
        return null;
    }

    const task = list.tasks.find(t => t.id === taskId);
    if (!task) {
        console.error('Task not found');
        return null;
    }

    return { appData, list, task };
}

function renderTaskPage() {
    const taskData = loadTaskData();
    if (!taskData) return;

    const { task } = taskData;

    // Set task title
    const titleInput = document.querySelector('.task-title');
    titleInput.value = task.text || '';
    
    // Set task description
    const descInput = document.querySelector('.task-description');
    descInput.value = task.description || '';
    
    // Set completion status
    const completeCheckbox = document.getElementById('task-complete');
    completeCheckbox.checked = task.completed || false;
    
    // Set date if exists
    const dateElement = document.querySelector('.task-date');
    if (task.date) {
        dateElement.textContent = task.date;
    }
    
    // Set priority if exists
    if (task.priority) {
        setPriorityFlag(task.priority);
    }
    
    // Set assignee if exists
    if (task.assignee) {
        // You'll need to implement this based on your assignee structure
    }
    
    // Setup event listeners
    setupTaskEvents();
}

function setPriorityFlag(priority) {
    const flagIcon = document.getElementById('flag-icon');
    
    switch(priority) {
        case 'high':
            flagIcon.className = 'fa-solid fa-flag';
            flagIcon.style.color = 'red';
            break;
        case 'medium':
            flagIcon.className = 'fa-solid fa-flag';
            flagIcon.style.color = 'orange';
            break;
        case 'low':
            flagIcon.className = 'fa-solid fa-flag';
            flagIcon.style.color = 'limegreen';
            break;
        default:
            flagIcon.className = 'fa-regular fa-flag';
            flagIcon.style.color = '';
    }
}

function setupTaskEvents() {
    // Save changes when leaving the page
    window.addEventListener('beforeunload', saveTaskChanges);
    
    // Back button
    document.querySelector('.backto-list')?.addEventListener('click', function(e) {
        e.preventDefault();
        saveTaskChanges();
        window.location.href = `list.html?id=${getCurrentListId()}`;
    });
    
    // Priority popup
    document.getElementById('flag-icon')?.addEventListener('click', openPriorityPopup);
    
    // Checkbox change
    document.getElementById('task-complete')?.addEventListener('change', function() {
        saveTaskChanges();
    });
    
    // Title and description changes
    document.querySelector('.task-title')?.addEventListener('input', debounce(saveTaskChanges, 300));
    document.querySelector('.task-description')?.addEventListener('input', debounce(saveTaskChanges, 300));
    
    // Priority options
    document.querySelectorAll('.priority-option').forEach(option => {
        option.addEventListener('click', function() {
            selectPriority(this.getAttribute('data-priority'));
        });
    });
    
}

function saveTaskChanges() {
    const taskData = loadTaskData();
    if (!taskData) return;

    const { appData, list, task } = taskData;
    
    // Update task properties
    task.text = document.querySelector('.task-title').value;
    task.description = document.querySelector('.task-description').value;
    task.completed = document.getElementById('task-complete').checked;
    
    // Save to localStorage
    localStorage.setItem('todoAppData', JSON.stringify(appData));
}

// Popup handling functions
function openPriorityPopup() {
	console.log("AH")
    const popup = document.getElementById("priorityPopup");
    popup.classList.toggle("visible");
    popup.hidden = false;
    closeOtherPopups(popup);
}

function closePriorityPopup() {
    const popup = document.getElementById("priorityPopup");
    popup.classList.remove("visible");
    popup.hidden = true;
}

function openSublist() {
    const hint = document.getElementById("enterHintContainer");
    hint.classList.toggle("visible");
    hint.hidden = !hint.hidden;
    closeOtherPopups(hint);
}

function openAssignMembers() {
    const assign = document.getElementById("assignMembersPopup");
    assign.classList.toggle("visible");
    assign.hidden = !assign.hidden;
    closeOtherPopups(assign);
}

function closeOtherPopups(currentPopup) {
    const popups = [
        document.getElementById("priorityPopup"),
        document.getElementById("enterHintContainer"),
        document.getElementById("assignMembersPopup")
    ];
    
    popups.forEach(popup => {
        if (popup && popup !== currentPopup) {
            popup.classList.remove("visible");
            popup.hidden = true;
        }
    });
}

function selectPriority(priority) {
    const taskData = loadTaskData();
    if (!taskData) return;

    const { appData, task } = taskData;
    task.priority = priority;
    setPriorityFlag(priority);
    localStorage.setItem('todoAppData', JSON.stringify(appData));
    closePriorityPopup();
}

function selectMember(member) {
    const taskData = loadTaskData();
    if (!taskData) return;

    const { appData, task } = taskData;
    task.assignee = member === 'none' ? null : member;
    localStorage.setItem('todoAppData', JSON.stringify(appData));
	// TOBEDONE: Handle assignee
}

function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    renderTaskPage();
});