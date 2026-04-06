from django.db import models
from django.conf import settings

class SleepLog(models.Model):
    QUALITY_CHOICES = [
        (1, 'Very Poor'),
        (2, 'Poor'),
        (3, 'Below Average'),
        (4, 'Fair'),
        (5, 'Average'),
        (6, 'Good'),
        (7, 'Very Good'),
        (8, 'Great'),
        (9, 'Excellent'),
        (10, 'Perfect'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sleep_logs')
    date = models.DateField(help_text="The date you went to bed")
    bedtime = models.TimeField()
    wake_time = models.TimeField()
    duration_hours = models.DecimalField(max_digits=4, decimal_places=2, help_text="Total sleep duration in hours")
    quality = models.IntegerField(choices=QUALITY_CHOICES, help_text="Rate your sleep quality 1-10")
    
    # Additional metrics
    fell_asleep_minutes = models.IntegerField(null=True, blank=True, help_text="Time taken to fall asleep in minutes")
    times_woken = models.IntegerField(default=0, help_text="Number of times you woke up")
    
    # Factors affecting sleep
    had_caffeine = models.BooleanField(default=False)
    had_alcohol = models.BooleanField(default=False)
    exercised = models.BooleanField(default=False)
    stressed = models.BooleanField(default=False)
    
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']
        unique_together = ['user', 'date']

    def __str__(self):
        return f"{self.user.username} - {self.date} ({self.duration_hours}h)"


class SleepGoal(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sleep_goal')
    target_hours = models.DecimalField(max_digits=3, decimal_places=1, default=8.0, help_text="Target sleep hours per night")
    target_bedtime = models.TimeField(help_text="Target bedtime")
    target_wake_time = models.TimeField(help_text="Target wake time")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Sleep Goal - {self.target_hours}h"
