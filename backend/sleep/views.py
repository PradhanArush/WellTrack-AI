from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Count, Max, Min
from datetime import date, timedelta
from .models import SleepLog, SleepGoal
from .serializers import (
    SleepLogSerializer, SleepGoalSerializer,
    WeeklySleepSummarySerializer, MonthlySleepStatsSerializer
)

class SleepLogListCreateView(generics.ListCreateAPIView):
    serializer_class = SleepLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = SleepLog.objects.filter(user=self.request.user)
        date_param = self.request.query_params.get('date', None)
        
        if date_param:
            queryset = queryset.filter(date=date_param)
        
        return queryset


class SleepLogDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SleepLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SleepLog.objects.filter(user=self.request.user)


class SleepGoalView(generics.RetrieveUpdateAPIView):
    serializer_class = SleepGoalSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        goal, created = SleepGoal.objects.get_or_create(user=self.request.user)
        return goal


class WeeklySleepSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        end_date = date.today()
        start_date = end_date - timedelta(days=7)

        logs = SleepLog.objects.filter(
            user=request.user,
            date__gte=start_date,
            date__lte=end_date
        ).order_by('date')

        if not logs.exists():
            return Response({
                'average_duration': 0,
                'average_quality': 0,
                'total_logs': 0,
                'quality_trend': 'no_data',
                'duration_trend': 'no_data',
                'consistency_score': 0
            })

        # Calculate averages
        stats = logs.aggregate(
            avg_duration=Avg('duration_hours'),
            avg_quality=Avg('quality'),
            total=Count('id')
        )

        # Convert logs to list for trend calculation
        log_list = list(logs)
        mid_point = len(log_list) // 2
        
        if mid_point > 0:
            first_half = log_list[:mid_point]
            second_half = log_list[mid_point:]

            # Calculate averages using Python instead of Django aggregate
            first_quality = sum(log.quality for log in first_half) / len(first_half) if first_half else 0
            second_quality = sum(log.quality for log in second_half) / len(second_half) if second_half else 0
            quality_trend = 'improving' if second_quality > first_quality else 'declining' if second_quality < first_quality else 'stable'

            first_duration = sum(float(log.duration_hours) for log in first_half) / len(first_half) if first_half else 0
            second_duration = sum(float(log.duration_hours) for log in second_half) / len(second_half) if second_half else 0
            duration_trend = 'improving' if second_duration > first_duration else 'declining' if second_duration < first_duration else 'stable'
        else:
            quality_trend = 'stable'
            duration_trend = 'stable'

        # Consistency score (0-100)
        consistency_score = min(100, int((stats['total'] / 7) * 100))

        summary = {
            'average_duration': float(stats['avg_duration']) if stats['avg_duration'] else 0,
            'average_quality': float(stats['avg_quality']) if stats['avg_quality'] else 0,
            'total_logs': stats['total'],
            'quality_trend': quality_trend,
            'duration_trend': duration_trend,
            'consistency_score': consistency_score
        }

        return Response(summary)


class MonthlySleepStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        end_date = date.today()
        start_date = end_date - timedelta(days=30)

        logs = SleepLog.objects.filter(
            user=request.user,
            date__gte=start_date,
            date__lte=end_date
        )

        if not logs.exists():
            return Response({
                'total_logs': 0,
                'average_duration': 0,
                'average_quality': 0,
                'best_sleep_date': None,
                'worst_sleep_date': None,
                'nights_met_goal': 0
            })

        stats = logs.aggregate(
            avg_duration=Avg('duration_hours'),
            avg_quality=Avg('quality'),
            total=Count('id')
        )

        # Best and worst sleep
        best_sleep = logs.order_by('-quality', '-duration_hours').first()
        worst_sleep = logs.order_by('quality', 'duration_hours').first()

        # Check goal achievement
        try:
            goal = SleepGoal.objects.get(user=request.user)
            nights_met_goal = logs.filter(duration_hours__gte=goal.target_hours).count()
        except SleepGoal.DoesNotExist:
            nights_met_goal = 0

        summary = {
            'total_logs': stats['total'],
            'average_duration': round(stats['avg_duration'], 2),
            'average_quality': round(stats['avg_quality'], 1),
            'best_sleep_date': best_sleep.date if best_sleep else None,
            'worst_sleep_date': worst_sleep.date if worst_sleep else None,
            'nights_met_goal': nights_met_goal
        }

        serializer = MonthlySleepStatsSerializer(summary)
        return Response(serializer.data)