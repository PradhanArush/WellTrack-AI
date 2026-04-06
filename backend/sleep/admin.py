from django.contrib import admin
from .models import SleepLog, SleepGoal

@admin.register(SleepLog)
class SleepLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'duration_hours', 'quality', 'bedtime', 'wake_time']
    list_filter = ['quality', 'date', 'user', 'had_caffeine', 'exercised']
    search_fields = ['user__username', 'notes']
    date_hierarchy = 'date'

@admin.register(SleepGoal)
class SleepGoalAdmin(admin.ModelAdmin):
    list_display = ['user', 'target_hours', 'target_bedtime', 'target_wake_time']
    search_fields = ['user__username']