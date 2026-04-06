# WellTrack AI

WellTrack AI is a personal wellness tracking web app that lets you log your food, sleep, and activity to monitor your daily health goals. It features AI-powered food scanning using a camera, a built-in wellness chatbot called Ava, and visual dashboards to track your nutrition, sleep trends, and activity over time.

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Django 5 + Django REST Framework + SimpleJWT
- **Database**: PostgreSQL
- **ML Model**: TensorFlow/Keras MobileNetV2 (food scanning)
- **Chatbot**: Groq API (LLaMA 3.3 70B)

## Features

- 📸 **Food Scanning** — Point your camera at food and get instant nutritional info
- 🤖 **Ava Chatbot** — AI wellness assistant for nutrition, fitness, and sleep questions
- 🍎 **Nutrition Tracking** — Log meals, track calories, protein, carbs, fiber, and fats
- 💧 **Water Intake** — Log and monitor daily water consumption
- 🏃 **Activity Logging** — Track workouts with calories burned
- 😴 **Sleep Tracking** — Monitor sleep quality, duration, and 7-day trends
- 📊 **Dashboard** — Daily stats, macro breakdown charts, and progress tracking

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_NAME=welltrack_db
DATABASE_USER=your_db_user
DATABASE_PASSWORD=your_db_password
DATABASE_HOST=localhost
DATABASE_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
GROQ_API_KEY=your-groq-api-key
```

```bash
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```
VITE_API_URL=http://127.0.0.1:8000/api
```

```bash
npm run dev
```

The app will be running at `http://localhost:5173`.
