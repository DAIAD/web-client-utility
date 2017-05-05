const moment = require('moment');

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
function getFriendlyParams (dict, intl, details='long') {
  const _t = x => intl.formatMessage({ id: x });
  return Object.keys(dict).map(key => ({ 
    key: _t(`Wizard.items.${key}.title`), 
    value: Array.isArray(dict[key]) && dict[key].length > 0 ? 
      (
        details === 'short' ? 
          (dict[key][0].type === 'UTILITY' ? _t('Buttons.All') : _t('Wizard.common.multiple'))
          :
            dict[key].map(x => x.label)
      )
      :
        typeof dict[key] === 'object' ? (dict[key].label || '-') : (dict[key] || '-')
  }));
}

function getPopulationValue (selected, label, utility) {
  if (selected === 'all') { 
    return { selected: 'all', type: 'UTILITY', key: utility, label };
  }
  return { type: 'GROUP', key: selected, label };
}

function getAllPopulationGroups (clusters, utility) {
  if (!clusters) return [];
  return clusters
  .map(cluster => cluster.groups
       .map(group => ({ ...group, value: getPopulationValue(group.key, `${cluster.name}: ${group.name}`, utility) })))
  .reduce((p, c) => [...p, ...c], []);
}

function getSpatialValue (selected, label) {
  if (selected === 'all') { 
    return { selected: 'all', label };
  }
  return { area: selected, label };
}

function getAllSpatialGroups (areas) {
  return areas.map(group => ({ ...group, value: getSpatialValue(group.key, group.label) }));
}

function getLabelByParam (paramKey, param, props) {
  //console.log('param:', paramKey, param, props.clusters, props.groups);
  switch (paramKey) {
    case 'population':
      if (param.type === 'UTILITY') {
        return props.intl.formatMessage({ id: 'Buttons.All' });
      } else {
        const group = getAllPopulationGroups(props.clusters, props.utility)
        .find(g => g.key === param.key);
        const cluster = props.clusters && props.clusters.find(c => c.key === (group && group.clusterKey));
        return `${cluster && cluster.name ? cluster.name + ': ' : ''}${group && group.name}`;
      }
    case 'spatial':
      if (!param || param.type === 'UTILITY') {
        return props.intl.formatMessage({ id: 'Buttons.All' });
      } else {
        const key = Array.isArray(param.areas) && param.areas.length > 0 && param.areas[0];
        const area = getAllSpatialGroups(props.areas)
        .find(g => g.key === key);
        return area && area.title;
      }
    case 'time':
      return props.intl.formatDate(param.start, { 
        month: 'numeric', year: 'numeric',
      }) + 
      '-' +
      props.intl.formatDate(param.end, { 
        month: 'numeric', year: 'numeric',
      });
    default:
      return '-';
  }
}

function getParamsWithLabels (paramsObj, props) {
  return Object.keys(paramsObj).reduce((p, paramKey) => {
    const param = paramsObj[paramKey];
    const obj = { ...p };
    obj[paramKey] = Array.isArray(param) ? param.map(p => ({ ...p, label: getLabelByParam(paramKey, p, props) })) : { ...param, label: getLabelByParam(paramKey, param, props) };
    return obj;
  }, {});
}

module.exports = {
  getFriendlyParams,
  getParamsWithLabels,
  getPopulationValue,
  getAllPopulationGroups,
  getSpatialValue,
  getAllSpatialGroups,
}; 
