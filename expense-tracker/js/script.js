// Expense Tracker JavaScript with Analytics

// Global variables
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let currentFilter = '';
let currentAnalyticsPeriod = 'week';
let isDarkMode = localStorage.getItem('darkMode') === 'true';
let currency = localStorage.getItem('currency') || '₹';
let budget = parseFloat(localStorage.getItem('budget')) || 0;
let chartInstance = null;

// DOM Elements
const expenseForm = document.getElementById('expense-form');
const expenseAmount = document.getElementById('expense-amount');
const expenseDescription = document.getElementById('expense-description');
const expenseCategory = document.getElementById('expense-category');
const expenseDate = document.getElementById('expense-date');
const currencySelect = document.getElementById('currency-select');
const expensesList = document.getElementById('expenses-list');
const totalAmount = document.getElementById('total-amount');
const expenseCount = document.getElementById('expense-count');
const filterCategory = document.getElementById('filter-category');
const searchInput = document.getElementById('search-expenses');
const clearAllBtn = document.getElementById('clear-all-btn');
const budgetInput = document.getElementById('budget-input');
const budgetStatus = document.getElementById('budget-status');
const noExpenses = document.getElementById('no-expenses');
const messageDiv = document.getElementById('message');
const themeToggle = document.getElementById('theme-toggle');
const tabBtns = document.querySelectorAll('.tab-btn');
const topCategoryEl = document.getElementById('top-category');
const dailyAverageEl = document.getElementById('daily-average');
const periodTotalEl = document.getElementById('period-total');
const expenseChart = document.getElementById('expense-chart');
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const preloader = document.getElementById('preloader');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Show preloader until Chart.js and DOM are loaded
    if (window.Chart) {
        initializeApp();
    } else {
        document.addEventListener('chartjs-loaded', initializeApp);
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => document.dispatchEvent(new Event('chartjs-loaded'));
        document.head.appendChild(script);
    }
});

function initializeApp() {
    initializeTheme();
    setTodayDate();
    displayExpenses();
    updateSummary();
    updateAnalytics();
    updateBudgetStatus();
    currencySelect.value = currency;
    setupEventListeners();
    // Hide preloader
    preloader.classList.add('hidden');
}

// Theme Management
function initializeTheme() {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', isDarkMode);
    showMessage(`${isDarkMode ? 'Dark' : 'Light'} mode enabled!`, 'success');
}

// Set today's date as default
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    expenseDate.value = today;
}

// Event Listeners
function setupEventListeners() {
    expenseForm.addEventListener('submit', addExpense);
    filterCategory.addEventListener('change', filterExpenses);
    searchInput.addEventListener('input', (e) => searchExpenses(e.target.value));
    clearAllBtn.addEventListener('click', clearAllExpenses);
    budgetInput.nextElementSibling.addEventListener('click', setBudget);
    currencySelect.addEventListener('change', (e) => {
        currency = e.target.value;
        localStorage.setItem('currency', currency);
        displayExpenses();
        updateSummary();
        updateAnalytics();
        updateBudgetStatus();
    });
    themeToggle.addEventListener('click', toggleTheme);
    themeToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleTheme();
        }
    });
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(tab => tab.classList.remove('active'));
            e.target.classList.add('active');
            tabBtns.forEach(tab => tab.setAttribute('aria-selected', tab === e.target));
            currentAnalyticsPeriod = e.target.dataset.period;
            updateAnalytics();
        });
    });

    // Navigation toggle for mobile
    navToggle.addEventListener('click', () => {
        const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', !isExpanded);
        navMenu.classList.toggle('active');
    });

    // Smooth scroll for nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                if (window.innerWidth <= 768) {
                    navToggle.setAttribute('aria-expanded', 'false');
                    navMenu.classList.remove('active');
                }
            }
        });
    });
}

// Add new expense
function addExpense(e) {
    e.preventDefault();
    
    const amount = parseFloat(expenseAmount.value);
    const description = expenseDescription.value.trim();
    const category = expenseCategory.value;
    const date = expenseDate.value;
    const today = new Date().toISOString().split('T')[0];
    
    if (!amount || amount <= 0) {
        showMessage('Please enter a valid amount greater than 0', 'error');
        expenseAmount.focus();
        return;
    }
    
    if (!description) {
        showMessage('Please enter a description', 'error');
        expenseDescription.focus();
        return;
    }
    
    if (!category) {
        showMessage('Please select a category', 'error');
        expenseCategory.focus();
        return;
    }
    
    if (!date) {
        showMessage('Please select a date', 'error');
        expenseDate.focus();
        return;
    }
    
    if (date > today) {
        showMessage('Future dates are not allowed', 'error');
        expenseDate.focus();
        return;
    }
    
    const expense = {
        id: Date.now(),
        amount: amount,
        description: description,
        category: category,
        date: date,
        timestamp: new Date().toISOString()
    };
    
    expenses.unshift(expense);
    saveExpenses();
    displayExpenses();
    updateSummary();
    updateAnalytics();
    updateBudgetStatus();
    expenseForm.reset();
    setTodayDate();
    showMessage('Expense added successfully!', 'success');
}

// Edit expense
function editExpense(id) {
    const expense = expenses.find(exp => exp.id === id);
    if (!expense) return;

    expenseAmount.value = expense.amount;
    expenseDescription.value = expense.description;
    expenseCategory.value = expense.category;
    expenseDate.value = expense.date;

    expenses = expenses.filter(exp => exp.id !== id);
    saveExpenses();
    displayExpenses();
    updateSummary();
    updateAnalytics();
    updateBudgetStatus();
    showMessage('Edit the expense and click Add Expense to save changes', 'success');
}

// Display expenses
function displayExpenses() {
    expensesList.innerHTML = '';
    
    const filteredExpenses = getFilteredExpenses();
    
    if (filteredExpenses.length === 0) {
        noExpenses.style.display = 'block';
        return;
    }
    
    noExpenses.style.display = 'none';
    
    filteredExpenses.forEach(expense => {
        const expenseItem = createExpenseItem(expense);
        expensesList.appendChild(expenseItem);
    });
}

// Create expense item HTML
function createExpenseItem(expense) {
    const expenseItem = document.createElement('div');
    expenseItem.className = 'expense-item';
    expenseItem.setAttribute('data-id', expense.id);
    
    const formattedDate = formatDate(expense.date);
    const categoryDisplay = getCategoryDisplay(expense.category);
    
    expenseItem.innerHTML = `
        <div class="expense-details">
            <div class="expense-description">${expense.description}</div>
            <div class="expense-meta">
                <span class="expense-category">${categoryDisplay}</span>
                <span class="expense-date">📅 ${formattedDate}</span>
            </div>
        </div>
        <div class="expense-amount">${currency}${expense.amount.toFixed(2)}</div>
        <div class="expense-actions">
            <button class="edit-btn" onclick="editExpense(${expense.id})">✏️ Edit</button>
            <button class="delete-btn" onclick="deleteExpense(${expense.id})">🗑️ Delete</button>
        </div>
    `;
    
    return expenseItem;
}

// Delete expense
function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        expenses = expenses.filter(expense => expense.id !== id);
        saveExpenses();
        displayExpenses();
        updateSummary();
        updateAnalytics();
        updateBudgetStatus();
        showMessage('Expense deleted successfully!', 'success');
    }
}

// Clear all expenses
function clearAllExpenses() {
    if (expenses.length === 0) {
        showMessage('No expenses to clear!', 'error');
        return;
    }
    
    if (confirm('Are you sure you want to delete ALL expenses? This cannot be undone!')) {
        expenses = [];
        saveExpenses();
        displayExpenses();
        updateSummary();
        updateAnalytics();
        updateBudgetStatus();
        filterCategory.value = '';
        searchInput.value = '';
        currentFilter = '';
        showMessage('All expenses cleared!', 'success');
    }
}

// Set budget
function setBudget() {
    const budgetValue = parseFloat(budgetInput.value);
    if (!budgetValue || budgetValue <= 0) {
        showMessage('Please enter a valid budget amount', 'error');
        return;
    }
    budget = budgetValue;
    localStorage.setItem('budget', budget);
    updateBudgetStatus();
    showMessage('Budget set successfully!', 'success');
    budgetInput.value = '';
}

// Update budget status
function updateBudgetStatus() {
    const monthlyExpenses = getExpensesForPeriod('month').reduce((sum, expense) => sum + expense.amount, 0);
    if (budget === 0) {
        budgetStatus.textContent = 'No budget set';
        return;
    }
    const remaining = budget - monthlyExpenses;
    budgetStatus.textContent = `Budget: ${currency}${budget.toFixed(2)} | Spent: ${currency}${monthlyExpenses.toFixed(2)} | Remaining: ${currency}${remaining.toFixed(2)}`;
    if (remaining < 0) {
        budgetStatus.style.color = '#e53e3e';
        showMessage('Budget exceeded!', 'error');
    } else if (remaining < budget * 0.1) {
        budgetStatus.style.color = '#d69e2e';
        showMessage('Approaching budget limit!', 'error');
    } else {
        budgetStatus.style.color = 'var(--accent)';
    }
}

// Filter expenses by category
function filterExpenses() {
    currentFilter = filterCategory.value;
    displayExpenses();
    updateSummary();
}

// Search expenses
function searchExpenses(query) {
    if (!query.trim()) {
        currentFilter = filterCategory.value;
        displayExpenses();
        updateSummary();
        return;
    }
    
    const searchResults = expenses.filter(expense =>
        expense.description.toLowerCase().includes(query.toLowerCase()) ||
        getCategoryDisplay(expense.category).toLowerCase().includes(query.toLowerCase())
    );
    
    expensesList.innerHTML = '';
    
    if (searchResults.length === 0) {
        noExpenses.style.display = 'block';
        noExpenses.innerHTML = '<p>No expenses found matching your search.</p>';
        return;
    }
    
    noExpenses.style.display = 'none';
    
    searchResults.forEach(expense => {
        const expenseItem = createExpenseItem(expense);
        expensesList.appendChild(expenseItem);
    });
}

// Get filtered expenses
function getFilteredExpenses() {
    if (!currentFilter) {
        return expenses;
    }
    return expenses.filter(expense => expense.category === currentFilter);
}

// Update summary display
function updateSummary() {
    const filteredExpenses = getFilteredExpenses();
    const total = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const count = filteredExpenses.length;
    
    totalAmount.textContent = `${currency}${total.toFixed(2)}`;
    expenseCount.textContent = count;
}

// Analytics Functions
function updateAnalytics() {
    const periodExpenses = getExpensesForPeriod(currentAnalyticsPeriod);
    
    const topCategory = getTopCategory(periodExpenses);
    const dailyAverage = getDailyAverage(periodExpenses, currentAnalyticsPeriod);
    const periodTotal = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    topCategoryEl.innerHTML = `
        <span class="category-name">${topCategory ? getCategoryDisplay(topCategory) : 'No data'}</span>
        <span class="category-amount">${currency}${topCategory ? periodExpenses.filter(exp => exp.category === topCategory).reduce((sum, exp) => sum + exp.amount, 0).toFixed(2) : '0'}</span>
    `;
    dailyAverageEl.textContent = `${currency}${dailyAverage.toFixed(2)}`;
    periodTotalEl.textContent = `${currency}${periodTotal.toFixed(2)}`;
    
    updateChart(periodExpenses);
}

// Get expenses for specific period
function getExpensesForPeriod(period) {
    const now = new Date();
    let startDate;
    
    switch (period) {
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    return expenses.filter(expense => new Date(expense.date) >= startDate);
}

// Get top spending category
function getTopCategory(periodExpenses) {
    if (periodExpenses.length === 0) return null;
    
    const categoryTotals = {};
    periodExpenses.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    
    return Object.keys(categoryTotals).reduce((a, b) => 
        categoryTotals[a] > categoryTotals[b] ? a : b
    );
}

// Calculate daily average
function getDailyAverage(periodExpenses, period) {
    if (periodExpenses.length === 0) return 0;
    
    const total = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    let days;
    
    switch (period) {
        case 'week':
            days = 7;
            break;
        case 'month':
            days = 30;
            break;
        case 'year':
            days = 365;
            break;
        default:
            days = 7;
    }
    
    return total / days;
}

// Update chart visualization
function updateChart(periodExpenses) {
    const ctx = expenseChart.getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }

    if (periodExpenses.length === 0) {
        ctx.canvas.parentNode.innerHTML = '<p class="no-data">No data available for this period</p>';
        return;
    }

    const categoryTotals = {};
    periodExpenses.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    const labels = Object.keys(categoryTotals).map(category => getCategoryDisplay(category));
    const data = Object.values(categoryTotals);
    const backgroundColors = [
        '#48bb78', // Green
        '#e53e3e', // Red
        '#2b6cb0', // Blue
        '#f6e05e', // Yellow
        '#9f7aea', // Purple
        '#ed8936', // Orange
        '#4fd1c5', // Teal
        '#ed64a6', // Pink
        '#a0aec0', // Gray
        '#68d391'  // Light Green
    ];

    chartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors.slice(0, labels.length),
                borderColor: '#fff',
                borderWidth: 1
            }]
        },
        options: {
            responsive: false,
            animation: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                        font: {
                            size: window.innerWidth <= 480 ? 14 : 16
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${currency}${context.raw.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

// Utility Functions
function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function getCategoryDisplay(category) {
    const categoryIcons = {
        'food': '🍕 Food & Dining',
        'transport': '🚗 Transportation',
        'entertainment': '🎬 Entertainment',
        'shopping': '🛍️ Shopping',
        'bills': '💡 Bills & Utilities',
        'health': '🏥 Healthcare',
        'education': '📚 Education',
        'other': '📦 Other'
    };
    return categoryIcons[category] || '📦 Other';
}

function showMessage(message, type = 'success') {
    if (!messageDiv) return;
    
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.add('show');
    
    setTimeout(() => {
        messageDiv.classList.remove('show');
    }, 3000);
}