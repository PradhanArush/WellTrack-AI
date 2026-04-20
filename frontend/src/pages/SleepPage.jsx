import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
// ComposedChart lets us overlay a Bar chart (duration) and a Line chart (quality) on the same axes
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { sleepAPI } from '../services/api';
import { Plus, Moon, Activity, Target, TrendingUp, Trash2, X, Clock, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const SleepPage = () => {
  const { state } = useLocation(); // Receives openModal:true from Dashboard quick actions
  const [sleepLogs, setSleepLogs] = useState([]);
  const [summary, setSummary] = useState(null);   // Weekly stats (avg duration, quality, trend)
  const [chartData, setChartData] = useState([]); // Last 7 logs formatted for Recharts
  const [showAddSleep, setShowAddSleep] = useState(state?.openModal === true);
  const [deleteLogId, setDeleteLogId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  // Re-fetch whenever the selected date changes
  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch filtered logs (for display), weekly summary, and all logs (for the chart) in parallel
      const [logsRes, summaryRes, allLogsRes] = await Promise.all([
        sleepAPI.getSleepLogs(selectedDate),
        sleepAPI.getWeeklySummary(),
        sleepAPI.getSleepLogs(), // No date filter = returns all logs
      ]);
      setSleepLogs(logsRes.data);
      setSummary(summaryRes.data);
      // Take the 7 most recent logs and reverse so the chart shows oldest → newest left to right
      const recent7 = allLogsRes.data.slice(0, 7).reverse().map((log) => ({
        date: log.date.slice(5), // Show only MM-DD for readability on the x-axis
        Duration: parseFloat(parseFloat(log.duration_hours).toFixed(1)),
        Quality: log.quality,
      }));
      setChartData(recent7);
    } catch (error) {
      console.error('Error fetching sleep data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLog = async () => {
    try {
      await sleepAPI.deleteSleepLog(deleteLogId);
      setDeleteLogId(null);
      fetchData();
      toast.success('Sleep log deleted');
    } catch (error) {
      toast.error('Failed to delete sleep log');
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-800">Sleep Monitor</h1>
          <p className="text-gray-600 mt-1">Track your sleep patterns and quality</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <input
            type="date"
            value={selectedDate}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
          />
          {/* Log Sleep button is disabled if sleep is already logged for the selected date */}
          <button
            onClick={() => setShowAddSleep(true)}
            disabled={
              selectedDate > new Date().toISOString().split('T')[0] ||
              sleepLogs.some((log) => log.date === selectedDate)
            }
            title={sleepLogs.some((log) => log.date === selectedDate) ? 'Sleep already logged for this day' : ''}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition shadow-lg whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
            <span>{sleepLogs.some((log) => log.date === selectedDate) ? 'Already Logged' : 'Log Sleep'}</span>
          </button>
        </div>
      </div>

      {/* Weekly stats summary cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-400 to-purple-500 p-6 rounded-xl shadow-lg text-white">
          <Moon className="w-10 h-10 mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-1">{summary?.average_duration ? parseFloat(summary.average_duration).toFixed(1) : 0}h</div>
          <div className="text-indigo-100">Average Sleep Time</div>
        </div>
        <div className="bg-gradient-to-br from-teal-400 to-cyan-500 p-6 rounded-xl shadow-lg text-white">
          <Activity className="w-10 h-10 mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-1">{summary?.average_quality ? Math.round(parseFloat(summary.average_quality)) : 0}/10</div>
          <div className="text-teal-100">Average Sleep Quality</div>
        </div>
        <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-6 rounded-xl shadow-lg text-white">
          <Target className="w-10 h-10 mb-3 opacity-80" />
          <div className="text-3xl font-bold mb-1">{summary?.total_logs || 0}</div>
          <div className="text-green-100">Nights Tracked</div>
        </div>
      </div>

      {/* Weekly trend cards — improving/declining/stable labels come from the backend */}
      {summary && summary.quality_trend && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Weekly Trends</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <TrendCard
              label="Quality Trend"
              value={summary.quality_trend}
              icon={TrendingUp}
            />
            <TrendCard
              label="Duration Trend"
              value={summary.duration_trend}
              icon={TrendingUp}
            />
            <TrendCard
              label="Consistency"
              value={`${summary.consistency_score}%`}
              icon={Target}
            />
          </div>
        </div>
      )}

      {/* 7-day chart — only shown when there are at least 2 data points */}
      {chartData.length > 1 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">7-Day Sleep Trend</h3>
          {/* ComposedChart: bars show sleep duration (left Y axis), line shows quality (right Y axis) */}
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" domain={[0, 12]} tick={{ fontSize: 12 }} unit="h" />
              <YAxis yAxisId="right" orientation="right" domain={[0, 10]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value, name) => name === 'Duration' ? `${value}h` : `${value}/10`} />
              <Legend />
              <Bar yAxisId="left" dataKey="Duration" fill="#818cf8" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="Quality" stroke="#2dd4bf" strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sleep log list for the selected date */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Sleep History</h2>
        {sleepLogs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Moon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No sleep data logged yet. Start tracking your sleep patterns!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sleepLogs.map((log) => (
              <SleepItem key={log.id} log={log} onDelete={() => setDeleteLogId(log.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Add sleep modal */}
      {showAddSleep && (
        <AddSleepModal
          onClose={() => setShowAddSleep(false)}
          onSuccess={() => { setShowAddSleep(false); fetchData(); }}
          selectedDate={selectedDate}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteLogId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteLogId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 flex flex-col items-center animate-slideUp">
            <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Delete Sleep Log?</h2>
            <p className="text-gray-500 text-sm text-center mb-6">This sleep entry will be permanently removed from your history.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setDeleteLogId(null)} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition font-medium">
                Cancel
              </button>
              <button onClick={handleDeleteLog} className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-600 hover:to-rose-600 transition font-medium">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Displays improving/declining/stable trend with colour-coded badge
const TrendCard = ({ label, value, icon: Icon }) => {
  const getTrendColor = (trend) => {
    if (trend === 'improving') return 'text-green-600 bg-green-50';
    if (trend === 'declining') return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getTrendText = (trend) => {
    if (trend === 'improving') return '📈 Improving';
    if (trend === 'declining') return '📉 Declining';
    if (trend === 'stable') return '➡️ Stable';
    return trend;
  };

  return (
    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
      <Icon className="w-8 h-8 text-gray-400" />
      <div>
        <div className="text-sm text-gray-600">{label}</div>
        <div className={`font-bold ${getTrendColor(value)} px-2 py-1 rounded mt-1 inline-block`}>
          {getTrendText(value)}
        </div>
      </div>
    </div>
  );
};

// Single sleep log entry with quality badge, info grid, lifestyle factors, and expandable notes
const SleepItem = ({ log, onDelete }) => {
  const [noteOpen, setNoteOpen] = useState(false);

  // Colour-code the quality badge based on score
  const qualityColor =
    log.quality >= 8 ? 'bg-green-100 text-green-700'
    : log.quality >= 6 ? 'bg-yellow-100 text-yellow-700'
    : 'bg-red-100 text-red-700';

  const qualityLabel =
    log.quality >= 9 ? 'Excellent'
    : log.quality >= 7 ? 'Good'
    : log.quality >= 5 ? 'Fair'
    : log.quality >= 3 ? 'Poor'
    : 'Very Poor';

  // Build list of lifestyle factors that were checked (only show the ones that are true)
  const factors = [
    log.had_caffeine && '☕ Caffeine',
    log.had_alcohol && '🍷 Alcohol',
    log.exercised && '🏃 Exercised',
    log.stressed && '😰 Stressed',
  ].filter(Boolean);

  return (
    <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">😴</div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-800">{log.date}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${qualityColor}`}>
                <Moon className="w-3 h-3" />
                {qualityLabel} ({log.quality}/10)
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Bedtime {log.bedtime?.slice(0, 5)} → Wake {log.wake_time?.slice(0, 5)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {log.notes && (
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
        <InfoBadge icon={<Clock className="w-3.5 h-3.5" />} label="Duration" value={`${parseFloat(log.duration_hours).toFixed(1)}h`} />
        {log.fell_asleep_minutes != null && (
          <InfoBadge icon={<Clock className="w-3.5 h-3.5" />} label="Fell asleep" value={`${log.fell_asleep_minutes} min`} />
        )}
        {log.times_woken > 0 && (
          <InfoBadge icon={<Activity className="w-3.5 h-3.5" />} label="Woke up" value={`${log.times_woken}x`} />
        )}
      </div>

      {/* Lifestyle factors — caffeine, alcohol, exercise, stress */}
      {factors.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {factors.map((f) => (
            <span key={f} className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-600">{f}</span>
          ))}
        </div>
      )}

      {/* Expandable notes */}
      {noteOpen && log.notes && (
        <div className="mt-3 p-3 bg-white border border-teal-100 rounded-lg text-sm text-gray-600">
          {log.notes}
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

// Modal form for logging a sleep entry
const AddSleepModal = ({ onClose, onSuccess, selectedDate }) => {
  const [formData, setFormData] = useState({
    date: selectedDate,
    bedtime: '22:00',
    wake_time: '06:00',
    duration_hours: '',
    quality: '7',
    fell_asleep_minutes: '',
    times_woken: '0',
    had_caffeine: false,
    had_alcohol: false,
    exercised: false,
    stressed: false,
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  // Automatically calculates sleep duration whenever bedtime or wake time changes
  const calculateDuration = () => {
    if (formData.bedtime && formData.wake_time) {
      const [bedHour, bedMin] = formData.bedtime.split(':').map(Number);
      const [wakeHour, wakeMin] = formData.wake_time.split(':').map(Number);

      let hours = wakeHour - bedHour;
      let minutes = wakeMin - bedMin;

      // Handle crossing midnight (e.g., bedtime 23:00, wake time 07:00)
      if (hours < 0) hours += 24;
      if (minutes < 0) {
        hours -= 1;
        minutes += 60;
      }

      const duration = hours + minutes / 60;
      setFormData({ ...formData, duration_hours: parseFloat(duration.toFixed(1)) });
    }
  };

  useEffect(() => {
    calculateDuration();
  }, [formData.bedtime, formData.wake_time]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSend = { ...formData };
      // Remove optional field if empty so the backend doesn't receive an empty string
      if (!dataToSend.fell_asleep_minutes) delete dataToSend.fell_asleep_minutes;
      await sleepAPI.createSleepLog(dataToSend);
      toast.success('Sleep log saved');
      onSuccess();
    } catch (error) {
      toast.error('Failed to log sleep. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Log Sleep</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bedtime</label>
              <input
                type="time"
                required
                value={formData.bedtime}
                onChange={(e) => setFormData({ ...formData, bedtime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wake Time</label>
              <input
                type="time"
                required
                value={formData.wake_time}
                onChange={(e) => setFormData({ ...formData, wake_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (hours) - Auto calculated
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.duration_hours}
              onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              placeholder="7.5"
            />
          </div>

          {/* Quality slider — 1 (poor) to 10 (excellent), user drags to rate their sleep */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sleep Quality: {formData.quality}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.quality}
              onChange={(e) => setFormData({ ...formData, quality: e.target.value })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time to Fall Asleep (min)
              </label>
              <input
                type="number"
                value={formData.fell_asleep_minutes}
                onChange={(e) => setFormData({ ...formData, fell_asleep_minutes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                placeholder="15"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Times Woken</label>
              <input
                type="number"
                value={formData.times_woken}
                onChange={(e) => setFormData({ ...formData, times_woken: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                placeholder="0"
              />
            </div>
          </div>

          {/* Lifestyle factor checkboxes — stored as booleans and displayed on the log card */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Factors</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.had_caffeine}
                  onChange={(e) => setFormData({ ...formData, had_caffeine: e.target.checked })}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Had Caffeine</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.had_alcohol}
                  onChange={(e) => setFormData({ ...formData, had_alcohol: e.target.checked })}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Had Alcohol</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.exercised}
                  onChange={(e) => setFormData({ ...formData, exercised: e.target.checked })}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Exercised</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.stressed}
                  onChange={(e) => setFormData({ ...formData, stressed: e.target.checked })}
                  className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Stressed</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
              rows="2"
              placeholder="Dreams, observations..."
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
              {loading ? 'Logging...' : 'Log Sleep'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SleepPage;
