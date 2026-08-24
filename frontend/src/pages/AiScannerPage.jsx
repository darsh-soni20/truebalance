import React, { useState } from 'react';
import { Sparkles, UploadCloud, FileText, Check, AlertCircle, RefreshCw, ArrowLeft, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import ProUpgradeModal from '../components/ProUpgradeModal';
import { API_BASE } from '../api';

export default function AiScannerPage({ user, token, onUserUpdated }) {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [receiptText, setReceiptText] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanStatusText, setScanStatusText] = useState('');
  const [scannedResult, setScannedResult] = useState(null);
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [showProModal, setShowProModal] = useState(false);

  const isPro = user?.plan === 'pro';

  const triggerConfetti = () => {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleOcrScan = async (directSave = false) => {
    if (!uploadedFile && (!receiptText || !receiptText.trim())) {
      return alert('Please upload a receipt image/PDF document or paste SMS/invoice text first!');
    }

    setScanning(true);
    setStatus({ type: '', msg: '' });
    setScanStatusText('Analyzing document with AI engine...');
    let textToAnalyze = receiptText;

    try {
      if (uploadedFile && uploadedFile.type.startsWith('image/')) {
        setScanStatusText('Scanning optical text (OCR)...');
        const TesseractModule = await import('tesseract.js');
        const Tesseract = TesseractModule.default || TesseractModule;
        const result = await Tesseract.recognize(uploadedFile, 'eng');
        textToAnalyze = result.data.text + ' ' + uploadedFile.name;
      } else if (uploadedFile) {
        textToAnalyze = receiptText + ' ' + uploadedFile.name;
      }

      setScanStatusText('Extracting amount, category, & merchant details...');
      const res = await fetch(`${API_BASE}/api/expenses/ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageText: textToAnalyze, filename: uploadedFile ? uploadedFile.name : '' })
      });

      const parsed = await res.json();
      if (!res.ok) throw new Error(parsed.error || 'OCR scan failed');

      setScannedResult(parsed);

      if (directSave) {
        const saveRes = await fetch(`${API_BASE}/api/expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            amount: parsed.amount,
            category: parsed.category,
            description: parsed.description,
            date: parsed.date,
            time: parsed.time,
            type: parsed.type
          })
        });

        const newTx = await saveRes.json();
        if (!saveRes.ok) throw new Error(newTx.error || 'Failed to save scanned transaction');

        triggerConfetti();
        setStatus({ type: 'success', msg: `Successfully added ${parsed.type.toUpperCase()}: ₹${parsed.amount.toFixed(2)} (${parsed.description}) to your transactions!` });
      } else {
        setStatus({ type: 'success', msg: 'Document scanned successfully! Review extracted details below.' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setScanning(false);
      setScanStatusText('');
    }
  };

  const handleSaveScanned = async () => {
    if (!scannedResult) return;

    try {
      const res = await fetch(`${API_BASE}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: scannedResult.amount,
          category: scannedResult.category,
          description: scannedResult.description,
          date: scannedResult.date,
          time: scannedResult.time,
          type: scannedResult.type
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      triggerConfetti();
      setStatus({ type: 'success', msg: 'Scanned transaction saved to your database!' });
      setScannedResult(null);
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Receipt & Invoice Scanner</h1>
              {!isPro && <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold text-xs">PRO 🔒</span>}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Upload payment screenshots, invoices, or paste SMS alerts to auto-detect spending</p>
          </div>
        </div>

        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {!isPro ? (
        <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-500/30 p-8 rounded-3xl text-center space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-white w-fit mx-auto shadow-lg shadow-amber-500/30">
            <Crown className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Receipt Scanner is a PRO Feature 👑</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Upgrade to TrueBalance PRO to auto-scan receipts, payment screenshots, and PDF invoices with optical character recognition (OCR).
            </p>
          </div>
          <button
            onClick={() => setShowProModal(true)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:opacity-95 text-white font-bold text-xs shadow-xl shadow-amber-500/25 cursor-pointer transition-all inline-flex items-center gap-2"
          >
            <Crown className="w-4 h-4" />
            <span>Upgrade to TrueBalance PRO 👑 (1-Click Test)</span>
          </button>
        </div>
      ) : (
        <>
          {status.msg && (
            <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2 ${
              status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
            }`}>
              {status.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{status.msg}</span>
            </div>
          )}

          {/* Main Scanner Workspace Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
              <h2 className="font-semibold text-lg text-gray-900 dark:text-white">1. Select Document or Paste Text</h2>

              <div className="border-2 border-dashed border-indigo-500/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-gray-50/50 dark:bg-gray-800/30 hover:bg-indigo-500/5 transition-all relative cursor-pointer min-h-[180px]">
                <input
                  type="file"
                  accept="image/*,.pdf,.txt"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                {filePreview ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={filePreview} alt="Receipt Preview" className="h-32 object-contain rounded-xl border border-gray-200 dark:border-gray-700 shadow-md" />
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold truncate max-w-[260px]">{uploadedFile?.name}</span>
                  </div>
                ) : uploadedFile ? (
                  <div className="flex flex-col items-center gap-2 text-indigo-500">
                    <FileText className="w-12 h-12" />
                    <span className="text-xs font-semibold">{uploadedFile.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <UploadCloud className="w-12 h-12 text-indigo-500 animate-bounce" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Click or drag & drop payment receipt / screenshot</span>
                    <span className="text-xs text-gray-400">Supports PNG, JPG, WEBP, PDF, TXT</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Or Paste Bank SMS / Invoice Text</label>
                <textarea
                  rows="5"
                  placeholder="e.g. Rs 450.00 debited from HDFC Bank VPA Swiggy on 24-08-2026..."
                  value={receiptText}
                  onChange={(e) => setReceiptText(e.target.value)}
                  className="w-full p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-inner"
                />
              </div>

              {scanStatusText && (
                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                  <span>{scanStatusText}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handleOcrScan(false)}
                  disabled={scanning}
                  className="px-5 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>Scan & Inspect Results</span>
                </button>

                <button
                  onClick={() => handleOcrScan(true)}
                  disabled={scanning}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Scan & Direct Save to Database</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
              <div>
                <h2 className="font-semibold text-lg text-gray-900 dark:text-white pb-4 border-b border-gray-100 dark:border-gray-800">2. Extracted AI Details</h2>

                {scannedResult ? (
                  <div className="mt-6 space-y-4">
                    <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400 uppercase">Transaction Type</span>
                        <span className={`px-2.5 py-1 rounded-full font-bold text-xs ${scannedResult.type === 'income' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'}`}>
                          {scannedResult.type.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400 uppercase">Detected Amount</span>
                        <span className="text-2xl font-extrabold text-gray-900 dark:text-white">₹{scannedResult.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400 uppercase">Category</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{scannedResult.category}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400 uppercase">Date & Time</span>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{scannedResult.date} {scannedResult.time}</span>
                      </div>

                      <div className="pt-2 border-t border-indigo-500/10">
                        <span className="text-xs font-semibold text-gray-400 block mb-1">Description / Merchant</span>
                        <p className="text-xs text-gray-700 dark:text-gray-200 font-medium">{scannedResult.description}</p>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveScanned}
                      className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirm & Save to Transactions</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-400 space-y-2">
                    <Sparkles className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-700" />
                    <p className="text-xs font-medium">No document scanned yet. Upload an image or paste text to extract spending details automatically.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {showProModal && (
        <ProUpgradeModal
          user={user}
          token={token}
          onClose={() => setShowProModal(false)}
          onUserUpdated={onUserUpdated}
        />
      )}

    </div>
  );
}
