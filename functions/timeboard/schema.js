const Joi = require('joi')
const _ = require('lodash')

// based on the Datadog API schema
// see https://docs.datadoghq.com/api/?lang=bash#create-a-dashboard
// and https://docs.datadoghq.com/graphing/graphing_json/widget_json

// list of supported widgets
// https://docs.datadoghq.com/graphing/widgets

const TemplateVariable = Joi.object().keys({
  Name: Joi.string().required(),
  Prefix: Joi.string(),
  Default: Joi.string(),
})

const validPalettes = ['blue', 'custom_bg', 'custom_image', 'custom_text', 'gray_on_white', 'green', 'green_on_white', 'grey', 'orange', 'red', 'red_on_white', 'white_on_gray', 'white_on_green', 'white_on_red', 'white_on_yellow', 'yellow_on_white']

// https://docs.datadoghq.com/graphing/graphing_json/widget_json/#conditional-format-schema
const ConditionalFormat = Joi.object().keys({
  Comparator: Joi.string().required().valid('>', '>=', '<', '<='),
  Value: Joi.number(),
  Palette: Joi.string().valid(validPalettes),
  CustomFgColor: Joi.string().valid(validPalettes),
  CustomBgColor: Joi.string().valid(validPalettes),
  ImageUrl: Joi.string(),
})

const Request = Joi.object().keys({
  Q: Joi.string().required(),
})

// https://docs.datadoghq.com/graphing/graphing_json/widget_json/#y-axis-schema
const Axis = Joi.object().keys({
  Label: Joi.string(),
  Min: Joi.string(),
  Max: Joi.string(),
  Scale: Joi.string(),
  IncludeZero: Joi.boolean(),
})

const validMarkers =
  _.flatMap(
    ['error', 'warning', 'info', 'ok'], 
    lvl => ['dashed', 'solid', 'bold'].map(style => `${lvl} ${style}`))

// https://docs.datadoghq.com/graphing/graphing_json/widget_json/#markers-schema
const Marker = Joi.object().keys({
  Value: Joi.string(),
  DisplayType: Joi.string().required().valid(validMarkers),
  Label: Joi.string()
})

// https://docs.datadoghq.com/graphing/graphing_json/widget_json/#events-schema
const Event = Joi.object().keys({
  Q: Joi.string().required()
})

const WidgetDefinition = Joi.object().keys({
  Title: Joi.string().required(),
})

// https://docs.datadoghq.com/graphing/widgets/alert_graph/
const AlertGraph = WidgetDefinition.keys({
  Type: Joi.string().required().valid('alert_graph'),
  AlertId: Joi.string().required(),
  VizType: Joi.string().required().valid('timeseries', 'toplist')
})

// https://docs.datadoghq.com/graphing/widgets/alert_value/
const AlertValue = WidgetDefinition.keys({
  Type: Joi.string().required().valid('alert_value'),
  AlertId: Joi.string().required(),
  Precision: Joi.number(),
  Unit: Joi.string(),
  TextSize: Joi.string(),
  TextAlign: Joi.string().valid('left', 'center', 'right'),  
})

// https://docs.datadoghq.com/graphing/widgets/change/
const Change = WidgetDefinition.keys({
  Type: Joi.string().required().valid('change'),
  Requests: Joi.array().required().items(
    Request.keys({
      ChangeType: Joi.string().valid('absolute', 'relative'),
      CompareTo: Joi.string().valid('hour_before', 'day_before', 'week_before', 'month_before'),
      IncreaseGood: Joi.boolean(),
      OrderBy: Joi.string().valid('change', 'name', 'present', 'past'),
      OrderDir: Joi.string().valid('asc', 'desc'),
      ShowPresent: Joi.boolean(),
    })
  ),
})

// https://docs.datadoghq.com/graphing/widgets/check_status/
const CheckStatus = WidgetDefinition.keys({
  Type: Joi.string().required().valid('check_status'),
  Check: Joi.string().required(),
  Grouping: Joi.string().required().valid('check', 'cluster'),
  Group: Joi.string(),
  Tags: Joi.array().items(Joi.string()),
  GroupBy: Joi.array().items(Joi.string()),
})

// https://docs.datadoghq.com/graphing/widgets/distribution/
const Distribution = WidgetDefinition.keys({
  Type: Joi.string().required().valid('distribution'),
  Requests: Joi.array().required().items(
    Request.keys({
      Style: Joi.object().keys({
        Palette: Joi.string()
      })
    })
  ),
})

// https://docs.datadoghq.com/graphing/widgets/hostmap/
const HostMap = WidgetDefinition.keys({
  Type: Joi.string().required().valid('hostmap'),
  NodeType: Joi.string().valid('host', 'container'),
  NoMetricHosts: Joi.boolean(),
  NoGroupHosts: Joi.boolean(),
  Group: Joi.array().items(Joi.string()),
  Scope: Joi.array().items(Joi.string()),
  Style: Joi.object().keys({
    Palette: Joi.string(),
    PaletteFlip: Joi.boolean(),
    FillMin: Joi.string(),
    FillMax: Joi.string(),
  }),
  Requests: Joi.object().keys({
    Fill: Request,
    Size: Request,
  }).without('Fill', 'Size') // mutually exclusive
})

// https://docs.datadoghq.com/graphing/widgets/note/
const Note = WidgetDefinition.keys({
  Type: Joi.string().required().valid('note'),
  Content: Joi.string().required(),
  BackgroundColor: Joi.string(),
  FontSize: Joi.string(),
  TextAlign: Joi.string().valid('left', 'center', 'right'),
  ShowTick: Joi.boolean(),
  TickPos: Joi.string(),
  TickEdge: Joi.string().valid('bottom', 'left', 'right', 'top'),
})

// https://docs.datadoghq.com/graphing/widgets/query_value/
const QueryValue = WidgetDefinition.keys({
  Type: Joi.string().required().valid('query_value'),
  Autoscale: Joi.boolean(),
  CustomUnit: Joi.string(),
  Precision: Joi.string(),
  TextAlign: Joi.string().valid('left', 'center', 'right'),
  Requests: Joi.array().required().items(
    Request.keys({
      Aggregator: Joi.string().valid('avg', 'max', 'min', 'sum'),
      ConditionalFormats: Joi.array().items(ConditionalFormat),
    })
  ),
})

// https://docs.datadoghq.com/graphing/widgets/scatter_plot/
const ScatterPlot = WidgetDefinition.keys({
  Type: Joi.string().required().valid('scatterplot'),
  Yaxis: Axis,
  Xaxis: Axis,
  ColourByGroups: Joi.array().items(Joi.string()),
  Requests: Joi.array().required().items(
    Request.keys({
      Aggregator: Joi.string().valid('avg', 'max', 'min', 'sum'),
    })
  ),
})

// https://docs.datadoghq.com/graphing/widgets/service_map/
const ServiceMap = WidgetDefinition.keys({
  Type: Joi.string().required().valid('servicemap'),
  Service: Joi.string().required(),
  Filters: Joi.array().required().items(Joi.string())
})

// https://docs.datadoghq.com/graphing/widgets/timeseries/
const Timeseries = WidgetDefinition.keys({
  Type: Joi.string().required().valid('timeseries'),
  Yaxis: Axis,
  Markers: Joi.array().items(Marker),
  Events: Joi.array().items(Event),
  Requests: Joi.array().required().items(
    Request.keys({
      Style: Joi.object().keys({
        Palette: Joi.string(),
        LineType: Joi.string().valid('dashed', 'solid', 'dotted'),
        LineWidth: Joi.string().valid('thin', 'normal', 'thick'),
      }),
      Metadata: Joi.array().items(
        Joi.object().keys({
          Expression: Joi.string(),
          AliasName: Joi.string(),
        }).required(),
      ),
      DisplayType: Joi.string().valid('area', 'bars', 'line'),
    })
  ),
})

// https://docs.datadoghq.com/graphing/widgets/top_list/
const TopList = WidgetDefinition.keys({
  Type: Joi.string().required().valid('toplist'),
  Requests: Joi.array().required().items(
    Request.keys({
      ConditionalFormats: Joi.array().items(ConditionalFormat),
    })
  ),
})

// https://docs.datadoghq.com/graphing/widgets/group/
const Group = WidgetDefinition.keys({
  Type: Joi.string().required().valid('group'),
  Widgets: Joi.array().items(
    Joi.alternatives().try(
      AlertGraph,
      AlertValue,
      Change,
      CheckStatus,
      Distribution,
      HostMap,
      Note,
      QueryValue,
      ScatterPlot,
      ServiceMap,
      Timeseries,
      TopList,
    )
  ),
  LayoutType: Joi.string().valid('ordered').default('ordered'),
})

const Widget = Joi.object().keys({
  Definition: Joi.alternatives().try(
    AlertGraph,
    AlertValue,
    Change,
    CheckStatus,
    Distribution,
    Group,
    HostMap,
    Note,
    QueryValue,
    ScatterPlot,
    ServiceMap,
    Timeseries,
    TopList,
  )
})

const Timeboard = Joi.object().keys({
  Title: Joi.string().required(),
  LayoutType: Joi.string().required().valid('ordered', 'free').default('ordered'),
  Description: Joi.string().required(),
  IsReadOnly: Joi.boolean().default(false),
  TemplateVariables: Joi.array().items(TemplateVariable),
  Widgets: Joi.array().required().items(Widget),
})

module.exports = Timeboard
