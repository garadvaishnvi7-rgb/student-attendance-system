(() => {
  const KEY = 'attendease.students.v1', RECORD_KEY = 'attendease.records.v1';
  const $ = id => document.getElementById(id);
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  let students = read(KEY, []), records = read(RECORD_KEY, []), draft = {};
  const today = new Date(); const localDate = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  $('attendanceDate').value = localDate(today); $('recordDate').value = localDate(today);
  $('todayLabel').textContent = today.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',year:'numeric'});
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const save = () => { localStorage.setItem(KEY, JSON.stringify(students)); localStorage.setItem(RECORD_KEY, JSON.stringify(records)); };
  let toastTimer;
  function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2400);}
  function classes(){return [...new Set(students.map(s=>s.studentClass).filter(Boolean))].sort();}
  function updateClassFilter(){const sel=$('classFilter'), old=sel.value;sel.innerHTML='<option value="">All classes</option>'+classes().map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');if(classes().includes(old))sel.value=old;}
  function renderStudents(){
    const q=$('studentSearch').value.trim().toLowerCase();
    const filtered=students.filter(s=>[s.rollNo,s.name,s.studentClass,s.section].join(' ').toLowerCase().includes(q));
    $('studentRows').innerHTML=filtered.map(s=>`<tr><td>${esc(s.rollNo)}</td><td><strong>${esc(s.name)}</strong></td><td>${esc(s.studentClass)}</td><td>${esc(s.section||'—')}</td><td><button class="action-btn" data-delete="${esc(s.id)}">Remove</button></td></tr>`).join('');
    $('studentEmpty').hidden=filtered.length>0;$('studentCount').textContent=`${students.length} student${students.length===1?'':'s'}`;
    updateClassFilter();renderAttendance();renderStats();
  }
  function renderAttendance(){
    const date=$('attendanceDate').value, cls=$('classFilter').value;
    const list=students.filter(s=>!cls||s.studentClass===cls);
    list.forEach(s=>{const rec=records.find(r=>r.studentId===s.id&&r.date===date);draft[s.id]=draft[s.id]|| (rec?rec.status:'Present');});
    // Reset draft to saved statuses when date changes, while preserving unsaved changes on current date.
    $('attendanceList').innerHTML=list.map(s=>`<div class="attendance-row"><div class="student-ident"><strong>${esc(s.name)}</strong><small>Roll ${esc(s.rollNo)} · ${esc(s.studentClass)}${s.section?' · '+esc(s.section):''}</small></div>${['Present','Absent','Late'].map(st=>`<button type="button" class="status-option ${draft[s.id]===st?'selected '+st.toLowerCase():''}" data-student="${esc(s.id)}" data-status="${st}">${st}</button>`).join('')}</div>`).join('');
    $('attendanceEmpty').hidden=list.length>0;
  }
  function renderStats(){
    const date=$('attendanceDate').value;const todays=records.filter(r=>r.date===date);
    const count=st=>todays.filter(r=>r.status===st).length;
    $('totalStudents').textContent=students.length;$('presentToday').textContent=count('Present');$('absentToday').textContent=count('Absent');
    $('attendanceRate').textContent=todays.length?`${Math.round(count('Present')/todays.length*100)}%`:'—';
  }
  function renderRecords(){
    const date=$('recordDate').value, status=$('recordStatus').value;
    const rows=records.filter(r=>(!date||r.date===date)&&(!status||r.status===status)).sort((a,b)=>b.date.localeCompare(a.date)||a.rollNo.localeCompare(b.rollNo));
    $('recordRows').innerHTML=rows.map(r=>`<tr><td>${esc(r.date)}</td><td>${esc(r.rollNo)}</td><td>${esc(r.name)}</td><td>${esc(r.studentClass)}</td><td><span class="badge ${r.status.toLowerCase()}">${esc(r.status)}</span></td></tr>`).join('');
    $('recordEmpty').hidden=rows.length>0;
  }
  function refresh(){renderStudents();renderRecords();}
  $('studentForm').addEventListener('submit',e=>{
    e.preventDefault();const rollNo=$('rollNo').value.trim(),name=$('studentName').value.trim(),studentClass=$('studentClass').value.trim(),section=$('section').value.trim();
    if(students.some(s=>s.rollNo.toLowerCase()===rollNo.toLowerCase()&&s.studentClass.toLowerCase()===studentClass.toLowerCase())){toast('This roll number already exists in that class.');return;}
    students.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random()),rollNo,name,studentClass,section});save();e.target.reset();refresh();toast('Student added successfully.');
  });
  $('studentRows').addEventListener('click',e=>{const btn=e.target.closest('[data-delete]');if(!btn)return;const s=students.find(x=>x.id===btn.dataset.delete);if(!s)return;if(!confirm(`Remove ${s.name}? Their saved attendance records will also be removed.`))return;students=students.filter(x=>x.id!==s.id);records=records.filter(r=>r.studentId!==s.id);delete draft[s.id];save();refresh();toast('Student removed.');});
  $('studentSearch').addEventListener('input',renderStudents);
  $('attendanceList').addEventListener('click',e=>{const b=e.target.closest('[data-student]');if(!b)return;draft[b.dataset.student]=b.dataset.status;renderAttendance();});
  $('attendanceDate').addEventListener('change',()=>{draft={};renderAttendance();renderStats();});
  $('classFilter').addEventListener('change',renderAttendance);
  $('setAllPresent').addEventListener('click',()=>{students.filter(s=>!$('classFilter').value||s.studentClass===$('classFilter').value).forEach(s=>draft[s.id]='Present');renderAttendance();toast('Visible students set to Present. Save to keep changes.');});
  $('attendanceForm').addEventListener('submit',e=>{
    e.preventDefault();const date=$('attendanceDate').value;if(!date){toast('Please choose a date.');return;}
    const list=students.filter(s=>!$('classFilter').value||s.studentClass===$('classFilter').value);
    if(!list.length){toast('Add students before marking attendance.');return;}
    list.forEach(s=>{records=records.filter(r=>!(r.studentId===s.id&&r.date===date));records.push({studentId:s.id,rollNo:s.rollNo,name:s.name,studentClass:s.studentClass,date,status:draft[s.id]||'Present'});});
    save();renderRecords();renderStats();toast(`Attendance saved for ${list.length} student(s).`);
  });
  $('recordDate').addEventListener('change',renderRecords);$('recordStatus').addEventListener('change',renderRecords);
  function exportCSV(){
    const rows=[['Date','Roll Number','Student Name','Class','Section','Status']];
    records.slice().sort((a,b)=>a.date.localeCompare(b.date)).forEach(r=>{const s=students.find(s=>s.id===r.studentId);rows.push([r.date,r.rollNo,r.name,r.studentClass,s?.section||'',r.status]);});
    const csv=rows.map(row=>row.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\r\n');
    const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`attendance-records-${localDate(new Date())}.csv`;a.click();URL.revokeObjectURL(url);toast('CSV export downloaded.');
  }
  $('exportTop').addEventListener('click',exportCSV);$('exportRecords').addEventListener('click',exportCSV);
  document.querySelectorAll('.nav-link').forEach(link=>link.addEventListener('click',()=>{document.querySelectorAll('.nav-link').forEach(a=>a.classList.remove('active'));link.classList.add('active');}));
  refresh();
})();