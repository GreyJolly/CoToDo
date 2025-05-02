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

function openCalendar() {
    const calendarPopup = document.getElementById("calendarPopup");
    if (!calendarPopup) return;
    
    calendarPopup.classList.toggle("visible");
    calendarPopup.hidden = false;
    closeOtherPopups(calendarPopup);
    
    // Generate the calendar if it's opened
    if (!calendarPopup.hidden) {
        generateCalendar();
    }
}

function closeCalendar() {
    const calendarPopup = document.getElementById("calendarPopup");
    if (calendarPopup) {
        calendarPopup.classList.remove("visible");
        calendarPopup.hidden = true;
    }
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

// Month and year to track current calendar view
let currentCalendarMonth = new Date().getMonth();
let currentCalendarYear = new Date().getFullYear();

function generateCalendar() {
    const calendarDays = document.querySelector('.calendar-days');
    if (!calendarDays) return;
    
    // Clear previous calendar days
    calendarDays.innerHTML = '';
    
    // Set the month and year display
    const monthYearText = document.querySelector('.calendar-month-year');
    if (monthYearText) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        monthYearText.textContent = `${monthNames[currentCalendarMonth]} ${currentCalendarYear}`;
    }
    
    // Get the first day of the month and the number of days
    const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1).getDay();
    const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();
    
    // Get previous month's last days
    const prevMonthLastDay = new Date(currentCalendarYear, currentCalendarMonth, 0).getDate();
    
    // Add day headers (Mon, Tue, etc.)
    const dayHeaders = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const headerRow = document.createElement('div');
    headerRow.className = 'calendar-header-row';
    
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        headerRow.appendChild(dayHeader);
    });
    
    calendarDays.appendChild(headerRow);
    
    // Create calendar grid
    let dayCount = 1;
    let nextMonthDay = 1;
    
    // Adjust firstDay to start from Monday (0) instead of Sunday (0)
    let adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    for (let i = 0; i < 6; i++) { // 6 weeks max in a month view
        const weekRow = document.createElement('div');
        weekRow.className = 'calendar-week-row';
        
        for (let j = 0; j < 7; j++) { // 7 days in a week
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';
            
            if (i === 0 && j < adjustedFirstDay) {
                // Previous month days
                const prevDay = prevMonthLastDay - adjustedFirstDay + j + 1;
                dayCell.textContent = prevDay;
                dayCell.classList.add('prev-month-day');
            } else if (dayCount > daysInMonth) {
                // Next month days
                dayCell.textContent = nextMonthDay;
                dayCell.classList.add('next-month-day');
                nextMonthDay++;
            } else {
                // Current month days
                dayCell.textContent = dayCount;
                
                // We're not highlighting today's date anymore
                // Only highlight if it's the selected date from the task
                const taskData = loadTaskData();
                if (taskData && taskData.task && taskData.task.date) {
                    const dateStr = taskData.task.date;
                    const dateMatch = dateStr.match(/(\w+) (\d+), (\d+)/);
                    if (dateMatch) {
                        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                          'July', 'August', 'September', 'October', 'November', 'December'];
                        const selectedMonth = monthNames.indexOf(dateMatch[1]);
                        const selectedDay = parseInt(dateMatch[2]);
                        const selectedYear = parseInt(dateMatch[3]);
                        
                        if (dayCount === selectedDay && 
                            currentCalendarMonth === selectedMonth && 
                            currentCalendarYear === selectedYear) {
                            dayCell.classList.add('selected');
                        }
                    }
                }
                
                // Add click event to select a date
                dayCell.addEventListener('click', function() {
                    selectDate(dayCount, currentCalendarMonth, currentCalendarYear);
                });
                
                dayCount++;
            }
            
            weekRow.appendChild(dayCell);
        }
        
        calendarDays.appendChild(weekRow);
        
        // Stop if we've displayed all days of the current month and at least some of next month
        if (dayCount > daysInMonth && i >= 3) {
            break;
        }
    }
}

function navigateCalendar(direction) {
    // Update current month and year
    currentCalendarMonth += direction;
    
    // Handle year change
    if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
    } else if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
    }
    
    // Regenerate calendar
    generateCalendar();
}

function selectDate(day, month, year) {
    const taskData = loadTaskData();
    if (!taskData) return;

    const { appData, task } = taskData;
    
    // Validate day to ensure it's within the valid range for the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    if (day > daysInMonth) {
        day = daysInMonth; // Correct invalid days (like May 32 → May 31)
    }
    
    // Format date as "Month Day, Year" (e.g., "May 15, 2025")
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const formattedDate = `${monthNames[month]} ${day}, ${year}`;
    
    // Update task date
    task.date = formattedDate;
    
    // Update date display
    const dateElement = document.querySelector('.task-date');
    if (dateElement) {
        dateElement.textContent = formattedDate;
    }
    
    // Save changes
    localStorage.setItem('todoAppData', JSON.stringify(appData));
    
    // Close calendar popup
    closeCalendar();
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