/**
 * Shnoor HRM - Employee Dashboard Logic
 * Handles section navigation, profile management, and API communication.
 */

// --- Configuration ---
const API_BASE = "http://127.0.0.1:8000/api";

function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
}

// --- Core Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize sidebar navigation
    initNavigation();
    
    // Perform initial data sync
    loadProfile();
    loadDashboardStats();
});

/**
 * Sidebar Navigation Controller
 * Manages view switching based on data-target attributes.
 */



function initNavigation() {
    console.log("Navigation initialized");

    document.addEventListener('click', function (e) {
        const item = e.target.closest('.nav-item[data-target]');
        if (!item) return;

        const targetId = item.getAttribute('data-target');
        console.log("NAV CLICK:", targetId);

        const targetView = document.getElementById(targetId);
        if (!targetView) {
            console.error("Section not found:", targetId);
            return;
        }

        // remove all active
        document.querySelectorAll('.view-section').forEach(sec => {
            sec.classList.remove('active');
        });

        document.querySelectorAll('.nav-item').forEach(nav => {
            nav.classList.remove('active');
        });

        // activate current
        targetView.classList.add('active');
        item.classList.add('active');

        console.log("Section activated:", targetId);

        // 🔥 CRITICAL
        if (targetId === 'dashboard') loadDashboardStats();
        if (targetId === 'attendance') loadAttendance();
        if (targetId === 'leaves') loadLeaves();
        if (targetId === 'tasks') loadTasks();
        if (targetId === 'holidays') loadHolidays();
        if (targetId === 'orgchart') loadOrgChart();
        if (targetId === 'expenses') loadExpenses();
        if (targetId === 'documents') loadDocuments();
        if (targetId === 'profile') loadProfile();
        if (targetId === 'notifications') loadNotifications();
    });
}

/**
 * Utility: Authenticated Fetch
 * Standardizes API communication with token management.
 */
async function fetchData(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn("Authentication token missing.");
        return null;
    }

    const headers = {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
    };

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
        
        // Handle session expiration
        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = "../login.html";
            return null;
        }

        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error("API Fetch Error:", error);
        return null;
    }
}

/**
 * Profile Module
 * Handles fetching and rendering of employee profile data.
 */
async function loadProfile() {
    const data = await fetchData('/employee/profile/');
    if (!data) return;

    // Log for debugging (optional)
    console.log("PROFILE DATA:", data);

    // Helpers for safe DOM updates
    const setT = (id, text) => { 
        const el = document.getElementById(id); 
        if (el) el.innerText = text || "-"; 
    };
    const setV = (id, val) => { 
        const el = document.getElementById(id); 
        if (el) el.value = val || ""; 
    };

    // Summary Header Mapping
    const fullName = (data.first_name || "") + " " + (data.last_name || "");
    setT('emp_name', fullName);
    setT('emp_designation', data.designation);
    setT('emp_department', data.department || "N/A");
    setT('emp_email', data.email);
    setT('emp_phone', data.phone_number || "N/A");
    setT('emp_joining', data.date_of_joining || "N/A");

    // Detailed Form Mapping
    setV('prof-fname', data.first_name);
    setV('prof-lname', data.last_name);
    setV('prof-email', data.email);
    setV('prof-phone', data.phone_number);
    setV('prof-gender', data.gender);
    setV('prof-dob', formatDateForInput(data.date_of_birth));
    setV('prof-address', data.address);
    setV('prof-designation', data.designation);
    setV('prof-department', data.department || "N/A");
    setV('prof-empid', data.employee_id);
    setV('prof-joining', formatDateForInput(data.date_of_joining));
    setV('prof-bank', data.bank_name);
    setV('prof-acc', data.account_number);
    setV('prof-ifsc', data.ifsc_code);
    setV('prof-branch', data.branch_name);

    // Added Fields Mapping
    setV('prof-aadhaar', data.aadhaar_number);
    setV('prof-pan', data.pan_number);
    setV('prof-marital', data.marital_status);
    setV('prof-nationality', data.nationality);
    setV('prof-blood', data.blood_group);
    setV('prof-perm-address', data.permanent_address);
    setV('prof-emg-name', data.emergency_contact_name);
    setV('prof-emg-phone', data.emergency_contact_phone);
    setV('prof-emg-relation', data.emergency_contact_relation);
}

/**
 * Toggle Profile Mode
 * Switches between view-only and editable form states.
 */
/**
 * Enable Profile Editing
 * Removes readonly/disabled attributes from profile inputs.
 */
function enableEdit() {
    const inputs = document.querySelectorAll('.profile-input');
    inputs.forEach(input => {
        if (input.id === 'prof-email') return; // Email remains locked
        
        input.removeAttribute('readonly');
        input.removeAttribute('disabled');
        input.style.background = 'rgba(255,255,255,0.05)';
    });

    // Toggle buttons
    document.getElementById('edit-profile-btn').style.display = 'none';
    document.getElementById('save-profile-btn').style.display = 'inline-block';
}

/**
 * Lock Profile Fields
 * Re-applies readonly/disabled attributes to profile inputs.
 */
function lockFields() {
    const inputs = document.querySelectorAll('.profile-input');
    inputs.forEach(input => {
        input.setAttribute('readonly', true);
        if (input.tagName === 'SELECT') input.setAttribute('disabled', true);
        input.style.background = 'var(--bg-navy)';
    });

    // Toggle buttons
    document.getElementById('edit-profile-btn').style.display = 'inline-block';
    document.getElementById('save-profile-btn').style.display = 'none';
}


/**
 * Save Profile
 * Submits form data to the update endpoint.
 */
/**
 * Save Profile
 * Submits form data to the update endpoint.
 */
async function saveProfile() {
    const payload = {
        first_name: document.getElementById('prof-fname')?.value,
        last_name: document.getElementById('prof-lname')?.value,
        phone_number: document.getElementById('prof-phone')?.value,
        gender: document.getElementById('prof-gender')?.value,
        date_of_birth: document.getElementById('prof-dob')?.value || null,
        address: document.getElementById('prof-address')?.value,
        designation: document.getElementById('prof-designation')?.value,
        department: document.getElementById('prof-department')?.value,
        employee_id: document.getElementById('prof-empid')?.value,
        date_of_joining: document.getElementById('prof-joining')?.value || null,
        bank_name: document.getElementById('prof-bank')?.value,
        account_number: document.getElementById('prof-acc')?.value,
        ifsc_code: document.getElementById('prof-ifsc')?.value,
        branch_name: document.getElementById('prof-branch')?.value,
        
        // Added Fields
        aadhaar_number: document.getElementById('prof-aadhaar')?.value,
        pan_number: document.getElementById('prof-pan')?.value,
        marital_status: document.getElementById('prof-marital')?.value,
        nationality: document.getElementById('prof-nationality')?.value,
        blood_group: document.getElementById('prof-blood')?.value,
        permanent_address: document.getElementById('prof-perm-address')?.value,
        emergency_contact_name: document.getElementById('prof-emg-name')?.value,
        emergency_contact_phone: document.getElementById('prof-emg-phone')?.value,
        emergency_contact_relation: document.getElementById('prof-emg-relation')?.value
    };

    console.log('SAVE_PROFILE_PAYLOAD:', payload);

    const data = await fetchData('/employee/profile/update/', {
        method: 'PUT',
        body: JSON.stringify(payload)
    });

    console.log('SAVE_PROFILE_RESPONSE:', data);

    if (data) {
        alert('Profile updated successfully!');
        lockFields();
        loadProfile(); // Reload data to reflect changes
    } else {
        alert('Failed to save profile. Please check the console for details.');
    }
}


/**
 * Documents Module
 * Handles fetching and rendering of company documents.
 */
async function loadDocuments() {
    console.log("Fetching documents...");
    const list = document.getElementById('documents-list');
    if (!list) return;

    // Clear table before rendering
    list.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:2rem;">Loading documents...</td></tr>';

    try {
        const data = await fetchData('/employee/documents/');
        console.log("Documents Data:", data);

        let docsArray = [];
        if (Array.isArray(data)) {
            docsArray = data;
        } else if (data && typeof data === 'object') {
            // In case the API returns { documents: [...] }
            docsArray = data.documents || data.data || Object.values(data);
        }

        if (!docsArray || docsArray.length === 0) {
            list.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:2rem; color:var(--text-muted);">No documents available.</td></tr>';
            return;
        }

        list.innerHTML = '';
        docsArray.forEach(doc => {
            const dateStr = doc.uploaded_at || doc.created_at;
            const date = dateStr ? new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }) : 'Unknown Date';
            
            const fileUrl = doc.file || doc.file_url || '#';
            const title = doc.title || 'Untitled Document';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: 500;">${title}</td>
                <td>${date}</td>
                <td style="text-align: right;">
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <a href="${fileUrl}" target="_blank" class="btn btn-ghost" style="padding: 0.25rem 0.75rem; font-size:0.75rem; text-decoration: none;">
                            <i class="fa-solid fa-eye"></i> View
                        </a>
                        <a href="${fileUrl}" download class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size:0.75rem; text-decoration: none;">
                            <i class="fa-solid fa-download"></i> Download
                        </a>
                    </div>
                </td>
            `;
            list.appendChild(tr);
        });
    } catch (error) {
        console.error("Error loading documents:", error);
        list.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:2rem; color:var(--text-muted);">Failed to load documents.</td></tr>';
    }
}

// --- Dashboard Module ---
async function loadDashboardStats() {
    const stats = await fetchData('/employee/stats/');
    const today = await fetchData('/employee/attendance/today/');

    if (stats) {
        document.getElementById('dash-leave-bal').innerText = `${stats.total_leaves || 0} Days`;
    }
    
    if (today && today.length > 0) {
        const lastRec = today[today.length - 1];
        if (!lastRec.check_out) {
            document.getElementById('dash-status').innerText = 'Clocked In';
            document.getElementById('dash-status').style.color = '#10b981';
        } else {
            document.getElementById('dash-status').innerText = 'Clocked Out';
            document.getElementById('dash-status').style.color = 'var(--primary)';
        }
    } else {
        document.getElementById('dash-status').innerText = 'Not Clocked In';
        document.getElementById('dash-status').style.color = '#f59e0b';
    }

    const holidays = await fetchData('/employee/holidays/');
    if (holidays && holidays.length > 0) {
        const futureHolidays = holidays.filter(h => new Date(h.date) >= new Date());
        if (futureHolidays.length > 0) {
            document.getElementById('dash-next-hol').innerText = futureHolidays[0].name;
        }
    }

    const expenses = await fetchData('/employee/expenses/');
    if (expenses) {
        const pending = expenses.filter(e => e.status.toLowerCase() === 'pending');
        const totalPending = pending.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        document.getElementById('dash-expenses').innerText = `₹${totalPending.toFixed(2)}`;
    }
}

// --- Attendance Module ---
async function loadAttendance() {
    const list = document.getElementById('attendanceList');
    if (!list) return;
    list.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';
    
    const data = await fetchData('/employee/attendance/');
    if (!data || data.length === 0) {
        list.innerHTML = '<tr><td colspan="4" style="text-align:center;">No attendance records found.</td></tr>';
        return;
    }

    list.innerHTML = '';
    data.forEach(rec => {
        const date = new Date(rec.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        const checkIn = rec.check_in ? new Date(rec.check_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-';
        const checkOut = rec.check_out ? new Date(rec.check_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-';
        const status = rec.check_out ? '<span class="status active">Present</span>' : '<span class="status inactive">Clocked In</span>';
        
        list.innerHTML += `<tr><td>${date}</td><td>${checkIn}</td><td>${checkOut}</td><td>${status}</td></tr>`;
    });
}

document.getElementById('clock-in-btn')?.addEventListener('click', async () => {
    const res = await fetchData('/employee/attendance/clock-in/', { method: 'POST' });
    if (res) { alert('Clocked In successfully'); loadDashboardStats(); loadAttendance(); }
});

document.getElementById('clock-out-btn')?.addEventListener('click', async () => {
    const res = await fetchData('/employee/attendance/clock-out/', { method: 'POST' });
    if (res) { alert('Clocked Out successfully'); loadDashboardStats(); loadAttendance(); }
});

// --- Leaves Module ---
async function loadLeaves() {
    const list = document.getElementById('leavesList');
    if (!list) return;
    list.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';

    const data = await fetchData('/employee/leaves/');
    if (!data || data.length === 0) {
        list.innerHTML = '<tr><td colspan="4" style="text-align:center;">No leaves found.</td></tr>';
        return;
    }

    let approved = 0, pending = 0;
    list.innerHTML = '';
    data.forEach(l => {
        if (l.status.toLowerCase() === 'approved') approved++;
        if (l.status.toLowerCase() === 'pending') pending++;
        
        const sDate = new Date(l.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const eDate = new Date(l.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        let statusCls = l.status.toLowerCase() === 'approved' ? 'active' : (l.status.toLowerCase() === 'rejected' ? 'inactive' : '');
        if (!statusCls) statusCls = 'status'; // default for pending
        
        list.innerHTML += `<tr><td>${l.leave_type}</td><td>${sDate} - ${eDate}</td><td>${l.reason}</td><td><span class="status ${statusCls}">${l.status}</span></td></tr>`;
    });

    document.getElementById('leave-bal-total').innerText = data.length;
    document.getElementById('leave-bal-approved').innerText = approved;
    document.getElementById('leave-bal-pending').innerText = pending;
}

document.getElementById('applyLeaveForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        leave_type: document.getElementById('leaveType').value,
        start_date: document.getElementById('leaveStart').value,
        end_date: document.getElementById('leaveEnd').value,
        reason: document.getElementById('leaveReason').value
    };
    const res = await fetchData('/employee/leaves/apply/', { method: 'POST', body: JSON.stringify(payload) });
    if (res) {
        alert('Leave request submitted successfully! An email has been sent to your manager.');
        document.getElementById('leave-form-container').style.display = 'none';
        document.getElementById('applyLeaveForm').reset();
        loadLeaves();
    }
});

// --- Holidays Module ---
async function loadHolidays() {
    const list = document.getElementById('holidaysList');
    if (!list) return;
    list.innerHTML = '<tr><td colspan="2" style="text-align:center;">Loading...</td></tr>';
    const data = await fetchData('/employee/holidays/');
    if (!data || data.length === 0) {
        list.innerHTML = '<tr><td colspan="2" style="text-align:center;">No upcoming holidays.</td></tr>';
        return;
    }
    list.innerHTML = '';
    data.forEach(h => {
        const date = new Date(h.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        list.innerHTML += `<tr><td><strong>${h.name}</strong></td><td>${date}</td></tr>`;
    });
}

// --- Expenses Module ---
async function loadExpenses() {
    const list = document.getElementById('expensesList');
    if (!list) return;
    list.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';
    const data = await fetchData('/employee/expenses/');
    if (!data || data.length === 0) {
        list.innerHTML = '<tr><td colspan="4" style="text-align:center;">No expenses claimed.</td></tr>';
        return;
    }
    list.innerHTML = '';
    data.forEach(e => {
        const date = new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const statusCls = e.status.toLowerCase() === 'approved' ? 'active' : (e.status.toLowerCase() === 'rejected' ? 'inactive' : '');
        list.innerHTML += `<tr><td>${date}</td><td>${e.category}</td><td>₹${parseFloat(e.amount).toFixed(2)}</td><td><span class="status ${statusCls}">${e.status}</span></td></tr>`;
    });
}

document.getElementById('applyExpenseForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        category: document.getElementById('expenseCategory').value,
        date: document.getElementById('expenseDate').value,
        amount: document.getElementById('expenseAmount').value,
        description: document.getElementById('expenseDesc').value
    };
    const res = await fetchData('/employee/expenses/', { method: 'POST', body: JSON.stringify(payload) });
    if (res) {
        alert('Expense claimed successfully!');
        document.getElementById('expense-form-container').style.display = 'none';
        document.getElementById('applyExpenseForm').reset();
        loadExpenses();
        loadDashboardStats();
    }
});

// --- Tasks Module ---
async function loadTasks() {
    const list = document.getElementById('tasksList');
    if (!list) return;
    list.innerHTML = '<tr><td colspan="5" style="text-align:center;">Loading...</td></tr>';

    const data = await fetchData('/employee/tasks/');
    if (!data || data.length === 0) {
        list.innerHTML = '<tr><td colspan="5" style="text-align:center;">No tasks assigned.</td></tr>';
        return;
    }

    list.innerHTML = '';
    data.forEach(task => {
        const deadline = task.deadline || '-';
        const priorityColor = task.priority === 'High' ? '#f43f5e' : (task.priority === 'Medium' ? '#f59e0b' : '#10b981');
        const statusCls = task.status === 'Completed' ? 'active' : (task.status === 'In Progress' ? 'pending' : 'expired');
        
        list.innerHTML += `
            <tr>
                <td style="font-weight: 500;">${task.title}</td>
                <td style="font-size:0.85rem; color:var(--text-muted); max-width:250px;">${task.description || '-'}</td>
                <td style="font-size:0.85rem; color:var(--primary); max-width:200px;"><i>${task.employee_note || '-'}</i></td>
                <td>${deadline}</td>
                <td><span style="color:${priorityColor}">${task.priority}</span></td>
                <td><span class="status ${statusCls}">${task.status}</span></td>
                <td>
                    <div style="display:flex; gap:0.5rem;">
                        ${task.status !== 'Completed' ? `<button class="btn btn-primary" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;" onclick="updateTask(${task.id})">Update</button>` : '<span style="color:#10b981;"><i class="fa-solid fa-check"></i> Finished</span>'}
                    </div>
                </td>
            </tr>
        `;
    });
}

async function updateTask(taskId) {
    const note = prompt('Add a note or update task status (leave blank if none):');
    if (note === null) return;

    const markDone = confirm('Mark this task as completed?');
    
    const payload = { task_id: taskId };
    if (note) payload.employee_note = note;
    if (markDone) payload.status = 'Completed';

    const res = await fetchData('/employee/tasks/update/', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    
    if (res) {
        alert('Task updated!');
        loadTasks();
    }
}

// --- Org Chart Module ---
async function loadOrgChart() {
    const container = document.getElementById('orgChartTree');
    if (!container) return;
    container.innerHTML = '<div style="color:var(--text-muted); text-align:center;">Loading hierarchy...</div>';

    const data = await fetchData('/org-chart/');
    if (!data || data.length === 0) {
        container.innerHTML = '<div style="color:var(--text-muted); text-align:center;">No organization data found.</div>';
        return;
    }

    container.innerHTML = '';
    const treeRoot = document.createElement('ul');
    
    // Find top-level nodes (those whose manager is null)
    const topLevelNodes = data.filter(node => !node.manager);
    
    topLevelNodes.forEach(node => {
        treeRoot.appendChild(buildTreeNode(node, data));
    });
    
    container.appendChild(treeRoot);
}

function buildTreeNode(node, allData) {
    const li = document.createElement('li');
    
    // Node's content
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'tree-node';
    
    // extra content 
    if (node.work_mode) {
        const modeBadge = document.createElement('span');
        modeBadge.className = 'node-mode';
        modeBadge.innerText = node.work_mode;
        nodeDiv.appendChild(modeBadge);
    }
    
    // Profile picture
    if (node.profile_picture) {
        const img = document.createElement('img');
        img.src = node.profile_picture;
        img.className = 'node-img';
        nodeDiv.appendChild(img);
    } else {
        const icon = document.createElement('div');
        icon.className = 'node-img';
        icon.innerHTML = '<i class="fa-solid fa-user" style="margin-top:12px; font-size:1.5rem; color:var(--text-muted);"></i>';
        icon.style.display = 'flex';
        icon.style.justifyContent = 'center';
        nodeDiv.appendChild(icon);
    }
    
    // ID Badge
    const idBadge = document.createElement('span');
    idBadge.innerText = `#${node.id}`;
    idBadge.style = 'position:absolute; top:5px; right:5px; font-size:0.6rem; color:var(--text-muted); font-weight:bold;';
    nodeDiv.appendChild(idBadge);
    
    const name = document.createElement('span');
    name.className = 'node-name';
    name.innerText = node.name;
    
    const role = document.createElement('span');
    role.className = 'node-role';
    role.innerText = node.role;
    
    const dept = document.createElement('span');
    dept.className = 'node-dept';
    dept.innerText = node.department;
    
    nodeDiv.appendChild(name);
    nodeDiv.appendChild(role);
    nodeDiv.appendChild(dept);
    
    li.appendChild(nodeDiv);
    
    // children
    const children = allData.filter(item => item.manager === node.id);
    if (children.length > 0) {
        const ul = document.createElement('ul');
        children.forEach(child => {
            ul.appendChild(buildTreeNode(child, allData));
        });
        li.appendChild(ul);
    }
    
    return li;
}

// --- Notifications Module ---
async function loadNotifications() {
    const list = document.getElementById('receivedNotificationsList');
    if (!list) return;
    list.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading announcements...</td></tr>';

    const data = await fetchData('/notifications/');
    if (!data) return;

    list.innerHTML = '';
    if (data.received.length === 0) {
        list.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No announcements from management.</td></tr>';
        return;
    }

    data.received.forEach(notif => {
        const date = new Date(notif.created_at).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        list.innerHTML += `
            <tr>
                <td>${date}</td>
                <td style="font-weight:600; color:var(--primary);">${notif.title}</td>
                <td>${notif.message}</td>
                <td>${notif.sender_name} (${notif.sender_role})</td>
            </tr>
        `;
    });
}
