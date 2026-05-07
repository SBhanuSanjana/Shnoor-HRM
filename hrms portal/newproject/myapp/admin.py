from django.contrib import admin
from .models import (
    User, Company, SubscriptionPlan, Transactions, 
    Employee, SupportQuery, Holiday, Appreciation, 
    LeaveRequest, CompanyPolicy, Payroll, Offboarding, LetterHead, AdminProfile
)

from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'role', 'phone_number', 'location', 'is_staff')
    list_filter = ('role', 'is_staff', 'is_superuser')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile Information', {'fields': ('role', 'phone_number', 'location')}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Profile Information', {'fields': ('role', 'phone_number', 'location')}),
    )

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'is_active', 'license_expired', 'created_at')
    list_filter = ('is_active', 'license_expired')

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('user', 'designation', 'department', 'salary')
    list_filter = ('department', 'designation')

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'duration_months')

@admin.register(Transactions)
class TransactionsAdmin(admin.ModelAdmin):
    list_display = ('company', 'subscription_plan', 'amount', 'transaction_date')

@admin.register(SupportQuery)
class SupportQueryAdmin(admin.ModelAdmin):
    list_display = ('sender', 'subject', 'status', 'created_at')
    list_filter = ('status',)

@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = ('name', 'date')

@admin.register(Appreciation)
class AppreciationAdmin(admin.ModelAdmin):
    list_display = ('sender', 'recipient', 'title', 'amount', 'created_at')

@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ('employee', 'leave_type', 'start_date', 'end_date', 'status')
    list_filter = ('status', 'leave_type')

@admin.register(CompanyPolicy)
class CompanyPolicyAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at', 'updated_at')

@admin.register(Payroll)
class PayrollAdmin(admin.ModelAdmin):
    list_display = ('employee', 'amount', 'payment_date', 'month_year', 'status')
    list_filter = ('status', 'month_year')

@admin.register(Offboarding)
class OffboardingAdmin(admin.ModelAdmin):
    list_display = ('employee', 'action_type', 'date')
    list_filter = ('action_type',)

@admin.register(LetterHead)
class LetterHeadAdmin(admin.ModelAdmin):
    list_display = ('title', 'document_type', 'created_at')
    list_filter = ('document_type',)
@admin.register(AdminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'created_at', 'updated_at')
