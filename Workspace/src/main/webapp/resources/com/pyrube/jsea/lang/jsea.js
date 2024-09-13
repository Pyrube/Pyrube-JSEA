/**
 * @(#) Project: Pyrube JSEA
 * 
 * 
 * Website: http://www.pyrube.com
 * Email: customercare@pyrube.com
 * Copyright Pyrube 2009. All rights reserved.
 */
/**
 * Override the $.ajax.
 */
(function($) {
	var _ajax = $.ajax;
	$.ajax = function (opt) {
		var traditional = opt.traditional;
		if (!traditional) traditional = ($.ajaxSettings.traditional) ? $.ajaxSettings.traditional : true;
		if (opt.data) {
			if (typeof opt.data == 'object') {
				//use $.param to fixed bug for {sampleName:'sampleName01',formats: ['XLS', 'PDF']}
				opt.data = $.param(opt.data, traditional);
			}
		}
		
		if ($.isEmptyObject(opt.type)) {
			opt.type = 'POST';
		}
		
		var _opt = $.extend(true, {}, opt, {
			success : function (data, status, xhr) {
				var level = xhr.getResponseHeader('Message-Level');
				if (level == "error") {
					if (opt.error) opt.error(xhr, status);
				} else {
					if (opt.success) opt.success(data, status, xhr);
				}
			},
			error : function (xhr, status, error) {
				if (opt.error) opt.error(xhr, status, error);
			},
			complete : function (xhr, status) {
				//the header presents only when exception/error handling is triggered
				if ('error' == xhr.getResponseHeader('Message-Level')) {
					switch (xhr.getResponseHeader('Message-Container')) {
						case 'Dialog' : 
							Dialog.open({ html : xhr.responseText });
						case 'Messages' :
							var tmpDom = $(xhr.responseText);
							tmpDom.filter('script').each(function () {
								$.globalEval(this.text || this.textContent || this.innerHTML || '');
							});
					}
				}
				if (opt.complete) opt.complete(xhr, status);
			}
		});
		_ajax(_opt);
	};
	
	var _param = $.param;
	// Serialize an array of form elements or a set of
	// key/values into a query string
	$.param = function (a, traditional) {
		var prefix,
			s = [],
			add = function (key, value) {
				// If value is a function, invoke it and return its value
				value = jQuery.isFunction( value ) ? value() : ( value == null ? "" : value );
				s[s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
			};

		// Set traditional to true for jQuery <= 1.3.2 behavior.
		if (traditional === undefined) {
			traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
		}

		// If an array was passed in, assume that it is an array of form elements.
		if (jQuery.isArray(a) || (a.jquery && !jQuery.isPlainObject(a))) {
			// Serialize the form elements
			jQuery.each(a, function () {
				add(this.name, this.value);
			});

		} else {
			// If traditional, encode the "old" way (the way 1.3.2 or older
			// did it), otherwise encode params recursively.
			for (prefix in a) {
				buildParams(prefix, a[prefix], add);
			}
		}

		// Return the resulting serialization
		return s.join("&").replace(JSEA.Constants.REGEXP_URL_SPACE, "+");
	};
	
	function buildParams(prefix, obj, add) {
		var name;

		if (jQuery.isArray(obj)) {
			// Serialize array item.
			jQuery.each(obj, function (i, v) {
				if (typeof v === "string" || typeof v === "number") {
					// Treat each array item as a scalar.
					add(prefix, v);

				} else {
					// Item is non-scalar (array or object), encode its numeric index.
					buildParams(prefix + JSEA.Constants.ARRAY_TOKEN_START + i + JSEA.Constants.ARRAY_TOKEN_END, v, add);
				}
			});

		} else if (jQuery.isPlainObject(obj)) {
			// Serialize object item.
			for (name in obj) {
				buildParams(prefix + JSEA.Constants.PATH_SEPARATOR + name, obj[name], add);
			}

		} else {
			// Serialize scalar item.
			add(prefix, obj);
		}
	}
}) (jQuery);

/**
 * JSEA Utility Object
 * The JSEA object has following methods:
 * getPageContext : return a singleton PageContext object
 * localizeMessage : localize message for a given code and arguments 
 * ifRobust    : robust process control to check whether it is a robust program for debugging
 * rulesOf     : return grid/valid rules of the function specified
 * objectize   : make the HTML elements in the given context to JSEA objects
 * destroy     : destroy the JSEA objects from the given context
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
var JSEA = {
	/**
	 * return a singleton PageContext object
	 * @return
	 */
	getPageContext : function () {
		return JSEA.pageContext;
	},
	/**
	 * @param basename the basename
	 * @param funcname the funcname
	 * @param pathnames other pathname
	 * @return the url
	 */
	resolveUrl     : function (basename, funcname, pathnames) {
		var url = (basename != null ? basename + JSEA.Constants.URL_SEPARATOR : '') + funcname;
		for (var pathname of pathnames) {
			if (pathname != null) url += (JSEA.Constants.URL_SEPARATOR + encodeURIComponent(pathname));
		}
		return(url);
	},
	/**
	 * localize message for a given code and arguments 
	 * @param code the message code
	 * @param param the message parameters
	 * @return String the localized message
	 */
	localizeMessage : function (code, param) {
		var localeCode = JSEA.getPageContext().getLocale();
		var bundle = Bundle.getBundle(localeCode);
		if (bundle != null) return bundle.getMessage(code, param);
		else return(code);
	},
	/**
	 * load script file
	 * @param url the script url to load
	 * @param callback after loaded
	 */
	loadScript      : function (url, callback) {
		var script = document.createElement('script');
		script.src = JSEA.getPageContext().resolveUrl(url);
		document.getElementsByTagName('head')[0].appendChild(script);
		script.onload = function () { callback.apply(this, null); };
	},
	/**
	 * return application property configured in config.xml
	 * @param name the property name
	 * @return
	 */
	getAppProperty  : function (name) {
		return JSEA.Constants.APP_PROPERTIES[name];
	},
	/**
	 * return respective function events to extend JSEA events
	 * @param funcname the function name
	 * @return
	 */
	getFuncEvents  : function (funcname) {
		var funcEvents = window[funcname.capitalize()] ? window[funcname.capitalize()].Events : undefined;
		return $.extend({}, funcEvents != undefined ? funcEvents : {});
	},
	/**
	 * return respective function methods to extend JSEA methods in given type, such as 'style', 'grid' etc
	 * @param type
	 * @param funcname the function name
	 * @return
	 */
	getFuncMethods  : function (type, funcname) {
		var funcMethods = window[funcname.capitalize()] ? window[funcname.capitalize()].Methods : undefined;
		return $.extend({}, funcMethods != undefined ? funcMethods[type] : {});
	},
	/**
	 * return respective function rules to extend JSEA rules in given type, such as 'data', 'valid', etc
	 * @param type
	 * @param funcname the function name
	 * @return
	 */
	getFuncRules    : function (type, funcname) {
		var funcRules = window[funcname.capitalize()] ? window[funcname.capitalize()].Rules : undefined;
		return $.extend({}, funcRules != undefined ? funcRules[type] : {});
	},
	/**
	 * substitute a string with parameters' values.
	 * it replace "{paramName}" with the value of parameter paramName. the paramName must not include { or }.
	 * if parameter paramName is not found, then set param's value to empty string.
	 * @param str
	 * @param params
	 */
	substitute     : function (str, params) {
		var iPos1 = -1;
		if (str == null || str.length == 0 || (iPos1 = str.indexOf(JSEA.Constants.PARAM_DELIM_START)) < 0) return(str);
		while (iPos1 >= 0) {
			// try to replace the parameter
			var iPos2 = str.indexOf(JSEA.Constants.PARAM_DELIM_END, iPos1 + JSEA.Constants.PARAM_DELIM_START.length);
			if (iPos2 > 0) {
				// end is found
				var paramValue = JSEA.Jsons.formatProperty(params, str.substring(iPos1 + JSEA.Constants.PARAM_DELIM_START.length, iPos2));
				if (paramValue === undefined || paramValue === null) paramValue = '';
				// replace
				str = str.substring(0, iPos1) + paramValue + str.substring(iPos2 + JSEA.Constants.PARAM_DELIM_END.length);
				iPos2 = iPos1 + paramValue.length;
				iPos1 = str.indexOf(JSEA.Constants.PARAM_DELIM_START, iPos2);
			} else {
				// no end, then exit
				iPos1 = -1;
			}
		}
		return(str);
	},
	ifRobust : function (robustness, args) {
		if (!robustness) robustness = this.options.robustness;
		if (!robustness) return true;
		if (typeof robustness == 'string') robustness = [robustness];
		for (var i = 0; i < robustness.length; i++) {
			if (!Page.Rule('robust')[robustness[i]](this, args)) {
				if (args == undefined) args = [];
				args = [this.type, this.options.funcname].concat(args);
				Message.debug('message.debug.' + robustness[i] + '-not-robust', args);
				return false;
			}
		}
		return true;
	},
	/**
	 * value the JSEA field in the given name
	 */
	value     : function (context, name, value) {
		if (!context || !context.length) context = document;
		var $field  = $(':input[name="' + name + '"]:not([type=checkbox],[type=radio]),ul[name="' + name + '"]', context);
		var $field$ = $field.data('jsea.plugin') || $field;
		$field$.val(value);
	},
	serialize : function (context) {
		if (!context) context = document.forms[0];
		var o = {};
		var filedArray = context.serializeArray();
		$.each(filedArray, function () {
			if (o[this.name]) {
				if (!$.isArray(o[this.name])) {
					o[this.name] = [ o[this.name] ];
				}
				o[this.name].push(this.value || '');
			} else {
				o[this.name] = this.value || '';
			}
		});
		return o;
	},
	/**
	 * make the HTML elements in the given context to JSEA objects
	 * @return the JSEA components in the given context
	 */
	objectize: function (context, options) {
		if (!context) context = document;
		// objectize all buttons/links
		for (var type in JSEA.Constants.CLICKINGS) {
			var a = JSEA.Constants.CLICKINGS[type];
			var selector = '';
			if ($.isArray(a)) {
				for (var i = 0; i < a.length; i++) {
					if (i != 0) selector += ',';
					selector += ('*[' + a[i] + ']');
				}
			} else selector = ('*[' + a + ']')
			$(selector, context).each(function () { $(this)[type](options); });
		}
		// objectize all fields
		for (var type of JSEA.Constants.FIELD_TYPES) {
			var a = JSEA.Constants.FIELDS[type];
			var selector = '';
			if ($.isArray(a)) {
				for (var i = 0; i < a.length; i++) {
					if (i != 0) selector += ',';
					selector += ('*[' + a[i] + ']');
				}
			} else selector = ('*[' + a + ']')
			$(selector, context).each(function () { $(this)[type](options); });
		}
		// objectize all components
		var components = {};
		for (var component in JSEA.Constants.COMPONENTS) {
			var a = JSEA.Constants.COMPONENTS[component];
			var selector = '';
			if ($.isArray(a)) {
				for (var i = 0; i < a.length; i++) {
					if (i != 0) selector += ',';
					selector += ('*[' + a[i] + ']');
				}
			} else selector = ('*[' + a + ']')
			components[component] = $(selector, context)[component](options);
		}
		// bind tool-tips for all elements with JSEA.Constants.ATTR_TOOLTIPS
		Tipbox.bind($(context));
		
		return components;
	},
	/**
	 * destroy the JSEA objects in the given context
	 * @param context
	 */
	destroy : function (context) {
		if (!context) context = document;
		// destroy all buttons/links
		for (var type in JSEA.Constants.CLICKINGS) {
			var a = JSEA.Constants.CLICKINGS[type];
			var selector = '';
			if ($.isArray(a)) {
				for (var i = 0; i < a.length; i++) {
					if (i != 0) selector += ',';
					selector += ('*[' + a[i] + ']');
				}
			} else selector = ('*[' + a + ']')
			$(selector, context).each(function () { $(this)[type]('destroy'); });
		}
		// destroy all components
		for (var component in JSEA.Constants.COMPONENTS) {
			var a = JSEA.Constants.COMPONENTS[component];
			var selector = '';
			if ($.isArray(a)) {
				for (var i = 0; i < a.length; i++) {
					if (i != 0) selector += ',';
					selector += ('*[' + a[i] + ']');
				}
			} else selector = ('*[' + a + ']')
			$(selector, context)[component]('destroy');
		}
		// destroy all fields
		for (var field in JSEA.Constants.FIELDS) {
			var a = JSEA.Constants.FIELDS[field];
			var selector = '';
			if ($.isArray(a)) {
				for (var i = 0; i < a.length; i++) {
					if (i != 0) selector += ',';
					selector += ('*[' + a[i] + ']');
				}
			} else selector = ('*[' + a + ']')
			$(selector, context).each(function () { 
				$(this)[field]('destroy'); 
			});
		}
	}
};

/**
 * JSEA Constants
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 */
JSEA.Constants = {
	YES                   : 'Y', NO                    : 'N',
	DUMMY                 : 'DUMMY',
	TAG_BUTTON            : 'button',
	TAG_ICON              : 'a',
	TAG_LINK              : 'a',
	ATTR_CLASS            : 'jsea-class',
	ATTR_BASENAME         : 'jsea-basename',
	ATTR_FUNCNAME         : 'jsea-funcname',
	ATTR_SCRIPT           : 'jsea-script',
	ATTR_PAGE_OPTIONS     : 'jsea-page-options',
	ATTR_FORM_OPTIONS     : 'jsea-form-options',
	ATTR_FORM_TYPE        : 'jsea-form-type',
	ATTR_GRID_OPTIONS     : 'jsea-grid-options',
	ATTR_COL_OPTIONS      : 'jsea-col-options',
	ATTR_COL_OPERATIONS   : 'jsea-col-operations',
	ATTR_BUTTON_OPTIONS   : 'jsea-btn-options',
	ATTR_LINK_OPTIONS     : 'jsea-lnk-options',
	ATTR_TEXTFIELD_OPTIONS: 'jsea-textfield-options',
	ATTR_DATEFIELD_OPTIONS: 'jsea-datefield-options',
	ATTR_SELEFIELD_OPTIONS: 'jsea-selefield-options',
	ATTR_FALEFIELD_OPTIONS: 'jsea-falefield-options',
	ATTR_LOOKUP_OPTIONS   : 'jsea-lookup-options',
	ATTR_UPLOAD_OPTIONS   : 'jsea-upload-options',
	ATTR_CAPTCHA_OPTIONS  : 'jsea-captcha-options',
	ATTR_CHECKBOXES_OPTIONS : 'jsea-checkboxes-options',
	ATTR_CHECKBOX_OPTIONS : 'jsea-checkbox-options',
	ATTR_RADIOS_OPTIONS   : 'jsea-radios-options',
	ATTR_RADIO_OPTIONS    : 'jsea-radio-options',
	ATTR_PROPERTY_OPTIONS : 'jsea-property-options',
	ATTR_I18N_PREFIX      : 'jsea-i18n-prefix',
	ATTR_TABS_OPTIONS     : 'jsea-tabs-options',
	ATTR_TAB_OPTIONS      : 'jsea-tab-options',
	ATTR_WIZARD_OPTIONS   : 'jsea-wizard-options',
	ATTR_STEP_OPTIONS     : 'jsea-step-options',
	ATTR_LOADING_OPTIONS  : 'jsea-loading-options',
	ATTR_SCROLLING_OPTIONS : 'jsea-scrolling-options',
	ATTR_CHART_OPTIONS    : 'jsea-chart-options',
	ATTR_NAVBAR_OPTIONS   : 'jsea-navbar-options',
	ATTR_TOOLTIPS         : 'jsea-tooltips',
	ATTR_VALUE            : 'data-value',
	ATTR_LABEL            : 'data-label',
	ATTR_VALID_TYPE       : 'jsea-valid-type',
	ATTR_VALID_RULES      : 'jsea-valid-rules',
	REGEXP_URL_SPACE      : /%20/g,
	REGEXP_ARRAY          : /\[\]$/,
	REGEXP_MAP            : /\[\]$/,
	PASSCHAR_SUBSTITUTE   : '@',
	ARRAY_TOKEN_START     : '[', ARRAY_TOKEN_END : ']',
	ARGS_TOKEN_START      : '(', ARGS_TOKEN_END  : ')',
	MAP_TOKEN_START       : '[', MAP_TOKEN_END   : ']',
	VAR_DELIM_START       : '{', VAR_DELIM_END   : '}',
	ARG_DELIM_START       : '(', ARG_DELIM_END   : ')',
	PARAM_DELIM_START     : '{', PARAM_DELIM_END : '}',
	ARGS_DELIM            : ',',
	PROP_DELIM            : '|',
	ARRAY_SEPARATOR       : ',',
	I18N_KEY_SEPARATOR    : '.',
	PATH_SEPARATOR        : '.',
	URL_SEPARATOR         : '/',
	// the scope of refreshing after operation executed
	SCOPE_DEFAULT         : -1,
	SCOPE_NONE            : 0,
	SCOPE_GRID            : 1,
	SCOPE_ROW             : 2,
	SCOPE_CELL            : 3,
	STAT_ADDED            : 'A',
	STAT_MODIFIED         : 'M',
	STAT_REMOVED          : 'R',
	CLICKINGS             : {
		button              : 'jsea-btn-options',
		link                : 'jsea-lnk-options'
	},
	FIELD_TYPES           : [ 'textfield', 'datefield', 'selefield', 'falefield', 
	                          'lookup', 'upload', 'captcha', 
	                          'checkbox', 'checkboxes', 'radio', 'radios', 
	                          'property' ],
	FIELDS                : {
		textfield           :  'jsea-textfield-options',
		datefield           :  'jsea-datefield-options',
		selefield           :  'jsea-selefield-options',
		falefield           :  'jsea-falefield-options',
		lookup              :  'jsea-lookup-options',
		upload              :  'jsea-upload-options',
		captcha             :  'jsea-captcha-options',
		checkbox            :  'jsea-checkbox-options',
		checkboxes          :  'jsea-checkboxes-options',
		radio               :  'jsea-radio-options',
		radios              :  'jsea-radios-options',
		property            :  'jsea-property-options'
	},
	COMPONENTS            : {
		'tabs'              :  'jsea-tabs-options',
		'wizard'            :  'jsea-wizard-options',
		'loading'           :  'jsea-loading-options',
		'scrolling'         :  'jsea-scrolling-options',
		'navbar'            :  'jsea-navbar-options',
		'chart'             :  'jsea-chart-options',
		'validator'         : ['jsea-valid-type', 'jsea-valid-rules']
	},
	APP_PROPERTIES        : undefined,
	OPTIONS               : {
		COUNTRIES           : ['CN', 'HK', 'KR', 'JP', 'SG', 'US'],
		CURRENCIES          : ['CNY', 'EUR', 'JPY', 'KWD', 'USD']
	},
	CURRENCIES            : {
		'CNY'               : {precision : 2},
		'EUR'               : {precision : 0},
		'JPY'               : {precision : 0},
		'KWD'               : {precision : 3},
		'USD'               : {precision : 2}
	},
	FORMATS               : {
		'longTimestampZ'    : "yyyy-MM-dd HH:mm:ss:SSS Z",
		'timestampZ'        : "yyyy-MM-dd HH:mm:ss Z",
		'longTimestamp'     : "yyyy-MM-dd HH:mm:ss:SSS",
		'timestamp'         : "yyyy-MM-dd HH:mm:ss",
		'date'              : "yyyy-MM-dd",
		'longTime'          : "HH:mm:ss:SSS",
		'time'              : "HH:mm:ss",
		'shortTime'         : "HH:mm",
		'month'             : "yyyy-MM",
		'year'              : "yyyy",
		'decimalSeparator'  : ".",
		'groupSeparator'    : ",",
		'amount'            : "#0.00#",
		'integer'           : "#0",
		'float'             : "#0.0##############",
		'percent'           : "#0.#%",
		'percent0'          : "#0%",
		'percent1'          : "#0.0%",
		'percent2'          : "#0.00%",
		'amount'            : "#0.00%",
		'money'             : "#,##0.00#",
		'money0'            : "#,##0",
		'money1'            : "#,##0.0",
		'money2'            : "#,##0.00",
		'money3'            : "#,##0.000",
		'periodLength'      : "3",
		'piw'               : "#${s3}#${p3}#${p2}#${p1}${s2}#${p3}#${p2}#${p1}${s1}#${p3}#${p2}0${p1}.#"
	},
	FORMATTERS             : {},  // defined in format.js
	PARSERS                : {}   // defined in format.js
};

/**
 * JSEA JSON utilities
 * It has the following methods:
 * parse       : parse attribute value of HTML element to a json object
 * formatProperty : return formatted value of the property specified in json object
 * parseProperty  : return parsed value of the property specified in json object
 * setProperty    : put value of the property specified into json object
 * formatProperties : put formatted value of the property specified into json object
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 */
JSEA.Jsons = {
	parse     : function (s) {
		if (s) {
			if (s.substring(0, 1) != '{') {
				s = '{' + s + '}';
			}
			var options = (new Function ('return ' + s)) ();
			return options;
		} else {
			return {};
		}
	},
	formatProperty : function (obj, prop) {
		while ((idx = prop.indexOf(JSEA.Constants.PATH_SEPARATOR)) > 0) {
			obj = obj[prop.substring(0, idx)];
			prop = prop.substring(idx + JSEA.Constants.PATH_SEPARATOR.length, prop.length);
			if (!$.isPlainObject(obj)) return obj;
		}
		var propName = prop;
		if (prop.indexOf(JSEA.Constants.PROP_DELIM) > 0) {
			var a = prop.split(JSEA.Constants.PROP_DELIM);
			propName = a[0];
			var fmtName = a[1];
			var extProp = a[2];
			var extValue = null;
			if (extProp) extValue = obj[extProp];
			if (extProp && !extValue) extValue = $('#' + extProp).val();
			if (extProp && !extValue) extValue = extProp;
			return (JSEA.Constants.FORMATTERS[fmtName](obj[propName], extValue));
		} else if ((start = prop.indexOf(JSEA.Constants.MAP_TOKEN_START)) > 0) {
			return (obj[propName.substring(0, start)]);
		} else {
			return (obj[propName]);
		}
	},
	parseProperty : function (obj, prop) {
		while ((idx = prop.indexOf(JSEA.Constants.PATH_SEPARATOR)) > 0) {
			if (!$.isPlainObject(obj)) return obj;
			obj = obj[prop.substring(0, idx)];
			prop = prop.substring(idx + JSEA.Constants.PATH_SEPARATOR.length, prop.length);
		}
		var propName = prop;
		if (prop.indexOf(JSEA.Constants.PROP_DELIM) > 0) {
			var a = prop.split(JSEA.Constants.PROP_DELIM);
			propName = a[0];
			var fmtName = a[1];
			return (JSEA.Constants.PARSERS[fmtName](obj[propName], fmtName));
		} else {
			return (obj[propName]);
		}
	},
	getProperty : function (obj, prop) {
		while ((idx = prop.indexOf(JSEA.Constants.PATH_SEPARATOR)) > 0) {
			if (!$.isPlainObject(obj)) return obj;
			obj = obj[prop.substring(0, idx)];
			prop = prop.substring(idx + JSEA.Constants.PATH_SEPARATOR.length, prop.length);
		}
		var propName = prop;
		if (prop.indexOf(JSEA.Constants.PROP_DELIM) > 0) {
			var a = prop.split(JSEA.Constants.PROP_DELIM);
			propName = a[0];
		}
		return (obj[propName]);
	},
	setProperty : function (obj, prop, value) {
		while ((idx = prop.indexOf(JSEA.Constants.PATH_SEPARATOR)) > 0) {
			if (!$.isPlainObject(obj)) return;
			obj = obj[prop.substring(0, idx)];
			prop = prop.substring(idx + JSEA.Constants.PATH_SEPARATOR.length, prop.length);
		}
		var propName = prop;
		if ((start = prop.indexOf(JSEA.Constants.MAP_TOKEN_START)) > 0) {
			obj[propName.substring(0, start)] = value;
		} else {
			obj[propName] = value;
		}
	},
	formatProperties: function (obj, props) {
		for (var i = 0; i < props.length; i++) {
			var value = JSEA.Jsons.formatProperty(obj, props[i]);
			JSEA.Jsons.setProperty(obj, props[i].split(JSEA.Constants.PROP_DELIM)[0], value);
		}
	}
};

/**
 * JSEA general rules have following data:
 * robust : rules to check whether JSEA object is robust
 * data   : rules to check data
 * valid  : rules to validate
 * format : rules to format
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 */
JSEA.Rules = {
	robust: {
		funcname    : function (jseao) { return jseao.options.funcname != null && jseao.options.funcname != ''; },
		operation   : function (jseao) { return jseao.options.operation != null && jseao.options.operation != ''; },
		keyProp     : function (jseao) { return jseao.options.keyProp != null && jseao.options.keyProp != ''; },
		refProp     : function (jseao) { return jseao.options.refProp != null && jseao.options.refProp != ''; },
		dataType    : function (jseao, args) { return jseao.options.typeProp ? JSEA.Jsons.formatProperty(args[0], jseao.options.typeProp) != undefined : jseao.options.dataType != undefined; },
		statProp    : function (jseao) { return jseao.options.statProp != null && jseao.options.statProp != ''; },
		returnProps :  function (jseao) { return jseao.options.returnProps != null && jseao.options.returnProps.length != 0; },
		url         : function (jseao) { return jseao.options.url != null && jseao.options.url.length != 0; },
		prop        : function (jseao, args) { return JSEA.Jsons.formatProperty(args[1], args[0]) != undefined; },
		field       : function (jseao, args) { return jseao.getProperty(args[0]) != undefined; },
		defaultSortBy 
					: function (jseao) { return jseao.options.sortable ? jseao.options.searchCriteria.sortBy != null && jseao.options.searchCriteria.sortBy != '' : true; }
	},
	data  : {
		isAdded     : function (data) { return data.dataStatus == 'A'; },
		isRemoved   : function (data) { return data.dataStatus == 'R'; },
		cannotUndo  : function (data) { return data.dataStatus != 'A' && data.dataStatus != 'R'; },
		notCreated  : function (data) { return data.dataStatus == null; },
		notSubmitted: function (data) { return data.dataStatus == 'J' || data.dataStatus == 'T' || data.dataStatus == 'N'; },
		isSubmitted : function (data) { return data.dataStatus == 'C' || data.dataStatus == 'U' || data.dataStatus == 'D'; },
		notVerified : function (data) { return data.dataStatus != 'V'; },
		isVerified  : function (data) { return data.dataStatus == 'V'; },
		noComments  : function (data) { return !data.comments; }
	},
	valid : {
		nonnullCols : function (value, params) { 
						for (var i = 0; i < params.length; i++) {
							var values = this.$field.getProperties(params[i]);
							for (var j = 0; j < values.length; j++) {
								if (values[j] == null || values[j] == '') return false;
							}
						}
						return true;
					},
		uniqueIndex : function (value, params) { 
						var values = this.$field.getProperties(params[0]);
						var stats  = this.$field.getProperties(this.$field.getOption('statProp'));
						var a      = []; 
						for (var i = 0; i < values.length; i++) {
							var bDeleted  = (stats[i] == JSEA.Constants.STAT_DELETED);
							var bIncluded = ($.inArray(values[i], a) != -1);
							if (!bDeleted) {
								if (bIncluded) return false;
								a.push(values[i]);
							}
						}
						return true;
					},
		remote   : function (value, params) { 
						if (value == '') return true;
						var $this = this;
						var toCheck = params[0];
						var name  = $this.$field.attr('name');
						var url   = params[1] ? (params[1] + JSEA.Constants.URL_SEPARATOR + value) : undefined; // if any, use it instead of resolve a url
						$.ajax({
							method: 'POST',
							url : JSEA.getPageContext().resolveUrl(url || JSEA.resolveUrl(this.options.basename, this.options.funcname, [toCheck, name, value])),
							dataType: 'json',
							contentType: 'application/json; charset=UTF-8',
							success: function (result) {
								if (result) $this.success('remote', toCheck, true);
								else $this.error('remote', toCheck);
							}
						});
						return false;
					},
		required : function (value, params) { return value.trim() != '' || !params[0]; },
		length   : function (value, params) { return value.length >= params[0] && value.length <= params[1]; },
		minLength: function (value, params) { return value.length >= params[0]; },
		maxLength: function (value, params) { return value.length <= params[0]; },
		minValue : function (value, params) { return value == '' || Numbers.parse(value) >= Number(params[0]); },
		maxValue : function (value, params) { return Numbers.parse(value) <= Number(params[0]); },
		equalTo  : function (value, params) { return value == $("#" + params[0]).val(); },
		amount   : function (value, params) { return value == '' || true; },
		date     : function (value, params) { return value == '' || true; },
		mimes    : function (value, params) { var pathname = this.$field.getPathname(); var extentsion = pathname.substring(pathname.lastIndexOf(".") + 1, pathname.length).toLowerCase(); return pathname == '' || ($.inArray(extentsion, params) != -1); },
		email    : function (value, params) { return value == '' || !params[0] || /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i.test(value); },
		url      : function (value, params) { return value == '' || !params[0] || /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value); }
	},
	format: {
		focus    : {
			date   : function (elem, format) {},
			money  : function (elem, format, ccyCode) { Numbers.ungroupField(elem, ccyCode); }
		},
		blur     : {
			date   : function (elem, format) {},
			money  : function (elem, format, ccyCode) { Numbers.groupField(elem, ccyCode); }
		}
	}
};

/**
 * JSEA general events have following types:
 * click : methods bound for click event
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 */
JSEA.Events = {
	click    : {
		dummy  : function () { }
	}
}

/**
 * JSEA general methods have following data:
 * style : methods to stylize an element
 * grid  : methods to maintain grid data
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 */
JSEA.Methods = {
	grid     : {
		remove   : function (operation) { this.deleteRow(operation.rowIndex); },
		modify   : function (operation) {
			var $this = this;
			Dialog.open({
				url      : operation.url,
				urlParams: operation.params,
				args     : operation.args,
				complete : function (returnData) {
					$this.updateRow(operation.rowIndex, returnData); 
				}
			});
		},
		undo     : function (operation) {
			var rowData = this.getRowData(operation.rowIndex);
			if (rowData[this.getOption('statProp')] == JSEA.Constants.STAT_ADDED) {
				this.deleteRow(operation.rowIndex, true);
			} else if (rowData[this.getOption('statProp')] == JSEA.Constants.STAT_REMOVED) {
				this.undeleteRow(operation.rowIndex);
			}
		},
		view     : function (operation) {
			Dialog.open({
				url      : operation.url,
				urlParams: operation.params,
				args     : operation.args,
			});
		}
	},
	style    : {
		inactive : function () { this.addClass('disabled').attr('disabled', true); },
		hidden   : function () { this.addClass('hidden'); },
		invisible: function () { this.addClass('invisible'); },
		gone     : function () { this.destroy().remove(); }
	}
};

/**
 * JSEA One is the root class of the component/element hierarchy.
 * Every component/element has <code>One</code> as a superclass.
 * The One object has following data:
 * guid      : the global unique id (type_longTimestamp)
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
class One { 
	constructor (type, element, options) {
		this.$init(type, element, options);
	};
}
+function ($) {
	'use strict';

	One.VERSION  = '1.0.0';

	One.DEFAULTS = {
		guid : null
	};

	One.prototype.$init = function (type, element, options) {
		this.enabled   = true;
		this.type      = type;
		this.$element  = $(element);
		this.options   = this.getOptions(options);
		
		this.$element.attr(JSEA.Constants.ATTR_CLASS, 'jsea.' + this.type);
	};

	One.prototype.$super = function () {
		var $one = null;
		if (!this.$element || !($one = this.$element.data('jsea.one'))) return(One.prototype);
		return($one);
	};

	One.prototype.init = function (type, element, options) {
		this.$init(type, element, options);

		// an instance of One for the component/element hierarchy
		this.$element.data('jsea.one', new One(type, element, this.options));
	};

	One.prototype.guid = function () {
		return(this.options.guid);
	};

	One.prototype.destroy = function () {
		this.$element.removeData('jsea.one');
	};

	One.prototype.parseAttribute = function (attrName) {
		return(JSEA.Jsons.parse(this.$element.attr(attrName)));
	};

	One.prototype.getDefaults = function () {
		return One.DEFAULTS;
	};

	One.prototype.getOptions = function (options) {
		options = $.extend(true, {}, this.getDefaults(), {
			guid : this.type + '_' + Dates.now().getTime()
		}, options);
		return options;
	};

	// ONE PLUGIN DEFINITION
	// =======================

	One.Plugin = function (option) {

		return this.each(function () { });
	}

	// ONE REUSE METHOD DEFINITION
	// =============================

	One.Plugin.prototype.guid = function () {
		var guid = null;
		this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			guid        = data.guid();
			return false;
		});
		return(guid);
	};

} (jQuery);
/**
 * JSEA Page container component
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// PAGE PUBLIC CLASS DEFINITION
	// ==============================

	var Page = function (element, options) {
		this.init('page', element, options);
	};

	Page.VERSION  = '1.0.0';

	Page.DEFAULTS = {
		root   : null,
		locale : null,
		theme  : null,
		lazy   : false
	};

	Page.prototype.init = function (type, element, options) {
		this.type      = type;
		this.$element  = $(element);
		this.options   = this.getOptions(options);
		this.facade    = undefined, // the current registered $form$
		this.forms     = {};        // {key : form guid, value : { url, mode }}
		this.regForms  = {};        // {key : funcname,  value : { formid : $form$ }} registered forms
		this.tools     = new ArrayList(); // tools in Toolbar
		this.funcs     = {};
		this.events    = {};
		this.methods   = {};
		this.rules     = {};
		var $this      = this;

		// initialize a singleton PageContext first
		$this.initPageContext();
		// initialize a singleton ViewResolver and ThemeResolver then
		$this.initViewResolver();
		$this.initThemeResolver();
		// then initialize others with an ajax request
		$.ajax({
			url: JSEA.getPageContext().resolveUrl('jsea/init'),
			method: 'post',
			dataType: 'json',
			data: null,
			beforeSend: function () {
				$this.$element.waiting({ fixed : true });
			},
			success: function (result) {
				// initializing the base stuff
				$this.initConstants(result);
				$this.initBundle(result.i18nMessages);
				$this.initEvents();
				$this.initFormats(result.FORMATS);
				$this.initMessagebar();
				$this.initMenubar();
				$this.initNavbar();
				$this.initToolbar();
				$this.$element.trigger('init');
				// loading page content
				if ($this.options.lazy) {
					$this.initLazyPage();
				} else {
					$this.initFormPage({ mode : 'redirect', url : location.pathname });
				}
				$this.$element.waiting('hide');
			}, 
			error: function (xhr) {
				$this.$element.waiting('hide');
			}
		});
	};

	Page.prototype.initPageContext = function () {
		JSEA.pageContext = new PageContext({
			root  : this.options.root,
			locale: this.options.locale
		});
	};

	Page.prototype.initViewResolver = function () {
		this.viewResolver = new ViewResolver({ });
	};

	Page.prototype.initThemeResolver = function () {
		this.themeResolver = new ThemeResolver();
		// apply the current theme
		this.applyTheme();
	};

	Page.prototype.initConstants = function (result) {
		JSEA.Constants.APP_PROPERTIES = $.extend({}, result.APP_PROPERTIES);
		JSEA.Constants.OPTIONS        = $.extend(true, {}, JSEA.Constants.OPTIONS, result.OPTIONS);
		JSEA.Constants.CURRENCIES     = result.CURRENCIES || JSEA.Constants.CURRENCIES;
	};

	Page.prototype.initBundle = function (i18nMessages) {
		Bundle.getBundle(this.options.locale).load(i18nMessages);
	};

	Page.prototype.initEvents = function () {
		var $this = this;
		this.$element.on("navigate.jsea", function (event, callback) {
			if ($this.facade && $this.facade.isModifiable) {
				if ($this.facade.isModifiable() && $this.facade.ifModified()) {
					var navigation = $this.facade.resolveNavigation(callback);
					Confirm.request(navigation.message, navigation.okAction, navigation.cancelAction, navigation.extAction);
					return false;
				}
			}
			callback.action != null ? callback.action() : callback();
			return true;
		});

		this.$element.on("formregistered.jsea", function (event, formEntry) {
			var funcname = formEntry.funcname,
				formid   = formEntry.id,
				$form$   = formEntry.value;
			$this.regForms[funcname] = $this.regForms[funcname] || {};
			$this.regForms[funcname][formid] = $form$;
			$this.facade = $form$;
			var url  = formEntry.url;
			if (url != null) {
				var state = {};
				if (history.pushState != null) history.pushState(state, null, url);
			}
			// mount this funcname for the current $form$
			$this.mountFunc(funcname);
			return false;
		});

		this.$element.on("formwithdrew.jsea", function (event, formEntry) {
			var funcname = formEntry.funcname,
				formid   = formEntry.id;
			var $form$ = ($this.regForms[funcname]) ? $this.regForms[funcname][formid] : null;
			if ($form$ == null) return false;
			var url    = $form$.url();
			if (url   != null) {
				history.back();
			}
			delete $this.regForms[funcname][formid];
			delete $this.facade;
			// re-mount the funcname for the previous $form$
			var $prev$;
			(($this.facade = $prev$ = $form$.former()) !== undefined) && $this.mountFunc($prev$.funcname());
			return false;
		});
	};

	Page.prototype.initFormats = function (FORMATS) {
		$.extend(JSEA.Constants.FORMATS, FORMATS ? FORMATS : {});
	};

	Page.prototype.initMessagebar = function () {
		// a singleton of Messagebar Plugin for single message
		JSEA.Messagebar = $("#appMessagebar").messagebar();
	};

	Page.prototype.initMenubar = function () {
		INIT_MENUBAR();
	};

	Page.prototype.initNavbar = function () {
		// a singleton of Navbar Plugin
		JSEA.Navbar = $("#appNavbar").navbar();
	};

	Page.prototype.initToolbar = function () {
		// a singleton of Toolbar Plugin
		JSEA.Toolbar = $("#appToolbar").toolbar();
		if (this.tools.size() > 0) {
			for (var i = 0; i < this.tools.size(); i ++) {
				JSEA.Toolbar.add(this.tools.get(i));
			}
		}
	};

	Page.prototype.initLazyPage = function () {
		this.umountFuncs();
		JSEA.objectize(this.$element);
	};

	Page.prototype.initFormPage = function (options) {
		// unmount all <code>Func</code>s first
		this.umountFuncs();
		// load all forms from this request
		this.loadForms($(document.forms), options, null);
	};

	Page.prototype.registerTool = function (options) {
		this.tools.add(options);
		if (JSEA.Toolbar) JSEA.Toolbar.add(options);
	};

	Page.prototype.loadForms = function ($forms, moreOptions, callback) {
		var $this = this;
		// load javascript of this main form if needed
		// afterwards, mount Func of this funcname and objectize all forms
		var $form0 = $($forms[0]);
		if ($form0.length == 0) return;
		var funcname = $form0.attr(JSEA.Constants.ATTR_FUNCNAME);
		var fn = function () {
			$this.objectizeForms($forms, moreOptions, callback);
		};
		if (funcname) {
			var script = $form0.attr(JSEA.Constants.ATTR_SCRIPT);
			if (script) {
				if (script == 'true') {
					var basename = $form0.attr(JSEA.Constants.ATTR_BASENAME);
					script = JSEA.getAppProperty('RESOURCES_PATH') + ((basename) ? (basename + '/') : '') + funcname + '/' + funcname + '.js';
				}
				JSEA.loadScript(script, fn);
				return;
			}
		}
		fn();
	};

	Page.prototype.objectizeForms = function ($forms, moreOptions, callback) {
		if ($forms.length > 0) {
			for (var i = 0; i < $forms.length; i++) {
				var $form = $($forms[i]);
				var formType = $form.attr(JSEA.Constants.ATTR_FORM_TYPE);
				if (formType) {
					var formInfo = { url : moreOptions.url, mode : moreOptions.mode };
					delete moreOptions.mode;
					var $form$ = $form[formType + 'form'](moreOptions);
					this.forms[$form$.guid()] = formInfo;
				}
			}
			if ($.isFunction(callback)) callback();
		}
	};

	Page.prototype.umountFuncs = function () {
		for (var funcname in this.funcs) {
			delete this.methods[funcname];
			delete this.rules[funcname];
			delete this.funcs[funcname];
			delete window[funcname.capitalize()];
		}
		if (this.funcname) {
			delete this.funcname;
		}
	};

	Page.prototype.mountFunc = function (funcname) {
		this.funcname = funcname;
		if (funcname in this.funcs) return;
		this.funcs[funcname] = true;
		// events of this <code>Func</code>
		var funcEvents   = $.extend(true, {}, JSEA.Events, JSEA.getFuncEvents(funcname));
		this.events[funcname] = funcEvents;
		// methods of this <code>Func</code>
		var styleMethods = $.extend(true, {}, JSEA.Methods.style, JSEA.getFuncMethods('style', funcname));
		var gridMethods  = $.extend(true, {}, JSEA.Methods.grid,  JSEA.getFuncMethods('grid', funcname));
		this.methods[funcname] = { style : styleMethods, grid : gridMethods };
		// rules of this <code>Func</code>
		var dataRules   = $.extend(true, {}, JSEA.Rules.data,   JSEA.getFuncRules('data', funcname));
		var validRules  = $.extend(true, {}, JSEA.Rules.valid,  JSEA.getFuncRules('valid', funcname));
		var formatRules = $.extend(true, {}, JSEA.Rules.format, JSEA.getFuncRules('format', funcname));
		this.rules[funcname] = { data : dataRules, valid : validRules, format : formatRules };
	};

	Page.prototype.findEvent = function (name) {
		var events;
		if (this.funcname !== undefined)
			events = this.events[this.funcname];
		else 
			events = JSEA.Events;
		var method;
		for (var evtype in events) {
			method = events[evtype][name];
			if (method) return(method);
		}
		return(null);
	};

	Page.prototype.findMethod = function (type, name) {
		var methods;
		if (this.funcname !== undefined && type in this.methods[this.funcname])
			methods = this.methods[this.funcname][type];
		else 
			methods = JSEA.Methods[type];
		return (name === undefined) ? methods : methods[name];
	};

	Page.prototype.findRule = function (type, name) {
		var rules;
		if (this.funcname !== undefined && type in this.rules[this.funcname])
			rules = this.rules[this.funcname][type];
		else 
			rules = JSEA.Rules[type];
		return (name === undefined) ? rules : JSEA.Jsons.formatProperty(rules, name);
	};

	Page.prototype.perform = function (action) {
		var url  = action.url;
		var mode = action.mode;
		this[mode](url);
	};

	Page.prototype.forward = function (url) {
		var $this = this;
		// before move to another one, release all registered forms first
		for (var funcname in $this.regForms) {
			for (var formid in $this.regForms[funcname]) {
				var $form$ = $this.regForms[funcname][formid];
				$form$.release();
			}
		}
		$.ajax({
			url: JSEA.getPageContext().resolveUrl(url),
			data: null,
			method: 'POST',
			dataType: "html",
			xhr: function () {
				var xhr = $.ajaxSettings.xhr();
				xhr.onprogress = function (evt) {
					if (evt.lengthComputable) {
						var percent = Math.floor(evt.loaded / evt.total * 100);
						$this.$progressbar.progressbar("setValue", percent);
					}
				};
				xhr.onloadstart = function (evt) {
					if (!$this.$progressbar) {
						$this.$progressbar = $(document.createElement("div")).progressbar();
						$this.$element.prepend($this.$progressbar);
					}
					$this.$progressbar.progressbar("setValue", 0).addClass('visible');
				}
				xhr.onloadend = function (evt) {
					if (!!$this.$progressbar) {
						setTimeout(function () {
							if (!!$this.$progressbar) $this.$progressbar.removeClass('visible').progressbar("setValue", 0);
						}, 400);
					}
				}
				return xhr;
			},
			beforeSend: function (xhr) {
				$this.$element.waiting();
			},
			success: function (data) {
				$('.body-wrapper').empty();
				var $that = $(data).appendTo($('.body-wrapper'));
				$this.initFormPage({ mode : 'forward', url : JSEA.getPageContext().resolveUrl(url) });
				$this.$element.waiting('hide');
			},
			error: function (xhr) {
				Dialog.open({ html : xhr.responseText });
				$this.$element.waiting('hide');
			}
		});
	};

	Page.prototype.redirect = function (url) {
		location.href = JSEA.getPageContext().resolveUrl(url);
	};

	Page.prototype.reload = function ($form$) {
		var action = this.forms[$form$.guid()];
		if (action != null) { this.perform(action); }
	};

	Page.prototype.viewVia = function (viewport) {
		return this.viewResolver.via(viewport);
	};

	Page.prototype.applyTheme = function (theme) {
		if (theme !== undefined) this.options.theme = theme;
		this.themeResolver.apply(this.options.theme);
	};

	Page.prototype.on = function (evtype, callback) {
		this.$element.on(evtype, callback);
	};

	Page.prototype.getDefaults = function () {
		return Page.DEFAULTS;
	};

	Page.prototype.getOptions = function (options) {
		var pageOptions = JSEA.Jsons.parse(this.$element.attr(JSEA.Constants.ATTR_PAGE_OPTIONS));
	
		options = $.extend({}, this.getDefaults(), pageOptions, options);
		
		return options;
	};

	// PAGE PLUGIN DEFINITION
	// ========================

	function Plugin(option) {
		var self = this;

		// PAGE PUBLIC METHOD DEFINITION
		// ===============================
		
		self.currentForm = function () {
			var $form$ = null;
			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.page');
				$form$ = data.facade;
			});
			return($form$);
		};

		self.mount = function (funcname) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.page');
				data.mountFunc(funcname);
			});
		};

		self.perform = function (action) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.page');
				data.perform(action);
			});
		};

		self.reload = function ($form$) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.page');
				data.reload($form$);
			});
		};

		self.formize = function ($form, moreOptions, callback) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.page');
				data.loadForms($form, moreOptions, callback);
			});
		};

		self.toolize = function (toolOptions) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.page');
				data.registerTool(toolOptions);
			});
		};

		self.Event = function (name) {
			var method = null;
			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.page');
				method = data.findEvent(name);
				return false;
			});
			return method;
		};

		self.Method = function (type, name) {
			var method = null;
			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.page');
				method = data.findMethod(type, name);
				return false;
			});
			return method;
		};

		self.Rule = function (type, name) {
			var rule = null;
			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.page');
				rule = data.findRule(type, name);
				return false;
			});
			return rule;
		};

		self.DataRule = function (name) {
			var rule = null;
			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.page');
				rule = data.findRule('data', name);
				return false;
			});
			return rule;
		};

		self.viewVia = function (viewport) {
			var result = false;
			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.page');
				result      = data.viewVia(viewport);
				return false;
			});
			return result;
		};

		self.changeTheme = function (themeName) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.page');
				data.applyTheme(themeName);
			});
		};

		self.on = function (evtype, callback) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.page');
				data.on(evtype, callback);
			});
		};

		return this.each(function () {
			var $this   = $(this);
			
			var data    = $this.data('jsea.page');
			var options = typeof option == 'object' && option;

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.page', (data = new Page(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.page;

	$.fn.page             = Plugin;
	$.fn.page.Constructor = Page;

	// PAGE NO CONFLICT
	// ==================

	$.fn.page.noConflict = function () {
		$.fn.page = old;
		return this;
	};

	/**
	 * JSEA Page context object.
	 * The PageContext object has the following data:
	 * root   : context root path
	 * locale : current locale name
	 * 
	 * @author Aranjuez
	 * @version Dec 01, 2009
	 * @since Pyrube-JSEA 1.0
	 */
	var PageContext = function (options) {
		this.root   = options.root;
		this.locale = options.locale;
	};

	/**
	 * return the current locale name
	 * @returns
	 */
	PageContext.prototype.getLocale = function () {
		return this.locale;
	};

	/**
	 * resolve url
	 * @param url original url
	 * @param params parameter data
	 * @returns
	 */
	PageContext.prototype.resolveUrl = function (url, params) {
		url = JSEA.substitute(url, params);
		return(url.startsWith(this.root) ? url : this.root + url);
	};

	/**
	 * JSEA View resolver object.
	 * The ViewResolver object has the following data:
	 * viewport : determined with window size(instead of device), such as mobile, tablet, laptop, etc
	 * 
	 * @author Aranjuez
	 * @version Dec 01, 2009
	 * @since Pyrube-JSEA 1.0
	 */
	var ViewResolver = function (options) {
		this.viewport = null;
		this.init(options);
	};

	/**
	 * initialize view resolver
	 * @returns
	 */
	ViewResolver.prototype.init = function (options) {
		var $this = this;
		//
		this.determine();
		// events
		$(window).on('resize.jsea', function () {
			$this.determine();
		});
	};

	/**
	 * determine viewport
	 */
	ViewResolver.prototype.determine = function () {
		var winWidth = $(window).width();
		if (winWidth <= 767) {
			this.viewport = 'mobile';
		} else if (winWidth >= 768 && winWidth < 1024) {
			this.viewport = 'tablet';
		} else {
			this.viewport = 'laptop';
		}
	};
	
	/**
	 * which viewport it is
	 * @returns boolean
	 */
	ViewResolver.prototype.via = function (viewport) {
		return (this.viewport == viewport);
	};

	/**
	 * JSEA Theme resolver object.
	 * The ThemeResolver object has the following data:
	 * 
	 * @author Aranjuez
	 * @version Oct 01, 2023
	 * @since Pyrube-JSEA 1.1
	 */
	var ThemeResolver = function () {
		this.init();
	};

	/**
	 * initialize theme resolver
	 */
	ThemeResolver.prototype.init = function () { };

	/**
	 * apply the given theme
	 * @param theme
	 */
	ThemeResolver.prototype.apply = function (theme) {
		// set attribute 'data-theme' of HTML element
		document.documentElement.setAttribute('data-theme', theme);
		// meta theme color
		var themeColor = window.getComputedStyle(document.documentElement).getPropertyValue('--theme-color');
		document.querySelector('meta[name="theme-color"]').setAttribute('content', themeColor);
	};

} (jQuery);
$(function () {
	// Global singleton of Page Plugin
	window.Page = $('*[' + JSEA.Constants.ATTR_PAGE_OPTIONS + ']').page();
	// re-locate the following singletons on 'init' event
	window.Page.on('init.jsea', function () {
		window.Page.Messagebar = JSEA.Messagebar;
		window.Page.Toolbar    = JSEA.Toolbar;
	});
});