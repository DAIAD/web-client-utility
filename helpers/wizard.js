
/**
 * Transforms an object to array of objects with key, value strings for representation
 * @param {Object} dict - Contains any number of key, value pairs 
 * @param {String} dict.keyX - A key of the object
 * @param {Object|Array} dict[keyX] - The value of the keyX key. 
 *                                    Can be either an Object with value, label Strings,
 *                                      or an Array of multiple Objects with value, label Strings
 * @return {Array} The transformed array containing a series of objects with key, value Strings
 */
function getFriendlyParams (dict, details='long') {
  return Object.keys(dict).map(key => ({ 
    key, 
    value: Array.isArray(dict[key]) ? 
      (
        details === 'short' ? 
          'multiple'
          :
            dict[key].map(x => x.label).join(', ')
      )
      :
        dict[key].label
  }));
}

module.exports = {
  getFriendlyParams
}; 
