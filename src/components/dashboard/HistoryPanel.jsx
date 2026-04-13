import { useState, useEffect } from 'react';
import { historyAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const FILTERS = [
  { id: 'compare',  label: 'COMPARE'  },
  { id: 'convert',  label: 'CONVERT'  },
  { id: 'add',      label: 'ADD'      },
  { id: 'subtract', label: 'SUBTRACT' },
  { id: 'divide',   label: 'DIVIDE'   },
  { id: 'errored',  label: 'Errors'   },
];

const OPERATIONS = ['COMPARE', 'CONVERT', 'ADD', 'SUBTRACT', 'DIVIDE'];

const BADGE = {
  COMPARE:  'bg-blue-100   text-blue-700',
  CONVERT:  'bg-green-100  text-green-700',
  ADD:      'bg-purple-100 text-purple-700',
  SUBTRACT: 'bg-orange-100 text-orange-700',
  DIVIDE:   'bg-red-100    text-red-700',
};

export default function HistoryPanel() {
  const { session } = useAuth();
  const [history, setHistory] = useState([]);
  const [counts,  setCounts]  = useState({});
  const [filter,  setFilter]  = useState('compare');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    fetchHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, session]);

  useEffect(() => {
    if (!session) return;
    fetchCounts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function fetchHistory() {
    setLoading(true);
    try {
      let res;
      if (filter === 'errored') {
        res = await historyAPI.getErrors();
      } else {
        res = await historyAPI.getByOperation(filter);
      }
      setHistory(res.data);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCounts() {
    try {
      const entries = await Promise.all(
        OPERATIONS.map(op =>
          historyAPI.getCount(op)
            .then(r => [op, r.data])          // backend returns a Long directly
            .catch(() => [op, 0])
        )
      );
      setCounts(Object.fromEntries(entries));
    } catch {
      // counts are optional — silently ignore
    }
  }

  if (!session) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-8 text-center">
        <p className="mb-4 text-gray-500">🔒 Please login to view your measurement history</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(59,91,219,0.08)] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3 className="font-extrabold text-[#1a1a2e]">📜 Operation History</h3>
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(({ id, label }) => (
              <button key={id} onClick={() => setFilter(id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all
                  ${filter === id ? 'bg-[#3b5bdb] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Operation counts */}
        <div className="flex gap-4 mt-3 text-xs flex-wrap">
          {OPERATIONS.map(op => (
            <div key={op} className="flex items-center gap-1">
              <span className="font-bold text-[#3b5bdb]">{counts[op] ?? '…'}</span>
              <span className="text-gray-500">{op}</span>
            </div>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading…</div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No records found for this filter.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {history.map((item, i) => (
              <div key={item.id ?? i} className="px-6 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BADGE[item.operation?.toUpperCase()] || 'bg-gray-100 text-gray-700'}`}>
                        {item.operation?.toUpperCase()}
                      </span>
                      {item.createdAt && (
                        <span className="text-[10px] text-gray-400">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                    {/* Show input quantities */}
                    <div className="text-sm font-medium text-[#1a1a2e]">
                      {item.thisValue} {item.thisUnit}
                      {item.thatValue != null && ` ↔ ${item.thatValue} ${item.thatUnit}`}
                    </div>
                    {/* Result */}
                    <div className={`text-xs mt-1 ${item.error ? 'text-red-500' : 'text-green-600'}`}>
                      {item.resultString || (item.resultValue != null ? `= ${item.resultValue} ${item.resultUnit ?? ''}` : '')}
                    </div>
                  </div>
                  {item.error && <span className="text-red-400 text-xs ml-2">⚠️</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
