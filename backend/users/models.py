from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    height = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Height in cm")
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Weight in kg")
    gender = models.CharField(max_length=10, choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')], blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Nutrition Goals
    calorie_goal = models.IntegerField(default=2000)
    protein_goal = models.IntegerField(default=150)
    carbs_goal = models.IntegerField(default=250)
    fiber_goal = models.IntegerField(default=30)
    fats_goal = models.IntegerField(default=65)
    water_goal_ml = models.IntegerField(default=2000)
    dashboard_widgets = models.JSONField(default=list)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email