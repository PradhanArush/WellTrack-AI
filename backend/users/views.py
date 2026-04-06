import requests as http_requests
from decouple import config
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model, authenticate
from .serializers import UserSerializer, UserRegistrationSerializer, CustomTokenObtainPairSerializer

User = get_user_model()

class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        password = request.data.get('password')
        if not password:
            return Response({'error': 'Password is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=request.user.email, password=password)
        if user is None:
            return Response({'error': 'Incorrect password.'}, status=status.HTTP_400_BAD_REQUEST)

        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


SYSTEM_PROMPT = (
    "You are Ava, a friendly and knowledgeable AI wellness assistant for WellTrack AI. "
    "You help users with any questions — whether about nutrition, fitness, sleep, mental health, or general topics. "
    "Keep your answers concise, warm, and helpful. If someone asks something unrelated to wellness, still answer helpfully."
)

class ChatbotView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        messages = request.data.get('messages', [])
        if not messages:
            return Response({'error': 'No messages provided.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            resp = http_requests.post(
                'https://api.groq.com/openai/v1/chat/completions',
                json={
                    'model': 'llama-3.3-70b-versatile',
                    'messages': [{'role': 'system', 'content': SYSTEM_PROMPT}] + messages,
                },
                headers={'Authorization': f'Bearer {config("GROQ_API_KEY")}'},
                timeout=30,
            )
            resp.raise_for_status()
            reply = resp.json()['choices'][0]['message']['content']
            return Response({'reply': reply})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)