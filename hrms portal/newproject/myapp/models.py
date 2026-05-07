from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

class User(AbstractUser):
    ROLE_CHOICES = (
        ('super_admin', 'Super Admin'),
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('team_leader', 'Team Leader'),
        ('employee', 'Employee'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    
    def __str__(self):
        return f"{self.username} ({self.role})"

class SuperAdmin(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='super_admin_profile')
    can_manage_admins = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"SuperAdmin: {self.user.username}"

class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    duration_months = models.IntegerField(default=1)
    features = models.TextField(blank=True)
    trial_period_days = models.IntegerField(default=7)

    def __str__(self):
        return self.name

class Company(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    members_count = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    license_expired = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    
class Transactions(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='transactions')
    subscription_plan = models.ForeignKey(SubscriptionPlan, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_date = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        plan_name = self.subscription_plan.name if self.subscription_plan else "No Plan"
        return f"{self.company.name} - {plan_name} - ₹{self.amount}"

class Employee(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    team_leader = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='team_members')
    designation = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    salary = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    casual_leaves = models.IntegerField(default=6)
    sick_leaves = models.IntegerField(default=6)
    vacation_leaves = models.IntegerField(default=6)
    
    # Personal Details
    phone = models.CharField(max_length=15, blank=True, null=True)
    gender = models.CharField(max_length=10, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    # Professional Details
    employee_id = models.CharField(max_length=50, blank=True, null=True)
    joining_date = models.DateField(blank=True, null=True)

    # Bank Details
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    account_number = models.CharField(max_length=50, blank=True, null=True)
    ifsc_code = models.CharField(max_length=20, blank=True, null=True)
    branch = models.CharField(max_length=100, blank=True, null=True)
    
    # New Personal Fields
    aadhaar_number = models.CharField(max_length=12, blank=True, null=True)
    pan_number = models.CharField(max_length=10, blank=True, null=True)
    marital_status = models.CharField(max_length=20, blank=True, null=True)
    nationality = models.CharField(max_length=100, blank=True, null=True)
    permanent_address = models.TextField(blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=15, blank=True, null=True)
    emergency_contact_relation = models.CharField(max_length=100, blank=True, null=True)
    blood_group = models.CharField(max_length=10, blank=True, null=True)
    
    def __str__(self):
        return self.user.username

class SupportQuery(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
    ]
    
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_queries')
    subject = models.CharField(max_length=255)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.sender.username} - {self.subject}"

class Holiday(models.Model):
    name = models.CharField(max_length=255)
    date = models.DateField()
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.date}"

class Appreciation(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_appreciations')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_appreciations')
    title = models.CharField(max_length=255)
    description = models.TextField()
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} for {self.recipient.username}"

class LeaveRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.CharField(max_length=100) 
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee.username} - {self.leave_type} ({self.status})"

class CompanyPolicy(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    file = models.FileField(upload_to='policies/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

class Payroll(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    month_year = models.CharField(max_length=20) 
    status = models.CharField(max_length=20, default='paid')

    def __str__(self):
        return f"{self.employee.user.username} - {self.amount} - {self.month_year}"

class Offboarding(models.Model):
    TYPE_CHOICES = [
        ('warning', 'Warning'),
        ('termination', 'Termination'),
        ('resignation', 'Resignation'),
        ('complaint', 'Complaint'),
    ]
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='offboardings')
    action_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    reason = models.TextField()
    date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action_type.capitalize()} - {self.employee.user.username}"

class LetterHead(models.Model):
    TYPE_CHOICES = [
        ('internship_offer', 'Internship Offer Letter'),
        ('self_declaration', 'Self Declaration Form'),
        ('payslip', 'Payslip'),
        ('employment_bond', 'Employment Bond'),
    ]
    title = models.CharField(max_length=255)
    document_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    file = models.FileField(upload_to='letterheads/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.get_document_type_display()})"

class AdminProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='admin_profile')
    bio = models.TextField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Admin Profile: {self.user.username}"

class Attendance(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField(auto_now_add=True)
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    hours_worked = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.employee.user.username} - {self.date}"



@receiver(post_save, sender=User)
def create_admin_profile(sender, instance, created, **kwargs):
    if instance.role == 'admin':
        AdminProfile.objects.get_or_create(user=instance)

@receiver(post_save, sender=User)
def save_admin_profile(sender, instance, **kwargs):
    if instance.role == 'admin':
        if hasattr(instance, 'admin_profile'):
            instance.admin_profile.save()
        else:
            AdminProfile.objects.create(user=instance)

class Asset(models.Model):
    STATUS_CHOICES = [
        ('available','Available'),
        ('assigned','Assigned'),
        ('maintenance','Under Maintenance'),
    ]
    name = models.CharField(max_length=100)
    asset_type = models.CharField(max_length=100)
    serial_number = models.CharField(max_length=100,unique=True)
    assigned_to = models.ForeignKey(Employee,on_delete=models.SET_NULL,null=True,blank=True,related_name='assigned_assets')
    status = models.CharField(max_length=20,choices=STATUS_CHOICES,default='available')
    purchase_date=models.DateField(null=True,blank=True)
    created_at = models.DateField(auto_now_add=True)

    def __str__(self): 
        return f"{self.name}({self.serial_number})"

class Expense(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('reimbursed', 'Reimbursed'),
    ]
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='expenses')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    date = models.DateField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.employee.user.username} - {self.category} - ₹{self.amount}"

class Task(models.Model):
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    deadline = models.DateField()
    priority = models.CharField(max_length=20)
    status = models.CharField(max_length=20, default="Pending")
    description = models.TextField(blank=True, null=True)
    employee_note = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_tasks')
    assigned_team_leader = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='team_leader_assigned_tasks')
    assigned_by_team_leader = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='team_leader_created_tasks')
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} - {self.assigned_to.username}"

class CompanyDocument(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class ManagerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='manager_profile')
    phone = models.CharField(max_length=15, blank=True, null=True)
    gender = models.CharField(max_length=10, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
    designation = models.CharField(max_length=100, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    employee_id = models.CharField(max_length=50, blank=True, null=True)
    joining_date = models.DateField(blank=True, null=True)
    
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    account_number = models.CharField(max_length=50, blank=True, null=True)
    ifsc_code = models.CharField(max_length=20, blank=True, null=True)
    branch = models.CharField(max_length=100, blank=True, null=True)
    
    # New Personal Fields
    aadhaar_number = models.CharField(max_length=12, blank=True, null=True)
    pan_number = models.CharField(max_length=10, blank=True, null=True)
    marital_status = models.CharField(max_length=20, blank=True, null=True)
    nationality = models.CharField(max_length=100, blank=True, null=True)
    permanent_address = models.TextField(blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=15, blank=True, null=True)
    emergency_contact_relation = models.CharField(max_length=100, blank=True, null=True)
    blood_group = models.CharField(max_length=10, blank=True, null=True)
    
    profile_picture = models.FileField(upload_to='profiles/', blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Manager Profile: {self.user.username}"

@receiver(post_save, sender=User)
def create_manager_profile(sender, instance, created, **kwargs):
    if created and instance.role == 'manager':
        ManagerProfile.objects.get_or_create(user=instance)

class TeamLeaderProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='team_leader_profile')
    phone = models.CharField(max_length=15, blank=True, null=True)
    gender = models.CharField(max_length=10, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
    designation = models.CharField(max_length=100, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    employee_id = models.CharField(max_length=50, blank=True, null=True)
    joining_date = models.DateField(blank=True, null=True)
    
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    account_number = models.CharField(max_length=50, blank=True, null=True)
    ifsc_code = models.CharField(max_length=20, blank=True, null=True)
    branch = models.CharField(max_length=100, blank=True, null=True)
    
    # New Personal Fields
    aadhaar_number = models.CharField(max_length=12, blank=True, null=True)
    pan_number = models.CharField(max_length=10, blank=True, null=True)
    marital_status = models.CharField(max_length=20, blank=True, null=True)
    nationality = models.CharField(max_length=100, blank=True, null=True)
    permanent_address = models.TextField(blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=15, blank=True, null=True)
    emergency_contact_relation = models.CharField(max_length=100, blank=True, null=True)
    blood_group = models.CharField(max_length=10, blank=True, null=True)
    
    profile_picture = models.FileField(upload_to='profiles/', blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Team Leader Profile: {self.user.username}"

@receiver(post_save, sender=User)
def create_team_leader_profile(sender, instance, created, **kwargs):
    if created and instance.role == 'team_leader':
        TeamLeaderProfile.objects.get_or_create(user=instance)

class OrgChart(models.Model):
    WORK_MODE_CHOICES=[
        ('onsite','Onsite'),
        ('hybrid','Hybrid'),
        ('remote','Remote'),
    ]
    name=models.CharField(max_length=100)
    role=models.CharField(max_length=100)
    profile_picture=models.FileField(upload_to='orgchart',null=True,blank=True)
    department=models.CharField(max_length=100)
    company_name=models.CharField(max_length=100)
    employee_months=models.IntegerField()
    work_mode=models.CharField(max_length=50,choices=WORK_MODE_CHOICES,default='remote')
    manager=models.ForeignKey('self',on_delete=models.SET_NULL,null=True,blank=True,related_name='subordinates')

    def __str__(self):
        return f"{self.name} - {self.role}"

class Notification(models.Model):
    ROLE_CHOICES = [
        ('manager', 'Manager'),
        ('employee', 'Employee'),
    ]
    title = models.CharField(max_length=255)
    message = models.TextField()
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_notifications')
    target_role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.target_role}"