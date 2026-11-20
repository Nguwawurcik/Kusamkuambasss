const LS_KEY = "ruang_cerita_data_v1";
const AUTH_KEY = "ruang_cerita_auth_v1";
// Hash SHA-256 dari password admin. Ganti dengan hash passwordmu sendiri.
// Cara membuat hash baru: buka console browser lalu jalankan
// crypto.subtle.digest('SHA-256', new TextEncoder().encode('passwordBaru')).then(b=>console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))
const PASSWORD_HASH = "2ab03ca7bd60606d722c96b9ab87d989006ff1c71a3742fa1296d0143efe2c93"; // default: "tokoku123"

let editingId = null;

async function sha256(text){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

async function checkAuth(){
  if(sessionStorage.getItem(AUTH_KEY) === '1'){
    document.getElementById('gate').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    return;
  }
  document.getElementById('gate').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
}

async function tryLogin(){
  const input = document.getElementById('gatePass');
  const err = document.getElementById('gateErr');
  const hash = await sha256(input.value);
  if(hash === PASSWORD_HASH){
    sessionStorage.setItem(AUTH_KEY, '1');
    err.classList.add('hidden');
    checkAuth();
  } else {
    err.classList.remove('hidden');
    input.value = '';
    input.focus();
  }
}

function load(){
  try{ return JSON.parse(localStorage.getItem(LS_KEY)) || []; }catch(e){ return []; }
}
function save(all){
  try{ localStorage.setItem(LS_KEY, JSON.stringify(all)); }catch(e){}
}
function fmtDate(ts){
  return new Date(ts).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'});
}
function excerpt(t){ return t.length>160 ? t.slice(0,160)+'…' : t; }

function show(id){
  document.getElementById('listView').classList.toggle('hidden', id!=='list');
  document.getElementById('editor').classList.toggle('hidden', id!=='editor');
  document.getElementById('reader').classList.toggle('hidden', id!=='reader');
}

function renderList(){
  const all = load().sort((a,b)=>b.updated-a.updated);
  const el = document.getElementById('listView');
  if(all.length===0){
    el.innerHTML = '<div class="empty">Belum ada cerita.<br>Klik "+ Cerita Baru" untuk mulai menulis.</div>';
    return;
  }
  el.innerHTML = all.map(s=>`
    <div class="card" onclick="openStory('${s.id}')">
      <h2>${escapeHtml(s.title||'(Tanpa judul)')}</h2>
      <div class="meta">Diperbarui ${fmtDate(s.updated)}</div>
      ${(s.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}
      <p>${escapeHtml(excerpt(s.body||''))}</p>
    </div>
  `).join('');
}

function escapeHtml(str){
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function goList(){ editingId=null; show('list'); renderList(); }

function newStory(){
  editingId = null;
  document.getElementById('f_title').value='';
  document.getElementById('f_tags').value='';
  document.getElementById('f_body').value='';
  show('editor');
}

function openStory(id){
  const s = load().find(x=>x.id===id);
  if(!s) return;
  document.getElementById('reader').innerHTML = `
    <span class="backlink" onclick="goList()">&larr; Kembali</span>
    <div class="title">${escapeHtml(s.title||'(Tanpa judul)')}</div>
    <div class="meta">Diperbarui ${fmtDate(s.updated)} &middot; ${(s.tags||[]).join(', ')}</div>
    <div class="body">${escapeHtml(s.body||'')}</div>
    <div class="toolbar">
      <button class="secondary" onclick="editStory('${s.id}')">Edit</button>
    </div>
  `;
  show('reader');
}

function editStory(id){
  const s = load().find(x=>x.id===id);
  if(!s) return;
  editingId = id;
  document.getElementById('f_title').value = s.title||'';
  document.getElementById('f_tags').value = (s.tags||[]).join(', ');
  document.getElementById('f_body').value = s.body||'';
  show('editor');
}

function saveStory(){
  const title = document.getElementById('f_title').value.trim();
  const body = document.getElementById('f_body').value;
  const tags = document.getElementById('f_tags').value.split(',').map(t=>t.trim()).filter(Boolean);
  if(!title && !body){ goList(); return; }
  let all = load();
  if(editingId){
    all = all.map(s=> s.id===editingId ? {...s, title, body, tags, updated:Date.now()} : s);
  } else {
    all.push({id: 'id_'+Date.now()+Math.random().toString(36).slice(2), title, body, tags, updated:Date.now(), created:Date.now()});
  }
  save(all);
  goList();
}

function deleteCurrent(){
  if(!editingId){ goList(); return; }
  if(!confirm('Hapus cerita ini?')) return;
  save(load().filter(s=>s.id!==editingId));
  goList();
}

document.getElementById('newBtn').addEventListener('click', newStory);

document.getElementById('gateBtn').addEventListener('click', tryLogin);
document.getElementById('gatePass').addEventListener('keydown', e=>{
  if(e.key === 'Enter') tryLogin();
});

checkAuth();
renderList();
