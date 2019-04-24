const https = require('https')
const url = require('url')
const Joi = require('joi')

const respond = async (event, status, id, reason) => {
  // e.g. "Custom::DatadogTimeboard" => DatadogTimeboard
  const resourceType = event.ResourceType.replace('Custom::', '')

  const payload = JSON.stringify({
    Status: status,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    StackId: event.StackId,
    PhysicalResourceId: `${resourceType}-${id}`,
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

module.exports = (schema, createFn, updateFn, deleteFn) => 
  async (event) => {
    console.log(JSON.stringify(event))

    delete event.ResourceProperties.ServiceToken
    const { error, value } = Joi.validate(
      event.ResourceProperties, schema, { allowUnknown: true })

    if (error) {
      console.log('failed validation', error)
      await respond(event, 'FAILED', 'Failure', error.message)
      return
    }

    const apply = async (event, value) => {
      switch (event.RequestType) {
        case 'Create':
          return createFn(value)
        case 'Update':
          return updateFn(event.PhysicalResourceId, value)
        case 'Delete':
          return deleteFn(event.PhysicalResourceId)
        default:
          throw new Error(`unexpected RequestType [${event.RequestType}]`)
      }
    }

    try {
      const id = await apply(event, value)
      await respond(event, 'SUCCESS', id)
    } catch (error) {
      console.error('failed to create Datadog timeboard...', error)
      await respond(event, 'FAILED', 'Failure', JSON.stringify(error))
      throw error
    }
  }