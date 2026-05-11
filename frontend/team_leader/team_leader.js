const BASE_URL = 'http://127.0.0.1:8000/api';
let myProfileData = null;
let teamMembersList = [];

// --- Auth & API Fetch ---
function getToken() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../login.html';
    }
    return token;
}

function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
}

async function fetchData(endpoint, options = {}) {
    const token = getToken();
    const defaultHeaders = {
        'Authorization': `Token ${token}`
    };
    
    if (!(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '../login.html';
            return null;
        }
        
        if (response.status === 204) return true;

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}

// --- DOM Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    getToken();
    await loadTopBarProfile();
    initNavigation();
    loadDashboardStats(); // Load overview initially
    setupEventListeners();
});

// Load basic profile info for the top-bar and initial display
async function loadTopBarProfile() {
    const profile = await fetchData('/teamleader/profile/');
    if (profile) {
        myProfileData = profile;
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Team Leader';
        document.getElementById('user-display-name').innerText = fullName;
        document.getElementById('user-display-email').innerText = profile.email || '';
        
        // Initials avatar
        const initials = (profile.first_name ? profile.first_name[0] : 'T') + (profile.last_name ? profile.last_name[0] : 'L');
        document.getElementById('avatar-initials').innerText = initials.toUpperCase();
    }
}

// --- Dynamic Navigation & Lazy Loading ---
function initNavigation() {
    const navItems = document.querySelectorAll('.sidebar .nav-item[data-target]');
    const sections = document.querySelectorAll('.view-section');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');
            if (!target) return;

            // Update active menu link
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update active container section
            sections.forEach(sec => sec.classList.remove('active'));
            const activeSection = document.getElementById(target);
            if (activeSection) {
                activeSection.classList.add('active');
            }

            // Update TopBar Title
            const titleMapping = {
                'dashboard': 'Dashboard Overview',
                'team-members': 'Team Member Profiles',
                'attendance': 'Team Attendance Log',
                'tasks': 'Team Tasks & Assignment',
                'performance': 'Team Performance Metrics',
                'expenses': 'Team Expense Claims',
                'notifications': 'Notifications & Broadcasts',
                'profile': 'My Personal Profile'
            };
            document.getElementById('topbar-title').innerText = titleMapping[target] || 'Dashboard';

            // Lazy-load active section
            switch(target) {
                case 'dashboard':
                    loadDashboardStats();
                    break;
                case 'team-members':
                    loadTeamMembers();
                    break;
                case 'attendance':
                    loadAttendance();
                    break;
                case 'tasks':
                    loadTeamTasks();
                    break;
                case 'performance':
                    loadPerformance();
                    break;
                case 'expenses':
                    loadTeamExpenses();
                    break;
                case 'notifications':
                    loadNotifications();
                    break;
                case 'profile':
                    loadProfile();
                    break;
            }
        });
    });
}

// --- Section 1: Dashboard Overview Stats ---
async function loadDashboardStats() {
    const stats = await fetchData('/teamleader/stats/');
    if (stats) {
        document.getElementById('stat-members').innerText = stats.total_team_members || 0;
        document.getElementById('stat-pending').innerText = stats.pending_tasks || 0;
        document.getElementById('stat-completed').innerText = stats.completed_tasks || 0;
        document.getElementById('stat-attendance').innerText = `${stats.attendance_percentage || 0}%`;
    }
}

// --- Section 2: Team Members ---
async function loadTeamMembers() {
    const members = await fetchData('/teamleader/team-members/');
    if (!members) return;
    teamMembersList = members;

    // Update count badge
    document.getElementById('member-count-badge').innerText = `${members.length} Members`;

    const tbody = document.getElementById('team-members-table-body');
    if (members.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No employees are assigned to your team.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    members.forEach((emp, index) => {
        const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.email;
        tbody.innerHTML += `
            <tr>
                <td style="font-weight: 500;">${name}</td>
                <td>${emp.employee_id || '-'}</td>
                <td>${emp.department || '-'}</td>
                <td>${emp.designation || '-'}</td>
                <td>${emp.email || '-'}</td>
                <td>
                    <button class="btn btn-ghost" onclick="viewEmployeeDetails(${index})" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;"><i class="fa-solid fa-eye"></i> View Profile</button>
                </td>
            </tr>
        `;
    });
}

function viewEmployeeDetails(index) {
    const emp = teamMembersList[index];
    if (!emp) return;

    const modal = document.getElementById('memberDetailModal');
    const content = document.getElementById('modal-employee-content');

    const name = `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.email;

    content.innerHTML = `
        <div class="form-grid" style="grid-template-columns: 1fr 1fr;">
            <div>
                <h4 style="color: var(--primary); margin-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.25rem;">Personal Identification</h4>
                <p style="margin-bottom: 0.4rem;"><strong>Full Name:</strong> ${name}</p>
                <p style="margin-bottom: 0.4rem;"><strong>Email Address:</strong> ${emp.email || '-'}</p>
                <p style="margin-bottom: 0.4rem;"><strong>Phone:</strong> ${emp.phone_number || '-'}</p>
                <p style="margin-bottom: 0.4rem;"><strong>Gender:</strong> ${emp.gender || '-'}</p>
                <p style="margin-bottom: 0.4rem;"><strong>Date of Birth:</strong> ${emp.date_of_birth || '-'}</p>
                <p style="margin-bottom: 0.4rem;"><strong>Nationality:</strong> ${emp.nationality || '-'}</p>
                <p style="margin-bottom: 0.4rem;"><strong>Blood Group:</strong> ${emp.blood_group || '-'}</p>
                <p style="margin-bottom: 0.4rem;"><strong>Marital Status:</strong> ${emp.marital_status || '-'}</p>
            </div>
            <div>
                <h4 style="color: var(--primary); margin-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.25rem;">Employment & Work</h4>
                <p style="margin-bottom: 0.4rem;"><strong>Employee ID:</strong> ${emp.employee_id || '-'}</p>
                <p style="margin-bottom: 0.4rem;"><strong>Department:</strong> ${emp.department || '-'}</p>
                <p style="margin-bottom: 0.4rem;"><strong>Designation:</strong> ${emp.designation || '-'}</p>
                <p style="margin-bottom: 0.4rem;"><strong>Date of Joining:</strong> ${emp.date_of_joining || '-'}</p>
                <p style="margin-bottom: 0.4rem;"><strong>Aadhaar Card:</strong> ${emp.aadhaar_number || '-'}</p>
                <p style="margin-bottom: 0.4rem;"><strong>PAN Number:</strong> ${emp.pan_number || '-'}</p>
            </div>
        </div>
        <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem;">
            <h4 style="color: var(--primary); margin-bottom: 0.5rem;">Addresses & Contacts</h4>
            <p style="margin-bottom: 0.4rem;"><strong>Present Address:</strong> ${emp.address || '-'}</p>
            <p style="margin-bottom: 0.4rem;"><strong>Permanent Address:</strong> ${emp.permanent_address || '-'}</p>
            <p style="margin-top: 0.8rem; margin-bottom: 0.4rem;"><strong>Emergency Contact:</strong> ${emp.emergency_contact_name || '-'} (${emp.emergency_contact_relation || '-'}) - ${emp.emergency_contact_phone || '-'}</p>
        </div>
        <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1rem;">
            <h4 style="color: var(--primary); margin-bottom: 0.5rem;">Bank Account Details</h4>
            <p style="margin-bottom: 0.4rem;"><strong>Bank:</strong> ${emp.bank_name || '-'}</p>
            <p style="margin-bottom: 0.4rem;"><strong>Account Number:</strong> ${emp.account_number || '-'}</p>
            <p style="margin-bottom: 0.4rem;"><strong>IFSC Code:</strong> ${emp.ifsc_code || '-'}</p>
            <p style="margin-bottom: 0.4rem;"><strong>Branch Name:</strong> ${emp.branch_name || '-'}</p>
        </div>
    `;

    document.getElementById('modal-employee-title').innerText = `${name}'s Full Profile`;
    modal.style.display = 'block';
}

// --- Section 3: Team Attendance ---
async function loadAttendance() {
    const logs = await fetchData('/teamleader/attendance/');
    const tbody = document.getElementById('attendance-table-body');
    if (!logs) return;

    if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No attendance logs found for your team members today.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    logs.forEach(log => {
        const statClass = log.status.toLowerCase() === 'present' ? 'present' : 'absent';
        tbody.innerHTML += `
            <tr>
                <td style="font-weight: 500;">${log.employee_name}</td>
                <td>${log.date || 'Today'}</td>
                <td>${log.check_in || '-'}</td>
                <td>${log.check_out || '-'}</td>
                <td><span class="status ${statClass}">${log.status}</span></td>
            </tr>
        `;
    });
}

// --- Section 4: Team Tasks & Delegation ---
let currentTaskViewMode = 'my'; // 'my' or 'team'
let myTasksList = [];
let teamTasksList = [];

async function loadTeamTasks() {
    const tasksData = await fetchData('/teamleader/tasks/');
    if (!tasksData) return;

    myTasksList = tasksData.my_tasks || [];
    teamTasksList = tasksData.team_tasks || [];

    renderTasks();
}

function renderTasks() {
    if (currentTaskViewMode === 'my') {
        document.getElementById('my-tasks-panel').classList.add('active');
        document.getElementById('team-tasks-panel').classList.remove('active');
        document.getElementById('btn-create-task').style.display = 'none';

        const tbody = document.getElementById('my-tasks-table-body');
        if (myTasksList.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No tasks assigned to you by management.</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        myTasksList.forEach((task, index) => {
            const priorityClass = task.priority.toLowerCase();
            const statusClass = task.status.toLowerCase();
            tbody.innerHTML += `
                <tr>
                    <td style="font-weight: 500;">${task.title}</td>
                    <td>${task.deadline}</td>
                    <td><span class="status ${priorityClass}">${task.priority}</span></td>
                    <td><span class="status ${statusClass}">${task.status}</span></td>
                    <td>
                        <button class="btn btn-ghost" onclick="viewMyTaskDetail(${index})" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;"><i class="fa-solid fa-pen-to-square"></i> Update Status</button>
                    </td>
                </tr>
            `;
        });
    } else {
        document.getElementById('my-tasks-panel').classList.remove('active');
        document.getElementById('team-tasks-panel').classList.add('active');
        document.getElementById('btn-create-task').style.display = 'block';

        const tbody = document.getElementById('team-tasks-table-body');
        if (teamTasksList.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">You haven't delegated any tasks to your team yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        teamTasksList.forEach((task, index) => {
            const priorityClass = task.priority.toLowerCase();
            const statusClass = task.status.toLowerCase();
            tbody.innerHTML += `
                <tr>
                    <td style="font-weight: 500;">${task.title}</td>
                    <td>${task.assigned_to_username}</td>
                    <td>${task.deadline}</td>
                    <td><span class="status ${priorityClass}">${task.priority}</span></td>
                    <td><span class="status ${statusClass}">${task.status}</span></td>
                    <td>
                        <button class="btn btn-ghost" onclick="editTeamTaskDetail(${index})" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;"><i class="fa-solid fa-edit"></i> View / Edit</button>
                    </td>
                </tr>
            `;
        });
    }
}

// Team Leader update status/notes of task assigned TO them by manager
function viewMyTaskDetail(index) {
    const task = myTasksList[index];
    if (!task) return;

    const modal = document.getElementById('taskDetailsModal');
    const container = document.getElementById('task-detail-container');
    document.getElementById('modal-task-title').innerText = 'Update Task Status';

    container.innerHTML = `
        <div>
            <p style="margin-bottom: 0.4rem;"><strong>Title:</strong> ${task.title}</p>
            <p style="margin-bottom: 0.4rem;"><strong>Assigned By:</strong> Management (${task.created_by_username || 'Manager'})</p>
            <p style="margin-bottom: 0.4rem;"><strong>Deadline:</strong> ${task.deadline}</p>
            <p style="margin-bottom: 0.4rem;"><strong>Priority:</strong> <span class="status ${task.priority.toLowerCase()}">${task.priority}</span></p>
            <p style="margin-bottom: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem;"><strong>Description:</strong><br>${task.description || 'No description provided.'}</p>
        </div>
        <form id="update-my-task-form" style="display: flex; flex-direction: column; gap: 1rem;">
            <input type="hidden" name="task_id" value="${task.id}">
            <div class="form-group">
                <label>Status</label>
                <select name="status">
                    <option value="Pending" ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
            </div>
            <div class="form-group">
                <label>My Note / Progress Update</label>
                <textarea name="employee_note" rows="3" placeholder="Describe progress done so far...">${task.employee_note || ''}</textarea>
            </div>
            <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem;"><i class="fa-solid fa-save"></i> Save Updates</button>
        </form>
    `;

    // Hook submit action
    document.getElementById('update-my-task-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const payload = {
            task_id: fd.get('task_id'),
            status: fd.get('status'),
            employee_note: fd.get('employee_note')
        };

        const res = await fetchData('/teamleader/tasks/', {
            method: 'PATCH',
            body: JSON.stringify(payload)
        });

        if (res) {
            alert("Task status saved successfully!");
            modal.style.display = 'none';
            await loadTeamTasks();
        } else {
            alert("Failed to save updates.");
        }
    });

    modal.style.display = 'block';
}

// Team Leader view and EDIT task delegated BY them to employees
function editTeamTaskDetail(index) {
    const task = teamTasksList[index];
    if (!task) return;

    const modal = document.getElementById('taskDetailsModal');
    const container = document.getElementById('task-detail-container');
    document.getElementById('modal-task-title').innerText = 'Edit Task Details';

    container.innerHTML = `
        <form id="edit-team-task-form" style="display: flex; flex-direction: column; gap: 1rem;">
            <input type="hidden" name="task_id" value="${task.id}">
            <div class="form-group">
                <label>Task Title</label>
                <input type="text" name="title" value="${task.title}" required>
            </div>
            <p style="margin-bottom: 0.2rem;"><strong>Assigned To:</strong> ${task.assigned_to_username} (${task.assigned_to_email || ''})</p>
            <div class="form-group">
                <label>Deadline</label>
                <input type="date" name="deadline" value="${task.deadline}" required>
            </div>
            <div class="form-group">
                <label>Priority</label>
                <select name="priority">
                    <option value="Low" ${task.priority === 'Low' ? 'selected' : ''}>Low</option>
                    <option value="Medium" ${task.priority === 'Medium' ? 'selected' : ''}>Medium</option>
                    <option value="High" ${task.priority === 'High' ? 'selected' : ''}>High</option>
                </select>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea name="description" rows="3">${task.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Employee Progress Note</label>
                <p style="background: rgba(255,255,255,0.02); padding: 0.5rem; border-radius: 6px; font-size: 0.9rem; color: var(--text-muted); border: 1px dashed rgba(255,255,255,0.05);">
                    ${task.employee_note || 'No notes added by employee yet.'}
                </p>
            </div>
            <div class="form-group">
                <label>Status</label>
                <select name="status">
                    <option value="Pending" ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
            </div>
            <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem;"><i class="fa-solid fa-save"></i> Save Changes</button>
        </form>
    `;

    // Hook submit action
    document.getElementById('edit-team-task-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const payload = {
            task_id: fd.get('task_id'),
            title: fd.get('title'),
            deadline: fd.get('deadline'),
            priority: fd.get('priority'),
            description: fd.get('description'),
            status: fd.get('status')
        };

        const res = await fetchData('/teamleader/tasks/', {
            method: 'PATCH',
            body: JSON.stringify(payload)
        });

        if (res) {
            alert("Task specifications updated successfully!");
            modal.style.display = 'none';
            await loadTeamTasks();
        } else {
            alert("Failed to update task.");
        }
    });

    modal.style.display = 'block';
}

// --- Section 5: Performance Overview ---
async function loadPerformance() {
    const data = await fetchData('/teamleader/performance/');
    const tbody = document.getElementById('performance-table-body');
    if (!data) return;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No data available. Assing employees first.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    data.forEach(p => {
        tbody.innerHTML += `
            <tr>
                <td style="font-weight: 500;">${p.employee_name}</td>
                <td>${p.designation}</td>
                <td style="color: #10b981; font-weight: 600;">${p.completed_tasks}</td>
                <td style="color: #f59e0b; font-weight: 600;">${p.pending_tasks}</td>
                <td style="color: #f43f5e; font-weight: 600;">${p.overdue_tasks}</td>
                <td style="font-weight: 600;">${p.attendance_percentage}%</td>
            </tr>
        `;
    });
}

// --- Section 6: Notifications ---
async function loadNotifications() {
    const res = await fetchData('/notifications/');
    const container = document.getElementById('notifications-stream');
    if (!res) return;

    const msgs = res.received || [];
    if (msgs.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No system broadcasts or notifications received yet.</p>`;
        return;
    }

    container.innerHTML = '';
    msgs.forEach(m => {
        const dateStr = new Date(m.created_at).toLocaleDateString() + ' ' + new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        container.innerHTML += `
            <div class="notification-card glass-panel">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.25rem;">
                    <h4 style="font-weight: 600; font-size: 1rem;">${m.title}</h4>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">${dateStr}</span>
                </div>
                <p style="font-size: 0.9rem; line-height: 1.4;">${m.message}</p>
                <small style="color: var(--primary); font-size: 0.75rem; margin-top: 0.25rem; text-transform: uppercase;">Sender: ${m.sender_name} (${m.sender_role})</small>
            </div>
        `;
    });
}

// --- Section 7: Profile Management ---
async function loadProfile() {
    const profile = await fetchData('/teamleader/profile/');
    if (!profile) return;

    const form = document.getElementById('tl-profile-form');
    
    // Fill values
    form.first_name.value = profile.first_name || '';
    form.last_name.value = profile.last_name || '';
    form.email.value = profile.email || '';
    form.phone.value = profile.phone || '';
    form.gender.value = profile.gender || '';
    form.date_of_birth.value = formatDateForInput(profile.date_of_birth);
    form.address.value = profile.address || '';
    form.permanent_address.value = profile.permanent_address || '';
    
    form.employee_id.value = profile.employee_id || '';
    form.designation.value = profile.designation || '';
    form.department.value = profile.department || '';
    form.joining_date.value = formatDateForInput(profile.joining_date);
    form.aadhaar_number.value = profile.aadhaar_number || '';
    form.pan_number.value = profile.pan_number || '';
    form.nationality.value = profile.nationality || '';
    form.marital_status.value = profile.marital_status || '';
    form.blood_group.value = profile.blood_group || '';
    
    form.emergency_contact_name.value = profile.emergency_contact_name || '';
    form.emergency_contact_phone.value = profile.emergency_contact_phone || '';
    form.emergency_contact_relation.value = profile.emergency_contact_relation || '';
    
    form.bank_name.value = profile.bank_name || '';
    form.account_number.value = profile.account_number || '';
    form.ifsc_code.value = profile.ifsc_code || '';
    form.branch.value = profile.branch || '';
}

// --- Dialog, Modal & Action Event Listeners Setup ---
function setupEventListeners() {
    // Modal buttons close triggers
    document.getElementById('closeMemberModalBtn').addEventListener('click', () => {
        document.getElementById('memberDetailModal').style.display = 'none';
    });
    document.getElementById('closeTaskModalBtn').addEventListener('click', () => {
        document.getElementById('createTaskModal').style.display = 'none';
    });
    document.getElementById('closeTaskDetailModalBtn').addEventListener('click', () => {
        document.getElementById('taskDetailsModal').style.display = 'none';
    });

    // Close on click outside
    window.addEventListener('click', (e) => {
        const modals = ['memberDetailModal', 'createTaskModal', 'taskDetailsModal'];
        modals.forEach(mId => {
            const el = document.getElementById(mId);
            if (e.target === el) {
                el.style.display = 'none';
            }
        });
    });

    // Task View Sub-Tabs switcher
    document.querySelectorAll('.task-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.task-tab-btn').forEach(b => b.classList.replace('btn-primary', 'btn-ghost'));
            btn.classList.replace('btn-ghost', 'btn-primary');
            currentTaskViewMode = btn.getAttribute('data-task-view');
            renderTasks();
        });
    });

    // Delegate New Task Button modal trigger
    document.getElementById('btn-create-task').addEventListener('click', async () => {
        const select = document.getElementById('task-assignee-select');
        select.innerHTML = '<option value="">Select Employee...</option>';
        
        // Dynamically populates selection dropdown using loaded team members list
        if (teamMembersList.length === 0) {
            await loadTeamMembers();
        }
        
        teamMembersList.forEach(m => {
            const name = `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email;
            select.innerHTML += `<option value="${m.email}">${name} (${m.designation || 'Employee'})</option>`;
        });

        document.getElementById('createTaskModal').style.display = 'block';
    });

    // Submit Create Task Form
    document.getElementById('create-task-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const payload = {
            title: fd.get('title'),
            assigned_to: fd.get('assigned_to'),
            deadline: fd.get('deadline'),
            priority: fd.get('priority'),
            description: fd.get('description')
        };

        const res = await fetchData('/teamleader/tasks/', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (res) {
            alert("New task delegated successfully!");
            document.getElementById('create-task-form').reset();
            document.getElementById('createTaskModal').style.display = 'none';
            await loadTeamTasks();
        } else {
            alert("Failed to delegate task. Ensure employee is assigned to your team.");
        }
    });

    // Submit Profile Update Form
    document.getElementById('tl-profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        
        const payload = {
            first_name: form.first_name.value,
            last_name: form.last_name.value,
            phone: form.phone.value,
            gender: form.gender.value,
            date_of_birth: form.date_of_birth.value || null,
            address: form.address.value,
            permanent_address: form.permanent_address.value,
            
            employee_id: form.employee_id.value,
            designation: form.designation.value,
            department: form.department.value,
            joining_date: form.joining_date.value || null,
            aadhaar_number: form.aadhaar_number.value,
            pan_number: form.pan_number.value,
            nationality: form.nationality.value,
            marital_status: form.marital_status.value,
            blood_group: form.blood_group.value,
            
            emergency_contact_name: form.emergency_contact_name.value,
            emergency_contact_phone: form.emergency_contact_phone.value,
            emergency_contact_relation: form.emergency_contact_relation.value,
            
            bank_name: form.bank_name.value,
            account_number: form.account_number.value,
            ifsc_code: form.ifsc_code.value,
            branch: form.branch.value
        };

        const res = await fetchData('/teamleader/profile/update/', {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        if (res) {
            alert("Profile details saved successfully!");
            await loadTopBarProfile(); // Reload name/avatar
            await loadProfile(); // Fill fields
        } else {
            alert("Failed to save profile changes.");
        }
    });

    // Logout listener
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
    });
}

function escapeXML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function exportTeamToExcel() {
    if (!teamMembersList || teamMembersList.length === 0) {
        alert("No team members to export. Please load the section first.");
        return;
    }

    const headers = [
        "Employee ID", "Full Name", "Email", "Phone", "Gender", "Date of Birth", 
        "Present Address", "Permanent Address", "Aadhaar Number", "PAN Number", 
        "Marital Status", "Nationality", "Blood Group", "Designation", "Department", 
        "Joining Date", "Emergency Contact Name", "Emergency Contact Phone", "Emergency Contact Relation"
    ];

    const rows = teamMembersList.map(p => [
        p.employee_id || '',
        `${p.first_name || ''} ${p.last_name || ''}`.trim(),
        p.email || '',
        p.phone_number || '',
        p.gender || '',
        p.date_of_birth || '',
        p.address || '',
        p.permanent_address || '',
        p.aadhaar_number || '',
        p.pan_number || '',
        p.marital_status || '',
        p.nationality || '',
        p.blood_group || '',
        p.designation || '',
        p.department || '',
        p.date_of_joining || '',
        p.emergency_contact_name || '',
        p.emergency_contact_phone || '',
        p.emergency_contact_relation || ''
    ]);

    // Calculate dynamic column widths (auto-fit columns based on content length)
    const colWidths = headers.map((header, i) => {
        let maxLen = header.length;
        rows.forEach(row => {
            const valStr = String(row[i] || '');
            if (valStr.length > maxLen) maxLen = valStr.length;
        });
        return Math.max(110, (maxLen * 8.5) + 20);
    });

    // Generate XML Spreadsheet 2003 content
    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="MainTitle">
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Interior ss:Color="#1B365D" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="SubTitle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Italic="1" ss:Color="#FFFFFF"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Interior ss:Color="#2E5B9A" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="TableHeader">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1F4E78" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
   </Borders>
  </Style>
  <Style ss:ID="DataCell">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Team Members">
  <Table>`;

    // Add Column specifications with dynamic widths
    colWidths.forEach(width => {
        xml += `\n   <Column ss:Width="${width}"/>`;
    });

    // 1. Company and Heading Rows
    xml += `\n   <Row ss:Height="40">
    <Cell ss:MergeAcross="${headers.length - 1}" ss:StyleID="MainTitle">
     <Data ss:Type="String">SHNOOR - ASSIGNED TEAM MEMBERS</Data>
    </Cell>
   </Row>
   <Row ss:Height="25">
    <Cell ss:MergeAcross="${headers.length - 1}" ss:StyleID="SubTitle">
     <Data ss:Type="String">Company: Shnoor   |   Exported on: ${new Date().toLocaleDateString()}</Data>
    </Cell>
   </Row>
   <Row ss:Height="15"/>`; // Spacer row

    // 2. Table Header Row
    xml += `\n   <Row ss:Height="25">`;
    headers.forEach(h => {
        xml += `\n    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">${escapeXML(h)}</Data></Cell>`;
    });
    xml += `\n   </Row>`;

    // 3. Table Data Rows
    rows.forEach(row => {
        xml += `\n   <Row ss:Height="20">`;
        row.forEach(cellVal => {
            xml += `\n    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXML(cellVal)}</Data></Cell>`;
        });
        xml += `\n   </Row>`;
    });

    xml += `\n  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "shnoor_team_members.xls");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}


// --- Team Expenses Module ---
let localTeamExpenses = [];

async function loadTeamExpenses() {
    const tbody = document.getElementById('tlExpensesList');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Loading team expenses...</td></tr>';

    const res = await fetchData('/teamleader/expenses/');
    if (!res) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted);">Failed to load team expense records.</td></tr>';
        return;
    }

    localTeamExpenses = res;
    renderTeamExpenses(res);
    loadTeamExpenseStats(res);
}

function renderTeamExpenses(data) {
    const tbody = document.getElementById('tlExpensesList');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding: 2rem;">No team expense claims found matching filters.</td></tr>';
        return;
    }

    data.forEach(exp => {
        let statusBadge = '';
        const statusVal = exp.status.toUpperCase();
        if (statusVal === 'APPROVED') statusBadge = '<span class="status-badge status-present" style="background: rgba(16,185,129,0.15); color: #10b981; padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Approved</span>';
        else if (statusVal === 'REJECTED') statusBadge = '<span class="status-badge status-absent" style="background: rgba(244,63,94,0.15); color: #f43f5e; padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Rejected</span>';
        else statusBadge = '<span class="status-badge status-pending" style="background: rgba(245,158,11,0.15); color: #f59e0b; padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Pending</span>';

        let receiptLink = '<span style="color:var(--text-muted); font-size:0.85rem;"><i class="fa-solid fa-ban"></i> None</span>';
        if (exp.receipt) {
            const fileUrl = exp.receipt.startsWith('http') ? exp.receipt : `http://127.0.0.1:8000${exp.receipt}`;
            receiptLink = `<a href="${fileUrl}" target="_blank" style="color: var(--primary); text-decoration: none; font-weight: 500; font-size: 0.85rem;"><i class="fa-solid fa-arrow-up-right-from-square"></i> View</a>`;
        }

        let actionBtn = '-';
        if (statusVal === 'PENDING') {
            actionBtn = `<button class="btn btn-primary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;" onclick="openReviewExpenseModal(${exp.id}, '${escapeJS(exp.employee_name)}', ${exp.amount}, '${escapeJS(exp.category)}', '${escapeJS(exp.submitted_at_str)}')"><i class="fa-solid fa-gavel"></i> Review</button>`;
        }

        tbody.innerHTML += `
            <tr>
                <td style="font-weight: 600; color:#fff;">${escapeHTML(exp.employee_name)}</td>
                <td>${exp.submitted_at_str || '-'}</td>
                <td style="font-weight: 500;">${escapeHTML(exp.title)}</td>
                <td>${escapeHTML(exp.category)}</td>
                <td style="font-weight: 600; color: #fff;">₹${parseFloat(exp.amount).toFixed(2)}</td>
                <td>${statusBadge}</td>
                <td>${receiptLink}</td>
                <td>${actionBtn}</td>
            </tr>
        `;
    });
}

function loadTeamExpenseStats(data) {
    let total = 0;
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    data.forEach(exp => {
        const amt = parseFloat(exp.amount) || 0;
        const stat = exp.status.toUpperCase();
        total += amt;
        if (stat === 'PENDING') pending += amt;
        else if (stat === 'APPROVED') approved += amt;
        else if (stat === 'REJECTED') rejected += amt;
    });

    document.getElementById('tl-exp-total').innerText = `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('tl-exp-pending').innerText = `₹${pending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('tl-exp-approved').innerText = `₹${approved.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('tl-exp-rejected').innerText = `₹${rejected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function filterTeamExpenses() {
    const searchVal = document.getElementById('tlExpenseSearch').value.toLowerCase();
    const statusVal = document.getElementById('tlFilterStatus').value;

    let query = `?search=${encodeURIComponent(searchVal)}`;
    if (statusVal !== 'ALL') query += `&status=${statusVal}`;

    const res = await fetchData(`/teamleader/expenses/${query}`);
    if (res) {
        renderTeamExpenses(res);
    }
}

function clearTeamExpenseFilters() {
    document.getElementById('tlExpenseSearch').value = '';
    document.getElementById('tlFilterStatus').value = 'ALL';
    loadTeamExpenses();
}

function openReviewExpenseModal(id, employeeName, amount, category, date) {
    const modal = document.getElementById('reviewExpenseModal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('reviewExpenseId').value = id;
        document.getElementById('reviewRemark').value = '';
        
        document.getElementById('review-modal-info').innerHTML = `
            <div><strong style="color: var(--text-muted); font-size: 0.85rem;">Employee:</strong> <span style="font-weight: 600; color: #fff;">${escapeHTML(employeeName)}</span></div>
            <div><strong style="color: var(--text-muted); font-size: 0.85rem;">Amount:</strong> <span style="font-weight: 600; color: var(--primary);">₹${parseFloat(amount).toFixed(2)}</span></div>
            <div><strong style="color: var(--text-muted); font-size: 0.85rem;">Category:</strong> <span>${escapeHTML(category)}</span></div>
            <div><strong style="color: var(--text-muted); font-size: 0.85rem;">Submitted Date:</strong> <span>${escapeHTML(date)}</span></div>
        `;
    }
}

function closeReviewExpenseModal() {
    const modal = document.getElementById('reviewExpenseModal');
    if (modal) modal.style.display = 'none';
}

async function submitExpenseDecision(event, decision) {
    if (event) event.preventDefault();

    const id = document.getElementById('reviewExpenseId').value;
    const remark = document.getElementById('reviewRemark').value;

    if (!remark) {
        alert('Please provide a review remark/comment.');
        return;
    }

    const res = await fetchData('/teamleader/expenses/update/', {
        method: 'POST',
        body: JSON.stringify({
            expense_id: id,
            status: decision,
            remark: remark
        })
    });

    if (res) {
        alert(`Expense claim successfully ${decision.toLowerCase()}!`);
        closeReviewExpenseModal();
        loadTeamExpenses();
    } else {
        alert('Failed to save review decision.');
    }
}

// Escaping helpers
function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeJS(str) {
    if (!str) return '';
    return str.toString()
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"');
}

// --- Team Leader Personal Expenses ---
let localTlSelfExpenses = [];

function switchTlExpenseView(view) {
    const btnTeam = document.getElementById('btnTlViewTeam');
    const btnSelf = document.getElementById('btnTlViewSelf');
    const panelTeam = document.getElementById('tlTeamExpensesPanel');
    const panelSelf = document.getElementById('tlSelfExpensesPanel');

    if (view === 'team') {
        btnTeam.className = 'btn btn-primary';
        btnSelf.className = 'btn btn-ghost';
        panelTeam.style.display = 'block';
        panelSelf.style.display = 'none';
        loadTeamExpenses();
    } else {
        btnTeam.className = 'btn btn-ghost';
        btnSelf.className = 'btn btn-primary';
        panelTeam.style.display = 'none';
        panelSelf.style.display = 'block';
        loadTlSelfExpenses();
    }
}

async function loadTlSelfExpenses() {
    const tbody = document.getElementById('tlSelfExpensesList');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Loading my expenses...</td></tr>';

    const res = await fetchData('/employee/expenses/');
    if (!res) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted);">Failed to load personal expense records.</td></tr>';
        return;
    }

    localTlSelfExpenses = res;
    renderTlSelfExpenses(res);
    loadTlSelfExpenseStats(res);
}

function renderTlSelfExpenses(data) {
    const tbody = document.getElementById('tlSelfExpensesList');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding: 2rem;">No personal expense claims found matching filters.</td></tr>';
        return;
    }

    data.forEach(exp => {
        let statusBadge = '';
        const statusVal = exp.status.toUpperCase();
        if (statusVal === 'APPROVED') {
            statusBadge = '<span class="status-badge status-present" style="background: rgba(16,185,129,0.15); color: #10b981; padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Approved</span>';
        } else if (statusVal === 'REJECTED') {
            statusBadge = '<span class="status-badge status-absent" style="background: rgba(244,63,94,0.15); color: #f43f5e; padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Rejected</span>';
        } else if (statusVal === 'DRAFT') {
            statusBadge = '<span class="status-badge status-draft" style="background: rgba(255,255,255,0.1); color: var(--text-muted); padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Draft</span>';
        } else {
            statusBadge = '<span class="status-badge status-pending" style="background: rgba(245,158,11,0.15); color: #f59e0b; padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Pending</span>';
        }

        let payBadge = '';
        const payVal = exp.payment_status.toUpperCase();
        if (payVal === 'PAID') {
            payBadge = '<span class="status-badge" style="background: rgba(16,185,129,0.15); color: #10b981; padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Paid</span>';
        } else {
            payBadge = '<span class="status-badge" style="background: rgba(244,63,94,0.08); color: var(--text-muted); padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">Unpaid</span>';
        }

        let receiptLink = '<span style="color:var(--text-muted); font-size:0.85rem;"><i class="fa-solid fa-ban"></i> None</span>';
        if (exp.receipt) {
            const fileUrl = exp.receipt.startsWith('http') ? exp.receipt : `http://127.0.0.1:8000${exp.receipt}`;
            receiptLink = `<a href="${fileUrl}" target="_blank" style="color: var(--primary); text-decoration: none; font-weight: 500; font-size: 0.85rem;"><i class="fa-solid fa-arrow-up-right-from-square"></i> View</a>`;
        }

        tbody.innerHTML += `
            <tr>
                <td>${exp.submitted_at_str || '-'}</td>
                <td style="font-weight: 500; color:#fff;">${escapeHTML(exp.title)}</td>
                <td>${escapeHTML(exp.category)}</td>
                <td style="font-weight: 600; color: #fff;">₹${parseFloat(exp.amount).toFixed(2)}</td>
                <td>${statusBadge}</td>
                <td>${payBadge}</td>
                <td>${receiptLink}</td>
                <td style="color: var(--text-muted); font-size:0.85rem;">${escapeHTML(exp.manager_remark || '-')}</td>
            </tr>
        `;
    });
}

function loadTlSelfExpenseStats(data) {
    let total = 0;
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    data.forEach(exp => {
        const amt = parseFloat(exp.amount) || 0;
        const stat = exp.status.toUpperCase();
        total += amt;
        if (stat === 'PENDING') pending += amt;
        else if (stat === 'APPROVED') approved += amt;
        else if (stat === 'REJECTED') rejected += amt;
    });

    document.getElementById('tl-self-exp-total').innerText = `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('tl-self-exp-pending').innerText = `₹${pending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('tl-self-exp-approved').innerText = `₹${approved.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('tl-self-exp-rejected').innerText = `₹${rejected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function filterTlSelfExpenses() {
    const searchVal = document.getElementById('tlSelfExpenseSearch').value.toLowerCase();
    const statusVal = document.getElementById('tlSelfFilterStatus').value;

    let query = `?search=${encodeURIComponent(searchVal)}`;
    if (statusVal !== 'ALL') query += `&status=${statusVal}`;

    const res = await fetchData(`/employee/expenses/${query}`);
    if (res) {
        renderTlSelfExpenses(res);
    }
}

function clearTlSelfExpenseFilters() {
    document.getElementById('tlSelfExpenseSearch').value = '';
    document.getElementById('tlSelfFilterStatus').value = 'ALL';
    loadTlSelfExpenses();
}

function openTlAddExpenseModal() {
    const modal = document.getElementById('addTlExpenseModal');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('applyTlExpenseForm').reset();
    }
}

function closeTlAddExpenseModal() {
    const modal = document.getElementById('addTlExpenseModal');
    if (modal) modal.style.display = 'none';
}

async function submitTlExpenseClaim(event, isDraft) {
    if (event) event.preventDefault();

    const title = document.getElementById('tlSelfExpenseTitle').value;
    const category = document.getElementById('tlSelfExpenseCategory').value;
    const amount = document.getElementById('tlSelfExpenseAmount').value;
    const description = document.getElementById('tlSelfExpenseDesc').value;
    const receiptFile = document.getElementById('tlSelfExpenseReceipt').files[0];

    if (!category || !amount) {
        alert('Category and Amount are required fields.');
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('amount', amount);
    formData.append('description', description);
    formData.append('status', isDraft ? 'DRAFT' : 'PENDING');
    if (receiptFile) {
        formData.append('receipt', receiptFile);
    }

    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }

    try {
        const response = await fetch('http://127.0.0.1:8000/api/employee/expenses/create/', {
            method: 'POST',
            headers: headers,
            body: formData
        });

        if (response.ok) {
            alert(isDraft ? 'Draft expense saved successfully!' : 'Expense claim submitted successfully!');
            closeTlAddExpenseModal();
            loadTlSelfExpenses();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to submit expense claim.');
        }
    } catch (err) {
        console.error(err);
        alert('Error submitting expense claim.');
    }
}

function exportTlPersonalExpenses() {
    if (!localTlSelfExpenses || localTlSelfExpenses.length === 0) {
        alert("No personal expense claims available to export.");
        return;
    }

    const headers = [
        "Submitted Date",
        "Title/Merchant",
        "Category",
        "Amount (₹)",
        "Review Status",
        "Payment Status",
        "Manager Remark",
        "Receipt Link"
    ];

    const rows = localTlSelfExpenses.map(exp => {
        let receiptUrl = '';
        if (exp.receipt) {
            receiptUrl = exp.receipt.startsWith('http') ? exp.receipt : `http://127.0.0.1:8000${exp.receipt}`;
        }
        return [
            exp.submitted_at_str || '-',
            exp.title || '',
            exp.category || '',
            parseFloat(exp.amount || 0).toFixed(2),
            exp.status || '',
            exp.payment_status || '',
            exp.manager_remark || '',
            receiptUrl
        ];
    });

    // Calculate dynamic column widths (last column has View Receipt or No Receipt)
    const colWidths = headers.map((header, i) => {
        let maxLen = header.length;
        rows.forEach(row => {
            let valStr = '';
            if (i === 7) {
                valStr = row[i] ? "View Receipt" : "No Receipt";
            } else {
                valStr = String(row[i] || '');
            }
            if (valStr.length > maxLen) maxLen = valStr.length;
        });
        return Math.max(110, (maxLen * 8.5) + 20);
    });

    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="MainTitle">
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Interior ss:Color="#1B365D" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="SubTitle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Italic="1" ss:Color="#FFFFFF"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Interior ss:Color="#2E5B9A" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="TableHeader">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1F4E78" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
   </Borders>
  </Style>
  <Style ss:ID="DataCell">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
   </Borders>
  </Style>
  <Style ss:ID="HyperlinkCell">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#0563C1" ss:Underline="Single"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="My Expenses">
  <Table>`;

    colWidths.forEach(width => {
        xml += `\n   <Column ss:Width="${width}"/>`;
    });

    xml += `\n   <Row ss:Height="40">
    <Cell ss:MergeAcross="${headers.length - 1}" ss:StyleID="MainTitle">
     <Data ss:Type="String">SHNOOR - PERSONAL EXPENSES EXPORT</Data>
    </Cell>
   </Row>
   <Row ss:Height="25">
    <Cell ss:MergeAcross="${headers.length - 1}" ss:StyleID="SubTitle">
     <Data ss:Type="String">Company: Shnoor   |   Exported on: ${new Date().toLocaleDateString()}</Data>
    </Cell>
   </Row>
   <Row ss:Height="15"/>`;

    xml += `\n   <Row ss:Height="25">`;
    headers.forEach(h => {
        xml += `\n    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">${escapeXML(h)}</Data></Cell>`;
    });
    xml += `\n   </Row>`;

    rows.forEach(row => {
        xml += `\n   <Row ss:Height="20">`;
        // Print columns 0 to 6 normally
        for (let i = 0; i < 7; i++) {
            xml += `\n    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXML(row[i])}</Data></Cell>`;
        }
        // Last column: Link column
        const receiptUrl = row[7];
        if (receiptUrl) {
            xml += `\n    <Cell ss:StyleID="HyperlinkCell" ss:HRef="${escapeXML(receiptUrl)}"><Data ss:Type="String">View Receipt</Data></Cell>`;
        } else {
            xml += `\n    <Cell ss:StyleID="DataCell"><Data ss:Type="String">No Receipt</Data></Cell>`;
        }
        xml += `\n   </Row>`;
    });

    xml += `\n  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "my_personal_expenses.xls");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function exportTeamExpensesToExcel() {
    if (!localTeamExpenses || localTeamExpenses.length === 0) {
        alert("No team expense claims available to export.");
        return;
    }

    const headers = [
        "Employee Name",
        "Submitted Date",
        "Title/Merchant",
        "Category",
        "Amount (₹)",
        "Status",
        "Receipt Link"
    ];

    const rows = localTeamExpenses.map(exp => {
        let receiptUrl = '';
        if (exp.receipt) {
            receiptUrl = exp.receipt.startsWith('http') ? exp.receipt : `http://127.0.0.1:8000${exp.receipt}`;
        }
        return [
            exp.employee_name || '',
            exp.submitted_at_str || '-',
            exp.title || '',
            exp.category || '',
            parseFloat(exp.amount || 0).toFixed(2),
            exp.status || '',
            receiptUrl
        ];
    });

    // Calculate dynamic column widths (last column has View Receipt or No Receipt)
    const colWidths = headers.map((header, i) => {
        let maxLen = header.length;
        rows.forEach(row => {
            let valStr = '';
            if (i === 6) {
                valStr = row[i] ? "View Receipt" : "No Receipt";
            } else {
                valStr = String(row[i] || '');
            }
            if (valStr.length > maxLen) maxLen = valStr.length;
        });
        return Math.max(110, (maxLen * 8.5) + 20);
    });

    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="MainTitle">
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Interior ss:Color="#1B365D" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="SubTitle">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Italic="1" ss:Color="#FFFFFF"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Interior ss:Color="#2E5B9A" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="TableHeader">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1F4E78" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
   </Borders>
  </Style>
  <Style ss:ID="DataCell">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
   </Borders>
  </Style>
  <Style ss:ID="HyperlinkCell">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#0563C1" ss:Underline="Single"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D3D3D3"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Team Expenses">
  <Table>`;

    colWidths.forEach(width => {
        xml += `\n   <Column ss:Width="${width}"/>`;
    });

    xml += `\n   <Row ss:Height="40">
    <Cell ss:MergeAcross="${headers.length - 1}" ss:StyleID="MainTitle">
     <Data ss:Type="String">SHNOOR - TEAM EXPENSE CLAIMS</Data>
    </Cell>
   </Row>
   <Row ss:Height="25">
    <Cell ss:MergeAcross="${headers.length - 1}" ss:StyleID="SubTitle">
     <Data ss:Type="String">Company: Shnoor   |   Exported on: ${new Date().toLocaleDateString()}</Data>
    </Cell>
   </Row>
   <Row ss:Height="15"/>`;

    xml += `\n   <Row ss:Height="25">`;
    headers.forEach(h => {
        xml += `\n    <Cell ss:StyleID="TableHeader"><Data ss:Type="String">${escapeXML(h)}</Data></Cell>`;
    });
    xml += `\n   </Row>`;

    rows.forEach(row => {
        xml += `\n   <Row ss:Height="20">`;
        // Print columns 0 to 5 normally
        for (let i = 0; i < 6; i++) {
            xml += `\n    <Cell ss:StyleID="DataCell"><Data ss:Type="String">${escapeXML(row[i])}</Data></Cell>`;
        }
        // Last column: Link column
        const receiptUrl = row[6];
        if (receiptUrl) {
            xml += `\n    <Cell ss:StyleID="HyperlinkCell" ss:HRef="${escapeXML(receiptUrl)}"><Data ss:Type="String">View Receipt</Data></Cell>`;
        } else {
            xml += `\n    <Cell ss:StyleID="DataCell"><Data ss:Type="String">No Receipt</Data></Cell>`;
        }
        xml += `\n   </Row>`;
    });

    xml += `\n  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "team_expense_claims.xls");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
