const Joi = require('joi')
const _ = require('lodash')

// based on the Datadog API schema
// see https://docs.datadoghq.com/api/?lang=bash#create-a-dashboard
// and https://docs.datadoghq.com/graphing/graphing_json/widget_json

// list of supported widgets
// https://docs.datadoghq.com/graphing/widgets

const validMarkers =
  _.flatMap(
    ['error', 'warning', 'info', 'ok'], 
    lvl => ['dashed', 'solid', 'bold'].map(style => `${lvl} ${style}`))

const validPalettes = ['blue', 'custom_bg', 'custom_image', 'custom_text', 'gray_on_white', 'green', 'green_on_white', 'grey', 'orange', 'red', 'red_on_white', 'white_on_gray', 'white_on_green', 'white_on_red', 'white_on_yellow', 'yellow_on_white']

const TemplateVariable = Joi.object().keys({
  Name: Joi.string().required(),
  Prefix: Joi.string(),
  Default: Joi.string(),
})

const RequestStyle = Joi.object().keys({
  Palette: Joi.string().valid('classic', 'cool', 'warm', 'purple', 'orange', 'gray'),
  LineType: Joi.string().valid('dashed', 'solid', 'dotted').default('solid'),
  LineWidth: Joi.string().valid('thin', 'normal', 'thick').default('normal'),
  Metadata: Joi.object(),
  DisplayType: Joi.string().valid('area', 'bars', 'line')
})

const RequestConditionalFormat = Joi.object().keys({
  Comparator: Joi.string().required().valid('>', '>=', '<', '<='),
  Value: Joi.number(),
  Palette: Joi.string().valid(validPalettes),
  CustomFgColor: Joi.string().valid(validPalettes),
  CustomBgColor: Joi.string().valid(validPalettes),
  ImageUrl: Joi.string()
})

const Request = Joi.object().keys({
  Q: Joi.string().required(),
  Type: Joi.string().valid('line', 'bars', 'area'),
  Aggregator: Joi.string().valid('average', 'max', 'min', 'sum'),
  Stacked: Joi.boolean(),
  Style: RequestStyle,
  // change
  ConditionalFormats: Joi.array().items(RequestConditionalFormat),
  ChangeType: Joi.string().valid('absolute', 'relative'),
  CompareTo: Joi.string().valid('hour_before', 'day_before', 'week_before', 'month_before'),
  IncreaseGood: Joi.boolean(),
  OrderBy: Joi.string().valid('change', 'name', 'present', 'past'),
  OrderDir: Joi.string().valid('asc', 'desc'),
  ShowPresent: Joi.boolean()
})

const GraphStyle = Joi.object().keys({
  FillMax: Joi.string(),
  FillMin: Joi.string(),
  Palette: Joi.string(),
  PaletteFlip: Joi.boolean(),
})

const Marker = Joi.object().keys({
  Value: Joi.string(),
  DisplayType: Joi.string().required().valid(validMarkers),
  Label: Joi.string()
})

const Axis = Joi.object().keys({
  Label: Joi.string(),
  Min: Joi.string(),
  Max: Joi.string(),
  Scale: Joi.string(),
  IncludeZero: Joi.boolean()
})

const Event = Joi.object().keys({
  Q: Joi.string().required()
})

const WidgetDefinition = Joi.object().keys({
  Title: Joi.string().required(),
  Type: Joi.string().required().valid('change', 'distribution', 'heatmap', 'hostmap', 'query_value', 'scatterplot', 'timeseries', 'toplist'),
  // all
  Requests: Joi.array().required().items(Request),
  // timeseries  
  Markers: Joi.array().items(Marker),
  // timeseries, heatmap
  Events: Joi.array().items(Event),
  // scatterplot
  ColourByGroups: Joi.array().items(Joi.string()),
  // query_value
  Autoscale: Joi.boolean(),
  // query_value
  Precision: Joi.string(),
  // query_value
  CustomUnit: Joi.string(),
  // query_value
  TextAlign: Joi.string().valid('left', 'center', 'right'),
  // hostmap
  NodeType: Joi.string().valid('host', 'container'),
  // hostmap
  NoMetricHosts: Joi.boolean(),
  // hostmap
  NoGroupHosts: Joi.boolean(),
  // hostmap
  Group: Joi.array().items(Joi.string()),
  // hostmap
  Scope: Joi.array().items(Joi.string()),
  // hostmap
  Style: GraphStyle,
  // timeseries, scatterplot, heatmap
  Yaxis: Axis,
  // scatterplot
  Xaxis: Axis
})

const Widget = Joi.object().keys({
  Definition: WidgetDefinition
})

const Timeboard = Joi.object().keys({
  Title: Joi.string().required(),
  LayoutType: Joi.string().required().valid('ordered', 'free').default('ordered'),
  Description: Joi.string().required(),
  IsReadOnly: Joi.boolean().default(false),
  TemplateVariables: Joi.array().items(TemplateVariable),
  Widgets: Joi.array().required().items(Widget),
})

const validate = x => Joi.validate(x, Timeboard, { allowUnknown: true })

module.exports = {
  validate
}