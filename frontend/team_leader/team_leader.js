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
                'tasks': 'Team Tasks & Delegation',
                'performance': 'Team Performance Metrics',
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
