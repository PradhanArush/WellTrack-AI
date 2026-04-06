from django.urls import path
from .views import FoodScanAnalyzeView

urlpatterns = [
    path('analyze/', FoodScanAnalyzeView.as_view(), name='foodscan-analyze'),
]
