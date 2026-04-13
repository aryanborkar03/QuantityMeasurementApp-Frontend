import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:8080/api/v1/quantities/history';

export default function History({ onBack, showToast }) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('LengthUnit');

  useEffect(() => {
    fetchHistory();
  }, [filter]);

  const fetchHistory = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/type/${filter}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      } else {
        showToast('Failed to fetch history', 'error');
      }
    } catch (error) {
      showToast('Server connection error.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pb-10 min-h-screen bg-[#f4f7fa]">
      <header className="bg-primary text-white flex justify-between items-center py-4 px-8 shadow-md">
        <h1 className="text-[1.25rem] font-bold tracking-wide">Activity History</h1>
        <button onClick={onBack} className="bg-white text-primary px-5 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-gray-100 transition-colors">
          Back to Dashboard
        </button>
      </header>

      <main className="max-w-[900px] mx-auto mt-10 px-5">
        <div className="flex bg-white p-1.5 rounded-xl shadow-sm flex-col md:flex-row gap-1 mb-8">
          {['LengthUnit', 'WeightUnit', 'TemperatureUnit', 'VolumeUnit'].map(type => (
            <button key={type} onClick={() => setFilter(type)} className={`flex-1 py-3.5 rounded-lg font-bold text-sm transition-colors ${filter === type ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              {type.replace('Unit', '')}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          {isLoading ? (
            <p className="text-center text-gray-500 py-10">Loading history...</p>
          ) : history.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No activity recorded for this type yet.</p>
          ) : (
            <div className="space-y-4">
              {history.map((item, index) => (
                <div key={index} className="border-l-4 border-primary bg-gray-50 p-4 rounded-r-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">{item.operation}</span>
                    <div className="text-gray-800 font-medium">
                      {item.thisValue} {item.thisUnit} <span className="text-gray-400 mx-2">and</span> {item.thatValue} {item.thatUnit}
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