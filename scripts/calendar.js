document.addEventListener('DOMContentLoaded', function() {
    let currentDate = new Date();
    const today = new Date(); // Store today's date for comparison
    
    const monthElement = document.querySelector('.month');
    const prevBtn = document.querySelector('.fa-angle-left');
    const nextBtn = document.querySelector('.fa-angle-right');
    const todoListContainer = document.querySelector('.todo-list');
    const calendarHeader = document.querySelector('.calendar-header');
    
    // Create today button element
    const todayBtn = document.createElement('button');
    todayBtn.textContent = 'Back to today';
    todayBtn.className = 'today-btn';
    todayBtn.addEventListener('click', function() {
        currentDate = new Date();
        updateCalendar();
    });
    
    // Create a container for the navigation elements
    const navContainer = document.createElement('div');
    navContainer.className = 'calendar-nav';
    
    // Move the existing navigation elements into the new container
    navContainer.appendChild(prevBtn);
    navContainer.appendChild(monthElement);
    navContainer.appendChild(nextBtn);
    
    // Insert the navigation container into the header
    calendarHeader.insertBefore(navContainer, calendarHeader.firstChild);
    
    // Add the today button after the navigation container
    calendarHeader.appendChild(todayBtn);
    
    function formatDate(date) {
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    }
    
    function parseTaskDate(dateString) {
        if (!dateString) return null;
        
        // Handle "Month Day, Year" format
        if (dateString.includes(',')) {
            const dateParts = dateString.split(' ');
            const month = dateParts[0];
            const day = dateParts[1].replace(',', '');
            const year = dateParts[2];
            return new Date(`${month} ${day}, ${year}`);
        }
        
        // Handle "YYYY-MM-DD" format
        if (dateString.includes('-')) {
            const [year, month, day] = dateString.split('-');
            return new Date(year, month - 1, day);
        }
        
        return null;
    }
    
    function getAppData() {
        const data = localStorage.getItem('todoAppData');
        return data ? JSON.parse(data) : { lists: [] };
    }
    
    function getTasksForDate(date) {
        const appData = getAppData();
        const currentDate = new Date(date.setHours(0, 0, 0, 0));
        
        let tasks = [];
        appData.lists.forEach(list => {
            list.tasks.forEach(task => {
                const startDate = parseTaskDate(task.startDate);
                const dueDate = parseTaskDate(task.dueDate);
                
                // Check if current date is within task's date range
                if (startDate && dueDate) {
                    const normalizedStart = new Date(startDate.setHours(0, 0, 0, 0));
                    const normalizedDue = new Date(dueDate.setHours(0, 0, 0, 0));
                    
                    if (currentDate >= normalizedStart && currentDate <= normalizedDue) {
                        tasks.push({
                            ...task,
                            listId: list.id,
                            listTitle: list.title || "Untitled List",
                            listColor: list.color || "#cccccc"
                        });
                    }
                }
                // If only due date exists, show only on due date
                else if (dueDate) {
                    const normalizedDue = new Date(dueDate.setHours(0, 0, 0, 0));
                    if (currentDate.getTime() === normalizedDue.getTime()) {
                        tasks.push({
                            ...task,
                            listId: list.id,
                            listTitle: list.title || "Untitled List",
                            listColor: list.color || "#cccccc"
                        });
                    }
                }
            });
        });
        
        return tasks;
    }
    
    function renderTasksForDate(tasks) {
        todoListContainer.innerHTML = '';
        
        if (tasks.length === 0) {
            todoListContainer.innerHTML = '<div class="no-tasks">No tasks for this date</div>';
            return;
        }
        
        tasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = 'task-item';
            if (task.completed) {
                taskItem.classList.add('completed');
            }
            
            // Determine priority class
            let priorityClass = '';
            if (task.priority) {
                priorityClass = `priority-${task.priority.toLowerCase()}`;
            }
            
            let html = `
                <input type="checkbox" id="${task.id}" ${task.completed ? 'checked' : ''} 
                       class="${priorityClass}${task.completed ? ' completed-priority' : ''}">
                <span class="task-label">${task.text || 'New Task'}</span>
                <span class="task-list-name" style="background-color: ${task.listColor}">${task.listTitle}</span>
            `;
            
            taskItem.innerHTML = html;
            todoListContainer.appendChild(taskItem);
            
            // Make the task clickable (except the checkbox)
            taskItem.addEventListener('click', function(e) {
                if (e.target.tagName !== 'INPUT') {
                    window.location.href = `task.html?listId=${task.listId}&taskId=${task.id}`;
                }
            });
            
            // Make the list name clickable
            const listNameElement = taskItem.querySelector('.task-list-name');
            listNameElement.addEventListener('click', function(e) {
                e.stopPropagation();
                window.location.href = `list.html?id=${task.listId}`;
            });
            
            const checkbox = taskItem.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', function() {
                const appData = getAppData();
                let found = false;
                
                appData.lists.forEach(list => {
                    const taskToUpdate = list.tasks.find(t => t.id === task.id);
                    if (taskToUpdate) {
                        taskToUpdate.completed = this.checked;
                        found = true;
                        
                        // Update visual classes
                        if (this.checked) {
                            taskItem.classList.add('completed');
                            checkbox.classList.add('completed-priority');
                        } else {
                            taskItem.classList.remove('completed');
                            checkbox.classList.remove('completed-priority');
                        }
                    }
                });
                
                if (found) {
                    localStorage.setItem('todoAppData', JSON.stringify(appData));
                }
            });
        });
    }
    
    function isToday(date) {
        return date.toDateString() === today.toDateString();
    }
    
    function updateCalendar() {
        monthElement.textContent = formatDate(currentDate);
        const tasks = getTasksForDate(new Date(currentDate));
        renderTasksForDate(tasks);
        
        // Show/hide today button based on whether we're viewing today
        todayBtn.style.display = isToday(currentDate) ? 'none' : 'block';
    }
    
    prevBtn.addEventListener('click', function() {
        currentDate.setDate(currentDate.getDate() - 1);
        updateCalendar();
    });
    
    nextBtn.addEventListener('click', function() {
        currentDate.setDate(currentDate.getDate() + 1);
        updateCalendar();
    });
    
    updateCalendar();
});