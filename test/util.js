export const spy = ret => {
  function f (...args) {
    f.count += 1;
    f.args.push(args);
    f.selfs.push(this);
    return ret;
  }
  f.count = 0;
  f.args = [];
  f.selfs = [];
  return f;
}