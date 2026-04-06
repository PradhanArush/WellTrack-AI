from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from datetime import date, datetime
from .models import Meal, WaterIntake
from .serializers import (
    MealSerializer, WaterIntakeSerializer,
    DailyNutritionSummarySerializer
)

class MealListCreateView(generics.ListCreateAPIView):
    serializer_class = MealSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Meal.objects.filter(user=self.request.user)
        date_param = self.request.query_params.get('date', None)
        if date_param:
            queryset = queryset.filter(date=date_param)
        return queryset


class MealDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MealSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Meal.objects.filter(user=self.request.user)


class WaterIntakeListCreateView(generics.ListCreateAPIView):
    serializer_class = WaterIntakeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = WaterIntake.objects.filter(user=self.request.user)
        date_param = self.request.query_params.get('date', None)
        if date_param:
            queryset = queryset.filter(date=date_param)
        return queryset


class WaterIntakeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = WaterIntakeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WaterIntake.objects.filter(user=self.request.user)


class DailyNutritionSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = request.query_params.get('date', date.today())
        if isinstance(today, str):
            today = datetime.strptime(today, '%Y-%m-%d').date()

        meals = Meal.objects.filter(user=request.user, date=today)
        water = WaterIntake.objects.filter(user=request.user, date=today)

        totals = meals.aggregate(
            total_calories=Sum('calories'),
            total_protein=Sum('protein'),
            total_carbs=Sum('carbs'),
            total_fiber=Sum('fiber'),
            total_fats=Sum('fats')
        )

        water_total = water.aggregate(total_water=Sum('amount_ml'))

        summary = {
            'date': today,
            'total_calories': totals['total_calories'] or 0,
            'total_protein': totals['total_protein'] or 0,
            'total_carbs': totals['total_carbs'] or 0,
            'total_fiber': totals['total_fiber'] or 0,
            'total_fats': totals['total_fats'] or 0,
            'total_water_ml': water_total['total_water'] or 0,
            'meal_count': meals.count()
        }

        serializer = DailyNutritionSummarySerializer(summary)
        return Response(serializer.data)