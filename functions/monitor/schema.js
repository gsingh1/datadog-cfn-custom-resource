const Joi = require('joi')

// based on the Datadog API schema
// see https://docs.datadoghq.com/api/?lang=bash#create-a-monitor

const validTypes = [
  'composite',
  'event alert',
  'log alert',
  'process alert',
  'query alert',
  'service check',
]

const Monitor = Joi.object().keys({
  Type: Joi.string().required().valid(validTypes),
  Query: Joi.string().required(),
  Name: Joi.string().required(),
  Message: Joi.string().required(),
  Tags: Joi.array().items(Joi.string()),
})

module.exports = Monitor