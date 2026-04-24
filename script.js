document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const itemsLeft = document.getElementById('items-left');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const currentDateDisplay = document.getElementById('current-date');
    const emptyState = document.getElementById('empty-state');

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let editingTaskId = null;

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

        // Show/hide empty state (only when no tasks exist at all)
        if (tasks.length === 0) {
            emptyState.classList.remove('hidden');
            taskList.style.display = 'none';
        } else {
            emptyState.classList.add('hidden');
            taskList.style.display = 'block';
        }

        filteredTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.dataset.id = task.id;
            
            if (editingTaskId === task.id) {
                // Edit mode
                li.innerHTML = `
                    <div class="checkbox-wrapper">
                        <div class="custom-checkbox">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                    </div>
                    <input type="text" class="task-edit-input" value="${escapeHtml(task.text)}" autofocus>
                    <div class="task-actions">
                        <button class="edit-btn" aria-label="Save">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </button>
                    </div>
                `;
                
                const editInput = li.querySelector('.task-edit-input');
                editInput.addEventListener('blur', () => saveEdit(task.id, editInput.value));
                editInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') saveEdit(task.id, editInput.value);
                    if (e.key === 'Escape') cancelEdit();
                });
                editInput.addEventListener('click', (e) => e.stopPropagation());
                
                li.querySelector('.edit-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    saveEdit(task.id, editInput.value);
                });
            } else {
                // Normal mode
                li.innerHTML = `
                    <div class="checkbox-wrapper">
                        <div class="custom-checkbox">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                    </div>
                    <span class="task-text">${escapeHtml(task.text)}</span>
                    <div class="task-actions">
                        <button class="edit-btn" aria-label="Edit task">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="delete-btn" aria-label="Delete task">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                `;

                // Toggle complete
                li.querySelector('.checkbox-wrapper').addEventListener('click', () => toggleTask(task.id));
                
                // Double click to edit
                li.querySelector('.task-text').addEventListener('dblclick', () => startEdit(task.id));
                
                // Edit button
                li.querySelector('.edit-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    startEdit(task.id);
                });
                
                // Delete task
                li.querySelector('.delete-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteTask(task.id);
                });
            }

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
        li.style.transform = 'translateX(100%)';
        li.style.opacity = '0';
        
        setTimeout(() => {
            tasks = tasks.filter(task => task.id !== id);
            renderTasks();
        }, 300);
    }

    function startEdit(id) {
        editingTaskId = id;
        renderTasks();
    }

    function saveEdit(id, newText) {
        const trimmed = newText.trim();
        if (trimmed) {
            tasks = tasks.map(task => 
                task.id === id ? { ...task, text: trimmed } : task
            );
        }
        editingTaskId = null;
        renderTasks();
    }

    function cancelEdit() {
        editingTaskId = null;
        renderTasks();
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
