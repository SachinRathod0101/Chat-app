import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ConvertBase64() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // सर्व रेकॉर्ड्स फेच करा
  const fetchRecords = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/form/requests');
      // Filter out records where file is missing or not a string
      const validRecords = response.data.filter(record => {
        if (typeof record.file !== 'string') {
          console.warn(`Invalid record - file is not a string:`, record);
          return false;
        }
        return true;
      });
      setRecords(validRecords);
    } catch (err) {
      console.error("Error fetching records:", err);
    }
  };

  // Component लोड झाल्यावर रेकॉर्ड्स फेच करा
  useEffect(() => {
    fetchRecords();
  }, []);

  // Base64 डेटा डिकोड करा आणि uploads/ मध्ये सेव्ह करा
  const handleConvertBase64 = async (record) => {
    // Double-check that file is a string (should be caught by the filter, but adding for safety)
    if (typeof record.file !== 'string') {
      console.error(`Cannot convert record ${record._id} - file is not a string:`, record.file);
      alert(`Cannot convert record ${record._id} - file is not a string`);
      return;
    }

    if (record.file.startsWith('/uploads/')) {
      alert("This record already has a file path: " + record.file);
      return;
    }

    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/form/convert-base64', {
        id: record._id,
        base64Data: record.file,
      });
      alert(`Successfully converted Base64 for record ${record._id}`);
      // रेकॉर्ड्स रिफ्रेश करा
      fetchRecords();
    } catch (err) {
      console.error("Error converting Base64:", err);
      alert("Failed to convert Base64");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 flex flex-col items-center p-4">
      <h2 className="text-3xl font-extrabold text-center text-purple-700 mb-6">
        📂 Convert Base64 to PDF
      </h2>
      <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-2xl space-y-4 border border-purple-300">
        {records.length === 0 ? (
          <p className="text-center text-gray-600">No valid records found.</p>
        ) : (
          records.map((record) => (
            <div
              key={record._id}
              className="flex justify-between items-center p-4 border-b border-purple-200"
            >
              <div>
                <p className="text-lg font-semibold text-purple-700">
                  Name: {record.name}
                </p>
                <p className="text-sm text-gray-600">
                  File: {record.file.startsWith('/uploads/') ? record.file : "Base64 Data"}
                </p>
              </div>
              <button
                onClick={() => handleConvertBase64(record)}
                className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-700 disabled:bg-gray-400"
                disabled={loading || record.file.startsWith('/uploads/')}
              >
                {loading ? "Converting..." : "Convert to PDF"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ConvertBase64;