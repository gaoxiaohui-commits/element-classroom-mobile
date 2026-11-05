/* 铍元素探险：氢氢与太空镜工坊。所有模型均为定性示意，不构成实际材料测试。
   Facts checked 2026-11-05:
   NASA https://science.nasa.gov/mission/webb/webbs-mirrors/
   RSC https://periodic-table.rsc.org/element/4/beryllium
   OSHA https://www.osha.gov/beryllium/health-effects */
(function () {
  'use strict';
  const H2 = window.H2;
  const svg = body => `<svg viewBox="0 0 480 280" role="img" aria-label="铍元素虚拟实验示意" style="width:100%;height:auto"><rect x="1" y="1" width="478" height="278" rx="18" fill="var(--paper-2)"/>${body}</svg>`;
  const txt = (x,y,t,size=20) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" fill="var(--ink)" font-family="var(--f-body)">${t}</text>`;
  const b = (api,label,fn) => api.h('button',{class:'btn',type:'button',onclick:fn},label);
  const css = id => `.lv-${id} .be-readout{padding:12px;border-radius:12px;background:var(--aqua-soft);color:var(--aqua-ink);line-height:1.7}.lv-${id} .be-schematic{font-size:12px;color:var(--ink-3)}.lv-${id} .be-counter{font-family:var(--f-num);font-size:22px;font-weight:800}.lv-${id} .be-controls{display:flex;gap:8px;flex-wrap:wrap}.lv-${id} .be-targets{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px}.lv-${id} .be-targets button{padding:0;min-height:42px;border:1.5px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink)}.lv-${id} .be-targets button[aria-pressed=true]{background:var(--spark-soft);border-color:var(--spark);color:var(--ink)}.lv-${id} .be-certificate{padding:24px;border:3px double var(--aqua);border-radius:16px;text-align:center;background:var(--card)}.lv-${id} .be-certificate input{max-width:100%;padding:8px;border:1px solid var(--line);border-radius:8px;background:var(--paper);color:var(--ink)}`;
  async function question(api,container,q,correct,wrong,why) {
    return api.choice({container,q,options:[{text:correct,correct:true},{text:wrong,why}],explain:why,shuffle:true});
  }
  async function observe(api,lab,options,render) {
    await api.task(resolve => {
      const seen=new Set();
      const done=b(api,'把对照结果记下来',()=>resolve()); done.disabled=true;
      const row=api.h('div',{class:'btn-row'});
      options.forEach(o=>row.append(b(api,o.label,()=>{seen.add(o.id);render(o);api.sfx('click');done.disabled=seen.size<options.length;})));
      lab.controls.append(row,done);
    });
    Array.from(lab.controls.querySelectorAll('button')).forEach(el=>el.disabled=true);
  }

  H2.registerLevel({id:'be-material',order:1,title:'给太空镜选材料',subtitle:'轻、硬与保持形状',css:css('be-material'),card:{title:'铍的材料名片',points:['铍 Be 是 4 号元素，是一种质量轻、刚性高的金属。','工程选材要同时比较多种性质，不能只看重量。','这里的比较是定性模型，不是真实承载或重量测量。']},async run(api){
    api.steps(['任务','对照','选材','记录']);api.step(0);
    const lab=H2.Lab.create(api,{title:'太空镜材料工作台',svg:svg(txt(240,65,'任务：轻一些，也要保持形状')+'<path d="M90 180H390" stroke="var(--line)" stroke-width="12"/>'+txt(240,230,'点选三种示意材料进行对照'))});
    lab.note('定性模型：三种方案仅用于理解“轻”和“保持形状”，不表示真实工程参数。');
    await api.say(['我是氢氢。今天帮太空望远镜挑一种镜面基底！','升空要尽量轻，镜面也得保持准确的形状。']);
    api.step(1);api.hint('逐个点选三种方案，观察重量标记和受力形状。');
    await observe(api,lab,[{id:'heavy',label:'试试：重而硬',weight:'重',bend:false},{id:'soft',label:'试试：轻而易弯',weight:'轻',bend:true},{id:'be',label:'试试：铍方案',weight:'轻',bend:false}],o=>{
      lab.setSVG(svg(txt(240,45,o.label.replace('试试：',''))+`<path d="${o.bend?'M80 155 Q240 255 400 155':'M80 170 L400 170'}" fill="none" stroke="var(--glass-stroke)" stroke-width="14"/><path d="M240 80V130m-12-12 12 12 12-12" fill="none" stroke="var(--coral)" stroke-width="5"/>`+txt(240,215,`重量标记：${o.weight} · ${o.bend?'形状易改变':'形状保持较好'}`)+txt(240,250,'形变量、载荷均为示意',12)));
    });
    api.step(2);lab.setTask('根据两条要求做决定');
    await question(api,lab.notes,'哪个方案同时满足“轻”和“保持形状”？','铍方案','只选最重的方案','铍的优势是质量轻、刚性高；“越重越好”并不能满足升空要求。');
    api.step(3);api.complete({message:'选材记录：同时比较质量与刚性，铍可以成为太空镜的基底材料。'});
  }});

  H2.registerLevel({id:'be-atom',order:2,title:'拆开铍的身份证',subtitle:'铍-9：4 个质子，5 个中子',css:css('be-atom'),card:{title:'铍-9 原子',points:['原子序数 4，表示铍原子核里有 4 个质子。','铍-9 含 4 个质子、5 个中子；中性原子有 4 个电子。','简化电子排布为 2、2；轨道圈是帮助计数的模型。']},async run(api){
    api.steps(['身份','搭建','读图','记录']);api.step(0);
    await api.say(['镜片再大，也是由微小的原子组成的。','铍的身份证上写着 Be、4。数字 4 在告诉我们什么？']);
    api.step(1);await H2.Lab.atom(api,{z:4,n:5,label:'铍-9'});
    api.step(2);api.hint('把原子序数和质子数联系起来。');
    await question(api,api.stage,'改变质子数，还一定是铍吗？','不一定，元素由质子数决定','一定，名字不会变','4 个质子决定它是铍；电子或中子不是判断元素种类的依据。');
    api.step(3);api.complete({message:'原子档案：Be，4 个质子；铍-9 的中子数为 5。'});
  }});

  function hex(cx,cy,r){return Array.from({length:6},(_,i)=>{const a=(60*i+30)*Math.PI/180;return `${cx+Math.cos(a)*r},${cy+Math.sin(a)*r}`;}).join(' ');}
  const mirrorCells=(()=>{const cells=[];for(let q=-2;q<=2;q++)for(let r=-2;r<=2;r++){if(Math.abs(q+r)>2||(!q&&!r))continue;cells.push([240+q*45+r*22.5,139+r*39]);}return cells;})();
  function mirror(n,coat,installed){return svg(mirrorCells.map(([x,y],i)=>`<polygon points="${hex(x,y,24)}" fill="${(installed?installed.has(i):i<n)?(coat?'var(--spark)':'var(--zn)'):'var(--card)'}" stroke="var(--glass-stroke)" stroke-width="2"/>`).join('')+txt(240,263,`${n} / 18 片 · ${coat?'表面薄金层':'铍基底示意'}`,14));}
  H2.registerLevel({id:'be-mirror',order:3,title:'拼起十八片星光',subtitle:'韦布主镜：铍基底与金镀层',css:css('be-mirror'),card:{title:'十八片太空镜',points:['韦布望远镜的主镜由 18 块六边形镜片组成。','镜片以铍为基底，表面覆盖很薄的金层。','铍帮助镜片保持形状，金层有利于反射红外光；两者任务不同。']},async run(api){
    api.steps(['任务','拼镜','镀层','记录']);api.step(0);
    const lab=H2.Lab.create(api,{title:'韦布主镜拼装台',svg:mirror(0,false)});lab.note('简化拼装模型：只表达 18 片与两种材料的分工，不代表实际制造和校准过程。');
    await api.say(['十八片六边形，一起接住遥远的星光。','先点亮每片铍基底，再为表面加上薄金层。']);
    api.step(1);api.hint('点选下方 18 个镜片按钮；每片只能安装一次。');
    await api.task(resolve=>{let n=0;const installed=new Set();const grid=api.h('div',{class:'be-targets'});for(let i=0;i<18;i++){const btn=b(api,String(i+1),()=>{if(btn.getAttribute('aria-pressed')==='true')return;btn.setAttribute('aria-pressed','true');installed.add(i);n++;lab.setSVG(mirror(n,false,installed));api.sfx('pop');if(n===18){api.good('18 片基底都到位了！');resolve();}});btn.setAttribute('aria-label',`安装第 ${i+1} 片镜片`);btn.setAttribute('aria-pressed','false');grid.append(btn);}lab.controls.append(grid);});
    api.step(2);const coat=b(api,'给表面加薄金层',()=>{lab.setSVG(mirror(18,true));coat.disabled=true;api.good('表面金层帮助反射红外光。');});lab.controls.append(coat);await api.waitClick(coat);
    lab.setTask('材料分工不能交换');
    await question(api,lab.notes,'哪份装配记录正确？','铍做基底，薄金层帮助反射红外光','整块镜片是用纯金做成的','金色表面来自薄金层，镜片的基底是铍。');
    api.step(3);api.complete({message:'十八片拼成主镜；记住“铍基底，薄金层”的分工。'});
  }});

  function windowScene(mode){const pass=mode==='window';const on=mode!=='off';return svg('<rect x="42" y="106" width="70" height="70" rx="12" fill="var(--glass-stroke)"/>'+txt(77,147,'源',20)+`<rect x="225" y="67" width="${pass?10:34}" height="145" rx="4" fill="${pass?'var(--glass)':'var(--ink-3)'}" stroke="var(--glass-stroke)" stroke-width="2"/><rect x="377" y="78" width="26" height="130" rx="6" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>`+([110,140,170].map(y=>on?`<path d="M115 ${y}H220${pass?` M240 ${y}H374`:''}" fill="none" stroke="var(--spark)" stroke-width="4" stroke-dasharray="8 6"/>`:'').join(''))+txt(240,40,mode==='off'?'虚拟射线源已关闭':pass?'薄铍窗：较多射线通过':'厚铅屏蔽板：明显衰减',17)+txt(240,249,'射线强弱与路径为定性示意',12));}
  H2.registerLevel({id:'be-xray',order:4,title:'给射线留一扇窗',subtitle:'薄铍窗与 X 射线透过',css:css('be-xray'),card:{title:'X 射线窗口',points:['薄铍片对 X 射线的吸收较少，可用于 X 射线设备的窗口。','不同材料和厚度对 X 射线的衰减不同，实际结果还取决于射线能量。','X 射线不是可见光，真实设备由专业人员操作。']},async run(api){
    api.steps(['认识','切换','观察','记录']);api.step(0);
    const lab=H2.Lab.create(api,{title:'虚拟 X 射线窗口',svg:windowScene('off')});lab.note('定性演示，不是辐射测量。图中的粗细与透过量均不表示真实参数。');
    await api.say(['铍还有一个藏在机器里的工作：做 X 射线窗口。','我们只切换屏幕模型，真实射线设备要交给专业人员。']);
    api.step(1);api.hint('比较薄铍窗、厚铅屏蔽板，再关闭虚拟射线源。');
    await observe(api,lab,[{id:'window',label:'模型：薄铍窗'},{id:'shield',label:'模型：厚铅屏蔽板'},{id:'off',label:'模型：关闭射线源'}],o=>lab.setSVG(windowScene(o.id)));
    api.step(2);lab.setTask('看不见，也不等于不存在');
    await question(api,lab.notes,'薄铍片为什么适合做这种窗口？','对 X 射线吸收较少','因为它像透明玻璃一样透明','X 射线的透过与可见光的透明不是一回事，不能只凭眼睛判断。');
    api.step(3);api.complete({message:'窗口任务完成：材料要按所用射线的性质来选择。'});
  }});

  H2.registerLevel({id:'be-safe',order:5,title:'守住工坊的边界',subtitle:'含铍材料与粉尘风险',css:css('be-safe'),card:{title:'认识价值，也认识边界',points:['铍和含铍材料的粉尘、烟雾等可能危害健康，应避免吸入与接触。','真实加工需要专业工程控制和防护，不是学生手工项目。','课堂中使用屏幕模型；发现不明样品，保持距离并告知老师。']},async run(api){
    api.steps(['发现','判断','排序','记录']);api.step(0);
    const lab=H2.Lab.create(api,{title:'工坊观察窗',svg:svg('<rect x="100" y="65" width="280" height="150" rx="16" fill="var(--glass)" stroke="var(--glass-stroke)" stroke-width="3"/><path d="M150 115l25-40 25 40z" fill="var(--spark)"/>'+txt(260,110,'含铍样品')+txt(240,153,'密闭专业工作区')+txt(240,190,'课堂使用虚拟模型'))});
    lab.note('不提供实际加工或采样操作。学生不触碰、不打磨、不拆取含铍器件。');
    await api.say([{text:'铍很有用，但“有用”不等于可以拿来随便试。',mood:'serious'},'尤其要避免产生和吸入含铍粉尘。']);
    api.step(1);api.hint('把行动卡分到课堂可以做与不应做两栏。');
    await api.sortInto({container:lab.notes,prompt:'怎样完成安全的课堂任务？',bins:[{id:'model',title:'课堂可以做'},{id:'avoid',title:'不应尝试'}],items:[{text:'在屏幕上拼装镜片',bin:'model',why:'虚拟拼装不会让你接触真实含铍材料。'},{text:'询问老师或专业人员',bin:'model',why:'由专业人员判断材料与处置方式。'},{text:'打磨一块不明金属',bin:'avoid',why:'打磨可能产生有害粉尘，不应自行尝试。'},{text:'拆取设备中的铍窗',bin:'avoid',why:'不要拆设备取材料；真实设备有材料与设备风险。'}]});
    api.step(2);lab.setTask('发现不明样品时');
    await api.orderSteps({container:lab.notes,prompt:'排好课堂应对顺序',steps:['停止触碰或操作','保持距离，提醒同伴','告知老师，由专业人员判断'],explain:'不靠“戴双手套就能试一试”来替代专业处理。'});
    api.step(3);api.complete({message:'安全记录：课堂做虚拟任务，真实含铍材料交给专业人员。'});
  }});

  H2.registerLevel({id:'be-final',order:6,title:'太空镜工坊验收',subtitle:'从材料到原子，完成任务记录',css:css('be-final'),card:{title:'铍元素探险记录',points:['Be 是铍，4 号元素；铍-9 的中性原子含 4 质子、5 中子、4 电子。','铍兼具轻和高刚性的特点，应用于特定精密材料。','韦布主镜的 18 片镜片使用铍基底和薄金层。','薄铍可作 X 射线窗口；含铍粉尘有危害，课堂只用模型。']},async run(api){
    api.steps(['回顾','验收','签名','完成']);api.step(0);
    const lab=H2.Lab.create(api,{title:'工坊验收记录',svg:mirror(18,true)});
    await api.say(['十八片星光已经拼好了。来检查你的工坊记录。','每道题都对应刚才做过的任务，错了可以看解释再试。']);
    api.step(1);api.hint('完成四项验收，核对材料和安全记录。');
    const qs=[['铍的元素符号是哪一个？','Be','B','Be 是铍，B 是硼，不能把两个符号混在一起。'],['铍-9 的原子核有几个质子？','4 个','9 个','9 是质量数；4 个质子和 5 个中子合起来是 9。'],['韦布主镜的金色来自哪里？','铍基底表面的薄金层','整片都是纯金','基底是铍，表面镀上薄金层，有利于反射红外光。'],['看到不明含铍样品，怎样做？','保持距离并告知老师','磨一点粉来观察','粉尘可能有危害；学生不进行真实加工或采样。']];
    for(let i=0;i<qs.length;i++){lab.setTask(`验收 ${i+1} / ${qs.length}`);await question(api,lab.notes,...qs[i]);}
    api.step(2);lab.setTask('为探险记录签名');
    const name=api.h('input',{type:'text',maxlength:'24',value:api.state.name||'',placeholder:'你的名字（可留空）','aria-label':'铍元素探险记录姓名'});
    const cert=api.h('section',{class:'be-certificate'},api.h('div',{class:'eyebrow'},'元素探险 · 工坊记录'),api.h('h3',null,'铍元素观察员'),api.h('p',null,'我会比较材料，也知道安全边界。'),name);
    const sign=b(api,'保存本次探险记录',()=>api.setName(name.value));cert.append(sign);lab.notes.append(cert);await api.waitClick(sign);
    api.step(3);api.complete({message:'铍元素任务验收完成，知识卡和星星已记入当前账号。'});
  }});
})();
