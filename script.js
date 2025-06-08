document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = 'http://localhost/todo/backend'; 

    const authSection = document.getElementById('auth-section');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const loginButton = document.getElementById('login-button');
    const signupEmailInput = document.getElementById('signup-email');
    const signupPasswordInput = document.getElementById('signup-password');
    const signupButton = document.getElementById('signup-button');
    const showSignupLink = document.getElementById('show-signup');
    const showLoginLink = document.getElementById('show-login');
    const signOutButton = document.getElementById('sign-out-button');

    const todoListSection = document.getElementById('todo-list-section');
    const todoInput = document.getElementById('todo-input');
    const addButton = document.getElementById('add-button');
    const todoList = document.getElementById('todo-list');
    const filterAllButton = document.getElementById('filter-all');
    const filterActiveButton = document.getElementById('filter-active');
    const filterCompletedButton = document.getElementById('filter-completed');
    const clearCompletedButton = document.getElementById('clear-completed');
    const userIdDisplay = document.getElementById('user-id');
    const userEmailDisplay = document.getElementById('user-email');
    const loadingIndicator = document.getElementById('loading-indicator');

    let currentFilter = 'all';
    let allFetchedTodos = [];

    async function checkSession() {
        loadingIndicator.style.display = 'block';
        try {
            const response = await fetch(`${API_BASE_URL}/auth.php?action=check_session`, {
                credentials: 'include'
            });
            const data = await response.json();

            if (data.success && data.user_id) {
                userIdDisplay.textContent = data.user_id;
                userEmailDisplay.textContent = data.user_email;
                authSection.style.display = 'none';
                todoListSection.style.display = 'block';
                await fetchTodos();
            } else {
                authSection.style.display = 'block';
                todoListSection.style.display = 'none';
                userIdDisplay.textContent = 'N/A';
                userEmailDisplay.textContent = 'N/A';
            }
        } catch (error) {
            console.error("Error checking session:", error);
            authSection.style.display = 'block';
            todoListSection.style.display = 'none';
            userIdDisplay.textContent = 'Error';
            userEmailDisplay.textContent = 'Error';
            displayMessage("Failed to check session. Please try logging in.", "error");
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    async function handleSignUp() {
        const email = signupEmailInput.value;
        const password = signupPasswordInput.value;
        if (!email || !password) {
            displayMessage("Please enter both email and password for signup.", "warning");
            return;
        }
        loadingIndicator.style.display = 'block';
        try {
            const response = await fetch(`${API_BASE_URL}/auth.php?action=register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                displayMessage("Account created successfully! Please log in.", "success");
                signupEmailInput.value = '';
                signupPasswordInput.value = '';
                loginForm.style.display = 'flex';
                signupForm.style.display = 'none';
            } else {
                displayMessage(`Sign up failed: ${data.message}`, "error");
            }
        } catch (error) {
            console.error("Error during sign up:", error);
            displayMessage("Sign up failed due to network or server error.", "error");
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    async function handleSignIn() {
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;
        if (!email || !password) {
            displayMessage("Please enter both email and password for login.", "warning");
            return;
        }
        loadingIndicator.style.display = 'block';
        try {
            const response = await fetch(`${API_BASE_URL}/auth.php?action=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                displayMessage("Logged in successfully!", "success");
                loginEmailInput.value = '';
                loginPasswordInput.value = '';
                await checkSession();
            } else {
                displayMessage(`Login failed: ${data.message}`, "error");
            }
        } catch (error) {
            console.error("Error during sign in:", error);
            displayMessage("Login failed due to network or server error.", "error");
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    async function handleSignOut() {
        loadingIndicator.style.display = 'block';
        try {
            const response = await fetch(`${API_BASE_URL}/auth.php?action=logout`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                displayMessage("Logged out successfully!", "info");
                await checkSession();
            } else {
                displayMessage(`Logout failed: ${data.message}`, "error");
            }
        } catch (error) {
            console.error("Error during sign out:", error);
            displayMessage("Logout failed due to network or server error.", "error");
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    async function fetchTodos() {
        loadingIndicator.style.display = 'block';
        try {
            const response = await fetch(`${API_BASE_URL}/todos.php`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                allFetchedTodos = data.todos || [];
                renderTodos(allFetchedTodos);
            } else {
                displayMessage(`Failed to load todos: ${data.message}`, "error");
                allFetchedTodos = [];
                renderTodos([]);
            }
        } catch (error) {
            console.error("Error fetching todos:", error);
            displayMessage("Failed to load todos due to network or server error.", "error");
            allFetchedTodos = [];
            renderTodos([]);
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    async function addTodo(text) {
        loadingIndicator.style.display = 'block';
        try {
            const response = await fetch(`${API_BASE_URL}/todos.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                displayMessage("Task added!", "success");
                todoInput.value = '';
                await fetchTodos();
            } else {
                displayMessage(`Failed to add task: ${data.message}`, "error");
            }
        } catch (error) {
            console.error("Error adding todo:", error);
            displayMessage("Failed to add task due to network or server error.", "error");
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    async function toggleTodoComplete(id, completedStatus) {
        loadingIndicator.style.display = 'block';
        try {
            const response = await fetch(`${API_BASE_URL}/todos.php`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, completed: completedStatus ? 1 : 0 }),
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                displayMessage("Task updated!", "success");
                await fetchTodos();
            } else {
                displayMessage(`Failed to update task: ${data.message}`, "error");
            }
        } catch (error) {
            console.error("Error updating todo:", error);
            displayMessage("Failed to update task due to network or server error.", "error");
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    async function deleteTodo(id) {
        loadingIndicator.style.display = 'block';
        try {
            const response = await fetch(`${API_BASE_URL}/todos.php?id=${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                displayMessage("Task deleted!", "success");
                await fetchTodos();
            } else {
                displayMessage(`Failed to delete task: ${data.message}`, "error");
            }
        } catch (error) {
            console.error("Error deleting todo:", error);
            displayMessage("Failed to delete task due to network or server error.", "error");
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    async function clearCompletedTodos() {
        loadingIndicator.style.display = 'block';
        try {
            const completedTodos = allFetchedTodos.filter(todo => parseInt(todo.completed) === 1);
            if (completedTodos.length === 0) {
                displayMessage("No completed tasks to clear.", "info");
                loadingIndicator.style.display = 'none';
                return;
            }

            const deletePromises = completedTodos.map(todo =>
                fetch(`${API_BASE_URL}/todos.php?id=${todo.id}`, { method: 'DELETE', credentials: 'include' })
                    .then(res => res.json())
            );
            const results = await Promise.all(deletePromises);

            const failedDeletes = results.filter(r => !r.success);
            if (failedDeletes.length > 0) {
                displayMessage(`Cleared some tasks, but ${failedDeletes.length} failed.`, "warning");
            } else {
                displayMessage("Completed tasks cleared!", "success");
            }
            await fetchTodos();
        } catch (error) {
            console.error("Error clearing completed todos:", error);
            displayMessage("Failed to clear completed tasks due to network or server error.", "error");
        } finally {
            loadingIndicator.style.display = 'none';
        }
    }

    function renderTodos(todosToRender) {
        todoList.innerHTML = '';

        const filteredTodos = todosToRender.filter(todo => {
            if (currentFilter === 'active') return parseInt(todo.completed) === 0;
            if (currentFilter === 'completed') return parseInt(todo.completed) === 1;
            return true;
        });

        if (filteredTodos.length === 0 && loadingIndicator.style.display === 'none') {
            const noTasksMessage = document.createElement('li');
            noTasksMessage.textContent = "No tasks to display for this filter.";
            noTasksMessage.style.cssText = "text-align: center; color: #888; font-style: italic; padding: 20px; border: none;";
            todoList.appendChild(noTasksMessage);
        }

        filteredTodos.forEach(todo => {
            const listItem = document.createElement('li');
            if (parseInt(todo.completed) === 1) {
                listItem.classList.add('completed');
            }

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = parseInt(todo.completed) === 1;
            checkbox.addEventListener('change', () => {
                toggleTodoComplete(todo.id, checkbox.checked);
            });

            const span = document.createElement('span');
            span.textContent = todo.text;
            span.addEventListener('click', () => {
                toggleTodoComplete(todo.id, parseInt(todo.completed) === 1 ? 0 : 1);
            });

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.classList.add('delete-button');
            deleteButton.addEventListener('click', () => {
                deleteTodo(todo.id);
            });

            listItem.appendChild(checkbox);
            listItem.appendChild(span);
            listItem.appendChild(deleteButton);
            todoList.appendChild(listItem);
        });
    }

    signupButton.addEventListener('click', handleSignUp);
    loginButton.addEventListener('click', handleSignIn);
    signOutButton.addEventListener('click', handleSignOut);

    showSignupLink.addEventListener('click', () => {
        loginForm.style.display = 'none';
        signupForm.style.display = 'flex';
    });

    showLoginLink.addEventListener('click', () => {
        signupForm.style.display = 'none';
        loginForm.style.display = 'flex';
    });

    addButton.addEventListener('click', () => {
        const todoText = todoInput.value.trim();
        if (todoText !== '') {
            addTodo(todoText);
        } else {
            displayMessage("Please enter a task before adding.", "info");
        }
    });

    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addButton.click();
        }
    });

    filterAllButton.addEventListener('click', () => {
        currentFilter = 'all';
        renderTodos(allFetchedTodos);
        updateFilterButtons('all');
    });

    filterActiveButton.addEventListener('click', () => {
        currentFilter = 'active';
        renderTodos(allFetchedTodos);
        updateFilterButtons('active');
    });

    filterCompletedButton.addEventListener('click', () => {
        currentFilter = 'completed';
        renderTodos(allFetchedTodos);
        updateFilterButtons('completed');
    });

    clearCompletedButton.addEventListener('click', clearCompletedTodos);

    function updateFilterButtons(activeFilter) {
        filterAllButton.classList.remove('active');
        filterActiveButton.classList.remove('active');
        filterCompletedButton.classList.remove('active');

        if (activeFilter === 'all') filterAllButton.classList.add('active');
        else if (activeFilter === 'active') filterActiveButton.classList.add('active');
        else if (activeFilter === 'completed') filterCompletedButton.classList.add('active');
    }

    function displayMessage(message, type = "info") {
        const messageBox = document.createElement('div');
        messageBox.textContent = message;
        messageBox.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            opacity: 0;
            transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
        `;

        if (type === "success") {
            messageBox.style.backgroundColor = "#5cb85c";
        } else if (type === "error") {
            messageBox.style.backgroundColor = "#dc3545";
        } else if (type === "warning") {
            messageBox.style.backgroundColor = "#ffc107";
            messageBox.style.color = "#333";
        } else {
            messageBox.style.backgroundColor = "#007bff";
        }

        document.body.appendChild(messageBox);

        setTimeout(() => {
            messageBox.style.opacity = '1';
            messageBox.style.transform = 'translateX(-50%) translateY(0)';
        }, 100);

        setTimeout(() => {
            messageBox.style.opacity = '0';
            messageBox.style.transform = 'translateX(-50%) translateY(-20px)';
            messageBox.addEventListener('transitionend', () => messageBox.remove());
        }, 3000);
    }

    checkSession();
    updateFilterButtons('all');

    loginEmailInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSignIn();
        }
    });
    loginPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSignIn();
        }
    });
});
