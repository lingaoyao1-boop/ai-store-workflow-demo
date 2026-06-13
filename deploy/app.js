const { rules } = window.DEMO_DATA;
const originalProducts = JSON.parse(JSON.stringify(window.DEMO_DATA.products));
let products = JSON.parse(localStorage.getItem('workflow-products') || JSON.stringify(originalProducts));
let decisions = [];
let deepseekApiKey = '';

const avg = xs => xs.reduce((a,b)=>a+b,0)/xs.length;
const roundPack = n => Math.ceil(Math.max(0,n)/rules.orderPack)*rules.orderPack;

function analyze(p){
  const last7=p.sales.slice(-7), prev7=p.sales.slice(-14,-7);
  const avg7=avg(last7), prevAvg=avg(prev7);
  const trend=prevAvg?(avg7-prevAvg)/prevAvg:0;
  const trendFactor=Math.max(.85,Math.min(1.35,1+trend));
  const dailyForecast=avg7*trendFactor;
  const available=p.stock+p.inbound;
  const coverDays=available/Math.max(dailyForecast,1);
  const target=dailyForecast*(rules.forecastDays+rules.safetyDays);
  const maxStock=dailyForecast*rules.maxStockDays;
  let order=Math.min(roundPack(target-available),rules.maxOrderUnits);
  const reasons=[];
  if(coverDays<rules.safetyDays) reasons.push('缺货风险');
  if(p.expiryDays<=rules.expiryWarningDays&&p.stock>dailyForecast*p.expiryDays) reasons.push('临期积压');
  if(trend>=rules.anomalyRatio) reasons.push('销量异常增长');
  if(available>maxStock){reasons.push('库存过高');order=0;}
  if(p.expiryDays<=1) order=Math.min(order,roundPack(dailyForecast*2-available));
  order=Math.max(0,order);
  const review=order>=rules.manualApprovalUnits;
  const level=reasons.includes('缺货风险')||reasons.includes('临期积压')?'高':reasons.length?'中':'低';
  return {...p,avg7,trend,dailyForecast,available,coverDays,order,reasons,review,level};
}

function render(){
  decisions=products.map(analyze);
  const orders=decisions.filter(x=>x.order>0);
  document.querySelector('#metric-order').textContent=orders.length;
  document.querySelector('#metric-risk').textContent=decisions.filter(x=>x.level==='高').length;
  document.querySelector('#metric-units').textContent=orders.reduce((s,x)=>s+x.order,0);
  document.querySelector('#metric-review').textContent=orders.filter(x=>x.review).length;
  document.querySelector('#decision-body').innerHTML=decisions.map(x=>`<tr><td><strong>${x.name}</strong><br><small>${x.category}</small></td><td>${x.avg7.toFixed(1)}</td><td>${x.available}</td><td>${x.coverDays.toFixed(1)}天</td><td><strong>${x.order}</strong></td><td class="risk-${x.level==='高'?'high':x.level==='中'?'mid':'low'}">${x.reasons.join(' / ')||'正常'}</td></tr>`).join('');
  document.querySelector('#data-body').innerHTML=decisions.map(x=>`<tr><td>${x.name}</td><td>${x.category}</td><td>${x.sales.slice(-14).reduce((a,b)=>a+b,0)}</td><td>${x.avg7.toFixed(1)}</td><td>${x.stock}</td><td>${x.inbound}</td><td>${x.expiryDays}天</td></tr>`).join('');
  document.querySelector('#run-time').textContent=`最近运行：${new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}`;
  document.querySelector('#ai-btn').disabled=false;
}

const ruleLabels={forecastDays:'预测补货周期',safetyDays:'安全库存天数',maxStockDays:'最大库存天数',orderPack:'订货包装规格',anomalyRatio:'销量异常阈值',expiryWarningDays:'临期预警天数',maxOrderUnits:'单次最大补货',manualApprovalUnits:'人工审批阈值'};
document.querySelector('#rules-grid').innerHTML=Object.entries(rules).map(([k,v])=>`<div class="rule"><span>${ruleLabels[k]}</span><strong>${k==='anomalyRatio'?(v*100)+'%':v}</strong></div>`).join('');

const productSelect=document.querySelector('#product-select');
productSelect.innerHTML=products.map((p,i)=>`<option value="${i}">${p.name}</option>`).join('');

function updateInputCount(){
  const inputs=[...document.querySelectorAll('#sales-inputs input')];
  const valid=inputs.filter(x=>x.value!==''&&Number(x.value)>=0).length;
  document.querySelector('#input-count').textContent=`${valid} / 14`;
}

function loadEditor(){
  const p=products[Number(productSelect.value)||0];
  document.querySelector('#stock-input').value=p.stock;
  document.querySelector('#inbound-input').value=p.inbound;
  document.querySelector('#expiry-input').value=p.expiryDays;
  document.querySelector('#sales-inputs').innerHTML=p.sales.slice(-14).map((v,i)=>`<label class="day-input"><span>第${i+1}天</span><input type="number" min="0" step="1" value="${v}" data-day="${i}"></label>`).join('');
  updateInputCount();
  document.querySelector('#save-status').textContent='';
}

productSelect.addEventListener('change',loadEditor);
document.querySelector('#sales-inputs').addEventListener('input',updateInputCount);
document.querySelector('#save-data-btn').addEventListener('click',()=>{
  const idx=Number(productSelect.value)||0;
  const values=[...document.querySelectorAll('#sales-inputs input')].map(x=>Number(x.value));
  const stock=Number(document.querySelector('#stock-input').value);
  const inbound=Number(document.querySelector('#inbound-input').value);
  const expiry=Number(document.querySelector('#expiry-input').value);
  if(values.length!==14||[...values,stock,inbound,expiry].some(x=>!Number.isFinite(x)||x<0)){
    document.querySelector('#save-status').textContent='请完整填写17个非负数字。';return;
  }
  products[idx].sales=[...products[idx].sales.slice(0,-14),...values.map(Math.round)];
  products[idx].stock=Math.round(stock);
  products[idx].inbound=Math.round(inbound);
  products[idx].expiryDays=Math.round(expiry);
  localStorage.setItem('workflow-products',JSON.stringify(products));
  render();
  document.querySelector('#save-status').textContent='已保存，新数据已用于预测。';
});
document.querySelector('#reset-product-btn').addEventListener('click',()=>{
  const idx=Number(productSelect.value)||0;
  products[idx]=JSON.parse(JSON.stringify(originalProducts[idx]));
  localStorage.setItem('workflow-products',JSON.stringify(products));
  loadEditor();render();
  document.querySelector('#save-status').textContent='已恢复该饮品的示例数据。';
});

const apiModal=document.querySelector('#api-modal');
const apiInput=document.querySelector('#api-key-input');
function openApiModal(message=''){
  apiModal.classList.add('open');apiModal.setAttribute('aria-hidden','false');
  apiInput.value=deepseekApiKey;
  document.querySelector('#api-modal-status').textContent=message;
  setTimeout(()=>apiInput.focus(),0);
}
function closeApiModal(){apiModal.classList.remove('open');apiModal.setAttribute('aria-hidden','true');}
function updateApiStatus(){
  const status=document.querySelector('#api-status');
  status.textContent=deepseekApiKey?'DeepSeek 已配置':'DeepSeek 未配置';
  status.classList.toggle('ready',Boolean(deepseekApiKey));
}
document.querySelector('#api-settings-btn').addEventListener('click',()=>openApiModal());
document.querySelectorAll('[data-close-modal]').forEach(x=>x.addEventListener('click',closeApiModal));
document.querySelector('#show-key-input').addEventListener('change',e=>{apiInput.type=e.target.checked?'text':'password';});
document.querySelector('#save-api-key').addEventListener('click',()=>{
  const value=apiInput.value.trim();
  if(!value){document.querySelector('#api-modal-status').textContent='请输入有效的API Key。';return;}
  deepseekApiKey=value;updateApiStatus();closeApiModal();
});
document.querySelector('#clear-api-key').addEventListener('click',()=>{
  deepseekApiKey='';apiInput.value='';updateApiStatus();
  document.querySelector('#api-modal-status').textContent='当前会话密钥已清除。';
});

document.querySelectorAll('.nav').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.nav,.view').forEach(el=>el.classList.remove('active'));btn.classList.add('active');document.querySelector('#'+btn.dataset.view).classList.add('active')}));
document.querySelector('#run-btn').addEventListener('click',render);
document.querySelector('#ai-btn').addEventListener('click',async()=>{
  if(!deepseekApiKey){openApiModal('请先配置DeepSeek API Key，再生成AI建议。');return;}
  const btn=document.querySelector('#ai-btn'),out=document.querySelector('#ai-output');
  btn.disabled=true;out.textContent='DeepSeek 正在根据规则结果生成建议...';
  const payload={store:'合肥三里庵店',date:new Date().toISOString().slice(0,10),rules,decisions:decisions.map(x=>({product:x.name,avg7:+x.avg7.toFixed(1),available:x.available,coverDays:+x.coverDays.toFixed(1),order:x.order,risks:x.reasons,manualApproval:x.review}))};
  try{
    const res=await fetch('/api/deepseek',{method:'POST',headers:{'Content-Type':'application/json','X-DeepSeek-API-Key':deepseekApiKey},body:JSON.stringify(payload)});
    const data=await res.json();if(!res.ok)throw new Error(data.hint||data.detail||data.error);
    out.textContent=data.content;
    const u=data.usage||{};document.querySelector('#token-usage').textContent=`Token：输入 ${u.prompt_tokens??'-'} / 输出 ${u.completion_tokens??'-'} / 合计 ${u.total_tokens??'-'}`;
  }catch(e){out.textContent=`未调用成功：${e.message}\n\n规则计算仍可正常演示。配置API Key后再试。`;}
  finally{btn.disabled=false;}
});

render();
loadEditor();
updateApiStatus();
