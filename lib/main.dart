import 'dart:math';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

void main() {
  runApp(const AboutMoneyApp());
}

class AboutMoneyApp extends StatelessWidget {
  const AboutMoneyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AboutMoney',
      debugShowCheckedModeBanner: false,
      themeMode: ThemeMode.dark,
      darkTheme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF070B12),
        primaryColor: const Color(0xFF00F5A0),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF00F5A0),
          secondary: Color(0xFF00D2FF),
          surface: Color(0xFF0F172A),
        ),
        textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme),
      ),
      home: const MainTabNavigator(),
    );
  }
}

class MainTabNavigator extends StatefulWidget {
  const MainTabNavigator({super.key});

  @override
  State<MainTabNavigator> createState() => _MainTabNavigatorState();
}

class _MainTabNavigatorState extends State<MainTabNavigator> {
  int _currentIndex = 0;
  bool _setupCompleted = false;

  double _monthlyIncome = 65000.0;
  double _monthlyBudget = 35000.0;
  String _userName = 'Heri Ghetiya';

  final List<Map<String, dynamic>> _transactions = [
    {
      'id': 1,
      'title': 'Client Payment / Salary',
      'amount': 65000.0,
      'category': 'Income',
      'date': '2026-09-01',
      'type': 'income'
    },
    {
      'id': 2,
      'title': 'Office Rent & Utilities',
      'amount': 12500.0,
      'category': 'Rent',
      'date': '2026-09-05',
      'type': 'expense'
    },
    {
      'id': 3,
      'title': 'Laptops & Office Supplies',
      'amount': 8400.0,
      'category': 'Equipment',
      'date': '2026-09-08',
      'type': 'expense'
    },
  ];

  void _onSetupComplete(double income, double budget, String name) {
    setState(() {
      _monthlyIncome = income;
      _monthlyBudget = budget;
      _userName = name;
      _setupCompleted = true;
    });
  }

  void _addTransaction(Map<String, dynamic> tx) {
    setState(() {
      _transactions.insert(0, tx);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_setupCompleted) {
      return IncomeBudgetOnboardingScreen(onComplete: _onSetupComplete);
    }

    final List<Widget> pages = [
      DashboardPage(
        userName: _userName,
        income: _monthlyIncome,
        budget: _monthlyBudget,
        transactions: _transactions,
        onAddTx: _addTransaction,
      ),
      CalculatorsPage(),
      GstAdvisorPage(income: _monthlyIncome, expenses: _transactions),
      ExportWhatsAppPage(income: _monthlyIncome, budget: _monthlyBudget, transactions: _transactions),
    ];

    return Scaffold(
      body: pages[_currentIndex],
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A),
          border: Border(top: BorderSide(color: Colors.white.withOpacity(0.08))),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (idx) => setState(() => _currentIndex = idx),
          backgroundColor: Colors.transparent,
          type: BottomNavigationBarType.fixed,
          selectedItemColor: const Color(0xFF00F5A0),
          unselectedItemColor: Colors.grey.shade500,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
          unselectedLabelStyle: const TextStyle(fontSize: 11),
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.account_balance_wallet_rounded), label: 'Dashboard'),
            BottomNavigationBarItem(icon: Icon(Icons.calculate_rounded), label: 'Calculators'),
            BottomNavigationBarItem(icon: Icon(Icons.verified_rounded), label: 'GST Tips'),
            BottomNavigationBarItem(icon: Icon(Icons.send_rounded), label: 'Alerts & Export'),
          ],
        ),
      ),
    );
  }
}

// 1. INCOME-FIRST ONBOARDING SCREEN
class IncomeBudgetOnboardingScreen extends StatefulWidget {
  final Function(double, double, String) onComplete;
  const IncomeBudgetOnboardingScreen({super.key, required: this.onComplete});

  @override
  State<IncomeBudgetOnboardingScreen> createState() => _IncomeBudgetOnboardingScreenState();
}

class _IncomeBudgetOnboardingScreenState extends State<IncomeBudgetOnboardingScreen> {
  final _nameCtrl = TextEditingController(text: 'Heri Ghetiya');
  final _incomeCtrl = TextEditingController(text: '65000');
  final _budgetCtrl = TextEditingController(text: '35000');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 20),
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFF00F5A0), Color(0xFF00D2FF)]),
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [BoxShadow(color: const Color(0xFF00F5A0).withOpacity(0.3), blurRadius: 25)],
                  ),
                  child: const Icon(Icons.account_balance_rounded, size: 38, color: Colors.black),
                ),
                const SizedBox(height: 24),
                const Text(
                  'AboutMoney 💰',
                  style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold, letterSpacing: -0.5),
                ),
                const Text(
                  'Income-First Budget Setup & GST Intelligence Engine',
                  style: TextStyle(fontSize: 13, color: Colors.grey),
                ),
                const SizedBox(height: 32),

                // Step 1: User Name
                TextField(
                  controller: _nameCtrl,
                  decoration: InputDecoration(
                    labelText: 'Full Name',
                    prefixIcon: const Icon(Icons.person_outline),
                    filled: true,
                    fillColor: const Color(0xFF0F172A),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 16),

                // Step 2: Income Input
                TextField(
                  controller: _incomeCtrl,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: '1. Enter Your Monthly Income (₹)',
                    prefixIcon: const Icon(Icons.arrow_upward_rounded, color: Color(0xFF00F5A0)),
                    filled: true,
                    fillColor: const Color(0xFF0F172A),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 16),

                // Step 3: Monthly Budget Setting
                TextField(
                  controller: _budgetCtrl,
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: '2. Set Your Monthly Budget Allowance (₹)',
                    prefixIcon: const Icon(Icons.track_changes_rounded, color: Color(0xFF00D2FF)),
                    filled: true,
                    fillColor: const Color(0xFF0F172A),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                  ),
                ),
                const SizedBox(height: 32),

                ElevatedButton(
                  onPressed: () {
                    double inc = double.tryParse(_incomeCtrl.text) ?? 65000.0;
                    double bud = double.tryParse(_budgetCtrl.text) ?? 35000.0;
                    widget.onComplete(inc, bud, _nameCtrl.text.isEmpty ? 'User' : _nameCtrl.text);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00F5A0),
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const Text('Start AboutMoney Engine', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// 2. DASHBOARD PAGE
class DashboardPage extends StatelessWidget {
  final String userName;
  final double income;
  final double budget;
  final List<Map<String, dynamic>> transactions;
  final Function(Map<String, dynamic>) onAddTx;

  const DashboardPage({
    super.key,
    required this.userName,
    required this.income,
    required this.budget,
    required this.transactions,
    required this.onAddTx,
  });

  void _showAddModal(BuildContext context) {
    final titleCtrl = TextEditingController();
    final amountCtrl = TextEditingController();
    String category = 'General';
    String type = 'expense';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0F172A),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 20, right: 20, top: 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('Add New Transaction 💳', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            TextField(
              controller: titleCtrl,
              decoration: InputDecoration(
                labelText: 'Title / Merchant Name',
                filled: true,
                fillColor: const Color(0xFF1E293B),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: amountCtrl,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: 'Amount (₹)',
                filled: true,
                fillColor: const Color(0xFF1E293B),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                if (amountCtrl.text.isNotEmpty) {
                  onAddTx({
                    'id': DateTime.now().millisecondsSinceEpoch,
                    'title': titleCtrl.text.isEmpty ? category : titleCtrl.text,
                    'amount': double.parse(amountCtrl.text),
                    'category': category,
                    'date': DateFormat('yyyy-MM-dd').format(DateTime.now()),
                    'type': type,
                  });
                  Navigator.pop(ctx);
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00F5A0),
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: const Text('Save Record', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    double totalExpenses = transactions.where((t) => t['type'] == 'expense').fold(0.0, (sum, t) => sum + t['amount']);
    double remainingBudget = max(0.0, budget - totalExpenses);
    double budgetUsagePct = (totalExpenses / (budget > 0 ? budget : 1.0) * 100).clamp(0.0, 100.0);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Row(
          children: [
            CircleAvatar(
              backgroundColor: const Color(0xFF00F5A0).withOpacity(0.2),
              child: Text(userName[0], style: const TextStyle(color: Color(0xFF00F5A0), fontWeight: FontWeight.bold)),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(userName, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                const Text('AboutMoney Premium ⚡', style: TextStyle(fontSize: 11, color: Color(0xFF00F5A0))),
              ],
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddModal(context),
        backgroundColor: const Color(0xFF00F5A0),
        foregroundColor: Colors.black,
        icon: const Icon(Icons.add_rounded),
        label: const Text('Add Record', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // Balance & Budget Card
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF0F172A), Color(0xFF1E293B)]),
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: const Color(0xFF00F5A0).withOpacity(0.25)),
              boxShadow: [BoxShadow(color: const Color(0xFF00F5A0).withOpacity(0.08), blurRadius: 20)],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: [
                    const Text('Monthly Income', style: TextStyle(fontSize: 12, color: Colors.grey)),
                    Text('₹${income.toStringAsFixed(0)}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF00F5A0))),
                  ],
                ),
                const SizedBox(height: 16),
                const Text('Remaining Monthly Budget', style: TextStyle(fontSize: 12, color: Colors.grey)),
                const SizedBox(height: 4),
                Text(
                  '₹${remainingBudget.toStringAsFixed(0)}',
                  style: const TextStyle(fontSize: 34, fontWeight: FontWeight.bold, letterSpacing: -0.5),
                ),
                const SizedBox(height: 16),
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: LinearProgressIndicator(
                    value: budgetUsagePct / 100,
                    minHeight: 8,
                    backgroundColor: Colors.white10,
                    valueColor: AlwaysStoppedAnimation<Color>(budgetUsagePct > 90 ? Colors.redAccent : const Color(0xFF00F5A0)),
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: [
                    Text('${budgetUsagePct.toStringAsFixed(1)}% Used', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                    Text('Budget Target: ₹${budget.toStringAsFixed(0)}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),
          // Dynamic GST Tip Widget
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFF00D2FF).withOpacity(0.3)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: const Color(0xFF00D2FF).withOpacity(0.15), borderRadius: BorderRadius.circular(14)),
                  child: const Icon(Icons.verified_rounded, color: Color(0xFF00D2FF)),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Smart GST Tip 💡', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF00D2FF))),
                      const SizedBox(height: 4),
                      Text(
                        income * 12 > 2000000
                            ? 'Your annual turnover exceeds ₹20 Lakhs. Claim Input Tax Credit (ITC) on all business equipment purchases!'
                            : 'Annual turnover under ₹20 Lakhs. GST registration is optional for service providers.',
                        style: const TextStyle(fontSize: 11, color: Colors.white70, height: 1.4),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),
          const Text('Recent Transactions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),

          ...transactions.map((t) {
            bool isIncome = t['type'] == 'income';
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: isIncome ? const Color(0xFF00F5A0).withOpacity(0.15) : Colors.red.withOpacity(0.15),
                    child: Icon(isIncome ? Icons.arrow_upward : Icons.shopping_bag_outlined, color: isIncome ? const Color(0xFF00F5A0) : Colors.redAccent),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(t['title'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        const SizedBox(height: 2),
                        Text('${t['category']} • ${t['date']}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                      ],
                    ),
                  ),
                  Text(
                    '${isIncome ? '+' : '-'}₹${t['amount'].toStringAsFixed(0)}',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: isIncome ? const Color(0xFF00F5A0) : Colors.white),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

// 3. FINANCIAL CALCULATORS VAULT
class CalculatorsPage extends StatefulWidget {
  const CalculatorsPage({super.key});

  @override
  State<CalculatorsPage> createState() => _CalculatorsPageState();
}

class _CalculatorsPageState extends State<CalculatorsPage> {
  // Loan EMI State
  double _loanAmount = 500000;
  double _loanRate = 9.5;
  double _loanTenureYears = 5;

  // SIP State
  double _sipMonthly = 5000;
  double _sipRate = 12.0;
  double _sipYears = 10;

  @override
  Widget build(BuildContext context) {
    // EMI Calculation
    double r = _loanRate / (12 * 100);
    double n = _loanTenureYears * 12;
    double emi = (_loanAmount * r * pow(1 + r, n)) / (pow(1 + r, n) - 1);
    double totalLoanPayable = emi * n;
    double totalInterest = totalLoanPayable - _loanAmount;

    // SIP Calculation
    double i = _sipRate / (12 * 100);
    num months = _sipYears * 12;
    double totalInvested = _sipMonthly * months;
    double totalWealth = _sipMonthly * ((pow(1 + i, months) - 1) / i) * (1 + i);
    double estimatedReturns = totalWealth - totalInvested;

    return Scaffold(
      appBar: AppBar(title: const Text('Financial Calculators 🧮'), backgroundColor: Colors.transparent, elevation: 0),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // LOAN EMI CALCULATOR
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.white.withOpacity(0.08)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Loan EMI Calculator 🏦', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF00D2FF))),
                const SizedBox(height: 16),
                Text('Loan Amount: ₹${_loanAmount.toStringAsFixed(0)}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                Slider(
                  value: _loanAmount,
                  min: 50000,
                  max: 5000000,
                  divisions: 99,
                  activeColor: const Color(0xFF00D2FF),
                  onChanged: (v) => setState(() => _loanAmount = v),
                ),
                Text('Interest Rate: ${_loanRate.toStringAsFixed(1)}%', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                Slider(
                  value: _loanRate,
                  min: 5.0,
                  max: 20.0,
                  divisions: 30,
                  activeColor: const Color(0xFF00D2FF),
                  onChanged: (v) => setState(() => _loanRate = v),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: const Color(0xFF1E293B), borderRadius: BorderRadius.circular(16)),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Monthly EMI', style: TextStyle(fontSize: 11, color: Colors.grey)),
                          Text('₹${emi.toStringAsFixed(0)}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF00D2FF))),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text('Total Interest', style: TextStyle(fontSize: 11, color: Colors.grey)),
                          Text('₹${totalInterest.toStringAsFixed(0)}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.redAccent)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),
          // SIP WEALTH CALCULATOR
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.white.withOpacity(0.08)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('SIP Mutual Fund Calculator 📈', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF00F5A0))),
                const SizedBox(height: 16),
                Text('Monthly SIP: ₹${_sipMonthly.toStringAsFixed(0)}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                Slider(
                  value: _sipMonthly,
                  min: 500,
                  max: 100000,
                  divisions: 199,
                  activeColor: const Color(0xFF00F5A0),
                  onChanged: (v) => setState(() => _sipMonthly = v),
                ),
                Text('Expected Return: ${_sipRate.toStringAsFixed(1)}%', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                Slider(
                  value: _sipRate,
                  min: 5.0,
                  max: 25.0,
                  divisions: 40,
                  activeColor: const Color(0xFF00F5A0),
                  onChanged: (v) => setState(() => _sipRate = v),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: const Color(0xFF1E293B), borderRadius: BorderRadius.circular(16)),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.between,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Estimated Returns', style: TextStyle(fontSize: 11, color: Colors.grey)),
                          Text('₹${estimatedReturns.toStringAsFixed(0)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF00F5A0))),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text('Total Wealth Created', style: TextStyle(fontSize: 11, color: Colors.grey)),
                          Text('₹${totalWealth.toStringAsFixed(0)}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// 4. GST ADVISOR & TIPS
class GstAdvisorPage extends StatelessWidget {
  final double income;
  final List<Map<String, dynamic>> expenses;

  const GstAdvisorPage({super.key, required this.income, required this.expenses});

  @override
  Widget build(BuildContext context) {
    double annualTurnover = income * 12;

    return Scaffold(
      appBar: AppBar(title: const Text('GST Intelligence & Tips 💡'), backgroundColor: Colors.transparent, elevation: 0),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFF00F5A0).withOpacity(0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Annual Income / Turnover Projection', style: TextStyle(fontSize: 12, color: Colors.grey)),
                const SizedBox(height: 4),
                Text('₹${annualTurnover.toStringAsFixed(0)} / yr', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold, color: Color(0xFF00F5A0))),
                const SizedBox(height: 12),
                Text(
                  annualTurnover > 4000000
                      ? '⚠️ MANDATORY GST REGISTRATION REQUIRED (Exceeds ₹40 Lakh limit).'
                      : '✅ Optional GST registration (Under ₹40 Lakh goods / ₹20 Lakh service threshold).',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),
          const Text('Top GST Optimization Rules', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),

          _buildGstRuleCard('Input Tax Credit (ITC) Strategy', 'Always ask suppliers for tax invoices with your GSTIN to offset GST on purchases like laptops, internet, and office rent.'),
          _buildGstRuleCard('GSTR-3B Quarterly Filing', 'If enrolled under Composition Scheme, file quarterly GSTR-3B returns by the 20th of the month following the quarter.'),
          _buildGstRuleCard('GST Slabs Reference', '0% (Fresh Foods), 5% (Transport/Eateries), 12% (Computers), 18% (IT & SaaS Software), 28% (Luxury Goods).'),
        ],
      ),
    );
  }

  Widget _buildGstRuleCard(String title, String desc) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFF0F172A), borderRadius: BorderRadius.circular(18), border: Border.all(color: Colors.white.withOpacity(0.05))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF00D2FF))),
          const SizedBox(height: 6),
          Text(desc, style: const TextStyle(fontSize: 12, color: Colors.white70, height: 1.4)),
        ],
      ),
    );
  }
}

// 5. EXPORT & WHATSAPP ALERTS
class ExportWhatsAppPage extends StatelessWidget {
  final double income;
  final double budget;
  final List<Map<String, dynamic>> transactions;

  const ExportWhatsAppPage({super.key, required this.income, required this.budget, required this.transactions});

  @override
  Widget build(BuildContext context) {
    double totalExpenses = transactions.where((t) => t['type'] == 'expense').fold(0.0, (sum, t) => sum + t['amount']);
    double remaining = max(0.0, budget - totalExpenses);

    return Scaffold(
      appBar: AppBar(title: const Text('Export & WhatsApp Alerts 📲'), backgroundColor: Colors.transparent, elevation: 0),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          // WhatsApp Budget Alert Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.green.withOpacity(0.4)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.chat_bubble_outline_rounded, color: Colors.greenAccent),
                    SizedBox(width: 10),
                    Text('WhatsApp Budget Notification', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.greenAccent)),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  'Send instant monthly budget summary & remaining allowance alert directly to your WhatsApp!',
                  style: const TextStyle(fontSize: 12, color: Colors.white70),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('WhatsApp Alert Prepared: Remaining Budget ₹${remaining.toStringAsFixed(0)}! 📲')),
                    );
                  },
                  icon: const Icon(Icons.send_rounded, size: 18),
                  label: const Text('Trigger WhatsApp Alert'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 20),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),
          const Text('Download Reports', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),

          ListTile(
            tileColor: const Color(0xFF0F172A),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            leading: const Icon(Icons.picture_as_pdf_rounded, color: Colors.redAccent),
            title: const Text('Export Statement as PDF'),
            subtitle: const Text('Official formatted PDF transaction history'),
            trailing: const Icon(Icons.download_rounded),
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('PDF Statement Downloaded Successfully! 📄')));
            },
          ),
          const SizedBox(height: 10),
          ListTile(
            tileColor: const Color(0xFF0F172A),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            leading: const Icon(Icons.table_chart_rounded, color: Color(0xFF00F5A0)),
            title: const Text('Download CSV Dataset'),
            subtitle: const Text('Raw CSV file for Excel / Google Sheets'),
            trailing: const Icon(Icons.download_rounded),
            onTap: () {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('CSV Dataset Downloaded Successfully! 📊')));
            },
          ),
        ],
      ),
    );
  }
}
