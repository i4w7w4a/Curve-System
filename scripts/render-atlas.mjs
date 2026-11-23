import {writeFile,mkdir,readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {catalog,evaluate,derivatives,sample,breakpoints,schemaVersion} from '../src/curves.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const checkOnly=process.argv.includes('--check');
const palette={bg:'#0b1220',panel:'#111d30',border:'#26364d',grid:'#25364a',text:'#edf5ff',muted:'#9bafc7',cyan:'#55dfed',blue:'#87a9ff',coral:'#ff9f87',lime:'#c6ec86'};
const colorFor=c=>['back','elastic','bounce'].includes(c.family)?palette.coral:
  c.family==='spring'?palette.lime:['steps','bezier'].includes(c.family)?palette.blue:palette.cyan;
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const number=n=>Number(n.toFixed(3)).toString();
const svgStart=(w,h,title,desc)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title desc">\n<title id="title">${esc(title)}</title>\n<desc id="desc">${esc(desc)}</desc>\n<style>text{font-family:Inter,DejaVu Sans,Arial,sans-serif} .mono{font-family:DejaVu Sans Mono,monospace}</style>\n<rect width="${w}" height="${h}" rx="24" fill="${palette.bg}"/>\n`;
const text=(x,y,value,size=16,fill=palette.text,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${extra}>${esc(value)}</text>\n`;
const line=(x1,y1,x2,y2,stroke=palette.grid,extra='')=>`<line x1="${number(x1)}" y1="${number(y1)}" x2="${number(x2)}" y2="${number(y2)}" stroke="${stroke}" ${extra}/>\n`;
const circle=(x,y,r,fill,stroke=fill)=>`<circle cx="${number(x)}" cy="${number(y)}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>\n`;

function axes(x,y,w,h,min=-.2,max=1.45,{small=false,yTicks=[0,0.5,1],xLabel=true}={}) {
  const sx=t=>x+t*w,sy=v=>y+h-(v-min)/(max-min)*h;
  let out='';
  for(const t of [0,.25,.5,.75,1])out+=line(sx(t),y,sx(t),y+h,palette.grid,'stroke-width="1"');
  for(const v of yTicks) {
    out+=line(x,sy(v),x+w,sy(v),v===0?'#62738b':palette.grid,'stroke-width="1"');
    out+=text(x-10,sy(v)+4,number(v),small?11:13,palette.muted,'text-anchor="end"');
  }
  out+=line(x,y+h,x+w,y+h,'#62738b');
  for(const t of [0,.5,1])out+=text(sx(t),y+h+(small?17:23),number(t),small?11:13,palette.muted,'text-anchor="middle"');
  if(xLabel)out+=text(x+w,y+h+(small?31:42),'t',small?12:15,palette.muted,'text-anchor="end"');
  return {out,sx,sy};
}
function pathFrom(points,sx,sy,key='value') {
  let d='',open=false;
  for(const p of points) {
    const v=p[key];
    if(v===null||!Number.isFinite(v)){open=false;continue;}
    d+=`${open?'L':'M'}${number(sx(p.t))},${number(sy(v))}`;open=true;
  }
  return d;
}
function curvePath(c,sx,sy,{stroke=colorFor(c),width=3,reference=false,count=201}={}) {
  let out='';
  if(reference)out+=line(sx(0),sy(0),sx(1),sy(1),'#61748f','stroke-width="1.3" stroke-dasharray="5 6" opacity="0.6"');
  if(c.family==='steps') {
    const n=c.parameters.find(p=>p.key==='steps').default;
    for(let k=0;k<n;k++) {
      const v=evaluate(c.id,(k+.5)/n);
      out+=line(sx(k/n),sy(v),sx((k+1)/n),sy(v),stroke,`stroke-width="${width}"`);
    }
    for(const point of breakpoints(c.id)) {
      const lower=evaluate(c.id,Math.max(0,point.t-1e-8)),upper=evaluate(c.id,point.t);
      out+=line(sx(point.t),sy(lower),sx(point.t),sy(upper),stroke,'stroke-width="1" stroke-dasharray="3 4" opacity="0.5"');
      out+=circle(sx(point.t),sy(lower),2.6,palette.panel,stroke);
      out+=circle(sx(point.t),sy(upper),2.6,stroke);
    }
  } else {
    const points=[...sample(c.id,count),...breakpoints(c.id).map(p=>({t:p.t,value:evaluate(c.id,p.t)}))].sort((a,b)=>a.t-b.t);
    out+=`<path d="${pathFrom(points,sx,sy)}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>\n`;
  }
  return out;
}
function individual(c) {
  const w=1040,h=500;
  let out=svgStart(w,h,c.nameRu,`${c.description} Ось x: нормализованное время t от 0 до 1. Ось y: значение f(t). Пунктир — линейный переход. График вычислен исходным evaluator Curve System.`);
  out+=text(40,48,c.name,30,palette.text,'font-weight="700"');
  out+=text(40,80,c.nameRu,18,palette.muted);
  const {out:grid,sx,sy}=axes(75,116,650,278,-.45,1.45);
  out+=grid+curvePath(c,sx,sy,{reference:true,width:3.5,count:321});
  out+=circle(sx(0),sy(evaluate(c.id,0)),4.5,colorFor(c))+circle(sx(1),sy(evaluate(c.id,1)),4.5,colorFor(c));
  out+=text(75,108,'f(t)',14,palette.muted);
  out+=`<rect x="772" y="116" width="225" height="278" rx="15" fill="${palette.panel}" stroke="${palette.border}"/>\n`;
  out+=text(792,147,'ПО УМОЛЧАНИЮ',12,palette.muted,'letter-spacing="1.5"');
  out+=line(792,173,817,173,colorFor(c),'stroke-width="3"')+text(830,178,'Значение',14);
  out+=line(792,203,817,203,'#61748f','stroke-width="1.3" stroke-dasharray="5 5"')+text(830,208,'Linear',14,palette.muted);
  const points=sample(c.id,1001).map(p=>p.value);
  const fields=[['f(0)',evaluate(c.id,0)],['f(1)',evaluate(c.id,1)],['min*',Math.min(...points)],['max*',Math.max(...points)]];
  fields.forEach(([label,value],i)=>{
    out+=text(792,246+29*i,label,14,palette.muted,'class="mono"');
    out+=text(974,246+29*i,number(value),14,palette.text,'class="mono" text-anchor="end"');
  });
  out+=text(40,464,`CURVE SYSTEM  /  ${c.id}`,13,palette.muted,'class="mono"');
  out+=text(997,464,'* extrema: 1001 samples',12,palette.muted,'text-anchor="end"');
  return out+'</svg>\n';
}
const galleryIds=['linear','quad-in-out','cubic-in-out','quart-in-out','quint-in-out','sine-in-out','expo-in-out','circ-in-out','back-out','elastic-out','bounce-out','smoothstep','smootherstep','septic','logistic','cubic-bezier','spring-response','spring-ease','steps-start','steps-end'];
function gallerySVG() {
  let out=svgStart(1280,1414,'Curve System — визуальный атлас основных кривых','20 показательных профилей из 40 реализованных пресетов. Общие масштабы: t от 0 до 1, значение от -0.2 до 1.45. Цвета различают спокойные, выразительные, физические и дискретные формы.');
  out+=text(38,48,'Одна шкала времени. Разный характер.',28,palette.text,'font-weight="700"');
  out+=text(38,79,'20 профилей · общий масштаб · точные формулы · параметры по умолчанию',15,palette.muted);
  const groups=[['#55dfed','Плавные'],['#ff9f87','Выразительные'],['#c6ec86','Пружины'],['#87a9ff','Bézier / steps']];
  groups.forEach(([color,label],i)=>{out+=circle(47+i*260,108,4,color)+text(60+i*260,113,label,13,palette.muted);});
  galleryIds.forEach((id,i)=>{
    const c=catalog.find(x=>x.id===id),x=36+(i%4)*307,y=140+Math.floor(i/4)*242;
    out+=`<rect x="${x}" y="${y}" width="289" height="225" rx="15" fill="${palette.panel}" stroke="${palette.border}"/>\n`;
    const shortName=c.id==='spring-ease'?'Spring · normalized':c.name.replace(' / minimum jerk','').replace(' / zero endpoint jerk','');
    out+=text(x+17,y+29,shortName,16,palette.text,'font-weight="600"');
    out+=text(x+17,y+49,c.id,11,palette.muted,'class="mono"');
    const {out:grid,sx,sy}=axes(x+38,y+64,230,118,-.2,1.45,{small:true,yTicks:[0,1]});
    out+=grid+curvePath(c,sx,sy,{reference:true,width:2.5,count:181});
  });
  out+=text(38,1383,'Графики показывают f(t), а не скорость. Скорость, ускорение и рывок — отдельные производные.',14,palette.muted);
  return out+'</svg>\n';
}
function heroSVG() {
  let out=svgStart(1600,620,'Curve System — форма изменения во времени','Научный и визуальный атлас кривых. Справа: линейное движение, Smootherstep, Back out и физическая пружина при одинаковом нормализованном времени.');
  out+=text(64,64,'MOTION  /  MATHEMATICS  /  SYSTEMS',16,palette.cyan,'letter-spacing="2.5"');
  out+=text(58,181,'Curve',100,palette.text,'font-weight="750" letter-spacing="-5"');
  out+=text(58,286,'System',100,palette.text,'font-weight="750" letter-spacing="-5"');
  out+=text(64,343,'Форма изменения во времени',27,palette.muted);
  out+=text(64,392,'Выбрать. Понять. Настроить. Применить.',21,palette.text);
  out+=`<rect x="64" y="438" width="420" height="61" rx="13" fill="${palette.panel}" stroke="${palette.border}"/>\n`;
  out+=text(84,476,'40 ПРЕСЕТОВ  ·  16 СЕМЕЙСТВ',16,palette.cyan,'font-weight="600" letter-spacing="1"');
  out+=text(64,557,'VISUAL ATLAS + RESEARCH + REFERENCE CORE',13,palette.muted,'letter-spacing="1.5"');
  const {out:grid,sx,sy}=axes(680,98,825,366,-.15,1.4,{yTicks:[0,.5,1]});
  out+=grid+text(680,77,'Значение f(t)',17,palette.muted);
  const curves=[['linear','#7689a4'],['smootherstep',palette.cyan],['back-out',palette.coral],['spring-response',palette.lime]];
  curves.forEach(([id,color])=>{out+=curvePath(catalog.find(c=>c.id===id),sx,sy,{stroke:color,width:id==='linear'?2:4,count:401});});
  curves.forEach(([id,color],i)=>{
    const x=680+(i%2)*415,y=554+Math.floor(i/2)*30;
    out+=line(x,y-5,x+26,y-5,color,'stroke-width="3"')+text(x+39,y,id,16,palette.muted);
  });
  return out+'</svg>\n';
}
function derivativesSVG() {
  let out=svgStart(1280,840,'Smootherstep: значение, скорость, ускорение и рывок','Четыре аналитически рассчитанных графика одной кривой. Производные взяты по нормализованному времени. Ускорение и скорость обращаются в ноль по краям, рывок равен 60.');
  out+=text(38,49,'Одна кривая. Четыре разных графика.',29,palette.text,'font-weight="700"');
  out+=text(38,81,'Smootherstep  /  f(t) = 10t³ − 15t⁴ + 6t⁵  /  нормализованное время',16,palette.muted);
  const charts=[['value','Значение f(t)',0,1.08,[0,.5,1],palette.cyan],
    ['velocity','Скорость f′(t)',0,2.05,[0,1,2],palette.blue],
    ['acceleration','Ускорение f″(t)',-6.6,6.6,[-6,0,6],palette.coral],
    ['jerk','Рывок f‴(t)',-36,67,[-30,0,60],palette.lime]];
  charts.forEach(([key,label,min,max,ticks,color],i)=>{
    const x=36+(i%2)*614,y=110+Math.floor(i/2)*324;
    out+=`<rect x="${x}" y="${y}" width="592" height="305" rx="15" fill="${palette.panel}" stroke="${palette.border}"/>\n`;
    out+=text(x+22,y+34,label,20,palette.text,'font-weight="600"');
    const {out:grid,sx,sy}=axes(x+58,y+63,506,175,min,max,{yTicks:ticks});
    out+=grid+`<path d="${pathFrom(sample('smootherstep',401),sx,sy,key)}" fill="none" stroke="${color}" stroke-width="3.5"/>\n`;
    for(const t of [0,1])out+=circle(sx(t),sy(derivatives('smootherstep',t)[key]),4,color);
  });
  out+=text(38,797,'Для q(s)=q₀+Δq·f((s−s₀)/T):  q′=Δq/T·f′,  q″=Δq/T²·f″,  q‴=Δq/T³·f‴.',16,palette.muted);
  return out+'</svg>\n';
}
function catalogMarkdown() {
  let out=`<!-- Generated by scripts/render-atlas.mjs. Edit src/curves.mjs or the generator. -->\n# Визуальный каталог кривых\n\n[Главная](../README.md) · [Математика](mathematics.md) · [Исходный реестр](../catalog/curves.json) · [Просмотрщик](../examples/playground.html)\n\n**40 пресетов в 16 семействах.** Это рабочая начальная коллекция, а не заявление о полноте всех возможных кривых. Все рисунки созданы из того же evaluator, который возвращает значения в JavaScript.\n\n![Обзор основных кривых](../assets/gallery.svg)\n\n## Как читать\n\nПо горизонтали — нормализованное время \`t ∈ [0,1]\`, по вертикали — значение \`f(t)\`. Пунктир показывает \`linear\`. Выход за диапазон 0–1 сохранён. В обзорной галерее использован общий вертикальный масштаб [-0.2, 1.45], в отдельных карточках — [-0.45, 1.45], чтобы также показать отрицательный ход elastic-in. Все карточки рассчитаны при параметрах по умолчанию. У ступеней пунктиром обозначен скачок: диагональный переход между уровнями не подразумевается. Численные min/max на карточках оценены по 1001 отсчёту, это не доказанные экстремумы.\n\nПроизводные вычисляются аналитически: автоматическое дифференцирование до третьего порядка и неявные производные Bézier. Они относятся к нормализованному \`t\`. На концах — внутренние односторонние пределы, без подразумеваемого продолжения неподвижностью. \`null\` обозначает отсутствующую конечную производную; точки склейки распознаются с численной погрешностью 1e-12.\n\n## Важные различия версий\n\n- \`expo-*\` и \`elastic-*\` здесь непрерывно нормированы на концах. Это собственные явно определённые варианты, которые не обязаны совпадать с одноимёнными пресетами Penner, GSAP или After Effects.\n- \`back-in-out\` отражает ту же базовую формулу; дополнительный множитель 1.525, встречающийся в классическом варианте Penner, не применяется.\n- \`spring-response\` — физическая модель, её значение в конце окна обычно не равно 1. \`spring-ease\` делится на значение в конце окна, поэтому перестаёт быть исходным физическим откликом.\n- \`steps-start\` начинается со значения 1/n. Все ступени заданы с CSS before=false; поддержаны только jump-start и jump-end.\n- \`cubic-bezier\` решает x(u)=t; подстановка u=t в общий случай неверна. Диапазоны параметров реестра — поддержанный диапазон этой версии, а не все математически допустимые значения.\n- Поля \`monotone\` и \`bounded\` с булевым значением описывают базовый/обычный режим семейства; если свойство помечено \`parameter-dependent\`, проверять его для конкретных параметров. \`false\` не означает, что никакой набор параметров не даст монотонную/ограниченную кривую.\n\n## Индекс\n\n| ID | Название | Настройка | f(1) по умолчанию |\n|---|---|---|---:|\n`;
  for(const c of catalog)out+=`| [${c.id}](#${c.id}) | ${c.nameRu} | ${c.parameters.map(p=>p.key).join(', ')||'—'} | ${number(evaluate(c.id,1))} |\n`;
  out+='\n## Карточки\n\n';
  for(const c of catalog) {
    out+=`<a id="${c.id}"></a>\n<details>\n<summary><strong>${c.name}</strong> — ${c.nameRu}</summary>\n\n![${c.nameRu}: график значения](../assets/curves/${c.id}.svg)\n\n${c.description}\n\n**Формула:** \`${c.formula}\`\n\n`;
    if(c.parameters.length) {
      out+='| Параметр | Смысл | Диапазон | По умолчанию |\n|---|---|---|---:|\n';
      for(const p of c.parameters)out+=`| \`${p.key}\` | ${p.label} | ${p.min}…${p.max}${p.integer?' (целое)':''} | ${p.default} |\n`;
      out+='\n';
    }
    for(const note of c.notes)out+=`- ${note}\n`;
    if(c.sources.length)out+=`\n**Ориентиры для семейства:** ${c.sources.map((url,i)=>`[источник ${i+1}](${url})`).join(' · ')}. Точная версия задаётся формулой выше.\n`;
    else out+='\n**Происхождение:** определение и вывод из указанных граничных условий в этом проекте.\n';
    out+='\n</details>\n\n';
  }
  out+='## Значение и производные\n\n![Четыре графика Smootherstep](../assets/derivatives.svg)\n\nСопоставлять формы следует при одинаковых начальном/конечном значениях и длительности. Если анимация превращается в пространственную траекторию, отдельно учитывать геометрию пути и параметризацию по длине дуги.\n';
  return out;
}

const files=new Map([
  ['catalog/curves.json',JSON.stringify({schemaVersion,generatedBy:'scripts/render-atlas.mjs',sourceReviewDate:'2026-11-24',curves:catalog},null,2)+'\n'],
  ['assets/hero.svg',heroSVG()],['assets/gallery.svg',gallerySVG()],['assets/derivatives.svg',derivativesSVG()],
  ['docs/catalog.md',catalogMarkdown()],
]);
for(const c of catalog)files.set(`assets/curves/${c.id}.svg`,individual(c));
let mismatches=0;
for(const [path,content] of files) {
  const target=resolve(root,path);
  if(checkOnly) {
    const current=await readFile(target,'utf8').catch(()=>null);
    if(current!==content){console.error(`Out of date: ${path}`);mismatches++;}
  } else {
    await mkdir(dirname(target),{recursive:true});
    await writeFile(target,content);
  }
}
if(mismatches)process.exitCode=1;
else console.log(`${checkOnly?'Verified':'Generated'} ${files.size} reproducible files: 43 SVGs, registry and catalog.`);
