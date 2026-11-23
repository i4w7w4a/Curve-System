import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog,evaluate,derivatives,sample,breakpoints,toCSS} from '../src/curves.mjs';

const close=(actual,expected,tolerance=1e-10)=>assert.ok(Math.abs(actual-expected)<=tolerance,
  `${actual} differs from ${expected} by ${Math.abs(actual-expected)} (tolerance ${tolerance})`);

test('catalog IDs are stable, unique and immutable',()=>{
  assert.equal(catalog.length,40);
  assert.equal(new Set(catalog.map(x=>x.id)).size,catalog.length);
  assert.ok(Object.isFrozen(catalog));
  for(const c of catalog) {
    assert.ok(Object.isFrozen(c.parameters));
    assert.ok(c.sources.every(s=>s.startsWith('https://')));
    assert.equal(c.properties.status,'implemented');
  }
});

test('default curves honor declared endpoints and finite values',()=>{
  for(const c of catalog) {
    if(c.properties.normalizedEndpoints) {
      assert.equal(evaluate(c.id,0),0,c.id);
      assert.equal(evaluate(c.id,1),1,c.id);
    }
    for(const row of sample(c.id,151)) {
      assert.ok(Number.isFinite(row.value),`${c.id} @ ${row.t}`);
      for(const key of ['velocity','acceleration','jerk'])
        assert.ok(row[key]===null||Number.isFinite(row[key]),`${c.id}: ${key}`);
    }
  }
  assert.equal(evaluate('steps-start',0),0.2);
  assert.notEqual(evaluate('spring-response',1),1);
});

test('strict validation rejects non-finite time, unknown IDs and ambiguous parameters',()=>{
  for(const t of [-1,1.1,Infinity,NaN,'0.5',null])assert.throws(()=>evaluate('linear',t),RangeError);
  assert.throws(()=>evaluate('missing',.5),RangeError);
  assert.throws(()=>evaluate('linear',.5,{steepness:1}),RangeError);
  for(const p of [null,[],1,'x'])assert.throws(()=>evaluate('linear',.5,p),TypeError);
  assert.throws(()=>evaluate('steps-end',.5,{steps:2.5}),RangeError);
  assert.throws(()=>evaluate('cubic-bezier',.5,{x1:-.1}),RangeError);
  assert.throws(()=>evaluate('spring-ease',.5,{damping:NaN}),RangeError);
  assert.throws(()=>sample('linear',1),RangeError);
  assert.throws(()=>sample('linear',1e7),RangeError);
  assert.throws(()=>toCSS('linear',{oops:1}),RangeError);
});

test('declared default monotonicity and bounds hold on a dense grid',()=>{
  for(const c of catalog) {
    const points=sample(c.id,1001);
    if(c.properties.monotone===true)for(let i=1;i<points.length;i++)
      assert.ok(points[i].value>=points[i-1].value-1e-12,c.id);
    if(c.properties.bounded===true)for(const p of points)
      assert.ok(p.value>=-1e-12&&p.value<=1+1e-12,`${c.id}=${p.value}`);
  }
});

test('in/out reflection and in-out time reversal are coherent',()=>{
  for(const family of ['quad','cubic','quart','quint','sine','expo','circ','back','elastic','bounce']) {
    for(let i=0;i<=20;i++) {
      const t=i/20;
      close(evaluate(`${family}-out`,t),1-evaluate(`${family}-in`,1-t),2e-14);
      close(evaluate(`${family}-in-out`,t)+evaluate(`${family}-in-out`,1-t),1,2e-14);
    }
  }
});

test('analytic derivatives agree with independently differenced values away from singularities',()=>{
  const ids=['quad-in','quint-out','sine-in-out','expo-out','circ-in','back-out','elastic-in',
    'bounce-out','smoothstep','smootherstep','septic','logistic','cubic-bezier','spring-response','spring-ease'];
  for(const id of ids)for(const t of [.123,.311,.633,.821]) {
    const h=1e-5,d=derivatives(id,t);
    const vm=evaluate(id,t-h),vp=evaluate(id,t+h);
    close(d.velocity,(vp-vm)/(2*h),2e-6*Math.max(1,Math.abs(d.velocity)));
    close(d.acceleration,(derivatives(id,t+h).velocity-derivatives(id,t-h).velocity)/(2*h),2e-5*Math.max(1,Math.abs(d.acceleration)));
    close(d.jerk,(derivatives(id,t+h).acceleration-derivatives(id,t-h).acceleration)/(2*h),1e-4*Math.max(1,Math.abs(d.jerk)));
  }
});

test('rest-to-rest polynomials supply distinct endpoint continuity orders',()=>{
  for(const t of [0,1]) {
    const s3=derivatives('smoothstep',t),s5=derivatives('smootherstep',t),s7=derivatives('septic',t);
    close(s3.velocity,0);assert.notEqual(s3.acceleration,0);
    close(s5.velocity,0);close(s5.acceleration,0);close(s5.jerk,60);
    close(s7.velocity,0);close(s7.acceleration,0);close(s7.jerk,0);
  }
  close(derivatives('smootherstep',.5).velocity,1.875);
});

test('rest-to-rest polynomials stay exactly bounded near the final endpoint',()=>{
  for(const id of ['smoothstep','smootherstep','septic'])for(let exponent=2;exponent<=16;exponent++) {
    const value=evaluate(id,1-10**(-exponent));
    assert.ok(value>=0&&value<=1,`${id} at 1-1e-${exponent} left [0,1]: ${value}`);
  }
});

test('integrating smooth velocity reproduces unit displacement',()=>{
  // Simpson quadrature is independent of the forward evaluator implementation.
  for(const id of ['linear','smoothstep','smootherstep','septic','sine-in-out','logistic','cubic-bezier']) {
    const n=1000;let sum=0;
    for(let i=0;i<=n;i++)sum+=(i===0||i===n?1:i%2?4:2)*derivatives(id,i/n).velocity;
    close(sum/(3*n),1,2e-9);
  }
});

test('piecewise joins expose missing derivatives without artificial finite spikes',()=>{
  assert.deepEqual(derivatives('quad-in-out',.5),{value:.5,velocity:2,acceleration:null,jerk:null});
  assert.equal(derivatives('circ-in-out',.5).velocity,null);
  for(const id of ['bounce-in','bounce-out','bounce-in-out'])for(const point of breakpoints(id)) {
    const d=derivatives(id,point.t);
    assert.equal(d.acceleration,null);assert.equal(d.jerk,null);
    if(point.order===1)assert.equal(d.velocity,null);
    const eps=1e-8;
    close(evaluate(id,point.t-eps),evaluate(id,point.t+eps),1e-6);
  }
  assert.equal(derivatives('circ-out',0).velocity,null);
  assert.equal(derivatives('circ-in',1).velocity,null);
});

test('steps use post-jump values and keep their endpoint semantics',()=>{
  close(evaluate('steps-start',0,{steps:4}),.25);
  close(evaluate('steps-end',.249999,{steps:4}),0);
  close(evaluate('steps-end',.25,{steps:4}),.25);
  assert.equal(derivatives('steps-end',.25,{steps:4}).velocity,null);
  assert.equal(derivatives('steps-end',.24,{steps:4}).velocity,0);
  assert.equal(derivatives('steps-end',1,{steps:4}).velocity,null);
  close(evaluate('steps-start',1,{steps:4}),1);
  for(let n=1;n<=24;n++)for(let k=1;k<=n;k++) {
    assert.equal(evaluate('steps-end',k/n,{steps:n}),k/n);
    assert.equal(evaluate('steps-start',k/n,{steps:n}),Math.min(n,k+1)/n);
    assert.equal(evaluate('steps-end',k/n-1e-10,{steps:n}),(k-1)/n);
  }
});

test('Bézier solves x(u)=time, including overshoot and non-linear time maps',()=>{
  const cases=[{x1:.1,y1:-.7,x2:.8,y2:1.8},{x1:0,y1:0,x2:0,y2:1},
    {x1:1,y1:0,x2:0,y2:1},{x1:.42,y1:0,x2:.58,y2:1}];
  const B=(u,p1,p2)=>3*(1-u)**2*u*p1+3*(1-u)*u*u*p2+u**3;
  for(const p of cases)for(const u of [.01,.2,.4,.5,.73,.99])
    close(evaluate('cubic-bezier',B(u,p.x1,p.x2),p),B(u,p.y1,p.y2),3e-10);
  assert.notEqual(evaluate('cubic-bezier',.25,{x1:0,y1:0,x2:0,y2:1}),B(.25,0,1));
  for(const t of [.5+1e-12,.5+2*Number.EPSILON,.5-2*Number.EPSILON]) {
    const u=.5+Math.cbrt((t-.5)/4);
    close(evaluate('cubic-bezier',t,{x1:1,y1:0,x2:0,y2:1}),B(u,0,1),2e-13);
  }
});

test('degenerate Bézier endpoints distinguish finite slopes from singular ones',()=>{
  for(const p of [{x1:0,y1:0,x2:0,y2:0},{x1:1,y1:1,x2:0,y2:0},{x1:1,y1:1,x2:1,y2:1}])
    for(const t of [0,.2,.5,1])assert.deepEqual(derivatives('cubic-bezier',t,p),{value:t,velocity:1,acceleration:0,jerk:0});
  close(derivatives('cubic-bezier',0,{x1:0,y1:0,x2:.5,y2:1}).velocity,2);
  assert.equal(derivatives('cubic-bezier',0,{x1:0,y1:0,x2:.5,y2:1}).acceleration,null);
  assert.equal(derivatives('cubic-bezier',.5,{x1:1,y1:0,x2:0,y2:1}).velocity,null);
  close(derivatives('cubic-bezier',0,{x1:1e-15,y1:.5,x2:.58,y2:1}).velocity,5e14,1);
});

test('small-time analytic shapes do not lose their leading term to cancellation',()=>{
  const t=1e-12;
  close(evaluate('sine-in',t)/(t*t),Math.PI**2/8,1e-12);
  close(evaluate('circ-in',t)/(t*t),.5,1e-12);
  close(evaluate('circ-out',t)/Math.sqrt(2*t),1,1e-11);
  close(evaluate('expo-out',t)/t,derivatives('expo-out',0).velocity,1e-9);
  close(evaluate('elastic-out',t)/t,derivatives('elastic-out',0).velocity,1e-8);
});

test('physical spring solves its ODE in underdamped, critical and overdamped regimes',()=>{
  for(const damping of [.05,.35,1,1.01,2]) {
    const p={frequency:10,damping,duration:1.3};
    const start=derivatives('spring-response',0,p);
    close(start.value,0,1e-14);close(start.velocity,0,1e-13);
    for(const t of [.03,.2,.5,1]) {
      const d=derivatives('spring-response',t,p),omegaT=p.frequency*p.duration;
      close(d.acceleration+2*p.damping*omegaT*d.velocity+omegaT**2*(d.value-1),0,5e-11);
    }
  }
});

test('spring horizon obeys physical time scaling while endpoint normalization is explicit',()=>{
  for(const t of [.1,.4,.9]) {
    close(evaluate('spring-response',t,{frequency:6,damping:.4,duration:2}),
      evaluate('spring-response',t,{frequency:12,damping:.4,duration:1}));
  }
  const p={frequency:3,damping:.6,duration:1};
  close(evaluate('spring-ease',.4,p),evaluate('spring-response',.4,p)/evaluate('spring-response',1,p));
  assert.notEqual(derivatives('spring-ease',1,p).velocity,0);
});

test('exponential and elastic definitions approach normalized endpoints continuously',()=>{
  for(const id of ['expo-in','expo-out','elastic-in','elastic-out'])for(const t of [0,1]) {
    const h=1e-7,inner=t===0?h:1-h;
    const estimate=t===0?(evaluate(id,inner)-evaluate(id,t))/h:(evaluate(id,t)-evaluate(id,inner))/h;
    close(estimate,derivatives(id,t).velocity,5e-5);
  }
  assert.ok(Math.max(...sample('back-out',501).map(p=>p.value))>1.05);
  assert.ok(Math.max(...sample('elastic-out',501).map(p=>p.value))>1.1);
});

test('parameter range extremes remain finite and CSS export does not disguise approximations',()=>{
  for(const c of catalog)for(const edge of ['min','max']) {
    const p=Object.fromEntries(c.parameters.map(x=>[x.key,x[edge]]));
    for(let i=0;i<=20;i++)assert.ok(Number.isFinite(evaluate(c.id,i/20,p)),c.id);
  }
  assert.equal(toCSS('linear'),'linear');
  assert.equal(toCSS('cubic-bezier'),'cubic-bezier(0.42, 0, 0.58, 1)');
  assert.equal(toCSS('steps-end',{steps:7}),'steps(7, jump-end)');
  for(const id of ['smootherstep','expo-out','elastic-out','spring-ease'])assert.equal(toCSS(id),null);
});
