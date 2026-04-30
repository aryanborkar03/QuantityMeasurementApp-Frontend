import { useState, useEffect } from 'react';
import { QMA_BASE, authHeaders, apiFetch } from '../api';

// Uses /me/ endpoints — user-scoped, requires JWT.
// The backend route: GET /api/v1/quantities/me/history/type/{measurementType}

const TABS = [
  { label: 'Length',      value: 'LengthUnit' },
  { label: 'Weight',      value: 'WeightUnit' },
  { label: 'Temperature', value: 'TemperatureUnit' },
  { label: 'Volume',      value: 'VolumeUnit' },
];

export default function History({ onBack, showToast }) {
  const [history,   setHistory]   = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter,    setFilter]    = useState('LengthUnit');

  useEffect(() => { fetchHistory(); }, [filter]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      // ✅ Correct user-scoped endpoint — only returns the logged-in user's data
      const data = await apiFetch(`${QMA_BASE}/me/history/type/${filter}`, {
        headers: authHeaders(),
      });
      setHistory(data);
    } catch (err) {
      showToast(err.message || 'Failed to fetch history.', 'error');
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pb-10 min-h-screen bg-[#f4f7fa]">
      <header className="bg-primary text-white flex justify-between items-center py-4 px-8 shadow-md">
        <h1 className="text-[1.25rem] font-bold tracking-wide">My Activity History</h1>
        <button onClick={onBack}
          className="bg-white text-primary px-5 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-gray-100 transition-colors">
          Back to Dashboard
        </button>
      </header>

      <main className="max-w-[900px] mx-auto mt-10 px-5">
        {/* Filter tabs */}
        <div className="flex bg-white p-1.5 rounded-xl shadow-sm flex-col md:flex-row gap-1 mb-8">
          {TABS.map(tab => (
            <button key={tab.value} onClick={() => setFilter(tab.value)}
              className={`flex-1 py-3.5 rounded-lg font-bold text-sm transition-colors
                ${filter === tab.value ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* History list */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {isLoading ? (
            <p className="text-center text-gray-500 py-10">Loading history...</p>
          ) : history.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No activity recorded for this type yet.</p>
          ) : (
            <div className="space-y-4">
              {history.map((item, i) => (
                <div key={i}
                  className="border-l-4 border-primary bg-gray-50 p-4 rounded-r-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      {item.operation}
                    </span>
                    <div className="text-gray-800 font-medium">
                      {item.thisValue} {item.thisUnit}
                      <span className="text-gray-400 mx-2">and</span>
                      {item.thatValue} {item.thatUnit}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Result</span>
                    <div className="text-primary font-bold text-lg">
                      {item.resultString || `${item.resultValue} ${item.resultUnit || ''}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
