from rest_framework import serializers
from .models import Meal, WaterIntake

class MealSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meal
        fields = ['id', 'user', 'name', 'meal_type', 'date', 'time', 'calories', 
                  'protein', 'carbs', 'fiber', 'fats', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class WaterIntakeSerializer(serializers.ModelSerializer):
    class Meta:
        model = WaterIntake
        fields = ['id', 'user', 'date', 'amount_ml', 'time', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class DailyNutritionSummarySerializer(serializers.Serializer):
    date = serializers.DateField()
    total_calories = serializers.IntegerField()
    total_protein = serializers.DecimalField(max_digits=8, decimal_places=2)
    total_carbs = serializers.DecimalField(max_digits=8, decimal_places=2)
    total_fiber = serializers.DecimalField(max_digits=8, decimal_places=2)
    total_fats = serializers.DecimalField(max_digits=8, decimal_places=2)
    total_water_ml = serializers.IntegerField()
    meal_count = serializers.IntegerField()