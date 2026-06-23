const firebaseConfig = {
    apiKey: "AIzaSyCIXeX6Y7ju_kLtPqdHnnFNpJWVpP-wZIA",
    authDomain: "pulse-pm-234d4.firebaseapp.com",
    projectId: "pulse-pm-234d4",
    storageBucket: "pulse-pm-234d4.firebasestorage.app",
    messagingSenderId: "649086479695",
    appId: "1:649086479695:web:8fd84685597bff34f3293a",
    measurementId: "G-9RRWNX9RSM"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

let activeProjectsArray = JSON.parse(localStorage.getItem('pulse_projects')) || [];
let tasksMasterArray = JSON.parse(localStorage.getItem('pulse_tasks')) || [];
let activitiesArray = JSON.parse(localStorage.getItem('pulse_activities')) || [];

let selectedActiveColor = "#e91e63";
let currentViewingProjectId = null;

auth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById('user-display-email').innerText = user.email;
        if(user.email.includes("pamodi")) {
            document.getElementById('welcome-message').innerText = `Welcome back, pamodi 👋`;
        }
    } else {
        window.location.href = "index.html";
    }
});

// Navigation Engine View Selectors
const viewDashboardPanel = document.getElementById('view-dashboard-panel');
const viewProjectsPanel = document.getElementById('view-projects-panel');
const viewBoardPanel = document.getElementById('view-board-panel');
const viewReportsPanel = document.getElementById('view-reports-panel');

const menuDashboard = document.getElementById('menu-dashboard');
const menuProjects = document.getElementById('menu-projects');
const menuReports = document.getElementById('menu-reports');

function switchActiveView(targetView) {
    viewDashboardPanel.style.display = targetView === 'dashboard' ? "block" : "none";
    viewProjectsPanel.style.display = targetView === 'projects' ? "block" : "none";
    viewBoardPanel.style.display = targetView === 'board' ? "block" : "none";
    viewReportsPanel.style.display = targetView === 'reports' ? "block" : "none";
    
    menuDashboard.classList.toggle('active', targetView === 'dashboard');
    menuProjects.classList.toggle('active', targetView === 'projects');
    menuReports.classList.toggle('active', targetView === 'reports');

    if(targetView === 'dashboard') {
        renderRecentActivities();
    }
    if(targetView === 'reports') {
        compileReportsAndAnalytics();
    }
}

menuDashboard.addEventListener('click', () => switchActiveView('dashboard'));
menuProjects.addEventListener('click', () => switchActiveView('projects'));
menuReports.addEventListener('click', () => switchActiveView('reports'));
document.getElementById('btn-back-to-projects').addEventListener('click', () => switchActiveView('projects'));

document.querySelectorAll('.btn-go-create-project').forEach(btn => {
    btn.addEventListener('click', () => { switchActiveView('projects'); openProjectModal(false); });
});

// ==========================================================================
// RECENT ACTIVITY LOGGING ENGINE
// ==========================================================================
function logNewActivity(actionText, icon = "📝") {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString([], { month: 'short', day: 'numeric' });
    
    const newActivity = {
        id: 'act_' + Date.now(),
        text: actionText,
        time: timestamp,
        icon: icon
    };

    activitiesArray.unshift(newActivity);
    if(activitiesArray.length > 10) activitiesArray.pop();

    localStorage.setItem('pulse_activities', JSON.stringify(activitiesArray));
    renderRecentActivities();
}

function renderRecentActivities() {
    const activityBox = document.querySelector('.recent-activity');
    if (!activityBox) return;

    if (activitiesArray.length === 0) {
        activityBox.innerHTML = `
            <div class="card-header"><h3>📈 Recent activity</h3></div>
            <div class="empty-state-text" style="padding: 20px; text-align: center; color: #94a3b8;"><p>No activity yet.</p></div>`;
        return;
    }

    let listHTML = `<div class="card-header"><h3>📈 Recent activity</h3></div><div class="activity-list-wrapper" style="padding: 15px 20px; display: flex; flex-direction: column; gap: 15px;">`;
    activitiesArray.forEach(act => {
        listHTML += `
            <div class="activity-item-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 13px; border-bottom: 1px solid #f8fafc; padding-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 16px;">${act.icon}</span>
                    <span style="color: #334155; font-weight: 500;">${act.text}</span>
                </div>
                <span style="color: #94a3b8; font-size: 11px;">${act.time}</span>
            </div>
        `;
    });
    listHTML += `</div>`;
    activityBox.innerHTML = listHTML;
}

// ==========================================================================
// CORE PROJECT CRUD CONTROLLER WITH THREE DOTS INTERACTION
// ==========================================================================
const projectModal = document.getElementById('project-modal');
const projectForm = document.getElementById('project-form');
const projectsEmptyView = document.getElementById('projects-empty-view');
const projectsGrid = document.getElementById('projects-grid');

document.querySelectorAll('.btn-trigger-new-modal').forEach(btn => {
    btn.addEventListener('click', () => openProjectModal(false));
});
document.getElementById('btn-close-modal').addEventListener('click', () => projectModal.classList.remove('open'));
document.getElementById('btn-cancel-modal').addEventListener('click', () => projectModal.classList.remove('open'));

document.querySelectorAll('.color-dot').forEach(dot => {
    dot.addEventListener('click', (e) => {
        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        e.target.classList.add('active');
        selectedActiveColor = e.target.getAttribute('data-color');
    });
});

function openProjectModal(isEditMode = false, id = null) {
    projectModal.classList.add('open');
    if (isEditMode) {
        document.getElementById('modal-title-context').innerText = "Edit project";
        const proj = activeProjectsArray.find(p => p.id === id);
        if (proj) {
            document.getElementById('edit-project-id').value = proj.id;
            document.getElementById('project-name').value = proj.name;
            document.getElementById('project-desc').value = proj.desc;
            document.getElementById('project-deadline').value = proj.deadline;
            document.getElementById('project-priority').value = proj.priority;
        }
    } else {
        document.getElementById('modal-title-context').innerText = "New project";
        projectForm.reset();
        document.getElementById('edit-project-id').value = "";
    }
}

projectForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const idField = document.getElementById('edit-project-id').value;
    const name = document.getElementById('project-name').value;
    const desc = document.getElementById('project-desc').value;
    const deadline = document.getElementById('project-deadline').value;
    const priority = document.getElementById('project-priority').value;

    if (idField) {
        activeProjectsArray = activeProjectsArray.map(p => p.id === idField ? { ...p, name, desc, deadline, priority, color: selectedActiveColor } : p);
        logNewActivity(`Updated project details for "${name}"`, "✏️");
        if(currentViewingProjectId === idField) setupKanbanBoardView(idField);
    } else {
        activeProjectsArray.push({ id: 'proj_' + Date.now(), name, desc, deadline, priority, color: selectedActiveColor });
        logNewActivity(`Created a new project workspace "${name}"`, "📁");
    }

    localStorage.setItem('pulse_projects', JSON.stringify(activeProjectsArray));
    projectModal.classList.remove('open');
    renderProjectsMatrix();
});

function renderProjectsMatrix() {
    document.querySelectorAll('.global-proj-count').forEach(el => el.innerText = activeProjectsArray.length);
    const dashActiveProjectsBox = document.querySelector('.active-projects');
    
    if (activeProjectsArray.length === 0) {
        if(dashActiveProjectsBox) {
            dashActiveProjectsBox.innerHTML = `
                <div class="card-header"><h3>Active projects</h3></div>
                <div class="empty-state">
                    <div class="empty-icon">📁</div>
                    <p>No projects yet. Create your first one to get started.</p>
                    <button class="secondary-btn btn-go-create-project">Create project</button>
                </div>`;
            dashActiveProjectsBox.querySelector('.btn-go-create-project').addEventListener('click', () => { switchActiveView('projects'); openProjectModal(false); });
        }
        projectsEmptyView.style.display = "flex"; projectsGrid.style.display = "none";
        calculateGlobalCounters();
        return;
    }

    projectsEmptyView.style.display = "none"; projectsGrid.style.display = "grid"; projectsGrid.innerHTML = "";
    if(dashActiveProjectsBox) {
        dashActiveProjectsBox.innerHTML = `<div class="card-header"><h3>Active projects</h3><a href="#" class="view-all-link" onclick="switchActiveView('projects')">View all ↗</a></div><div style="padding:20px; font-size:14px; color:#475569;">📊 You currently have <strong>${activeProjectsArray.length}</strong> active workspaces running.</div>`;
    }

    activeProjectsArray.forEach(proj => {
        const card = document.createElement('div');
        card.className = "project-card";
        card.style.cursor = "pointer";
        card.innerHTML = `
            <div class="card-top-action">
                <div class="card-title-block"><span class="color-indicator-dot" style="background-color: ${proj.color}"></span><h3>${proj.name}</h3></div>
                <div class="card-menu-container">
                    <button class="card-menu-trigger">⋮</button>
                    <div class="card-dropdown-menu">
                        <button class="edit-opt">✏️ Edit</button>
                        <button class="delete-opt">🗑️ Delete</button>
                    </div>
                </div>
            </div>
            <p class="desc" style="margin-top: 10px;">${proj.desc || 'No description'}</p>
            <div class="meta-tags-row" style="margin-top: 12px;"><span class="tag">🏳️ ${proj.priority}</span></div>
        `;
        
        // Kanban Board Navigation (Propagation ආරක්ෂණය සහිතව)
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.card-menu-container')) {
                setupKanbanBoardView(proj.id);
            }
        });

        const menuTrigger = card.querySelector('.card-menu-trigger');
        const dropdownMenu = card.querySelector('.card-dropdown-menu');
        
        menuTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.card-dropdown-menu').forEach(m => {
                if(m !== dropdownMenu) m.classList.remove('show');
            });
            dropdownMenu.classList.toggle('show');
        });

        // Edit Trigger Pipeline
        card.querySelector('.edit-opt').addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.remove('show');
            openProjectModal(true, proj.id);
        });

        // Delete Engine Architecture with Native Confirm Window
        card.querySelector('.delete-opt').addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.remove('show');
            const confirmDelete = confirm(`Are you sure you want to completely delete "${proj.name}" workspace?`);
            if (confirmDelete) {
                activeProjectsArray = activeProjectsArray.filter(p => p.id !== proj.id);
                tasksMasterArray = tasksMasterArray.filter(t => t.projectId !== proj.id); // Delete bound tasks
                localStorage.setItem('pulse_projects', JSON.stringify(activeProjectsArray));
                localStorage.setItem('pulse_tasks', JSON.stringify(tasksMasterArray));
                logNewActivity(`Deleted project "${proj.name}" and its task stacks`, "🗑️");
                renderProjectsMatrix();
            }
        });

        projectsGrid.appendChild(card);
    });
    calculateGlobalCounters();
}

// පිටත ක්ලික් කරොත් මෙනු වසා දැමීම
document.addEventListener('click', () => {
    document.querySelectorAll('.card-dropdown-menu').forEach(m => m.classList.remove('show'));
});

// ==========================================================================
// KANBAN ENGINE & TASK MANAGEMENT
// ==========================================================================
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');

function setupKanbanBoardView(projectId) {
    currentViewingProjectId = projectId;
    const proj = activeProjectsArray.find(p => p.id === projectId);
    if (!proj) return;

    document.getElementById('board-proj-title').innerText = proj.name;
    document.getElementById('board-proj-desc').innerText = proj.desc || 'No description';
    document.getElementById('board-proj-color').style.backgroundColor = proj.color;
    document.getElementById('board-proj-priority').innerText = `🏳️ ${proj.priority}`;
    document.getElementById('board-proj-date').innerText = `📅 ${proj.deadline}`;

    switchActiveView('board');
    renderTaskCards();
}

document.getElementById('btn-board-add-task').addEventListener('click', () => openTaskModal(false));
document.querySelectorAll('.add-task-inline-btn').forEach(btn => {
    btn.addEventListener('click', (e) => openTaskModal(false, null, e.target.getAttribute('data-status')));
});
document.getElementById('btn-board-edit-project').addEventListener('click', () => openProjectModal(true, currentViewingProjectId));
document.getElementById('btn-close-task-modal').addEventListener('click', () => taskModal.classList.remove('open'));
document.getElementById('btn-cancel-task-modal').addEventListener('click', () => taskModal.classList.remove('open'));

function openTaskModal(isEditMode = false, taskId = null, defaultStatus = 'To Do') {
    taskModal.classList.add('open');
    if(isEditMode) {
        document.getElementById('task-modal-title').innerText = "Edit task";
        const task = tasksMasterArray.find(t => t.id === taskId);
        if(task) {
            document.getElementById('edit-task-id').value = task.id;
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-desc').value = task.desc;
            document.getElementById('task-due').value = task.due;
            document.getElementById('task-priority').value = task.priority;
            document.getElementById('task-status').value = task.status;
        }
    } else {
        document.getElementById('task-modal-title').innerText = "New task";
        taskForm.reset();
        document.getElementById('edit-task-id').value = "";
        document.getElementById('task-status').value = defaultStatus;
    }
}

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const idField = document.getElementById('edit-task-id').value;
    const title = document.getElementById('task-title').value;
    const desc = document.getElementById('task-desc').value;
    const due = document.getElementById('task-due').value;
    const priority = document.getElementById('task-priority').value;
    const status = document.getElementById('task-status').value;
    
    const projName = activeProjectsArray.find(p => p.id === currentViewingProjectId)?.name || "Workspace";

    if (idField) {
        tasksMasterArray = tasksMasterArray.map(t => t.id === idField ? { ...t, title, desc, due, priority, status } : t);
        logNewActivity(`Modified task "${title}" inside ${projName}`, "✏️");
    } else {
        tasksMasterArray.push({ id: 'task_' + Date.now(), projectId: currentViewingProjectId, title, desc, due, priority, status });
        logNewActivity(`Added task "${title}" to [${status}] in ${projName}`, "📋");
    }

    localStorage.setItem('pulse_tasks', JSON.stringify(tasksMasterArray));
    taskModal.classList.remove('open');
    renderTaskCards();
});

function renderTaskCards() {
    const activeProjectTasks = tasksMasterArray.filter(t => t.projectId === currentViewingProjectId);
    
    const todoZone = document.getElementById('zone-todo');
    const inProgressZone = document.getElementById('zone-inprogress');
    const doneZone = document.getElementById('zone-done');

    todoZone.querySelectorAll('.task-item-card').forEach(c => c.remove());
    inProgressZone.querySelectorAll('.task-item-card').forEach(c => c.remove());
    doneZone.querySelectorAll('.task-item-card').forEach(c => c.remove());

    activeProjectTasks.forEach(task => {
        const card = document.createElement('div');
        card.className = "task-item-card";
        card.setAttribute('draggable', 'true');
        card.setAttribute('id', task.id);
        card.innerHTML = `
            <h4>${task.title}</h4>
            <p>${task.desc || ''}</p>
            <div class="task-card-footer">
                <span class="tag" style="background:#fef3c7; color:#d97706;">🏳️ ${task.priority}</span>
                <div class="task-inline-actions">
                    <button type="button" onclick="openTaskModal(true, '${task.id}')">✏️</button>
                    <button type="button" style="color:red;" onclick="deleteTaskPipeline('${task.id}')">🗑️</button>
                </div>
            </div>
        `;

        card.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', card.id));

        if(task.status === 'To Do') todoZone.appendChild(card);
        else if(task.status === 'In Progress') inProgressZone.appendChild(card);
        else if(task.status === 'Done') doneZone.appendChild(card);
    });

    const cTodo = activeProjectTasks.filter(t => t.status === 'To Do').length;
    const cProgress = activeProjectTasks.filter(t => t.status === 'In Progress').length;
    const cDone = activeProjectTasks.filter(t => t.status === 'Done').length;

    document.getElementById('count-todo').innerText = cTodo;
    document.getElementById('count-inprogress').innerText = cProgress;
    document.getElementById('count-done').innerText = cDone;

    const grandTotal = activeProjectTasks.length;
    document.getElementById('board-proj-progress-txt').innerText = `${cDone}/${grandTotal} done`;
    const percentage = grandTotal > 0 ? Math.round((cDone / grandTotal) * 100) : 0;
    document.getElementById('board-completion-percentage').innerText = `${percentage}%`;
    document.getElementById('board-completion-fill-bar').style.width = `${percentage}%`;

    calculateGlobalCounters();
}

window.deleteTaskPipeline = function(id) {
    const task = tasksMasterArray.find(t => t.id === id);
    if(task && confirm("Remove this task card?")) {
        logNewActivity(`Deleted task "${task.title}"`, "🗑️");
        tasksMasterArray = tasksMasterArray.filter(t => t.id !== id);
        localStorage.setItem('pulse_tasks', JSON.stringify(tasksMasterArray));
        renderTaskCards();
    }
}

// ==========================================================================
// DRAG AND DROP HANDLING WITH ACTIVITY METRICS
// ==========================================================================
document.querySelectorAll('.tasks-drop-zone').forEach(zone => {
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag-over-active'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over-active'));
    
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over-active');
        const taskId = e.dataTransfer.getData('text/plain');
        const targetStatus = zone.parentElement.getAttribute('data-status');
        
        const task = tasksMasterArray.find(t => t.id === taskId);
        if (task && task.status !== targetStatus) {
            const oldStatus = task.status;
            task.status = targetStatus;
            
            let icon = "⚡";
            if(targetStatus === "Done") icon = "✅";
            logNewActivity(`Moved "${task.title}" from [${oldStatus}] → [${targetStatus}]`, icon);
            
            localStorage.setItem('pulse_tasks', JSON.stringify(tasksMasterArray));
            renderTaskCards();
        }
    });
});

// GLOBAL ANALYTICS DASHBOARD VALUE COMPILER MODULE
function calculateGlobalCounters() {
    const totalTasksCount = tasksMasterArray.length;
    const completedTasksCount = tasksMasterArray.filter(t => t.status === 'Done').length;
    const pendingTasksCount = totalTasksCount - completedTasksCount;

    const todayStr = new Date().toISOString().split('T')[0];
    const overdueCount = tasksMasterArray.filter(t => t.due && t.due < todayStr && t.status !== 'Done').length;

    document.querySelectorAll('.global-task-count').forEach(el => el.innerText = totalTasksCount);
    document.querySelectorAll('.global-completed-count').forEach(el => el.innerText = completedTasksCount);
    document.querySelectorAll('.global-pending-count').forEach(el => el.innerText = pendingTasksCount);
    document.querySelectorAll('.global-overdue-count').forEach(el => el.innerText = overdueCount);
}

// ==========================================================================
// DYNAMIC REPORTS GENERATION ENGINE
// ==========================================================================
function compileReportsAndAnalytics() {
    const total = tasksMasterArray.length;
    const done = tasksMasterArray.filter(t => t.status === 'Done').length;
    const inProgress = tasksMasterArray.filter(t => t.status === 'In Progress').length;
    const todo = tasksMasterArray.filter(t => t.status === 'To Do').length;
    const pending = total - done;

    const rate = total > 0 ? Math.round((done / total) * 100) : 0;
    document.getElementById('report-completion-rate').innerText = `${rate}%`;
    document.getElementById('report-inprogress-count').innerText = inProgress;
    document.getElementById('report-pending-count').innerText = pending;

    const barChartArea = document.getElementById('bar-chart-projects-area');
    barChartArea.innerHTML = "";

    if(activeProjectsArray.length === 0) {
        barChartArea.innerHTML = `<div style="color:#94a3b8; font-size:13px; margin:auto;">Create projects to see comparison analytics</div>`;
    }

    activeProjectsArray.forEach(proj => {
        const projTasks = tasksMasterArray.filter(t => t.projectId === proj.id);
        const pDone = projTasks.filter(t => t.status === 'Done').length;
        const pPending = projTasks.length - pDone;

        const maxVal = Math.max(...activeProjectsArray.map(p => {
            const ts = tasksMasterArray.filter(t => p.id === p.id); // Fault check fallback
            return ts.length;
        }), 4);

        const doneHeight = (pDone / maxVal) * 180;
        const pendingHeight = (pPending / maxVal) * 180;

        const colGroup = document.createElement('div');
        colGroup.className = "project-bar-column-group";
        colGroup.innerHTML = `
            <div class="dual-bars-wrapper">
                <div class="bar-pillar completed-bar" style="height: ${doneHeight}px;" title="Completed: ${pDone}"></div>
                <div class="bar-pillar pending-bar" style="height: ${pendingHeight}px;" title="Pending: ${pPending}"></div>
            </div>
            <div class="bar-project-title-label">${proj.name}</div>
        `;
        barChartArea.appendChild(colGroup);
    });

    const donutBlock = document.getElementById('donut-render-block');
    const donutLegends = document.getElementById('donut-legends-container');
    donutLegends.innerHTML = "";

    if(total === 0) {
        donutBlock.style.background = "#e2e8f0";
        donutLegends.innerHTML = `<span style="font-size:13px; color:#94a3b8;">No tasks inside grid</span>`;
    } else {
        const todoPct = (todo / total) * 100;
        const ipPct = (inProgress / total) * 100;
        const donePct = (done / total) * 100;

        donutBlock.style.background = `conic-gradient(
            #7c69ef 0% ${todoPct}%, 
            #0369a1 ${todoPct}% ${todoPct + ipPct}%, 
            #2ecc71 ${todoPct + ipPct}% 100%
        )`;

        if(todo > 0) donutLegends.innerHTML += `<div class="legend-item"><span class="legend-color-box" style="background:#7c69ef;"></span> To Do (${todo})</div>`;
        if(inProgress > 0) donutLegends.innerHTML += `<div class="legend-item"><span class="legend-color-box" style="background:#0369a1;"></span> In Progress (${inProgress})</div>`;
        if(done > 0) donutLegends.innerHTML += `<div class="legend-item"><span class="legend-color-box" style="background:#2ecc71;"></span> Done (${done})</div>`;
    }

    const completionList = document.getElementById('report-project-completion-list');
    completionList.innerHTML = "";

    activeProjectsArray.forEach(proj => {
        const pTasks = tasksMasterArray.filter(t => t.projectId === proj.id);
        const pDone = pTasks.filter(t => t.status === 'Done').length;
        const pct = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;

        const row = document.createElement('div');
        row.className = "report-proj-row-item";
        row.innerHTML = `
            <div class="report-proj-row-meta">
                <div class="report-proj-title-wrap">
                    <span class="color-indicator-dot" style="background:${proj.color};"></span>
                    <span>${proj.name}</span>
                </div>
                <span>${pct}%</span>
            </div>
            <div class="report-progress-track">
                <div class="report-progress-fill" style="width:${pct}%; background:${proj.color || '#7c69ef'};"></div>
            </div>
        `;
        completionList.appendChild(row);
    });
}

document.getElementById('btn-signout').addEventListener('click', () => {
    auth.signOut().then(() => window.location.href = "index.html");
});

// App Ignition
renderProjectsMatrix();
renderRecentActivities();