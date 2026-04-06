from django.db import models
from django.conf import settings

class Activity(models.Model):
    ACTIVITY_TYPES = [
        ('weight_training', 'Weight Training'),
        ('running', 'Running'),
        ('walking', 'Walking'),
        ('swimming', 'Swimming'),
        ('yoga', 'Yoga'),
        ('cycling', 'Cycling'),
        ('other', 'Other'),
    ]
    
    INTENSITY_LEVELS = [
        ('low', 'Low'),
        ('moderate', 'Moderate'),
        ('high', 'High'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPES)
    title = models.CharField(max_length=255)
    date = models.DateField()
    start_time = models.TimeField()
    duration_minutes = models.IntegerField(help_text="Duration in minutes")
    calories_burned = models.IntegerField()
    distance_km = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="Distance in kilometers")
    intensity = models.CharField(max_length=20, choices=INTENSITY_LEVELS, default='moderate')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-start_time']
        verbose_name_plural = 'Activities'

    def __str__(self):
        return f"{self.user.username} - {self.activity_type} on {self.date}"


class WorkoutExercise(models.Model):
    """For detailed weight training exercises"""
    activity = models.ForeignKey(Activity, on_delete=models.CASCADE, related_name='exercises')
    exercise_name = models.CharField(max_length=255)
    sets = models.IntegerField(default=3)
    reps = models.IntegerField(default=10)
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.exercise_name} - {self.sets}x{self.reps}"


class ActivityGoal(models.Model):
    """Weekly or monthly activity goals"""
    GOAL_TYPES = [
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='activity_goals')
    goal_type = models.CharField(max_length=20, choices=GOAL_TYPES)
    target_workouts = models.IntegerField(help_text="Number of workouts to complete")
    target_minutes = models.IntegerField(help_text="Total minutes of exercise")
    target_calories = models.IntegerField(help_text="Total calories to burn")
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.goal_type} goal"