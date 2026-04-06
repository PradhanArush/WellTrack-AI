from rest_framework import serializers
from .models import Activity, WorkoutExercise, ActivityGoal

class WorkoutExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutExercise
        fields = ['id', 'exercise_name', 'sets', 'reps', 'weight_kg', 'notes']
        read_only_fields = ['id']


class ActivitySerializer(serializers.ModelSerializer):
    exercises = WorkoutExerciseSerializer(many=True, read_only=True)
    
    class Meta:
        model = Activity
        fields = ['id', 'user', 'activity_type', 'title', 'date', 'start_time', 
                  'duration_minutes', 'calories_burned', 'distance_km', 'intensity', 
                  'notes', 'exercises', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class ActivityCreateSerializer(serializers.ModelSerializer):
    exercises = WorkoutExerciseSerializer(many=True, required=False)
    
    class Meta:
        model = Activity
        fields = ['id', 'activity_type', 'title', 'date', 'start_time', 
                  'duration_minutes', 'calories_burned', 'distance_km', 'intensity', 
                  'notes', 'exercises']
        read_only_fields = ['id']

    def create(self, validated_data):
        exercises_data = validated_data.pop('exercises', [])
        validated_data['user'] = self.context['request'].user
        activity = Activity.objects.create(**validated_data)
        
        for exercise_data in exercises_data:
            WorkoutExercise.objects.create(activity=activity, **exercise_data)
        
        return activity


class ActivityGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityGoal
        fields = ['id', 'user', 'goal_type', 'target_workouts', 'target_minutes', 
                  'target_calories', 'start_date', 'end_date', 'is_active', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class WeeklyActivitySummarySerializer(serializers.Serializer):
    total_workouts = serializers.IntegerField()
    total_minutes = serializers.IntegerField()
    total_calories = serializers.IntegerField()
    total_distance = serializers.DecimalField(max_digits=8, decimal_places=2)
    activities_by_type = serializers.DictField()