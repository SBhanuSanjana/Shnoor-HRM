// Simple JS Navigation
const navItems = document.querySelectorAll('.nav-item[data-target]');
const views = document.querySelectorAll('.view-section');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        // Remove active from all links and views
        navItems.forEach(nav => nav.classList.remove('active'));
        views.forEach(view => view.classList.remove('active'));

        // Add active to clicked link and corresponding view
        item.classList.add('active');
        const targetId = item.getAttribute('data-target');
        const targetView = document.getElementById(targetId);
        
        if(targetView) {
            targetView.classList.add('active');
            // Load data based on target
            if (targetId === 'notifications') loadNotifications();
            if (targetId === 'companies') loadCompanies();
            if (targetId === 'orgchart') loadOrgChart();
        } else {
            // Fallback for empty views
            document.getElementById('dashboard').classList.add('active');
            alert('This section is currently empty or under development.');
        }
    });
});

const API_BASE = 'http://127.0.0.1:8000/api';
const getToken = () => localStorage.getItem('token');

const getHeaders = () => {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Token ${getToken()}`
    };
};

async function loadCompanies() {
    try {
        const res = await fetch(`${API_BASE}/admin/companies/`, {
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch companies');
        const companies = await res.json();
        
        renderCompaniesList(companies);
        updateDashboardCounts(companies);
    } catch (err) {
        console.error('Error loading companies:', err);
    }
}

function renderCompaniesList(companies) {
    const list = document.getElementById('companiesList');
    if (!list) return;
    
    list.innerHTML = '';
    companies.forEach(company => {
        const tr = document.createElement('tr');
        
        const statusBadge = company.is_active 
            ? `<span class="status active" style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.875rem;">Active</span>`
            : `<span class="status inactive" style="background: rgba(244, 63, 94, 0.1); color: #f43f5e; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.875rem;">Inactive</span>`;

        tr.innerHTML = `
            <td>${company.name}</td>
            <td>${company.email}</td>
            <td>${company.members_count || 0}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn" style="background: var(--bg-card); border: 1px solid var(--glass-border); color: #fff; padding: 0.25rem 0.5rem; margin-right: 0.5rem;" onclick="toggleCompanyStatus(${company.id}, ${company.is_active})">
                    <i class="fa-solid fa-power-off" style="color: ${company.is_active ? '#f59e0b' : '#10b981'}"></i>
                </button>
                <button class="btn" style="background: var(--bg-card); border: 1px solid var(--glass-border); color: #f43f5e; padding: 0.25rem 0.5rem;" onclick="deleteCompany(${company.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        list.appendChild(tr);
    });
}

function updateDashboardCounts(companies) {
    const totalEl = document.getElementById('dash-total');
    const activeEl = document.getElementById('dash-active');
    const inactiveEl = document.getElementById('dash-inactive');
    
    if (!totalEl || !activeEl || !inactiveEl) return;
    
    const activeCount = companies.filter(c => c.is_active).length;
    const inactiveCount = companies.filter(c => !c.is_active).length;
    
    totalEl.innerText = companies.length;
    activeEl.innerText = activeCount;
    inactiveEl.innerText = inactiveCount;
}

// Add Company
const addCompanyForm = document.getElementById('addCompanyForm');
if (addCompanyForm) {
    addCompanyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('newCompanyName').value;
        const email = document.getElementById('newCompanyEmail').value;
        
        try {
            const res = await fetch(`${API_BASE}/admin/companies/`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ name, email, is_active: true })
            });
            
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to add company');
            }
            
            addCompanyForm.reset();
            loadCompanies();
            console.log('Company added successfully');
        } catch (err) {
            console.error('Error adding company:', err);
            alert(err.message);
        }
    });
}

// Toggle Status
window.toggleCompanyStatus = async function(id, currentStatus) {
    try {
        const res = await fetch(`${API_BASE}/admin/companies/${id}/`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ is_active: !currentStatus })
        });
        
        if (!res.ok) throw new Error('Failed to update status');
        loadCompanies();
        console.log(`Company ${id} status toggled`);
    } catch (err) {
        console.error('Error updating status:', err);
        alert('Failed to update company status');
    }
};

// Delete Company
window.deleteCompany = async function(id) {
    if (!confirm('Are you sure you want to delete this company? This action cannot be undone.')) return;
    
    try {
        const res = await fetch(`${API_BASE}/admin/companies/${id}/`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        if (!res.ok) throw new Error('Failed to delete company');
        loadCompanies();
        console.log(`Company ${id} deleted`);
    } catch (err) {
        console.error('Error deleting company:', err);
        alert('Failed to delete company');
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCompanies();
    loadOrgChart();
});

// Org Chart Functions
async function loadOrgChart() {
    const container = document.getElementById('orgChartTree');
    if (!container) return;
    container.innerHTML = '<div style="color:var(--text-muted); text-align:center;">Loading hierarchy...</div>';

    try {
        const res = await fetch(`${API_BASE}/org-chart/`, {
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch org chart');
        const data = await res.json();
        
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
    } catch (err) {
        console.error('Error loading org chart:', err);
        container.innerHTML = '<div style="color:#f43f5e; text-align:center;">Error loading org chart</div>';
    }
}

function buildTreeNode(node, allData) {
    const li = document.createElement('li');
    
    // Node content
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'tree-node';
    
    // Add mode badge
    if (node.work_mode) {
        const modeBadge = document.createElement('span');
        modeBadge.className = 'node-mode';
        modeBadge.innerText = node.work_mode;
        nodeDiv.appendChild(modeBadge);
    }
    
    // Profile picture (fallback to icon)
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
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    deleteBtn.className = 'btn btn-ghost';
    deleteBtn.style = 'position:absolute; bottom:5px; right:5px; padding:0.25rem; font-size:0.7rem; color:#f43f5e; opacity:0.3;';
    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        deleteOrgNode(node.id);
    };
    deleteBtn.onmouseover = () => deleteBtn.style.opacity = '1';
    deleteBtn.onmouseout = () => deleteBtn.style.opacity = '0.3';
    
    nodeDiv.appendChild(name);
    nodeDiv.appendChild(role);
    nodeDiv.appendChild(dept);
    nodeDiv.appendChild(deleteBtn);
    
    li.appendChild(nodeDiv);
    
    // Recursive children
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

const addOrgNodeForm = document.getElementById('addOrgNodeForm');
if (addOrgNodeForm) {
    addOrgNodeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const managerValue = document.getElementById('nodeManager').value.trim();
        const payload = {
            name: document.getElementById('nodeName').value,
            role: document.getElementById('nodeRole').value,
            department: document.getElementById('nodeDept').value,
            company_name: document.getElementById('nodeCompany').value,
            employee_months: parseInt(document.getElementById('nodeMonths').value) || 0,
            work_mode: document.getElementById('nodeWorkMode').value,
            manager: managerValue ? parseInt(managerValue) : null
        };
        
        try {
            const res = await fetch(`${API_BASE}/org-chart/`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });
            
            if (!res.ok) throw new Error('Failed to add node');
            
            addOrgNodeForm.reset();
            loadOrgChart();
            alert('Node added successfully');
        } catch (err) {
            console.error('Error adding node:', err);
            alert('Error adding node');
        }
    });
}

window.deleteOrgNode = async function(id) {
    if (!confirm('Delete this node from org chart?')) return;
    
    try {
        const res = await fetch(`${API_BASE}/org-chart/${id}/`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        if (!res.ok) throw new Error('Failed to delete node');
        loadOrgChart();
    } catch (err) {
        console.error('Error deleting node:', err);
        alert('Error deleting node');
    }
};

// Notifications Logic
async function loadNotifications() {
    const list = document.getElementById('sentNotificationsList');
    if (!list) return;
    list.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading...</td></tr>';

    try {
        const res = await fetch(`${API_BASE}/notifications/`, {
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch notifications');
        const data = await res.json();
        
        list.innerHTML = '';
        data.sent.forEach(notif => {
            const date = new Date(notif.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${date}</td>
                <td style="font-weight:600;">${notif.title}</td>
                <td>${notif.message}</td>
                <td><span class="status active" style="font-size:0.75rem;">${notif.target_role.toUpperCase()}</span></td>
            `;
            list.appendChild(tr);
        });
    } catch (err) {
        console.error('Error loading notifications:', err);
        list.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#f43f5e;">Error loading notifications</td></tr>';
    }
}

const sendNotificationForm = document.getElementById('sendNotificationForm');
if (sendNotificationForm) {
    sendNotificationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('notifTitle').value;
        const message = document.getElementById('notifMessage').value;

        try {
            const res = await fetch(`${API_BASE}/notifications/`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ title, message })
            });

            if (!res.ok) throw new Error('Failed to send announcement');

            alert('Announcement sent successfully!');
            sendNotificationForm.reset();
            loadNotifications();
        } catch (err) {
            console.error('Error sending notification:', err);
            alert('Error sending announcement');
        }
    });
}
