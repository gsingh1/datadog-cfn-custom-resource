const http = require('axios')
const { validate } = require('./schema')
const { format } = require('./formatter')
const aws4 = require('aws4')
const URL = require('url')

const { API_KEY, APP_KEY } = process.env

module.exports.handler = async (event) => {
  console.log(JSON.stringify(event))

  delete event.ResourceProperties.ServiceToken
  const {validationError, _timeboard} = validate(event.ResourceProperties)

  if (validationError) {
    console.log('failed validation', validationError)
    await respond(event, 'FAILED', 'Failure')
  }

  try {
    const id = await apply(event)
    await respond(event, 'SUCCESS', id)
  } catch (httpError) {
    console.error('failed to create Datadog timeboard...', httpError.response.data)
    await respond(event, 'FAILED', 'Failure')
    throw httpError
  }
}

const apply = async (event) => {
  switch (event.RequestType) {
    case 'Create':
      return createTimeboard(event.ResourceProperties)
    case 'Update':
      return updateTimeboard(event.PhysicalResourceId, event.ResourceProperties)
    case 'Delete':
      return deleteTimeboard(event.PhysicalResourceId)
    default:
      break;
  }
}

const deleteTimeboard = async (physicalResourceId) => {

}

const updateTimboard = async (physicalResourceId, timeboard) => {

}

const createTimeboard = async (timeboard) => {
  const data = format(timeboard)
  const url = `https://api.datadoghq.com/api/v1/dashboard?api_key=${API_KEY}&application_key=${APP_KEY}`

  console.log('creating Datadog timeboard...')
  console.log(JSON.stringify(data))

  const resp = await http.post(url, data)
  console.log(resp.data)

  return resp.data.id
}

const respond = async (event, status, id) => {
  const payload = {
    Status: status,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    StackId: event.StackId,
    PhysicalResourceId: `DatadogTimeboard-${id}`,
    Data: {
      Id: id
    }
  }

  const url = URL.parse(event.ResponseURL)
  opts = {
    host: url.hostname,
    path: url.pathname
  }
  aws4.sign(opts)

  await http.post(event.ResponseURL, payload, {
    headers: aws4.headers
  })
}