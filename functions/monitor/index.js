const axios = require('axios')
const schema = require('./schema')
const { format } = require('./formatter')
const customResource = require('../../lib/customResource')

const { API_KEY, APP_KEY } = process.env

// datadog API reference
// https://docs.datadoghq.com/api/?lang=bash#delete-a-monitor
const deleteMonitor = async (physicalResourceId) => {
  const [_, monitorId] = physicalResourceId.split('-')
  
  // don't bother deleting if we couldn't create the monitor in the first place
  if (monitorId === 'Failure') {
    return monitorId
  }

  const url = `https://api.datadoghq.com/api/v1/dashboard/${monitor}?api_key=${API_KEY}&application_key=${APP_KEY}`

  console.log(`deleting Datadog monitor id [${monitorId}]...`)

  const resp = await axios.delete(url)
  console.log(resp.data)

  return resp.data.deleted_monitor_id
}

// datadog API reference
// https://docs.datadoghq.com/api/?lang=bash#edit-a-monitor
const updateMonitor = async (physicalResourceId, monitor) => {
  const data = format(monitor)
  const [_, monitorId] = physicalResourceId.split('-')
  const url = `https://api.datadoghq.com/api/v1/monitor/${monitorId}?api_key=${API_KEY}&application_key=${APP_KEY}`

  console.log(`updating Datadog monitor id [${monitorId}]...`)
  console.log(JSON.stringify(data))

  const resp = await axios.put(url, data)
  console.log(resp.data)

  return resp.data.id
}

// datadog API reference
// https://docs.datadoghq.com/api/?lang=bash#create-a-monitor
const createMonitor = async (monitor) => {
  const data = format(monitor)
  const url = `https://api.datadoghq.com/api/v1/monitor?api_key=${API_KEY}&application_key=${APP_KEY}`

  console.log('creating Datadog monitor...')
  console.log(JSON.stringify(data))

  const resp = await axios.post(url, data)
  console.log(resp.data)

  return resp.data.id
}

module.exports.handler = customResource(
  schema, createMonitor, updateMonitor, deleteMonitor)