import React from 'react';
import { Link } from 'react-router-dom';
import { Apple, Activity, Moon, Target, Zap, Camera, MessageCircle, ClipboardList, Star } from 'lucide-react';

const HomePage = ({ isAuthenticated }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">

      {/* Hero */}
      <div className="text-center mb-20">
        <div className="inline-block mb-6 px-4 py-2 bg-teal-50 text-teal-600 rounded-full text-sm font-medium border border-teal-200">
          🌿 Your Personal Wellness Tracker
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
          Track What Matters.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-500">
            Feel the Difference.
          </span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Log your food, sleep, and activity in one place. Scan food with your camera, chat with Ava, and stay on top of your goals.
        </p>
        {!isAuthenticated && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl hover:from-teal-600 hover:to-cyan-600 transition font-semibold text-lg shadow-lg hover:shadow-xl"
            >
              Get Started Free →
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 border-2 border-gray-200 text-gray-600 rounded-xl hover:border-teal-400 hover:text-teal-600 transition font-semibold text-lg"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>

      {/* Spotlight Features */}
      <div className="mb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">What Makes WellTrack Different</h2>
          <p className="text-gray-500">Three features built to make wellness tracking effortless</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Primary: Scan Food */}
          <div className="md:col-span-1 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl p-8 text-white shadow-xl">
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-5">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <div className="inline-block px-2.5 py-1 bg-white bg-opacity-20 rounded-full text-xs font-semibold mb-3 uppercase tracking-wider">
              ★ Spotlight Feature
            </div>
            <h3 className="text-2xl font-bold mb-3">Scan Food Instantly</h3>
            <p className="text-teal-100 leading-relaxed">
              Point your camera at any supported food and get instant nutritional information — calories, protein, carbs, fats, and more. No manual searching needed.
            </p>
          </div>

          {/* Secondary: Ava Chatbot */}
          <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 hover:shadow-lg transition">
            <div className="w-14 h-14 bg-gradient-to-br from-violet-400 to-purple-500 rounded-xl flex items-center justify-center mb-5">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Chat with Ava</h3>
            <p className="text-gray-500 leading-relaxed">
              Ask Ava anything about nutrition, fitness, or sleep. Your built-in wellness assistant is always ready to help, any time of day.
            </p>
          </div>

          {/* Third: Logging */}
          <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 hover:shadow-lg transition">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center mb-5">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Log Everything, Effortlessly</h3>
            <p className="text-gray-500 leading-relaxed">
              Track meals, workouts, and sleep in seconds. See your daily progress at a glance and stay consistent with your health goals.
            </p>
          </div>
        </div>
      </div>

      {/* Everything You Need */}
      <div className="mb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Everything You Need to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-500">
              Thrive
            </span>
          </h2>
          <p className="text-gray-500">Comprehensive tools to track and improve your wellness</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={Apple}
            title="Nutrition Tracking"
            description="Track calories, protein, carbs, fiber, and fats. Log meals manually or scan your food with the camera."
            color="from-green-400 to-emerald-500"
          />
          <FeatureCard
            icon={Activity}
            title="Activity Monitoring"
            description="Log weight training, cardio, swimming, yoga, and cycling. Track calories burned and monitor your streaks."
            color="from-teal-400 to-cyan-500"
          />
          <FeatureCard
            icon={Moon}
            title="Sleep Tracking"
            description="Monitor sleep quality, duration, and consistency. View your 7-day trends and spot patterns over time."
            color="from-indigo-400 to-purple-500"
          />
        </div>
      </div>

      {/* Why WellTrack */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-12 text-white mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Why Choose WellTrack AI?</h2>
          <p className="text-gray-400 text-lg">Built to keep your health journey simple and consistent</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <BenefitCard
            icon={Camera}
            title="Food Recognition"
            description="Scan real food and get instant nutrition data — no database hunting or manual entry required"
          />
          <BenefitCard
            icon={Target}
            title="Goal Tracking"
            description="Set calorie, water, sleep, and macro goals. Your dashboard shows exactly where you stand each day"
          />
          <BenefitCard
            icon={Zap}
            title="Simple by Design"
            description="Clean, fast interface built for daily use — log what you need and get back to your day"
          />
        </div>
      </div>

      {/* CTA */}
      <div className="text-center bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl border border-teal-100 p-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-3">Ready to Start?</h2>
        <p className="text-gray-500 mb-8 text-lg">Create your free account and start tracking today</p>
        {!isAuthenticated && (
          <Link
            to="/register"
            className="inline-block px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl hover:from-teal-600 hover:to-cyan-600 transition font-semibold text-lg shadow-lg hover:shadow-xl"
          >
            Create Free Account
          </Link>
        )}
      </div>

    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description, color }) => (
  <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
    <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-5`}>
      <Icon className="w-8 h-8 text-white" />
    </div>
    <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
    <p className="text-gray-500 leading-relaxed">{description}</p>
  </div>
);

const BenefitCard = ({ icon: Icon, title, description }) => (
  <div className="text-center">
    <div className="w-16 h-16 bg-white bg-opacity-10 rounded-xl flex items-center justify-center mx-auto mb-4">
      <Icon className="w-8 h-8 text-white" />
    </div>
    <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
    <p className="text-gray-400 leading-relaxed">{description}</p>
  </div>
);

export default HomePage;
