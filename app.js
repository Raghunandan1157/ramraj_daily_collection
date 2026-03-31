// ==================== SUPABASE CLIENT ====================
const SUPABASE_URL = 'https://zovnmmdfthpbubrorsgh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvdm5tbWRmdGhwYnVicm9yc2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NzE3ODgsImV4cCI6MjA3NzE0Nzc4OH0.92BH2sjUOgkw6iSRj1_4gt0p3eThg3QT4VK-Q4EdmBE';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==================== DATA STORE ====================
let appData = [];
let consolidatedData = [];

async function fetchData() {
    const [dailyRes, consolidatedRes] = await Promise.all([
        db.from('daily_sales').select('*').order('date', { ascending: true }),
        db.from('monthly_consolidated').select('*').order('month', { ascending: true })
    ]);

    if (dailyRes.error) {
        console.error('Error fetching daily:', dailyRes.error);
    } else {
        appData = dailyRes.data.map(row => {
            const sales = Number(row.sales) || 0;
            const bills = Number(row.no_of_bills) || 0;
            return {
                id: row.id,
                date: row.date,
                sale: sales,
                bills: bills,
                salesReturns: Number(row.sales_returns) || 0,
                netSales: Number(row.net_sales) || 0,
                closingStock: Number(row.closing_stock) || 0,
                bankBalance: Number(row.bank_balance) || 0,
                ordersPlaced: Number(row.orders_placed_amount) || 0,
                salaryPaid: Number(row.salary_paid) || 0,
                electricityPaid: Number(row.electricity_paid) || 0,
                adminExpenses: Number(row.admin_expenses) || 0,
                totalExpenses: Number(row.total_expenses) || 0,
                internalTxn: Number(row.internal_txn) || 0
            };
        });
    }

    if (consolidatedRes.error) {
        console.error('Error fetching consolidated:', consolidatedRes.error);
    } else {
        consolidatedData = consolidatedRes.data.map(row => ({
            month: row.month,
            days: Number(row.no_of_days) || 0,
            sales: Number(row.sales) || 0,
            salesReturn: Number(row.sales_return) || 0,
            netSales: Number(row.net_sales) || 0,
            avgSales: Number(row.avg_sales_monthly) || 0
        }));
    }

    return appData;
}

function getData() {
    return appData;
}

async function saveToSupabase(entry) {
    const row = {
        date: entry.date,
        sales: entry.sale,
        no_of_bills: entry.bills,
        sales_returns: entry.salesReturns,
        net_sales: entry.netSales,
        closing_stock: entry.closingStock,
        bank_balance: entry.bankBalance,
        orders_placed_amount: entry.ordersPlaced,
        salary_paid: entry.salaryPaid,
        electricity_paid: entry.electricityPaid,
        admin_expenses: entry.adminExpenses,
        total_expenses: entry.totalExpenses,
        internal_txn: entry.internalTxn
    };

    const { error } = await db
        .from('daily_sales')
        .upsert(row, { onConflict: 'date' })
        .select();

    if (error) {
        console.error('Error saving:', error);
        return false;
    }
    return true;
}

async function deleteFromSupabase(date) {
    const { error } = await db
        .from('daily_sales')
        .delete()
        .eq('date', date);

    if (error) {
        console.error('Error deleting:', error);
        return false;
    }
    return true;
}

// ==================== LOADING ====================
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('visible');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('visible');
}

async function refreshData() {
    showLoading();
    await fetchData();
    renderDashboard();
    hideLoading();
}

// ==================== NAVIGATION ====================
const navLinks = document.querySelectorAll('.nav-links li');
const pages = document.querySelectorAll('.page');
const pageTitle = document.getElementById('page-title');

const pageTitles = {
    dashboard: 'Dashboard',
    entry: 'Data Entry',
    sales: 'Sales Analysis',
    consolidated: 'Monthly Overview',
    records: 'All Records'
};

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        const page = link.dataset.page;
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        pages.forEach(p => p.classList.remove('active'));
        document.getElementById('page-' + page).classList.add('active');
        pageTitle.textContent = pageTitles[page];

        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('open');
        }

        if (page === 'dashboard') renderDashboard();
        if (page === 'entry') { /* no table to render */ }
        if (page === 'sales') renderSalesCharts();
        if (page === 'consolidated') renderConsolidatedPage();
        if (page === 'records') renderRecordsTable();
    });
});

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
    sidebar.classList.toggle('collapsed');
    document.querySelector('.main-content').classList.toggle('expanded');
}

// ==================== DATE SETUP ====================
document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});
document.getElementById('f-date').valueAsDate = new Date();

// ==================== FORM AUTO-CALC ====================
const fSales = document.getElementById('f-sales');
const fBills = document.getElementById('f-bills');
const fReturns = document.getElementById('f-returns');
const fNetSales = document.getElementById('f-netsales');
const fSalary = document.getElementById('f-salary');
const fElectricity = document.getElementById('f-electricity');
const fAdmin = document.getElementById('f-admin');
const fTotalExp = document.getElementById('f-totalexp');

function autoCalc() {
    const sales = parseFloat(fSales.value) || 0;
    const returns = parseFloat(fReturns.value) || 0;
    const salary = parseFloat(fSalary.value) || 0;
    const electricity = parseFloat(fElectricity.value) || 0;
    const admin = parseFloat(fAdmin.value) || 0;

    fNetSales.value = (sales - returns).toFixed(2);
    fTotalExp.value = (salary + electricity + admin).toFixed(2);
}

[fSales, fReturns, fSalary, fElectricity, fAdmin].forEach(el => {
    el.addEventListener('input', autoCalc);
});

// ==================== SAVE / EDIT ENTRY ====================
let editingDate = null;

async function saveEntry(e) {
    e.preventDefault();

    const sales = parseFloat(fSales.value) || 0;
    const returns = parseFloat(fReturns.value) || 0;
    const salary = parseFloat(fSalary.value) || 0;
    const electricity = parseFloat(fElectricity.value) || 0;
    const admin = parseFloat(fAdmin.value) || 0;

    const intxnAmt = parseFloat(document.getElementById('f-intxn').value) || 0;
    const intxnSigned = intxnAmt === 0 ? 0 : (selectedDirection === 'OUT' ? -Math.abs(intxnAmt) : Math.abs(intxnAmt));

    const entry = {
        date: document.getElementById('f-date').value,
        sale: sales,
        bills: parseInt(fBills.value) || 0,
        salesReturns: returns,
        netSales: sales - returns,
        closingStock: parseFloat(document.getElementById('f-stock').value) || 0,
        bankBalance: parseFloat(document.getElementById('f-bank').value) || 0,
        ordersPlaced: parseFloat(document.getElementById('f-orders').value) || 0,
        salaryPaid: salary,
        electricityPaid: electricity,
        adminExpenses: admin,
        totalExpenses: salary + electricity + admin,
        internalTxn: intxnSigned
    };

    if (!editingDate) {
        if (appData.some(d => d.date === entry.date)) {
            showMessage('Entry for this date already exists. Use edit from Records page.', 'error');
            return false;
        }
    }

    showLoading();
    const success = await saveToSupabase(entry);
    if (success) {
        showMessage('Entry saved to Supabase!', 'success');
        editingDate = null;
        document.getElementById('submitBtn').textContent = 'Save Entry';
        resetForm();
        await fetchData();
    } else {
        showMessage('Error saving entry. Check console.', 'error');
    }
    hideLoading();

    return false;
}

function resetForm() {
    document.getElementById('entryForm').reset();
    document.getElementById('f-date').valueAsDate = new Date();
    document.getElementById('f-returns').value = '0';
    document.getElementById('f-orders').value = '0';
    document.getElementById('f-salary').value = '0';
    document.getElementById('f-electricity').value = '0';
    document.getElementById('f-admin').value = '0';
    document.getElementById('f-intxn').value = '0';
    selectedDirection = null;
    document.getElementById('btn-dir-in').classList.remove('active');
    document.getElementById('btn-dir-out').classList.remove('active');
    editingDate = null;
    document.getElementById('submitBtn').textContent = 'Save Entry';
}

function showMessage(text, type) {
    const msg = document.getElementById('entry-message');
    msg.textContent = text;
    msg.className = 'message ' + type;
    setTimeout(() => msg.className = 'message hidden', 3000);
}

function editEntry(date) {
    const entry = appData.find(d => d.date === date);
    if (!entry) return;

    editingDate = date;
    document.getElementById('f-date').value = entry.date;
    fSales.value = entry.sale;
    fBills.value = entry.bills;
    fReturns.value = entry.salesReturns;
    fNetSales.value = entry.netSales;
    document.getElementById('f-stock').value = entry.closingStock;
    document.getElementById('f-bank').value = entry.bankBalance;
    document.getElementById('f-orders').value = entry.ordersPlaced;
    fSalary.value = entry.salaryPaid;
    fElectricity.value = entry.electricityPaid;
    fAdmin.value = entry.adminExpenses;
    fTotalExp.value = entry.totalExpenses;
    document.getElementById('f-intxn').value = Math.abs(entry.internalTxn);
    if (entry.internalTxn > 0) selectDirection('IN');
    else if (entry.internalTxn < 0) selectDirection('OUT');
    else { selectedDirection = null; document.getElementById('btn-dir-in').classList.remove('active'); document.getElementById('btn-dir-out').classList.remove('active'); }
    document.getElementById('submitBtn').textContent = 'Update Entry';

    navLinks.forEach(l => l.classList.remove('active'));
    document.querySelector('[data-page="entry"]').classList.add('active');
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById('page-entry').classList.add('active');
    pageTitle.textContent = 'Data Entry';
}

async function deleteEntry(date) {
    if (!confirm('Delete entry for ' + date + '?')) return;
    showLoading();
    const success = await deleteFromSupabase(date);
    if (success) {
        await fetchData();
        renderRecordsTable();
    }
    hideLoading();
}

// ==================== DIRECTION TOGGLE (Int. Transaction in daily form) ====================
let selectedDirection = null;

function selectDirection(dir) {
    selectedDirection = dir;
    document.getElementById('btn-dir-in').classList.toggle('active', dir === 'IN');
    document.getElementById('btn-dir-out').classList.toggle('active', dir === 'OUT');
}

// ==================== FORMATTING ====================
function fmt(n) {
    if (n === undefined || n === null || isNaN(n)) return '--';
    return new Intl.NumberFormat('en-IN').format(Math.round(n));
}

function fmtCurrency(n) {
    if (n === undefined || n === null || isNaN(n)) return '--';
    return '\u20B9' + new Intl.NumberFormat('en-IN').format(Math.round(n));
}

function fmtLakhs(n) {
    if (n === undefined || n === null || isNaN(n)) return '--';
    return '\u20B9' + (n / 100000).toFixed(2) + 'L';
}

function formatMonth(dateStr) {
    const dt = new Date(dateStr);
    return dt.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

// ==================== DASHBOARD ====================
let dashSalesChart, dashBankChart;

function renderDashboard() {
    const data = getData();

    // Date range bar
    if (data.length > 0) {
        const first = new Date(data[0].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        const last = new Date(data[data.length - 1].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        document.getElementById('dateRangeBar').textContent = 'Showing ' + data.length + ' records: ' + first + ' \u2013 ' + last;
    } else {
        document.getElementById('dateRangeBar').textContent = 'No data loaded';
    }

    const latest = data.length > 0 ? data[data.length - 1] : null;

    if (!latest) {
        ['kpi-sale','kpi-netsales','kpi-bills','kpi-returns','kpi-stock','kpi-bank','kpi-orders','kpi-expenses'].forEach(id => {
            document.getElementById(id).textContent = '--';
        });
        return;
    }

    const prev = data.length > 1 ? data[data.length - 2] : null;

    document.getElementById('kpi-sale').textContent = fmtCurrency(latest.sale);
    document.getElementById('kpi-netsales').textContent = fmtCurrency(latest.netSales);
    document.getElementById('kpi-bills').textContent = fmt(latest.bills);
    document.getElementById('kpi-returns').textContent = fmtCurrency(latest.salesReturns);
    document.getElementById('kpi-stock').textContent = fmtLakhs(latest.closingStock);
    document.getElementById('kpi-bank').textContent = fmtCurrency(latest.bankBalance);
    document.getElementById('kpi-orders').textContent = fmtCurrency(latest.ordersPlaced);
    document.getElementById('kpi-expenses').textContent = fmtCurrency(latest.totalExpenses);

    if (prev) {
        setSub('kpi-sale-sub', latest.sale, prev.sale);
        setSub('kpi-netsales-sub', latest.netSales, prev.netSales);
        setSub('kpi-bills-sub', latest.bills, prev.bills);
        setSub('kpi-returns-sub', latest.salesReturns, prev.salesReturns);
        setSub('kpi-stock-sub', latest.closingStock, prev.closingStock);
        setSub('kpi-bank-sub', latest.bankBalance, prev.bankBalance);
    }

    // Orders — show month total
    const currentMonth = latest.date.substring(0, 7);
    const monthOrders = data.filter(d => d.date.startsWith(currentMonth)).reduce((s, d) => s + d.ordersPlaced, 0);
    document.getElementById('kpi-orders-sub').textContent = 'Month total: ' + fmtCurrency(monthOrders);

    // Expenses — show month total
    const monthExpenses = data.filter(d => d.date.startsWith(currentMonth)).reduce((s, d) => s + d.totalExpenses, 0);
    document.getElementById('kpi-expenses-sub').textContent = 'Month total: ' + fmtCurrency(monthExpenses);

    // Sales trend chart
    const labels = data.map(d => {
        const dt = new Date(d.date);
        return dt.getDate() + '/' + (dt.getMonth() + 1);
    });

    if (dashSalesChart) dashSalesChart.destroy();
    dashSalesChart = new Chart(document.getElementById('dashSalesChart'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Daily Sale',
                data: data.map(d => d.sale),
                backgroundColor: data.map(d => d.sale > 100000 ? 'rgba(46,204,113,0.7)' : 'rgba(233,69,96,0.7)'),
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: v => '\u20B9' + (v / 1000).toFixed(0) + 'K' }
                }
            }
        }
    });

    // Bank balance trend
    if (dashBankChart) dashBankChart.destroy();
    dashBankChart = new Chart(document.getElementById('dashBankChart'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Bank Balance',
                data: data.map(d => d.bankBalance),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52,152,219,0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 3,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    ticks: { callback: v => '\u20B9' + (v / 1000).toFixed(0) + 'K' }
                }
            }
        }
    });
}

function setSub(id, current, previous) {
    const el = document.getElementById(id);
    if (!el) return;
    const diff = current - previous;
    const pct = previous ? ((diff / previous) * 100).toFixed(1) : 0;
    const arrow = diff >= 0 ? '\u25B2' : '\u25BC';
    el.textContent = arrow + ' ' + Math.abs(pct) + '% vs prev day';
    el.className = 'kpi-sub ' + (diff >= 0 ? 'up' : 'down');
}

// ==================== SALES ANALYSIS CHARTS ====================
let grossNetChart, returnsChart, stockChart, bankChart, expensesChart;

function renderSalesCharts() {
    const data = getData();
    if (data.length === 0) return;

    const labels = data.map(d => {
        const dt = new Date(d.date);
        return dt.getDate() + '/' + (dt.getMonth() + 1);
    });

    // Gross vs Net Sales
    if (grossNetChart) grossNetChart.destroy();
    grossNetChart = new Chart(document.getElementById('grossNetChart'), {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Gross Sales',
                    data: data.map(d => d.sale),
                    backgroundColor: 'rgba(52,152,219,0.7)',
                    borderRadius: 4
                },
                {
                    label: 'Net Sales',
                    data: data.map(d => d.netSales),
                    backgroundColor: 'rgba(46,204,113,0.7)',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
            scales: { y: { ticks: { callback: v => '\u20B9' + (v / 1000).toFixed(0) + 'K' } } }
        }
    });

    // Sales Returns
    if (returnsChart) returnsChart.destroy();
    returnsChart = new Chart(document.getElementById('returnsChart'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Returns',
                data: data.map(d => d.salesReturns),
                backgroundColor: data.map(d => d.salesReturns > 5000 ? 'rgba(231,76,60,0.8)' : 'rgba(243,156,18,0.6)'),
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: v => '\u20B9' + (v / 1000).toFixed(1) + 'K' } } }
        }
    });

    // Closing Stock
    if (stockChart) stockChart.destroy();
    stockChart = new Chart(document.getElementById('stockChart'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Closing Stock',
                data: data.map(d => d.closingStock),
                borderColor: '#9b59b6',
                backgroundColor: 'rgba(155,89,182,0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: v => '\u20B9' + (v / 100000).toFixed(1) + 'L' } } }
        }
    });

    // Bank Balance
    if (bankChart) bankChart.destroy();
    bankChart = new Chart(document.getElementById('bankChart'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Bank Balance',
                data: data.map(d => d.bankBalance),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52,152,219,0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: v => '\u20B9' + (v / 1000).toFixed(0) + 'K' } } }
        }
    });

    // Expenses stacked bar
    if (expensesChart) expensesChart.destroy();
    const daysWithExpenses = data.filter(d => d.totalExpenses > 0);
    const expLabels = daysWithExpenses.map(d => {
        const dt = new Date(d.date);
        return dt.getDate() + '/' + (dt.getMonth() + 1);
    });
    expensesChart = new Chart(document.getElementById('expensesChart'), {
        type: 'bar',
        data: {
            labels: expLabels,
            datasets: [
                {
                    label: 'Salary',
                    data: daysWithExpenses.map(d => d.salaryPaid),
                    backgroundColor: 'rgba(231,76,60,0.7)',
                    borderRadius: 2
                },
                {
                    label: 'Electricity',
                    data: daysWithExpenses.map(d => d.electricityPaid),
                    backgroundColor: 'rgba(243,156,18,0.7)',
                    borderRadius: 2
                },
                {
                    label: 'Admin',
                    data: daysWithExpenses.map(d => d.adminExpenses),
                    backgroundColor: 'rgba(155,89,182,0.7)',
                    borderRadius: 2
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
            scales: {
                x: { stacked: true },
                y: { stacked: true, ticks: { callback: v => '\u20B9' + (v / 1000).toFixed(0) + 'K' } }
            }
        }
    });
}

// ==================== CONSOLIDATED / MONTHLY OVERVIEW ====================
let monthlyBarChart, monthlyAvgChart;

function renderConsolidatedPage() {
    renderConsolidatedCharts();
    renderMonthlySummary();
    renderConsolidatedTable();
}

function renderConsolidatedCharts() {
    if (consolidatedData.length === 0) return;

    const labels = consolidatedData.map(d => formatMonth(d.month));

    if (monthlyBarChart) monthlyBarChart.destroy();
    monthlyBarChart = new Chart(document.getElementById('monthlyBarChart'), {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Gross Sales',
                    data: consolidatedData.map(d => d.sales),
                    backgroundColor: 'rgba(52,152,219,0.7)',
                    borderRadius: 4
                },
                {
                    label: 'Net Sales',
                    data: consolidatedData.map(d => d.netSales),
                    backgroundColor: 'rgba(46,204,113,0.7)',
                    borderRadius: 4
                },
                {
                    label: 'Returns',
                    data: consolidatedData.map(d => d.salesReturn),
                    backgroundColor: 'rgba(231,76,60,0.7)',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
            scales: { y: { ticks: { callback: v => '\u20B9' + (v / 100000).toFixed(1) + 'L' } } }
        }
    });

    if (monthlyAvgChart) monthlyAvgChart.destroy();
    monthlyAvgChart = new Chart(document.getElementById('monthlyAvgChart'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Avg Daily Sale',
                data: consolidatedData.map(d => d.avgSales),
                borderColor: '#e94560',
                backgroundColor: 'rgba(233,69,96,0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 4,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: v => '\u20B9' + (v / 1000).toFixed(0) + 'K' } } }
        }
    });
}

function renderMonthlySummary() {
    const data = getData();
    const months = {};
    data.forEach(d => {
        const key = d.date.substring(0, 7);
        if (!months[key]) months[key] = [];
        months[key].push(d);
    });

    const tbody = document.querySelector('#monthlySummaryTable tbody');
    tbody.innerHTML = '';

    Object.keys(months).sort().reverse().forEach(key => {
        const entries = months[key];
        const totalSale = entries.reduce((s, e) => s + e.sale, 0);
        const avgSale = totalSale / entries.length;
        const totalBills = entries.reduce((s, e) => s + e.bills, 0);
        const totalReturns = entries.reduce((s, e) => s + e.salesReturns, 0);
        const totalNetSales = entries.reduce((s, e) => s + e.netSales, 0);
        const totalExpenses = entries.reduce((s, e) => s + e.totalExpenses, 0);
        const avgBank = entries.reduce((s, e) => s + e.bankBalance, 0) / entries.length;

        const [y, m] = key.split('-');
        const monthName = new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${monthName}</td>
            <td>${fmtCurrency(totalSale)}</td>
            <td>${fmtCurrency(avgSale)}</td>
            <td>${fmt(totalBills)}</td>
            <td class="${totalReturns > 50000 ? 'text-danger' : ''}">${fmtCurrency(totalReturns)}</td>
            <td>${fmtCurrency(totalNetSales)}</td>
            <td class="${totalExpenses > 200000 ? 'text-danger' : ''}">${fmtCurrency(totalExpenses)}</td>
            <td>${fmtCurrency(avgBank)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderConsolidatedTable() {
    const tbody = document.querySelector('#consolidatedTable tbody');
    tbody.innerHTML = '';

    consolidatedData.forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatMonth(d.month)}</td>
            <td>${fmt(d.days)}</td>
            <td>${fmtCurrency(d.sales)}</td>
            <td class="${d.salesReturn > 100000 ? 'text-danger' : ''}">${fmtCurrency(d.salesReturn)}</td>
            <td>${fmtCurrency(d.netSales)}</td>
            <td>${fmtCurrency(d.avgSales)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ==================== RECORDS TABLE ====================
function renderRecordsTable() {
    const data = getData();
    const tbody = document.querySelector('#recordsTable tbody');
    tbody.innerHTML = '';

    const monthFilter = document.getElementById('filterMonth');
    const currentVal = monthFilter.value;
    const months = [...new Set(data.map(d => d.date.substring(0, 7)))].sort().reverse();
    monthFilter.innerHTML = '<option value="">All Months</option>';
    months.forEach(m => {
        const [y, mo] = m.split('-');
        const name = new Date(y, mo - 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
        monthFilter.innerHTML += `<option value="${m}" ${m === currentVal ? 'selected' : ''}>${name}</option>`;
    });

    let filtered = data.slice().reverse();

    const search = document.getElementById('searchRecords').value.toLowerCase();
    const monthVal = monthFilter.value;
    if (search) filtered = filtered.filter(d => d.date.includes(search));
    if (monthVal) filtered = filtered.filter(d => d.date.startsWith(monthVal));

    filtered.forEach(d => {
        let txHtml = '--';
        if (d.internalTxn > 0) txHtml = `<span class="tx-in">+${fmtCurrency(d.internalTxn)}</span>`;
        else if (d.internalTxn < 0) txHtml = `<span class="tx-out">-${fmtCurrency(Math.abs(d.internalTxn))}</span>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${d.date}</td>
            <td>${fmtCurrency(d.sale)}</td>
            <td>${d.bills}</td>
            <td class="${d.salesReturns > 5000 ? 'text-danger' : ''}">${fmtCurrency(d.salesReturns)}</td>
            <td>${fmtCurrency(d.netSales)}</td>
            <td>${fmtLakhs(d.closingStock)}</td>
            <td>${fmtCurrency(d.bankBalance)}</td>
            <td>${txHtml}</td>
            <td>${fmtCurrency(d.ordersPlaced)}</td>
            <td>${fmtCurrency(d.salaryPaid)}</td>
            <td>${fmtCurrency(d.electricityPaid)}</td>
            <td>${fmtCurrency(d.adminExpenses)}</td>
            <td class="${d.totalExpenses > 100000 ? 'text-danger' : ''}">${fmtCurrency(d.totalExpenses)}</td>
            <td>
                <button class="btn-edit" onclick="editEntry('${d.date}')">Edit</button>
                <button class="btn-delete" onclick="deleteEntry('${d.date}')">Del</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filterRecords() {
    renderRecordsTable();
}

// ==================== EXPORT ====================
function exportData() {
    const data = getData();
    if (data.length === 0) {
        alert('No data to export.');
        return;
    }

    const headers = ['Date', 'Sales', 'No of Bills', 'Sales Returns', 'Net Sales', 'Closing Stock', 'Bank Balance', 'Orders Placed', 'Salary Paid', 'Electricity Paid', 'Admin Expenses', 'Total Expenses'];
    const rows = data.map(d => [
        d.date, d.sale, d.bills, d.salesReturns, d.netSales,
        d.closingStock, d.bankBalance, d.ordersPlaced,
        d.salaryPaid, d.electricityPaid, d.adminExpenses, d.totalExpenses
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(r => csv += r.join(',') + '\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ramraj_daily_collection_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// ==================== INIT ====================
async function init() {
    showLoading();
    await fetchData();
    renderDashboard();
    hideLoading();
    console.log('Supabase connected. Loaded ' + appData.length + ' daily + ' + consolidatedData.length + ' monthly + ' + internalTransactions.length + ' internal transaction records.');
}

init();
