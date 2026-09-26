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
        appData = dailyRes.data.map(row => ({
            id: row.id,
            date: row.date,
            sale: Number(row.sales) || 0,
            bills: Number(row.no_of_bills) || 0,
            salesReturns: Number(row.sales_returns) || 0,
            netSales: Number(row.net_sales) || 0,
            closingStock: Number(row.closing_stock) || 0,
            bankBalance: Number(row.bank_balance) || 0,
            ordersPlaced: Number(row.orders_placed_amount) || 0,
            salaryPaid: Number(row.salary_paid) || 0,
            electricityPaid: Number(row.electricity_paid) || 0,
            adminExpenses: Number(row.admin_expenses) || 0,
            totalExpenses: Number(row.total_expenses) || 0,
            internalTxn: Number(row.internal_txn) || 0,
            qtySold: Number(row.quantity) || 0,
            margin: Number(row.margin) || 0,
            cashSales: Number(row.cash_sales) || 0,
            bankSales: Number(row.bank_sales) || 0,
            upiSales: Number(row.upi_sales) || 0,
            loyalty: Number(row.loyalty) || 0
        }));
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

    const ok = !dailyRes.error;
    const syncEl = document.getElementById('syncStatus');
    syncEl.textContent = ok
        ? 'Synced with Supabase · ' + new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
        : 'Could not reach Supabase';

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
        internal_txn: entry.internalTxn,
        quantity: entry.qtySold,
        margin: entry.margin,
        cash_sales: entry.cashSales,
        bank_sales: entry.bankSales,
        upi_sales: entry.upiSales,
        loyalty: entry.loyalty
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

// ==================== HELPERS ====================
const $ = id => document.getElementById(id);
const val = id => parseFloat($(id).value) || 0;
const sum = (rows, key) => rows.reduce((s, d) => s + (d[key] || 0), 0);
const pct = x => (x * 100).toFixed(1) + '%';
const clampPct = x => Math.max(0, Math.min(100, x * 100));

const ICON_CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>';
const ICON_ALERT = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg>';
const ICON_EDIT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
const ICON_TRASH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>';

// ==================== DATES ====================
// Dates from Supabase are 'YYYY-MM-DD'; parse them as local dates, not UTC.
function parseISODate(s) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function toISODate(dt) {
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
}

function todayISO() {
    return toISODate(new Date());
}

function fmtDate(s, opts) {
    return parseISODate(s).toLocaleDateString('en-IN', opts);
}

function shortLabel(s) {
    const dt = parseISODate(s);
    return dt.getDate() + '/' + (dt.getMonth() + 1);
}

function isDayBefore(a, b) {
    const next = parseISODate(a);
    next.setDate(next.getDate() + 1);
    return toISODate(next) === b;
}

// ==================== FORMATTING ====================
function fmt(n) {
    if (n === undefined || n === null || isNaN(n)) return '--';
    return new Intl.NumberFormat('en-IN').format(Math.round(n));
}

function fmtCurrency(n) {
    if (n === undefined || n === null || isNaN(n)) return '--';
    return (n < 0 ? '−' : '') + '₹' + new Intl.NumberFormat('en-IN').format(Math.round(Math.abs(n)));
}

function fmtLakhs(n) {
    if (n === undefined || n === null || isNaN(n)) return '--';
    return '₹' + (n / 100000).toFixed(2) + ' L';
}

function formatMonth(dateStr) {
    return fmtDate(dateStr, { month: 'short', year: 'numeric' });
}

function axisMoney(v) {
    const a = Math.abs(v), sign = v < 0 ? '−' : '';
    if (a >= 100000) return sign + '₹' + +(a / 100000).toFixed(1) + 'L';
    if (a >= 1000) return sign + '₹' + +(a / 1000).toFixed(1) + 'K';
    return sign + '₹' + a;
}

// ==================== CHART DEFAULTS ====================
const C = {
    green: '#1E4D2B',
    greenMid: '#7FA67A',
    greenBar: '#B7CEB3',
    greenFill: 'rgba(30,77,43,0.08)',
    yellow: '#F2C94C',
    gold: '#B08A12',
    red: '#B42318',
    redLight: '#E8A29A',
    ink: '#16241A',
    inkFill: 'rgba(22,36,26,0.06)',
    muted: '#5B6B5F',
    grid: '#EFECE1'
};

Chart.defaults.font.family = "'IBM Plex Sans', system-ui, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = C.muted;
Chart.defaults.borderColor = C.grid;
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.plugins.legend.labels.boxWidth = 10;
Chart.defaults.plugins.legend.labels.boxHeight = 10;
Chart.defaults.plugins.tooltip.backgroundColor = C.ink;
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.cornerRadius = 8;

const moneyTooltip = { callbacks: { label: c => c.dataset.label + ': ' + fmtCurrency(c.parsed.y) } };
const moneyScale = { ticks: { callback: axisMoney, maxTicksLimit: 6 } };
const noGridX = { grid: { display: false } };

// ==================== LOADING ====================
function showLoading() {
    $('loadingOverlay').classList.add('visible');
}

function hideLoading() {
    $('loadingOverlay').classList.remove('visible');
}

async function refreshData() {
    showLoading();
    await fetchData();
    selectedIndex = -1;
    renderCurrentPage();
    hideLoading();
}

// ==================== NAVIGATION ====================
const navButtons = document.querySelectorAll('.nav-link[data-page]');
const pages = document.querySelectorAll('.page');
const pageTitle = $('page-title');
let currentPage = 'dashboard';

const pageTitles = {
    dashboard: 'Dashboard',
    entry: 'Daily entry',
    sales: 'Sales analysis',
    consolidated: 'Monthly overview',
    records: 'All records'
};

navButtons.forEach(btn => btn.addEventListener('click', () => showPage(btn.dataset.page)));

function showPage(page) {
    currentPage = page;
    navButtons.forEach(b => {
        const on = b.dataset.page === page;
        b.classList.toggle('active', on);
        if (on) b.setAttribute('aria-current', 'page');
        else b.removeAttribute('aria-current');
    });
    pages.forEach(p => p.classList.toggle('active', p.id === 'page-' + page));
    pageTitle.textContent = pageTitles[page];
    document.body.dataset.page = page;
    closeSidebar();
    window.scrollTo(0, 0);
    renderCurrentPage();
}

function renderCurrentPage() {
    if (currentPage === 'dashboard') renderDashboard();
    if (currentPage === 'entry') updateEntrySummary();
    if (currentPage === 'sales') renderSalesCharts();
    if (currentPage === 'consolidated') renderConsolidatedPage();
    if (currentPage === 'records') renderRecordsTable();
}

function toggleSidebar() {
    const open = !$('sidebar').classList.contains('open');
    $('sidebar').classList.toggle('open', open);
    $('sidebarBackdrop').classList.toggle('visible', open);
    $('menuToggle').setAttribute('aria-expanded', String(open));
}

function closeSidebar() {
    $('sidebar').classList.remove('open');
    $('sidebarBackdrop').classList.remove('visible');
    $('menuToggle').setAttribute('aria-expanded', 'false');
}

// ==================== DATE SETUP ====================
$('current-date').textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});
$('f-date').value = todayISO();

// ==================== DATA ENTRY ====================
let editingDate = null;
let selectedDirection = null;
let messageTimer = null;

// Form field id -> entry property, used to fill the form when editing
const FIELD_MAP = {
    'f-sales': 'sale',
    'f-bills': 'bills',
    'f-returns': 'salesReturns',
    'f-qty': 'qtySold',
    'f-margin': 'margin',
    'f-cash': 'cashSales',
    'f-banksales': 'bankSales',
    'f-upi': 'upiSales',
    'f-loyalty': 'loyalty',
    'f-stock': 'closingStock',
    'f-bank': 'bankBalance',
    'f-orders': 'ordersPlaced',
    'f-salary': 'salaryPaid',
    'f-electricity': 'electricityPaid',
    'f-admin': 'adminExpenses'
};

$('entryForm').addEventListener('input', updateEntrySummary);

// Select the whole value on focus so a default "0" is replaced by typing
document.querySelectorAll('#entryForm input[type="number"]').forEach(el => {
    el.addEventListener('focus', () => el.select());
});

function paymentMismatch(sales, pay) {
    const diff = pay - sales;
    if (!pay || Math.abs(diff) <= 1) return '';
    return diff < 0 ? 'short by ' + fmtCurrency(-diff) : 'over by ' + fmtCurrency(diff);
}

function updateEntrySummary() {
    const sales = val('f-sales');
    const returns = val('f-returns');
    const net = sales - returns;
    const bills = val('f-bills');
    const margin = val('f-margin');
    const cash = val('f-cash'), bank = val('f-banksales'), upi = val('f-upi');
    const pay = cash + bank + upi;
    const expenses = val('f-salary') + val('f-electricity') + val('f-admin');
    const txn = Math.abs(val('f-intxn'));

    $('f-netsales').value = sales ? net.toFixed(2) : '';

    // Payment reconciliation
    $('payAccounted').innerHTML = 'Accounted <strong>' + fmtCurrency(pay) + '</strong> of ' + fmtCurrency(sales);
    const base = Math.max(sales, pay) || 1;
    $('entryBarCash').style.width = clampPct(cash / base) + '%';
    $('entryBarBank').style.width = clampPct(bank / base) + '%';
    $('entryBarUpi').style.width = clampPct(upi / base) + '%';

    const mismatch = paymentMismatch(sales, pay);
    const status = $('payStatus');
    if (!sales && !pay) {
        status.className = 'check none';
        status.textContent = '';
    } else if (!pay) {
        status.className = 'check none';
        status.textContent = 'Not entered';
    } else if (!mismatch) {
        status.className = 'check ok';
        status.innerHTML = ICON_CHECK + 'Balanced';
    } else {
        status.className = 'check bad';
        status.innerHTML = ICON_ALERT + mismatch.charAt(0).toUpperCase() + mismatch.slice(1);
    }

    // Summary panel
    $('sum-net').textContent = sales ? fmtCurrency(net) : '--';
    $('sum-avgbill').textContent = sales && bills ? fmtCurrency(sales / bills) : '--';
    $('sum-margin').textContent = margin && net ? fmtCurrency(margin) + ' · ' + pct(margin / net) : '--';
    $('sum-returns').textContent = returns ? fmtCurrency(returns) + (sales ? ' · ' + pct(returns / sales) : '') : 'None';
    $('sum-exp').textContent = fmtCurrency(expenses);

    let txnText = 'None';
    if (txn && selectedDirection === 'IN') txnText = '+' + fmtCurrency(txn) + ' in';
    else if (txn && selectedDirection === 'OUT') txnText = '−' + fmtCurrency(txn) + ' out';
    else if (txn) txnText = fmtCurrency(txn) + ' · pick In or Out';
    $('sum-txn').textContent = txnText;

    const alertEl = $('sumAlert');
    if (mismatch) {
        alertEl.textContent = "Payments don't add up to gross sales yet — " + mismatch + '.';
        alertEl.classList.remove('hidden');
    } else {
        alertEl.classList.add('hidden');
    }
}

async function saveEntry(e) {
    e.preventDefault();

    const sales = val('f-sales');
    const returns = val('f-returns');
    const salary = val('f-salary');
    const electricity = val('f-electricity');
    const admin = val('f-admin');

    const intxnAmt = Math.abs(val('f-intxn'));
    if (intxnAmt > 0 && !selectedDirection) {
        showMessage('Choose In or Out for the internal transfer.', 'error');
        return false;
    }
    const intxnSigned = intxnAmt === 0 ? 0 : (selectedDirection === 'OUT' ? -intxnAmt : intxnAmt);

    const entry = {
        date: $('f-date').value,
        sale: sales,
        bills: parseInt($('f-bills').value) || 0,
        salesReturns: returns,
        netSales: sales - returns,
        closingStock: val('f-stock'),
        bankBalance: val('f-bank'),
        ordersPlaced: val('f-orders'),
        salaryPaid: salary,
        electricityPaid: electricity,
        adminExpenses: admin,
        totalExpenses: salary + electricity + admin,
        internalTxn: intxnSigned,
        qtySold: parseInt($('f-qty').value) || 0,
        margin: val('f-margin'),
        cashSales: val('f-cash'),
        bankSales: val('f-banksales'),
        upiSales: val('f-upi'),
        loyalty: val('f-loyalty')
    };

    const paymentTotal = entry.cashSales + entry.bankSales + entry.upiSales;
    const mismatch = paymentMismatch(entry.sale, paymentTotal);
    if (mismatch) {
        showMessage('Cash + Card/bank + UPI (' + fmtCurrency(paymentTotal) + ') must equal gross sales (' + fmtCurrency(entry.sale) + ') — ' + mismatch + '.', 'error');
        return false;
    }

    const dayLabel = fmtDate(entry.date, { weekday: 'short', day: 'numeric', month: 'short' });
    if (!editingDate && appData.some(d => d.date === entry.date)) {
        showMessage('An entry for ' + dayLabel + ' already exists. Edit it from All records.', 'error');
        return false;
    }

    const verb = editingDate ? 'Updated' : 'Saved';
    showLoading();
    $('submitBtn').disabled = true;
    const success = await saveToSupabase(entry);
    if (success) {
        resetForm();
        showMessage(verb + ' the entry for ' + dayLabel + '.', 'success');
        await fetchData();
        selectedIndex = -1;
    } else {
        showMessage('Could not save the entry. Check your connection and try again.', 'error');
    }
    $('submitBtn').disabled = false;
    hideLoading();

    return false;
}

function resetForm() {
    $('entryForm').reset();
    $('f-date').value = todayISO();
    selectDirection(null);
    editingDate = null;
    $('submitBtn').textContent = 'Save entry';
    $('editBadge').classList.add('hidden');
    updateEntrySummary();
}

function showMessage(text, type) {
    const msg = $('entry-message');
    msg.textContent = text;
    msg.className = 'message ' + type;
    clearTimeout(messageTimer);
    messageTimer = setTimeout(() => { msg.className = 'message hidden'; }, 5000);
}

function editEntry(date) {
    const entry = appData.find(d => d.date === date);
    if (!entry) return;

    editingDate = date;
    $('f-date').value = entry.date;
    Object.keys(FIELD_MAP).forEach(id => { $(id).value = entry[FIELD_MAP[id]]; });
    $('f-intxn').value = Math.abs(entry.internalTxn);
    selectDirection(entry.internalTxn > 0 ? 'IN' : entry.internalTxn < 0 ? 'OUT' : null);
    $('submitBtn').textContent = 'Update entry';
    $('editBadge').textContent = 'Editing ' + fmtDate(date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    $('editBadge').classList.remove('hidden');

    showPage('entry');
}

async function deleteEntry(date) {
    const label = fmtDate(date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    if (!confirm('Delete the entry for ' + label + '? This cannot be undone.')) return;
    showLoading();
    const success = await deleteFromSupabase(date);
    if (success) {
        await fetchData();
        renderCurrentPage();
    }
    hideLoading();
}

// ==================== DIRECTION TOGGLE (internal transfer) ====================
function selectDirection(dir) {
    selectedDirection = dir;
    $('btn-dir-in').classList.toggle('active', dir === 'IN');
    $('btn-dir-out').classList.toggle('active', dir === 'OUT');
    $('btn-dir-in').setAttribute('aria-pressed', String(dir === 'IN'));
    $('btn-dir-out').setAttribute('aria-pressed', String(dir === 'OUT'));
    updateEntrySummary();
}

// ==================== DASHBOARD ====================
let selectedIndex = -1; // -1 = latest entry
let dashSalesChart;

const DASH_TEXT_IDS = ['kpi-sale', 'kpi-bills', 'kpi-avgbill', 'kpi-qty', 'kpi-mtd', 'kpi-netsales', 'kpi-margin',
    'kpi-cash', 'kpi-banksales', 'kpi-upi', 'kpi-loyalty', 'kpi-bank', 'kpi-stock', 'kpi-orders', 'kpi-orders-mtd',
    'kpi-expenses-mtd', 'exp-salary', 'exp-electricity', 'exp-admin'];

function currentIndex() {
    const n = getData().length;
    return selectedIndex < 0 || selectedIndex >= n ? n - 1 : selectedIndex;
}

function shiftDay(step) {
    const i = currentIndex() + step;
    if (i < 0 || i >= getData().length) return;
    selectedIndex = i;
    renderDashboard();
}

function setDelta(el, current, previous, label) {
    if (previous === null || previous === undefined || previous === 0) {
        el.textContent = '';
        el.className = 'delta';
        return;
    }
    const diff = current - previous;
    el.textContent = (diff >= 0 ? '▲ ' : '▼ ') + Math.abs(diff / previous * 100).toFixed(1) + '% ' + label;
    el.className = 'delta ' + (diff >= 0 ? 'up' : 'down');
}

function setAmountChange(el, current, previous, label, colored) {
    if (previous === null || previous === undefined) {
        el.textContent = '';
        el.className = 'kpi-sub';
        return;
    }
    const diff = current - previous;
    if (Math.round(diff) === 0) {
        el.textContent = 'No change ' + label;
        el.className = 'kpi-sub';
        return;
    }
    el.textContent = (diff > 0 ? '▲ ' : '▼ ') + fmtCurrency(Math.abs(diff)) + ' ' + label;
    el.className = 'kpi-sub' + (colored ? (diff > 0 ? ' up' : ' down') : '');
}

function renderDashboard() {
    const data = getData();
    const idx = currentIndex();
    const today = todayISO();
    const banner = $('todayBanner');

    $('dayPrev').disabled = idx <= 0;
    $('dayNext').disabled = idx < 0 || idx >= data.length - 1;

    if (!data.length) {
        $('dayLabel').textContent = 'No entries';
        $('todayBannerText').textContent = "No entries yet. Add the first day's report to fill the dashboard.";
        banner.classList.remove('hidden');
        DASH_TEXT_IDS.forEach(id => { $(id).textContent = '--'; });
        if (dashSalesChart) { dashSalesChart.destroy(); dashSalesChart = null; }
        return;
    }

    const cur = data[idx];
    const prev = idx > 0 ? data[idx - 1] : null;
    const curShort = fmtDate(cur.date, { weekday: 'short', day: 'numeric', month: 'short' });
    const vsLabel = prev
        ? 'vs ' + (isDayBefore(prev.date, cur.date) ? fmtDate(prev.date, { weekday: 'short' }) : fmtDate(prev.date, { day: 'numeric', month: 'short' }))
        : '';

    $('dayLabel').textContent = fmtDate(cur.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    // Banner when today's report hasn't been entered yet
    if (!data.some(d => d.date === today)) {
        const todayLabel = fmtDate(today, { weekday: 'short', day: 'numeric', month: 'short' });
        const showingLatest = idx === data.length - 1 && cur.date < today;
        $('todayBannerText').textContent = 'No entry yet for today (' + todayLabel + ').' +
            (showingLatest ? ' Showing the last recorded day, ' + curShort + '.' : '');
        banner.classList.remove('hidden');
    } else {
        banner.classList.add('hidden');
    }

    // Sales
    $('kpi-sale-label').textContent = 'Gross sales · ' + curShort;
    $('kpi-sale').textContent = fmtCurrency(cur.sale);
    setDelta($('kpi-sale-sub'), cur.sale, prev && prev.sale, vsLabel);
    $('kpi-bills').textContent = fmt(cur.bills);
    $('kpi-avgbill').textContent = cur.bills ? fmtCurrency(cur.sale / cur.bills) : '--';
    $('kpi-qty').textContent = fmt(cur.qtySold);

    // Month to date (up to and including the selected day)
    const monthKey = cur.date.substring(0, 7);
    const mtd = data.filter(d => d.date.startsWith(monthKey) && d.date <= cur.date);
    const mtdSales = sum(mtd, 'sale');
    const monthName = fmtDate(cur.date, { month: 'long' });
    $('kpi-mtd-label').textContent = monthName + ' to date';
    $('kpi-mtd').textContent = fmtCurrency(mtdSales);
    $('kpi-mtd-sub').textContent = mtd.length + (mtd.length === 1 ? ' day' : ' days') + ' · ' + fmtCurrency(mtdSales / mtd.length) + ' / day';

    // Net sales & returns
    $('kpi-netsales').textContent = fmtCurrency(cur.netSales);
    const returnsEl = $('kpi-returns');
    if (cur.salesReturns) {
        returnsEl.textContent = fmtCurrency(cur.salesReturns) + ' returned' + (cur.sale ? ' · ' + pct(cur.salesReturns / cur.sale) + ' of sales' : '');
        returnsEl.className = 'kpi-sub bad';
    } else {
        returnsEl.textContent = 'No returns';
        returnsEl.className = 'kpi-sub';
    }

    // Margin
    const marginShare = cur.netSales ? cur.margin / cur.netSales : 0;
    $('kpi-margin').textContent = fmtCurrency(cur.margin);
    $('kpi-margin-sub').textContent = !cur.margin ? 'Not recorded' : cur.netSales ? pct(marginShare) + ' of net sales' : '';
    $('kpi-margin-meter').style.width = clampPct(marginShare) + '%';

    // Payment split
    const pay = cur.cashSales + cur.bankSales + cur.upiSales;
    [
        ['cashSales', 'kpi-cash', 'payBarCash'],
        ['bankSales', 'kpi-banksales', 'payBarBank'],
        ['upiSales', 'kpi-upi', 'payBarUpi']
    ].forEach(([key, id, bar]) => {
        $(id).textContent = fmtCurrency(cur[key]);
        $(id + '-sub').textContent = pay ? pct(cur[key] / pay) : '--';
        $(bar).style.width = (pay ? cur[key] / pay * 100 : 0) + '%';
    });
    const payCheck = $('payCheck');
    const mismatch = paymentMismatch(cur.sale, pay);
    if (!pay) {
        payCheck.className = 'check none';
        payCheck.textContent = 'Not recorded';
    } else if (!mismatch) {
        payCheck.className = 'check ok';
        payCheck.innerHTML = ICON_CHECK + 'Matches gross sales';
    } else {
        payCheck.className = 'check bad';
        payCheck.innerHTML = ICON_ALERT + mismatch.charAt(0).toUpperCase() + mismatch.slice(1);
    }
    $('kpi-loyalty').textContent = fmtCurrency(cur.loyalty);

    // Closing bank & internal transfer
    $('kpi-bank').textContent = fmtCurrency(cur.bankBalance);
    setAmountChange($('kpi-bank-sub'), cur.bankBalance, prev && prev.bankBalance, vsLabel, true);
    const txnEl = $('kpi-txn');
    if (cur.internalTxn) {
        const incoming = cur.internalTxn > 0;
        txnEl.textContent = (incoming ? 'Transfer in +' : 'Transfer out −') + fmtCurrency(Math.abs(cur.internalTxn));
        txnEl.className = 'chip-tag ' + (incoming ? 'in' : 'out');
    } else {
        txnEl.className = 'chip-tag hidden';
    }

    // Closing stock & orders
    $('kpi-stock').textContent = fmtLakhs(cur.closingStock);
    setAmountChange($('kpi-stock-sub'), cur.closingStock, prev && prev.closingStock, vsLabel, false);
    $('kpi-orders').textContent = fmtCurrency(cur.ordersPlaced);
    $('kpi-orders-mtd').textContent = fmtCurrency(sum(mtd, 'ordersPlaced'));

    // Expenses month to date
    const expParts = { salary: sum(mtd, 'salaryPaid'), electricity: sum(mtd, 'electricityPaid'), admin: sum(mtd, 'adminExpenses') };
    const expTotal = expParts.salary + expParts.electricity + expParts.admin;
    $('exp-title').textContent = 'Expenses · ' + monthName + ' to date';
    $('kpi-expenses-mtd').textContent = fmtCurrency(expTotal);
    Object.keys(expParts).forEach(k => {
        $('exp-' + k).textContent = fmtCurrency(expParts[k]);
        $('exp-' + k + '-bar').style.width = (expTotal ? expParts[k] / expTotal * 100 : 0) + '%';
    });
    $('kpi-expenses-today').textContent = cur.totalExpenses
        ? 'Paid out on ' + curShort + ': ' + fmtCurrency(cur.totalExpenses)
        : 'Nothing paid out on ' + curShort;

    renderDashChart(data, idx, monthKey);
}

function renderDashChart(data, idx, monthKey) {
    const month = data.map((d, i) => ({ d, i })).filter(x => x.d.date.startsWith(monthKey));
    const avg = sum(month.map(x => x.d), 'sale') / month.length;

    $('dashChartTitle').textContent = 'Daily sales · ' + fmtDate(data[idx].date, { month: 'long', year: 'numeric' });
    $('dashAvgLegend').textContent = 'Month average ' + fmtCurrency(avg);

    if (dashSalesChart) dashSalesChart.destroy();
    dashSalesChart = new Chart($('dashSalesChart'), {
        type: 'bar',
        data: {
            labels: month.map(x => parseISODate(x.d.date).getDate()),
            datasets: [
                {
                    type: 'line',
                    label: 'Month average',
                    data: month.map(() => avg),
                    borderColor: C.gold,
                    borderDash: [6, 4],
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    order: 0
                },
                {
                    type: 'bar',
                    label: 'Sales',
                    data: month.map(x => x.d.sale),
                    backgroundColor: month.map(x => (x.i === idx ? C.green : C.greenBar)),
                    hoverBackgroundColor: month.map(x => (x.i === idx ? C.green : C.greenMid)),
                    borderRadius: 4,
                    order: 1
                }
            ]
        },
        options: {
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: items => fmtDate(month[items[0].dataIndex].d.date, { weekday: 'short', day: 'numeric', month: 'short' }),
                        label: moneyTooltip.callbacks.label
                    }
                }
            },
            scales: { x: noGridX, y: { beginAtZero: true, ticks: { callback: axisMoney, maxTicksLimit: 6 } } },
            onClick: (evt, els) => {
                if (!els.length) return;
                selectedIndex = month[els[0].index].i;
                renderDashboard();
            },
            onHover: (evt, els) => {
                evt.native.target.style.cursor = els.length ? 'pointer' : 'default';
            }
        }
    });
}

// ==================== SALES ANALYSIS CHARTS ====================
let grossNetChart, returnsChart, paymentChart, marginChart, qtyBillsChart, loyaltyChart, stockChart, bankChart, expensesChart;

function lineDataset(label, data, color, fill) {
    return { label, data, borderColor: color, backgroundColor: fill, fill: true, tension: 0.3, pointRadius: 2, pointHoverRadius: 5, borderWidth: 2 };
}

function renderSalesCharts() {
    const data = getData();
    if (data.length === 0) return;

    const labels = data.map(d => shortLabel(d.date));

    // Gross vs Net Sales
    if (grossNetChart) grossNetChart.destroy();
    grossNetChart = new Chart($('grossNetChart'), {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'Gross sales', data: data.map(d => d.sale), backgroundColor: C.greenBar, borderRadius: 4 },
                { label: 'Net sales', data: data.map(d => d.netSales), backgroundColor: C.green, borderRadius: 4 }
            ]
        },
        options: {
            plugins: { legend: { position: 'bottom' }, tooltip: moneyTooltip },
            scales: { x: noGridX, y: moneyScale }
        }
    });

    // Sales Returns
    if (returnsChart) returnsChart.destroy();
    returnsChart = new Chart($('returnsChart'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Returns',
                data: data.map(d => d.salesReturns),
                backgroundColor: data.map(d => (d.salesReturns > 5000 ? C.red : C.redLight)),
                borderRadius: 4
            }]
        },
        options: {
            plugins: { legend: { display: false }, tooltip: moneyTooltip },
            scales: { x: noGridX, y: moneyScale }
        }
    });

    // Payment mode split (stacked)
    if (paymentChart) paymentChart.destroy();
    paymentChart = new Chart($('paymentChart'), {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'Cash', data: data.map(d => d.cashSales), backgroundColor: C.green },
                { label: 'Card / bank', data: data.map(d => d.bankSales), backgroundColor: C.greenMid },
                { label: 'UPI', data: data.map(d => d.upiSales), backgroundColor: C.yellow }
            ]
        },
        options: {
            plugins: { legend: { position: 'bottom' }, tooltip: moneyTooltip },
            scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, ticks: { callback: axisMoney } } }
        }
    });

    // Margin
    if (marginChart) marginChart.destroy();
    marginChart = new Chart($('marginChart'), {
        type: 'line',
        data: { labels, datasets: [lineDataset('Margin', data.map(d => d.margin), C.green, C.greenFill)] },
        options: {
            plugins: { legend: { display: false }, tooltip: moneyTooltip },
            scales: { x: noGridX, y: moneyScale }
        }
    });

    // Qty sold (bars) vs bills (line)
    if (qtyBillsChart) qtyBillsChart.destroy();
    qtyBillsChart = new Chart($('qtyBillsChart'), {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { type: 'line', label: 'No. of bills', data: data.map(d => d.bills), borderColor: C.green, backgroundColor: C.green, tension: 0.3, pointRadius: 2, borderWidth: 2, order: 0 },
                { type: 'bar', label: 'Qty sold', data: data.map(d => d.qtySold), backgroundColor: C.yellow, borderRadius: 4, order: 1 }
            ]
        },
        options: {
            plugins: { legend: { position: 'bottom' } },
            scales: { x: noGridX, y: { beginAtZero: true } }
        }
    });

    // Loyalty
    if (loyaltyChart) loyaltyChart.destroy();
    loyaltyChart = new Chart($('loyaltyChart'), {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Loyalty', data: data.map(d => d.loyalty), backgroundColor: C.gold, borderRadius: 4 }] },
        options: {
            plugins: { legend: { display: false }, tooltip: moneyTooltip },
            scales: { x: noGridX, y: { beginAtZero: true, ticks: { callback: axisMoney } } }
        }
    });

    // Closing Stock
    if (stockChart) stockChart.destroy();
    stockChart = new Chart($('stockChart'), {
        type: 'line',
        data: { labels, datasets: [lineDataset('Closing stock', data.map(d => d.closingStock), C.ink, C.inkFill)] },
        options: {
            plugins: { legend: { display: false }, tooltip: moneyTooltip },
            scales: { x: noGridX, y: moneyScale }
        }
    });

    // Closing Bank
    if (bankChart) bankChart.destroy();
    bankChart = new Chart($('bankChart'), {
        type: 'line',
        data: { labels, datasets: [lineDataset('Closing bank', data.map(d => d.bankBalance), C.green, C.greenFill)] },
        options: {
            plugins: { legend: { display: false }, tooltip: moneyTooltip },
            scales: { x: noGridX, y: moneyScale }
        }
    });

    // Expenses stacked bar (only days with expenses)
    if (expensesChart) expensesChart.destroy();
    const daysWithExpenses = data.filter(d => d.totalExpenses > 0);
    expensesChart = new Chart($('expensesChart'), {
        type: 'bar',
        data: {
            labels: daysWithExpenses.map(d => shortLabel(d.date)),
            datasets: [
                { label: 'Salary', data: daysWithExpenses.map(d => d.salaryPaid), backgroundColor: C.ink },
                { label: 'Electricity', data: daysWithExpenses.map(d => d.electricityPaid), backgroundColor: C.gold },
                { label: 'Admin', data: daysWithExpenses.map(d => d.adminExpenses), backgroundColor: C.greenMid }
            ]
        },
        options: {
            plugins: { legend: { position: 'bottom' }, tooltip: moneyTooltip },
            scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, ticks: { callback: axisMoney } } }
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
    monthlyBarChart = new Chart($('monthlyBarChart'), {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'Gross sales', data: consolidatedData.map(d => d.sales), backgroundColor: C.greenBar, borderRadius: 4 },
                { label: 'Net sales', data: consolidatedData.map(d => d.netSales), backgroundColor: C.green, borderRadius: 4 },
                { label: 'Returns', data: consolidatedData.map(d => d.salesReturn), backgroundColor: C.red, borderRadius: 4 }
            ]
        },
        options: {
            plugins: { legend: { position: 'bottom' }, tooltip: moneyTooltip },
            scales: { x: noGridX, y: moneyScale }
        }
    });

    if (monthlyAvgChart) monthlyAvgChart.destroy();
    const avgDataset = lineDataset('Avg daily sale', consolidatedData.map(d => d.avgSales), C.green, C.greenFill);
    avgDataset.pointRadius = 4;
    avgDataset.pointBackgroundColor = C.yellow;
    monthlyAvgChart = new Chart($('monthlyAvgChart'), {
        type: 'line',
        data: { labels, datasets: [avgDataset] },
        options: {
            plugins: { legend: { display: false }, tooltip: moneyTooltip },
            scales: { x: noGridX, y: moneyScale }
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
        const totalSale = sum(entries, 'sale');
        const totalReturns = sum(entries, 'salesReturns');
        const totalExpenses = sum(entries, 'totalExpenses');
        const monthName = fmtDate(key + '-01', { month: 'long', year: 'numeric' });

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${monthName}</strong></td>
            <td>${fmtCurrency(totalSale)}</td>
            <td>${fmtCurrency(totalSale / entries.length)}</td>
            <td>${fmt(sum(entries, 'bills'))}</td>
            <td class="${totalReturns > 50000 ? 'text-danger' : ''}">${fmtCurrency(totalReturns)}</td>
            <td>${fmtCurrency(sum(entries, 'netSales'))}</td>
            <td>${fmtCurrency(sum(entries, 'margin'))}</td>
            <td>${fmtCurrency(sum(entries, 'cashSales'))}</td>
            <td>${fmtCurrency(sum(entries, 'bankSales'))}</td>
            <td>${fmtCurrency(sum(entries, 'upiSales'))}</td>
            <td>${fmt(sum(entries, 'qtySold'))}</td>
            <td>${fmtCurrency(sum(entries, 'loyalty'))}</td>
            <td class="${totalExpenses > 200000 ? 'text-danger' : ''}">${fmtCurrency(totalExpenses)}</td>
            <td>${fmtCurrency(sum(entries, 'bankBalance') / entries.length)}</td>
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
            <td><strong>${formatMonth(d.month)}</strong></td>
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
let recordFilter = 'all';

const RECORD_FILTERS = {
    all: () => true,
    ret: d => d.salesReturns > 5000,
    exp: d => d.totalExpenses > 0,
    txn: d => d.internalTxn !== 0
};

function setRecordFilter(filter) {
    recordFilter = filter;
    document.querySelectorAll('#recordChips .chip').forEach(chip => {
        chip.setAttribute('aria-pressed', String(chip.dataset.filter === filter));
    });
    renderRecordsTable();
}

function renderRecordsTable() {
    const data = getData();
    const tbody = document.querySelector('#recordsTable tbody');
    tbody.innerHTML = '';

    const monthFilter = $('filterMonth');
    const currentVal = monthFilter.value;
    const months = [...new Set(data.map(d => d.date.substring(0, 7)))].sort().reverse();
    monthFilter.innerHTML = '<option value="">All months</option>';
    months.forEach(m => {
        const name = fmtDate(m + '-01', { month: 'short', year: 'numeric' });
        monthFilter.innerHTML += `<option value="${m}" ${m === currentVal ? 'selected' : ''}>${name}</option>`;
    });

    const search = $('searchRecords').value.trim().toLowerCase();
    const monthVal = monthFilter.value;
    const longLabel = d => fmtDate(d, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).toLowerCase();

    let filtered = data.slice().reverse();
    if (monthVal) filtered = filtered.filter(d => d.date.startsWith(monthVal));
    if (search) filtered = filtered.filter(d => d.date.includes(search) || longLabel(d.date).includes(search));
    filtered = filtered.filter(RECORD_FILTERS[recordFilter]);

    $('rec-count').textContent = filtered.length + (filtered.length === 1 ? ' day' : ' days') + ' shown';
    $('rec-sale').textContent = fmtCurrency(sum(filtered, 'sale'));
    $('rec-net').textContent = fmtCurrency(sum(filtered, 'netSales'));
    $('rec-margin').textContent = fmtCurrency(sum(filtered, 'margin'));
    $('rec-returns').textContent = fmtCurrency(sum(filtered, 'salesReturns'));
    $('rec-exp').textContent = fmtCurrency(sum(filtered, 'totalExpenses'));

    if (!filtered.length) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="17">No records match these filters.</td></tr>';
        return;
    }

    const money = n => (n ? fmtCurrency(n) : '<span class="nil">—</span>');

    filtered.forEach(d => {
        let txHtml = '<span class="nil">—</span>';
        if (d.internalTxn > 0) txHtml = `<span class="tx-in">+${fmtCurrency(d.internalTxn)} in</span>`;
        else if (d.internalTxn < 0) txHtml = `<span class="tx-out">−${fmtCurrency(Math.abs(d.internalTxn))} out</span>`;

        const label = fmtDate(d.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        const expTitle = 'Salary ' + fmtCurrency(d.salaryPaid) + ' · Electricity ' + fmtCurrency(d.electricityPaid) + ' · Admin ' + fmtCurrency(d.adminExpenses);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="wd">${fmtDate(d.date, { weekday: 'short' })}</span>${fmtDate(d.date, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
            <td class="g"><strong>${fmtCurrency(d.sale)}</strong></td>
            <td>${fmt(d.bills)}</td>
            <td class="${d.salesReturns > 5000 ? 'text-danger' : ''}">${money(d.salesReturns)}</td>
            <td>${fmtCurrency(d.netSales)}</td>
            <td>${fmt(d.qtySold)}</td>
            <td>${money(d.margin)}</td>
            <td class="g">${money(d.cashSales)}</td>
            <td>${money(d.bankSales)}</td>
            <td>${money(d.upiSales)}</td>
            <td>${money(d.loyalty)}</td>
            <td class="g">${fmtLakhs(d.closingStock)}</td>
            <td>${fmtCurrency(d.bankBalance)}</td>
            <td>${txHtml}</td>
            <td>${money(d.ordersPlaced)}</td>
            <td class="g ${d.totalExpenses > 100000 ? 'text-danger' : ''}" title="${d.totalExpenses ? expTitle : ''}">${money(d.totalExpenses)}</td>
            <td class="g actions">
                <button type="button" class="icon-btn" onclick="editEntry('${d.date}')" aria-label="Edit ${label}" title="Edit">${ICON_EDIT}</button>
                <button type="button" class="icon-btn danger" onclick="deleteEntry('${d.date}')" aria-label="Delete ${label}" title="Delete">${ICON_TRASH}</button>
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

    const headers = ['Date', 'Sales', 'No of Bills', 'Sales Returns', 'Net Sales', 'Qty Sold', 'Margin', 'Cash', 'Bank', 'UPI', 'Loyalty', 'Closing Stock', 'Closing Bank', 'Int. Transaction', 'Orders Placed', 'Salary Paid', 'Electricity Paid', 'Admin Expenses', 'Total Expenses'];
    const rows = data.map(d => [
        d.date, d.sale, d.bills, d.salesReturns, d.netSales,
        d.qtySold, d.margin, d.cashSales, d.bankSales, d.upiSales, d.loyalty,
        d.closingStock, d.bankBalance, d.internalTxn, d.ordersPlaced,
        d.salaryPaid, d.electricityPaid, d.adminExpenses, d.totalExpenses
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(r => { csv += r.join(',') + '\n'; });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ramraj_daily_collection_' + todayISO() + '.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// ==================== INIT ====================
async function init() {
    showLoading();
    await fetchData();
    updateEntrySummary();
    renderDashboard();
    hideLoading();
    console.log('Supabase connected. Loaded ' + appData.length + ' daily + ' + consolidatedData.length + ' monthly records.');
}

init();
