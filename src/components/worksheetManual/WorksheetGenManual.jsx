import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';

const WorksheetGenManual = () => {
  const [worksheets, setWorksheets] = useState([]);

  useEffect(() => {
    const db = getDatabase();
    const wsRef = ref(db, 'manualWorksheets');

    const unsubscribe = onValue(wsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([id, ws]) => ({
          ...ws,
          id,
          createdAt: new Date(ws.createdAt || Date.now()),
        }));
        setWorksheets(list.reverse());
      } else {
        setWorksheets([]);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">All Question Sets</h2>
      {worksheets.length === 0 ? (
        <div className="text-center text-slate-500">No worksheets found.</div>
      ) : (
        worksheets.map(ws => (
          <details key={ws.id} className="bg-white rounded-lg shadow-md border border-slate-200">
            <summary className="p-4 cursor-pointer font-semibold text-slate-800">
              {ws.name} <span className="text-sm text-slate-500 ml-2">({ws.createdAt.toLocaleDateString()})</span>
            </summary>
            <div className="p-4 bg-slate-50 space-y-2">
              {ws.questions && ws.questions.map((q, i) => (
                <div key={i} className="border p-3 rounded bg-white">
                  <p><strong>{i + 1}. </strong>{q.questionText}</p>
                  <ul className="list-disc list-inside text-sm text-slate-600">
                    {q.options && q.options.map((opt, idx) => (
                      <li key={idx}>{opt}</li>
                    ))}
                  </ul>
                  <p className="text-green-600 text-sm mt-1">Answer: {q.correctAnswer}</p>
                </div>
              ))}
            </div>
          </details>
        ))
      )}
    </div>
  );
};

export default WorksheetGenManual;
