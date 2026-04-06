import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { activityAPI } from '../services/api';
import { Plus, Activity as ActivityIcon, Clock, Flame, Trash2, FileText, ChevronDown, ChevronUp, Zap, MapPin, Pencil, Check, X } from 'lucide-react';

const CALORIES_GOAL_KEY = 'calories_burned_daily_goal';
const DEFAULT_CALORIES_GOAL = 500;

const ActivityPage = () => {
  const { state } = useLocation();
  const [activities, setActivities] = useState([]);
  const [showAddActivity, setShowAddActivity] = useState(state?.openModal === true);
  const [deleteActivityId, setDeleteActivityId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  const [calsBurnedGoal, setCalsBurnedGoal] = useState(() => {
    const saved = parseInt(localStorage.getItem(CALORIES_GOAL_KEY), 10);
    return isNaN(saved) ? DEFAULT_CALORIES_GOAL : saved;
  });
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const activitiesRes = await activityAPI.getActivities(selectedDate);
      setActivities(activitiesRes.data);
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async () => {
    try {
      await activityAPI.deleteActivity(deleteActivityId);
      setDeleteActivityId(null);
      fetchData();
      toast.success('Activity deleted');
    } catch (error) {
      toast.error('Failed to delete activity');
    }
  };

  const openGoalEdit = () => {
    setGoalInput(String(calsBurnedGoal));
    setEditingGoal(true);
  };

  const saveGoal = () => {
    const val = parseInt(goalInput, 10);
    if (!isNaN(val) && val > 0) {
      setCalsBurnedGoal(val);
      localStorage.setItem(CALORIES_GOAL_KEY, String(val));
    }
    setEditingGoal(false);
  };

  const cancelGoalEdit = () => setEditingGoal(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-2xl text-teal-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Activity Tracker</h1>
          <p className="text-gray-600 mt-1">Track your workouts and stay active</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <input
            type="date"
            value={selectedDate}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
          />
          <button
            onClick={() => setShowAddActivity(true)}
            disabled={selectedDate > new Date().toISOString().split('T')[0]}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition shadow-lg whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            <span>Log Activity</span>
          </button>
        </div>
      </div>

      {/* Daily Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-teal-400 to-cyan-500 p-6 rounded-xl shadow-lg text-white">
          <ActivityIcon className="w-10 h-10 mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-1">{activities.length}</div>
          <div className="text-teal-100">Exercises Today</div>
        </div>
        <div className="bg-gradient-to-br from-blue-400 to-indigo-500 p-6 rounded-xl shadow-lg text-white">
          <Clock className="w-10 h-10 mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-1">
            {activities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0)}
          </div>
          <div className="text-blue-100">Minutes Exercised Today</div>
        </div>
        <div className="bg-gradient-to-br from-orange-400 to-red-500 p-6 rounded-xl shadow-lg text-white">
          <div className="flex items-start justify-between mb-3">
            <Flame className="w-10 h-10 opacity-80" />
            <button
              onClick={openGoalEdit}
              className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg transition"
            >
              <Pencil className="w-3 h-3" />
              Set target
            </button>
          </div>
          <div className="text-3xl font-bold mb-1">
            {activities.reduce((sum, a) => sum + (a.calories_burned || 0), 0)}
            <span className="text-lg font-normal opacity-70"> / {calsBurnedGoal}</span>
          </div>
          <div className="text-orange-100 text-sm">Calories Burned Today</div>
          {/* Mini progress bar */}
          <div className="mt-3 w-full bg-white/20 rounded-full h-1.5">
            <div
              className="bg-white h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  Math.round(
                    (activities.reduce((sum, a) => sum + (a.calories_burned || 0), 0) / calsBurnedGoal) * 100
                  ),
                  100
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activities</h2>
        {activities.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ActivityIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No activities logged yet. Start tracking your workouts!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} onDelete={() => setDeleteActivityId(activity.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Edit Calories Goal Modal */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-gray-800">Daily Calories Burned Target</h3>
              <button onClick={cancelGoalEdit} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Set your daily calories burned target. This will also update your home dashboard.
            </p>
            <div className="flex items-center gap-3 mb-6">
              <input
                type="number"
                min="1"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
                className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:ring-0 focus:border-teal-400 outline-none text-lg font-semibold text-gray-800"
                placeholder="500"
                autoFocus
              />
              <span className="text-gray-500 text-sm font-medium">kcal</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelGoalEdit}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveGoal}
                disabled={!goalInput || parseInt(goalInput, 10) <= 0}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-red-500 text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Activity Modal */}
      {showAddActivity && (
        <AddActivityModal
          onClose={() => setShowAddActivity(false)}
          onSuccess={() => { setShowAddActivity(false); fetchData(); }}
          selectedDate={selectedDate}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteActivityId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteActivityId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 flex flex-col items-center animate-slideUp">
            <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Delete Activity?</h2>
            <p className="text-gray-500 text-sm text-center mb-6">This activity will be permanently removed from your log.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setDeleteActivityId(null)} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition font-medium">
                Cancel
              </button>
              <button onClick={handleDeleteActivity} className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 transition font-medium">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ICONS = {
  weight_training: '🏋️',
  running: '🏃',
  walking: '🚶',
  swimming: '🏊',
  yoga: '🧘',
  cycling: '🚴',
  other: '💪',
};

const INTENSITY_COLORS = {
  low: 'bg-green-100 text-green-700',
  moderate: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

const ActivityItem = ({ activity, onDelete }) => {
  const [noteOpen, setNoteOpen] = useState(false);

  const typeLabel = activity.activity_type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="text-3xl shrink-0">{ICONS[activity.activity_type] || '💪'}</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-800">{activity.title}</span>
              {activity.intensity && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${INTENSITY_COLORS[activity.intensity] || 'bg-gray-100 text-gray-600'}`}>
                  <Zap className="w-3 h-3" />
                  {activity.intensity.charAt(0).toUpperCase() + activity.intensity.slice(1)}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500">{typeLabel}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {activity.notes && (
            <button
              onClick={() => setNoteOpen(!noteOpen)}
              className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-600 border border-teal-200 rounded-lg text-xs font-medium hover:bg-teal-100 transition"
            >
              <FileText className="w-3.5 h-3.5" />
              Note
              {noteOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
          <button onClick={onDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info grid */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <InfoBadge icon={<Clock className="w-3.5 h-3.5" />} label="Start" value={activity.start_time?.slice(0, 5)} />
        <InfoBadge icon={<Clock className="w-3.5 h-3.5" />} label="Duration" value={`${activity.duration_minutes} min`} />
        <InfoBadge icon={<Flame className="w-3.5 h-3.5 text-orange-500" />} label="Calories" value={`${activity.calories_burned} kcal`} />
        {activity.distance_km && (
          <InfoBadge icon={<MapPin className="w-3.5 h-3.5 text-blue-500" />} label="Distance" value={`${activity.distance_km} km`} />
        )}
      </div>

      {/* Note expand */}
      {noteOpen && activity.notes && (
        <div className="mt-3 p-3 bg-white border border-teal-100 rounded-lg text-sm text-gray-600">
          {activity.notes}
        </div>
      )}
    </div>
  );
};

const InfoBadge = ({ icon, label, value }) => (
  <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg text-xs text-gray-600 border border-gray-100">
    {icon}
    <span className="text-gray-400">{label}:</span>
    <span className="font-medium text-gray-700">{value}</span>
  </div>
);

const AddActivityModal = ({ onClose, onSuccess, selectedDate }) => {
  const [formData, setFormData] = useState({
    activity_type: 'weight_training',
    title: '',
    date: selectedDate,
    start_time: new Date().toTimeString().slice(0, 5),
    duration_minutes: '',
    calories_burned: '',
    distance_km: '',
    intensity: 'moderate',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSend = { ...formData };
      if (!dataToSend.distance_km) delete dataToSend.distance_km;
      await activityAPI.createActivity(dataToSend);
      toast.success('Activity logged');
      onSuccess();
    } catch (error) {
      toast.error('Failed to log activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Log Activity</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
            <select
              value={formData.activity_type}
              onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            >
              <option value="weight_training">Weight Training</option>
              <option value="running">Running</option>
              <option value="walking">Walking</option>
              <option value="swimming">Swimming</option>
              <option value="yoga">Yoga</option>
              <option value="cycling">Cycling</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              placeholder="e.g., Morning Run"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
              <input
                type="number"
                required
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                placeholder="30"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Calories Burned</label>
              <input
                type="number"
                required
                value={formData.calories_burned}
                onChange={(e) => setFormData({ ...formData, calories_burned: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                placeholder="250"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
              <input
                type="number"
                step="0.1"
                value={formData.distance_km}
                onChange={(e) => setFormData({ ...formData, distance_km: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                placeholder="5.0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intensity</label>
            <select
              value={formData.intensity}
              onChange={(e) => setFormData({ ...formData, intensity: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
            >
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              rows="2"
              placeholder="Any additional notes..."
            ></textarea>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition disabled:opacity-50"
            >
              {loading ? 'Logging...' : 'Log Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityPage;