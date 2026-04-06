from rest_framework import serializers
from .models import SleepLog, SleepGoal

class SleepLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = SleepLog
        fields = ['id', 'user', 'date', 'bedtime', 'wake_time', 'duration_hours',
                  'quality', 'fell_asleep_minutes', 'times_woken',
                  'had_caffeine', 'had_alcohol', 'exercised', 'stressed', 'notes', 
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class SleepGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = SleepGoal
        fields = ['id', 'user', 'target_hours', 'target_bedtime', 'target_wake_time', 
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        # Use update_or_create since user can only have one goal
        goal, created = SleepGoal.objects.update_or_create(
            user=validated_data['user'],
            defaults=validated_data
        )
        return goal


class WeeklySleepSummarySerializer(serializers.Serializer):
    average_duration = serializers.DecimalField(max_digits=4, decimal_places=2)
    average_quality = serializers.DecimalField(max_digits=3, decimal_places=1)
    total_logs = serializers.IntegerField()
    quality_trend = serializers.CharField()
    duration_trend = serializers.CharField()
    consistency_score = serializers.IntegerField()


class MonthlySleepStatsSerializer(serializers.Serializer):
    total_logs = serializers.IntegerField()
    average_duration = serializers.DecimalField(max_digits=4, decimal_places=2)
    average_quality = serializers.DecimalField(max_digits=3, decimal_places=1)
    best_sleep_date = serializers.DateField(allow_null=True)
    worst_sleep_date = serializers.DateField(allow_null=True)
    nights_met_goal = serializers.IntegerField()