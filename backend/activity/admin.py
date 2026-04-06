from django.contrib import admin
from .models import Activity, WorkoutExercise, ActivityGoal

class WorkoutExerciseInline(admin.TabularInline):
    model = WorkoutExercise
    extra = 1

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'activity_type', 'date', 'duration_minutes', 'calories_burned']
    list_filter = ['activity_type', 'intensity', 'date', 'user']
    search_fields = ['title', 'user__username']
    date_hierarchy = 'date'
    inlines = [WorkoutExerciseInline]

@admin.register(WorkoutExercise)
class WorkoutExerciseAdmin(admin.ModelAdmin):
    list_display = ['exercise_name', 'activity', 'sets', 'reps', 'weight_kg']
    list_filter = ['activity__activity_type']
    search_fields = ['exercise_name', 'activity__title']

@admin.register(ActivityGoal)
class ActivityGoalAdmin(admin.ModelAdmin):
    list_display = ['user', 'goal_type', 'target_workouts', 'start_date', 'end_date', 'is_active']
    list_filter = ['goal_type', 'is_active', 'user']
    date_hierarchy = 'start_date'