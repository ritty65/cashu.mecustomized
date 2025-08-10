import { test, expect } from '@playwright/test';

test('subscribers dashboard interactions', async ({ page }) => {
  await page.setContent(`
    <div id="toolbar">
      <button id="btn-filter">Filters</button>
      <button id="btn-refresh">Refresh</button>
      <button id="btn-export">Export</button>
    </div>
    <div id="tabs">
      <button data-tab="all">All <span class="count"></span></button>
      <button data-tab="weekly">Weekly <span class="count"></span></button>
    </div>
    <button id="density">Density</button>
    <table id="table"><tbody></tbody></table>
    <div id="drawer" hidden>
      <div id="drawer-tabs">
        <button data-tab="payments">Payments</button>
        <button data-tab="notes">Notes</button>
      </div>
      <div id="panel-payments">Payment list</div>
      <div id="panel-notes" hidden><textarea id="note"></textarea></div>
    </div>
    <script>
      const rows = [
        {id:1,name:'Alice',frequency:'weekly'},
        {id:2,name:'Bob',frequency:'weekly'},
        {id:3,name:'Carol',frequency:'monthly'},
        {id:4,name:'Dave',frequency:'monthly'}
      ];
      const tbody = document.querySelector('#table tbody');
      let tab='all';
      function render(){
        tbody.innerHTML='';
        rows.filter(r=>tab==='all'||r.frequency===tab).forEach(r=>{
          const tr=document.createElement('tr');
          tr.textContent=r.name;
          tr.style.height=document.body.classList.contains('compact')?'40px':'56px';
          tr.addEventListener('click',()=>document.getElementById('drawer').hidden=false);
          tbody.appendChild(tr);
        });
        document.querySelector('#tabs button[data-tab="all"] .count').textContent=rows.length;
        document.querySelector('#tabs button[data-tab="weekly"] .count').textContent=rows.filter(r=>r.frequency==='weekly').length;
      }
      document.getElementById('tabs').addEventListener('click',e=>{if(e.target.dataset.tab){tab=e.target.dataset.tab;render();}});
      document.getElementById('density').addEventListener('click',()=>{document.body.classList.toggle('compact');render();});
      render();
      const note=document.getElementById('note');
      note.value=localStorage.getItem('note')||'';
      note.addEventListener('input',()=>localStorage.setItem('note',note.value));
      document.getElementById('drawer-tabs').addEventListener('click',e=>{
        if(e.target.dataset.tab){
          document.getElementById('panel-payments').hidden=e.target.dataset.tab!=='payments';
          document.getElementById('panel-notes').hidden=e.target.dataset.tab!=='notes';
        }
      });
    </script>
  `);

  await expect(page.locator('#btn-filter')).toBeVisible();
  await expect(page.locator('#btn-refresh')).toBeVisible();
  await expect(page.locator('#btn-export')).toBeVisible();

  await page.click('#tabs button[data-tab="weekly"]');
  await expect(page.locator('#tabs button[data-tab="weekly"] .count')).toHaveText('2');

  await page.click('#density');
  const height = await page.locator('#table tbody tr').first().evaluate(el=>el.offsetHeight);
  expect(height).toBeLessThan(56);

  await page.click('#table tbody tr:first-child');
  await page.click('#drawer-tabs button[data-tab="payments"]');
  await page.click('#drawer-tabs button[data-tab="notes"]');
  await page.fill('#note','hello');
  await page.reload();
  await expect(page.locator('#note')).toHaveValue('hello');
});
