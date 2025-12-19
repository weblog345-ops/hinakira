// データ構造
let clips = [];
let folders = [{ id: 'default', name: '未分類' }];
let currentFolder = 'all';

// DOM要素
const clipsList = document.getElementById('clipsList');
const folderTabs = document.querySelector('.folder-tabs');
const addBtn = document.getElementById('addBtn');
const addFolderBtn = document.getElementById('addFolderBtn');
const addModal = document.getElementById('addModal');
const folderModal = document.getElementById('folderModal');
const clipText = document.getElementById('clipText');
const clipFolder = document.getElementById('clipFolder');
const folderName = document.getElementById('folderName');

// 初期化
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  renderFolderTabs();
  renderClips();
  renderFolderSelect();
});

// データ読み込み
async function loadData() {
  const data = await chrome.storage.local.get(['clips', 'folders']);
  clips = data.clips || [];
  folders = data.folders || [{ id: 'default', name: '未分類' }];
}

// データ保存
async function saveData() {
  await chrome.storage.local.set({ clips, folders });
}

// フォルダタブ描画
function renderFolderTabs() {
  folderTabs.innerHTML = `
    <button class="folder-tab ${currentFolder === 'all' ? 'active' : ''}" data-folder="all">すべて</button>
    ${folders.map(f => `
      <button class="folder-tab ${currentFolder === f.id ? 'active' : ''}" data-folder="${f.id}">
        ${escapeHtml(f.name)}
      </button>
    `).join('')}
  `;

  // タブクリックイベント
  folderTabs.querySelectorAll('.folder-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentFolder = tab.dataset.folder;
      renderFolderTabs();
      renderClips();
    });
  });
}

// フォルダ選択ボックス描画
function renderFolderSelect() {
  clipFolder.innerHTML = folders.map(f =>
    `<option value="${f.id}">${escapeHtml(f.name)}</option>`
  ).join('');
}

// クリップ一覧描画
function renderClips() {
  const filteredClips = currentFolder === 'all'
    ? clips
    : clips.filter(c => c.folderId === currentFolder);

  if (filteredClips.length === 0) {
    clipsList.innerHTML = `
      <div class="empty-state">
        <p>クリップがありません</p>
        <p>+ボタンで追加</p>
      </div>
    `;
    return;
  }

  clipsList.innerHTML = filteredClips.map(clip => {
    const folder = folders.find(f => f.id === clip.folderId);
    return `
      <div class="clip-item" data-id="${clip.id}">
        <div class="clip-content">
          <div class="clip-text">${escapeHtml(clip.text)}</div>
          ${currentFolder === 'all' && folder ? `<div class="folder-badge">${escapeHtml(folder.name)}</div>` : ''}
        </div>
        <div class="clip-actions">
          <button class="clip-btn copy" title="コピー">📋</button>
          <button class="clip-btn delete" title="削除">×</button>
        </div>
      </div>
    `;
  }).join('');

  // イベント設定
  clipsList.querySelectorAll('.clip-item').forEach(item => {
    const id = item.dataset.id;

    // クリックでコピー
    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('clip-btn')) {
        copyClip(id);
      }
    });

    // コピーボタン
    item.querySelector('.copy').addEventListener('click', () => copyClip(id));

    // 削除ボタン
    item.querySelector('.delete').addEventListener('click', () => deleteClip(id));
  });
}

// クリップをコピー
async function copyClip(id) {
  const clip = clips.find(c => c.id === id);
  if (clip) {
    await navigator.clipboard.writeText(clip.text);
    showToast('コピーしました');
  }
}

// クリップを削除
async function deleteClip(id) {
  clips = clips.filter(c => c.id !== id);
  await saveData();
  renderClips();
}

// 新規クリップ追加
async function addClip(text, folderId) {
  const clip = {
    id: Date.now().toString(),
    text: text.trim(),
    folderId,
    createdAt: new Date().toISOString()
  };
  clips.unshift(clip);
  await saveData();
  renderClips();
}

// 新規フォルダ追加
async function addFolder(name) {
  const folder = {
    id: Date.now().toString(),
    name: name.trim()
  };
  folders.push(folder);
  await saveData();
  renderFolderTabs();
  renderFolderSelect();
}

// トースト表示
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 1500);
}

// HTMLエスケープ
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// モーダル制御
addBtn.addEventListener('click', () => {
  addModal.classList.remove('hidden');
  clipText.focus();
});

addFolderBtn.addEventListener('click', () => {
  folderModal.classList.remove('hidden');
  folderName.focus();
});

document.getElementById('cancelAdd').addEventListener('click', () => {
  addModal.classList.add('hidden');
  clipText.value = '';
});

document.getElementById('cancelFolder').addEventListener('click', () => {
  folderModal.classList.add('hidden');
  folderName.value = '';
});

document.getElementById('saveClip').addEventListener('click', async () => {
  const text = clipText.value.trim();
  if (text) {
    await addClip(text, clipFolder.value);
    addModal.classList.add('hidden');
    clipText.value = '';
  }
});

document.getElementById('saveFolder').addEventListener('click', async () => {
  const name = folderName.value.trim();
  if (name) {
    await addFolder(name);
    folderModal.classList.add('hidden');
    folderName.value = '';
  }
});

// Enterキーでの保存
clipText.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    document.getElementById('saveClip').click();
  }
});

folderName.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('saveFolder').click();
  }
});

// モーダル外クリックで閉じる
addModal.addEventListener('click', (e) => {
  if (e.target === addModal) {
    addModal.classList.add('hidden');
    clipText.value = '';
  }
});

folderModal.addEventListener('click', (e) => {
  if (e.target === folderModal) {
    folderModal.classList.add('hidden');
    folderName.value = '';
  }
});
