/**
 * Curve System reference evaluator, schema 0.1.0.
 * Pure functions on normalized time t in [0,1]; no implicit clamping.
 * Original implementation from the mathematical definitions in this catalog.
 * Derivatives use analytic third-order forward automatic differentiation.
 */

export const schemaVersion = '0.1.0';
const PI = Math.PI;
const source = {
  css: 'https://www.w3.org/TR/css-easing-1/',
  easing: 'https://easings.net/',
  smooth: 'https://registry.khronos.org/OpenGL-Refpages/gl4/html/smoothstep.xhtml',
  spring: 'https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/pages/unit-ii-second-order-constant-coefficient-linear-equations/damped-harmonic-oscillators/',
  jerk: 'https://doi.org/10.1523/JNEUROSCI.05-07-01688.1985',
};
const parameter = (key, label, min, max, step, value, integer = false) =>
  ({key, label, min, max, step, default: value, integer});
const common = {
  domain: [0, 1], derivativeVariable: 'normalized-time',
  derivativeMethod: 'analytic-forward-ad-order-3', status: 'implemented',
};
const entries = [];
function add(id, name, nameRu, family, variant, formula, description, parameters = [], properties = {}, notes = [], sources = [source.easing]) {
  entries.push({id, name, nameRu, family, variant, formula, description, parameters,
    properties: {...common, monotone: true, bounded: true, normalizedEndpoints: true,
      continuous: true, ...properties}, notes, sources});
}
add('linear', 'Linear', 'Линейная', 'linear', 'none', 'f(t)=t',
  'Равномерное изменение значения; ненулевая скорость в начале и конце.', [], {},
  ['При продолжении постоянными значениями скорость скачком меняется на границах.'], [source.css]);
const variantRu = {in: 'разгон', out: 'торможение', 'in-out': 'разгон и торможение'};
const formulas = {
  quad: 'g(t)=t²', cubic: 'g(t)=t³', quart: 'g(t)=t⁴', quint: 'g(t)=t⁵',
  sine: 'g(t)=1−cos(πt/2)',
  expo: 'g(t)=expm1(k·t)/expm1(k)',
  circ: 'g(t)=1−√(1−t²)',
  back: 'g(t)=(s+1)t³−s·t²',
  elastic: 'g(t)=1−h(1−t); h(t)=(1−exp(−d·t)cos(2πc·t))/(1−exp(−d)cos(2πc))',
  bounce: 'g(t)=1−b(1−t); b(t)=a(t−oᵢ)²+cᵢ, a=121/16 (4 pieces)',
};
const familyRu = {quad:'Квадратичная',cubic:'Кубическая',quart:'Четвёртая степень',quint:'Пятая степень',
  sine:'Синусоидальная',expo:'Нормированная экспонента',circ:'Дуга окружности',back:'Обратный ход',elastic:'Упругий отклик',bounce:'Отскоки'};
for (const family of ['quad','cubic','quart','quint','sine','expo','circ','back','elastic','bounce']) {
  for (const variant of ['in','out','in-out']) {
    const params = family === 'expo' ? [parameter('strength','Крутизна k',1,12,0.1,7)] :
      family === 'back' ? [parameter('overshoot','Коэффициент s',0,4,0.05,1.70158)] :
      family === 'elastic' ? [parameter('decay','Затухание d',1,15,0.1,7),parameter('cycles','Колебания c',1,6,0.1,3.25)] : [];
    const notes = [];
    if (['expo','elastic'].includes(family)) notes.push('Непрерывная нормированная версия Curve System; не побитовая копия Penner с подстановкой крайних значений.');
    if (variant === 'in-out' && family !== 'sine') notes.push('Симметричная склейка в t=0.5 не гарантирует непрерывного ускорения.');
    if (family === 'circ') notes.push('Вертикальная касательная даёт неограниченные производные в некоторых точках; API возвращает null.');
    if (family === 'back') notes.push('Выход за [0,1] является частью формы; не обрезать результат автоматически. In-out — симметрия той же g, без дополнительного множителя Penner 1.525.');
    if (family === 'elastic') notes.push('Затухающий косинус — художественная функция; начальная скорость не обязана быть нулевой. Это не spring-response.');
    if (family === 'bounce') notes.push('В точках столкновения скорость имеет скачок; конечные ускорение и рывок там не определены.');
    const transform = variant === 'in' ? 'f=g' : variant === 'out' ? 'f(t)=1−g(1−t)' : 'f(t)=g(2t)/2 if t<1/2; 1−g(2−2t)/2 otherwise';
    add(`${family}-${variant}`, `${family[0].toUpperCase()+family.slice(1)} ${variant}`, `${familyRu[family]} · ${variantRu[variant]}`,
      family, variant, `${formulas[family]}; ${transform}`, `${familyRu[family]}: ${variantRu[variant]}.`, params,
      {monotone: !['back','elastic','bounce'].includes(family), bounded: !['back','elastic'].includes(family)}, notes);
  }
}
add('smoothstep','Smoothstep','Мягкий переход C¹','polynomial','none','f(t)=3t²−2t³',
  'Нулевая скорость по краям; при соединении с неподвижностью ускорение скачет.',[],
  {clampedContinuity:'C1'},[],[source.smooth]);
add('smootherstep','Smootherstep / minimum jerk','Мягкий переход C² · minimum jerk','polynomial','none','f(t)=10t³−15t⁴+6t⁵',
  'Нулевые скорость и ускорение на концах; подходит для плавного старта и остановки.',[],
  {clampedContinuity:'C2'},['Minimum jerk при фиксированных длительности, положениях и нулевых крайних скоростях/ускорениях. Это не универсальная оптимальность движения.'],[source.jerk]);
add('septic','Septic / zero endpoint jerk','Седьмая степень · нулевой рывок','polynomial','none','f(t)=35t⁴−84t⁵+70t⁶−20t⁷',
  'Нулевые первые три производные на концах: соединение с неподвижностью C³.',[],
  {clampedContinuity:'C3'},['Формула получается из восьми условий: значения 0/1 и нулевые первые три производные на обоих концах. Название septic указывает степень. Оптимальность minimum snap требует явно заданной вариационной задачи.'],[]);
add('logistic','Normalized logistic','Нормированная логистическая','sigmoid','none','f(t)=(σ(k(t−1/2))−σ(−k/2))/(σ(k/2)−σ(−k/2)); σ(x)=1/(1+e⁻ˣ)',
  'Управляемая S-форма. Значения в концах нормированы, но скорости там обычно ненулевые.',
  [parameter('steepness','Крутизна k',1,16,0.1,10)],{},['Самостоятельно нормированное определение логистической функции; соответствие конкретной внешней библиотеке не заявлено.'],[]);
add('cubic-bezier','Cubic Bézier','Кубическая Безье','bezier','none','f(t)=Bᵧ(u), where Bₓ(u)=t; P₀=(0,0),P₃=(1,1)',
  'Редактируемая временная кривая с двумя контрольными точками; время инвертируется численно.',
  [parameter('x1','x₁',0,1,0.01,0.42),parameter('y1','y₁',-2,3,0.01,0),parameter('x2','x₂',0,1,0.01,0.58),parameter('y2','y₂',-2,3,0.01,1)],
  {monotone:'parameter-dependent',bounded:'parameter-dependent'},
  ['Ограничение y в [-2,3] — диапазон редактора этой версии; CSS допускает произвольные конечные y.',
    'Производная при вырожденном dx/du может быть бесконечной. Равные x/y координаты распознаются как точная linear.'],[source.css]);
const springParameters = [parameter('frequency','Собственная частота ω, рад/с',1,30,0.1,12),parameter('damping','Коэффициент затухания ζ',0.05,2,0.01,0.35),parameter('duration','Горизонт T, с',0.1,3,0.05,1)];
add('spring-response','Physical spring response','Физический отклик пружины','spring','response','s″(τ)+2ζωs′(τ)+ω²(s(τ)−1)=0; s(0)=s′(0)=0; f(t)=s(Tt)',
  'Аналитический ответ системы второго порядка. Конец окна — не обязательно целевое значение.',springParameters,
  {monotone:'parameter-dependent',bounded:'parameter-dependent',normalizedEndpoints:false,endpointPolicy:'asymptotic'},
  ['T — физический горизонт в секундах. API производных дифференцирует по t, поэтому содержит множители Tⁿ.',
    'Нет переключения цели, начальной скорости и stateful-интегратора; это одиночный step response.'],[source.spring]);
add('spring-ease','Endpoint-normalized spring','Пружина с нормировкой конца','spring','normalized','f(t)=s(Tt)/s(T), with s from spring-response',
  'Пружинная форма на фиксированном интервале с точными значениями 0 и 1.',springParameters,
  {monotone:'parameter-dependent',bounded:'parameter-dependent',endpointPolicy:'normalize-value'},
  ['Нормировка меняет физический отклик и не обнуляет конечную скорость. Не выдавать эту функцию за исходный spring-response.'],[source.spring]);
for (const position of ['start','end']) add(`steps-${position}`,`Steps ${position}`,`Ступени · ${position==='start'?'скачок в начале':'скачок в конце'}`,'steps',position,
  position==='start' ? 'f(t)=min(1,(floor(n·t)+1)/n)' : 'f(t)=floor(n·t)/n',
  'Дискретное переключение состояний. Между скачками производные равны нулю.',
  [parameter('steps','Число ступеней n',1,24,1,5,true)],
  {continuous:false,normalizedEndpoints:position==='end',endpointPolicy:position==='start'?'initial-jump':'final-jump'},
  ['Реализованы jump-start/jump-end при before=false на [0,1]; это не полная модель CSS fill/before.',
    position==='start'?'f(0)=1/n: первая ступень появляется сразу.':'f(1)=1: последний скачок происходит в конце.'],[source.css]);

function freezeDeep(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}
export const catalog = freezeDeep(entries);
const byId = new Map(catalog.map(item=>[item.id,item]));

function checked(id,t,params) {
  const item = byId.get(id);
  if (!item) throw new RangeError(`Unknown curve id: ${id}`);
  if (typeof t!=='number' || !Number.isFinite(t) || t<0 || t>1) throw new RangeError('t must be a finite number in [0,1]');
  if (params===null || typeof params!=='object' || Array.isArray(params)) throw new TypeError('params must be an object');
  const valid = new Set(item.parameters.map(p=>p.key));
  for (const key of Object.keys(params)) if (!valid.has(key)) throw new RangeError(`Unknown parameter ${key} for ${id}`);
  const values = {};
  for (const p of item.parameters) {
    const value = Object.hasOwn(params,p.key) ? params[p.key] : p.default;
    if (typeof value!=='number' || !Number.isFinite(value) || value<p.min || value>p.max || (p.integer && !Number.isInteger(value)))
      throw new RangeError(`${p.key} must be ${p.integer?'an integer':'a finite number'} in [${p.min},${p.max}]`);
    values[p.key] = value;
  }
  return {item,values};
}

// A jet stores [value, first derivative, second derivative, third derivative].
const J = (v,d1=0,d2=0,d3=0)=>[v,d1,d2,d3];
const addJ = (a,b)=>a.map((v,i)=>v+b[i]);
const scaleJ = (a,k)=>a.map(v=>v*k);
const shiftJ = (a,k)=>[a[0]+k,a[1],a[2],a[3]];
const mulJ = (a,b)=>[a[0]*b[0],a[1]*b[0]+a[0]*b[1],a[2]*b[0]+2*a[1]*b[1]+a[0]*b[2],a[3]*b[0]+3*a[2]*b[1]+3*a[1]*b[2]+a[0]*b[3]];
const composeJ = (a,f,fp,fpp,fppp)=>[f,fp*a[1],fpp*a[1]**2+fp*a[2],fppp*a[1]**3+3*fpp*a[1]*a[2]+fp*a[3]];
const expJ = a=>{const y=Math.exp(a[0]);return composeJ(a,y,y,y,y);};
const expm1J = a=>{const y=expJ(a);y[0]=Math.expm1(a[0]);return y;};
const sinJ = a=>composeJ(a,Math.sin(a[0]),Math.cos(a[0]),-Math.sin(a[0]),-Math.cos(a[0]));
const cosJ = a=>composeJ(a,Math.cos(a[0]),-Math.sin(a[0]),-Math.cos(a[0]),Math.sin(a[0]));
const sqrtJ = a=>{const y=Math.sqrt(Math.max(0,a[0]));return composeJ(a,y,1/(2*y),-1/(4*y**3),3/(8*y**5));};
const reciprocalJ = a=>composeJ(a,1/a[0],-1/a[0]**2,2/a[0]**3,-6/a[0]**4);
function powerJ(a,n) {let y=J(1);for(let i=0;i<n;i++)y=mulJ(y,a);return y;}
function polynomialJ(a,coefficients) {let y=J(0);for(let i=coefficients.length-1;i>=0;i--)y=shiftJ(mulJ(y,a),coefficients[i]);return y;}
const reverseJ = a=>shiftJ(scaleJ(a,-1),1);
const bounceKnots = [4/11,8/11,10/11];
function bounceOutJ(t) {
  const a=121/16;
  const [offset,height] = t[0]<4/11 ? [0,0] : t[0]<8/11 ? [6/11,3/4] : t[0]<10/11 ? [9/11,15/16] : [21/22,63/64];
  return shiftJ(scaleJ(powerJ(shiftJ(t,-offset),2),a),height);
}
function elasticOutJ(t,p) {
  const denominator=1-Math.exp(-p.decay)*Math.cos(2*PI*p.cycles);
  const decay=scaleJ(t,-p.decay);
  // 1 - exp(-d*t)*cos(w*t), written without cancellation near t=0.
  const numerator=addJ(scaleJ(expm1J(decay),-1),scaleJ(mulJ(expJ(decay),powerJ(sinJ(scaleJ(t,PI*p.cycles)),2)),2));
  return scaleJ(numerator,1/denominator);
}
function baseJ(family,t,p) {
  if (['quad','cubic','quart','quint'].includes(family)) return powerJ(t,{quad:2,cubic:3,quart:4,quint:5}[family]);
  if (family==='sine') return scaleJ(powerJ(sinJ(scaleJ(t,PI/4)),2),2);
  if (family==='expo') return scaleJ(expm1J(scaleJ(t,p.strength)),1/Math.expm1(p.strength));
  if (family==='circ') {
    const square=powerJ(t,2);
    return mulJ(square,reciprocalJ(shiftJ(sqrtJ(reverseJ(square)),1)));
  }
  if (family==='back') return addJ(scaleJ(powerJ(t,3),p.overshoot+1),scaleJ(powerJ(t,2),-p.overshoot));
  if (family==='elastic') return reverseJ(elasticOutJ(reverseJ(t),p));
  if (family==='bounce') return reverseJ(bounceOutJ(reverseJ(t)));
  throw new RangeError(`Unsupported family: ${family}`);
}
function variantJ(item,t,p) {
  if(item.variant==='out') {
    if(item.family==='sine')return sinJ(scaleJ(t,PI/2));
    if(item.family==='expo')return scaleJ(expm1J(scaleJ(t,-p.strength)),1/Math.expm1(-p.strength));
    if(item.family==='circ')return sqrtJ(mulJ(t,shiftJ(scaleJ(t,-1),2)));
    if(item.family==='elastic')return elasticOutJ(t,p);
    if(item.family==='bounce')return bounceOutJ(t);
  }
  if(item.variant==='in-out' && item.family==='sine')return powerJ(sinJ(scaleJ(t,PI/2)),2);
  if (item.variant==='in') return baseJ(item.family,t,p);
  if (item.variant==='out') return reverseJ(baseJ(item.family,reverseJ(t),p));
  return t[0]<0.5 ? scaleJ(baseJ(item.family,scaleJ(t,2),p),0.5) :
    reverseJ(scaleJ(baseJ(item.family,scaleJ(reverseJ(t),2),p),0.5));
}
function springJ(t,p) {
  const time=scaleJ(t,p.duration), w=p.frequency, z=p.damping;
  if (Math.abs(z-1)<1e-10) return reverseJ(mulJ(expJ(scaleJ(time,-w)),shiftJ(scaleJ(time,w),1)));
  if (z<1) {
    const q=Math.sqrt(1-z*z), phase=scaleJ(time,w*q);
    return reverseJ(mulJ(expJ(scaleJ(time,-z*w)),addJ(cosJ(phase),scaleJ(sinJ(phase),z/q))));
  }
  const q=Math.sqrt(z*z-1), r1=-w/(z+q), r2=-w*(z+q);
  // Real roots avoid multiplying exp(-z*w*t) by a potentially huge cosh.
  return reverseJ(scaleJ(addJ(scaleJ(expJ(scaleJ(time,r1)),-r2),scaleJ(expJ(scaleJ(time,r2)),r1)),1/(r1-r2)));
}
const bezierCoefficients=(p1,p2)=>[0,3*p1,3*p2-6*p1,1+3*p1-3*p2];
function bezierJet(t,p) {
  if(p.x1===p.y1 && p.x2===p.y2)return J(t,1,0,0);
  const xc=bezierCoefficients(p.x1,p.x2),yc=bezierCoefficients(p.y1,p.y2);
  const position=(u,c)=>((c[3]*u+c[2])*u+c[1])*u;
  let u=t;
  if(t>0 && t<1) {
    const reversedX=bezierCoefficients(1-p.x2,1-p.x1);
    const center=.125+.375*(p.x1+p.x2);
    const centerD1=.75*(1-p.x1+p.x2), centerD2Half=1.5*(1-p.x1-p.x2);
    const residual=u=>{
      if(u<.25)return position(u,xc)-t;
      if(u>.75)return (1-t)-position(1-u,reversedX);
      const du=u-.5;
      // Keep a tiny x(t)-input residual intact near a stationary midpoint.
      return (center-t)+du*(centerD1+du*(centerD2Half+du*xc[3]));
    };
    let lo=0,hi=1;
    // Pure bracketed inversion remains stable near stationary x'(u).
    for(let i=0;i<64;i++) {
      u=(lo+hi)/2;
      const difference=residual(u);
      if(difference===0)break;
      if(difference<0)lo=u;else hi=u;
    }
  }
  const x=polynomialJ(J(u,1),xc),y=polynomialJ(J(u,1),yc);
  // Convex combination of the four corner-control derivatives: all terms are
  // nonnegative. Unlike power-basis subtraction, this preserves tiny positive
  // slopes and the stationary interior x1=1,x2=0 case.
  x[1]=3*((1-p.x1)*(1-p.x2)*u*u+(1-p.x1)*p.x2*2*u*(1-u)+p.x1*(1-p.x2)*(1-2*u)**2+p.x1*p.x2*(1-u)**2);
  if(x[1]===0) {
    let velocity=NaN;
    if(t===0 && p.x1===0 && p.y1===0 && p.x2>0)velocity=p.y2/p.x2;
    if(t===1 && p.x2===1 && p.y2===1 && p.x1<1)velocity=(1-p.y1)/(1-p.x1);
    return J(y[0],velocity,NaN,NaN);
  }
  return J(y[0],y[1]/x[1],(y[2]*x[1]-y[1]*x[2])/x[1]**3,
    (y[3]*x[1]**2-y[1]*x[3]*x[1]-3*y[2]*x[1]*x[2]+3*y[1]*x[2]**2)/x[1]**5);
}
function rawJ(item,t,p) {
  const x=J(t,1);
  if(item.id==='linear')return x;
  // Evaluate each symmetric rest-to-rest polynomial from its nearest endpoint.
  // This avoids cancellation above 1 near t=1 without clamping any curve.
  const restPolynomial=coefficients=>t>.5 ? reverseJ(polynomialJ(reverseJ(x),coefficients)) : polynomialJ(x,coefficients);
  if(item.id==='smoothstep')return restPolynomial([0,0,3,-2]);
  if(item.id==='smootherstep')return restPolynomial([0,0,0,10,-15,6]);
  if(item.id==='septic')return restPolynomial([0,0,0,0,35,-84,70,-20]);
  if(item.id==='logistic') {
    const low=1/(1+Math.exp(p.steepness/2)), high=1-low;
    return scaleJ(shiftJ(reciprocalJ(shiftJ(expJ(scaleJ(shiftJ(x,-0.5),-p.steepness)),1)),-low),1/(high-low));
  }
  if(item.id==='cubic-bezier')return bezierJet(t,p);
  if(item.family==='spring') {
    const response=springJ(x,p);
    if(item.id==='spring-response')return response;
    const denominator=springJ(J(1),p)[0];
    if(Math.abs(denominator)<1e-12)throw new RangeError('Spring endpoint cannot be normalized');
    return scaleJ(response,1/denominator);
  }
  if(item.family==='steps') {
    // Comparing against the same k/n knots used by breakpoints avoids rounding
    // floor((15/22)*22) down to 14 at an exact declared jump location.
    let level=0;
    while(level<p.steps && t>=(level+1)/p.steps)level++;
    return J(Math.min(p.steps,level+(item.variant==='start'?1:0))/p.steps);
  }
  return variantJ(item,x,p);
}

function internalBreakpoints(item,p) {
  const points=[];
  if(item.family==='steps') {
    for(let k=1;k<=p.steps;k++)if(item.variant==='end'||k<p.steps)points.push({t:k/p.steps,order:0});
  }
  if(item.family==='bounce') {
    const inward=bounceKnots.map(t=>1-t);
    const knots=item.variant==='in'?inward:item.variant==='out'?bounceKnots:
      [...inward.map(t=>t/2),...inward.map(t=>1-t/2)];
    points.push(...knots.map(t=>({t,order:1})));
  }
  if(item.variant==='in-out' && formulas[item.family]) {
    const endpoint=baseJ(item.family,J(1,1),p);
    if(!Number.isFinite(endpoint[1]))points.push({t:0.5,order:1});
    else if(Math.abs(endpoint[2])>1e-10)points.push({t:0.5,order:2});
  }
  return points.sort((a,b)=>a.t-b.t);
}

/** Return discontinuity locations; order 0=value, 1=velocity, 2=acceleration. */
export function breakpoints(id,params={}) {
  const {item,values}=checked(id,0,params);
  return internalBreakpoints(item,values);
}

/** Evaluate one scalar value. Values outside [0,1] are intentionally preserved. */
export function evaluate(id,t,params={}) {
  const {item,values}=checked(id,t,params);
  const result=rawJ(item,t,values)[0];
  if(!Number.isFinite(result))throw new RangeError('Curve evaluation produced a non-finite value');
  // Correct arithmetic roundoff, not the shape or a truncated physical response.
  if(item.properties.normalizedEndpoints && (t===0 || t===1))return t;
  return result;
}

/**
 * Derivatives are with respect to normalized time, not physical seconds.
 * At endpoints: interior one-sided limits. At a discontinuity: null from the
 * first undefined derivative onward. Infinite derivatives are also null.
 */
export function derivatives(id,t,params={}) {
  const {item,values}=checked(id,t,params);
  const jet=rawJ(item,t,values);
  for(const point of internalBreakpoints(item,values)) {
    if(Math.abs(point.t-t)<1e-12)for(let n=Math.max(1,point.order);n<=3;n++)jet[n]=NaN;
  }
  if(item.properties.normalizedEndpoints && (t===0 || t===1))jet[0]=t;
  return Object.fromEntries(['value','velocity','acceleration','jerk'].map((key,i)=>[key,Number.isFinite(jet[i])?jet[i]:null]));
}

/** Inclusive, uniform samples. Insert breakpoints separately for faithful plots. */
export function sample(id,count=201,params={}) {
  if(!Number.isInteger(count)||count<2||count>100001)throw new RangeError('count must be an integer in [2,100001]');
  checked(id,0,params);
  return Array.from({length:count},(_,i)=>{const t=i/(count-1);return {t,...derivatives(id,t,params)};});
}

/** Exact CSS form within the supported [0,1] domain, otherwise null. */
export function toCSS(id,params={}) {
  const {item,values:p}=checked(id,0,params);
  if(id==='linear')return 'linear';
  if(id==='cubic-bezier')return `cubic-bezier(${p.x1}, ${p.y1}, ${p.x2}, ${p.y2})`;
  if(item.family==='steps')return `steps(${p.steps}, jump-${item.variant})`;
  // A cubic polynomial with time control points at 1/3,2/3 is exactly Bézier.
  if(id==='smoothstep')return 'cubic-bezier(0.3333333333333333, 0, 0.6666666666666666, 1)';
  return null;
}
