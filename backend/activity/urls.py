from django.urls import path
from .views import (
    ActivityListCreateView, ActivityDetailView, WorkoutExerciseListCreateView,
    ActivityGoalListCreateView, ActivityGoalDetailView, WeeklyActivitySummaryView
)

urlpatterns = [
    path('activities/', ActivityListCreateView.as_view(), name='activity-list-create'),
    path('activities/<int:pk>/', ActivityDetailView.as_view(), name='activity-detail'),
    path('activities/<int:activity_id>/exercises/', WorkoutExerciseListCreateView.as_view(), name='exercise-list-create'),
    path('goals/', ActivityGoalListCreateView.as_view(), name='goal-list-create'),
    path('goals/<int:pk>/', ActivityGoalDetailView.as_view(), name='goal-detail'),
    path('summary/', WeeklyActivitySummaryView.as_view(), name='weekly-summary'),
]