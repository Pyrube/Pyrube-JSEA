/**
 * @(#) Project: Pyrube JSEA
 * 
 * 
 * Website: http://www.pyrube.com
 * Email: customercare@pyrube.com
 * Copyright Pyrube 2009. All rights reserved.
 */

/**
 * JSEA Grid component
 * The Grid object has following data:
 * funcname  : function name (string)
 * url       : url to load data list (string)
 * rs        : data for result set (json)
 * rsProp    : property name of result set (string)
 * async     : indicate whether this grid loads data via ajax or result set. if true, it means ajax; or result set (boolean)
 * statProp  : property name of status (string)
 * postProps : properties with format pattern for post to backend, e.g. ['bizDate|date', 'txnAmt|amount|txnCcy', 'updateTime|longTimestampZ'] (array)
 * multiple  : indicate whether this grid can be multi-selected (boolean)
 * choiceboxed : indicate whether this grid starts with choice-box each row (boolean)
 * sortable  : indicate whether this grid is sortable (boolean)
 * defaultSortBy : indicate which column is the default sorting one. if undefined, it will be the first column (string)
 * pageable  : indicate whether this grid has page-bar (boolean)
 * pagebar   : pagebar type, prene for <<First<Prev Next>Last>>, more for Load More and folio for 1...3, 4, 5...n (string)
 * columns   :
 *     operations: default operations (json)
 *         name       : operation name (string)
 *         url        : operation url, customized url, instead of [<basename>/]<funcname>/<opname> as default (string)
 *         mode       : operation mode, such as popover (string)
 *         confirm    : indicate whether need confirm before this operation (string)
 *         disabled   : check whether this operation will disable (array[function])
 *         invisible  : check whether this operation will hide (array[function])
 *         transparent: check whether this operation will be transparent (array[function])
 *         params     : operation parameters (json - row data)
 * renders   : render row style conditionally, style such as css class, tooltip, etc (json)
 * converters: convert raw data of cell to display (json)
 * onSelect  : trigger event on row selected (function)
 * onDeselect: trigger event on row deselected (function)
 * onLoad    : trigger event on data loaded (function)
 * onWrite   : trigger event before writing data into cell (function)
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// GRID PUBLIC CLASS DEFINITION
	// ==============================

	var Grid = function (element, options) {
		this.init('grid', element, options);
	};

	Grid.VERSION  = '1.0.0';

	Grid.DEFAULTS = $.extend({}, One.DEFAULTS, {
		robustness: ['funcname', 'defaultSortBy'],
		funcname  : null,
		url       : null,
		rs        : undefined,
		rsProp    : 'results',
		async     : false,
		statProp  : 'dataStatus',
		postProps : null,
		multiple  : false,
		choiceboxed : false,
		sortable  : true,
		// it indicates the default sort column
		// if undefined, it will be the first column
		defaultSortBy : null,
		sortBy    : null,
		sortDir   : null,
		pageable  : true,
		pageNo    : 1,
		pageSize  : 10,
		totalPages : 1,
		pagebar   : 'folio',
		searchCriteria : {
			criteria : null,
			sortBy   : null,
			sortDir  : null,
			pageNo   : 0,
			pageSize : 0,
			totalPages : 0
		},
		columns   : [],
		DEFAULT_COLUMN : {
			name     : null,
			/**
			 * the supported types with argument expressions as below, e.g.
			 * 1. charone(sample.label.sampleType?{sampleType})
			 * 2. charone(sample.label.sampleType)
			 * 3. charone(?{sampleType})
			 * 4. date|i18n(?{expDate})
			 * 5. image({pathname})|link({sampleName})
			 */
			type     : 'text', 
			defaultValue : null,
			required : false,
			stylesheet : '',
			sortable : true,
			order    : 'asc', // sort in ascending or descending order
			multiple : false,
			i18nPrefix : '',
			ccyProp  : null,
			format   : null,
			operation: null, 
			url      : null, 
			mode     : null, 
			operations : []
		},
		converters : {},
		DEFAULT_CONVERTERS : {
			raw      : function (value, arg, argParams, column) {
				return value;
			},
			text     : function (value, arg, argParams, column) {
				if (value == null) {
					this.text('');
					return null
				}
				this.text(value);
				return value;
			},
			charone  : function (value, arg, argParams, column) {
				if (value == null || String(value).trim().length == 0) {
					var label = (argParams == null) ? '' : argParams;
					this.text(label);
					return label;
				}
				var i18nPrefix = (arg != null && arg.length > 0) ? arg : column.i18nPrefix;
				var i18nLabel = JSEA.localizeMessage(i18nPrefix + "." + value, argParams);
				this.text(i18nLabel);
				return i18nLabel;
			},
			choicebox: function (value, arg, argParams, column) {
				this.append($(document.createElement('SPAN')).addClass(column.multiple ? 'checkbox' : 'radio'));
			},
			clob     : function (value, arg, argParams, column) {
				if (value == null || value.trim().length == 0) {
					this.text('');
					return null;
				}
				this.append($(document.createElement('SPAN')).text(value));
				this.append($(document.createElement('SPAN')).addClass('tooltip').text(value));
				return value;
			
			},
			i18n     : function (value, arg, argParams, column) {
				if (value == null || String(value).trim().length == 0) {
					this.text('');
					return null;
				}
				var i18nKey = (arg != null && arg.length > 0) ? arg : column.i18nKey;
				var i18nLabel = JSEA.localizeMessage(i18nKey, argParams);
				this.text(i18nLabel);
				return i18nLabel;
			},
			icon     : function (value, arg, argParams, column) {
				if (value == null || String(value).trim().length == 0) {
					this.text('');
					return '';
				}
				var tooltip = (arg == null || String(arg).trim().length == 0) 
							? (column.i18nPrefix + "." + value) : String(arg).trim();
				var $icon = $(document.createElement('SPAN'))
								.addClass('bg_' + String(value).trim())
								.attr(JSEA.Constants.ATTR_TOOLTIPS, tooltip)
								.appendTo(this);
				Tipbox.bind(this);
				return $icon;
			},
			image    : function (value, arg, argParams, column) {
				if (value == null) {
					this.text('');
					return null;
				}
				var $image = $(document.createElement('DIV'))
								.addClass('image-wrapper')
								.append( $(document.createElement('DIV'))
										.addClass('image-panel')
										.append($(document.createElement('IMG'))
												.attr('src', JSEA.getPageContext().resolveUrl(arg))))
								.append($(document.createElement('DIV'))
										.addClass('image-title')
										.text(value))
								.appendTo(this.empty());
				return $image;
			},
			number   : function (value, arg, argParams, column) {
				if (value == null) {
					this.text('');
					return null;
				}
				var numLabel = Numbers.format(value, column.format);
				this.text(numLabel);
				return numLabel;
			},
			money    : function (value, arg, argParams, column) {
				if (value == null) {
					this.text('');
					return null;
				}
				var mnyLabel = Numbers.groupAmount(value, arg);
				this.text(mnyLabel);
				return mnyLabel;
			},
			date     : function (value, arg, argParams, column) {
				if (value == null) {
					this.text('');
					return '';
				} else {
					if (column.local) {
						var rowData = this.closest(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET).data(Grid.Constants.OBJATTR_ROW_DATA);
						// which solution will be used, need more tests
						// solution 1
						var timezoneOffsetProp = ((idx = column.name.lastIndexOf(JSEA.Constants.PATH_SEPARATOR)) > 0)
												? column.name.substring(0, (idx + 1)) + "timezoneOffsets" + column.name.substring(idx, column.name.length)
												: "timezoneOffsets" + JSEA.Constants.PATH_SEPARATOR + column.name;
						// solution 2
						var localDateProp = ((idx = column.name.lastIndexOf(JSEA.Constants.PATH_SEPARATOR)) > 0)
											? column.name.substring(0, (idx + 1)) + "localDates" + column.name.substring(idx, column.name.length)
											: "localDates" + JSEA.Constants.PATH_SEPARATOR + column.name;
						
						// solution 1
						var timezoneOffset = JSEA.Jsons.formatProperty(rowData, timezoneOffsetProp);
						var clientDate = new Date(value);
						// new date with local timezone.
						// firstly, change date time to UTC timezone with timezone offset of front-end (clientDate.timezoneOffset = UTC.timezone - Client.timezone)
						// and then, change it to user local timezone with timezone offset from back-end
						// need more investigation, such as changing timezone of front-end
						var localDate = new Date(value + (clientDate.getTimezoneOffset() + timezoneOffset) * 60 * 1000);
						var formatName = column.format;
						var dateLabel = Dates.format(localDate, formatName)
						this.text(dateLabel);
						return dateLabel;
						// solution 2
						//var localDate = JSEA.Jsons.formatProperty(rowData, localDateProp);
						//this.text(localDate);
					} else {
						var formatName = column.format;
						var dateLabel = Dates.format(new Date(value), formatName);
						this.text(dateLabel);
						return dateLabel;
					}
				}
			},
			link     : function (value, arg, argParams, column) {
				if (value == null) {
					this.text('');
					return null;
				}
				var $link = 
					$(document.createElement('A'))
						.addClass(column.operation)
						.appendTo(this.empty());
				if (arg == null) $link.text(value);
				else {
					if (typeof(arg) == 'string') $link.text(arg);
					else $link.append(arg);
				}
				if (column.href) $link.attr('href', column.href);
				else {
					$link.attr('href', 'javascript:void(0);');
					var operation = column.operations[0];
					$link.data(Grid.Constants.OBJATTR_OPERATION_OPTIONS, operation);
				}
				return $link;
			},
			onoff    : function (value, arg, argParams, column) {
				if (value == null) {
					this.text('');
					return null;
				}
				// @param arg is an array: item 0 is for on, item 1 is for off
				var $onoff$   = this.data(Grid.Constants.OBJATTR_ONE_INSTANCE);
				if ($onoff$  != null) {
					$onoff$.toggle(value == arg[0]);
					return $onoff$;
				}
				var operation = column.operations[0];
				var $link     = $(document.createElement(JSEA.Constants.TAG_LINK)).appendTo(this.empty());
				var $onoff$   = null;
				if (operation != null) {
					// it is a link and can be used for ajax operation
					$onoff$   = $link.onoff({ name : operation.name, on : (value == arg[0]), method : null }); 
				} else {
					var $this = this; // this cell
					// also a link, just toggle itself for row data
					$onoff$   = $link.onoff({ on : (value == arg[0]), onToggle : function (on) {
						var rowData = $this.closest(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET).data(Grid.Constants.OBJATTR_ROW_DATA);
						JSEA.Jsons.setProperty(rowData, column.name, (on ? arg[0] : arg[1]));
					} });
				}
				this.data(Grid.Constants.OBJATTR_ONE_INSTANCE, $onoff$);
				if (operation != null) {
					operation.colIndex = column.index;
					operation.scope    = JSEA.Constants.SCOPE_CELL;
					operation.pathnames= column.name;
					$link.data(Grid.Constants.OBJATTR_OPERATION_OPTIONS, operation);
				}
				return $onoff$;
			},
			password : function (value, arg, argParams, column) {
				if (value == null) {
					this.text('');
					return '';
				}
				this.text(''.leftPad(value.length, JSEA.Constants.PASSCHAR_SUBSTITUTE));
				return value;
			},
			percent  : function (value, arg, argParams, column) {
				if (value == null && arg == null && argParams == null) {
					this.text('');
					return null;
				}
				if (value != null && arg != null) value = Decimal.valueOf(value).divides(arg).toNumber();
				if (value == null) value = Decimal.valueOf(arg).divides(argParams[0]).toNumber();
				var $percentage$   = this.data(Grid.Constants.OBJATTR_ONE_INSTANCE);
				if ($percentage$  != null) {
					$percentage$.percentage('setValue', value);
					return $percentage$;
				}
				var $percentage  = $(document.createElement("div")).appendTo(this);
				var $percentage$ =$percentage.percentage({ value : value });
				this.data(Grid.Constants.OBJATTR_ONE_INSTANCE, $percentage$);
				return $percentage$;
			},
			rating   : function (value, arg, argParams, column) {
				if (value == null) {
					this.text('');
					return null;
				}
				var $ratingbar = $(document.createElement("div")).appendTo(this);
				$ratingbar.ratingbar({ value : value });
				return $ratingbar;
			},
			operations: function (value, arg, argParams, column) {
				this.addClass('icon');
				var rowData = this.closest(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET).data(Grid.Constants.OBJATTR_ROW_DATA);
				for (var i = 0; i < column.operations.length; i++) {
					var operation = column.operations[i];
					var $link = $(document.createElement(JSEA.Constants.TAG_LINK)).appendTo(this);
					$link.data(Grid.Constants.OBJATTR_OPERATION_OPTIONS, operation);
					var $link$ = $link.link({name : operation.name});
					for (var styleName in operation.stylization) {
						var rulers = operation.stylization[styleName];
						if (!$.isArray(rulers) && $.isFunction(rulers)) { rulers = [rulers]; }
						if (!$.isArray(rulers)) continue;
						for (var ruler of rulers) {
							if ($.isFunction(ruler) && ruler.apply(null, [rowData])) {
								// if any ruler is true
								Page.Method('style', styleName).apply($link$, null);
							}
						}
					}
					var opMode = operation.mode;
					if (opMode && opMode.indexOf('popover') == 0) {
						var idxArgsStart = opMode.indexOf(JSEA.Constants.ARGS_TOKEN_START);
						var idxArgsEnd   = opMode.indexOf(JSEA.Constants.ARGS_TOKEN_END);
						var propName = opMode.substring((idxArgsStart + JSEA.Constants.ARGS_TOKEN_START.length), idxArgsEnd);
						$link.popbox({ content : rowData[propName] });
					}
				}
				return null;
			}
		},
		onSelect0    : function () {},
		onSelect     : function () {},
		onDeselect   : function () {},
		onLoad       : function () {},
		onWrite      : function () {}
	});

	Grid.Constants = {
		OBJATTR_ONE_INSTANCE     : 'jsea-grid-col-one-instance',
		OBJATTR_ROW_DATA         : 'jsea-grid-row-data',
		OBJATTR_COLUMN_OPTIONS   : 'jsea-grid-col-options',
		OBJATTR_OPERATION_OPTIONS: 'jsea-grid-op-options',
		SORT_ASC              : 'asc',
		SORT_DESC             : 'desc',
		SLIDE_INTERVAL        : 50,
		SLIDE_SPEED           : 200,
	};

	Grid.LAYOUT = {
		AREA_STYLESHEET       : 'list-area',
		HEADER_ROW_TAGNAME    : 'ul',
		HEADER_ROW_STYLESHEET : 'header',
		HEADER_COL_TAGNAME    : 'li',
		BODY_ROW_TAGNAME      : 'ul',
		BODY_ROW_STYLESHEET   : 'row',
		BODY_COL_TAGNAME      : 'li',
		SORTABLE_STYLESHEET   : 'sortable',
		SORTED_STYLESHEET     : 'sorted',
		SORTED_ORDER_STYLESHEET : 'active',
		CHECKBOX_STYLESHEET   : 'checkbox',
		CHECKED_STYLESHEET    : 'checked',
		HOVER_STYLESHEET      : 'hover',
		SELECTED_STYLESHEET   : 'selected',
		EVEN_STYLESHEET       : 'even',
		ODD_STYLESHEET        : 'odd'
	};
	
	Grid.ROW_RENDERS = {
		stylesheet       : function (handlerName, handler, rowData) {
			var cssClass = handlerName;
			if ($.isFunction(handler) && handler.apply(null, [rowData])) {
				this.addClass(cssClass);
			} else {
				this.removeClass(cssClass);
			}
		},
		tooltip          : function (handlerName, handler, rowData) {
			if (!$.isFunction(handler)) return;
			var tip = handler.apply(null, [rowData]);
			if (tip != null) {
				this.attr(JSEA.Constants.ATTR_TOOLTIPS, tip);
				this.tipbox({ placement: 'left', content: tip });
			} else {
				this.removeAttr(JSEA.Constants.ATTR_TOOLTIPS);
				this.tipbox('destroy');
			}
		}
	};

	// NOTE: GRID EXTENDS ONE
	// ========================

	Grid.prototype = $.extend({}, One.prototype);

	Grid.prototype.constructor = Grid;

	Grid.prototype.init = function (type, element, options) {
		this.$super().init(type, element, options);
		this.enabled   = true;
		this.type      = type;
		this.$element  = $(element);
		this.options   = this.getOptions(options);
		this.count     = 0;
		this.listeners = {};
		
		//locate element for later use
		this.locate();
		// initialize grid
		this.initGrid();
		// initialize columns
		this.initColumns();
		// initialize header
		this.initHeader();
		// initialize pagebar
		this.initFooter();
		// initialize internal events for this grid
		this.initEvents();
		// load data
		this.load();
		// check if this grid is robust
		JSEA.ifRobust.apply(this, null);
	};
	
	Grid.prototype.locate = function () {
		this.$listArea = this.$element.find('.' + Grid.LAYOUT.AREA_STYLESHEET);
		this.$listHeader = this.$listArea.find('.' + Grid.LAYOUT.HEADER_ROW_STYLESHEET);
	};
	
	Grid.prototype.initGrid = function () {
		this.options.choiceboxed = (this.options.multiple || this.options.choiceboxed); // if multiple, use checkbox as default.
		this.options.converters = $.extend({}, this.options.DEFAULT_CONVERTERS);
		if (this.options.choiceboxed) {
			 var $choiceboxHeadColumn = 
				 $(document.createElement(Grid.LAYOUT.HEADER_COL_TAGNAME)).prependTo(this.$listHeader);
			 if (this.options.multiple) $choiceboxHeadColumn.append('<span class="checkbox"></span>').attr(JSEA.Constants.ATTR_COL_OPTIONS, 'type:"choicebox",sortable:false,multiple:true');
			 else $choiceboxHeadColumn.attr(JSEA.Constants.ATTR_COL_OPTIONS, 'type:"choicebox",sortable:false,multiple:false');
		}
	};
	
	Grid.prototype.initColumns = function () {
		var $this = this;
		this.$listHeader.find(Grid.LAYOUT.HEADER_COL_TAGNAME).each(function (i) {
			var $headerColumn = $(this);
			var column = $.extend({}, $this.options.DEFAULT_COLUMN, JSEA.Jsons.parse($headerColumn.attr(JSEA.Constants.ATTR_COL_OPTIONS)));
			column.index = i;
			column.types = (column.type.indexOf(JSEA.Constants.PROP_DELIM) >= 0) ? column.type.split(JSEA.Constants.PROP_DELIM) : null;
			column.type0 = (column.types != null) ? column.types[0] : column.type;
			column.sortable = ($this.options.sortable && (column.sortable === undefined || column.sortable == true));
			var i18nPrefix = $headerColumn.attr(JSEA.Constants.ATTR_I18N_PREFIX);
			if (i18nPrefix) column.i18nPrefix = i18nPrefix;
			column.operations = [];
			var colOperations = $headerColumn.attr(JSEA.Constants.ATTR_COL_OPERATIONS);
			if (colOperations) {
				var operations = JSEA.Jsons.parse(colOperations);
				for (var opname in operations) {
					var operation = {
						name      : opname,
						enabled   : true
					};
					operation = $.extend({}, operations[opname], operation);
					column.operations[column.operations.length] = operation;
				}
			}
			if (column.operation) {
				var operation = {
					name      : column.operation,
					url       : column.url,
					mode      : column.mode,
					enabled   : true
				};
				column.operations[column.operations.length] = operation;
			}
			$this.options.columns.push(column);
		});
	};
	
	Grid.prototype.initHeader = function () {
		var $this = this;
		this.$listHeader.find(Grid.LAYOUT.HEADER_COL_TAGNAME).each(function (i) {
			var $headerColumn = $(this);
			var column        = $this.options.columns[i];
			$headerColumn.addClass(column.type).addClass(column.stylesheet);
			if (column.required) $headerColumn.addClass('required');
			if ($this.options.sortable && column.sortable) {
				$headerColumn.append('<span class="asc"></span><span class="desc"></span>')
							.addClass(Grid.LAYOUT.SORTABLE_STYLESHEET)
							.attr('jsea-sort-by', column.name)
							.data(Grid.Constants.OBJATTR_COLUMN_OPTIONS, column);
				if ((!$this.options.choiceboxed && i == 0)
					|| ($this.options.choiceboxed && i == 1)
					|| column.name == $this.options.defaultSortBy) {
					$this.options.searchCriteria.sortBy  = column.name;
					$this.options.searchCriteria.sortDir = column.order;
				}
			}
		});
	};
	
	Grid.prototype.initFooter = function () {
		if (this.options.pageable) {
			this.$pagebar 
				= PagebarFactory.newInstance({
					type : this.options.pagebar,
					size : this.options.pageSize,
					grid : this.$element.data('jsea.plugin')
				});
			this.$element.append(this.$pagebar);
			// pagination
			this.options.searchCriteria.pageNo   = this.options.pageNo;
			this.options.searchCriteria.pageSize = this.options.pageSize;
		}
	};
	
	Grid.prototype.initEvents = function () {
		var $this = this;
		this.$listHeader.find('.' + Grid.LAYOUT.SORTABLE_STYLESHEET).bind('click', function () {
			if ($(this).hasClass(Grid.LAYOUT.SORTED_STYLESHEET)) {
				$this.options.searchCriteria.sortDir = ($this.options.searchCriteria.sortDir == Grid.Constants.SORT_ASC) ? Grid.Constants.SORT_DESC : Grid.Constants.SORT_ASC;
			} else {
				$this.options.searchCriteria.sortDir = $(this).data(Grid.Constants.OBJATTR_COLUMN_OPTIONS).order;
			}
			$this.options.searchCriteria.sortBy = $(this).data(Grid.Constants.OBJATTR_COLUMN_OPTIONS).name;
			$this.$listHeader
				.find('.' + Grid.LAYOUT.SORTED_STYLESHEET).removeClass(Grid.LAYOUT.SORTED_STYLESHEET)
				.find('.' + Grid.LAYOUT.SORTED_ORDER_STYLESHEET).removeClass(Grid.LAYOUT.SORTED_ORDER_STYLESHEET);
			$this.load();
		});
		
		this.$listHeader.find('.' + Grid.LAYOUT.CHECKBOX_STYLESHEET).bind('click', function () {
			if ($(this).hasClass(Grid.LAYOUT.CHECKED_STYLESHEET)) {
				$this.deselectAll();
				$(this).removeClass(Grid.LAYOUT.CHECKED_STYLESHEET);
			} else {
				$this.selectAll();
				$(this).addClass(Grid.LAYOUT.CHECKED_STYLESHEET);
			}
		});

		this.$listArea.on('click', Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET, function () {
			var $row = $(this);
			var $rows = $this.$listArea.find(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET);
			var rowIndex = $rows.index($row);
			$this.selectRow(rowIndex);
		});
		
		if ($.isFunction($this.options.onWrite)) $this.addRowListener('row.data.write', $this.options.onWrite);
		
		for (var column of this.options.columns) {
			for (var operation of column.operations) {
				this.$listArea.on('click', '.' + operation.name + ':not(.disabled)', function () {
					var $trigger = $(this);
					$this.fireRowOperated($trigger);
				});
			}
		}
	};
	
	Grid.prototype.load = function () {
		var $this = this;
		var searchCriteria = {};
		searchCriteria.pageable = this.options.pageable;
		if (this.options.pageable) {
			searchCriteria.pageNo   = this.options.searchCriteria.pageNo;
			searchCriteria.pageSize = this.options.searchCriteria.pageSize;
		}
		searchCriteria.sortable = this.options.sortable;
		if (this.options.sortable) {
			searchCriteria.sortBy  = this.options.searchCriteria.sortBy;
			searchCriteria.sortDir = this.options.searchCriteria.sortDir;
		}
		if (!this.options.async) {
			// process sync-resultset
			this.processData(this.options.rs, function () {
				$this.afterLoad(searchCriteria);
			});
			return;
		}
		var criteria = {};
		criteria = $.extend(criteria, this.options.searchCriteria.criteria, this.options.urlParams);
		searchCriteria.criteria = criteria;
		$.ajax({
			method: 'POST',
			url: JSEA.getPageContext().resolveUrl(this.options.url),
			data: JSON.stringify(searchCriteria),
			dataType: 'json',
			contentType: 'application/json; charset=UTF-8',
			beforeSend: function () {
				$this.$element.waiting({fixed:true});
			},
			success: function (searchCriteria) {
				$this.processData(searchCriteria[$this.options.rsProp], function () {
					$this.afterLoad(searchCriteria);
					$this.$element.waiting('hide');
				});
			}, 
			error: function () {
				$this.$element.waiting('hide');
			}
		});
	};
	
	Grid.prototype.afterLoad = function (searchCriteria) {
		if (this.options.sortable) {
			this.$listHeader.find("*[jsea-sort-by='" + searchCriteria.sortBy + "']")
							.addClass(Grid.LAYOUT.SORTED_STYLESHEET)
							.find('.' + searchCriteria.sortDir)
							.addClass(Grid.LAYOUT.SORTED_ORDER_STYLESHEET);
			this.options.sortBy  = searchCriteria.sortBy;
			this.options.sortDir = searchCriteria.sortDir;
		}
		if (this.options.pageable) {
			this.options.pageNo     = searchCriteria.pageNo;
			this.options.pageSize   = searchCriteria.pageSize;
			this.options.totalPages = searchCriteria.totalPages;
			this.$pagebar.repaint({
				num   : searchCriteria.pageNo,
				size  : searchCriteria.pageSize,
				total : searchCriteria.totalPages
			});
		}
		if ($.isFunction(this.options.onLoad)) this.options.onLoad.apply(this.$element.data('jsea.plugin'), []);
	},
	
	Grid.prototype.processData = function (rs, callback) {
		var $this = this;
		// remove one by one first
		var count = this.getRowCount();
		if (count > 0) {
			var i = count - 1;
			var clearTimer = setInterval(function () {
				$this.removeRow(i--);
				if (i < 0) {
					clearInterval(clearTimer);
					clearTimer = null;
				}
			}, Grid.Constants.SLIDE_INTERVAL);
		}
		// make sure result-set is array
		if (rs == null) rs = [];
		setTimeout(function () {
			// add rows one by one then
			if (rs.length > 0) {
				var j = 0;
				var addTimer = setInterval(function () {
					$this.addRow(rs[j++]);
					if (j >= rs.length) {
						clearInterval(addTimer);
						addTimer = null;
					}
				}, Grid.Constants.SLIDE_INTERVAL);
			}
			setTimeout(function () {
				if ($.isFunction(callback)) callback();
			}, rs.length * Grid.Constants.SLIDE_INTERVAL);
		}, count * Grid.Constants.SLIDE_INTERVAL + 10);
	};
	
	Grid.prototype.clearData = function () {
		this.$listArea
			.find(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET)
				.each(function () {
					$(this).removeData(Grid.Constants.OBJATTR_ROW_DATA);
				});
	};

	Grid.prototype.addRow = function (data) {
		this.insertRow(-1, data);
	};

	Grid.prototype.insertRow = function (index, data) {
		if (index > this.count) throw new Error('Row index is out of range: ' + this.count);
		var $this = this;
		// new row first
		var $row    = $(document.createElement(Grid.LAYOUT.BODY_ROW_TAGNAME)).addClass(Grid.LAYOUT.BODY_ROW_STYLESHEET);
		if (index == -1 || this.count == 0 || this.count == index) $row.appendTo(this.$listArea);
		else $row.insertBefore(this.$listArea.find(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET).get(index));
		this.setRowData(index, data);
		// build row then
		this.buildRow(index, $row, data);
		// fire row events
		this.fireRowDataWriting(index, data);
		this.fireRowAdded(index, data);
		// ++
		this.count++;
		
		// animation for adding
		this.$listArea.addClass('fading-container');
		$row.addClass('fading-in');
		setTimeout(function () {
			$row.addClass('visible');
			setTimeout(function () {
				$this.$listArea.removeClass('fading-container');
				$row.removeClass('fading-in')
					.removeClass('visible');
			}, Grid.Constants.SLIDE_SPEED);
		}, 10);
	};

	Grid.prototype.modifyRow = function (index, data) {
		// clear old row first
		var row  = this.$listArea.find(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET).get(index);
		var $row = $(row).removeData(Grid.Constants.OBJATTR_ROW_DATA).empty();
		this.setRowData(index, data);
		// rebuild row then
		this.buildRow(index, $row, data);
		// fire row event
		this.fireRowDataWriting(index, data);
		this.fireRowModified(index, data);
	};

	Grid.prototype.removeRow = function (index) {
		this.count--;
		var $this = this;
		var row  = this.$listArea.find(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET).get(index);
		var data = this.getRowData(index);

		// animation for removing
		var headerStep = this.$listHeader[0].offsetHeight;
		var $clone = $(row).clone().appendTo(this.$listArea);
		var step = $clone[0].offsetHeight;
		this.$listArea.addClass('sliding-container');
		$clone.addClass('sliding-out')
			.css('top', (headerStep + (index) * step) + 'px');
		setTimeout(function () {
			$clone.addClass('hidden')
				.css('top', (headerStep + (index - 1) * step) + 'px');
			setTimeout(function () {
				$clone
					.removeData(Grid.Constants.OBJATTR_ROW_DATA)
					.removeClass('sliding-out')
					.removeClass('hidden')
					.remove();
				$this.$listArea.removeClass('sliding-container');
			}, Grid.Constants.SLIDE_SPEED);
		}, 10);
		// ends of animation
		
		$(row)
			.removeData(Grid.Constants.OBJATTR_ROW_DATA)
			.remove();
		// fire rowremove event
		this.fireRowRemoved(index, data);
	};

	Grid.prototype.buildRow = function (index, $row, data) {
		for (var renderName in this.options.renders) {
			var handler  = this.options.renders[renderName],
				handlers = this.options.renders[renderName];
			var render = Grid.ROW_RENDERS[renderName];
			if (!render) break;
			if ($.isFunction(handler)) {
				// convert to json data if handler is function
				handlers = {};
				handlers[JSEA.Constants.DUMMY] = handler;
			}
			for (var handlerName in handlers) {
				render.apply($row, [handlerName, handlers[handlerName], data]);
			}
		}
		for (var i = 0; i < this.options.columns.length; i++) {
			var column = this.options.columns[i];
			var $cell 
				= $(document.createElement(Grid.LAYOUT.BODY_COL_TAGNAME)).appendTo($row);
			$cell.addClass(column.stylesheet);
			var value = null;
			if (column.name != null && column.name.length != 0) {
				value = JSEA.Jsons.getProperty(data, column.name);
				if (value == null && column.defaultValue != null) {
					JSEA.Jsons.setProperty(data, column.name, value = column.defaultValue);
				}
			}
			this.convertCell($cell, data, column);
		}
	};

	Grid.prototype.refreshRow = function (rowIndex, rowData) {
		this.clearRowData(rowIndex);
		var $this  = this;
		var row    = this.$listArea.find(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET).get(index);
		var $cells = $row.children(Grid.LAYOUT.BODY_COL_TAGNAME);
		$cells.each(function (i) {
			var $cell   = $(this);
			var column = $this.options.columns[colIndex];
			var value  = null;
			if (column.name != null && column.name.length != 0) {
				value = JSEA.Jsons.getProperty(rowData, column.name);
				if (value == null && column.defaultValue != null) {
					JSEA.Jsons.setProperty(rowData, column.name, value = column.defaultValue);
				}
			}
			this.convertCell($cell, rowData, column);
		});
		this.setRowData(index, data);
	};

	Grid.prototype.refreshCell = function (rowIndex, colIndex, rowData) {
		this.clearRowData(rowIndex);
		var row    = this.$listArea.find(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET).get(rowIndex);
		var $row   = $(row);
		var $cell  = $($row.children(Grid.LAYOUT.BODY_COL_TAGNAME).get(colIndex));
		var column = this.options.columns[colIndex];
		var value  = null;
		if (column.name != null && column.name.length != 0) {
			value = JSEA.Jsons.getProperty(rowData, column.name);
			if (value == null && column.defaultValue != null) {
				JSEA.Jsons.setProperty(rowData, column.name, value = column.defaultValue);
			}
		}
		this.convertCell($cell, rowData, column);
		this.setRowData(rowIndex, rowData);
	};

	Grid.prototype.rewriteColumn = function (index) {
		var $this = this;
		var $rows = this.$listArea.find(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET);
		$rows.each(function () {
			var $row   = $(this);
			var $col   = $($row.find(Grid.LAYOUT.BODY_COL_TAGNAME).get(index));
			var column = $this.options.columns[index];
			var data   = $row.data(Grid.Constants.OBJATTR_ROW_DATA);
			var value  = JSEA.Jsons.formatProperty(data, column.name);
			var converter = $this.options.converters[column.type];
			if (!converter) converter = $this.options.converters['text'];
			if (converter) {
				converter.apply($col, [value, column]);
			}
		});
	};
	
	Grid.prototype.convertCell = function ($cell, rowData, column) {
		if (column.types != null)
			for (var i = 0; i < column.types.length; i++) {
				this.resolveCellLabel($cell, column.types[i], rowData, column);
			}
		else this.resolveCellLabel($cell, column.type, rowData, column);
	};

	/**
	 * the rule of argument expression for type: <string|{variable}>?{variable}+
	 * the supported argument expressions as below, e.g.
	 * 1. charone(sample.label.sampleType?{sampleType})
	 * 2. charone(sample.label.sampleType)
	 * 3. charone(?{sampleType})
	 * 4. image({pathname})
	 */
	Grid.prototype.resolveCellLabel = function ($cell, type, rowData, column) {
		var typeArgExprs = (type == null) ? null : type.delimit(JSEA.Constants.ARG_DELIM_START, JSEA.Constants.ARG_DELIM_END);
		var typeArgExpr  = null;
		if (typeArgExprs != null) {
			type = type.substring(0, type.indexOf(JSEA.Constants.ARG_DELIM_START));
			typeArgExpr = typeArgExprs[0]; // not supported multiple argument expressions for now
		}
		var typeArg       = null;
		var typeArgValue  = null;
		var typeArgParams = null;
		var typeArgParamValues = null;
		if (typeArgExpr  != null) {
			var idx   = -1;
			var isVar = false;
			typeArg = (isVar = (typeArg = ((idx = typeArgExpr.indexOf('?')) < 0) ? typeArgExpr : typeArgExpr.substring(0, idx)).indexOf(JSEA.Constants.VAR_DELIM_START) >= 0)
					? typeArg.substring(typeArg.indexOf(JSEA.Constants.VAR_DELIM_START) + 1, typeArg.indexOf(JSEA.Constants.VAR_DELIM_END))
					: (typeArgValue = typeArg);
			if (isVar && typeArg != null) {
				// find this argument value from another column or row data if this argument is a variable like {sampleName}
				var anotherColumn = null;
				var $anotherCell  = null;
				for (var i = 0; i < this.options.columns.length; i++) {
					if (this.options.columns[i].name == typeArg) {
						anotherColumn = this.options.columns[i];
						$anotherCell  = $($cell.closest(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET).find(Grid.LAYOUT.BODY_COL_TAGNAME).get(i));
						break;
					}
				}
				if (anotherColumn != null) {
					typeArgValue = this.resolveCellLabel($anotherCell, anotherColumn.type0, rowData, anotherColumn);
				} else {
					typeArgValue = JSEA.Jsons.formatProperty(rowData, typeArg);
				}
			} else if (typeArgValue != null) {
				var s = -1, e = -1;
				if ((s = typeArgValue.indexOf(JSEA.Constants.ARRAY_TOKEN_START)) == 0 && (e = typeArgValue.indexOf(JSEA.Constants.ARRAY_TOKEN_END)) > 0) {
					// it is for array, e.g. [Y,N]
					typeArgValue = typeArgValue.substring(s + 1, e).split(JSEA.Constants.ARGS_DELIM);
				}
			}
			if (idx >= 0) typeArgParams = typeArgExpr.substring(idx + 1)
										.delimit(JSEA.Constants.PARAM_DELIM_START, JSEA.Constants.PARAM_DELIM_END);
			if (typeArgParams != null) {
				// for now, all parameters for this argument must be variables
				typeArgParamValues = [];
				for (var typeArgParam of typeArgParams) {
					var anotherColumn = null;
					var $anotherCell  = null;
					for (var i = 0; i < this.options.columns.length; i++) {
						if (this.options.columns[i].name == typeArgParam) {
							anotherColumn = this.options.columns[i];
							$anotherCell = $($cell.closest(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET).find(Grid.LAYOUT.BODY_COL_TAGNAME).get(i));
							break;
						}
					}
					if (anotherColumn != null) {
						var anotherColumnLabel = this.resolveCellLabel($anotherCell, anotherColumn.type0, rowData, anotherColumn);
						typeArgParamValues.push(anotherColumnLabel);
					} else {
						var columnValue = JSEA.Jsons.formatProperty(rowData, typeArgParam);
						typeArgParamValues.push(columnValue);
					}
				}
			}
		}
		$cell.addClass(type);
		
		var value = (column.name != null) ? JSEA.Jsons.formatProperty(rowData, column.name) : null;
		var converter = this.options.converters[type];
		if (!converter) converter = this.options.converters['text'];
		if (converter) {
			return converter.apply($cell, [value, typeArgValue, typeArgParamValues, column]);
		}
		return null;
	};
	
	Grid.prototype.getRow = function (index) {
		return this.$listArea.find(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET).get(index);
	};
	
	Grid.prototype.addRowStylesheet = function (index, stylesheet) {
		var row = this.getRow(index);
		$(row).addClass(stylesheet);
	};
	
	Grid.prototype.removeRowStylesheet = function (index, stylesheet) {
		var row = this.getRow(index);
		$(row).removeClass(stylesheet);
	};
	
	Grid.prototype.selectAll = function () {
		var count = this.getRowCount();
		for (var i = 0; i < count; i++) { this.selectRow(i, true); }
	};
	
	Grid.prototype.deselectAll = function () {
		var count = this.getRowCount();
		for (var i = 0; i < count; i++) { this.deselectRow(i, true); }
	};
	
	Grid.prototype.selectRow = function (index, ignore) {
		var $row = $(this.getRow(index));
		var rowSelected = $row.hasClass(Grid.LAYOUT.SELECTED_STYLESHEET);
		if (rowSelected) {
			if (this.options.multiple && !ignore) this.deselectRow(index);
		} else {
			if (!this.options.multiple) {
				var selectedIndex = this.getSectionIndexes();
				if (selectedIndex != -1) this.deselectRow(selectedIndex);
			}
			$row.addClass(Grid.LAYOUT.SELECTED_STYLESHEET);
			if ($.isFunction(this.options.onSelect0)) this.options.onSelect0.apply(this.$element.data('jsea.plugin'), [index, this.getRowData(index)]);
			if ($.isFunction(this.options.onSelect)) this.options.onSelect.apply(this.$element.data('jsea.plugin'), [index, this.getRowData(index)]);
		}
	};
	
	Grid.prototype.deselectRow = function (index) {
		this.removeRowStylesheet(index, Grid.LAYOUT.SELECTED_STYLESHEET);
		if ($.isFunction(this.options.onDeselect)) this.options.onDeselect.apply(this.$element.data('jsea.plugin'), [index, this.getRowData(index)]);
	};
	
	Grid.prototype.getRowCount = function () {
		return(this.count);
	};
	
	Grid.prototype.getRowData = function (index) {
		var row = this.$listArea.find(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET).get(index);
		return $.extend(true, {}, $(row).data(Grid.Constants.OBJATTR_ROW_DATA));
	};
	
	Grid.prototype.setRowData = function (index, rowData) {
		var row = this.$listArea.find(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET).get(index);
		$(row).data(Grid.Constants.OBJATTR_ROW_DATA, rowData);
	};
	
	Grid.prototype.clearRowData = function (index) {
		var row = this.$listArea.find(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET).get(index);
		$(row).removeData(Grid.Constants.OBJATTR_ROW_DATA);
	};
	
	Grid.prototype.getSectionData = function () {
		var $section    = this.$listArea.find(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET + '.' + Grid.LAYOUT.SELECTED_STYLESHEET);
		var sectionData = [];
		$section.each(function () {
			var $this   = $(this);
			var rowData = $.extend(true, {}, $this.data(Grid.Constants.OBJATTR_ROW_DATA));
			sectionData.push(rowData);
		});
		return (this.options.multiple ? sectionData : (sectionData.length != 0 ? sectionData[0] : null));
	};
	
	Grid.prototype.getSectionIndexes = function () {
		var $section = this.$listArea.find(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET + '.' + Grid.LAYOUT.SELECTED_STYLESHEET);
		var $rows    = this.$listArea.find(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET);
		var sectionIndexes = [];
		$section.each(function (i) {
			var $row     = $(this);
			var rowIndex = $rows.index($row);
			sectionIndexes.push(rowIndex);
		});
		return (this.options.multiple ? sectionIndexes : (sectionIndexes.length != 0 ? sectionIndexes[0] : -1));
	};
	
	Grid.prototype.getRowPost = function (index) {
		var data = this.getRowData(index);
		// use post properties to have cloned data formatted.
		var postProps = this.options.postProps;
		if (postProps) {
			for (var i = 0; i < postProps.length; i++) {
				Grid.toPost(data, postProps[i]);
			}
		}
		return data;
	};
	
	Grid.prototype.getSectionPost = function () {
		var $this    = this;
		var $section = this.$listArea.find(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET + '.' + Grid.LAYOUT.SELECTED_STYLESHEET);
		var $rows    = this.$listArea.find(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET);
		var sectionPost = [];
		$section.each(function () {
			var $row     = $(this);
			var rowIndex = $rows.index($row);
			var rowPost  = $this.getRowPost(rowIndex);
			sectionPost.push(rowPost);
		});
		return (this.options.multiple ? sectionPost : (sectionPost.length != 0 ? sectionPost[0] : null));
	};
	
	/**
	 * post property supports as below:
	 * 1, simple property - updateTime|longTimestampZ
	 * 2, nested property - sampleInfo.updateTime|longTimestampZ
	 * 3, array property - sampleExts.updateTime|longTimestampZ
	 * 4, map property - sampleLocales[].updateTime|longTimestampZ
	 * @param data
	 * @param postProp
	 */
	Grid.toPost = function (data, postProp) {
		if ((idx = postProp.indexOf(JSEA.Constants.PATH_SEPARATOR)) > 0) {
			var first = postProp.substring(0, idx);
			var rest = postProp.substring(idx + JSEA.Constants.PATH_SEPARATOR.length, postProp.length);
			data = JSEA.Jsons.formatProperty(data, first);
			if ($.isArray(data)) {
				$.each(data, function () {
					Grid.toPost(this, rest);
				});
			} else if ($.isPlainObject(data)) {
				if (first.indexOf(JSEA.Constants.MAP_TOKEN_START) > 0) {
					for (var key in data) {
						Grid.toPost(data[key], rest);
					}
				} else {
					Grid.toPost(data, rest);
				}
			}
		} else {
			var propName = postProp;
			if (postProp.indexOf(JSEA.Constants.PROP_DELIM) > 0) {
				propName = postProp.split(JSEA.Constants.PROP_DELIM)[0];
			}
			JSEA.Jsons.setProperty(data, propName, JSEA.Jsons.formatProperty(data, postProp));
		}
	};
	
	Grid.prototype.genPostFields = function () {
		var $this = this;
		var $rows = this.$listArea.find(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET);
		if (this.$fieldArea == null) this.$fieldArea = $(document.createElement('DIV')).appendTo(this.$element).hide();
		else this.$fieldArea.empty();
		var postMaps = Grid.extractPostMaps($this.options.postProps);
		$rows.each(function (i) {
			var rowPost = $this.getRowPost(i);
			Grid.buildPostField(rowPost, $this.options.rsProp + JSEA.Constants.ARRAY_TOKEN_START + i + JSEA.Constants.ARRAY_TOKEN_END, postMaps, $this.$fieldArea);
		});
	};

	/**
	 * post field supports as below:
	 * 1, simple field - sampleCode
	 * 2, nested field - sampleInfo.sampleCode
	 * 3, array field - sampleExts.sampleExtId
	 * 4, map field - sampleLocales[].localeCode (sampleLocales[] must be defined in postProps)
	 * @param data
	 * @param postProp
	 */
	Grid.buildPostField = function (data, name, postMaps, $area) {
		if ($.isPlainObject(data)) {
			for (var prop in data) {
				var subdata = data[prop];
				if ($.inArray(prop, postMaps) > -1) {
					for (var subprop in subdata) {
						Grid.buildPostField(subdata[subprop], name + JSEA.Constants.PATH_SEPARATOR + prop + JSEA.Constants.ARRAY_TOKEN_START + subprop + JSEA.Constants.ARRAY_TOKEN_END, postMaps, $area);
					}
				} else {
					Grid.buildPostField(subdata, name + JSEA.Constants.PATH_SEPARATOR + prop, postMaps, $area);
				}
			}
		} else if ($.isArray(data)) {
			$.each(data, function (i) {
				Grid.buildPostField(this, name + JSEA.Constants.ARRAY_TOKEN_START + i + JSEA.Constants.ARRAY_TOKEN_END, postMaps, $area);
			});
		} else {
			$(document.createElement('TEXTAREA'))
				.attr('name', name)
				.appendTo($area)
				.val(data);
		}
	};
	
	Grid.extractPostMaps = function (postProps) {
		if ($.isArray(postProps)) {
			var postMaps = [];
			$.each(postProps, function () {
				var postProp = this;
				if (postProp.endsWith(JSEA.Constants.MAP_TOKEN_END)) {
					postMaps.push(postProp.substr(0, postProp.indexOf(JSEA.Constants.MAP_TOKEN_START)));
				}
			});
			return postMaps;
		}
		return null;
	};
	
	Grid.prototype.fireRowOperated = function ($trigger) {
		var $this = this;
		var $row  = $trigger.closest(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET);
		var $rows = this.$listArea.find(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET);
		var operation = $trigger.data(Grid.Constants.OBJATTR_OPERATION_OPTIONS);
		operation.rowIndex = $rows.index($row);
		operation.trigger = $trigger;
		operation.params = this.getRowPost(operation.rowIndex);
		var listener = this.listeners[operation.name];
		if (operation.confirm) {
			var message = $.isFunction(window[operation.confirm])
					? window[operation.confirm]() 
						: (operation.confirm == operation.name ? 'global.confirm.' + operation.confirm + '-row' : operation.confirm);
			(message != null)
				? Confirm.request(JSEA.localizeMessage(message), function () { listener.method.apply($this.$element.data('jsea.plugin'), [operation]); })
				: listener.method.apply(this.$element.data('jsea.plugin'), [operation]);
		} else {
			listener.method.apply(this.$element.data('jsea.plugin'), [operation]);
		}
	};
	
	Grid.prototype.fireRowDataWriting = function (index, data) {
		var operation = {
			name : 'row.data.write',
			rowIndex : index,
			params : data
		};
		var listener = this.listeners[operation.name];
		if (listener && $.isFunction(listener.method)) {
			listener.method.apply(this.$element.data('jsea.plugin'), [operation]);
		}
	};
	
	Grid.prototype.fireRowAdded = function (index, data) {
		this.$element.trigger('rowadd', [index, data]);
		this.$element.trigger('rowchange', [index, data]);
	};
	
	Grid.prototype.fireRowModified = function (index, data) {
		this.$element.trigger('rowmodify', [index, data]);
		this.$element.trigger('rowchange', [index, data]);
	};
	
	Grid.prototype.fireRowRemoved = function (index, data) {
		this.$element.trigger('rowremove', [index, data]);
		this.$element.trigger('rowchange', [index, data]);
	};
	
	Grid.prototype.addRowListener = function (opname, method) {
		if (!this.listeners[opname]) { this.listeners[opname] = {}; }
		this.listeners[opname].method = method;
	};
	
	Grid.prototype.getProperties = function (propName) {
		var $rows = this.$listArea.find(Grid.LAYOUT.BODY_ROW_TAGNAME + '.' + Grid.LAYOUT.BODY_ROW_STYLESHEET);
		var properties = [];
		$rows.each(function () {
			var $this   = $(this);
			var rowData = $this.data(Grid.Constants.OBJATTR_ROW_DATA);
			properties.push(rowData[propName]);
		});
		return properties;
	};
	
	Grid.prototype.getOperations = function () {
		var ops = [];
		for (var i = 0; i < this.options.columns.length; i++) {
			if (this.options.columns[i].operations.length) {
				for (var j = 0; j < this.options.columns[i].operations.length; j++) {
					var opMode = this.options.columns[i].operations[j].mode;
					if (!opMode || !opMode.startsWith('popover')) {
						ops.push(this.options.columns[i].operations[j]);
					}
				}
			}
		}
		return(ops);
	};
	
	Grid.prototype.destroy = function () {
		if (this.options.pageable) {
			this.$pagebar[this.options.pagebar + 'Pagebar']('destroy');
			this.$pagebar = null;
		}
		this.clearData();
		this.$element.off()
			.removeData('jsea.grid')
			.removeData('jsea.plugin');
		this.$super().destroy();
	};
	
	Grid.prototype.getDefaults = function () {
		return Grid.DEFAULTS;
	};

	Grid.prototype.getOptions = function (options) {
		var gridOptions = this.parseAttribute(JSEA.Constants.ATTR_GRID_OPTIONS);
		var gridUrl     = gridOptions.url;
		
		options = $.extend(true, {}, this.getDefaults(), this.$super().getOptions(options), gridOptions, options);
		if (gridUrl) options.url = gridUrl;
		
		return options;
	};

	// GRID PLUGIN DEFINITION
	// ========================

	function Plugin(option) {
		var self = this;

		self.extend(One.Plugin.prototype);

		// GRID PUBLIC METHOD DEFINITION
		// ===============================

		self.addRowListener = function (opname, method) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				data.addRowListener(opname, method);
			});
		};

		self.createRow = function (rowData) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				rowData[data.options.statProp] = JSEA.Constants.STAT_ADDED;
				data.addRow(rowData);
				data.addRowStylesheet(data.getRowCount() - 1, 'created');
			});
		};

		self.updateRow = function (rowIndex, rowData) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				var oldData = data.getRowData(rowIndex);
				var oldStat = oldData[data.options.statProp];
				rowData[data.options.statProp] = (oldStat) ? oldStat : JSEA.Constants.STAT_MODIFIED;
				data.modifyRow(rowIndex, rowData);
				if (!oldStat) data.addRowStylesheet(rowIndex, 'updated');
			});
		};

		self.deleteRow = function (rowIndex, permanent) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				var rowData = data.getRowData(rowIndex);
				if (permanent) {
					data.removeRow(rowIndex);
				} else {
					rowData[data.options.statProp] = JSEA.Constants.STAT_REMOVED;
					data.modifyRow(rowIndex, rowData);
					data.addRowStylesheet(rowIndex, 'deleted');
				}
			});
		};

		self.restoreRow = function (rowIndex) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				var rowData = data.getRowData(rowIndex);
				if (rowData[data.options.statProp] == JSEA.Constants.STAT_ADDED) {
					data.removeRow(rowIndex);
				} else if (rowData[data.options.statProp] == JSEA.Constants.STAT_MODIFIED) {
					var oldData = data.options.rs[rowIndex];
					oldData[data.options.statProp] = null;
					data.modifyRow(rowIndex, oldData);
					data.removeRowStylesheet(rowIndex, 'updated');
				} else if (rowData[data.options.statProp] == JSEA.Constants.STAT_REMOVED) {
					rowData[data.options.statProp] = null;
					data.modifyRow(rowIndex, rowData);
					data.removeRowStylesheet(rowIndex, 'deleted');
				}
			});
		};

		self.addRow = function (rowData) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				data.addRow(rowData);
			});
		};

		self.refreshRow = function (rowIndex, rowData) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				data.refreshRow(rowIndex, rowData);
			});
		};

		self.refreshCell = function (rowIndex, colIndex, rowData) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				data.refreshCell(rowIndex, colIndex, rowData);
			});
		};

		self.resetColumn = function (colIndex, colProp) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				$.extend(data.options.columns[colIndex], { property : colProp });
				data.rewriteColumn(colIndex);
			});
		};

		self.setRowData = function (rowIndex, rowData) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				data.setRowData(rowIndex, rowData);
			});
		};

		self.getRowData = function (rowIndex) {
			var rowData = {};
			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				rowData = data.getRowData(rowIndex);
				return false;
			});
			return(rowData);
		};

		self.getSectionData = function () {
			var sectionData = null;
			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				sectionData = data.getSectionData();
				return false;
			});
			return(sectionData);
		};

		self.getData = function () {
			var rs       = {};
			var rsProp   = null;
			var rowsData = [];
			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				rsProp      = data.options.rsProp;
				for (var i = 0; i < data.getRowCount(); i++) {
					rowsData.push(data.getRowData(i));
				}
				rs[rsProp] = rowsData;
				return false;
			});
			return rs;
		};

		self.getRowPost = function (rowIndex) {
			var rowPost = {};
			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				rowPost = data.getRowPost(rowIndex);
				return false;
			});
			return(rowPost);
		};

		self.getSectionPost = function () {
			var sectionPost = null;
			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				sectionPost = data.getSectionPost();
				return false;
			});
			return(sectionPost);
		};

		self.getSectionIndexes = function () {
			var indexes = null;
			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				indexes = data.getSectionIndexes();
			});
			return(indexes);
		};

		self.moveSectionUp = function () {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				var indexes = data.getSectionIndexes();
				var multiple= data.options.multiple;
				if (!multiple) indexes = [indexes];
				$.each(indexes, function () {
					var rowIndex  = this;
					var prevIndex = rowIndex - 1;
					if (rowIndex != -1 && prevIndex > -1) {
						var row   = data.getRow(rowIndex);
						var prev  = data.getRow(prevIndex);
						$(row).insertBefore($(prev));
					}
				});
			});
		};

		self.moveSectionDown = function () {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				var indexes = data.getSectionIndexes();
				var multiple= data.options.multiple;
				if (!multiple) indexes = [indexes];
				$.each(indexes, function () {
					var rowIndex  = this;
					var nextIndex = rowIndex + 1;
					if (rowIndex != -1 && nextIndex < data.getRowCount()) {
						var row   = data.getRow(rowIndex);
						var next  = data.getRow(nextIndex);
						$(row).insertAfter($(next));
					}
				});
			});
		};

		self.hasSection = function () {
			var selected = false;
			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				var sectionData = data.getSectionData();
				selected = (data.options.multiple) ? (sectionData.length != 0) : (sectionData != null);
				return false;
			});
			return(selected);
		};

		self.removeSection = function () {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				var indexes = data.getSectionIndexes();
				var multiple= data.options.multiple;
				if (!multiple) indexes = [indexes];
				$.each(indexes, function () {
					var rowIndex  = this;
					data.removeRow(rowIndex);
				});
			});
		};

		self.getOperations = function () {
			var operations = [];
			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				operations = data.getOperations();
				return false;
			});
			return(operations);
		};

		self.getProperties = function (propName) {
			var properties = [];
			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				properties = data.getProperties(propName);
				return false;
			});
			return (properties);
		};

		self.getOption = function (name) {
			var value = null;
			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				value = data.options[name];
				return false;
			});
			return(value);
		};

		self.genPostFields = function () {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				data.genPostFields();
			});
		};

		self.isMultiple = function () {
			var multiple = false;
			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				multiple    = data.options.multiple;
				return false;
			});
			return(multiple);
		};

		self.reload = function () {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				data.load();
			});
		};

		self.turnTo = function (pageInfo) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				data.options.searchCriteria.pageNo = pageInfo.num;
				data.options.searchCriteria.pageSize = pageInfo.size;
				data.load();
			});
		};
		
		self.search = function (criteria) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.grid');
				data.options.searchCriteria.criteria = criteria;
				data.load();
			});
		};

		return this.each(function () {
			var $this   = $(this);
			var data    = $this.data('jsea.grid');
			var options = typeof option == 'object' && option;

			$this.data('jsea.plugin', self);

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.grid', (data = new Grid(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.grid;

	$.fn.grid             = Plugin;
	$.fn.grid.Constructor = Grid;

	// GRID NO CONFLICT
	// ==================

	$.fn.grid.noConflict = function () {
		$.fn.grid = old;
		return this;
	};

}(jQuery);
