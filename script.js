document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const itemsLeft = document.getElementById('items-left');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const currentDateDisplay = document.getElementById('current-date');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';

    // Initialize date
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    currentDateDisplay.textContent = new Date().toLocaleDateString('en-US', options);

    // Render tasks
    function renderTasks() {
        taskList.innerHTML = '';
        
        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'active') return !task.completed;
            if (currentFilter === 'completed') return task.completed;
            return true;
        });

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.dataset.id = task.id;
            
            li.innerHTML = `
                <div class="checkbox-wrapper">
                    <div class="custom-checkbox">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                </div>
                <span class="task-text">${task.text}</span>
                <button class="delete-btn" aria-label="Delete task">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            `;

            // Toggle complete
            li.querySelector('.checkbox-wrapper').addEventListener('click', () => toggleTask(task.id));
            
            // Delete task
            li.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteTask(task.id);
            });

            taskList.appendChild(li);
        });

        updateStats();
        saveTasks();
    }

    function addTask() {
        const text = taskInput.value.trim();
        if (text) {
            const newTask = {
                id: Date.now(),
                text: text,
                completed: false
            };
            tasks.push(newTask);
            taskInput.value = '';
            renderTasks();
        }
    }

    function toggleTask(id) {
        tasks = tasks.map(task => 
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        renderTasks();
    }

    function deleteTask(id) {
        const li = document.querySelector(`[data-id="${id}"]`);
        li.style.transform = 'translateX(20px)';
        li.style.opacity = '0';
        
        setTimeout(() => {
            tasks = tasks.filter(task => task.id !== id);
            renderTasks();
        }, 300);
    }

    function updateStats() {
        const activeTasks = tasks.filter(task => !task.completed).length;
        itemsLeft.textContent = `${activeTasks} item${activeTasks !== 1 ? 's' : ''} left`;
    }

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Event Listeners
    addTaskBtn.addEventListener('click', addTask);
    
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    // Sync across tabs
    window.addEventListener('storage', (e) => {
        if (e.key === 'tasks') {
            tasks = JSON.parse(e.newValue) || [];
            renderTasks();
        }
    });

    // Initial render
    renderTasks();
});
