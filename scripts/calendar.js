document.addEventListener('DOMContentLoaded', function() {
    let currentDate = new Date();
    
    const monthElement = document.querySelector('.month');
    const prevBtn = document.querySelector('.fa-angle-left');
    const nextBtn = document.querySelector('.fa-angle-right');
    const todoListContainer = document.querySelector('.todo-list');
    
    function formatDate(date) {
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    }
    
    function formatDateForComparison(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    function getAppData() {
        const data = localStorage.getItem('todoAppData');
        return data ? JSON.parse(data) : { lists: [] };
    }
    
    function getTasksForDate(date) {
        const appData = getAppData();
        const formattedDate = formatDateForComparison(date);
        
        let tasks = [];
        appData.lists.forEach(list => {
            list.tasks.forEach(task => {
                if (task.dueDate === formattedDate) {
                    tasks.push({
                        ...task,
                        listTitle: list.title || "Untitled List"
                    });
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
            
            let html = `
                <input type="checkbox" id="${task.id}" ${task.completed ? 'checked' : ''}>
                <span class="task-label">${task.text || 'New Task'}</span>
                <span class="task-list-name">${task.listTitle}</span>
            `;
            
            taskItem.innerHTML = html;
            todoListContainer.appendChild(taskItem);
            
            taskItem.querySelector('input[type="checkbox"]').addEventListener('change', function() {
                const appData = getAppData();

                let found = false;
                appData.lists.forEach(list => {
                    const taskToUpdate = list.tasks.find(t => t.id === task.id);
                    if (taskToUpdate) {
                        taskToUpdate.completed = this.checked;
                        found = true;
                    }
                });
                
                if (found) {
                    localStorage.setItem('todoAppData', JSON.stringify(appData));

                    setTimeout(() => updateCalendar(), 300);
                }
            });
        });
    }
    
    function updateCalendar() {
        monthElement.textContent = formatDate(currentDate);
        const tasks = getTasksForDate(currentDate);
        renderTasksForDate(tasks);
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