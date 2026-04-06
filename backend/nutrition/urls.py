from django.urls import path
from .views import (
    MealListCreateView, MealDetailView,
    WaterIntakeListCreateView, WaterIntakeDetailView, DailyNutritionSummaryView
)

urlpatterns = [
    path('meals/', MealListCreateView.as_view(), name='meal-list-create'),
    path('meals/<int:pk>/', MealDetailView.as_view(), name='meal-detail'),
    path('water/', WaterIntakeListCreateView.as_view(), name='water-list-create'),
    path('water/<int:pk>/', WaterIntakeDetailView.as_view(), name='water-detail'),
    path('summary/', DailyNutritionSummaryView.as_view(), name='daily-summary'),
]