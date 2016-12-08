const nameToId = str => 
  str.replace(/\s+/g, '-').toLowerCase();
  
module.exports = {
  nameToId,
};
