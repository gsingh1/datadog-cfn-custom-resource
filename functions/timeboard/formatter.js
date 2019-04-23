// CF uses TitleCase
// but the Datadog API requests use lower_case
// hence the conversion...
const fromTitleCase = str => str.replace(/[A-Z]/g, x => '_' + x.toLowerCase()).substr(1)

const format = x => {
  if (Array.isArray(x)) {
    x.map(format)
  } else if (typeof x === 'object') {
    const y = {}
    for (var prop in x) {
      const newProp = fromTitleCase(prop)
      if (Array.isArray(x[prop])) {
        y[newProp] = x[prop].map(format)
      } else if (typeof x[prop] === 'object') {
        y[newProp] = format(x[prop])
      } else {
        y[newProp] = x[prop]
      }    
    }
    return y
  } else {
    return x
  }
}

module.exports = {
  format
}