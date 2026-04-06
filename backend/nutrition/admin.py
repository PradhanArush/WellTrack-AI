from django.contrib import admin
from .models import Meal, WaterIntake

@admin.register(Meal)
class MealAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'meal_type', 'date', 'calories', 'protein']
    list_filter = ['meal_type', 'date', 'user']
    search_fields = ['name', 'user__username']
    date_hierarchy = 'date'

@admin.register(WaterIntake)
class WaterIntakeAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'amount_ml', 'time']
    list_filter = ['date', 'user']
    date_hierarchy = 'date'