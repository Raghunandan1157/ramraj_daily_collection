// ==================== SUPABASE CLIENT ====================
const SUPABASE_URL = 'https://zovnmmdfthpbubrorsgh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvdm5tbWRmdGhwYnVicm9yc2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NzE3ODgsImV4cCI6MjA3NzE0Nzc4OH0.92BH2sjUOgkw6iSRj1_4gt0p3eThg3QT4VK-Q4EdmBE';
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==================== DATA STORE (Supabase-backed) ====================
let appData = [];

async function fetchData() {
    const { data, error } = await db
        .from('daily_sales')
        .select('*')
        .order('date', { ascending: true });

    if (error) {
        console.error('Error fetching data:', error);
        return [];
    }

    // Map Supabase columns to the app's expected format
    appData = data.map(row => {
        const sales = Number(row.sales) || 0;
        const bills = Number(row.no_of_bills) || 0;
        const qty = Number(row.quantity) || 0;
        const netSales = Number(row.net_sales) || 0;
        // Strip seconds from time if present (e.g. "09:30:00" -> "09:30")
        const openTime = (row.open_time || '09:30').substring(0, 5);
        const closeTime = (row.close_time || '21:30').substring(0, 5);

        return {
            id: row.id,
            date: row.date,
            openTime,
            closeTime,
            sale: sales,
            bills: bills,
            qty: qty,
            atv: Number(row.atv) || (bills > 0 ? sales / bills : 0),
            upt: Number(row.upt) || 0,
            asp: Number(row.asp) || 0,
            cymtd: Number(row.cy_mtd_sale) || 0,
            cymtdAvg: Number(row.cy_mtd_avg_sale) || 0,
            trend: Number(row.sales_trend) || 0,
            target: Number(row.target) || 0,
            tarAch: Number(row.target_achievement) || 0,
            // Extra fields from Excel
            salesReturns: Number(row.sales_returns) || 0,
            netSales: netSales,
            closingStock: Number(row.closing_stock) || 0,
            bankBalance: Number(row.bank_balance) || 0,
            ordersPlaced: Number(row.orders_placed_amount) || 0,
            salaryPaid: Number(row.salary_paid) || 0,
            electricityPaid: Number(row.electricity_paid) || 0,
            adminExpenses: Number(row.admin_expenses) || 0,
            totalExpenses: Number(row.total_expenses) || 0
        };
    });

    return appData;
}

function getData() {
    return appData;
}

async function saveToSupabase(entry) {
    const row = {
        date: entry.date,
        open_time: entry.openTime,
        close_time: entry.closeTime,
        sales: entry.sale,
        no_of_bills: entry.bills,
        quantity: entry.qty,
        atv: entry.atv,
        upt: entry.upt,
        asp: entry.asp,
        cy_mtd_sale: entry.cymtd,
        cy_mtd_avg_sale: entry.cymtdAvg,
        sales_trend: entry.trend,
        target: entry.target,
        target_achievement: entry.tarAch,
        net_sales: entry.sale - (entry.salesReturns || 0)
    };

    const { data, error } = await db
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

// ==================== NAVIGATION ====================
const navLinks = document.querySelectorAll('.nav-links li');
const pages = document.querySelectorAll('.page');
const pageTitle = document.getElementById('page-title');

const pageTitles = {
    dashboard: 'Dashboard',
    entry: 'Data Entry',
    sales: 'Sales Analysis',
    target: 'Target vs Achievement',
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

        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('open');
        }

        // Refresh charts when navigating
        if (page === 'dashboard') renderDashboard();
        if (page === 'sales') renderSalesCharts();
        if (page === 'target') renderTargetCharts();
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
const fSale = document.getElementById('f-sale');
const fBills = document.getElementById('f-bills');
const fQty = document.getElementById('f-qty');
const fAtv = document.getElementById('f-atv');
const fUpt = document.getElementById('f-upt');
const fAsp = document.getElementById('f-asp');
const fCymtd = document.getElementById('f-cymtd');
const fTarget = document.getElementById('f-target');
const fTarAch = document.getElementById('f-tarach');

function autoCalc() {
    const sale = parseFloat(fSale.value) || 0;
    const bills = parseFloat(fBills.value) || 0;
    const qty = parseFloat(fQty.value) || 0;
    const cymtd = parseFloat(fCymtd.value) || 0;
    const target = parseFloat(fTarget.value) || 0;

    fAtv.value = bills > 0 ? (sale / bills).toFixed(2) : '';
    fUpt.value = bills > 0 ? (qty / bills).toFixed(2) : '';
    fAsp.value = qty > 0 ? (sale / qty).toFixed(2) : '';
    fTarAch.value = target > 0 ? ((cymtd / target) * 100).toFixed(2) : '';
}

[fSale, fBills, fQty, fCymtd, fTarget].forEach(el => {
    el.addEventListener('input', autoCalc);
});

// ==================== SAVE / EDIT ENTRY ====================
let editingDate = null;

async function saveEntry(e) {
    e.preventDefault();

    const entry = {
        date: document.getElementById('f-date').value,
        openTime: document.getElementById('f-open').value,
        closeTime: document.getElementById('f-close').value,
        sale: parseFloat(fSale.value),
        bills: parseInt(fBills.value),
        qty: parseInt(fQty.value),
        atv: parseFloat(fAtv.value),
        upt: parseFloat(fUpt.value),
        asp: parseFloat(fAsp.value),
        cymtd: parseFloat(fCymtd.value),
        cymtdAvg: parseFloat(document.getElementById('f-cymtdavg').value),
        trend: parseFloat(document.getElementById('f-trend').value),
        target: parseFloat(fTarget.value),
        tarAch: parseFloat(fTarAch.value)
    };

    if (!editingDate) {
        // Check for duplicate date
        if (appData.some(d => d.date === entry.date)) {
            showMessage('Entry for this date already exists. Use edit from Records page.', 'error');
            return false;
        }
    }

    const success = await saveToSupabase(entry);
    if (success) {
        showMessage('Entry saved to Supabase!', 'success');
        editingDate = null;
        document.getElementById('submitBtn').textContent = 'Save Entry';
        resetForm();
        await fetchData(); // Refresh local data
    } else {
        showMessage('Error saving entry. Check console.', 'error');
    }

    return false;
}

function resetForm() {
    document.getElementById('entryForm').reset();
    document.getElementById('f-date').valueAsDate = new Date();
    document.getElementById('f-open').value = '09:30';
    document.getElementById('f-close').value = '21:30';
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
    const data = getData();
    const entry = data.find(d => d.date === date);
    if (!entry) return;

    editingDate = date;
    document.getElementById('f-date').value = entry.date;
    document.getElementById('f-open').value = entry.openTime;
    document.getElementById('f-close').value = entry.closeTime;
    fSale.value = entry.sale;
    fBills.value = entry.bills;
    fQty.value = entry.qty;
    fAtv.value = entry.atv;
    fUpt.value = entry.upt;
    fAsp.value = entry.asp;
    fCymtd.value = entry.cymtd;
    document.getElementById('f-cymtdavg').value = entry.cymtdAvg;
    document.getElementById('f-trend').value = entry.trend;
    fTarget.value = entry.target;
    fTarAch.value = entry.tarAch;
    document.getElementById('submitBtn').textContent = 'Update Entry';

    // Navigate to entry page
    navLinks.forEach(l => l.classList.remove('active'));
    document.querySelector('[data-page="entry"]').classList.add('active');
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById('page-entry').classList.add('active');
    pageTitle.textContent = 'Data Entry';
}

async function deleteEntry(date) {
    if (!confirm('Delete entry for ' + date + '?')) return;
    const success = await deleteFromSupabase(date);
    if (success) {
        await fetchData();
        renderRecordsTable();
    }
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

function formatTime(t) {
    if (!t) return '--';
    const parts = t.split(':');
    const hr = parseInt(parts[0]);
    const m = parts[1];
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const hr12 = hr % 12 || 12;
    return hr12 + ':' + m + ' ' + ampm;
}

function achClass(val) {
    if (val >= 80) return 'ach-high';
    if (val >= 50) return 'ach-mid';
    return 'ach-low';
}

// ==================== DASHBOARD ====================
let dashSalesChart, dashTargetChart;

function renderDashboard() {
    const data = getData();
    const latest = data.length > 0 ? data[data.length - 1] : null;

    if (!latest) {
        ['kpi-sale','kpi-netsales','kpi-bills','kpi-returns','kpi-stock','kpi-bank','kpi-orders','kpi-expenses'].forEach(id => {
            document.getElementById(id).textContent = '--';
        });
        return;
    }

    // Get previous day for comparison
    const prev = data.length > 1 ? data[data.length - 2] : null;

    document.getElementById('kpi-sale').textContent = fmtCurrency(latest.sale);
    document.getElementById('kpi-netsales').textContent = fmtCurrency(latest.netSales);
    document.getElementById('kpi-bills').textContent = fmt(latest.bills);
    document.getElementById('kpi-returns').textContent = fmtCurrency(latest.salesReturns);
    document.getElementById('kpi-stock').textContent = fmtCurrency(latest.closingStock);
    document.getElementById('kpi-bank').textContent = fmtCurrency(latest.bankBalance);
    document.getElementById('kpi-orders').textContent = fmtCurrency(latest.ordersPlaced);
    document.getElementById('kpi-expenses').textContent = fmtCurrency(latest.totalExpenses);

    // Comparison subs
    if (prev) {
        setSub('kpi-sale-sub', latest.sale, prev.sale, true);
        setSub('kpi-netsales-sub', latest.netSales, prev.netSales, true);
        setSub('kpi-bills-sub', latest.bills, prev.bills, false);
        setSub('kpi-returns-sub', latest.salesReturns, prev.salesReturns, false);
        setSub('kpi-stock-sub', latest.closingStock, prev.closingStock, true);
        setSub('kpi-bank-sub', latest.bankBalance, prev.bankBalance, true);
    }

    document.getElementById('kpi-expenses-sub').textContent = 'Salary + Electricity + Admin';

    // Sales trend chart
    const last30 = data.slice(-30);
    const labels = last30.map(d => {
        const dt = new Date(d.date);
        return dt.getDate() + '/' + (dt.getMonth() + 1);
    });

    if (dashSalesChart) dashSalesChart.destroy();
    dashSalesChart = new Chart(document.getElementById('dashSalesChart'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Daily Sale',
                data: last30.map(d => d.sale),
                borderColor: '#e94560',
                backgroundColor: 'rgba(233,69,96,0.1)',
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
                    beginAtZero: false,
                    ticks: {
                        callback: v => '\u20B9' + (v / 1000).toFixed(0) + 'K'
                    }
                }
            }
        }
    });

    // Target doughnut
    if (dashTargetChart) dashTargetChart.destroy();
    const ach = latest.tarAch;
    dashTargetChart = new Chart(document.getElementById('dashTargetChart'), {
        type: 'doughnut',
        data: {
            labels: ['Achieved', 'Remaining'],
            datasets: [{
                data: [Math.min(ach, 100), Math.max(100 - ach, 0)],
                backgroundColor: [ach >= 80 ? '#2ecc71' : ach >= 50 ? '#f39c12' : '#e74c3c', '#e0e0e0'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            cutout: '75%',
            plugins: {
                legend: { position: 'bottom', labels: { font: { size: 12 } } }
            }
        }
    });
}

function setSub(id, current, previous, isCurrency) {
    const el = document.getElementById(id);
    const diff = current - previous;
    const pct = previous ? ((diff / previous) * 100).toFixed(1) : 0;
    const arrow = diff >= 0 ? '\u25B2' : '\u25BC';
    el.textContent = arrow + ' ' + Math.abs(pct) + '% vs yesterday';
    el.className = 'kpi-sub ' + (diff >= 0 ? 'up' : 'down');
}

// ==================== SALES ANALYSIS CHARTS ====================
let salesLineChart, billsQtyChart, atvChart, uptChart, aspChart;

function renderSalesCharts() {
    const data = getData().slice(-30);
    if (data.length === 0) return;

    const labels = data.map(d => {
        const dt = new Date(d.date);
        return dt.getDate() + '/' + (dt.getMonth() + 1);
    });

    // Sales Line
    if (salesLineChart) salesLineChart.destroy();
    salesLineChart = new Chart(document.getElementById('salesLineChart'), {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Daily Sale',
                data: data.map(d => d.sale),
                backgroundColor: 'rgba(233,69,96,0.7)',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: v => '\u20B9' + (v / 1000).toFixed(0) + 'K' } } }
        }
    });

    // Bills vs QTY
    if (billsQtyChart) billsQtyChart.destroy();
    billsQtyChart = new Chart(document.getElementById('billsQtyChart'), {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Bills', data: data.map(d => d.bills), borderColor: '#3498db', tension: 0.3, pointRadius: 2 },
                { label: 'Quantity', data: data.map(d => d.qty), borderColor: '#2ecc71', tension: 0.3, pointRadius: 2 }
            ]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });

    // ATV
    if (atvChart) atvChart.destroy();
    atvChart = new Chart(document.getElementById('atvChart'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'ATV',
                data: data.map(d => d.atv),
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
            scales: { y: { ticks: { callback: v => '\u20B9' + v } } }
        }
    });

    // UPT
    if (uptChart) uptChart.destroy();
    uptChart = new Chart(document.getElementById('uptChart'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'UPT',
                data: data.map(d => d.upt),
                borderColor: '#e67e22',
                backgroundColor: 'rgba(230,126,34,0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 2
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });

    // ASP
    if (aspChart) aspChart.destroy();
    aspChart = new Chart(document.getElementById('aspChart'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'ASP',
                data: data.map(d => d.asp),
                borderColor: '#1abc9c',
                backgroundColor: 'rgba(26,188,156,0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { ticks: { callback: v => '\u20B9' + v } } }
        }
    });
}

// ==================== TARGET CHARTS ====================
let targetBarChart, achRateChart, trendProjectionChart;

function renderTargetCharts() {
    const data = getData();
    if (data.length === 0) return;

    const last30 = data.slice(-30);
    const labels = last30.map(d => {
        const dt = new Date(d.date);
        return dt.getDate() + '/' + (dt.getMonth() + 1);
    });

    // MTD vs Target bar
    if (targetBarChart) targetBarChart.destroy();
    targetBarChart = new Chart(document.getElementById('targetBarChart'), {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'CY MTD Sale',
                    data: last30.map(d => d.cymtd),
                    backgroundColor: 'rgba(52,152,219,0.7)',
                    borderRadius: 4
                },
                {
                    label: 'Target',
                    data: last30.map(d => d.target),
                    backgroundColor: 'rgba(231,76,60,0.3)',
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

    // Achievement rate
    if (achRateChart) achRateChart.destroy();
    achRateChart = new Chart(document.getElementById('achRateChart'), {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Achievement %',
                data: last30.map(d => d.tarAch),
                borderColor: '#e94560',
                backgroundColor: 'rgba(233,69,96,0.1)',
                fill: true,
                tension: 0.3,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } } }
        }
    });

    // Trend projection
    if (trendProjectionChart) trendProjectionChart.destroy();
    trendProjectionChart = new Chart(document.getElementById('trendProjectionChart'), {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Sales Trend',
                    data: last30.map(d => d.trend),
                    borderColor: '#2ecc71',
                    tension: 0.3,
                    pointRadius: 2
                },
                {
                    label: 'Target',
                    data: last30.map(d => d.target),
                    borderColor: '#e74c3c',
                    borderDash: [5, 5],
                    tension: 0,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } },
            scales: { y: { ticks: { callback: v => '\u20B9' + (v / 100000).toFixed(1) + 'L' } } }
        }
    });

    // Monthly summary
    renderMonthlySummary(data);
}

function renderMonthlySummary(data) {
    const months = {};
    data.forEach(d => {
        const key = d.date.substring(0, 7); // YYYY-MM
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
            <td>${fmtCurrency(totalReturns)}</td>
            <td>${fmtCurrency(totalNetSales)}</td>
            <td>${fmtCurrency(totalExpenses)}</td>
            <td>${fmtCurrency(avgBank)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ==================== RECORDS TABLE ====================
function renderRecordsTable() {
    const data = getData();
    const tbody = document.querySelector('#recordsTable tbody');
    tbody.innerHTML = '';

    // Populate month filter
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

    // Apply filters
    const search = document.getElementById('searchRecords').value.toLowerCase();
    const monthVal = monthFilter.value;

    if (search) filtered = filtered.filter(d => d.date.includes(search));
    if (monthVal) filtered = filtered.filter(d => d.date.startsWith(monthVal));

    filtered.forEach(d => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${d.date}</td>
            <td>${fmtCurrency(d.sale)}</td>
            <td>${d.bills}</td>
            <td>${fmtCurrency(d.salesReturns)}</td>
            <td>${fmtCurrency(d.netSales)}</td>
            <td>${fmtCurrency(d.closingStock)}</td>
            <td>${fmtCurrency(d.bankBalance)}</td>
            <td>${fmtCurrency(d.ordersPlaced)}</td>
            <td>${fmtCurrency(d.salaryPaid)}</td>
            <td>${fmtCurrency(d.electricityPaid)}</td>
            <td>${fmtCurrency(d.adminExpenses)}</td>
            <td>${fmtCurrency(d.totalExpenses)}</td>
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

    const headers = ['Date', 'Open Time', 'Close Time', 'Sale', 'Bills', 'QTY', 'ATV', 'UPT', 'ASP', 'CY MTD Sale', 'CY MTD Avg Sale', 'Sales Trend', 'Target', 'Target vs Ach %'];
    const rows = data.map(d => [
        d.date, d.openTime, d.closeTime, d.sale, d.bills, d.qty,
        d.atv, d.upt, d.asp, d.cymtd, d.cymtdAvg, d.trend, d.target, d.tarAch
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
    await fetchData();
    renderDashboard();
    console.log('Supabase connected. Loaded ' + appData.length + ' records.');
}

init();
