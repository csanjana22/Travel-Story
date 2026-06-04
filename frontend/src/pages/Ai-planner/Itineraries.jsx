import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MdDelete, MdOpenInNew } from 'react-icons/md';
import { MdAutoAwesome } from 'react-icons/md';


const Itineraries = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchList();
  }, []);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/get-all-itineraries');
      setList(res.data.itineraries || []);
    } catch (err) {
      console.error('Fetch itineraries error:', err);
      toast.error(err?.response?.data?.message || 'Failed to fetch itineraries');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this itinerary? This action cannot be undone.')) return;
    try {
      await axiosInstance.delete(`/delete-itinerary/${id}`);
      setList(prev => prev.filter(i => i._id !== id));
      toast.success('Itinerary deleted');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err?.response?.data?.message || 'Failed to delete itinerary');
    }
  };

  const handleView = (it) => setSelected(it);
  const handleClose = () => setSelected(null);

  const handleRevise = (it) => {
    // Navigate to AI Planner with itinerary in state; AIPlanner can read location.state to pre-load
    navigate('/ai-planner', { state: { itinerary: it } });
  };

  const renderPreview = (it) => {
    const d = new Date(it.createdAt || it.updatedAt || null);
    return (
      <div className="flex justify-between items-center">
        <div>
          <div className="font-bold">{it.destination || 'Untitled'}</div>
          <div className="text-sm text-slate-500">{it.days} day(s) • {it.budget ? `₹${it.budget}` : 'Budget N/A'}</div>
        </div>
        <div className="text-sm text-slate-400">{isNaN(d) ? '' : d.toLocaleString()}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MdAutoAwesome className="text-amber-500 text-3xl" />
            <h1 className="text-2xl font-bold">My Itineraries</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/ai-planner')} className="bg-primary text-white px-4 py-2 rounded">Create New</button>
            <button onClick={fetchList} className="bg-white border px-3 py-2 rounded">Refresh</button>
          </div>
        </div>

        {loading && (
          <div className="p-8 bg-white rounded shadow text-center">Loading itineraries...</div>
        )}

        {!loading && list.length === 0 && (
          <div className="p-8 bg-white rounded shadow text-center text-slate-500">No itineraries found. Create one from the AI Planner.</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map(it => (
            <div key={it._id} className="bg-white p-4 rounded-lg shadow flex flex-col justify-between">
              {renderPreview(it)}

              <div className="mt-4 flex gap-2">
                <button onClick={() => handleView(it)} className="flex-1 bg-cyan-50 border border-cyan-200 rounded px-3 py-2 text-left">View</button>
                <button onClick={() => handleRevise(it)} className="bg-primary text-white px-3 py-2 rounded" title="Revise in AI Planner">Revise</button>
                <button onClick={() => handleDelete(it._id)} className="bg-rose-500 text-white px-3 py-2 rounded" title="Delete"><MdDelete /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Detail Modal */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
            <div className="relative max-w-3xl w-full bg-white rounded-lg p-6 overflow-auto max-h-[80vh]">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold">{selected.destination}</h2>
                  <div className="text-sm text-slate-500">{selected.days} day(s) • {selected.budget ? `₹${selected.budget}` : 'Budget N/A'}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { handleRevise(selected); handleClose(); }} className="bg-primary text-white px-3 py-2 rounded">Revise</button>
                  <button onClick={() => { handleDelete(selected._id); handleClose(); }} className="bg-rose-500 text-white px-3 py-2 rounded">Delete</button>
                </div>
              </div>

              {/* If itineraryData is string show raw text */}
              {typeof selected.itineraryData === 'string' && (
                <pre className="whitespace-pre-wrap text-sm text-slate-700 bg-slate-50 p-4 rounded">{selected.itineraryData}</pre>
              )}

              {/* Structured rendering */}
              {selected.itineraryData && Array.isArray(selected.itineraryData.itinerary) && (
                <div className="space-y-4">
                  {selected.itineraryData.itinerary.map(day => (
                    <div key={day.day} className="border rounded p-4">
                      <div className="flex justify-between mb-2">
                        <div className="font-semibold">Day {day.day}</div>
                        <div className="text-sm text-slate-500">Est: ₹{day.daily_total}</div>
                      </div>

                      <div className="relative pt-2">
                        <div className="absolute left-16 top-0 bottom-0 w-[2px] bg-slate-100" />

                        {Array.isArray(day.activities) && day.activities.map((act, idx) => (
                          <div key={idx} className="flex gap-4 items-start py-3">
                            <div className="text-xs text-slate-400 w-16">{act.time}</div>
                            <div className="relative flex-1">
                              <div className="absolute -left-[21.5px] top-0.5 w-3 h-3 rounded-full bg-slate-300" />
                              <div className="font-medium">{act.activity_name}</div>
                              <div className="text-sm text-slate-600">{act.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div className="text-right text-sm text-slate-500">Grand total: ₹{selected.itineraryData.grand_total_estimated_cost || 'N/A'}</div>
                </div>
              )}

              <div className="mt-6 text-right">
                <button onClick={handleClose} className="px-4 py-2 rounded border">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ToastContainer />
    </div>
  );
};

export default Itineraries;
