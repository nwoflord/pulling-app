'use client';
import { useState, useEffect } from 'react';

export default function ClassSetupForm() {
  const [name, setName] = useState('');
  const [hookFee, setHookFee] = useState('');
  
  // New Payout Builder State
  const [numPlaces, setNumPlaces] = useState(1); // Default to Winner Take All
  const [percentages, setPercentages] = useState<string[]>(['100']); // Store as strings to handle empty inputs gracefully
  const [total, setTotal] = useState(100);

  // Update the array when number of places changes
  useEffect(() => {
    // Resize the array to match numPlaces, fill new spots with empty strings
    setPercentages((prev) => {
      const newArr = [...prev];
      if (newArr.length < numPlaces) {
        // Add new slots (default to 0 or empty)
        while (newArr.length < numPlaces) newArr.push('');
      } else {
        // Trim excess
        newArr.length = numPlaces;
      }
      return newArr;
    });
  }, [numPlaces]);

  // Recalculate total whenever percentages change
  useEffect(() => {
    const sum = percentages.reduce((acc, val) => acc + (Number(val) || 0), 0);
    setTotal(sum);
  }, [percentages]);

  const handlePercentageChange = (index: number, value: string) => {
    const newPercentages = [...percentages];
    newPercentages[index] = value;
    setPercentages(newPercentages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validation: Must equal 100%
    if (total !== 100) {
      alert(`Percentages must equal 100%. Currently: ${total}%`);
      return;
    }

    // 2. Prepare the data (Convert strings to numbers)
    const payload = {
      name,
      hook_fee: Number(hookFee),
      payout_distribution: percentages.map((p) => Number(p)), // Sends [50, 30, 20]
    };

    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      alert('Class Created Successfully!');
      // Optional: Reset form
      setName('');
      setHookFee('');
      setNumPlaces(1);
      setPercentages(['100']);
    } catch (error: any) {
      console.error(error);
      alert('Error creating class: ' + error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-xl font-bold mb-4">Create New Class</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Class Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Class Name</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Open Steer Wrestling"
          />
        </div>

        {/* Hook Fee */}
        <div>
          <label className="block text-sm font-medium mb-1">Hook Fee ($)</label>
          <input
            type="number"
            className="w-full border p-2 rounded"
            value={hookFee}
            onChange={(e) => setHookFee(e.target.value)}
            required
            placeholder="150"
          />
        </div>

        <hr className="my-4" />

        {/* PAYOUT BUILDER */}
        <div>
          <label className="block text-sm font-medium mb-2">Payout Structure</label>
          
          {/* Selector for Number of Places */}
          <div className="flex items-center gap-4 mb-3">
            <span className="text-sm text-gray-600">Pay how many places?</span>
            <select 
              value={numPlaces} 
              onChange={(e) => setNumPlaces(Number(e.target.value))}
              className="border p-1 rounded"
            >
              <option value={1}>1 Place (Winner Take All)</option>
              <option value={2}>2 Places</option>
              <option value={3}>3 Places</option>
              <option value={4}>4 Places</option>
            </select>
          </div>

          {/* Dynamic Inputs */}
          <div className="space-y-2">
            {percentages.map((p, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-8 text-sm font-bold text-gray-500">{index + 1}st:</span>
                <input
                  type="number"
                  className="w-20 border p-2 rounded"
                  value={p}
                  onChange={(e) => handlePercentageChange(index, e.target.value)}
                  placeholder="0"
                />
                <span className="text-gray-500">%</span>
              </div>
            ))}
          </div>

          {/* Total Checker */}
          <div className={`mt-3 text-sm font-bold ${total === 100 ? 'text-green-600' : 'text-red-500'}`}>
            Total: {total}% {total !== 100 && "(Must be 100)"}
          </div>
        </div>

        <button
          type="submit"
          disabled={total !== 100}
          className={`w-full text-white p-2 rounded mt-4 ${
            total === 100 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Create Class
        </button>
      </form>
    </div>
  );
}