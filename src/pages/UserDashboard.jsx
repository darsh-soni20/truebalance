import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, Pencil, X, Calendar, Clock, IndianRupee, Tag, FileText, PieChart as PieIcon, Filter, Search, Download, AlertTriangle, Target, UploadCloud, Users, ArrowUpRight, ArrowDownLeft, Sparkles, Receipt, FileDown, Image, Check, Zap, Flame, Award, ShieldCheck, Bot, CreditCard, RefreshCw, Landmark, Compass, PiggyBank, Eye, Plus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import confetti from 'canvas-confetti';
import { API_BASE } from '../api';

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Bills & Utilities',
  'Shopping',
  'Entertainment',
  'Health & Fitness',
  'Salary & Income',
  'Other'
];

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6', '#64748B', '#10B981'];

function AnimatedCounter({ value, prefix = '₹', isPositive = true }) {
  const [displayVal, setDisplayVal] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.abs(value);
    if (start === end) {
      setDisplayVal(end);
      return;
    }

    const duration = 600;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = (end - start) / steps;

    let current = start;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setDisplayVal(end);
        clearInterval(timer);
      } else {
        setDisplayVal(current);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {isPositive ? '+' : '-'}{prefix}{displayVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

export default function UserDashboard({ token, user, openSplitTrigger, openScannerTrigger, openGoalTrigger, openCardTrigger }) {
  const [expenses, setExpenses] = useState([]);
  const [splits, setSplits] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form States
  const [editingId, setEditingId] = useState(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().split(' ')[0].slice(0, 5));
  const [transactionType, setTransactionType] = useState('expense');

  // Custom Quick Tap Buttons State (Persisted in localStorage)
  const [customQuickButtons, setCustomQuickButtons] = useState(() => {
    try {
      const saved = localStorage.getItem('truebalance_custom_quick_buttons');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [showQuickModal, setShowQuickModal] = useState(false);
  const [quickLabel, setQuickLabel] = useState('');
  const [quickAmountVal, setQuickAmountVal] = useState('');
  const [quickCategoryVal, setQuickCategoryVal] = useState(CATEGORIES[0]);

  // OCR Scanner State
  const [scanning, setScanning] = useState(false);
  const [scanStatusText, setScanStatusText] = useState('');
  const [receiptText, setReceiptText] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  // Modals
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showFirstTimeBudgetModal, setShowFirstTimeBudgetModal] = useState(false);
  const [userBudgetInput, setUserBudgetInput] = useState(user?.monthly_budget ? user.monthly_budget.toString() : '25000');

  useEffect(() => {
    if (user?.id) {
      const hasConfigured = localStorage.getItem(`truebalance_budget_configured_${user.id}`);
      if (!hasConfigured) {
        setShowFirstTimeBudgetModal(true);
      }
    }
  }, [user]);

  const handleSaveFirstTimeBudget = async (e) => {
    e.preventDefault();
    if (!userBudgetInput || parseFloat(userBudgetInput) <= 0) return;

    try {
      const res = await fetch(`${API_BASE}/api/user/budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ monthly_budget: parseFloat(userBudgetInput) })
      });
      const updatedUser = await res.json();
      if (res.ok && updatedUser) {
        localStorage.setItem(`truebalance_budget_configured_${user.id}`, 'true');
        setShowFirstTimeBudgetModal(false);
        window.location.reload();
      }
    } catch (err) {
      setShowFirstTimeBudgetModal(false);
    }
  };

  // Modal Form States
  const [splitTitle, setSplitTitle] = useState('');
  const [splitTotal, setSplitTotal] = useState('');
  const [splitPeople, setSplitPeople] = useState('2');

  const [subTitle, setSubTitle] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subDueDay, setSubDueDay] = useState('5');
  const [subCategory, setSubCategory] = useState('Bills & Utilities');

  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalSaved, setGoalSaved] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');

  const [cardName, setCardName] = useState('');
  const [cardDueDate, setCardDueDate] = useState('');
  const [cardStatement, setCardStatement] = useState('');
  const [cardMinDue, setCardMinDue] = useState('');

  // Search & Filter State
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchExpenses();
    fetchSplits();
    fetchSubscriptions();
    fetchGoals();
    fetchCreditCards();
  }, []);

  // Listen for Navbar triggers
  useEffect(() => {
    if (openSplitTrigger > 0) setShowSplitModal(true);
  }, [openSplitTrigger]);

  useEffect(() => {
    if (openScannerTrigger > 0) setShowScanner((prev) => !prev);
  }, [openScannerTrigger]);

  useEffect(() => {
    if (openGoalTrigger > 0) setShowGoalModal(true);
  }, [openGoalTrigger]);

  useEffect(() => {
    if (openCardTrigger > 0) setShowCardModal(true);
  }, [openCardTrigger]);

  const triggerConfetti = () => {
    // Celebration confetti disabled per user request
  };

  const fetchExpenses = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/expenses`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setExpenses(data);
    } catch (err) {} finally { setLoading(false); }
  };

  const fetchSplits = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/splits`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setSplits(data);
    } catch (err) {}
  };

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/subscriptions`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setSubscriptions(data);
    } catch (err) {}
  };

  const fetchGoals = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/goals`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setGoals(data);
    } catch (err) {}
  };

  const fetchCreditCards = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/credit-cards`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) setCreditCards(data);
    } catch (err) {}
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
      return alert('Please upload a receipt screenshot/document or paste SMS text first!');
    }

    setScanning(true);
    setScanStatusText('Analyzing document with AI...');
    let textToAnalyze = receiptText;

    try {
      if (uploadedFile && uploadedFile.type.startsWith('image/')) {
        setScanStatusText('Scanning text from screenshot/receipt...');
        const TesseractModule = await import('tesseract.js');
        const Tesseract = TesseractModule.default || TesseractModule;
        const result = await Tesseract.recognize(uploadedFile, 'eng');
        textToAnalyze = result.data.text + ' ' + uploadedFile.name;
      } else if (uploadedFile) {
        textToAnalyze = receiptText + ' ' + uploadedFile.name;
      }

      setScanStatusText('Extracting amount, category, & merchant...');
      const res = await fetch(`${API_BASE}/api/expenses/ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageText: textToAnalyze, filename: uploadedFile ? uploadedFile.name : '' })
      });

      const parsed = await res.json();
      if (!res.ok) throw new Error(parsed.error || 'OCR scan failed');

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

        setExpenses([newTx, ...expenses]);
        setShowScanner(false);
        resetScannerState();
        triggerConfetti();
        alert(`Successfully scanned & added ${parsed.type.toUpperCase()}: ₹${parsed.amount.toFixed(2)} (${parsed.description})`);
      } else {
        setAmount(parsed.amount.toString());
        setCategory(parsed.category);
        setDescription(parsed.description);
        setDate(parsed.date);
        setTime(parsed.time);
        setTransactionType(parsed.type);
        setShowScanner(false);
        resetScannerState();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setScanning(false);
      setScanStatusText('');
    }
  };

  const resetScannerState = () => {
    setReceiptText('');
    setUploadedFile(null);
    setFilePreview(null);
  };

  const handleQuickAdd = async (quickCat, quickDesc, quickVal) => {
    try {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().split(' ')[0].slice(0, 5);

      const res = await fetch(`${API_BASE}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amount: quickVal,
          category: quickCat,
          description: quickDesc,
          date: currentDate,
          time: currentTime,
          type: 'expense'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add quick expense');

      setExpenses([data, ...expenses]);
      triggerConfetti();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddCustomQuickButton = (e) => {
    e.preventDefault();
    if (!quickLabel || !quickAmountVal || parseFloat(quickAmountVal) <= 0) return;

    const newBtn = {
      id: Date.now(),
      label: quickLabel,
      amount: parseFloat(quickAmountVal),
      category: quickCategoryVal
    };

    const updatedList = [...customQuickButtons, newBtn];
    setCustomQuickButtons(updatedList);
    localStorage.setItem('truebalance_custom_quick_buttons', JSON.stringify(updatedList));

    setQuickLabel('');
    setQuickAmountVal('');
    setQuickCategoryVal(CATEGORIES[0]);
    setShowQuickModal(false);
  };

  const handleDeleteCustomQuickButton = (id, e) => {
    e.stopPropagation();
    const updatedList = customQuickButtons.filter((b) => b.id !== id);
    setCustomQuickButtons(updatedList);
    localStorage.setItem('truebalance_custom_quick_buttons', JSON.stringify(updatedList));
  };

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    if (editingId) {
      try {
        const res = await fetch(`${API_BASE}/api/expenses/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ amount, category, description, date, time, type: transactionType })
        });

        const updatedData = await res.json();
        if (!res.ok) throw new Error(updatedData.error || 'Failed to update transaction');

        setExpenses(expenses.map((exp) => (exp.id === editingId ? updatedData : exp)));
        resetForm();
      } catch (err) {
        alert(err.message);
      }
    } else {
      try {
        const res = await fetch(`${API_BASE}/api/expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ amount, category, description, date, time, type: transactionType })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to add transaction');

        setExpenses([data, ...expenses]);
        resetForm();
        triggerConfetti();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleAddSplit = async (e) => {
    e.preventDefault();
    if (!splitTitle || !splitTotal || parseFloat(splitTotal) <= 0) return;

    try {
      const total = parseFloat(splitTotal);
      const count = parseInt(splitPeople, 10) || 2;
      const perPerson = total / count;

      const res = await fetch(`${API_BASE}/api/splits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: splitTitle, total_amount: total, split_count: count, per_person: perPerson })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create bill split');

      setSplits([data, ...splits]);
      setSplitTitle('');
      setSplitTotal('');
      setSplitPeople('2');
      setShowSplitModal(false);
      triggerConfetti();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!goalTitle || !goalTarget) return;

    try {
      const res = await fetch(`${API_BASE}/api/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: goalTitle, target_amount: goalTarget, saved_amount: goalSaved || 0, deadline_date: goalDeadline })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add goal');

      setGoals([data, ...goals]);
      setGoalTitle('');
      setGoalTarget('');
      setGoalSaved('');
      setGoalDeadline('');
      setShowGoalModal(false);
      triggerConfetti();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDepositGoal = async (id) => {
    const amountStr = prompt('Enter deposit amount (₹):', '1000');
    if (!amountStr || parseFloat(amountStr) <= 0) return;

    try {
      const res = await fetch(`${API_BASE}/api/goals/${id}/deposit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ addAmount: amountStr })
      });

      const updated = await res.json();
      if (res.ok) {
        setGoals(goals.map((g) => (g.id === id ? updated : g)));
        triggerConfetti();
      }
    } catch (err) {}
  };

  const handleDeleteGoal = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/goals/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setGoals(goals.filter((g) => g.id !== id));
    } catch (err) {}
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!cardName || !cardDueDate || !cardStatement) return;

    try {
      const res = await fetch(`${API_BASE}/api/credit-cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ card_name: cardName, due_date: cardDueDate, statement_amount: cardStatement, min_due: cardMinDue || 0 })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add credit card');

      setCreditCards([...creditCards, data]);
      setCardName('');
      setCardDueDate('');
      setCardStatement('');
      setCardMinDue('');
      setShowCardModal(false);
      triggerConfetti();
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePayCard = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/credit-cards/${id}/pay`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setCreditCards(creditCards.map((c) => (c.id === id ? { ...c, status: 'paid' } : c)));
        triggerConfetti();
      }
    } catch (err) {}
  };

  const handleDeleteCard = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/credit-cards/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCreditCards(creditCards.filter((c) => c.id !== id));
    } catch (err) {}
  };

  const startEdit = (exp) => {
    setEditingId(exp.id);
    setAmount(exp.amount.toString());
    setCategory(exp.category);
    setDescription(exp.description || '');
    setDate(exp.date);
    setTime(exp.time);
    setTransactionType(exp.type || 'expense');
  };

  const resetForm = () => {
    setEditingId(null);
    setAmount('');
    setCategory(CATEGORIES[0]);
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setTime(new Date().toTimeString().split(' ')[0].slice(0, 5));
    setTransactionType('expense');
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const res = await fetch(`${API_BASE}/api/expenses/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to delete');
      setExpenses(expenses.filter((exp) => exp.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      alert(err.message);
    }
  };

  const exportToCSV = () => {
    if (filteredExpenses.length === 0) return alert('No records to export');
    const headers = ['Date', 'Time', 'Type', 'Category', 'Description', 'Amount (Rs)'];
    const rows = filteredExpenses.map((exp) => [
      exp.date,
      exp.time,
      exp.type || 'expense',
      `"${exp.category}"`,
      `"${(exp.description || '').replace(/"/g, '""')}"`,
      exp.amount.toFixed(2)
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TrueBalance_statement_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (filteredExpenses.length === 0) return alert('No records to export');

    const doc = new jsPDF();
    const now = new Date();
    const timestampStr = `${now.toLocaleDateString('en-IN')} ${now.toLocaleTimeString('en-IN')}`;

    // Load TrueBalance logo image
    const img = new Image();
    img.src = '/assets/logo_light.png';

    const renderDoc = () => {
      try {
        doc.addImage(img, 'PNG', 14, 12, 50, 20);
      } catch (err) {
        doc.setFontSize(20);
        doc.setTextColor(34, 197, 94);
        doc.text('TrueBalance', 14, 22);
      }

      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text('FINANCIAL STATEMENT REPORT', 196, 20, { align: 'right' });

      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Generated: ${timestampStr}`, 196, 26, { align: 'right' });
      doc.text(`Statement Period: ${selectedMonth}`, 196, 31, { align: 'right' });

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, 36, 196, 36);

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, 40, 182, 28, 3, 3, 'F');

      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.text('ACCOUNT HOLDER DETAILS', 18, 47);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Name: ${user?.name || 'Valued User'}`, 18, 54);
      doc.text(`Email: ${user?.email || 'N/A'}`, 18, 60);

      doc.text(`Total Transactions: ${filteredExpenses.length}`, 120, 54);
      doc.text(`Monthly Budget Limit: Rs ${userBudget.toLocaleString('en-IN')}`, 120, 60);

      doc.setFillColor(240, 253, 244);
      doc.roundedRect(14, 73, 42, 22, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(22, 101, 52);
      doc.text('TOTAL INCOME', 18, 80);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`+Rs ${totalIncome.toFixed(2)}`, 18, 89);

      doc.setFillColor(254, 242, 242);
      doc.roundedRect(60, 73, 42, 22, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(153, 27, 27);
      doc.setFont('helvetica', 'normal');
      doc.text('TOTAL SPEND', 64, 80);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`-Rs ${totalMonthlySpend.toFixed(2)}`, 64, 89);

      doc.setFillColor(238, 242, 255);
      doc.roundedRect(106, 73, 42, 22, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(55, 48, 163);
      doc.setFont('helvetica', 'normal');
      doc.text('NET SAVINGS', 110, 80);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${netBalance >= 0 ? '+' : '-'}Rs ${Math.abs(netBalance).toFixed(2)}`, 110, 89);

      doc.setFillColor(254, 243, 199);
      doc.roundedRect(152, 73, 44, 22, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(146, 64, 14);
      doc.setFont('helvetica', 'normal');
      doc.text('HEALTH SCORE', 156, 80);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${healthScore} / 100`, 156, 89);

      const tableHeaders = [['Date & Time', 'Type', 'Category', 'Description', 'Amount (Rs)']];
      const tableRows = filteredExpenses.map((exp) => [
        `${exp.date} ${exp.time}`,
        (exp.type || 'expense').toUpperCase(),
        exp.category,
        exp.description || '—',
        `${exp.type === 'income' ? '+' : '-'}Rs ${exp.amount.toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: 102,
        head: tableHeaders,
        body: tableRows,
        headStyles: { fillColor: [34, 197, 94], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        bodyStyles: { fontSize: 8.5 },
        margin: { top: 102 }
      });

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('TrueBalance — Know Your Money. Stay In Balance.', 14, 287);
        doc.text(`Page ${i} of ${pageCount}`, 196, 287, { align: 'right' });
      }

      doc.save(`TrueBalance_statement_${selectedMonth}.pdf`);
    };

    if (img.complete) {
      renderDoc();
    } else {
      img.onload = renderDoc;
      img.onerror = renderDoc;
    }
  };

  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safeSplits = Array.isArray(splits) ? splits : [];
  const safeSubscriptions = Array.isArray(subscriptions) ? subscriptions : [];
  const safeGoals = Array.isArray(goals) ? goals : [];
  const safeCreditCards = Array.isArray(creditCards) ? creditCards : [];

  const monthlyTransactions = safeExpenses.filter((exp) => exp.date && exp.date.startsWith(selectedMonth));
  const filteredExpenses = monthlyTransactions.filter((exp) => {
    const query = searchQuery.toLowerCase();
    return (
      exp.category.toLowerCase().includes(query) ||
      (exp.description && exp.description.toLowerCase().includes(query)) ||
      exp.amount.toString().includes(query)
    );
  });

  const totalIncome = monthlyTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalMonthlySpend = monthlyTransactions
    .filter((t) => t.type !== 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalMonthlySpend;

  const pieDataMap = {};
  monthlyTransactions
    .filter((t) => t.type !== 'income')
    .forEach((exp) => {
      pieDataMap[exp.category] = (pieDataMap[exp.category] || 0) + exp.amount;
    });

  const pieChartData = Object.keys(pieDataMap).map((cat) => ({
    name: cat,
    value: pieDataMap[cat]
  }));

  const userBudget = (user && typeof user.monthly_budget === 'number' && user.monthly_budget > 0) ? user.monthly_budget : 25000;
  const rawBudgetPct = (totalMonthlySpend / userBudget) * 100;
  const budgetPercentage = (isNaN(rawBudgetPct) || !isFinite(rawBudgetPct)) ? 0 : Math.min(Math.round(rawBudgetPct), 100);
  const isBudgetExceeded = totalMonthlySpend > userBudget;

  const rawRatio = totalIncome > 0 ? (netBalance / totalIncome) : (1 - (totalMonthlySpend / userBudget));
  const validRatio = (isNaN(rawRatio) || !isFinite(rawRatio)) ? 0.2 : rawRatio;
  const rawHealth = Math.round((validRatio > 0 ? validRatio : 0.2) * 100);
  const healthScore = (isNaN(rawHealth) || !isFinite(rawHealth)) ? 80 : Math.max(0, Math.min(100, rawHealth));
  const healthLabel = healthScore >= 75 ? 'Excellent' : healthScore >= 50 ? 'Good' : 'Needs Control';
  const healthColor = healthScore >= 75 ? 'text-emerald-500' : healthScore >= 50 ? 'text-amber-500' : 'text-red-500';

  const foodSpend = pieDataMap['Food & Dining'] || 0;
  const foodPercent = totalMonthlySpend > 0 ? Math.round((foodSpend / totalMonthlySpend) * 100) : 0;
  const predictedNextMonthSpend = Math.round((totalMonthlySpend > 0 ? totalMonthlySpend * 1.05 : 18500));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* HEADER CARD: Welcome Message + Month Filter Option */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Welcome, {user?.name || 'User'}
          </h1>
        </div>

        {/* ONLY MONTH FILTER OPTION */}
        <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/80 px-3.5 py-2 rounded-2xl">
          <Filter className="w-4 h-4 text-emerald-500" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-gray-900 dark:text-white text-xs font-semibold focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Advanced AI Receipt & Document Scanner Box */}
      {showScanner && (
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 border border-indigo-500/30 p-6 rounded-3xl shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base">AI Receipt, Document & Payment Scanner</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Scan payment screenshots, receipts, invoices, or paste SMS notifications</p>
              </div>
            </div>
            <button onClick={() => { setShowScanner(false); resetScannerState(); }} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-2 border-dashed border-indigo-500/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center bg-white/60 dark:bg-gray-900/60 hover:bg-indigo-500/5 transition-all relative cursor-pointer min-h-[150px]">
              <input
                type="file"
                accept="image/*,.pdf,.txt"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              {filePreview ? (
                <div className="flex flex-col items-center gap-2">
                  <img src={filePreview} alt="Receipt Preview" className="h-24 object-contain rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm" />
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold truncate max-w-[220px]">{uploadedFile?.name}</span>
                </div>
              ) : uploadedFile ? (
                <div className="flex flex-col items-center gap-1 text-indigo-500">
                  <FileText className="w-10 h-10" />
                  <span className="text-xs font-semibold">{uploadedFile.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <UploadCloud className="w-10 h-10 text-indigo-500 animate-bounce" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-200">Click or drag payment screenshot / invoice document</span>
                  <span className="text-[10px] text-gray-400">Supports PNG, JPG, WEBP, PDF, TXT</span>
                </div>
              )}
            </div>

            <div>
              <textarea
                rows="6"
                placeholder="Or paste SMS / Invoice text here (e.g. Salary of ₹45000 credited to account, or ₹650 debited for Swiggy)..."
                value={receiptText}
                onChange={(e) => setReceiptText(e.target.value)}
                className="w-full h-full p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-inner"
              />
            </div>
          </div>

          {scanStatusText && (
            <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 animate-pulse">
              <Sparkles className="w-4 h-4" />
              <span>{scanStatusText}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => handleOcrScan(false)}
              disabled={scanning}
              className="px-5 py-2.5 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span>Auto-Fill Add Transaction Form</span>
            </button>

            <button
              onClick={() => handleOcrScan(true)}
              disabled={scanning}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Scan & Direct Save to Transactions</span>
            </button>
          </div>
        </div>
      )}

      {/* TOP SECTION: ADD TRANSACTION FORM & MONTHLY EXPENSE CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Form: Add or Edit Expense / Income */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
            <div className="flex items-center gap-2">
              {editingId ? <Pencil className="w-5 h-5 text-amber-500" /> : <PlusCircle className="w-5 h-5 text-emerald-500" />}
              <h2 className="font-semibold text-lg text-gray-900 dark:text-white">{editingId ? 'Update Transaction' : 'Add Transaction'}</h2>
            </div>
            {editingId && (
              <button onClick={resetForm} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-gray-800/60 p-1 rounded-2xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTransactionType('expense')}
              className={`py-2 rounded-xl transition-all cursor-pointer ${transactionType === 'expense' ? 'bg-red-500 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setTransactionType('income')}
              className={`py-2 rounded-xl transition-all cursor-pointer ${transactionType === 'income' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
            >
              Income
            </button>
          </div>

          <form onSubmit={handleSaveExpense} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Amount (₹)</label>
              <div className="relative">
                <span className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Category</label>
              <div className="relative">
                <Tag className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Time</label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Description / Note</label>
              <input
                type="text"
                placeholder="Swiggy order, Cab fare, Salary..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded-xl font-semibold text-sm shadow-md transition-all cursor-pointer text-white ${
                transactionType === 'income' ? 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20' : editingId ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
              }`}
            >
              {editingId ? 'Update Transaction' : `Save ${transactionType === 'income' ? 'Income' : 'Expense'}`}
            </button>
          </form>
        </div>

        {/* Monthly Pie Chart Breakdown */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
            <div className="flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-indigo-500" />
              <h2 className="font-semibold text-lg text-gray-900 dark:text-white">Monthly Expense Chart</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400 uppercase tracking-wider block">Total Spend</span>
              <span className="text-xl font-bold text-red-500">₹{totalMonthlySpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="h-64 my-4 flex items-center justify-center">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                    {pieChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.9)', borderColor: '#374151', borderRadius: '0.75rem', color: '#fff' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (<p className="text-sm text-gray-400">No expenses recorded for this month.</p>)}
          </div>
        </div>
      </div>

      {/* TOP SECTION: MONTHLY EXPENSE BUDGET PROGRESS CARD */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Monthly Expense Budget</h3>
          </div>
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            ₹{totalMonthlySpend.toLocaleString('en-IN')} spent of <span className="text-gray-900 dark:text-white">₹{userBudget.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isBudgetExceeded ? 'bg-red-500' : budgetPercentage > 85 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min((totalMonthlySpend / userBudget) * 100, 100)}%` }}
          />
        </div>

        {isBudgetExceeded && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium mt-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Budget Alert! You have spent ₹{(totalMonthlySpend - userBudget).toLocaleString('en-IN')} over your monthly limit.</span>
          </div>
        )}
      </div>

      {/* BOTTOM SECTION: OVERVIEW METRICS, AI ADVISOR, GOALS, CARDS & TRANSACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Income</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              <AnimatedCounter value={totalIncome} isPositive={true} />
            </h3>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Expenses</p>
            <h3 className="text-2xl font-bold text-red-500 mt-1">
              <AnimatedCounter value={totalMonthlySpend} isPositive={false} />
            </h3>
          </div>
          <div className="p-3 rounded-2xl bg-red-500/10 text-red-500">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Net Monthly Balance</p>
            <h3 className={`text-2xl font-bold mt-1 ${netBalance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>
              <AnimatedCounter value={netBalance} isPositive={netBalance >= 0} />
            </h3>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Financial Health</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-2xl font-extrabold ${healthColor}`}>{healthScore}</span>
              <span className="text-xs text-gray-400 font-semibold">/100 ({healthLabel})</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* AI Smart Advisor & Predictive Forecast Cards */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-teal-500/10 border border-indigo-500/20 p-6 rounded-3xl shadow-sm flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/30 flex-shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">AI Smart Financial Advisor</h3>
              <span className="text-[10px] uppercase font-bold bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md">Realtime Analysis</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {foodPercent > 30
                ? `💡 You spent ${foodPercent}% of your monthly budget on Food & Dining (₹${foodSpend.toLocaleString('en-IN')}). Cooking at home could save you ~₹1,800 this month!`
                : isBudgetExceeded
                ? `⚠️ Your monthly spending has exceeded your ₹${userBudget.toLocaleString('en-IN')} limit! Consider pausing non-essential shopping purchases.`
                : `🎉 Great job! You are maintaining a healthy balance with ₹${netBalance > 0 ? netBalance.toLocaleString('en-IN') : 0} in net monthly savings.`}
            </p>
          </div>
        </div>

        <div className="md:col-span-5 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-indigo-500/10 border border-purple-500/20 p-6 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Predictive Next-Month Forecast 🔮</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              ~₹{predictedNextMonthSpend.toLocaleString('en-IN')}
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">Projected total spend based on your historical patterns</p>
          </div>
        </div>
      </div>

      {/* One-Tap Micro Expenses */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white text-xs">One-Tap Quick Expenses</h3>
          </div>
          <button
            onClick={() => setShowQuickModal(true)}
            className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Custom Quick Button</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Default Quick Buttons */}
          <button
            onClick={() => handleQuickAdd('Food & Dining', 'Chai / Coffee ☕', 20)}
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium text-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            + ₹20 Chai ☕
          </button>
          <button
            onClick={() => handleQuickAdd('Transportation', 'Cab / Auto Fare 🚕', 50)}
            className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium text-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            + ₹50 Cab 🚕
          </button>
          <button
            onClick={() => handleQuickAdd('Food & Dining', 'Lunch / Meal 🍱', 200)}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium text-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            + ₹200 Lunch 🍱
          </button>
          <button
            onClick={() => handleQuickAdd('Food & Dining', 'Snacks / Movie 🍿', 100)}
            className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-medium text-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            + ₹100 Snack 🍿
          </button>

          {/* User-Defined Custom Quick Buttons */}
          {customQuickButtons.map((btn) => (
            <div key={btn.id} className="relative group inline-flex items-center">
              <button
                onClick={() => handleQuickAdd(btn.category, btn.label, btn.amount)}
                className="px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-medium text-xs transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1"
              >
                <span>+ ₹{btn.amount} {btn.label}</span>
              </button>
              <button
                onClick={(e) => handleDeleteCustomQuickButton(btn.id, e)}
                className="ml-1 text-gray-400 hover:text-red-500 cursor-pointer text-xs"
                title="Remove Custom Quick Button"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Add Custom Button Trigger */}
          <button
            onClick={() => setShowQuickModal(true)}
            className="px-3 py-1.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-emerald-500 text-gray-500 dark:text-gray-400 font-medium text-xs transition-all cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-500" />
            <span>Add Custom</span>
          </button>
        </div>
      </div>



      {/* Transaction History Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-semibold text-lg text-gray-900 dark:text-white">Transactions History ({filteredExpenses.length})</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search category or note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button onClick={exportToCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition-colors cursor-pointer">
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button onClick={exportToPDF} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition-colors cursor-pointer">
              <FileDown className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">{searchQuery ? 'No matching records found.' : 'No transactions found for the selected month.'}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 uppercase text-xs">
                <tr>
                  <th className="py-3.5 px-4 rounded-l-xl">Date & Time</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">{exp.date}</div>
                      <div className="text-xs text-gray-400">{exp.time}</div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full font-medium text-xs ${exp.type === 'income' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>{exp.type === 'income' ? 'Income' : 'Expense'}</span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap"><span className="font-medium text-gray-900 dark:text-white">{exp.category}</span></td>
                    <td className="py-4 px-4 max-w-xs truncate text-gray-500 dark:text-gray-400">{exp.description || '—'}</td>
                    <td className={`py-4 px-4 whitespace-nowrap font-bold ${exp.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>{exp.type === 'income' ? '+' : '-'}₹{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-4 px-4 text-right whitespace-nowrap space-x-1">
                      <button onClick={() => startEdit(exp)} className="p-2 text-gray-400 hover:text-amber-500 rounded-lg cursor-pointer"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteExpense(exp.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custom Quick Tap Button Modal */}
      {showQuickModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Create Custom Quick Tap Button</h3>
              </div>
              <button onClick={() => setShowQuickModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomQuickButton} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Button Title / Emoji</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Auto 🛺, Coffee ☕, Metro 🚇"
                  value={quickLabel}
                  onChange={(e) => setQuickLabel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Quick Amount (₹)</label>
                <input
                  type="number"
                  step="1"
                  required
                  placeholder="e.g. 30"
                  value={quickAmountVal}
                  onChange={(e) => setQuickAmountVal(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Category</label>
                <select
                  value={quickCategoryVal}
                  onChange={(e) => setQuickCategoryVal(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                Add Custom Quick Button
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Goal Creation Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Create Savings Goal / Vault</h3>
              </div>
              <button onClick={() => setShowGoalModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Goal Title</label>
                <input type="text" required placeholder="e.g. Goa Trip, New Laptop..." value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Target Amount (₹)</label>
                <input type="number" required placeholder="15000" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Initial Saved Amount (₹) (Optional)</label>
                <input type="number" placeholder="2000" value={goalSaved} onChange={(e) => setGoalSaved(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Target Date (Optional)</label>
                <input type="date" value={goalDeadline} onChange={(e) => setGoalDeadline(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <button type="submit" className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm shadow-md shadow-purple-500/20 transition-all cursor-pointer">Create Goal</button>
            </form>
          </div>
        </div>
      )}

      {/* Credit Card Modal */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Track Credit Card Bill</h3>
              </div>
              <button onClick={() => setShowCardModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Card Name / Bank</label>
                <input type="text" required placeholder="e.g. HDFC Regalia, ICICI Amazon Pay..." value={cardName} onChange={(e) => setCardName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Statement Total Amount (₹)</label>
                <input type="number" required placeholder="14500" value={cardStatement} onChange={(e) => setCardStatement(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Due Date</label>
                  <input type="date" required value={cardDueDate} onChange={(e) => setCardDueDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Minimum Due (₹)</label>
                  <input type="number" placeholder="1200" value={cardMinDue} onChange={(e) => setCardMinDue(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer">Track Credit Card Bill</button>
            </form>
          </div>
        </div>
      )}

      {/* Split Bill Modal */}
      {showSplitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Split Bill with Friends</h3>
              </div>
              <button onClick={() => setShowSplitModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSplit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Bill Title</label>
                <input type="text" required placeholder="e.g. Dinner with Friends, Goa Trip Cab..." value={splitTitle} onChange={(e) => setSplitTitle(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Total Bill Amount (₹)</label>
                <input type="number" step="1" required placeholder="1200" value={splitTotal} onChange={(e) => setSplitTotal(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Number of People</label>
                <input type="number" min="2" required value={splitPeople} onChange={(e) => setSplitPeople(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <button type="submit" className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm shadow-md shadow-amber-500/20 transition-all cursor-pointer">Create Bill Split</button>
            </form>
          </div>
        </div>
      )}

      {/* First-Time Login / Dashboard Budget Setup Modal */}
      {showFirstTimeBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Welcome, {user?.name || 'User'}! 👋</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Set your target Monthly Spending Limit / Budget (₹) to start tracking effectively.</p>
            </div>

            <form onSubmit={handleSaveFirstTimeBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                  Monthly Spending Limit / Budget (₹)
                </label>
                <div className="relative">
                  <Wallet className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500" />
                  <input
                    type="number"
                    step="500"
                    required
                    value={userBudgetInput}
                    onChange={(e) => setUserBudgetInput(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
                <span className="text-[10px] text-gray-400 mt-1 block">You can change this anytime from your dashboard settings.</span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <span>Save Budget & Open Dashboard 🚀</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
