// Covers two correctness fixes in the property adapter's geometry.
// Both were long-standing `//todo` questions in the source; these assert the answers.
import PropertyAdapter from '../src/js/modules/objects/propertyAdapter.js';
import Types from '../src/js/modules/template/types.js';

const AR = Math.PI / 180;
const errors = [];
global.Urso = {
  helper: { getRadian: a => a * AR, getAngle: r => r / AR },
  logger: { error: (...a) => errors.push(a.join(' ')) },
};
global.Urso.types = new Types().list;

let pass = 0, fail = 0;
const check = (n, c) => { c ? (pass++, console.log('  PASS', n)) : (fail++, console.log('  FAIL', n)); };

const pa = new PropertyAdapter();
pa._getWidthAsNumber = o => o.w;
pa._getHeightAsNumber = o => o.h;

// The anchor point sits at local (w*anchorX, h*anchorY). Rotating it by `angle` about the
// origin is the standard rotation matrix; the compensating offset is its negation. This is
// the ground truth the adapter must agree with — derived independently of the implementation.
const truth = (w, h, ax, ay, angle) => {
  const x = w * ax, y = h * ay, a = angle * AR;
  return { x: -(x * Math.cos(a) - y * Math.sin(a)), y: -(x * Math.sin(a) + y * Math.cos(a)) };
};

console.log('\n[1] anchor offset by angle matches the rotation matrix');
{
  const cases = [
    ['square, centred, unrotated',   100, 100, 0.5, 0.5, 0],
    ['tall, centred, unrotated',     100, 200, 0.5, 0.5, 0],
    ['wide, centred, unrotated',     200, 100, 0.5, 0.5, 0],
    ['tall, rotated 30',             100, 200, 0.5, 0.5, 30],
    ['wide, off-centre anchor, 45',  200, 100, 0.25, 0.75, 45],
    ['negative anchorX',             200, 100, -0.5, 0.5, 20],
    ['zero anchorX (no divide-by-0)',100, 200, 0, 0.5, 15],
  ];

  for (const [name, w, h, ax, ay, angle] of cases) {
    const obj = { w, h, anchorX: ax, anchorY: ay, angle };
    const gx = pa._getAnchorOffsetByAngle(obj, 'x');
    const gy = pa._getAnchorOffsetByAngle(obj, 'y');
    const e = truth(w, h, ax, ay, angle);
    check(name, Math.abs(gx - e.x) < 0.001 && Math.abs(gy - e.y) < 0.001);
  }
}

console.log('\n[2] REGRESSION: x and y offsets must not be swapped');
{
  // The old implementation used atan(xCatet / yCatet) — the angle from +Y — while projecting
  // with cos for x and sin for y, which needs the angle from +X. For a non-square object the
  // two offsets came out swapped. A square with a symmetric anchor hid it, because
  // atan(x/y) === atan(y/x) when x === y.
  const obj = { w: 100, h: 200, anchorX: 0.5, anchorY: 0.5, angle: 0 };
  const gx = pa._getAnchorOffsetByAngle(obj, 'x');
  const gy = pa._getAnchorOffsetByAngle(obj, 'y');
  check('x offset tracks width, not height', Math.abs(gx - -50) < 0.001);
  check('y offset tracks height, not width', Math.abs(gy - -100) < 0.001);
  check('they are not equal for a non-square object', Math.abs(gx - gy) > 1);
}

console.log('\n[3] scaleY accepts a negative value, matching scaleX');
{
  const mk = (v) => ({ scaleY: v, scaleX: v, height: true, width: true, _baseObject: { scale: { x: 1, y: 1 } } });

  errors.length = 0;
  const flipY = mk(-1);
  pa._adaptScaleY(flipY);
  check('scaleY: -1 reaches the Pixi object', flipY._baseObject.scale.y === -1);
  check('scaleY: -1 logs no error', errors.length === 0);

  errors.length = 0;
  const flipX = mk(-1);
  pa._adaptScaleX(flipX);
  check('scaleX: -1 still works (unchanged)', flipX._baseObject.scale.x === -1);
  check('the two axes behave the same', errors.length === 0);

  errors.length = 0;
  const ok = mk(2);
  pa._adaptScaleY(ok);
  check('a positive scaleY still works', ok._baseObject.scale.y === 2);

  errors.length = 0;
  const bad = mk('not-a-number');
  pa._adaptScaleY(bad);
  check('a non-numeric scaleY is still rejected', errors.length === 1);
}

console.log(`\n${fail === 0 ? 'ALL PASS' : 'FAILURES'} — ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
