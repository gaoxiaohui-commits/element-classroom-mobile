/* 硼元素探险：氢氢的材料与微量世界。模型仅用于解释概念，不提供施肥、玻璃测试或核设备操作参数。
   Facts checked 2026-11-05:
   RSC https://periodic-table.rsc.org/element/5/boron
   SCHOTT https://www.schott.com/-/media/project/onex/products/b/borofloat/downloads/borofloat33_broschure_eng_web_ds.pdf
   USDA https://www.ams.usda.gov/sites/default/files/media/SolubleBoronProductsTR2022.pdf
   UC IPM https://ipm.ucanr.edu/home-and-landscape/boron-toxicity-or-other-specific-ions-in-excess/
   DOE https://www.energy.gov/sites/default/files/2026-04/DOE-HDBK-1017-93_VOL2.pdf */
(function () {
  'use strict';
  const H2=window.H2;
  const svg=body=>`<svg viewBox="0 0 480 280" role="img" aria-label="硼元素虚拟实验示意" style="width:100%;height:auto"><rect x="1" y="1" width="478" height="278" rx="18" fill="var(--paper-2)"/>${body}</svg>`;
  const txt=(x,y,t,size=20)=>`<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" fill="var(--ink)" font-family="var(--f-body)">${t}</text>`;
  const button=(api,label,fn)=>api.h('button',{class:'btn',type:'button',onclick:fn},label);
  const css=id=>`.lv-${id} .b-readout{padding:12px;border-radius:12px;background:var(--mint-soft);color:var(--ink);line-height:1.7}.lv-${id} .b-certificate{padding:24px;border:3px double var(--aqua);border-radius:16px;text-align:center;background:var(--card)}.lv-${id} .b-certificate input{max-width:100%;padding:8px;border:1px solid var(--line);border-radius:8px;background:var(--paper);color:var(--ink)}.lv-${id} .b-status{font-weight:700;font-family:var(--f-num);color:var(--aqua-ink)}`;
  async function question(api,container,q,correct,wrong,why){return api.choice({container,q,options:[{text:correct,correct:true},{text:wrong,why}],explain:why,shuffle:true});}
  async function observe(api,lab,options,render){
    await api.task(resolve=>{const seen=new Set();const row=api.h('div',{class:'btn-row'});const next=button(api,'记录三种状态',()=>resolve());next.disabled=true;
      options.forEach(o=>row.append(button(api,o.label,()=>{seen.add(o.id);render(o);api.sfx('click');next.disabled=seen.size<options.length;})));lab.controls.append(row,next);
    });Array.from(lab.controls.querySelectorAll('button')).forEach(el=>el.disabled=true);
  }
  function glassScene(state){const hot=state==='hot',cold=state==='cold';const glass=(x,name,shift)=>`<path d="M${x-50} 82v110q0 14 14 14h72q14 0 14-14V82" fill="var(--glass)" stroke="var(--glass-stroke)" stroke-width="3"/><path d="M${x-44} 126h88v65q0 9-9 9h-70q-9 0-9-9z" fill="var(--water)"/>`+txt(x,53,name,16)+`<rect x="${x-50}" y="228" width="${100+shift}" height="10" rx="5" fill="${hot?'var(--coral)':cold?'var(--aqua)':'var(--mint)'}"/><path d="M${x+50} 221v24" stroke="var(--ink-3)" stroke-width="2" stroke-dasharray="3 3"/>`;
    return svg(glass(130,'普通钠钙玻璃',hot?35:cold?-25:0)+glass(350,'硼硅玻璃',hot?11:cold?-8:0)+txt(240,270,'下方色条为放大后的形变示意，不是测量值',12));}
  H2.registerLevel({id:'b-glass',order:1,title:'冷热之间的玻璃',subtitle:'比较热胀冷缩，认识硼硅玻璃',css:css('b-glass'),card:{title:'硼硅玻璃',points:['硼硅玻璃是一种含硼的玻璃材料，不是单质硼。','硼硅玻璃热膨胀较小，通常更能承受温度变化。','更耐温差不等于不会破裂；不拿真实玻璃做骤冷骤热试验。']},async run(api){
    api.steps(['预测','切换','比较','记录']);api.step(0);
    const lab=H2.Lab.create(api,{title:'玻璃形变观察台',svg:glassScene('room')});lab.note('屏幕中的色条把形变夸大了。材质、温度、时间均为定性示意，不判断真实器皿能否使用。');
    await api.say(['我是氢氢。今天的主角藏在实验室玻璃里。','温度变化时，材料会热胀冷缩。两种玻璃一样吗？']);
    api.hint('先做预测，再用屏幕模型核对。');
    await question(api,lab.notes,'比较耐温差，应该主要观察什么？','温度变化时形变大小','玻璃看起来是不是更亮','亮不亮不能说明耐温差；比较的是温度改变时的膨胀与收缩。');
    api.step(1);lab.setTask('保持两种材料经历相同的温度状态');
    await observe(api,lab,[{id:'room',label:'模型：常温'},{id:'hot',label:'模型：升温'},{id:'cold',label:'模型：降温'}],o=>{lab.setSVG(glassScene(o.id));lab.note(o.id==='room'?'基准状态：比较下方虚线与色条端点。':o.id==='hot'?'升温后，两条色条都变长，硼硅玻璃的变化较小。':'降温后，两条色条都缩短，硼硅玻璃的变化较小。');});
    api.step(2);lab.setTask('把观察写成有边界的结论');
    await question(api,lab.notes,'哪份记录更准确？','硼硅玻璃热膨胀较小，仍需按说明使用','硼硅玻璃永远不会被冷热变化弄裂','更耐温差有使用条件，真实器皿仍可能因温差或损伤而破裂。');
    api.step(3);api.complete({message:'观察完成：含硼的材料，能带来与单质不同的用途。'});
  }});

  H2.registerLevel({id:'b-atom',order:2,title:'五号元素的拼图',subtitle:'硼-11：5 个质子，6 个中子',css:css('b-atom'),card:{title:'硼-11 原子',points:['硼的元素符号是 B，原子序数为 5。','硼-11 有 5 个质子、6 个中子；中性原子有 5 个电子。','简化电子排布为 2、3；并非所有硼原子的中子数都相同。']},async run(api){
    api.steps(['身份','搭建','辨认','记录']);api.step(0);
    await api.say(['玻璃里有含硼成分，那“硼”到底是谁？','B 是 5 号元素。我们选硼-11，拼一张微观身份证。']);
    api.step(1);await H2.Lab.atom(api,{z:5,n:6,label:'硼-11'});
    api.step(2);api.hint('用质子数认元素，用质子加中子认质量数。');
    await question(api,api.stage,'硼-11 的“11”表示什么？','5 个质子与 6 个中子的总数','11 个电子','硼-11 的质量数是 11；中性硼原子的电子数是 5。');
    api.step(3);api.complete({message:'微观记录：B，5 号元素；本次搭建的是硼-11。'});
  }});

  function plantScene(mode){const good=mode==='enough';const stem=good?100:mode==='lack'?55:65;const c=good?'var(--mint)':'var(--spark)';return svg('<path d="M157 220h166l-18 42H175z" fill="var(--wood)"/><path d="M158 220h164" stroke="var(--ink-3)" stroke-width="10"/>'+`<path d="M240 217V${217-stem}" stroke="var(--ok)" stroke-width="8" fill="none"/><path d="M239 174q-70-51-71-11 15 35 71 11M242 161q65-65 76-25-8 43-76 25" fill="${c}"/>`+(good?'<circle cx="240" cy="109" r="21" fill="var(--spark)"/><circle cx="240" cy="109" r="8" fill="var(--coral)"/>':mode==='excess'?'<path d="M168 164l20-9-8 20M309 142l-19-5 13 19" fill="var(--coral)"/>':'')+txt(240,45,good?'适量：支持正常生长':mode==='lack'?'不足：生长可能受影响':'过量：可能损伤植株',19)+txt(240,78,'生长形态与时间均为示意',12));}
  H2.registerLevel({id:'b-plant',order:3,title:'小小营养的分寸',subtitle:'微量元素：不足与过量都不好',css:css('b-plant'),card:{title:'植物需要微量硼',points:['硼是植物需要的微量营养元素，参与正常生长与发育。','硼不足或过量都可能影响植物。','不同植物和环境的需求不同，本模型不给施用剂量；真实管理应依据专业建议。']},async run(api){
    api.steps(['观察','调节','比较','记录']);api.step(0);
    const lab=H2.Lab.create(api,{title:'虚拟植物观察箱',svg:plantScene('lack')});lab.note('这里比较“不足、适量、过量”三种概念状态，不表示实际施肥量，也不模拟真实生长速度。');
    await api.say(['硼不只出现在材料里，它也是植物要用的微量营养。','微量表示需要得少。那是不是多加一点更好？']);
    api.step(1);api.hint('切换三种营养状态，比较叶片和生长表现。');
    await observe(api,lab,[{id:'lack',label:'模型：硼不足'},{id:'enough',label:'模型：硼适量'},{id:'excess',label:'模型：硼过量'}],o=>lab.setSVG(plantScene(o.id)));
    api.step(2);lab.setTask('这不是“越多越好”的任务');
    await question(api,lab.notes,'哪条植物管理记录正确？','硼要适量，不能只凭外观随意添加','植物长得慢就多加硼','植物生长受多种因素影响；不同植物所需不同，过量硼也可能造成伤害。');
    api.step(3);api.complete({message:'营养记录：微量元素有合适范围，不足和过量都可能影响生长。'});
  }});

  function neutronScene(mode){const depth=mode==='out'?0:mode==='mid'?85:152;const paths=[83,121,160,199];const rays=paths.map((y,i)=>{const hit=depth>0&&y<55+depth;return `<path d="M70 ${y}H${hit?249:414}" stroke="var(--aqua)" stroke-width="3" stroke-dasharray="7 5" fill="none"/><circle cx="${hit?249:414}" cy="${y}" r="7" fill="${hit?'var(--coral)':'var(--mint)'}"/>`;}).join('');return svg('<rect x="47" y="55" width="390" height="172" rx="16" fill="var(--card)" stroke="var(--line)" stroke-width="2"/>'+rays+`<rect x="238" y="${55+depth-152}" width="24" height="152" rx="5" fill="var(--ink-3)"/><path d="M225 55h50" stroke="var(--glass-stroke)" stroke-width="5"/>`+txt(240,251,mode==='out'?'控制材料抽出':mode==='mid'?'部分插入：一部分中子被吸收':'更多插入：吸收作用增强',15)+txt(240,274,'单向路径与粒子数量为教学示意',11));}
  H2.registerLevel({id:'b-neutron',order:4,title:'拦住经过的中子',subtitle:'含硼控制材料的吸收作用',css:css('b-neutron'),card:{title:'硼与中子吸收',points:['硼中的硼-10 能有效吸收中子，含硼材料因此可用于特定的控制或屏蔽用途。','控制材料可使用碳化硼等含硼材料，并非简单的纯硼金属棒。','插入更多控制材料，通常会增强中子吸收；图中不模拟真实反应堆。']},async run(api){
    api.steps(['认识','切换','因果','记录']);api.step(0);
    const lab=H2.Lab.create(api,{title:'中子吸收定性模型',svg:neutronScene('out')});lab.note('这是“材料吸收中子”的简化图解，不是反应堆操作训练或计算。粒子数、路径和插入位置不是真实参数。');
    await api.say(['硼还有一项看不见的本领：帮助吸收中子。','这里用含硼控制材料来演示，点点代表示意中子。']);
    api.step(1);api.hint('比较抽出、部分插入、更多插入三种状态。');
    await observe(api,lab,[{id:'out',label:'模型：抽出'},{id:'mid',label:'模型：部分插入'},{id:'in',label:'模型：更多插入'}],o=>lab.setSVG(neutronScene(o.id)));
    api.step(2);lab.setTask('读出材料与现象之间的联系');
    await question(api,lab.notes,'更多中子遇到吸收材料，图中的变化是什么？','更多示意中子被吸收','中子被材料变成了电子','本模型只表达吸收作用，不表示中子变成电子；真实吸收过程还涉及核反应。');
    api.step(3);api.complete({message:'模型记录：含硼材料的吸收作用，可以用于特定的中子控制任务。'});
  }});

  function materialScene(label){return svg('<path d="M80 86h90v120H80z" fill="var(--glass)" stroke="var(--glass-stroke)" stroke-width="3"/><path d="M205 200l30-80 40 15 12 65z" fill="var(--ink-3)"/><path d="M344 90h28v116h-28z" fill="var(--coral)"/>'+txt(125,235,'硼硅玻璃',14)+txt(246,235,'单质硼',14)+txt(358,235,'含硼材料',14)+txt(240,49,label,17));}
  H2.registerLevel({id:'b-material',order:5,title:'同一个元素，不同材料',subtitle:'区分单质、化合物与应用',css:css('b-material'),card:{title:'硼不等于所有含硼物质',points:['单质硼、硼硅玻璃和碳化硼都是不同材料，性质不能直接画等号。','硼硅玻璃用于特定的耐温差玻璃器具；碳化硼可用于中子吸收等用途。','谈用途时，分清“硼元素”与具体的含硼材料，会更准确。']},async run(api){
    api.steps(['辨认','归类','应用','记录']);api.step(0);
    const lab=H2.Lab.create(api,{title:'材料档案馆',svg:materialScene('有硼元素，不等于都是单质硼')});
    lab.note('材料用途取决于成分与结构。外观只作示意，不能用来鉴定未知样品。');
    await api.say(['刚才有玻璃、植物和控制材料，它们都与硼有关。','但不能把这些材料全都叫作“单质硼”！']);
    api.step(1);api.hint('把材料卡放入正确的档案格。可以先点卡片，再点档案格。');
    await api.sortInto({container:lab.notes,prompt:'哪些是单质，哪些是含硼材料？',bins:[{id:'element',title:'单质硼'},{id:'material',title:'含硼材料'}],items:[{text:'只由硼元素组成的单质',bin:'element',why:'“单质”表示由同一种元素组成。'},{text:'硼硅玻璃',bin:'material',why:'硼硅玻璃是含硼的玻璃材料，不是单质硼。'},{text:'碳化硼',bin:'material',why:'碳化硼含有碳和硼，不是单质硼。'},{text:'用于植物营养的硼酸盐',bin:'material',why:'硼酸盐是化合物，具体使用应遵循专业建议。'}]});
    api.step(2);lab.setTask('给观察任务匹配材料');
    await api.sortInto({container:lab.notes,prompt:'按刚才的任务配对',bins:[{id:'glass',title:'耐温差玻璃器具'},{id:'neutron',title:'中子吸收材料'}],items:[{text:'硼硅玻璃',bin:'glass',why:'硼硅玻璃的热膨胀较小，适合相关玻璃用途。'},{text:'含碳化硼的控制材料',bin:'neutron',why:'碳化硼含有可吸收中子的硼，是相关控制材料的一种。'}]});
    api.step(3);api.complete({message:'材料档案完成：说清具体材料，才能说清它的性质和用途。'});
  }});

  H2.registerLevel({id:'b-final',order:6,title:'微量世界任务验收',subtitle:'把观察和解释连起来',css:css('b-final'),card:{title:'硼元素探险记录',points:['B 是硼，5 号元素；硼-11 含 5 质子、6 中子。','硼硅玻璃热膨胀较小，仍应按器皿说明使用。','植物需要微量硼；不足与过量都可能造成影响。','含硼控制材料可以吸收中子；单质与含硼材料要分开认识。']},async run(api){
    api.steps(['回顾','验收','签名','完成']);api.step(0);
    const lab=H2.Lab.create(api,{title:'硼元素任务记录',svg:materialScene('从微小原子，走到生活材料')});
    await api.say(['我们认识了一个元素，也认识了几种不同的材料。','把今天的观察变成解释，完成最后的任务验收吧。']);
    api.step(1);api.hint('逐项验收；每次回答后核对原因。');
    const qs=[['硼的元素符号是什么？','B','Be','B 是硼，Be 是铍。'],['中性硼-11 原子有几个电子？','5 个','11 个','硼的质子数是 5，中性原子的电子数也为 5；11 是质量数。'],['硼硅玻璃的耐温差特点与什么有关？','热膨胀较小','不会发生任何膨胀','它仍会热胀冷缩，只是变化较小，且有实际使用限制。'],['植物需要的硼，怎样理解？','需要适量，过量也可能有害','只要微量有用，大量就更好','微量元素不是越多越好，需求还因植物与环境而异。'],['本课含硼控制材料的作用是什么？','吸收经过的中子','把中子当作电子来传导','这是中子吸收用途，与电流中的电子传导不同。']];
    for(let i=0;i<qs.length;i++){lab.setTask(`验收 ${i+1} / ${qs.length}`);await question(api,lab.notes,...qs[i]);}
    api.step(2);lab.setTask('为探险记录签名');
    const name=api.h('input',{type:'text',maxlength:'24',value:api.state.name||'',placeholder:'你的名字（可留空）','aria-label':'硼元素探险记录姓名'});
    const cert=api.h('section',{class:'b-certificate'},api.h('div',{class:'eyebrow'},'元素探险 · 观察记录'),api.h('h3',null,'硼元素观察员'),api.h('p',null,'我会用观察解释材料，也理解微量的分寸。'),name);
    const sign=button(api,'保存本次探险记录',()=>api.setName(name.value));cert.append(sign);lab.notes.append(cert);await api.waitClick(sign);
    api.step(3);api.complete({message:'硼元素任务验收完成，知识卡和星星已记入当前账号。'});
  }});
})();
