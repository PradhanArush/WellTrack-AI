from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['email', 'username', 'full_name', 'is_staff', 'created_at']
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('full_name', 'date_of_birth', 'height', 'weight', 
                                        'gender', 'profile_picture', 'calorie_goal', 
                                        'protein_goal', 'carbs_goal', 'fiber_goal', 'fats_goal')}),
    )