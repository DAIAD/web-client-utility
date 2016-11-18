
/**
 * Transforms an object to array of objects with key, value strings for representation
 * @param {Object} dict - Contains any number of key, value pairs 
 * @param {String} dict.keyX - The key of an object
 * @param {Object} dict[keyX] - The value of the keyX key containing the friendly name and values 
 * @param {String} dict[keyX].label - The friendly name of the keyX item 
 * @param {Object|Array} dict[keyX].value - The value of the keyX item containing the friendly name and values 
 *                                      Can be either an Object with value, label Strings,
 *                                      or an Array of multiple Objects with value, label Strings
 * @return {Array} The transformed array containing a series of objects with key, value Strings
 */
function getFriendlyParams (dict, details='long') {
  return Object.keys(dict).map(key => ({ 
    key, 
    value: Array.isArray(dict[key]) ? 
      (
        details === 'short' ? 
          'Multiple'
          :
            dict[key].map(x => x.label).join(', ')
      )
      :
        dict[key].label || '-'
  }));
}

module.exports = {
  getFriendlyParams
}; 
