import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'newproject.settings')
django.setup()

from myapp.models import User, Employee, AdminProfile

def create_users():
    # Admin
    if not User.objects.filter(username='testadmin').exists():
        admin = User.objects.create_user(username='testadmin', email='testadmin@example.com', password='password123', role='admin')
        AdminProfile.objects.create(user=admin)
        print("Admin created: testadmin / password123")
    else:
        print("Admin testadmin already exists")
        
    # Manager
    if not User.objects.filter(username='testmanager').exists():
        manager = User.objects.create_user(username='testmanager', email='testmanager@example.com', password='password123', role='manager')
        Employee.objects.create(user=manager)
        print("Manager created: testmanager / password123")
        
    # Employee
    if not User.objects.filter(username='testemployee').exists():
        emp = User.objects.create_user(username='testemployee', email='testemployee@example.com', password='password123', role='employee')
        Employee.objects.create(user=emp)
        print("Employee created: testemployee / password123")

create_users()

"""
users_to_reset = [
    ('manager', 'manager123'),
    ('manager@hrms.com', 'manager123'),
    ('employee', 'employee123'),
    ('employee@hrms.com', 'employee123'),
    ('admin', 'admin123'),
    ('testadmin', 'password123')
]
"""