/**
 * @(#) Project: Pyrube JSEA
 * 
 * 
 * Website: http://www.pyrube.com
 * Email: customercare@pyrube.com
 * Copyright Pyrube 2009. All rights reserved.
 */

/**
 * JSEA Data-transfer objects
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 */
+function () {
	'use strict';
	/**
	 * JSEA Data-transfer object can convert Text/CSV/Excel to JSEA JSON Data
	 * This object has the following options:
	 * type    : the data format. text/plain, text/html, etc
	 * mapping : the data mapping
	 */ 
	window.DataTransfer = function (options) {
		this.options = this.getOptions(options);
		var handlerType = DataTransfer.HANDLERS[this.options.type];
		this.handler = new this[handlerType + 'Handler'](this.options);
	};

	DataTransfer.VERSION = '1.0.0';

	DataTransfer.DEFAULTS = {
		type : 'text/plain'
	};

	DataTransfer.HANDLERS = {
		'text/plain' : 'Plain'
	};

	DataTransfer.prototype.read = function (original) {
		var origData = original.getData(this.options.type);
		return this.handler.parse(origData);
	};

	DataTransfer.prototype.getDefaults = function () {
		return DataTransfer.DEFAULTS;
	};

	DataTransfer.prototype.getOptions = function (options) {
		options = $.extend(true, {}, this.getDefaults(), options);
		return options;
	};

	/**
	 * JSEA Data-transferring-handler, the inner class for parsing the original data into JSEA Json Data
	 * This object has the following options:
	 * mapping : the data mapping
	 */ 
	DataTransfer.prototype.Handler = function (options) {
		this.init(options);
	};

	DataTransfer.prototype.Handler.prototype.constructor = DataTransfer.prototype.Handler;

	DataTransfer.prototype.Handler.VERSION = '1.0.0';

	DataTransfer.prototype.Handler.DEFAULTS = {
		mapping : null
	};

	DataTransfer.prototype.Handler.DEFAULT_CONVERTERS = {
		text   : function (value, params) { return value; },
		charone: function (value, params) {
			if (value == null || (value = String(value).trim()).length == 0) return null;
			for (var item of params.items) {
				var labelProp = params.itemLabel;
				var valueProp = params.itemValue;
				if (labelProp && valueProp && item[labelProp] == value) return(item[valueProp]);
				var i18nPrefix = params.i18nPrefix;
				var i18nValue  = JSEA.localizeMessage(i18nPrefix + "." + item);
				if (i18nPrefix && i18nValue == value) return(item);
			}
		},
		date   : function (value, params) {
			if (value == null || String(value).trim().length == 0) return null;
			return Dates.parse(String(value).trim(), params.format);
		},
		number : function (value, params) {
			if (value == null || String(value).trim().length == 0) return null;
			return Numbers.parse(String(value).trim(), params.format);
		},
		money  : function (value, params) {
			if (value == null || String(value).trim().length == 0) return null;
			return Numbers.parse(String(value).trim(), 'money');
		}
	};

	DataTransfer.prototype.Handler.prototype.init = function (options) {
		this.options    = this.getOptions(options);
		this.converters = $.extend({}, DataTransfer.prototype.Handler.DEFAULT_CONVERTERS, options.converters);
	};

	DataTransfer.prototype.Handler.prototype.parse = function (original) { };

	DataTransfer.prototype.Handler.prototype.convert = function (value, params) {
		if (value == null || String(value).trim().length == 0) {
			return null;
		}
		if (params.type === undefined || params.type === null) params.type = 'text';
		var converter = this.converters[params.type];
		if ($.isFunction(converter)) {
			return converter.apply(this, [String(value).trim(), params]);
		}
		return null;
	};

	DataTransfer.prototype.Handler.prototype.getDefaults = function () {
		return DataTransfer.prototype.Handler.DEFAULTS;
	};

	DataTransfer.prototype.Handler.prototype.getOptions = function (options) {
		options = $.extend(true, {}, this.getDefaults(), options);
		return options;
	};

	/**
	 * the concrete class can handle with the original text plain data
	 */ 
	DataTransfer.prototype.PlainHandler = function (options) {
		this.init(options);
	};

	DataTransfer.prototype.PlainHandler.prototype = $.extend({}, DataTransfer.prototype.Handler.prototype);

	DataTransfer.prototype.PlainHandler.prototype.constructor = DataTransfer.prototype.PlainHandler;

	DataTransfer.prototype.PlainHandler.VERSION = '1.0.0';

	DataTransfer.prototype.PlainHandler.DEFAULTS = $.extend({}, DataTransfer.prototype.Handler.DEFAULTS, {
		lineSeparator : '\r\n',
		separator : '\t'
	});

	DataTransfer.prototype.PlainHandler.prototype.parse = function (text) {
		if (text == null || text.trim().length == 0) return null;
		var data = [];
		var rows = text.split(this.options.lineSeparator);
		for (var row of rows) {
			if (row == null || String(row).trim().length == 0) break;
			var rowData = {};
			var values = row.split(this.options.separator);
			var i = 0;
			for (var value of values) {
				var params = this.options.mapping[i++];
				if (params) {
					rowData[params.name] = this.convert(value, params);
				}
			}
			data.push(rowData);
		}
		return data;
	};

	DataTransfer.prototype.PlainHandler.prototype.getDefaults = function () {
		return DataTransfer.prototype.PlainHandler.DEFAULTS;
	};
} ();