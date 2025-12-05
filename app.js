// app.js

// ================= 配置区域 =================
// 请在这里填入你的维格表信息
const VIKA_TOKEN = "uskbGKjMFVTQSMPlyvGURLQ"; 
const DATASHEET_ID = "dst5q31ZpReWopRTdT";    
// ===========================================

// 状态变量
let allData = []; // 存放当前用户的所有数据
let currentUser = localStorage.getItem('plan_user') || 'Miao'; // 默认用户
let currentDate = new Date(); // 当前选中的日期对象
let currentTab = 'daily'; // 'daily' 或 'all'

// DOM 元素
const listContainer = document.getElementById('todo-list');
const dateTitle = document.getElementById('date-title');
const dateSubtitle = document.getElementById('date-subtitle');
const datePicker = document.getElementById('hidden-date-picker');
const input = document.getElementById('new-task-input');
const inputArea = document.getElementById('input-area');
const dateNavContainer = document.getElementById('date-nav-container');

// 初始化
init();

function init() {
    updateUserUI();
    updateDateUI();
    fetchTodos(); // 拉取数据
    
    // 监听日期选择器变化
    datePicker.addEventListener('change', (e) => {
        const parts = e.target.value.split('-');
        // 解决时区问题，显式构造
        currentDate = new Date(parts[0], parts[1] - 1, parts[2]);
        updateDateUI();
        render();
    });
}

// --- 逻辑控制 ---

function switchUser(user) {
    if (currentUser === user) return;
    currentUser = user;
    localStorage.setItem('plan_user', user); 
    updateUserUI();
    fetchTodos(); 
}

function changeDate(delta) {
    currentDate.setDate(currentDate.getDate() + delta);
    updateDateUI();
    if(currentTab === 'daily') render();
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-item').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');

    if (tab === 'all') {
        inputArea.classList.add('hidden'); 
        date
