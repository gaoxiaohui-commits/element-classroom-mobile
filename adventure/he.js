/* Helium adventure: shared Qingqing engine; all experiments below are teaching diagrams. */
(function () {
  'use strict';
  const H2 = window.H2;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const svg = (label, body, height = 300) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 ${height}" role="img" aria-label="${esc(label)}">${body}</svg>`;
  const txt = (x, y, text, cls = '') => `<text x="${x}" y="${y}" class="he-label ${cls}" text-anchor="middle">${esc(text)}</text>`;
  const common = id => `
  .lv-${id} .he-label{font-family:var(--f-body);font-size:21px;fill:var(--ink-2);}
  .lv-${id} .he-big{font-family:var(--f-display);font-size:26px;fill:var(--ink);}
  .lv-${id} .he-svg svg{display:block;width:100%;height:auto;max-width:620px;margin:auto;}
  .lv-${id} .he-buttons{display:flex;flex-wrap:wrap;gap:8px;align-items:center;}
  .lv-${id} .he-buttons button{min-height:44px;white-space:normal;flex:1 1 110px;}
  .lv-${id} .he-buttons button[aria-pressed="true"]{background:var(--aqua-soft);color:var(--aqua-ink);box-shadow:0 0 0 2px var(--aqua);}
  .lv-${id} .he-record{padding:12px 14px;border:1px solid var(--line);border-radius:var(--r-s);background:var(--paper-2);font-size:14px;line-height:1.65;}
  .lv-${id} .he-foot{font-size:12px;color:var(--ink-3);line-height:1.55;}
  .lv-${id} .he-list{margin:8px 0;padding-left:22px;}
  .lv-${id} .he-name{font-size:16px;min-width:0;width:100%;padding:12px;border:1.5px solid var(--line);border-radius:var(--r-s);background:var(--card);color:var(--ink);}
  .lv-${id} .he-cert{padding:24px 16px;text-align:center;border:3px double var(--aqua);border-radius:var(--r-l);background:var(--card);}
  .lv-${id} .he-cert h3{font:28px/1.35 var(--f-display);margin:12px 0;color:var(--aqua-ink);}
  .lv-${id} .he-cert p{margin:10px 0;}
  @media(max-width:420px){.lv-${id} .he-buttons button{flex-basis:92px;font-size:14px;}.lv-${id} .he-cert{padding:18px 12px;}}
  `;
  function bench(api, title, picture) {
    const lab = H2.Lab.create(api, { title, svg: picture });
    lab.visual.classList.add('he-svg');
    return lab;
  }
  function task(lab, title, html) {
    lab.controls.replaceChildren();
    lab.setTask(title, html || '');
  }
  function row(api, lab, buttons) {
    const box = api.h('div', { class: 'he-buttons' });
    buttons.forEach(b => box.append(b)); lab.controls.append(box); return box;
  }
  async function next(api, lab, text = '记录好了，继续') {
    const b = api.button(text); lab.controls.append(b); await api.waitClick(b); b.remove();
  }
  function record(api, lab, html) { const el = api.h('div', { class: 'he-record', html, 'aria-live': 'polite' }); lab.controls.append(el); return el; }
  function atomPicture(full = true) {
    return svg('氦原子的简化电子层模型', `<circle cx="280" cy="150" r="94" fill="none" stroke="var(--line)" stroke-width="3" stroke-dasharray="7 7"/>
      <circle cx="263" cy="139" r="22" fill="var(--coral)"/><circle cx="297" cy="161" r="22" fill="var(--coral)"/>
      <circle cx="294" cy="133" r="20" fill="var(--zn)"/><circle cx="264" cy="168" r="20" fill="var(--zn)"/>
      ${txt(280, 90, '2 个质子 + 2 个中子')}${full ? '<circle cx="186" cy="150" r="12" fill="var(--aqua)"/><circle cx="374" cy="150" r="12" fill="var(--aqua)"/>' : ''}
      ${txt(280, 272, full ? '第一电子层：2 个电子，已满' : '原子核决定元素身份')}`);
  }
  function balloonPicture(gas, heavy, released) {
    const up = gas === 'He' && !heavy;
    const y = released ? (up ? 66 : 163) : 137;
    return svg('气球浮沉对照示意', `<path d="M38 251H522" stroke="var(--line)" stroke-width="3"/>
      <rect x="31" y="27" width="142" height="90" rx="14" fill="var(--paper-2)"/>
      ${txt(102, 56, gas === 'He' ? '气体：氦' : '气体：空气')}${txt(102, 85, heavy ? '装上重配重' : '没有配重')}
      <path d="M398 229V40m-12 17 12-17 12 17" fill="none" stroke="var(--aqua)" stroke-width="3"/>
      ${txt(447, 125, '向上浮力')}
      <g transform="translate(274 ${y})"><ellipse rx="49" ry="61" fill="var(--aqua-soft)" stroke="var(--aqua)" stroke-width="3"/>
      ${txt(0, 7, gas === 'He' ? 'He' : '空气', 'he-big')}<path d="M0 61v34" stroke="var(--ink-2)" stroke-width="2"/>
      ${heavy ? '<rect x="-21" y="89" width="42" height="25" rx="4" fill="var(--zn)"/>' : '<path d="M-7 95h14" stroke="var(--ink-2)" stroke-width="2"/>'}</g>
      ${txt(280, 283, released ? (up ? '上升：浮力大于总重' : '下降：总重大于浮力') : '先选气体与配重，再松开气球')}`);
  }

  H2.registerLevel({
    id: 'he-float', order: 1, title: '气球为什么升起来', subtitle: '先预测，再做公平的对照',
    card: { title: '浮起来也要看负重', points: ['相同温度、压强下，氦气密度比空气小。', '气球能否上升，要比较浮力与气体、球皮、配重的总重。', '做对照时保持气球大小相同，只改变要研究的条件。'] },
    css: common('he-float'),
    async run(api) {
      api.steps(['预测', '对照试验', '运送任务', '结论']); api.step(0);
      const lab = bench(api, '浮力试验台', balloonPicture('air', false, false));
      task(lab, '先预测', '同样大小的轻质气球，在相同环境中分别装空气和氦气。');
      await api.say([{ text: '我是氢氢。今天和小氦一起，调查气球上升的秘密！', mood: 'happy' }, '这里是示意试验，气球的高度不是真实测量值。']);
      await api.choice({ container: lab.notes, q: '不加配重时，哪一个更容易上升？', options: [
        { text: '充氦气的气球', correct: true },
        { text: '充空气的气球', why: '相同体积的氦气比空气轻，才可能为轻质球皮提供升力。' },
        { text: '只看颜色就知道', why: '颜色不决定气球的浮沉，要比较浮力与总重。' }
      ], explain: '先把预测记下，再用同样的气球检验。' });
      api.step(1); task(lab, '做三次对照', '观察：空气、氦气、氦气加重配重。每次只改一个条件。');
      let gas = 'air', heavy = false; const seen = new Set();
      await api.task(resolve => {
        const air = api.button('充空气', { primary: false }); const he = api.button('充氦气', { primary: false });
        const weight = api.button('装上重配重', { primary: false }); const release = api.button('松开气球');
        const go = api.button('三次记录完成，继续'); go.disabled = true;
        row(api, lab, [air, he, weight]); lab.controls.append(release);
        const log = record(api, lab, '已观察 0 / 3 种情况'); lab.controls.append(go);
        const paint = released => {
          air.setAttribute('aria-pressed', String(gas === 'air')); he.setAttribute('aria-pressed', String(gas === 'He'));
          weight.setAttribute('aria-pressed', String(heavy)); weight.textContent = heavy ? '拿下重配重' : '装上重配重';
          lab.setSVG(balloonPicture(gas, heavy, released));
        };
        air.onclick = () => { gas = 'air'; paint(false); }; he.onclick = () => { gas = 'He'; paint(false); };
        weight.onclick = () => { heavy = !heavy; paint(false); };
        release.onclick = () => {
          paint(true); const key = gas === 'air' ? 'air' : heavy ? 'loaded' : 'light';
          if (gas !== 'air' || !heavy) seen.add(key); api.sfx('whoosh');
          log.textContent = `已观察 ${seen.size} / 3：` + [...seen].map(k => ({ air: '空气气球下降', loaded: '氦气球加重后下降', light: '轻质氦气球上升' }[k])).join('；');
          if (gas === 'air' && heavy) log.textContent += '。这次同时有空气和配重；请拿下配重，再补上公平对照。';
          go.disabled = seen.size < 3;
        }; go.onclick = () => { if (!go.disabled) { api.good('对照记录完成！'); resolve(); } }; paint(false);
      });
      api.step(2); task(lab, '让气球送达高处', '轻质信封已经装好。选气体，并拿下试验用的重配重，再试着送达。');
      await api.task(resolve => {
        gas = 'air'; heavy = true;
        const air = api.button('空气', { primary: false }); const he = api.button('氦气', { primary: false });
        const weight = api.button('拿下重配重', { primary: false }); const send = api.button('试着送达');
        row(api, lab, [air, he, weight]); lab.controls.append(send);
        const paint = () => { lab.setSVG(balloonPicture(gas, heavy, false)); air.setAttribute('aria-pressed', String(gas === 'air')); he.setAttribute('aria-pressed', String(gas === 'He')); weight.textContent = heavy ? '拿下重配重' : '重新装上重配重'; };
        air.onclick = () => { gas = 'air'; paint(); }; he.onclick = () => { gas = 'He'; paint(); }; weight.onclick = () => { heavy = !heavy; paint(); };
        send.onclick = () => {
          lab.setSVG(balloonPicture(gas, heavy, true));
          if (gas !== 'He') { api.mistake('空气气球连同球皮和信封的总重太大，换一种气体试试。'); return; }
          if (heavy) { api.mistake('配重也算总重！即使充氦气，负担太重仍然升不起来。'); return; }
          send.disabled = true; api.good('气体与负重都选对了，信封升起来了！'); resolve();
        }; paint();
      });
      api.step(3); task(lab, '把现象变成解释', '轻不是“不受重力”。气体、球皮和配重都有重量。');
      await api.choice({ container: lab.notes, q: '刚才加上重配重后，氦气球为什么下降？', options: [
        { text: '总重增加，超过了浮力', correct: true },
        { text: '氦气突然变成空气', why: '加配重没有改变里面气体的种类，改变的是总重。' },
        { text: '氦气不再受到浮力', why: '空气仍然对气球提供浮力，只是浮力不足以托起总重。' }
      ], explain: '要会比较“浮力”和“总重”，也要知道哪些条件保持不变。' });
      api.complete();
    }
  });

  H2.registerLevel({
    id: 'he-atom', order: 2, title: '找到小氦的身份证', subtitle: '质子定身份，电子看结构',
    card: { title: '氦-4 原子', points: ['氦的原子序数是 2，原子核含 2 个质子。', '中性的氦-4 原子有 2 个中子、2 个电子。', '基态氦原子的第一电子层有 2 个电子，已经排满。', '图中轨道是简化模型，不是电子的真实行走路线。'] },
    css: common('he-atom'),
    async run(api) {
      api.steps(['身份', '拼原子', '看满层', '用证据判断']); api.step(0);
      let lab = bench(api, '原子身份档案', atomPicture(false));
      task(lab, '什么决定元素身份？', '上一站的氦气很轻。这一站要看看，它和氢在微观结构上有什么区别。');
      await api.say(['我叫氢氢，不过我不会把每个原子都叫成氢。', '元素的身份证，藏在原子核里的质子数中。']);
      await api.choice({ container: lab.notes, q: '氢原子有 1 个质子。氦原子应该有几个质子？', options: [
        { text: '2 个，因为氦的原子序数是 2', correct: true },
        { text: '4 个，因为名字叫氦-4', why: '氦-4 的“4”是质子和中子的总数，不是质子数。' },
        { text: '看气球颜色决定', why: '气球颜色与原子核的质子数无关。' }
      ], explain: '所有氦原子都含 2 个质子；氦-4 是其中常见的一种同位素。' });
      api.step(1); api.clear();
      api.hint('按任务卡拼出中性的氦-4 原子：2 个质子、2 个中子、2 个电子。');
      await H2.Lab.atom(api, { z: 2, n: 2, label: '氦-4' });
      api.step(2); api.clear(); lab = bench(api, '观察刚拼好的原子', atomPicture(false));
      task(lab, '展开电子层', '原子核很小。这里把它和电子层放大，帮助你数清楚。');
      const reveal = api.button('显示 2 个电子'); lab.controls.append(reveal);
      await api.waitClick(reveal); reveal.disabled = true; lab.setSVG(atomPicture(true)); api.good('2 个电子都在第一层，这一层已满。');
      await api.choice({ container: lab.notes, q: '氦的第一电子层有 2 个电子，意味着什么？', options: [
        { text: '第一层已满，不是所有满层都要 8 个', correct: true },
        { text: '还必须再加 6 个才能满', why: '第一电子层最多容纳 2 个电子；不能把后面电子层的规律套过来。' },
        { text: '2 个电子都在原子核里', why: '质子和中子在核内，电子位于核外。' }
      ], explain: '氦是第一周期的稀有气体。第一层 2 个电子就是满层。' });
      api.step(3); task(lab, '改一处，还叫氦吗？', '现在用“质子定身份”判断，而不是背图形。');
      await api.choice({ container: lab.notes, q: '如果把原子核的质子改成 3 个，它还是氦吗？', options: [
        { text: '不是，3 个质子对应锂元素', correct: true },
        { text: '是，只要电子还是 2 个', why: '元素身份由质子数决定，电子数不能把 3 个质子的原子核变成氦。' },
        { text: '是，名字可以随意改', why: '元素名称对应确定的质子数，不由我们随意命名。' }
      ], explain: '下一站把“满层”与氦通常不易反应的性质联系起来。' });
      api.complete();
    }
  });

  function stablePicture(partner, met) {
    const shift = met ? 55 : 0;
    return svg('氦原子与其他粒子靠近的示意', `<rect x="28" y="27" width="504" height="211" rx="20" fill="var(--paper-2)"/>
      <g transform="translate(${155 + shift} 134)"><circle r="47" fill="none" stroke="var(--line)" stroke-width="2"/>
      <circle r="26" fill="var(--aqua-soft)" stroke="var(--aqua)" stroke-width="2"/>${txt(0, 8, 'He', 'he-big')}
      <circle cx="-47" r="8" fill="var(--aqua)"/><circle cx="47" r="8" fill="var(--aqua)"/></g>
      <g transform="translate(${405 - shift} 134)"><circle r="39" fill="var(--mint-soft)" stroke="var(--mint)" stroke-width="2"/>${txt(0, 7, partner)}</g>
      ${txt(280, 58, '普通条件：没有形成新的化合物')}${txt(280, 218, met ? '靠近后仍是原来的粒子；靠近不等于反应' : '先选择邻居，再让它们靠近')}
      ${txt(280, 277, '电子层与距离均为示意，不计算反应速率')}`);
  }
  H2.registerLevel({
    id: 'he-stable', order: 3, title: '一层坐满的安静邻居', subtitle: '理解“不易反应”的条件',
    card: { title: '稳定，也要说明条件', points: ['氦的核外电子层已满，普通条件下化学性质很不活泼。', '氦通常以单个原子存在，化学符号写作 He。', '“通常不易反应”不等于“任何条件下都绝不形成化合物”。', '氦可用作某些工艺的保护气体，具体应用需要专业设备。'] },
    css: common('he-stable'),
    async run(api) {
      api.steps(['看满层', '模拟碰面', '选保护气', '科学边界']); api.step(0);
      const lab = bench(api, '微观观察窗', atomPicture(true));
      task(lab, '先连起两个知识点', '氦只有一层电子，2 个电子已把第一层排满。');
      await api.say(['小氦的第一层已经“坐满”了。', '在普通条件下，它不容易通过得失或共享电子形成化合物。']);
      await next(api, lab, '带着满层结构去观察');
      api.step(1); task(lab, '观察两次碰面', '分别选择氧气与水的粒子。点击“靠近观察”，比较靠近前后有没有出现新化合物。');
      let partner = 'O₂'; const seen = new Set(); lab.setSVG(stablePicture(partner, false));
      await api.task(resolve => {
        const oxygen = api.button('氧气粒子 O₂', { primary: false }); const water = api.button('水分子 H₂O', { primary: false });
        const approach = api.button('靠近观察'); const go = api.button('两次观察完毕'); go.disabled = true;
        row(api, lab, [oxygen, water]); lab.controls.append(approach); const log = record(api, lab, '已观察 0 / 2'); lab.controls.append(go);
        const paint = () => { oxygen.setAttribute('aria-pressed', String(partner === 'O₂')); water.setAttribute('aria-pressed', String(partner === 'H₂O')); lab.setSVG(stablePicture(partner, false)); };
        oxygen.onclick = () => { partner = 'O₂'; paint(); }; water.onclick = () => { partner = 'H₂O'; paint(); };
        approach.onclick = () => { lab.setSVG(stablePicture(partner, true)); seen.add(partner); api.sfx('pop'); log.textContent = `已观察 ${seen.size} / 2。氦与${partner === 'O₂' ? '氧气' : '水'}的粒子靠近后，示意图没有出现新化合物。`; go.disabled = seen.size < 2; };
        go.onclick = () => { if (!go.disabled) { api.good('记录了“普通条件下不易反应”的现象。'); resolve(); } }; paint();
      });
      api.step(2); task(lab, '给工艺选一位安静邻居', '某工艺需要不容易与材料发生反应的保护气体。这里只做性质选择，不操作真实装置。');
      await api.choice({ container: lab.notes, q: '在这些候选中，哪种性质最适合这项任务？', options: [
        { text: '氦：普通条件下很不活泼', correct: true },
        { text: '氧气：可以支持许多燃烧反应', why: '本任务希望减少反应，氧气的助燃性质不符合要求。' },
        { text: '氢气：容易燃烧', why: '氢气可燃。选择保护气体要按任务需要，不能只看它也很轻。' }
      ], explain: '“轻”解释一部分气球用途；“不活泼”解释某些保护气体用途。性质不同，证据也不同。' });
      api.step(3); task(lab, '给结论加上边界', '科学家在极高压力下研究出了含氦的稳定材料。这与普通环境里的氦气不是同一种条件。');
      await api.choice({ container: lab.notes, q: '哪句话更科学？', options: [
        { text: '普通条件下，氦通常不易发生化学反应', correct: true },
        { text: '氦在任何条件下都绝不形成化合物', why: '“任何条件”太绝对；极高压研究已发现含氦的稳定化合物。' },
        { text: '既然有极高压研究，家里的氦气就很活泼', why: '极端实验条件不能直接套到日常温度和压力。' }
      ], explain: '记住“不易反应”的同时，也记住“普通条件下”。' });
      api.complete();
    }
  });

  function spectrumPicture(split, sample = '', matched = false) {
    const lines = sample === 'He' ? [247] : sample === 'Na' ? [291, 301] : sample === 'H' ? [152, 430] : [];
    return svg('分光与谱线对比示意', `<circle cx="62" cy="70" r="26" fill="var(--spark-soft)" stroke="var(--spark)" stroke-width="3"/>
      ${txt(61, 29, '太阳光')}<path d="M89 70h78" stroke="var(--spark)" stroke-width="6"/>
      ${split ? '<path d="M190 34 160 103h60z" fill="var(--glass)" stroke="var(--glass-stroke)" stroke-width="3"/><path d="m213 72 96-27m-96 27 96 0m-96 0 96 27" stroke="var(--aqua)" stroke-width="3"/>' : '<rect x="171" y="37" width="39" height="66" rx="7" fill="var(--paper-2)" stroke="var(--line)" stroke-dasharray="5 4"/>'}
      ${txt(405, 63, split ? '不同的光被分开' : '先放入分光器')}
      <rect x="102" y="127" width="390" height="115" rx="12" fill="var(--paper-2)" stroke="var(--line)"/>
      ${txt(58, 162, '太阳')}${txt(58, 217, sample || '样本')}
      <path d="M126 181h343M126 235h343" stroke="var(--line)" stroke-width="2"/>
      ${split ? '<path d="M247 140v36" stroke="var(--spark)" stroke-width="6"/>' : ''}
      ${lines.map(x => `<path d="M${x} 195v35" stroke="var(--spark)" stroke-width="6"/>`).join('')}
      ${matched ? '<path d="M247 137v95" stroke="var(--mint)" stroke-width="2" stroke-dasharray="5 5"/>' : ''}
      ${txt(280, 278, '只画关键线索；颜色、间距不是实际波长比例')}`);
  }
  H2.registerLevel({
    id: 'he-spectrum', order: 4, title: '太阳寄来的光指纹', subtitle: '沿着证据认识一个新元素',
    card: { title: '氦先在太阳上留下线索', points: ['1868 年，科学家在太阳光谱中观察到陌生谱线。', '谱线的位置可帮助辨认元素；相似的颜色不代表同一种元素。', '1895 年，科学家在地球样品中确认了氦。', '比较、复核与新的证据，比只凭一个印象更可靠。'] },
    css: common('he-spectrum'),
    async run(api) {
      api.steps(['太阳来信', '拆开光', '比较线索', '地球回信']); api.step(0);
      const lab = bench(api, '光谱观察台', spectrumPicture(false));
      task(lab, '1868：陌生的黄线', '故事发生在日食观测中。我们通过示意图调查光里的线索，不直接观看太阳。');
      await api.say(['小氦的名字来自表示“太阳”的词。你猜，它为什么先和太阳联系起来？', '1868 年，科学家在太阳光谱里发现了一条陌生谱线。']);
      await next(api, lab, '拿起分光器');
      api.step(1); task(lab, '把光分开再观察', '点击装入或移开分光器，比较画面。下方只放大关键谱线，不是完整光谱。');
      await api.task(resolve => {
        let split = false, observed = false;
        const toggle = api.button('装入分光器', { primary: false }); const go = api.button('我看到了谱线，继续'); go.disabled = true;
        row(api, lab, [toggle, go]);
        toggle.onclick = () => { split = !split; observed = observed || split; lab.setSVG(spectrumPicture(split)); toggle.textContent = split ? '移开分光器' : '装入分光器'; toggle.setAttribute('aria-pressed', String(split)); go.disabled = !observed; api.sfx('pop'); };
        go.onclick = () => { if (!go.disabled) { lab.setSVG(spectrumPicture(true)); resolve(); } };
      });
      api.step(2); task(lab, '颜色相近，线位一样吗？', '分别调入已知样本的谱线，观察它们与太阳关键线索的位置是否相同。');
      await api.task(resolve => {
        const seen = new Set(); const sodium = api.button('比较钠 Na', { primary: false }); const hydrogen = api.button('比较氢 H', { primary: false });
        const go = api.button('两份对照都看完了'); go.disabled = true; row(api, lab, [sodium, hydrogen]); const log = record(api, lab, '太阳黄线还没有被这些已知样本解释。'); lab.controls.append(go);
        const show = sample => { seen.add(sample); lab.setSVG(spectrumPicture(true, sample)); sodium.setAttribute('aria-pressed', String(sample === 'Na')); hydrogen.setAttribute('aria-pressed', String(sample === 'H')); log.textContent = sample === 'Na' ? '钠的线索虽然也接近黄色区域，线位却不重合。已比较 ' + seen.size + ' / 2。' : '氢的已知线索也不能解释这条陌生黄线。已比较 ' + seen.size + ' / 2。'; go.disabled = seen.size < 2; };
        sodium.onclick = () => show('Na'); hydrogen.onclick = () => show('H'); go.onclick = () => { if (!go.disabled) resolve(); };
      });
      await api.choice({ container: lab.notes, q: '面对对照后仍然陌生的谱线，下一步怎么做更合理？', options: [
        { text: '提出新元素的可能，并继续寻找证据', correct: true },
        { text: '颜色接近，直接说它就是钠', why: '关键是谱线的位置是否对应，不能只看都接近黄色。' },
        { text: '宣布太阳只有这种元素', why: '一条线索不能说明太阳只有一种元素，光谱中还有其他信息。' }
      ], explain: '当时的科学家把这一新元素命名为氦；以后还要用更多样本复核。' });
      api.step(3); task(lab, '1895：来自地球的回信', '后来，科学家在地球样品中确认了氦。调入样本，找能与太阳关键线索重合的那一个。');
      await api.task(resolve => {
        let selected = '';
        const opts = ['Na', 'H', 'He'].map(sample => api.button({ Na: '钠 Na', H: '氢 H', He: '氦 He' }[sample], { primary: false }));
        row(api, lab, opts); const check = api.button('叠合检查线位'); check.disabled = true; lab.controls.append(check);
        opts.forEach((b, i) => { const sample = ['Na', 'H', 'He'][i]; b.onclick = () => { selected = sample; opts.forEach(x => x.setAttribute('aria-pressed', String(x === b))); check.disabled = false; lab.setSVG(spectrumPicture(true, selected)); }; });
        check.onclick = () => { if (selected !== 'He') { api.mistake('这份样本的关键线位没有重合。比较的是线位，而不只是名称或颜色。'); return; } check.disabled = true; opts.forEach(b => { b.disabled = true; }); lab.setSVG(spectrumPicture(true, 'He', true)); api.good('太阳线索与地球氦样本相互印证！'); resolve(); };
      });
      await api.say('从太阳的一条陌生线索，到地球样本的印证，小氦的发现是一段证据接力。');
      api.complete();
    }
  });

  function coldPicture(key, recovered = false) {
    const data = { water: [273, '冰水：约 273 K'], nitrogen: [77, '液氮：约 77 K'], helium: [4.2, '液氦：约 4.2 K'] };
    const value = data[key] || [295, '先选择冷源温区']; const height = Math.max(3, value[0] / 295 * 142);
    return svg('冷源温区筛选示意', `<rect x="46" y="65" width="146" height="163" rx="19" fill="var(--glass)" stroke="var(--glass-stroke)" stroke-width="3"/>
      <path d="M57 151h124v61q0 6-10 6H67q-10 0-10-6z" fill="var(--water)"/>
      <path d="M77 66V43h82v23" fill="none" stroke="var(--glass-stroke)" stroke-width="3"/>
      ${txt(118, 119, key === 'helium' ? 'He' : key === 'nitrogen' ? 'N₂' : '冷源', 'he-big')}
      <path d="M192 136h100" stroke="var(--line)" stroke-width="9"/>
      <rect x="302" y="66" width="132" height="163" rx="24" fill="var(--paper-2)" stroke="var(--line)" stroke-width="2"/>
      <path d="M327 98q80 12 0 25t0 25t0 25t0 25" fill="none" stroke="${key === 'helium' ? 'var(--aqua)' : 'var(--coral)'}" stroke-width="7"/>
      ${txt(368, 49, '冷源筛选模型')}
      <rect x="479" y="64" width="15" height="151" rx="7" fill="var(--paper-2)" stroke="var(--line)"/>
      <rect x="482" y="${212 - height}" width="9" height="${height}" rx="4" fill="var(--aqua)"/>
      <circle cx="487" cy="222" r="14" fill="var(--aqua-soft)" stroke="var(--aqua)" stroke-width="2"/>
      ${txt(277, 264, recovered ? '回收 → 净化 → 再液化；减少资源浪费' : value[1])}
      ${recovered ? '<path d="M361 234v51H120v-47m-8 9 8-9 8 9" fill="none" stroke="var(--mint)" stroke-width="3"/>' : ''}
      ${txt(280, 294, '常压参考温区；设备与冷却过程均为示意')}`, 314);
  }
  H2.registerLevel({
    id: 'he-cold', order: 5, title: '去往超低温研究站', subtitle: '按温区选冷源，按性质选用途',
    card: { title: '氦的另一份工作', points: ['常压下，液氦的沸点约为 4.2 K，即 −269 ℃。', '液氦可为某些低温超导磁体提供冷却，例如部分 MRI 与科研设备。', '充气球主要利用低密度；超低温冷却利用很低的沸点。', '地球上可利用的氦资源有限，回收再利用有助于减少浪费。'] },
    css: common('he-cold'),
    async run(api) {
      api.steps(['比较温区', '筛选冷源', '用途配对', '资源回路']); api.step(0);
      const lab = bench(api, '超低温候选冷源', coldPicture(''));
      task(lab, '冷，也分很多种', 'K 是开尔文温标。这里比较冷源的参考温区，不运行真实磁体，也不指导低温操作。');
      await api.say(['小氦不只会帮气球升起来，还在超低温设备中工作。', '冰水、液氮、液氦都“冷”，但它们的温区差别很大。']);
      await api.task(resolve => {
        const seen = new Set(); const go = api.button('三种温区都比较过了'); go.disabled = true;
        const kinds = [['water', '冰水温区'], ['nitrogen', '液氮温区'], ['helium', '液氦温区']];
        const buttons = kinds.map(([key, label]) => api.button(label, { primary: false })); row(api, lab, buttons);
        const log = record(api, lab, '已比较 0 / 3。点击冷源，观察温标变化。'); lab.controls.append(go);
        buttons.forEach((b, i) => { b.onclick = () => { const key = kinds[i][0]; seen.add(key); lab.setSVG(coldPicture(key)); buttons.forEach(x => x.setAttribute('aria-pressed', String(x === b))); log.textContent = `已比较 ${seen.size} / 3。` + ({ water: '冰水约 273 K，作为较高温区对照。', nitrogen: '液氮常压沸点约 77 K。', helium: '液氦常压沸点约 4.2 K，比液氮更低。' }[key]); go.disabled = seen.size < 3; api.sfx('pop'); }; });
        go.onclick = () => { if (!go.disabled) resolve(); };
      });
      api.step(1); task(lab, '为任务筛选一个候选', '示例任务要求：找到低于 5 K 的冷源温区。实际工程还要考虑材料、装置与分级冷却，不能只看这一项。');
      await api.task(resolve => {
        let selected = ''; const kinds = [['water', '约 273 K'], ['nitrogen', '约 77 K'], ['helium', '约 4.2 K']];
        const buttons = kinds.map(([, label]) => api.button(label, { primary: false })); row(api, lab, buttons);
        const check = api.button('提交冷源候选'); check.disabled = true; lab.controls.append(check);
        buttons.forEach((b, i) => { b.onclick = () => { selected = kinds[i][0]; lab.setSVG(coldPicture(selected)); check.disabled = false; buttons.forEach(x => x.setAttribute('aria-pressed', String(x === b))); }; });
        check.onclick = () => { if (selected !== 'helium') { api.mistake(selected === 'nitrogen' ? '77 K 虽然很冷，仍然高于任务要求的 5 K。比较数字再选。' : '273 K 远高于 5 K，不能满足这个超低温候选要求。'); return; } check.disabled = true; buttons.forEach(b => { b.disabled = true; }); api.good('4.2 K 低于 5 K，符合这次温区筛选要求。'); resolve(); };
      });
      api.step(2); task(lab, '同一种元素，不同的本领', '把任务与需要的性质连起来。先点卡片，再点框，也可以拖动。');
      await api.sortInto({ container: lab.notes, bins: [
        { id: 'light', title: '利用气体低密度' }, { id: 'cold', title: '利用液氦低温区' }, { id: 'no', title: '不是氦的这种本领' }
      ], items: [
        { text: '给轻质气球提供升力', bin: 'light', why: '气球主要利用氦气比空气密度小；并不需要把氦冷到液态。', good: '气球：先看密度和总重。' },
        { text: '冷却某些低温超导磁体', bin: 'cold', why: '这项工作利用液氦能提供的超低温条件，而不是浮力。', good: '冷却：看低温条件。' },
        { text: '作为燃料燃烧放热', bin: 'no', why: '氦不容易反应，不是可以像氢气那样燃烧的燃料。', good: '氦与氢都很轻，燃烧性质却不同。' }
      ] });
      api.step(3); task(lab, '把资源接回回路', '设备中的液氦变成气体后，研究站准备处理它。哪种方案能减少资源浪费？');
      await api.choice({ container: lab.notes, q: '选择研究站的氦资源方案', options: [
        { text: '回收气体，经过净化和再液化后利用', correct: true },
        { text: '直接放掉，反正地球上的氦用不完', why: '地球上可利用的氦是有限资源，不能把宇宙中很多氦等同于随时可获得。' },
        { text: '把氦当作燃料烧掉', why: '氦不具有氢气那样的可燃性；回收利用才符合这项任务。' }
      ], onPick: (option, correct) => { if (correct) lab.setSVG(coldPicture('helium', true)); }, explain: '回收、净化、再液化需要专业系统；这个回路图只表达资源再利用的方向。' });
      api.complete();
    }
  });

  const memories = [
    ['密度与负重', '氦气比空气密度小，但气球能否升起还要比较浮力与总重。'],
    ['2 个质子', '2 个质子确定氦的身份。中性的氦-4 原子还有 2 个中子、2 个电子。'],
    ['普通条件下稳定', '第一层电子已满，氦在普通条件下很不活泼；这个结论有条件边界。'],
    ['光谱证据', '1868 年太阳光谱留下线索，1895 年地球样品提供印证。'],
    ['超低温用途', '液氦常压沸点约 4.2 K，可作为某些超低温设备的冷却介质。']
  ];
  function missionPicture(lit) {
    const positions = [[108, 84], [280, 84], [452, 84], [194, 215], [366, 215]];
    return svg('氦元素五份研究记录', positions.map(([x, y], i) => `<g transform="translate(${x} ${y})">
      <circle r="36" fill="${lit.includes(i) ? 'var(--mint-soft)' : 'var(--paper-2)'}" stroke="${lit.includes(i) ? 'var(--mint)' : 'var(--line)'}" stroke-width="3"/>
      ${txt(0, 8, lit.includes(i) ? '✓' : String(i + 1), 'he-big')}${txt(0, 64, memories[i][0])}</g>`).join(''));
  }
  H2.registerLevel({
    id: 'he-final', order: 6, title: '小氦研究员毕业任务', subtitle: '把性质、证据和用途连起来',
    card: { title: '氦元素研究员', points: ['能用浮力与总重解释气球上升或下降。', '能用 2 个质子辨认氦，并描述氦-4 的基本结构。', '能给“不易反应”加上普通条件的边界。', '能把光谱证据、超低温性质与实际用途联系起来。'] },
    css: common('he-final'),
    async run(api) {
      api.steps(['接任务', '研究站决策', '整理记录', '通关证书']); api.step(0);
      const lab = bench(api, '小氦研究档案', missionPicture([]));
      task(lab, '研究站来了三封求助信', '<b>气球送信站</b>：为什么升不起来？<br><b>原子档案室</b>：这还是氦吗？<br><b>低温实验室</b>：该用哪份性质证据？');
      await api.say('小氦的研究员不能只会背数字。我们要带着证据，为每个任务作决定。');
      await next(api, lab, '接下研究任务');
      api.step(1); const solved = [];
      const missions = [
        { title: '第一封：气球送信站', intro: '气球已经充了氦气，却被一个很重的金属箱拉在地面。', q: '最合理的下一步是什么？', options: [
          { text: '先检查总重，减轻负载后再试', correct: true },
          { text: '断定里面一定不是氦', why: '即使真是氦气，球皮与负载太重也可能使总重超过浮力。' },
          { text: '把气球涂成蓝色', why: '颜色不能解决浮力不足以托起负载的问题。' }
        ], explain: '低密度不保证任何气球都能升起；要比较总重与浮力。', lights: [0] },
        { title: '第二封：原子档案室', intro: '一个原子核里有 2 个质子、1 个中子，中性时核外有 2 个电子。', q: '它是不是氦元素的原子？', options: [
          { text: '是，2 个质子确定了氦的身份', correct: true },
          { text: '不是，氦只能有 2 个中子', why: '氦-4 有 2 个中子，但氦还有其他同位素。质子数才决定元素身份。' },
          { text: '不是，电子排满后会变成另一种元素', why: '电子层排满不会改变原子核中的质子数。' }
        ], explain: '这描述的是氦-3。质子数相同、中子数不同的原子属于同一元素的不同同位素。', lights: [1, 2] },
        { title: '第三封：低温实验室', intro: '一项任务需要筛选约 5 K 以下的冷源。', q: '哪一份性质证据与任务直接相关？', options: [
          { text: '液氦常压沸点约为 4.2 K', correct: true },
          { text: '氦气可以使轻质气球上升', why: '低密度解释浮力用途，却不能直接说明这个冷源温区是否够低。' },
          { text: '氦在太阳光谱中留下线索', why: '发现历史很有趣，但判断冷源要查温区与冷却要求。' }
        ], explain: '用途要与相关性质相连，也要核对任务条件。', lights: [3, 4] }
      ];
      for (const mission of missions) {
        task(lab, mission.title, mission.intro);
        await api.choice({ container: lab.notes, q: mission.q, options: mission.options, explain: mission.explain,
          onPick: (option, correct) => { if (correct) { solved.push(...mission.lights); lab.setSVG(missionPicture(solved)); } }
        });
      }
      api.step(2); task(lab, '亲手整理五份记录', '依次点开记录，确认自己能解释每句话。五份都看过后，领取证书。');
      await api.task(resolve => {
        const seen = new Set(); const buttons = memories.map(([title]) => api.button(title, { primary: false })); row(api, lab, buttons);
        const log = record(api, lab, '已整理 0 / 5 份记录。'); const go = api.button('五份记录齐了，领取证书'); go.disabled = true; lab.controls.append(go);
        buttons.forEach((b, i) => { b.onclick = () => { seen.add(i); buttons.forEach(x => x.setAttribute('aria-pressed', String(x === b))); log.textContent = `已整理 ${seen.size} / 5：${memories[i][1]}`; lab.setSVG(missionPicture([...seen])); go.disabled = seen.size < memories.length; api.sfx('pop'); }; });
        go.onclick = () => { if (!go.disabled) { api.good('五份研究记录整理完毕！'); resolve(); } };
      });
      api.step(3); task(lab, '给研究证书署名', '名字只用于这份学习证书。证书显示后可以截图保存。');
      const name = api.h('input', { class: 'he-name', type: 'text', maxlength: '24', placeholder: '研究员名字（可不填）', 'aria-label': '研究员名字', autocomplete: 'off' });
      const make = api.button('生成氦元素研究证书'); lab.controls.append(name, make); await api.waitClick(make);
      const student = name.value.trim().slice(0, 24) || '元素探索员'; api.setName(student);
      lab.controls.replaceChildren(); lab.setTask('研究证书已生成', '这份证书记录你完成了本章任务；星级按本关实际作答情况计算。');
      const cert = api.h('section', { class: 'he-cert', 'aria-label': '氦元素探险通关证书' },
        api.h('div', { class: 'eyebrow' }, '元素小课堂 · 氦元素探险'), api.h('h3', {}, '氦元素研究员'),
        api.h('p', {}, student), api.h('p', {}, '完成六站探险，学会用结构、现象和证据认识氦。'),
        api.h('p', { class: 'small muted' }, '氢氢与小氦共同见证'),
        api.h('div', { class: 'he-foot' }, '密度与浮力 · 原子结构 · 稳定条件 · 光谱证据 · 超低温用途'));
      lab.visual.replaceChildren(cert); api.confetti();
      await next(api, lab, '收好证书，完成本章');
      api.complete({ message: '研究任务完成！你已经把小氦的性质、证据和用途连成了一张知识地图。' });
    }
  });

  /* Fact references, checked 2026-11-05. These are provenance only; no network requests are made.
   * RSC periodic table: atomic number, 1s2, He-4, density, low-temperature applications, boiling point.
   * https://periodic-table.rsc.org/element/2/helium
   * RSC nitrogen: normal boiling point 77.355 K, rounded to 77 K in the teaching comparison.
   * https://periodic-table.rsc.org/element/7/nitrogen
   * NASA solar-science timeline: unknown solar spectrum line in 1868; terrestrial helium in 1895.
   * https://www.nasa.gov/history/spots-waves-and-wind-a-solar-science-timeline-full-text/
   * NIST operational primary source: liquid-helium-cooled superconducting research magnets near 4.2 K.
   * https://www.nist.gov/ncnr/neutron-instruments/sample-environment/equipment/superconducting-magnet-systems
   * BLM: lighter than air, very low reactivity, limited terrestrial resource, balloon and MRI uses.
   * https://www.blm.gov/programs/energy-and-minerals/helium/about-helium
   * RSC Education: He-3 and He-4 are stable isotopes.
   * https://edu.rsc.org/elements/helium/2020011.article
   * Primary high-pressure synthesis paper: the "any conditions / never" claim would be false.
   * https://www.nature.com/articles/nchem.2716
   * Every diagram is qualitative. Heights, atom locations, spectrum spacing and apparatus are not measured data.
   */
})();
