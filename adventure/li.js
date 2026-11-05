/* Lithium adventure — six original scenes, sharing Qingqing's H2 notebook engine. */
(function () {
  'use strict';
  const H2 = window.H2;
  const SVG = (body, label) => `<svg viewBox="0 0 520 330" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  const txt = (x, y, text, extra = '') => `<text x="${x}" y="${y}" text-anchor="middle" ${extra}>${text}</text>`;
  function css(id) {
    const p = '.lv-' + id;
    return `${p} .li-lab{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:16px;align-items:start;}
${p} .li-bench,${p} .li-notebook{min-width:0;}
${p} .li-visual{width:100%;margin:8px auto 12px;max-width:560px;}
${p} .li-visual svg{display:block;width:100%;height:auto;overflow:visible;}
${p} svg text{font-family:var(--f-body);font-size:21px;fill:var(--ink);}
${p} svg .li-small{font-size:13px;fill:var(--ink-2);}
${p} svg .li-num{font-family:var(--f-num);font-size:28px;font-weight:800;}
${p} .li-controls{display:flex;flex-wrap:wrap;gap:8px;}
${p} .li-controls .btn{flex:1 1 auto;min-height:44px;}
${p} .li-record{margin:12px 0;display:grid;gap:7px;font-size:14px;}
${p} .li-record p{padding:6px 9px;background:var(--aqua-soft);border-radius:8px;}
${p} .li-note{font-size:12px;line-height:1.6;color:var(--ink-3);margin-top:10px;}
${p} .li-readout{padding:12px;background:var(--aqua-soft);border-radius:12px;margin:10px 0;line-height:1.7;}
${p} .li-cert{border:2px solid var(--aqua);background:var(--card);padding:22px;border-radius:16px;text-align:center;}
${p} .li-cert h3{font-family:var(--f-display);font-size:24px;color:var(--aqua-ink);}
${p} .li-cert input{max-width:100%;width:220px;min-height:44px;border:1.5px solid var(--line);border-radius:8px;background:var(--paper);padding:8px;}
${p} .li-cert ul{text-align:left;padding-left:22px;}
@media(max-width:760px){${p} .li-lab{grid-template-columns:minmax(0,1fr);}${p} .li-visual{max-width:440px;}}
`;
  }
  function lab(api, title, markup) {
    const h = api.h;
    const visual = h('div', { class: 'li-visual', html: markup });
    const controls = h('div', { class: 'li-controls' });
    const taskTitle = h('h3', { class: 'panel-title' });
    const task = h('div');
    const record = h('div', { class: 'li-record', 'aria-live': 'polite' });
    const readout = h('div', { class: 'li-readout', role: 'status', 'aria-live': 'polite' });
    const scene = h('section', { class: 'panel li-bench', 'aria-label': title }, h('div', { class: 'eyebrow' }, '探索台'), h('h3', { class: 'panel-title' }, title), visual, controls, readout);
    const notebook = h('section', { class: 'panel li-notebook', 'aria-label': '实验记录本' }, h('div', { class: 'eyebrow' }, '实验记录本'), taskTitle, task, record);
    api.stage.append(h('div', { class: 'li-lab' }, scene, notebook));
    return { visual, controls, task, record, readout, scene,
      setTask(titleText) { taskTitle.textContent = titleText; task.innerHTML = ''; return task; },
      draw(markup2) { visual.innerHTML = markup2; },
      note(text) { readout.textContent = text; },
      caption(text) { scene.append(h('p', { class: 'li-note' }, text)); }
    };
  }
  const samples = [
    { sym: 'Li', name: '锂', density: 0.534, color: 'var(--mint)' },
    { sym: 'Al', name: '铝', density: 2.70, color: 'var(--glass-stroke)' },
    { sym: 'Fe', name: '铁', density: 7.87, color: 'var(--ink-2)' }
  ];
  function scaleSVG(sample, measured) {
    const bar = measured ? Math.max(10, sample.density / 7.87 * 260) : 0;
    return SVG(`<path d="M54 245H466" stroke="var(--line)" stroke-width="3"/>
<rect x="90" y="195" width="200" height="50" rx="12" fill="var(--aqua-soft)" stroke="var(--aqua)" stroke-width="2"/>
<path d="M75 192H305" stroke="var(--glass-stroke)" stroke-width="5"/>
<path d="M148 177v-67l52-24 51 24v67l-51 23Z" fill="${sample.color}" stroke="var(--ink-2)" stroke-width="2"/>
<path d="m148 110 52 24 51-24M200 134v66" fill="none" stroke="var(--paper)" stroke-width="2"/>
${txt(200, 164, sample.sym, 'class="li-num"')}${txt(190, 227, measured ? (sample.density * 10).toFixed(2) + ' g' : '等待称量')}
${txt(380, 116, '体积统一')}${txt(380, 146, '10 cm³', 'class="li-num"')}
<rect x="120" y="280" width="280" height="13" rx="6" fill="var(--paper-2)"/>
<rect x="120" y="280" width="${bar}" height="13" rx="6" fill="var(--aqua)"/>
${txt(260, 317, '相同体积下的质量比较', 'class="li-small"')}`, `${sample.name}的虚拟称量台`);
  }
  H2.registerLevel({
    id: 'li-light', order: 1, title: '谁是轻量冠军', subtitle: '同样大小，质量会一样吗？', css: css('li-light'),
    card: { title: '密度与轻金属', points: ['比较材料轻重时，应先固定<b>体积</b>。', '室温下锂的密度约为 <b>0.534 g/cm³</b>，是密度最小的金属。', '低密度不等于任意用途都合适，还要考虑强度、反应性等条件。'] },
    async run(api) {
      api.steps(['预测', '称量', '比较', '记录']); api.step(0);
      const L = lab(api, '等体积称量台', scaleSVG(samples[0], false));
      L.caption('数值按室温密度 × 10 cm³ 计算；画面是教学示意，不是真实测量。锂会与水反应，不在家中取样实验。');
      await api.say('我是氢氢！这次给探险车减重。先让三块金属站上同一条起跑线。');
      api.hint('先预测，再把三种等体积金属分别放上虚拟秤。');
      await api.choice({ container: L.setTask('先做一个预测'), q: '体积都是 10 cm³，哪一种质量最小？', options: samples.map(s => ({ text: s.name, correct: s.sym === 'Li', why: s.name + '看起来很小也可能很重；相同体积时，密度更小的质量才更小。' })) });
      api.step(1);
      L.setTask('称完三块样品，把数据记下来');
      const measured = new Set(); let selected = samples[0];
      await api.task(resolve => {
        const ready = api.button('三种都称好了，比较结果', { onClick: () => { if (measured.size === 3) resolve(); } }); ready.disabled = true;
        const pickers = samples.map(s => {
          const b = api.button('放入' + s.name, { primary: false, onClick: () => { selected = s; pickers.forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); L.draw(scaleSVG(s, false)); L.note('已选' + s.name + '，按“称量并记录”读取计算值。'); } }); b.setAttribute('aria-pressed', String(s === selected)); return b;
        });
        L.controls.append(...pickers, api.button('称量并记录', { onClick: () => {
          measured.add(selected.sym); L.draw(scaleSVG(selected, true));
          L.note(selected.name + '：10 cm³ × ' + selected.density + ' g/cm³ = ' + (10 * selected.density).toFixed(2) + ' g');
          L.record.innerHTML = ''; samples.filter(s => measured.has(s.sym)).forEach(s => L.record.append(api.h('p', null, `${s.name} ${s.sym}：${(10 * s.density).toFixed(2)} g`)));
          ready.disabled = measured.size !== 3; api.sfx('click');
        } })); L.task.append(api.h('p', { class: 'muted' }, '选样品 → 称量并记录。体积始终相同。'), ready);
      });
      L.controls.innerHTML = ''; api.step(2); api.hint('根据记录判断，别只看金属的外观。');
      await api.choice({ container: L.setTask('把观察写成结论'), q: '这次比较为什么要让三块金属体积相同？', options: [
        { text: '控制体积，才能比较材料的密度', correct: true },
        { text: '所有金属的质量本来就相同', why: '记录中的质量不同；材料和体积都会影响质量。' },
        { text: '颜色越浅，密度一定越小', why: '颜色不能代替密度数据。这里根据等体积质量判断。' }
      ] });
      api.step(3); api.complete({ message: '你用相同体积比较了锂、铝、铁。锂很轻，但材料选择还要看它的其他性质。' });
    }
  });

  H2.registerLevel({
    id: 'li-atom', order: 2, title: '拼出三号原子', subtitle: '锂-7：3 个质子、4 个中子、3 个电子', css: css('li-atom'),
    card: { title: '锂的身份证', points: ['锂的符号是 <b>Li</b>，原子序数是 <b>3</b>，属于碱金属。', '<b>锂-7</b>有 3 个质子、4 个中子；中性时有 3 个电子。', '电子分层的简化模型为 <b>2、1</b>，最外层只有 1 个电子。', '7 是锂-7的质量数；周期表的相对原子质量约 6.94，是天然同位素的加权平均。'] },
    async run(api) {
      api.steps(['身份', '搭建', '查验']); api.step(0);
      await api.say(['称量看的是一整块金属。现在把镜头拉近，认识一个锂原子。', '我们搭的是锂-7。质子决定元素身份，中子数用于区分同位素。']);
      api.step(1); api.hint('依次放入 3 个质子、4 个中子和 3 个电子。');
      await H2.Lab.atom(api, { z: 3, n: 4, label: '锂-7' });
      api.step(2); api.hint('对照刚搭好的原子，再核对一次身份。');
      await api.choice({ q: '电子分层为 2、1，哪一层的电子最容易参与通常的化学变化？', options: [
        { text: '最外层的 1 个电子', correct: true },
        { text: '原子核里的 4 个中子', why: '中子在原子核里。通常的化学变化主要涉及核外电子。' },
        { text: '把 3 个质子一起移走', why: '改变质子数就改变了元素身份，不是通常的化学变化。' }
      ] });
      api.complete({ message: '你认识了锂-7与电子分层。下一站把“2、1”变成看得见的电荷账本。' });
    }
  });

  function ionSVG(outer) {
    const electron = (x, y) => `<circle cx="${x}" cy="${y}" r="13" fill="var(--aqua)"/>${txt(x, y + 5, '−', 'style="fill:var(--on-accent)"')}`;
    return SVG(`<ellipse cx="205" cy="157" rx="56" ry="60" fill="none" stroke="var(--line)" stroke-width="2"/>
<ellipse cx="205" cy="157" rx="113" ry="110" fill="none" stroke="var(--line)" stroke-width="2" stroke-dasharray="6 5"/>
<circle cx="205" cy="157" r="37" fill="var(--coral-soft)" stroke="var(--coral)" stroke-width="2"/>
${txt(205, 153, '3 p⁺')}${txt(205, 175, '4 n', 'class="li-small"')}${electron(149, 157)}${electron(261, 157)}
${outer ? electron(318, 157) : ''}
<rect x="380" y="114" width="108" height="88" rx="14" fill="var(--aqua-soft)" stroke="var(--line)" stroke-width="2"/>
${txt(434, 102, '电子暂存区', 'class="li-small"')}${outer ? txt(434, 165, '空') : electron(434, 157)}
${txt(205, 303, outer ? '中性锂原子 Li' : '锂离子 Li⁺', 'class="li-num"')}
${txt(205, 324, outer ? '3 个质子，3 个电子' : '3 个质子，2 个电子', 'class="li-small"')}`, outer ? '中性锂原子与空电子暂存区' : '锂离子失去一个外层电子');
  }
  H2.registerLevel({
    id: 'li-ion', order: 3, title: '一颗电子的变化', subtitle: '电子变了，元素身份会变吗？', css: css('li-ion'),
    card: { title: 'Li 与 Li⁺', points: ['锂原子的电子分层为 2、1，失去最外层 1 个电子后成为 <b>Li⁺</b>。', 'Li⁺有 3 个质子、2 个电子，所以带 1 个单位的正电荷。', '电子数改变时，质子数没有改变，仍然是锂元素。', '取放电子只是电荷计数示意；真实电子转移需要相应的反应与能量条件。'] },
    async run(api) {
      api.steps(['预测', '取放电子', '电荷账本', '身份']); api.step(0);
      const L = lab(api, '电子与电荷账本', ionSVG(true));
      L.caption('分层圆圈和粒子大小不按比例。按钮用于电荷计数，不代表电子可以无条件自行离开。');
      await api.say('把最外层的电子暂时取走，原子核会跟着变吗？先猜一猜。');
      api.hint('先预测电荷，再亲手取放一个外层电子。');
      await api.choice({ container: L.setTask('预测：少了一份负电荷'), q: '锂原子失去 1 个电子后会怎样？', options: [
        { text: '带正电，变成 Li⁺', correct: true },
        { text: '带负电，变成 Li⁻', why: '电子带负电；失去负电荷后，是正电荷多了 1 份。' },
        { text: '变成 2 号元素氦', why: '锂仍有 3 个质子；元素身份由质子数决定。' }
      ] });
      api.step(1); L.setTask('做两次操作：取走，再放回');
      await api.task(resolve => {
        let outer = true, removed = false, returned = false;
        const ready = api.button('我看清变化了', { onClick: () => { if (removed && returned) resolve(); } }); ready.disabled = true;
        const take = api.button('取走最外层的 1 个电子', { onClick: () => { outer = false; removed = true; draw(); api.sfx('zap'); } });
        const put = api.button('把电子放回', { primary: false, onClick: () => { outer = true; returned = removed; draw(); api.sfx('pop'); } });
        function draw() {
          L.draw(ionSVG(outer)); take.disabled = !outer; put.disabled = outer;
          ready.disabled = !(removed && returned);
          L.note(outer ? '正电 3 份 − 负电 3 份 = 0，仍是中性 Li。' : '正电 3 份 − 负电 2 份 = +1，成为 Li⁺。');
          L.record.innerHTML = '';
          if (removed) L.record.append(api.h('p', null, '已观察：取走电子 → 2 个电子，带 +1 电荷'));
          if (returned) L.record.append(api.h('p', null, '已观察：电子放回 → 3 个电子，恢复中性'));
        }
        L.controls.append(take, put); L.task.append(api.h('p', { class: 'muted' }, '观察最外层、暂存区和电荷读数。原子核始终不变。'), ready); draw();
      });
      L.controls.innerHTML = ''; api.step(2);
      api.hint('看质子和电子各有多少，把电荷账算清楚。');
      await api.choice({ container: L.setTask('检查 Li⁺ 的电荷'), q: '3 个质子、2 个电子，总电荷是？', options: [
        { text: '+1', correct: true }, { text: '0', why: '正、负电荷数量不相等：3 − 2 = 1。' }, { text: '−1', why: '正电多 1 份，所以是 +1。' }
      ] });
      api.step(3);
      await api.choice({ container: L.setTask('身份由什么决定'), q: '取走一个电子以后，为什么还叫锂？', options: [
        { text: '原子核里仍有 3 个质子', correct: true }, { text: '原子和离子的电子数总是相同', why: '刚才的模型已显示，Li 与 Li⁺ 的电子数不同。' }, { text: '电子数决定元素名称', why: '元素身份由质子数决定；电子改变会形成离子。' }
      ] });
      api.complete({ message: '质子数守住元素身份，电子数决定电荷变化。下一站把这些粒子的“往返”连接到电池。' });
    }
  });

  function batterySVG(charge, mode, flowing) {
    const left = charge, right = 4 - charge, reverse = mode === 'charge';
    const dots = (n, x) => Array.from({ length: n }, (_, i) => `<circle cx="${x}" cy="${138 + i * 27}" r="11" fill="var(--mint)"/>${txt(x, 142 + i * 27, '+', 'class="li-small"')}`).join('');
    const arrow = reverse ? '<path d="M322 180H204l12-9m-12 9 12 9"/>' : '<path d="M198 180H316l-12-9m12 9-12 9"/>';
    const electrons = flowing ? `<g class="li-electron-flow ${reverse ? 'li-flow-back' : ''}"><circle cx="158" cy="43" r="11" fill="var(--spark)"/>${txt(158, 47, '−', 'class="li-small"')}</g>` : '';
    return SVG(`<rect x="48" y="88" width="424" height="176" rx="20" fill="var(--glass)" stroke="var(--glass-stroke)" stroke-width="2"/>
<rect x="65" y="103" width="105" height="144" rx="10" fill="var(--aqua-soft)"/><rect x="350" y="103" width="105" height="144" rx="10" fill="var(--coral-soft)"/>
<path d="M260 105V247" stroke="var(--line)" stroke-width="14" stroke-dasharray="6 5"/>
${txt(115, 124, '负极材料', 'class="li-small"')}${txt(405, 124, '正极材料', 'class="li-small"')}${dots(left, 115)}${dots(right, 405)}
<path d="M115 88V43h115m60 0h115v45" fill="none" stroke="var(--aqua)" stroke-width="3"/>
<rect x="210" y="24" width="100" height="39" rx="10" fill="${flowing && !reverse ? 'var(--spark-soft)' : 'var(--card)'}" stroke="var(--line)" stroke-width="2"/>
${txt(260, 49, reverse ? '充电器' : '探险车', 'class="li-small"')}
${electrons}${txt(425, 37, '外电路 e⁻', 'class="li-small"')}
${flowing ? `<g class="li-ion-flow ${reverse ? 'li-flow-back' : ''}" stroke="var(--mint)" stroke-width="4" fill="none">${arrow}</g>` : ''}
${txt(260, 159, 'Li⁺', 'class="li-num"')}${txt(260, 218, '电解质与隔膜', 'class="li-small"')}
${txt(260, 291, reverse ? '充电：Li⁺ 从正极材料到负极材料' : '放电：Li⁺ 从负极材料到正极材料', 'class="li-small"')}
${txt(260, 319, '储能示意：' + charge + ' / 4', 'class="li-num"')}`, '锂离子电池充放电简化示意');
  }
  H2.registerLevel({
    id: 'li-battery', order: 4, title: '给探险车充能', subtitle: '在两种材料之间往返的锂离子', css: css('li-battery') + `
.lv-li-battery .li-electron-flow{animation:li-electron-run 1s ease-in-out 2;}
.lv-li-battery .li-ion-flow{animation:li-ion-run 1s ease-in-out 2;}
.lv-li-battery .li-flow-back{animation-direction:reverse;}
@keyframes li-electron-run{from{transform:translateX(-22px);}to{transform:translateX(22px);}}
@keyframes li-ion-run{from{transform:translateX(-8px);}to{transform:translateX(8px);}}
@media(prefers-reduced-motion:reduce){.lv-li-battery .li-electron-flow,.lv-li-battery .li-ion-flow{animation:none;}}
`,
    card: { title: '锂离子电池的往返', points: ['锂离子电池中，<b>Li⁺</b>通过电解质在两极材料间迁移，电子经过<b>外电路</b>。', '放电时，Li⁺从负极材料移向正极材料；电子经外电路为设备供能。', '充电器输入电能，让相反方向的过程发生。', '此处展示常见锂离子电池的简化模型，不是将一块锂金属塞进手机。'] },
    async run(api) {
      api.steps(['能量从哪来', '充电', '放电', '分清路径']); api.step(0);
      let charge = 0, mode = 'charge', closed = true;
      const L = lab(api, '可逆充放电工作台', batterySVG(charge, mode, false));
      L.caption('4 个位置仅表示相对储能和迁移方向，不是实际离子数、电量或容量。电极材料与电路均为简化示意，请勿拆解电池。');
      await api.say('探险车没电了。锂离子可以在两极材料之间往返，但能量从哪里来？');
      api.hint('充电器输入能量；放电时电池为探险车供能。');
      await api.choice({ container: L.setTask('充电不是凭空制造能量'), q: '给电池充电时，需要什么？', options: [
        { text: '由充电器输入电能', correct: true }, { text: '把锂离子用完，再长出新的', why: '模型中的锂离子在两极材料间往返，不是靠不断消耗离子来充电。' }, { text: '只把电池放着，就会自己充满', why: '充电需要外界输入能量，电池不会凭空增加储存的能量。' }
      ] });
      api.step(1); L.setTask('先充满，再给探险车供电');
      let charged = false, discharged = false;
      await api.task(resolve => {
        const finish = api.button('两次往返观察完毕', { onClick: () => { if (charged && discharged) resolve(); } }); finish.disabled = true;
        const source = api.button('接充电器', { onClick: () => { mode = 'charge'; redraw(); } });
        const vehicle = api.button('接探险车', { primary: false, onClick: () => { mode = 'discharge'; redraw(); } });
        const switcher = api.button('断开外电路', { primary: false, onClick: () => { closed = !closed; redraw(); } });
        const tick = api.button('运行一步', { onClick: () => {
          if (!closed) { L.note('外电路已断开：这个模型不再充放电，读数保持不变。'); return; }
          if (mode === 'charge' && charge === 4) { L.note('模型已经充满，请接探险车观察放电。'); return; }
          if (mode === 'discharge' && charge === 0) { L.note('模型已放空。请先接充电器补充能量。'); return; }
          charge += mode === 'charge' ? 1 : -1;
          if (charge === 4) { charged = true; api.step(2); }
          if (charged && charge === 0) discharged = true;
          redraw(true); api.sfx(mode === 'charge' ? 'zap' : 'whoosh');
          finish.disabled = !(charged && discharged);
          L.record.innerHTML = ''; if (charged) L.record.append(api.h('p', null, '充电观察：Li⁺ 正极材料 → 负极材料'));
          if (discharged) L.record.append(api.h('p', null, '放电观察：Li⁺ 负极材料 → 正极材料'));
        } });
        function redraw(flowing) {
          L.draw(batterySVG(charge, mode, !!flowing)); source.setAttribute('aria-pressed', String(mode === 'charge')); vehicle.setAttribute('aria-pressed', String(mode === 'discharge'));
          switcher.textContent = closed ? '断开外电路' : '接通外电路';
          L.note((closed ? '电路接通。' : '电路断开。') + (mode === 'charge' ? '充电器输入电能，Li⁺ 向负极材料移动。' : '电池向探险车供能，Li⁺ 向正极材料移动。') + ' 储能示意：' + charge + '/4。');
        }
        L.controls.append(source, vehicle, switcher, tick); L.task.append(api.h('p', { class: 'muted' }, '接充电器 → 运行四步；再接探险车 → 运行四步。也可以断开电路对照。'), finish); redraw();
      });
      L.controls.innerHTML = ''; api.step(3); api.hint('Li⁺ 与电子的路线不同，看看谁在电池里面走。');
      await api.sortInto({ container: L.setTask('给两种粒子安排路线'), prompt: '先点卡片，再点对应的路线。', bins: [
        { id: 'inside', title: '电解质中的路径' }, { id: 'outside', title: '连接设备的外电路' }
      ], items: [
        { text: '锂离子 Li⁺', bin: 'inside', why: 'Li⁺通过电解质迁移，不能沿电线穿过探险车。' },
        { text: '电子 e⁻', bin: 'outside', why: '电子经外电路为设备供能；隔膜将电极隔开，防止内部直接短路。' }
      ] });
      api.complete({ message: '你观察了能量输入与输出，也分清了锂离子和电子的路线。图示是模型，不是电池拆解说明。' });
    }
  });

  function serviceSVG(surface, charger, healthy, checked) {
    const safe = surface === 'desk' && charger === 'matched' && healthy;
    const cell = healthy ? '<rect x="208" y="113" width="104" height="84" rx="13"/>' : '<path d="M219 113Q260 93 301 113Q328 155 301 197Q260 217 219 197Q192 155 219 113Z"/>';
    return SVG(`<path d="M58 235h404v29H58Z" fill="${surface === 'desk' ? 'var(--wood)' : 'var(--coral-soft)'}" stroke="var(--line)" stroke-width="2"/>
${surface === 'desk' ? '<path d="M88 265v36m344-36v36" stroke="var(--wood)" stroke-width="9"/>' : '<path d="M70 235q50-36 100 0t100 0t100 0" fill="none" stroke="var(--coral)" stroke-width="3"/>'}
<g fill="${healthy ? 'var(--mint-soft)' : 'var(--coral-soft)'}" stroke="${healthy ? 'var(--ok)' : 'var(--coral)'}" stroke-width="3">${cell}</g>
<rect x="245" y="104" width="30" height="8" rx="3" fill="var(--glass-stroke)"/>
${txt(260, 161, healthy ? '完好设备' : '异常鼓包')}
<rect x="366" y="154" width="72" height="60" rx="9" fill="var(--card)" stroke="${charger === 'matched' ? 'var(--ok)' : 'var(--coral)'}" stroke-width="3"/>
${txt(402, 181, charger === 'matched' ? '匹配' : '不明', 'class="li-small"')}${txt(402, 201, '充电器', 'class="li-small"')}
<path d="M312 172h24v26h30" fill="none" stroke="var(--line)" stroke-width="3"/>
${txt(260, 55, checked && safe ? '安全条件核对完成' : '给充电服务站做体检', 'class="li-num"')}
${txt(260, 322, surface === 'desk' ? '干燥通风、远离可燃物的台面' : '柔软枕头：容易阻碍散热', 'class="li-small"')}`, '充电场景检查示意');
  }
  H2.registerLevel({
    id: 'li-safety', order: 5, title: '充电服务站', subtitle: '用好电池，也照顾好它', css: css('li-safety'),
    card: { title: '应用与电池照护', points: ['手机、电动车等常用<b>锂离子电池</b>；含锂合金也可用于轻量化材料。', '按设备说明使用匹配、合格的电池和充电器，充电时保持散热。', '发现鼓包、异味、异常发热等情况，应<b>停止使用并告知成人</b>，由专业人员处理。', '废旧电池送到规范回收渠道，不能混入普通垃圾；不要拆解、穿刺或自行修理电池。'] },
    async run(api) {
      api.steps(['发现问题', '调整场景', '分清用途', '回收']); api.step(0);
      let surface = 'pillow', charger = 'unknown', healthy = false;
      const L = lab(api, '服务站检查台', serviceSVG(surface, charger, healthy, false));
      L.caption('这是场景判断练习。现实中发现异常电池，请停止使用并通知成人；有烟雾或起火时远离并寻求紧急帮助。');
      await api.say(['这张充电桌藏着三个问题。先别接电，帮氢氢找出来。', { text: '不要触碰或继续使用异常电池。现实中的处理要交给成人和专业人员。', mood: 'serious' }]);
      api.hint('根据设备状态、台面和充电器，先决定是否可以充电。');
      await api.choice({ container: L.setTask('第一件该做的事'), q: '发现电池明显鼓包，应该怎样做？', options: [
        { text: '停止使用，告知成人，由专业人员处理', correct: true },
        { text: '挤一挤，让它恢复形状', why: '挤压、穿刺可能损伤电池并引发危险，不能自行处理。' },
        { text: '先充满看看能不能恢复', why: '鼓包是异常信号，不能继续使用或充电。' }
      ] });
      api.step(1); L.setTask('让场景满足安全使用条件');
      await api.task(resolve => {
        function update() { L.draw(serviceSVG(surface, charger, healthy, false)); L.note('当前：' + (healthy ? '完好设备' : '异常设备') + ' / ' + (surface === 'desk' ? '通风台面' : '枕头上') + ' / ' + (charger === 'matched' ? '匹配充电器' : '来源不明充电器')); }
        const controls = [
          ['改成干燥通风台面', () => { surface = 'desk'; }],
          ['放回枕头上作对照', () => { surface = 'pillow'; }],
          ['选设备说明要求的匹配充电器', () => { charger = 'matched'; }],
          ['选来源不明充电器作对照', () => { charger = 'unknown'; }],
          ['由成人处理异常设备，换完好设备', () => { healthy = true; }]
        ];
        controls.forEach(([label, action]) => L.controls.append(api.button(label, { primary: false, onClick: () => { action(); update(); } })));
        const check = api.button('检查这套场景', { onClick: () => {
          const problems = [];
          if (!healthy) problems.push('异常设备不能继续使用，应通知成人并由专业人员处理');
          if (surface !== 'desk') problems.push('枕头和床铺容易阻碍散热，也可能燃烧');
          if (charger !== 'matched') problems.push('应按设备说明选择匹配、合格的充电器');
          if (problems.length) { api.mistake(problems.join('；') + '。'); L.note(problems.join('；') + '。'); return; }
          L.draw(serviceSVG(surface, charger, healthy, true)); L.note('场景已通过检查。现实使用仍要遵守设备说明，保持观察。'); api.good('检查通过！'); resolve();
        } });
        L.task.append(api.h('p', { class: 'muted' }, '在图下修改条件，再按检查。这里不会真的接通电源。'), check); update();
      });
      L.controls.innerHTML = ''; api.step(2); api.hint('同样含有锂，材料身份与用途可以不同。');
      await api.sortInto({ container: L.setTask('把应用送到对应展柜'), prompt: '点卡片，再点展柜。', bins: [
        { id: 'battery', title: '锂离子电池' }, { id: 'alloy', title: '含锂合金' }, { id: 'glass', title: '含锂玻璃材料' }
      ], items: [
        { text: '手机的可充电储能单元', bin: 'battery', why: '手机常用锂离子电池，不是一块裸露的锂金属。' },
        { text: '铝锂合金轻量化结构件', bin: 'alloy', why: '铝锂合金是金属材料，用于减重并满足结构要求。' },
        { text: '加入氧化锂的特殊玻璃', bin: 'glass', why: '这里使用的是锂的化合物，不是把金属块直接装进电池。' }
      ] });
      api.step(3);
      await api.choice({ container: L.setTask('使用之后，下一站去哪'), q: '废旧电池应该送到哪里？', options: [
        { text: '当地规范的电池回收渠道', correct: true },
        { text: '混进普通垃圾桶', why: '废电池可能造成火灾或环境问题，应送到合规回收渠道。' },
        { text: '自己拆开取出金属', why: '拆解、穿刺电池有危险，应交给专业回收人员。' }
      ] });
      api.complete({ message: '你为服务站排除了三种风险，也分清了含锂材料、电池与回收。' });
    }
  });

  function roverSVG(done) {
    return SVG(`<path d="M42 265h436" stroke="var(--line)" stroke-width="3"/>
<path d="M107 219v-60h157l48 40h70v46H107Z" fill="var(--aqua-soft)" stroke="var(--aqua)" stroke-width="3"/>
<path d="M132 164h75v37h-75Z" fill="var(--glass)" stroke="var(--glass-stroke)" stroke-width="2"/>
<circle cx="157" cy="247" r="27" fill="var(--ink-2)"/><circle cx="332" cy="247" r="27" fill="var(--ink-2)"/>
<circle cx="157" cy="247" r="13" fill="var(--paper)"/><circle cx="332" cy="247" r="13" fill="var(--paper)"/>
<rect x="235" y="211" width="59" height="26" rx="4" fill="${done > 2 ? 'var(--mint)' : 'var(--paper-2)'}" stroke="var(--aqua)"/>
${txt(260, 58, '锂元素探险车', 'class="li-num"')}
${[0, 1, 2, 3].map((n) => `<circle cx="${140 + n * 80}" cy="102" r="18" fill="${done > n ? 'var(--ok-soft)' : 'var(--paper-2)'}" stroke="${done > n ? 'var(--ok)' : 'var(--line)'}" stroke-width="2"/>${txt(140 + n * 80, 108, done > n ? '✓' : n + 1)}`).join('')}
${txt(260, 311, '任务记录 ' + done + ' / 4', 'class="li-small"')}`, '逐项完成探险车任务单');
  }
  H2.registerLevel({
    id: 'li-final', order: 6, title: '探险车出发', subtitle: '把四条线索连成一张任务单', css: css('li-final'),
    card: { title: '锂元素探险记录', points: ['锂是 3 号元素，锂-7的原子核内有 3 个质子、4 个中子。', '相同体积比较密度；锂在金属中密度最小，但还要考虑反应性。', 'Li 与 Li⁺相差 1 个电子，质子数都为 3。', '电池要分清离子路径、电子路径、能量方向，以及安全使用和回收。'] },
    async run(api) {
      api.steps(['轻量化', '微观身份', '能量往返', '安全交付']); api.step(0);
      const L = lab(api, '探险车出发任务单', roverSVG(0));
      L.caption('这是知识综合挑战，车辆和电池为示意图。任务完成后可在本机留下署名记录。');
      await api.say('发车前做最后一轮检查。让称量数据、粒子模型和安全线索一起帮忙！');
      api.hint('第一项：用相同体积的数据判断质量。');
      await api.choice({ container: L.setTask('任务一：核对称量单'), q: '10 cm³ 锂，按 0.534 g/cm³ 计算，质量约为多少？', options: [
        { text: '5.34 g', correct: true }, { text: '53.4 g', why: '质量 = 密度 × 体积；0.534 × 10 = 5.34 g。' }, { text: '三种金属都一样重', why: '相同体积时，材料密度不同，质量就不同。' }
      ] }); L.draw(roverSVG(1)); L.record.append(api.h('p', null, '轻量化记录：10 cm³ 锂的计算质量约 5.34 g。'));
      api.step(1); api.hint('第二项：换了电子数量，元素身份是否改变？');
      await api.choice({ container: L.setTask('任务二：核对粒子账本'), q: '一个粒子有 3 个质子、4 个中子、2 个电子，它是？', options: [
        { text: '锂-7形成的 Li⁺', correct: true }, { text: '中性的锂-7原子', why: '中性的锂-7应有 3 个电子，这里只有 2 个，所以带 +1 电荷。' }, { text: '氦原子', why: '氦只有 2 个质子；这个粒子有 3 个质子，仍属于锂元素。' }
      ] }); L.draw(roverSVG(2)); L.record.append(api.h('p', null, '身份记录：3 个质子决定锂，2 个电子对应 Li⁺。'));
      api.step(2); api.hint('第三项：按能量的去向整理出发顺序。');
      await api.orderSteps({ container: L.setTask('任务三：整理能量旅程'), prompt: '把三张卡排成合理顺序。', steps: [
        '充电器输入电能，电池储存能量', '接入设备，电池开始放电', '设备得到能量，探险车运行'
      ], explain: '充电依靠外界输入；放电是电池把储存的能量提供给设备。' });
      L.draw(roverSVG(3)); L.record.append(api.h('p', null, '能量记录：外界输入 → 储能 → 放电供设备使用。'));
      api.step(3); api.hint('最后一项：把设备交付前的安全条件选齐。');
      await api.choice({ container: L.setTask('任务四：安全交付'), q: '哪些做法可以写进交付单？选出全部正确项。', multi: true, options: [
        { text: '按设备说明选匹配、合格的充电器', correct: true },
        { text: '鼓包或异常发热时停止使用并告知成人', correct: true },
        { text: '废旧电池走规范回收渠道', correct: true },
        { text: '为了散热，把电池外壳拆开', why: '不要自行拆解或穿刺电池，应按说明使用并交给专业人员处理。' }
      ] }); L.draw(roverSVG(4));
      L.record.append(api.h('p', null, '交付记录：匹配充电、留意异常、规范回收。'));
      const title = L.setTask('把你的探险记录留下来');
      const name = api.h('input', { type: 'text', maxlength: '24', value: api.state.name || '', 'aria-label': '探险记录上的名字', placeholder: '写下名字（可留空）', autocomplete: 'off' });
      const learner = api.h('b', null, api.state.name || '小小探险家');
      const record = api.h('section', { class: 'li-cert', 'aria-label': '锂元素探险记录' }, api.h('div', { class: 'eyebrow' }, '元素小课堂 · 锂元素'), api.h('h3', null, '探险车任务完成'), api.h('p', null, learner, ' 完成了轻量化、原子与离子、能量往返和安全交付四项任务。'), api.h('ul', null, ['用数据比较材料', '看见电子变化与电荷', '理解电池能量流动', '作出安全使用判断'].map(s => api.h('li', null, s))), name);
      title.append(record);
      await api.task(resolve => {
        const seal = api.button('签名并盖上出发章', { onClick: () => { api.setName(name.value.trim()); learner.textContent = name.value.trim() || '小小探险家'; name.disabled = true; seal.disabled = true; record.append(api.h('p', { class: 'pill ok' }, '锂元素探险 · 已完成')); api.good('探险车出发！'); resolve(); } }); record.append(api.h('div', { class: 'btn-row', style: { justifyContent: 'center', marginTop: '14px' } }, seal));
      });
      api.complete({ message: '锂元素探险完成！姓名与闯关成绩会随当前账号保存，可到知识图鉴回顾六张卡片。' });
    }
  });

  /* Fact checks (primary sources; accessed 2026-11-05):
     Royal Society of Chemistry: lithium density, atomic number, isotopes, electron configuration,
     reactivity and alloy/glass uses: https://periodic-table.rsc.org/element/3/lithium
     Comparison densities: https://periodic-table.rsc.org/element/13/Aluminium
     and https://periodic-table.rsc.org/element/26/iron
     US Department of Energy, battery basics (charge/discharge paths; Li+ inside, e- outside):
     https://www.energy.gov/sites/default/files/2023-09/KORE_PowerEA_Sept%202023%20Appendices.pdf
     US Fire Administration, abnormal battery signs and recycling:
     https://www.usfa.fema.gov/prevention/home-fires/prevent-fires/batteries/
     NFPA, charging surface and manufacturer instructions:
     https://content.nfpa.org/-/media/project/storefront/catalog/files/safety-tip-sheets/lithiumionbatterysafetytips.pdf?rev=2af71e80158942d99e59dcd8f96ab632
     Illustrations are original schematic SVGs; no remote resources are loaded. */
})();
