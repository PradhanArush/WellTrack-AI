from django.urls import path
from .views import (
    SleepLogListCreateView, SleepLogDetailView, SleepGoalView,
    WeeklySleepSummaryView, MonthlySleepStatsView
)

urlpatterns = [
    path('logs/', SleepLogListCreateView.as_view(), name='sleep-log-list-create'),
    path('logs/<int:pk>/', SleepLogDetailView.as_view(), name='sleep-log-detail'),
    path('goal/', SleepGoalView.as_view(), name='sleep-goal'),
    path('summary/weekly/', WeeklySleepSummaryView.as_view(), name='weekly-summary'),
    path('summary/monthly/', MonthlySleepStatsView.as_view(), name='monthly-stats'),
]