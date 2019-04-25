const axios = require('axios')
const schema = require('./schema')
const { format } = require('./formatter')
const customResource = require('../../lib/customResource')

const { API_KEY, APP_KEY } = process.env

// datadog API reference
// https://docs.datadoghq.com/api/?lang=bash#delete-a-dashboard
const deleteTimeboard = async (physicalResourceId) => {
  const [_, dashboardId] = physicalResourceId.split('-')
  
  // don't bother deleting if we couldn't create the dashboard in the first place
  if (dashboardId === 'Failure') {
    return dashboardId
  }

  const url = `https://api.datadoghq.com/api/v1/dashboard/${dashboardId}?api_key=${API_KEY}&application_key=${APP_KEY}`

  console.log(`deleting Datadog timeboard id [${dashboardId}]...`)

  const resp = await axios.delete(url)
  console.log(resp.data)

  return resp.data.deleted_dashboard_id
}

// datadog API reference
// https://docs.datadoghq.com/api/?lang=bash#update-a-dashboard
const updateTimeboard = async (physicalResourceId, timeboard) => {
  const data = format(timeboard)
  const [_, dashboardId] = physicalResourceId.split('-')
  const url = `https://api.datadoghq.com/api/v1/dashboard/${dashboardId}?api_key=${API_KEY}&application_key=${APP_KEY}`

  console.log(`updating Datadog timeboard id [${dashboardId}]...`)
  console.log(JSON.stringify(data))

  const resp = await axios.put(url, data)
  console.log(resp.data)

  return resp.data.id
}

// datadog API reference
// https://docs.datadoghq.com/api/?lang=bash#create-a-dashboard
const createTimeboard = async (timeboard) => {
  const data = format(timeboard)
  const url = `https://api.datadoghq.com/api/v1/dashboard?api_key=${API_KEY}&application_key=${APP_KEY}`

  console.log('creating Datadog timeboard...')
  console.log(JSON.stringify(data))

  const resp = await axios.post(url, data)
  console.log(resp.data)

  return resp.data.id
}

module.exports.handler = customResource(
  schema, createTimeboard, updateTimeboard, deleteTimeboard)