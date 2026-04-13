import { useState } from 'react';

const API_BASE_URL = 'http://localhost:8080/api/v1/quantities';

const UNITS_DATA = {
  Length: ['FEET', 'INCHES', 'YARDS', 'CENTIMETERS'],
  Weight: ['KILOGRAM', 'GRAM', 'POUND'],
  Temperature: ['CELSIUS', 'FAHRENHEIT', 'KELVIN'],
  Volume: ['LITRE', 'MILLILITRE', 'GALLON']
};

export default function Dashboard({ isAuthenticated, onAuthClick, onHistoryClick, onLogout, showToast }) {
  const [type, setType] = useState('Length');
  const [action, setAction] = useState('Conversion');
  const [isLoading, setIsLoading] = useState(false);
  
  const [val1, setVal1] = useState('');
  const [val2, setVal2] = useState('');
  const [unit1, setUnit1] = useState('FEET');
  const [unit2, setUnit2] = useState('INCHES');
  const [mathOp, setMathOp] = useState('+');
  const [resultUnit, setResultUnit] = useState('FEET');
  const [result, setResult] = useState(null);

  const units = UNITS_DATA[type] || [];
  const userName = localStorage.getItem('userName') || 'User';

  const handleTypeChange = (newType) => {
    setType(newType);
    const newUnits = UNITS_DATA[newType];
    setUnit1(newUnits[0]);
    setUnit2(newUnits[1] || newUnits[0]);
    setResultUnit(newUnits[0]);
    setVal1('');
    setVal2('');
    setResult(null);
  };

  const buildPayload = () => {
    const measurementType = `${type}Unit`;
    const payload = {
      thisQuantityDTO: { value: Number(val1), unit: unit1, measurementType },
      thatQuantityDTO: { value: Number(val2), unit: unit2, measurementType },
    };
    if (action === 'Arithmetic' && (mathOp === '+' || mathOp === '-')) {
      payload.targetUnitDTO = { value: 0, unit: resultUnit, measurementType };
    }
    return payload;
  };

  const calculate = async () => {
    setIsLoading(true);
    setResult(null);

    const token = localStorage.getItem('token');
    let endpoint = '';
    
    if (action === 'Conversion') endpoint = '/convert';
    else if (action === 'Comparison') endpoint = '/compare';
    else if (action === 'Arithmetic') {
      if (mathOp === '+') endpoint = '/add';
      else if (mathOp === '-') endpoint = '/subtract';
      else if (mathOp === '/') endpoint = '/divide';
    }

    const headers = { 'Content-Type': 'application/json' };
    if (isAuthenticated && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(buildPayload())
      });

      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || 'Operation failed on server', 'error');
        setIsLoading(false);
        return;
      }

      if (action === 'Comparison') {
        const isEq = data.resultString === 'true';
        setResult({
          isHtml: true,
          value: <span className={isEq ? 'text-accent' : 'text-red-500'}>
            {val1} {unit1} is <br/><b>{isEq ? 'EQUAL TO' : 'NOT EQUAL TO'}</b><br/> {val2} {unit2}
          </span>
        });
      } else if (action === 'Conversion') {
        setResult({ value: data.resultValue, sub: data.resultUnit || unit2 });
      } else if (action === 'Arithmetic') {
        setResult({ value: data.resultValue, sub: mathOp === '/' ? 'Ratio (No Unit)' : data.resultUnit });
      }
    } catch (error) {
      showToast('Failed to connect to the backend server.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pb-10">
      <header className="bg-primary text-white flex justify-between items-center py-4 px-8 shadow-md">
        <h1 className="text-[1.25rem] font-bold tracking-wide">Quantity Measurement</h1>
        
        <div className="flex items-center gap-4">
          {!isAuthenticated ? (
             <button onClick={onAuthClick} className="bg-white text-primary px-5 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-gray-100 transition-colors">
               Login / Activity
             </button>
          ) : (
            <>
              <span className="text-sm opacity-90 hidden md:block mr-2">Hi, {userName.split(' ')[0]}</span>
              <button onClick={onHistoryClick} className="bg-white text-primary px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-gray-100 transition-colors">
               Activity
              </button>
              <button onClick={onLogout} className="bg-[#e74c3c] hover:bg-[#c0392b] px-4 py-2 rounded-lg font-bold text-sm transition-colors text-white shadow-sm">
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      <main className="max-w-[900px] mx-auto mt-10 px-5">
        <div className="mb-8">
          <h2 className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-4">Choose Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { id: 'Length', icon: '/length.png' },
              { id: 'Weight', icon: '/weight-scale.png' },
              { id: 'Temperature', icon: '/thermometer.png' },
              { id: 'Volume', icon: '/measure.png' }
            ].map(t => (
              <button key={t.id} onClick={() => handleTypeChange(t.id)} className={`p-6 bg-white rounded-xl shadow-sm border-2 transition-all flex flex-col items-center gap-3 ${type === t.id ? 'border-accent bg-[#f0fbf6]' : 'border-transparent hover:-translate-y-1'}`}>
                <img src={t.icon} alt={t.id} className="w-10 h-10 object-contain" />
                <span className={`font-bold text-sm ${type === t.id ? 'text-accent' : 'text-gray-900'}`}>{t.id}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-[12px] font-bold text-gray-500 uppercase tracking-widest mb-4">Choose Action</h2>
          <div className="flex bg-white p-1.5 rounded-xl shadow-sm flex-col md:flex-row gap-1">
            {['Comparison', 'Conversion', 'Arithmetic'].map(act => (
              <button key={act} onClick={() => { setAction(act); setResult(null); }} className={`flex-1 py-3.5 rounded-lg font-bold text-sm transition-colors ${action === act ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                {act}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex flex-col md:flex-row gap-5 items-stretch">
            <div className="flex-1 bg-white p-6 rounded-xl shadow-sm flex flex-col">
              <label className="text-[12px] font-bold text-gray-900 uppercase mb-5">{action === 'Conversion' ? 'From' : 'Value 1'}</label>
              <input type="number" value={val1} onChange={e => {setVal1(e.target.value); setResult(null);}} placeholder="Enter value" className="w-full text-[32px] font-bold text-gray-900 bg-transparent border-none outline-none mb-4 placeholder:text-gray-300 placeholder:font-normal" />
              <select value={unit1} onChange={e => {setUnit1(e.target.value); setResult(null);}} className="w-full pb-2.5 border-b border-gray-200 text-gray-500 font-medium outline-none cursor-pointer mt-auto">
                {units.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>

            {action === 'Arithmetic' && (
              <div className="flex items-center justify-center py-4 md:py-0 px-2">
                <select value={mathOp} onChange={e => {setMathOp(e.target.value); setResult(null);}} className="text-[28px] font-bold text-primary bg-transparent outline-none cursor-pointer text-center">
                  <option value="+">+</option>
                  <option value="-">-</option>
                  <option value="/">÷</option>
                </select>
              </div>
            )}

            <div className="flex-1 bg-white p-6 rounded-xl shadow-sm flex flex-col">
              <label className="text-[12px] font-bold text-gray-900 uppercase mb-5">{action === 'Conversion' ? 'To Unit' : 'Value 2'}</label>
              {action !== 'Conversion' && (
                 <input type="number" value={val2} onChange={e => {setVal2(e.target.value); setResult(null);}} placeholder="Enter value" className="w-full text-[32px] font-bold text-gray-900 bg-transparent border-none outline-none mb-4 placeholder:text-gray-300 placeholder:font-normal" />
              )}
              <select value={unit2} onChange={e => {setUnit2(e.target.value); setResult(null);}} className="w-full pb-2.5 border-b border-gray-200 text-gray-500 font-medium outline-none cursor-pointer mt-auto">
                {units.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {action === 'Arithmetic' && mathOp !== '/' && (
            <div className="bg-white p-6 rounded-xl shadow-sm w-full md:w-1/2">
              <label className="text-[12px] font-bold text-gray-900 uppercase mb-5 block">Target Output Unit</label>
              <select value={resultUnit} onChange={e => {setResultUnit(e.target.value); setResult(null);}} className="w-full pb-2.5 border-b border-gray-200 text-gray-500 font-medium outline-none cursor-pointer">
                {units.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          )}

          <div className="flex justify-end mt-5">
            <button onClick={calculate} disabled={isLoading} className="bg-primary hover:bg-[#4A74CB] text-white font-bold uppercase tracking-wider text-sm px-10 py-3.5 rounded-lg shadow-[0_4px_12px_rgba(91,134,229,0.3)] transition-transform hover:-translate-y-0.5 w-full md:w-auto">
              {isLoading ? 'Wait...' : action === 'Conversion' ? 'Convert' : action === 'Comparison' ? 'Compare' : 'Calculate'}
            </button>
          </div>

          {result && (
            <div className="bg-white border-l-[6px] border-accent p-8 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] mt-5 animate-fade-in">
              <div className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                {action === 'Conversion' ? 'Converted Value' : action === 'Comparison' ? 'Comparison Result' : 'Calculated Result'}
              </div>
              <div className={`font-bold text-primary break-words ${result.isHtml ? 'text-[28px]' : 'text-[36px]'}`}>
                {result.isHtml ? result.value : result.value}
              </div>
              {!result.isHtml && <div className="text-[16px] font-medium text-gray-900 mt-1.5">{result.sub}</div>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}