/* Shared experiment notebook and accessible particle workbench. */
(() => {
  'use strict';
  function create(api, options = {}) {
    const { h } = api;
    const visual = h('div', { class: 'lab-visual', html: options.svg || '' });
    const controls = h('div', { class: 'lab-controls' });
    const noteText = h('p', { class: 'lab-observation', role: 'status', 'aria-live': 'polite' });
    const scene = h('section', { class: 'panel lab-scene', 'aria-label': options.title || '实验场景' },
      h('div', { class: 'eyebrow' }, '观察与操作'), h('h3', { class: 'panel-title' }, options.title || '实验台'), visual, controls, noteText);
    const taskTitle = h('h3', { class: 'panel-title' }, '先观察，再记录');
    const notes = h('div', { class: 'lab-notes' }, h('p', { class: 'small muted' }, '操作实验台，比较每种选择带来的变化，再完成记录任务。'));
    const notebook = h('section', { class: 'panel lab-notebook', 'aria-label': '探险记录本' }, h('div', { class: 'eyebrow' }, '探险记录本'), taskTitle, notes);
    api.stage.append(h('div', { class: 'course-lab' }, scene, notebook));
    return {
      scene, visual, controls, notes,
      setTask(title, html) { taskTitle.textContent = title; notes.replaceChildren(); if (html) notes.append(h('p', { html })); api.hint(title); return notes; },
      note(text) { noteText.textContent = text; },
      setSVG(svg) { visual.innerHTML = svg; }
    };
  }
  async function atom(api, { z, n, label }) {
    const { h } = api;
    const model = { p: 0, n: 0, e: 0 };
    const lab = create(api, { title: '粒子工作台 · ' + label });
    lab.setTask('亲手拼出一个中性原子', `目标核素：<b>${label}</b>。质子数决定元素身份，中子数决定这里展示的核素；中性原子的电子数等于质子数。`);
    const counts = h('div', { class: 'atom-counts', role: 'status', 'aria-live': 'polite' });
    const tray = h('div', { class: 'atom-tray' });
    const zones = [h('button', { type: 'button', class: 'dropzone atom-zone', 'aria-label': '放入原子核' }, '原子核：放质子或中子'), h('button', { type: 'button', class: 'dropzone atom-zone', 'aria-label': '放入核外电子层' }, '核外：放电子')];
    const check = h('button', { type: 'button', class: 'btn btn-primary' }, '检查这个原子');
    const reset = h('button', { type: 'button', class: 'btn' }, '重新拼');
    const feedback = h('p', { class: 'atom-feedback', role: 'status' });
    const names = { p: '质子', n: '中子', e: '电子' };
    const chips = [];
    lab.controls.append(tray, h('div', { class: 'atom-zones' }, zones), counts, h('div', { class: 'btn-row' }, check, reset), feedback);
    lab.note('原子结构示意图，粒子大小、位置和电子轨道不按真实比例。');
    function render() {
      const dot = (x, y, kind) => `<circle cx="${x}" cy="${y}" r="9" fill="var(--${kind === 'p' ? 'coral' : kind === 'n' ? 'mint' : 'aqua'})" stroke="var(--card)" stroke-width="2"/>`;
      const nucleus = [];
      ['p','n'].forEach((kind, j) => { for(let i=0;i<model[kind];i++) nucleus.push(dot(153+(i%4)*17,108+Math.floor(i/4)*18+j*8,kind)); });
      const electrons = [];
      for(let i=0;i<model.e;i++) { const outer=i>=2; const a=(outer?(i-2)/Math.max(1,model.e-2):i/Math.max(1,Math.min(2,model.e)))*Math.PI*2-Math.PI/2; const r=outer?99:67; electrons.push(dot(180+Math.cos(a)*r,130+Math.sin(a)*r,'e')); }
      lab.setSVG(`<svg viewBox="0 0 360 260" role="img" aria-label="${model.p}个质子、${model.n}个中子、${model.e}个电子"><circle cx="180" cy="130" r="99" fill="none" stroke="var(--line)" stroke-dasharray="4 5"/><circle cx="180" cy="130" r="67" fill="none" stroke="var(--glass-stroke)"/><circle cx="180" cy="130" r="41" fill="var(--aqua-soft)"/>${nucleus.join('')}${electrons.join('')}</svg>`);
      const identity = ['未成元素','氢','氦','锂','铍','硼','碳','氮','氧','氟','氖'][model.p] || '其他元素';
      counts.textContent = `质子 ${model.p} · 中子 ${model.n} · 电子 ${model.e} ｜ 身份：${identity} ｜ 电荷：${model.p-model.e > 0 ? '+' : ''}${model.p-model.e}`;
    }
    let solved = false;
    ['p','n','e'].forEach(kind => {
      const chip=h('button',{type:'button',class:'chip atom-chip','aria-label':'选取一个'+names[kind]},names[kind]);
      tray.append(chip); chips.push(chip);
      api.draggable(chip,{zones,disabled:()=>solved,onDrop(zone){
        const expected=kind==='e'?zones[1]:zones[0];
        if(zone!==expected) { api.mistake(names[kind]+(kind==='e'?'在核外，不放进原子核。':'属于原子核，不放在核外。')); return false; }
        if(model[kind]>=10) { api.toast('这里最多放10个，请先重新拼。','info'); return false; }
        model[kind]++; feedback.textContent=''; api.sfx('pop'); render(); return true;
      }});
    });
    reset.addEventListener('click',()=>{ if(solved)return; model.p=model.n=model.e=0; feedback.textContent=''; render(); });
    api.hint('先点一种粒子，再点原子核或核外；每放一个，都观察身份和电荷。');
    render();
    await api.task(resolve => {
      check.addEventListener('click',()=>{
        if(solved)return;
        if(model.p!==z || model.n!==n || model.e!==z) {
          api.mistake();
          feedback.textContent=model.p!==z?`${label}需要${z}个质子；改变质子数会变成另一种元素。`:model.n!==n?`这里指定${label}，需要${n}个中子；不同核素的中子数可以不同。`:`要成为中性原子，电子也需要${z}个，正负电荷才抵消。`;
          api.hint(feedback.textContent,'serious'); return;
        }
        solved=true; check.disabled=reset.disabled=true;
        chips.forEach(chip=>{chip.disabled=true;chip.classList.add('locked');});
        feedback.textContent=`完成！${label}含${z}个质子、${n}个中子和${z}个电子。`;
        api.good(); resolve();
      });
    });
    return lab;
  }
  window.H2.Lab = { create, atom };
})();
