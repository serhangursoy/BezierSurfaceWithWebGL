//
// FROM https://stackoverflow.com/questions/3959211/fast-factorial-function-in-javascript
//
let f = [];

function factorial(n) {
  if (n == 0 || n == 1)
    return 1;
  if (f[n] > 0)
    return f[n];
  return f[n] = factorial(n - 1) * n;
}


function bernstein(i, n, x) {
  return binomial(i, n) * Math.pow(x, i) * Math.pow(1 - x, n - i);
}

function binomial(i, n) {
  return factorial(n) / (factorial(i) * factorial(n - i))
}


function evalBezierCurve(p, t) {
  let b0 = (1 - t) * (1 - t) * (1 - t);
  let b1 = 3 * t * (1 - t) * (1 - t);
  let b2 = 3 * t * t * (1 - t);
  let b3 = t * t * t;
  return p[0] * b0 + p[1] * b1 + p[2] * b2 + p[3] * b3;
}

function bezierCurve(u, q, n) {
  var pointC = n;
  var p = vec3(0, 0, 0);

  for (var i = 0; i < pointC; i++) {
    p = add(p, scale(bernstein(i, pointC - 1, u), q[i]));
  }
  return p;
};

function bezierSurface(u, v, q, n, m) {
  var pointC = n;
  var p = vec3(0, 0, 0);
  for (var i = 0; i < pointC; i++) {
    p = add(p, scale(bernstein(i, pointC - 1, u), bezierCurve(v, q[i], m)));
  }
  return p;
}

function bernsteinDerivative(i, n, x) {
  var denominator = factorial(n) * factorial(n - i);
  var numerator = factorial(n) * (i - n * x) * Math.pow((1 - x), n - i) * Math.pow(x, i);
  return numerator / denominator;
  return binomial(i, n) * Math.pow(x, i) * Math.pow(1 - x, n - i);
}

function bezierCurveDeriv(u, q, n) {
  var p = vec3(0, 0, 0);
  var pointC = n - 1;
  for (var i = 0; i < pointC; i++) {
    p = add(p, scale(bernsteinDerivative(i, pointC - 1, u), q[i]));
  }
  return p;
};

function bezierSurfaceUDerivative(u, v, q, n) {
  var p = vec3(0, 0, 0);
  var pointC = n;
  for (var i = pointC - 1; i >= 0; i--) {
    p = add(p, scale(bernsteinDerivative(i, pointC - 1, u), bezierCurveDeriv(v, q[i], n)));
  }
  return p;
}


function bezierSurfaceVDerivative(u, v, q, n) {
  var p = vec3(0, 0, 0);
  var pointC = n;
  for (var i = 0; i < pointC; i++) {
    p = add(p, scale(bernstein(i, pointC - 1, u), bezierCurveDeriv(v, q[i], n)));
  }
  return p;
}