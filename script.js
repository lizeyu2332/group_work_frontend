const API_BASE_URL = "http://127.0.0.1:5001"; 

// 1. 获取并显示联系人
async function fetchContacts() {
    try {
        const res = await fetch(`${API_BASE_URL}/contacts`);
        if (!res.ok) throw new Error("后端连接失败");
        
        const contacts = await res.json();
        renderContacts(contacts);
    } catch (err) {
        console.error(err);
        document.getElementById('loading').innerText = "❌ 连接失败，请检查后端 5001 端口";
        document.getElementById('loading').style.color = "red";
    }
}

function renderContacts(contacts) {
    const list = document.getElementById('contacts-ul');
    list.innerHTML = '';
    
    // 隐藏加载提示
    const loadingTag = document.getElementById('loading');
    if(loadingTag) loadingTag.style.display = 'none';

    if (contacts.length === 0) {
        list.innerHTML = '<li style="text-align:center; color:#999; padding:20px;">暂无联系人，请在左侧添加</li>';
        return;
    }

    contacts.forEach(c => {
        const li = document.createElement('li');
        li.className = `contact-item ${c.is_bookmarked ? 'bookmarked' : ''}`;
        
        // 翻译联系方式类型
        const typeMap = { 'phone': '手机', 'email': '邮箱', 'address': '地址', 'social': '社交' };

        let detailsHtml = '';
        for (const [type, values] of Object.entries(c.methods)) {
            const typeName = typeMap[type] || type;
            detailsHtml += `<div class="detail-row"><span class="detail-label">${typeName}:</span> ${values.join(', ')}</div>`;
        }

        li.innerHTML = `
            <div class="contact-info">
                <span class="contact-name">${c.name}</span>
                <div class="contact-details">${detailsHtml}</div>
            </div>
            <div class="action-area">
                <button class="star-btn ${c.is_bookmarked ? 'active' : ''}" 
                        title="收藏/取消"
                        onclick="toggleBookmark(${c.id})">★</button>
                <button class="delete-btn" onclick="deleteContact(${c.id})">删除</button>
            </div>
        `;
        list.appendChild(li);
    });
}

// 2. 动态添加输入框
function addMethodField() {
    const container = document.getElementById('methods-container');
    const div = document.createElement('div');
    div.className = 'method-row';
    div.innerHTML = `
        <select class="method-type input-field">
            <option value="phone">手机</option>
            <option value="email">邮箱</option>
            <option value="address">地址</option>
            <option value="social">社交</option>
        </select>
        <input type="text" class="method-value input-field" placeholder="请输入号码/地址...">
        <button onclick="this.parentElement.remove()" class="btn btn-text" style="color:red; font-size:1.2rem;">&times;</button>
    `;
    container.appendChild(div);
}

// 3. 保存联系人
async function createContact() {
    const nameInput = document.getElementById('name');
    const name = nameInput.value;
    if (!name) return alert("⚠️ 请填写姓名！");

    const methods = [];
    document.querySelectorAll('.method-row').forEach(row => {
        const type = row.querySelector('.method-type').value;
        const value = row.querySelector('.method-value').value;
        if (value) methods.push({ type, value });
    });

    try {
        await fetch(`${API_BASE_URL}/contacts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, methods })
        });
        
        // 重置表单
        nameInput.value = '';
        document.getElementById('methods-container').innerHTML = `
            <div class="method-row">
                <select class="method-type input-field"><option value="phone">手机</option><option value="email">邮箱</option><option value="address">地址</option><option value="social">社交</option></select>
                <input type="text" class="method-value input-field" placeholder="请输入号码/地址...">
            </div>`;
        fetchContacts();
    } catch (e) {
        alert("保存失败，请检查后端服务。");
    }
}

// 4. 删除
async function deleteContact(id) {
    if(!confirm('确定要删除这位联系人吗？')) return;
    await fetch(`${API_BASE_URL}/contacts/${id}`, { method: 'DELETE' });
    fetchContacts();
}

// 5. 收藏
async function toggleBookmark(id) {
    await fetch(`${API_BASE_URL}/contacts/${id}/bookmark`, { method: 'PUT' });
    fetchContacts();
}

// 6. 导出
function exportFile() {
    window.location.href = `${API_BASE_URL}/export`;
}

// 7. 导入
async function importFile() {
    const input = document.getElementById('fileInput');
    if (!input.files[0]) return;

    const formData = new FormData();
    formData.append('file', input.files[0]);

    try {
        const res = await fetch(`${API_BASE_URL}/import`, {
            method: 'POST',
            body: formData
        });
        if (res.ok) {
            alert('✅ 导入成功！');
            fetchContacts();
        } else {
            alert('❌ 导入失败');
        }
    } catch (e) {
        alert('导入出错，请检查文件格式。');
    }
    input.value = ''; 
}

// 初始化加载
fetchContacts();
