import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { AI_REQUEST_TIMEOUT_MS } from '../../utils/constants';
import { MdAutoAwesome, MdSend } from "react-icons/md";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import TransportSearch from '../../components/TransportSearch';

const AIPlanner = () => {
  const [formData, setFormData] = useState({
    destination: '',
    days: 1,
    budget: '',
    interests: ''
  });
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [revision, setRevision] = useState('');
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [transportOpen, setTransportOpen] = useState(true);

  // Abort controller for ongoing requests (generate / revise)
  const requestController = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // If navigation state contains an itinerary (from Itineraries.jsx), pre-load it
  useEffect(() => {
    if (location && location.state && location.state.itinerary) {
      const it = location.state.itinerary;
      setItinerary(it);
      setFormData({
        destination: it.destination || '',
        days: it.days || 1,
        budget: it.budget || '',
        interests: it.interests || ''
      });
      toast.info('Loaded itinerary for viewing/revision');
      // Clear router state to avoid re-loading on future navigations
      navigate(location.pathname, { replace: true, state: {} });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (requestController.current) {
        try { requestController.current.abort(); } catch (_) {}
      }
    };
  }, []);

  const isStructuredItinerary = (it) => {
    return it && typeof it === 'object' && Array.isArray(it.itinerary);
  };

  // Initial Generation
  const handleGenerate = async (e) => {
    e.preventDefault();

    // Basic client-side validation
    if (!formData.destination.trim()) return toast.error('Please enter a destination');
    const daysNum = Number(formData.days);
    const budgetNum = Number(formData.budget);
    if (!Number.isInteger(daysNum) || daysNum < 1) return toast.error('Please enter a valid number of days');
    if (Number.isNaN(budgetNum) || budgetNum <= 0) return toast.error('Please enter a valid budget');

    setLoading(true);
    const controller = new AbortController();
    requestController.current = controller;
    try {
      const payload = { ...formData, days: daysNum, budget: budgetNum };
      const res = await axiosInstance.post("/generate-itinerary", payload, { timeout: AI_REQUEST_TIMEOUT_MS, signal: controller.signal });
      const newItin = res.data.itinerary;

      // Defensive handling: itineraryData might be a string if AI returned invalid JSON
      if (newItin && typeof newItin.itineraryData === 'string') {
        setItinerary(newItin);
        toast.warn('The AI returned an unparsable itinerary. Showing raw output. You can try revising.');
      } else if (newItin) {
        setItinerary(newItin);
        toast.success("Itinerary generated!");
      } else {
        toast.error('Unexpected response from server');
      }
    } catch (err) {
      console.error('Generate error:', err);
      // Canceled / abort
      if (err?.name === 'CanceledError' || String(err?.message).toLowerCase().includes('canceled')) {
        toast.info('Request cancelled.');
      } else if (err?.code === 'ECONNABORTED' || String(err?.message).toLowerCase().includes('timeout')) {
        toast.error('Request timed out (can take up to 5 minutes). Try fewer days or retry.');
      } else {
        const message = err?.response?.data?.message || err.message || 'Failed to generate plan.';
        toast.error(message);
      }
    } finally {
      setLoading(false);
      requestController.current = null;
    }
  };

  // Revision logic (Chatting with the AI)
  const handleUpdate = async () => {
    if (!revision.trim()) return toast.error('Please enter your revision request');
    if (!itinerary || !itinerary._id) return toast.error('No itinerary to revise');

    setLoading(true);
    const controller = new AbortController();
    requestController.current = controller;
    try {
      const res = await axiosInstance.post(`/revise-itinerary/${itinerary._id}`, { 
        feedback: revision 
      }, { timeout: AI_REQUEST_TIMEOUT_MS, signal: controller.signal });

      const updated = res.data.itinerary;
      if (updated && typeof updated.itineraryData === 'string') {
        setItinerary(updated);
        toast.warn('Revision completed but AI response was unparsable. Showing raw output.');
      } else if (updated) {
        setItinerary(updated);
        setRevision('');
        toast.success('Itinerary updated');
      } else {
        toast.error('Unexpected response from server');
      }
    } catch (err) {
      console.error('Revise error:', err);
      if (err?.name === 'CanceledError' || String(err?.message).toLowerCase().includes('canceled')) {
        toast.info('Revision request cancelled.');
      } else if (err?.code === 'ECONNABORTED' || String(err?.message).toLowerCase().includes('timeout')) {
        toast.error('Revision timed out. Please try again.');
      } else {
        const message = err?.response?.data?.message || err.message || 'Failed to update plan.';
        toast.error(message);
      }
    } finally {
      setLoading(false);
      requestController.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header Section */}
        <div className="flex items-center gap-2 mb-8">
          <MdAutoAwesome className="text-amber-500 text-3xl" />
          <h1 className="text-3xl font-bold text-slate-800">AI Travel Planner</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Panel: Form (Always visible on mobile top, sticky on desktop) */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-md sticky top-24">
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">Plan Your Trip</h2>
              {itinerary && itinerary._id && (
                <div className="mb-3 text-sm text-amber-600">Loaded existing itinerary — use the revision box below to submit feedback and update this plan. Use "Generate New" to create a separate plan.</div>
              )}
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Destination</label>
                  <input 
                    className="w-full p-2 border rounded mt-1 outline-cyan-500"
                    placeholder="e.g. Hyderabad, India"
                    value={formData.destination}
                    onChange={(e) => setFormData({...formData, destination: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Days</label>
                    <input type="number" min="1" max="14"
                      className="w-full p-2 border rounded mt-1"
                      value={formData.days}
                      onChange={(e) => setFormData({...formData, days: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Budget (₹)</label>
                    <input type="number" 
                      className="w-full p-2 border rounded mt-1"
                      value={formData.budget}
                      onChange={(e) => setFormData({...formData, budget: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Interests</label>
                  <textarea 
                    className="w-full p-2 border rounded mt-1 h-24"
                    placeholder="e.g. nature, local food, history"
                    value={formData.interests}
                    onChange={(e) => setFormData({...formData, interests: e.target.value})}
                  />
                </div>
                <div className="flex gap-2">
                  {itinerary && itinerary._id ? (
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-primary text-white py-3 rounded-lg font-bold hover:bg-cyan-600 transition disabled:bg-slate-300"
                    >
                      {loading ? "Planning (30–90 sec)…" : "Generate New"}
                    </button>
                  ) : (
                    <button 
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-primary text-white py-3 rounded-lg font-bold hover:bg-cyan-600 transition disabled:bg-slate-300"
                    >
                      {loading ? "Planning (30–90 sec)…" : "Generate Itinerary"}
                    </button>
                  )}
                  {loading && (
                    <button type="button" onClick={() => {
                      if (requestController.current) requestController.current.abort();
                      setLoading(false);
                      toast.info('Request cancelled');
                    }} className="px-4 bg-rose-500 text-white rounded-lg">Cancel</button>
                  )}
                </div>
              </form>
              {/* Transport Search (collapsible) */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">Transport</h3>
                  <button onClick={() => setTransportOpen(v => !v)} className="text-sm text-slate-500">
                    {transportOpen ? 'Hide' : 'Show'}
                  </button>
                </div>

                {transportOpen && (
                  <>
                    <TransportSearch onSelect={(r) => setSelectedTransport(r)} />
                    {selectedTransport && (
                      <div className="mt-3 p-3 bg-slate-50 rounded text-sm">
                        <div className="font-medium">{selectedTransport.provider} • {selectedTransport.duration}</div>
                        <div className="text-slate-500">₹{selectedTransport.price}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Itinerary Result & Chat */}
          <div className="lg:col-span-2 space-y-6">
            {!itinerary && !loading && (
              <div className="h-full flex flex-col items-center justify-center p-20 text-slate-400 border-2 border-dashed rounded-xl">
                <MdAutoAwesome className="text-6xl mb-4 opacity-20" />
                <p>Your custom travel plan will appear here.</p>
              </div>
            )}

            {itinerary && (
              <div className="space-y-6">
                {/* If AI returned unparsable text */}
                {typeof itinerary.itineraryData === 'string' && (
                  <div className="bg-white p-6 rounded-xl border border-amber-200 text-slate-700">
                    <h3 className="font-bold mb-2">AI Output (raw)</h3>
                    <pre className="whitespace-pre-wrap text-sm max-h-80 overflow-auto">{itinerary.itineraryData}</pre>
                    <p className="mt-3 text-sm text-slate-500">The AI returned text instead of a structured itinerary. Try revising or regenerate with different inputs.</p>
                  </div>
                )}

                {/* Render Days when structured */}
                {isStructuredItinerary(itinerary.itineraryData) && (
                  <div className="space-y-6">
                    {itinerary.itineraryData.itinerary.map((day) => (
                      <div key={day.day} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="bg-primary/5 px-6 py-3 border-b border-primary/10 flex justify-between">
                          <h3 className="font-bold text-primary">Day {day.day}</h3>
                          <span className="text-sm font-medium text-slate-500">Est: ₹{day.daily_total}</span>
                        </div>
                        <div className="p-6 space-y-4">
                          {Array.isArray(day.activities) && day.activities.map((act, idx) => (
                            <div key={idx} className="flex gap-4 border-l-2 border-slate-100 pl-4 relative">
                              <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-slate-300" />
                              <span className="text-xs font-bold text-slate-400 w-12">{act.time}</span>
                              <div>
                                <h4 className="font-bold text-slate-800">{act.activity_name}</h4>
                                <p className="text-sm text-slate-600">{act.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Revision Chat Box */}
                <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-primary/40 flex gap-2 items-center">
                  <input 
                    className="flex-1 outline-none p-2"
                    placeholder="Need changes? e.g. Make it more relaxed..."
                    value={revision}
                    onChange={(e) => setRevision(e.target.value)}
                  />

                  <button 
                    onClick={handleUpdate}
                    disabled={loading || !revision.trim() || !itinerary || !itinerary._id}
                    className="bg-primary p-3 rounded-full text-white hover:scale-110 transition"
                    title={!itinerary || !itinerary._id ? 'No itinerary to revise' : 'Send revision'}
                  >
                    <MdSend />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default AIPlanner;

