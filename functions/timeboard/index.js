const axios = require('axios')
const https = require('https')
const { validate } = require('./schema')
const { format } = require('./formatter')
const url = require('url')

const { API_KEY, APP_KEY } = process.env

module.exports.handler = async (event) => {
  console.log(JSON.stringify(event))

  delete event.ResourceProperties.ServiceToken
  const { error, value } = validate(event.ResourceProperties)

  if (error) {
    console.log('failed validation', error)
    await respond(event, 'FAILED', 'Failure', error.message)
  }

  try {
    const id = await apply(event, value)
    await respond(event, 'SUCCESS', id)
  } catch (httpError) {
    console.error('failed to create Datadog timeboard...', httpError.response.data)
    await respond(event, 'FAILED', 'Failure', JSON.stringify(httpError.response.data))
    throw httpError
  }
}

const apply = async (event, timeboard) => {
  switch (event.RequestType) {
    case 'Create':
      return createTimeboard(timeboard)
    case 'Update':
      return updateTimeboard(event.PhysicalResourceId, timeboard)
    case 'Delete':
      return deleteTimeboard(event.PhysicalResourceId)
    default:
      break;
  }
}

// datadog API reference
// https://docs.datadoghq.com/api/?lang=bash#delete-a-dashboard
const deleteTimeboard = async (physicalResourceId) => {
  const [_, dashboardId] = physicalResourceId.split('DatadogTimeboard-')
  
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
  const [_, dashboardId] = physicalResourceId.split('DatadogTimeboard-')
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

const respond = async (event, status, id, reason) => {
  const payload = JSON.stringify({
    Status: status,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    StackId: event.StackId,
    PhysicalResourceId: `DatadogTimeboard-${id}`,
    Data: {
      Id: id
    },
    Reason: reason
  })

  console.log(`responding with [${status}]: ${event.ResponseURL}`)
  console.log(payload)

  const parsedUrl = url.parse(event.ResponseURL)
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.path,
    method: 'PUT',
    headers: {
      'Content-Type': '',
      'Content-Length': payload.length
    }
  }

  await new Promise((resolve, reject) => {
    const request = https.request(options, function(response) {
      console.log(`S3 status code: ${response.statusCode}`)

      response.on('end', function() {
        resolve()
      })
    })

    request.on('error', function(error) {
      console.log('Error:\n', error)
      reject(err)
    })

    request.write(payload)
    request.end()
  })  
}