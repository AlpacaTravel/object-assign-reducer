const _clone = require("lodash.clone");

const remove = (obj) => (prop) => {
  const next = _clone(obj);
  delete next[prop];
  return next;
};

const set = (obj) => (prop, value) => {
  const next = _clone(obj);
  next[prop] = value;
  return next;
};

module.exports = {
  remove,
  set,
};
