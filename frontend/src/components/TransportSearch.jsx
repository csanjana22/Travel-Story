import React, { useState } from 'react';
import axiosInstance from '../utils/axiosInstance';

const TransportSearch = ({ onSelect }) => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [mode, setMode] = useState('flight');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/search-transportations', {
        params: { origin, destination, date, mode }
      });
      setResults(res.data.results || []);
    } catch (err) {
      // Fallback/mock if backend not ready:
      setResults([
        { id: 'mock1', provider: 'FastAir', price: 4500, duration: '2h 15m' },
        { id: 'mock2', provider: 'NightBus', price: 900, duration: '10h' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-2">Transport search</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        <input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="Origin" className="border p-2 rounded" />
        <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Destination" className="border p-2 rounded" />
        <input value={date} onChange={e => setDate(e.target.value)} type="date" className="border p-2 rounded" />
        <select value={mode} onChange={e => setMode(e.target.value)} className="border p-2 rounded">
          <option value="flight">Flight</option>
          <option value="train">Train</option>
          <option value="bus">Bus</option>
          <option value="car">Car</option>
          <option value="ferry">Ferry</option>
        </select>
      </div>

      <div className="mt-3 flex gap-2">
        <button onClick={handleSearch} className="bg-primary text-white px-3 py-1 rounded" disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
        <button onClick={() => { setOrigin(''); setDestination(''); setDate(''); setMode('flight'); setResults([]); }} className="border px-3 py-1 rounded">Clear</button>
      </div>

      {results.length > 0 && (
        <div className="mt-3 space-y-2">
          {results.map(r => (
            <div key={r.id} className="p-2 border rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{r.provider} • {r.duration}</div>
                <div className="text-sm text-slate-500">₹{r.price}</div>
              </div>
              <button onClick={() => onSelect?.(r)} className="bg-primary text-white px-3 py-1 rounded">Select</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransportSearch;