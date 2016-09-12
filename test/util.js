export const spy = g => {
  g = g || function () {};
  function f (...args) {
    f.count += 1;
    f.args.push(args);
    f.selfs.push(this);
    return g.apply(this, args);
  }
  f.count = 0;
  f.args = [];
  f.selfs = [];
  return f;
}