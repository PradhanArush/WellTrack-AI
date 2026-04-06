from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count
from datetime import date, timedelta
from .models import Activity, WorkoutExercise, ActivityGoal
from .serializers import (
    ActivitySerializer, ActivityCreateSerializer, WorkoutExerciseSerializer,
    ActivityGoalSerializer, WeeklyActivitySummarySerializer
)

class ActivityListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ActivityCreateSerializer
        return ActivitySerializer

    def get_queryset(self):
        queryset = Activity.objects.filter(user=self.request.user)
        date_param = self.request.query_params.get('date', None)
        activity_type = self.request.query_params.get('type', None)
        
        if date_param:
            queryset = queryset.filter(date=date_param)
        if activity_type:
            queryset = queryset.filter(activity_type=activity_type)
        
        return queryset


class ActivityDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Activity.objects.filter(user=self.request.user)


class WorkoutExerciseListCreateView(generics.ListCreateAPIView):
    serializer_class = WorkoutExerciseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        activity_id = self.kwargs.get('activity_id')
        return WorkoutExercise.objects.filter(activity_id=activity_id, activity__user=self.request.user)

    def perform_create(self, serializer):
        activity_id = self.kwargs.get('activity_id')
        activity = Activity.objects.get(id=activity_id, user=self.request.user)
        serializer.save(activity=activity)


class ActivityGoalListCreateView(generics.ListCreateAPIView):
    serializer_class = ActivityGoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ActivityGoal.objects.filter(user=self.request.user, is_active=True)


class ActivityGoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ActivityGoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ActivityGoal.objects.filter(user=self.request.user)


class WeeklyActivitySummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get date range (last 7 days)
        end_date = date.today()
        start_date = end_date - timedelta(days=7)

        activities = Activity.objects.filter(
            user=request.user,
            date__gte=start_date,
            date__lte=end_date
        )

        # Calculate totals
        totals = activities.aggregate(
            total_workouts=Count('id'),
            total_minutes=Sum('duration_minutes'),
            total_calories=Sum('calories_burned'),
            total_distance=Sum('distance_km')
        )

        # Activities by type
        activities_by_type = {}
        for activity in activities.values('activity_type').annotate(count=Count('id')):
            activities_by_type[activity['activity_type']] = activity['count']

        summary = {
            'total_workouts': totals['total_workouts'] or 0,
            'total_minutes': totals['total_minutes'] or 0,
            'total_calories': totals['total_calories'] or 0,
            'total_distance': totals['total_distance'] or 0,
            'activities_by_type': activities_by_type
        }

        serializer = WeeklyActivitySummarySerializer(summary)
        return Response(serializer.data)