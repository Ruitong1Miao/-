// ================= 配置区域 =================
// 你的 Token
const VIKA_TOKEN = "uskbGKjMFVTQSMPlyvGURLQ"; 
// 你的 Datasheet ID
const DATASHEET_ID = "dst5q31ZpReWopRTdT";   
// 你的 View ID
const VIEW_ID = "viwXgJWMhB9R5"; 
// ===========================================

const listContainer = document.getElementById('todo-list');
const input = document.getElementById('new-task-input');
const addBtn = document.getElementById('add-btn');
const dateSpan = document.getElementById('current-date');
const emptyState = document.getElementById('empty-state');
const progressCircle = document.getElementById('progress-circle');

// 内存中的数据缓存
let todos = [];

// 设置日期
const today = new Date();
dateSpan.textContent = `${today.getMonth() + 1}月${today.getDate()}日`;

// --- 核心：与维格表通信 ---

// 1. 获取数据
async function fetchTodos() {
    try {
        const url = `https://api.vika.cn/fusion/v1/datasheets/${DATASHEET_ID}/records?viewId=${VIEW_ID}`;
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${VIKA_TOKEN}` }
        });
        const json = await response.json();
        
        if (json.success) {
            todos = json.data.records.map(record => ({
                id: record.recordId,
                // 注意：这里必须和你的维格表列名一致
                text: record.fields['标题'] || '无标题任务', 
                completed: record.fields['状态'] === true 
            }));
            render();
        } else {
            console.error("维格表错误:", json.message);
            // 如果报错，可能是列名不对，或者是Token不对
            if(json.code === 400) alert("请检查维格表列名是否为'标题'和'状态'");
        }
    } catch (error) {
        console.error("网络错误", error);
        listContainer.innerHTML = '<div style="text-align:center;color:red;margin-top:20px;">网络连接失败</div>';
    }
}

// 2. 添加数据
async function addCloudTodo(text) {
    const url = `https://api.vika.cn/fusion/v1/datasheets/${DATASHEET_ID}/records`;
    const body = {
        records: [{
            fields: {
                '标题': text,
                '状态': false
            }
        }]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${VIKA_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        const json = await response.json();
        if(json.success) {
            // 用云端返回的真实ID替换临时ID，防止刚添加就删除会报错
            const realId = json.data.records[0].recordId;
            const tempItem = todos.find(t => t.text === text && t.id === 'temp');
            if(tempItem) tempItem.id = realId;
        }
    } catch(e) { console.error("添加失败", e); }
}

// 3. 更新状态
async function updateCloudTodo(id, completed) {
    const url = `https://api.vika.cn/fusion/v1/datasheets/${DATASHEET_ID}/records?recordId=${id}`;
    const body = {
        records: [{
            recordId: id,
            fields: { '状态': completed }
        }]
    };
    
    await fetch(url, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${VIKA_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
}

// 4. 删除数据
async function deleteCloudTodo(id) {
    const url = `https://api.vika.cn/fusion/v1/datasheets/${DATASHEET_ID}/records?recordIds=${id}`;
    await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${VIKA_TOKEN}` }
    });
}

// --- 界面逻辑 ---

function render() {
    listContainer.innerHTML = '';
    
    if (todos.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
    }

    // 排序：未完成的在前
    todos.sort((a, b) => a.completed - b.completed);

    todos.forEach((todo, index) => {
        const item = document.createElement('div');
        item.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        
        item.innerHTML = `
            <div class="checkbox" onclick="toggleComplete('${todo.id}', ${index})"></div>
            <span class="item-text">${todo.text}</span>
            <div class="delete-btn" onclick="deleteTask('${todo.id}')">删除</div>
        `;
        listContainer.appendChild(item);
    });

    updateProgress();
}

// 用户点击添加
function addTask() {
    const text = input.value.trim();
    if (text) {
        // 1. 界面立即显示（为了快）
        todos.unshift({ id: 'temp', text: text, completed: false });
        render();
        input.value = '';
        
        // 2. 后台慢慢上传
        addCloudTodo(text);
    }
}

// 用户点击勾选
window.toggleComplete = function(id, index) {
    // 1. 界面立即变化
    todos[index].completed = !todos[index].completed;
    render();
    
    // 2. 后台同步
    if (id !== 'temp') {
        updateCloudTodo(id, todos[index].completed);
    }
}

// 用户点击删除
window.deleteTask = function(id) {
    if(confirm('确认删除该任务吗？')) {
        // 1. 界面立即删除
        todos = todos.filter(t => t.id !== id);
        render();
        
        // 2. 后台同步
        if (id !== 'temp') {
            deleteCloudTodo(id);
        }
    }
}

// 更新右上角进度圈
function updateProgress() {
    if (todos.length === 0) {
        progressCircle.style.strokeDashoffset = 75.36; 
        return;
    }
    const completedCount = todos.filter(t => t.completed).length;
    const percentage = completedCount / todos.length;
    // 进度圈总长 75.36
    const offset = 75.36 - (75.36 * percentage);
    progressCircle.style.strokeDashoffset = offset;
}

// 绑定回车键和点击事件
addBtn.addEventListener('click', addTask);
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

// 启动程序！
fetchTodos();