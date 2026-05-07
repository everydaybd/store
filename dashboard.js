/**
 * Dashboard Logic for Hisab Web App - Export & Report Version
 */

const API_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSNbf0FXfmkTQx1zn7aLccs356QyGO3PePRmiKpBVjpZDRJEejCFSWsF77MDMdPjnywjhhlGkzCFHJq/pub?output=csv';
const INITIAL_INVESTMENT = 4000; 
let allTransactions = [];
let currentMonthTransactions = []; 
let currentLang = 'bn'; 
let currentViewDate = new Date(); 
let chart1 = null, chart2 = null; // Track chart instances to prevent overlap
const translations = {
    bn: {
        pageTitle: "হিসাব খাতা | ডিজিটাল ড্যাশবোর্ড",
        subTitle: "ডিজিটাল কোম্পানি ম্যানেজমেন্ট",
        mainTitle: "হিসাব খাতা লেজার",
        langBtn: "English Mode",
        downloadBtn: "রিপোর্ট ডাউনলোড",
        pageLabel: "পৃষ্ঠা: ",
        thisMonth: "চলতি মাস",
        labelLiveBalance: "কোম্পানি ফান্ড (লাইভ)",
        labelLifetimeProfitLoss: "সর্বমোট লাভ / ক্ষতি",
        labelCurrentIncome: "এই মাসের মোট আয়",
        labelCurrentExpense: "এই মাসের মোট ব্যয়",
        labelOpResult: "বর্তমান লাভ/ক্ষতি",
        labelPrevBalance: "গত মাসের উদ্বৃত্ত",
        labelTotalRevenue: "লাইফটাইম মোট আয়",
        labelTotalExpense: "লাইফটাইম মোট ব্যয়",
        labelRecentLedger: "সাম্প্রতিক লেজার এন্ট্রি",
        thDate: "তারিখ",
        thDesc: "বিবরণ / নোট",
        thAmount: "পরিমাণ (টাকা)",
        thStatus: "অবস্থা",
        labelCashFlow: "আয়-ব্যয় ও লাভ বিশ্লেষণ",
        labelGrowth: "মূলধন বৃদ্ধির ট্রেন্ড",
        searchPlaceholder: "সার্চ করুন...",
        statusCredit: "জমা",
        statusDebit: "খরচ",
        profitMsg: "বর্তমানে লাভে আছে",
        lossMsg: "বর্তমানে লসে আছে",
        trendVsLastMonth: "গত মাসের তুলনায়",
        uncategorized: "অসংজ্ঞায়িত",
        noData: "এই মাসে কোনো তথ্য পাওয়া যায়নি",
        reportFileName: "হিসাব_রিপোর্ট"
    },
    en: {
        pageTitle: "Hisab Khata | Digital Dashboard",
        subTitle: "Digital Company Management",
        mainTitle: "Hisab Khata Ledger",
        langBtn: "বাংলা মোড",
        downloadBtn: "REPORT DOWNLOAD",
        pageLabel: "Page: ",
        thisMonth: "Current Month",
        labelLiveBalance: "Company Fund (Live)",
        labelLifetimeProfitLoss: "Total Profit / Loss",
        labelCurrentIncome: "Total Income (Month)",
        labelCurrentExpense: "Total Expense (Month)",
        labelOpResult: "Net Profit/Loss",
        labelPrevBalance: "Prior Month Surplus",
        labelTotalRevenue: "Lifetime Revenue",
        labelTotalExpense: "Lifetime Expenditure",
        labelRecentLedger: "Recent Ledger Entries",
        thDate: "Date",
        thDesc: "Description / Notes",
        thAmount: "Amount (BDT)",
        thStatus: "Status",
        labelCashFlow: "Monthly Cash Flow Analysis",
        labelGrowth: "Capital Growth Trend",
        searchPlaceholder: "Search...",
        statusCredit: "Credit",
        statusDebit: "Debit",
        profitMsg: "Currently in Profit",
        lossMsg: "Currently in Loss",
        trendVsLastMonth: "vs last month",
        uncategorized: "Uncategorized",
        noData: "No data found for this month",
        reportFileName: "Financial_Report"
    }
};

function toggleLanguage() {
    currentLang = currentLang === 'bn' ? 'en' : 'bn';
    updateLanguageUI();
}

function changePage(delta) {
    currentViewDate.setMonth(currentViewDate.getMonth() + delta);
    processDashboard(false); 
    updateDateDisplay();
}

function updateLanguageUI() {
    const t = translations[currentLang];
    document.getElementById('pageTitle').innerText = t.pageTitle;
    document.getElementById('subTitle').innerText = t.subTitle;
    document.getElementById('mainTitle').innerText = t.mainTitle;
    document.getElementById('langBtnText').innerText = t.langBtn;
    document.getElementById('downloadBtnText').innerText = t.downloadBtn;
    document.getElementById('labelLiveBalance').innerText = t.labelLiveBalance;
    document.getElementById('labelLifetimeProfitLoss').innerText = t.labelLifetimeProfitLoss;
    document.getElementById('labelCurrentIncome').innerText = t.labelCurrentIncome;
    document.getElementById('labelCurrentExpense').innerText = t.labelCurrentExpense;
    document.getElementById('labelOpResult').innerText = t.labelOpResult;
    document.getElementById('labelPrevBalance').innerText = t.labelPrevBalance;
    document.getElementById('labelTotalRevenue').innerText = t.labelTotalRevenue;
    document.getElementById('labelTotalExpense').innerText = t.labelTotalExpense;
    document.getElementById('labelRecentLedger').innerText = t.labelRecentLedger;
    document.getElementById('thDate').innerText = t.thDate;
    document.getElementById('thDesc').innerText = t.thDesc;
    document.getElementById('thAmount').innerText = t.thAmount;
    document.getElementById('thStatus').innerText = t.thStatus;
    document.getElementById('labelCashFlow').innerText = t.labelCashFlow;
    document.getElementById('transactionSearch').placeholder = t.searchPlaceholder;

    if (allTransactions.length > 0) processDashboard(false);
    updateDateDisplay();
}

function formatDateDMY(date) {
    if (!date) return "";
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
}

function updateDateDisplay() {
    const locale = currentLang === 'bn' ? 'bn-BD' : 'en-GB';
    const t = translations[currentLang];
    const headerDate = document.getElementById('currentDate');
    if (headerDate) headerDate.innerText = formatDateDMY(new Date());

    const isCurrentMonth = currentViewDate.getMonth() === new Date().getMonth() && 
                          currentViewDate.getFullYear() === new Date().getFullYear();
    
    document.getElementById('pageLabel').innerText = t.pageLabel + (isCurrentMonth ? t.thisMonth : "");
    document.getElementById('displayMonth').innerText = currentViewDate.toLocaleDateString(locale, { 
        month: 'long', year: 'numeric' 
    });
}

function parseCustomDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
        if (parts[2].length === 4) return new Date(parts[2], parts[1] - 1, parts[0]);
        if (parts[0].length === 4) return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
}

async function fetchData() {
    try {
        const response = await fetch(API_URL);
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (error) {
        console.error('Error fetching CSV:', error);
        return [];
    }
}

function parseCSV(csv) {
    const lines = csv.split(/\r?\n/);
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const currentline = line.split(',');
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = currentline[index] ? currentline[index].trim() : "";
        });
        result.push(obj);
    }
    return result;
}

function processDashboard(shouldFetch = true) {
    const action = shouldFetch ? fetchData() : Promise.resolve(allTransactions);
    action.then(data => {
        if (!data || data.length === 0) { updateUIEmpty(); return; }
        const validData = data.map(item => {
            const amount = parseFloat(item.Amount);
            const date = parseCustomDate(item.Date);
            return { ...item, amount, date };
        }).filter(item => !isNaN(item.amount) && item.date !== null);

        if (validData.length === 0 && shouldFetch) { updateUIEmpty(); return; }

        if (shouldFetch) {
            const latestDate = new Date(Math.max(...validData.map(d => d.date.getTime())));
            const isCurrentMonthEmpty = !validData.some(d => d.date.getMonth() === currentViewDate.getMonth() && d.date.getFullYear() === currentViewDate.getFullYear());
            if (isCurrentMonthEmpty) {
                currentViewDate = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
                updateDateDisplay();
            }
        }

        const viewMonth = currentViewDate.getMonth();
        const viewYear = currentViewDate.getFullYear();
        const prevMonthDate = new Date(viewYear, viewMonth - 1, 1);
        const prevMonth = prevMonthDate.getMonth();
        const prevMonthYear = prevMonthDate.getFullYear();

        let stats = { 
            thisMonthIncome: 0, thisMonthExpense: 0, 
            prevMonthIncome: 0, prevMonthExpense: 0, 
            lifetimeIncome: 0, lifetimeExpense: 0, 
            monthlyData: {} 
        };
        const filteredTransactions = [];

        validData.forEach(item => {
            const amount = item.amount;
            const date = item.date;
            const isIncome = amount > 0;
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!stats.monthlyData[monthKey]) stats.monthlyData[monthKey] = { income: 0, expense: 0 };
            if (isIncome) { stats.lifetimeIncome += amount; stats.monthlyData[monthKey].income += amount; }
            else { stats.lifetimeExpense += Math.abs(amount); stats.monthlyData[monthKey].expense += Math.abs(amount); }
            if (date.getMonth() === viewMonth && date.getFullYear() === viewYear) {
                isIncome ? stats.thisMonthIncome += amount : stats.thisMonthExpense += Math.abs(amount);
                filteredTransactions.push({ ...item, isIncome });
            }
            if (date.getMonth() === prevMonth && date.getFullYear() === prevMonthYear) {
                isIncome ? stats.prevMonthIncome += amount : stats.prevMonthExpense += Math.abs(amount);
            }
        });

        allTransactions = validData;
        currentMonthTransactions = filteredTransactions;
        updateUI(stats, filteredTransactions.sort((a, b) => b.date - a.date));
        if (shouldFetch) renderCharts(stats.monthlyData);
    });
}

function updateUIEmpty() {
    const formatCurrency = (num) => new Intl.NumberFormat(currentLang === 'bn' ? 'bn-BD' : 'en-US', { style: 'currency', currency: 'BDT' }).format(num).replace('BDT', '৳');
    document.getElementById('liveBalance').innerText = formatCurrency(INITIAL_INVESTMENT);
    document.getElementById('lifetimeProfitLoss').innerText = formatCurrency(0);
    ['thisMonthIncome', 'thisMonthExpense', 'profitStatus', 'prevMonthBalance', 'lifetimeProfit', 'lifetimeExpense'].forEach(f => document.getElementById(f).innerText = formatCurrency(0));
    document.getElementById('incomeTrend').innerText = '';
    document.getElementById('expenseTrend').innerText = '';
    document.getElementById('transactionTable').querySelector('tbody').innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 3rem;">${translations[currentLang].noData}</td></tr>`;
}

function updateUI(stats, transactions) {
    const t = translations[currentLang];
    const formatCurrency = (num) => new Intl.NumberFormat(currentLang === 'bn' ? 'bn-BD' : 'en-US', { style: 'currency', currency: 'BDT' }).format(num).replace('BDT', '৳');
    
    const liveBalanceValue = INITIAL_INVESTMENT + stats.lifetimeIncome - stats.lifetimeExpense;
    document.getElementById('liveBalance').innerText = formatCurrency(liveBalanceValue);

    const lifetimePLValue = stats.lifetimeIncome - stats.lifetimeExpense;
    const lplEl = document.getElementById('lifetimeProfitLoss');
    lplEl.innerText = formatCurrency(lifetimePLValue);
    lplEl.className = lifetimePLValue >= 0 ? 'stat-value text-success' : 'stat-value text-danger';

    document.getElementById('thisMonthIncome').innerText = formatCurrency(stats.thisMonthIncome);
    document.getElementById('thisMonthExpense').innerText = formatCurrency(stats.thisMonthExpense);
    const profit = stats.thisMonthIncome - stats.thisMonthExpense;
    const profitStatusEl = document.getElementById('profitStatus');
    profitStatusEl.innerText = formatCurrency(profit);
    profitStatusEl.className = profit >= 0 ? 'stat-value text-success' : 'stat-value text-danger';
    
    document.getElementById('profitMessage').innerText = profit >= 0 ? t.profitMsg : t.lossMsg;
    document.getElementById('profitMessage').className = profit >= 0 ? 'text-success' : 'text-danger';

    document.getElementById('prevMonthBalance').innerText = formatCurrency(stats.prevMonthIncome - stats.prevMonthExpense);
    document.getElementById('lifetimeProfit').innerText = formatCurrency(stats.lifetimeIncome);
    document.getElementById('lifetimeExpense').innerText = formatCurrency(stats.lifetimeExpense);
    
    const incomeTrend = stats.prevMonthIncome === 0 ? 0 : ((stats.thisMonthIncome - stats.prevMonthIncome) / stats.prevMonthIncome) * 100;
    const trendEl = document.getElementById('incomeTrend');
    trendEl.innerText = `${incomeTrend >= 0 ? '↑' : '↓'} ${Math.abs(incomeTrend).toFixed(1)}% ${t.trendVsLastMonth}`;
    trendEl.className = incomeTrend >= 0 ? 'text-success' : 'text-danger';

    const expenseTrend = stats.prevMonthExpense === 0 ? 0 : ((stats.thisMonthExpense - stats.prevMonthExpense) / stats.prevMonthExpense) * 100;
    const expTrendEl = document.getElementById('expenseTrend');
    expTrendEl.innerText = `${expenseTrend >= 0 ? '↑' : '↓'} ${Math.abs(expenseTrend).toFixed(1)}% ${t.trendVsLastMonth}`;
    expTrendEl.className = expenseTrend >= 0 ? 'text-danger' : 'text-success'; 
    
    renderTable(transactions);
}

function renderTable(transactions) {
    const t = translations[currentLang];
    const formatCurrency = (num) => new Intl.NumberFormat(currentLang === 'bn' ? 'bn-BD' : 'en-US', { style: 'currency', currency: 'BDT' }).format(num).replace('BDT', '৳');
    const tbody = document.querySelector('#transactionTable tbody');
    tbody.innerHTML = '';
    if (transactions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 3rem; color: var(--secondary-ink); font-style: italic;">${t.noData}</td></tr>`;
        return;
    }
    transactions.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="color: var(--secondary-ink); font-weight: 500;">${formatDateDMY(item.date)}</td>
            <td style="font-weight: 600; color: var(--primary-ink);">${item.Comment || t.uncategorized}</td>
            <td class="${item.isIncome ? 'text-success' : 'text-danger'}" style="font-weight: 800; letter-spacing: -0.02em;">
                ${item.isIncome ? '+' : '-'}${formatCurrency(Math.abs(item.amount))}
            </td>
            <td style="text-align: right;">
                <span class="badge ${item.isIncome ? 'badge-credit' : 'badge-debit'}">
                    ${item.isIncome ? t.statusCredit : t.statusDebit}
                </span>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function downloadReport() {
    const t = translations[currentLang];
    const monthYear = currentViewDate.toLocaleDateString(currentLang === 'bn' ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' });
    
    // Select the main page to capture
    const element = document.querySelector('.ledger-page');
    
    // Temporarily hide buttons for a clean screenshot
    const nav = document.querySelector('.ledger-nav');
    const search = document.querySelector('.search-input');
    nav.style.visibility = 'hidden';
    search.style.visibility = 'hidden';

    html2canvas(element, {
        scale: 2, // Higher quality
        backgroundColor: "#f8fafc",
        logging: false,
        useCORS: true
    }).then(canvas => {
        // Show buttons back
        nav.style.visibility = 'visible';
        search.style.visibility = 'visible';

        const link = document.createElement('a');
        link.download = `${t.reportFileName}_${monthYear.replace(/ /g, '_')}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
}

function renderCharts(monthlyData) {
    const labels = Object.keys(monthlyData).sort();
    if (labels.length === 0) return;
    const incomeData = labels.map(l => monthlyData[l].income);
    const expenseData = labels.map(l => monthlyData[l].expense);
    const commonOptions = {
        responsive: true, maintainAspectRatio: false,
        scales: {
            y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#6b7280', font: { size: 10 } } },
            x: { grid: { display: false }, ticks: { color: '#6b7280', font: { size: 10 } } }
        },
        plugins: { legend: { labels: { color: '#1f2937', font: { size: 10 } } } }
    };

    if (chart1) chart1.destroy();
    const ctx1 = document.getElementById('mainChart').getContext('2d');
    chart1 = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: labels.map(l => { const [y, m] = l.split('-'); return new Date(y, m-1).toLocaleDateString(currentLang === 'bn' ? 'bn-BD' : 'en-US', { month: 'short' }); }),
            datasets: [{ label: translations[currentLang].statusCredit, data: incomeData, backgroundColor: '#059669', borderRadius: 2 }, { label: translations[currentLang].statusDebit, data: expenseData, backgroundColor: '#dc2626', borderRadius: 2 }]
        },
        options: { ...commonOptions, plugins: { ...commonOptions.plugins, legend: { position: 'bottom', labels: { boxWidth: 10 } } } }
    });

    if (chart2) chart2.destroy();
    const ctx2 = document.getElementById('growthChart').getContext('2d');
    let cumulative = INITIAL_INVESTMENT;
    const growthData = incomeData.map((inc, i) => { cumulative += (inc - expenseData[i]); return cumulative; });
    chart2 = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: labels.map(l => { const [y, m] = l.split('-'); return new Date(y, m-1).toLocaleDateString(currentLang === 'bn' ? 'bn-BD' : 'en-US', { month: 'short' }); }),
            datasets: [{ label: 'Profit Trend', data: growthData, borderColor: '#2563eb', borderWidth: 2, tension: 0.3, fill: false, pointRadius: 3 }]
        },
        options: { ...commonOptions, plugins: { ...commonOptions.plugins, legend: { display: false } } }
    });
}

document.getElementById('transactionSearch').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allTransactions.filter(t => {
        const isMonth = t.date.getMonth() === currentViewDate.getMonth() && t.date.getFullYear() === currentViewDate.getFullYear();
        if (!isMonth) return false;
        return (t.Comment && t.Comment.toLowerCase().includes(term)) || formatDateDMY(t.date).includes(term) || t.amount.toString().includes(term);
    });
    renderTable(filtered);
});

updateLanguageUI();
processDashboard();
