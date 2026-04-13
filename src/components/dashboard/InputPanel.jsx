import { useState, useEffect, useCallback } from 'react';
import { quantityAPI } from '../../services/api';
import { toast } from 'react-toastify';
import OpDropdown from './OpDropdown';

// Unit display names — keys must match backend enum names exactly
const UNIT_DISPLAY = {
  // Length (backend: LengthUnit enum)
  FEET: 'Feet', INCHES: 'Inches', YARDS: 'Yards', CENTIMETERS: 'Centimeters',
  // Weight (backend: WeightUnit enum)
  KILOGRAM: 'Kilogram', GRAM: 'Gram', POUND: 'Pound',
  // Volume (backend: VolumeUnit enum)
  LITRE: 'Litre', MILLILITRE: 'Millilitre', GALLON: 'Gallon',
  // Temperature (backend: TemperatureUnit enum)
  CELSIUS: 'Celsius', FAHRENHEIT: 'Fahrenheit', KELVIN: 'Kelvin',
};

// Units per measurement type — values must match backend enum constants exactly
const UNITS_BY_TYPE = {
  length:      ['FEET', 'INCHES', 'YARDS', 'CENTIMETERS'],
  weight:      ['KILOGRAM', 'GRAM', 'POUND'],
  volume:      ['LITRE', 'MILLILITRE', 'GALLON'],
  temperature: ['CELSIUS', 'FAHRENHEIT', 'KELVIN'],
};

// Backend measurementType strings
const TYPE_MAP = {
  length: 'LengthUnit', weight: 'WeightUnit',
  volume: 'VolumeUnit', temperature: 'TemperatureUnit',
};

export default function InputPanel({ measureType, action }) {
  const units = UNITS_BY_TYPE[measureType] || UNITS_BY_TYPE.length;

  const [fromVal,   setFromVal]   = useState('1');
  const [toVal,     setToVal]     = useState('');
  const [fromUnit,  setFromUnit]  = useState(units[0]);
  const [toUnit,    setToUnit]    = useState(units[1] || units[0]);
  const [op,        setOp]        = useState('+');
  const [result,    setResult]    = useState('');
  const [isError,   setIsError]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [resultKey, setResultKey] = useState(0);

  // Reset when measurement type changes
  useEffect(() => {
    const u = UNITS_BY_TYPE[measureType] || UNITS_BY_TYPE.length;
    setFromUnit(u[0]);
    setToUnit(u[1] || u[0]);
    setFromVal('1');
    setToVal('');
    setResult('');
    setIsError(false);
  }, [measureType]);

  const isArithmeticAllowed = measureType !== 'temperature';

  const calculate = useCallback(async () => {
    const fv = parseFloat(fromVal);
    if (isNaN(fv)) { setResult('Enter a valid number'); setIsError(true); return; }

    if (action === 'arithmetic' && !isArithmeticAllowed) {
      setResult('⚠️ Arithmetic is not supported for Temperature');
      setIsError(true);
      return;
    }

    const tv   = parseFloat(toVal);
    const type = TYPE_MAP[measureType];

    setLoading(true);
    try {
      let res;
      if (action === 'comparison') {
        if (isNaN(tv)) { setResult('Enter both values to compare'); setIsError(true); setLoading(false); return; }
        res = await quantityAPI.compare(fv, fromUnit, tv, toUnit, type);
        // resultString is "true" or "false"
        const equal = res.data.resultString === 'true';
        setResult(equal
          ? `✅ ${fv} ${fromUnit} = ${tv} ${toUnit}`
          : `❌ ${fv} ${fromUnit} ≠ ${tv} ${toUnit}`);

      } else if (action === 'conversion') {
        res = await quantityAPI.convert(fv, fromUnit, toUnit, type);
        const val = res.data.resultValue ?? res.data.value;
        setToVal(parseFloat(val).toFixed(4));
        setResult(`${fv} ${UNIT_DISPLAY[fromUnit]} = ${parseFloat(val).toFixed(4)} ${UNIT_DISPLAY[toUnit]}`);

      } else if (action === 'arithmetic') {
        if (isNaN(tv)) { setResult('Enter both values'); setIsError(true); setLoading(false); return; }
        switch (op) {
          case '+': res = await quantityAPI.add(fv, fromUnit, tv, toUnit, type); break;
          case '-': res = await quantityAPI.subtract(fv, fromUnit, tv, toUnit, type); break;
          case '÷': res = await quantityAPI.divide(fv, fromUnit, tv, toUnit, type); break;
          default:  return;
        }
        const rv = res.data.resultValue ?? res.data.value;
        const ru = res.data.resultUnit  ?? fromUnit;
        setResult(`= ${parseFloat(rv).toFixed(4)} ${UNIT_DISPLAY[ru] || ru}`);
      }

      setIsError(false);
      setResultKey(k => k + 1);
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || 'Calculation failed';
      setResult(msg);
      setIsError(true);
      toast.error(msg);
      setResultKey(k => k + 1);
    } finally {
      setLoading(false);
    }
  }, [fromVal, toVal, fromUnit, toUnit, op, action, measureType, isArithmeticAllowed]);

  // Auto-calculate for conversion when inputs change
  useEffect(() => {
    if (action === 'conversion') calculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromVal, fromUnit, toUnit, action]);

  const inputCls  = 'font-raleway text-[32px] font-extrabold text-[#1a1a2e] border-0 border-b-2 border-[#e0e7ff] outline-none bg-transparent w-full py-1 transition-all duration-200 focus:border-[#3b5bdb] max-sm:text-2xl';
  const selectCls = 'mt-0.5 px-3 py-2 border-[1.5px] border-[#e0e7ff] rounded-lg text-[14px] font-bold text-[#1a1a2e] bg-white cursor-pointer outline-none transition-all duration-200 hover:border-[#b0b8e0] focus:border-[#3b5bdb] w-full';

  return (
    <div>
      <div className="flex items-end gap-5 flex-wrap max-sm:gap-2.5">
        {/* Value A / From */}
        <div className="flex-1 min-w-[140px] flex flex-col gap-2">
          <p className="text-[11px] font-extrabold tracking-[2px] text-[#6b7280]">
            {action === 'arithmetic' ? 'VALUE A' : 'FROM'}
          </p>
          <input type="number" value={fromVal}
            onChange={(e) => setFromVal(e.target.value)}
            className={inputCls} />
          <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)} className={selectCls}>
            {units.map(u => <option key={u} value={u}>{UNIT_DISPLAY[u]}</option>)}
          </select>
        </div>

        {/* Operator / Arrow */}
        <div className="flex items-center justify-center pb-7 min-w-[70px] max-sm:pb-4">
          {action === 'arithmetic' && isArithmeticAllowed ? (
            <OpDropdown selected={op} onSelect={setOp} />
          ) : (
            <svg viewBox="0 0 40 20" width="40" fill="none">
              <line x1="4" y1="10" x2="28" y2="10" stroke="#3b5bdb" strokeWidth="2.5" strokeLinecap="round"/>
              <polyline points="22,4 32,10 22,16" stroke="#3b5bdb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>

        {/* Value B / To */}
        <div className="flex-1 min-w-[140px] flex flex-col gap-2">
          <p className="text-[11px] font-extrabold tracking-[2px] text-[#6b7280]">
            {action === 'arithmetic' ? 'VALUE B' : 'TO'}
          </p>
          <input type="number" value={toVal}
            readOnly={action === 'conversion'}
            onChange={(e) => action !== 'conversion' && setToVal(e.target.value)}
            className={`${inputCls} ${action === 'conversion' ? 'opacity-60 cursor-default' : ''}`}
            disabled={action === 'arithmetic' && !isArithmeticAllowed}
          />
          <select value={toUnit} onChange={(e) => setToUnit(e.target.value)} className={selectCls}>
            {units.map(u => <option key={u} value={u}>{UNIT_DISPLAY[u]}</option>)}
          </select>
        </div>
      </div>

      {/* Calculate button — shown for comparison and arithmetic */}
      {action !== 'conversion' && (
        <button
          type="button"
          onClick={calculate}
          disabled={loading}
          className="mt-5 px-6 py-2.5 bg-[#3b5bdb] hover:bg-[#2f4ac7] disabled:bg-gray-400 text-white rounded-xl font-bold text-sm tracking-wide transition-all duration-200 shadow-md"
        >
          {loading ? 'Calculating…' : action === 'comparison' ? 'Compare' : 'Calculate'}
        </button>
      )}

      {/* Result */}
      <div key={resultKey}
        className="mt-5 flex items-center gap-3.5 bg-[#eef2ff] rounded-[10px] px-5 py-3.5 border-l-4 border-[#3b5bdb] min-h-[52px] animate-popIn"
      >
        <span className={`text-[17px] font-extrabold tracking-wide max-sm:text-sm ${isError ? 'text-[#e53935]' : 'text-[#3b5bdb]'}`}>
          {loading ? 'Calculating…' : (result || 'Select type and values to begin')}
        </span>
      </div>
    </div>
  );
}
