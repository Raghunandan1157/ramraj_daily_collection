// ==================== DATA STORE (In-Memory Only - clears on reload) ====================
let appData = [
    {
        date: '2026-03-15',
        openTime: '09:30',
        closeTime: '21:30',
        sale: 144299,
        bills: 81,
        qty: 330,
        atv: 1781.47,
        upt: 4.07,
        asp: 437.27,
        cymtd: 823796,
        cymtdAvg: 54920,
        trend: 1702512,
        target: 3500000,
        tarAch: 23.54
    }
];

function getData() {
    return appData;
}

function saveData(data) {
    appData = data;
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

function saveEntry(e) {
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

    let data = getData();

    if (editingDate) {
        data = data.filter(d => d.date !== editingDate);
        editingDate = null;
        document.getElementById('submitBtn').textContent = 'Save Entry';
    } else {
        // Check for duplicate date
        if (data.some(d => d.date === entry.date)) {
            showMessage('Entry for this date already exists. Use edit from Records page.', 'error');
            return false;
        }
    }

    data.push(entry);
    data.sort((a, b) => a.date.localeCompare(b.date));
    saveData(data);
    showMessage('Entry saved successfully!', 'success');
    resetForm();
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

function deleteEntry(date) {
    if (!confirm('Delete entry for ' + date + '?')) return;
    let data = getData().filter(d => d.date !== date);
    saveData(data);
    renderRecordsTable();
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
    const [h, m] = t.split(':');
    const hr = parseInt(h);
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
        document.getElementById('kpi-sale').textContent = '--';
        document.getElementById('kpi-bills').textContent = '--';
        document.getElementById('kpi-qty').textContent = '--';
        document.getElementById('kpi-tar').textContent = '--';
        document.getElementById('kpi-atv').textContent = '--';
        document.getElementById('kpi-upt').textContent = '--';
        document.getElementById('kpi-asp').textContent = '--';
        document.getElementById('kpi-mtd').textContent = '--';
        return;
    }

    // Get previous day for comparison
    const prev = data.length > 1 ? data[data.length - 2] : null;

    document.getElementById('kpi-sale').textContent = fmtCurrency(latest.sale);
    document.getElementById('kpi-bills').textContent = fmt(latest.bills);
    document.getElementById('kpi-qty').textContent = fmt(latest.qty);
    document.getElementById('kpi-tar').textContent = latest.tarAch.toFixed(1) + '%';
    document.getElementById('kpi-atv').textContent = fmtCurrency(latest.atv);
    document.getElementById('kpi-upt').textContent = latest.upt.toFixed(2);
    document.getElementById('kpi-asp').textContent = fmtCurrency(latest.asp);
    document.getElementById('kpi-mtd').textContent = fmtCurrency(latest.cymtd);

    // Comparison subs
    if (prev) {
        setSub('kpi-sale-sub', latest.sale, prev.sale, true);
        setSub('kpi-bills-sub', latest.bills, prev.bills, false);
        setSub('kpi-qty-sub', latest.qty, prev.qty, false);
    }

    document.getElementById('kpi-tar-sub').textContent = 'Target: ' + fmtCurrency(latest.target);
    document.getElementById('kpi-mtd-sub').textContent = 'Avg: ' + fmtCurrency(latest.cymtdAvg);

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
        const avgAtv = entries.reduce((s, e) => s + e.atv, 0) / entries.length;
        const avgUpt = entries.reduce((s, e) => s + e.upt, 0) / entries.length;
        const lastTarget = entries[entries.length - 1].target;
        const lastAch = entries[entries.length - 1].tarAch;

        const [y, m] = key.split('-');
        const monthName = new Date(y, m - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${monthName}</td>
            <td>${fmtCurrency(totalSale)}</td>
            <td>${fmtCurrency(avgSale)}</td>
            <td>${fmt(totalBills)}</td>
            <td>${fmtCurrency(avgAtv)}</td>
            <td>${avgUpt.toFixed(2)}</td>
            <td>${fmtCurrency(lastTarget)}</td>
            <td class="${achClass(lastAch)}">${lastAch.toFixed(1)}%</td>
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
            <td>${formatTime(d.openTime)}</td>
            <td>${formatTime(d.closeTime)}</td>
            <td>${fmtCurrency(d.sale)}</td>
            <td>${d.bills}</td>
            <td>${d.qty}</td>
            <td>${fmtCurrency(d.atv)}</td>
            <td>${d.upt.toFixed(2)}</td>
            <td>${fmtCurrency(d.asp)}</td>
            <td>${fmtCurrency(d.cymtd)}</td>
            <td>${fmtCurrency(d.cymtdAvg)}</td>
            <td>${fmtCurrency(d.trend)}</td>
            <td>${fmtCurrency(d.target)}</td>
            <td class="${achClass(d.tarAch)}">${d.tarAch.toFixed(1)}%</td>
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
renderDashboard();
