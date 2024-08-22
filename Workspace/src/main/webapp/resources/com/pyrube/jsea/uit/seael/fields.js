/**
 * @(#) Project: Pyrube JSEA
 * 
 * 
 * Website: http://www.pyrube.com
 * Email: customercare@pyrube.com
 * Copyright Pyrube 2009. All rights reserved.
 */

/**
 * JSEA Field element as base class
 * The Field object has following data:
 * robustness : the robustness to verify (array)
 * hasTrigger : indicate whether this field has a trigger, default is false (boolean)
 * triggerId  : element id for trigger if hasTrigger is true (string)
 * visible    : indicate whether this field is visible, default is true (boolean)
 * readonly   : indicate whether this field is readonly, default is false (boolean)
 * emptiable  : indicate whether this field is emptiable, default is false (boolean)
 * help       : this field gives detailed help (string)
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// FIELD PUBLIC CLASS EXTENDS ONE
	// ================================

	class Field extends One { 
		constructor (type, element, options) {
			super(type, element, options);
		};
	}

	Field.VERSION  = '1.0.0';

	Field.DEFAULTS = $.extend({}, One.DEFAULTS, {
		robustness : null,
		hasTrigger : false,
		triggerId  : null,
		hasTrigger2: false,
		trigger2Id : null,
		visible    : true,
		readonly   : false,
		emptiable  : false,
		help       : null
	});

	Field.prototype.init = function (type, element, options) {
		this.$super().init(type, element, options);
		this.type      = type;
		this.$element  = $(element);
		this.options   = this.getOptions(options);
		this.$input    = null; // this is for text display, and $element is hidden for value
		this.$panel    = null; // panel for special fields
		this.$last     = this.$element;
		this.$tippor   = this.$element; // tip-box to show up

		// check if this field is robust
		if (!JSEA.ifRobust.apply(this, [])) return;

		// initialize this field
		this.initField();

		// initialize trigger of this field
		if (this.options.hasTrigger) {
			this.$trigger = (this.options.triggerId) 
							? $('#' + this.options.triggerId) 
								: IconBuilder.build({name : 'trigger'}).insertAfter(this.$last);
			this.initTrigger();
		}
		// initialize trigger-2 of this field
		if (this.options.hasTrigger2) {
			this.$trigger2 = (this.options.trigger2Id) 
							? $('#' + this.options.trigger2Id) 
								: IconBuilder.build({name : 'trigger2'}).insertAfter(this.$last);
			this.initTrigger2();
		}

		// initialize empty of this field
		this.initEmpty();
		// initialize help of this field
		this.initHelp();
		// initialize default events of this field
		this.initDefaultEvents();
		// initialize events of this field
		this.initEvents();
		// make this field disabled/not disabled
		this.setDisabled(this.isDisabled());
		// make this field visible/invisible
		this.setVisible(this.options.visible);
	};

	Field.prototype.initField = function () { };

	Field.prototype.initEmpty = function () {
		var $this = this;
		if (this.options.emptiable) {
			this.$empty = IconBuilder.build({ 
				name : 'empty',
				title : 'icon.alt.empty-field',
				method : function () { $this.emptyField(); }
			}).hide();
			this.$last.after(this.$empty);
		}
	};

	Field.prototype.initHelp = function () {
		if (this.options.help) {
			this.$last.after(
				IconBuilder.build({ 
					name : 'help',
					tooltips : this.options.help
				})
			);
		}
	};

	Field.prototype.initDefaultEvents = function () {
		var $this = this;
		// uppercase/lowercase events of this field
		if (this.$element.hasClass('uppercase')) {
			// auto change to upper case
			this.$element.on('keydown.field', function (event) {
				if (event.keyCode == 13) $this.$element.val($this.$element.val().toUpperCase());
			});
			this.$element.on('blur.field', function () {
				$this.$element.val($this.$element.val().toUpperCase());
			});
		} else if (this.$element.hasClass('lowercase')) {
			// auto change to lower case
			this.$element.on('keydown.field', function (event) {
				if (event.keyCode == 13) $this.$element.val($this.$element.val().toLowerCase());
			});
			this.$element.on('blur.field', function () {
				$this.$element.val($this.$element.val().toLowerCase());
			});
		}
		// empty events of this field
		if (this.options.emptiable) {
			this.$element.closest('li.element')
				.on('mouseover.jsea', function () {
					if ($this.$element.val()) {
						$this.$empty.show();
					}
				}).on('mouseout.jsea', function () {
					$this.$empty.hide();
				});
		}
		// format events of this field
		var format = this.$element.attr('format');
		if (format != null) {
			var ccyCode    = null;
			var id         = this.$element.attr('id');
			var ccyFieldId = this.$element.attr('ccyProp');
			if (ccyFieldId != null) {
				if ($("#" + ccyFieldId).size() > 0) {
					ccyCode = $("#" + ccyFieldId).val();
					$("#" + ccyFieldId)
						.unbind('change.format' + id.capitalize())
						.bind('change.format' + id.capitalize(), function () {
							ccyCode = this.value;
							$this.$element.triggerHandler('currencychange', [ccyCode]);
						});
				}
				this.$element
					.unbind('currencychange.formt')
					.bind('currencychange.format', function (event, ccyCode) {
						Numbers.groupField($this.$element, ccyCode);
					});
			}
			this.$element
				.unbind('blur.format')
				.bind('blur.format', function () {
					var blurFormatter = Page.Rule('format')['blur'][format]
					if ($.isFunction(blurFormatter)) blurFormatter($this.$element, format, ccyCode);
				});
			this.$element
				.unbind('focus.format')
				.bind('focus.format', function () {
					var focusFormatter = Page.Rule('format')['focus'][format];
					if ($.isFunction(focusFormatter)) focusFormatter($this.$element, format, ccyCode);
				});
		}
	};

	Field.prototype.initEvents = function () { };

	Field.prototype.emptyField = function () {
		this.$empty.hide();
		this.$element.val('');
		if ($.isFunction(this.emptyConcrete)) {
			this.emptyConcrete();
		}
		var fnEmpty = this.options.onEmpty;
		if ($.isFunction(fnEmpty)) {
			fnEmpty.apply(this.$element.data('jsea.plugin'), []);
		}
		this.$element.trigger('empty');
		this.$element.trigger('change');
	};

	Field.prototype.setRequired = function (bRequired) {
		var $wrapper = this.$element.closest('li.element');
		if ($wrapper.size() > 0) {
			if (bRequired) {
				$wrapper.addClass('required');
				$wrapper.find('>label:first').addClass('required');
			} else {
				$wrapper.removeClass('required');
				$wrapper.find('>label:first').removeClass('required');
			}
		}
	};

	Field.prototype.setVisible = function (bVisible) {
		var $wrapper = this.$element.closest('li.element');
		(bVisible) ? $wrapper.show() : $wrapper.hide();
	};

	Field.prototype.setDisabled = function (bDisabled) {
		var $items = [this.$element];
		if (this.$input) $items.push(this.$input);
		if (this.$panel) $items.push(this.$panel);
		if (this.options.hasTrigger) $items.push(this.$trigger);
		if (this.options.hasTrigger2) $items.push(this.$trigger2);
		for (var $item of $items) {
			if (bDisabled) {
				$item.attr('disabled', true);
				$item.addClass('disabled');
			} else {
				$item.removeAttr('disabled');
				$item.removeClass('disabled');
			}
		}
	};

	Field.prototype.isDisabled = function () {
		return !!this.$element.attr('disabled');
	};

	Field.prototype.destroy = function () {
		this.destroy0();
	};

	Field.prototype.destroy0 = function () {
		if (this.options.hasTrigger) {
			this.$trigger.off('click');
			this.$trigger = null;
		}
		if (this.options.hasTrigger2) {
			this.$trigger2.off('click');
			this.$trigger2 = null;
		}
		this.$element.off()
			.removeData(this.$element.attr(JSEA.Constants.ATTR_CLASS))
			.removeData('jsea.plugin');
		// destroy One at last
		this.$super().destroy();
	};

	Field.prototype.getDefaults = function () {
		return Field.DEFAULTS;
	};

	Field.prototype.getOptions = function (options) {
		options = $.extend({}, this.getDefaults(), this.$element.data(), options);
		
		return options;
	};

	// FIELD PLUGIN DEFINITION
	// =========================

	function Plugin(option) {
		return this.each(function () {
			var $this   = $(this);

			var data    = $this.data('jsea.field');
			var options = typeof option == 'object' && option;

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.field', (data = new Field(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	// FIELD REUSE METHOD DEFINITION
	// ===============================

	Plugin.prototype = $.extend({}, One.Plugin.prototype);

	Plugin.prototype.val = function (value) {
		if (!arguments.length) {
			this.each(function () {
				var $this   = $(this);
				var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
				value       = data.getValue();
				return false;
			});
			return value;
		} 
		return this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			data.setValue(value);
		});
	};
	
	Plugin.prototype.text = function () {
		var text = null;
		this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			text        = data.getText();
			return false;
		});
		return text;
	};

	Plugin.prototype.attr = function (name, value) {
		if (value === undefined) {
			this.each(function () {
				var $this   = $(this);
				var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
				value       = data.$element.attr(name);
				return false;
			});
			return value;
		} 
		return this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			data.$element.attr(name, value);
			if (data.$input) data.$input.attr(name, value);
		});
	};

	Plugin.prototype.addClass = function (value) {
		return this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			data.$element.addClass(value);
			if (data.$input) data.$input.addClass(value);
			if (data.options.hasTrigger) data.$trigger.addClass(value);
			if (data.options.hasTrigger2) data.$trigger2.addClass(value);
			if (data.$panel) data.$panel.addClass(value);
		});
	};

	Plugin.prototype.removeClass = function (value) {
		return this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			data.$element.removeClass(value);
			if (data.$input) data.$input.removeClass(value);
			if (data.options.hasTrigger) data.$trigger.removeClass(value);
			if (data.options.hasTrigger2) data.$trigger2.removeClass(value);
			if (data.$panel) data.$panel.removeClass(value);
		});
	};

	Plugin.prototype.setRequired = function (value) {
		if (value) this.addClass('required');
		else this.removeClass('required');
		return this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			data.setRequired(value);
		});
	};

	Plugin.prototype.setVisible = function (value) {
		return this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			data.setVisible(value);
		});
	};

	Plugin.prototype.setDisabled = function (value) {
		return this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			data.setDisabled(value);
		});
	};

	Plugin.prototype.failure = function (message) {
		return this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			Tipbox.error(data.$tippor, message);
			data.$tippor.tipbox('show');
		});
	};

	Plugin.prototype.rollback = function () {
		return this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			data.$tippor.tipbox('destroy');
		});
	};

	var old = $.fn.field;

	$.fn.field             = Plugin;
	$.fn.field.Constructor = Field;

	// FIELD NO CONFLICT
	// ===================

	$.fn.field.noConflict = function () {
		$.fn.field = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Text-field element
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// FIELD.TEXT PUBLIC CLASS DEFINITION
	// ====================================

	var Textfield = function (element, options) {
		this.init('field.text', element, options);
	};

	Textfield.VERSION = '1.0.0';

	Textfield.DEFAULTS = $.extend({}, $.fn.field.Constructor.DEFAULTS);

	// NOTE: FIELD.TEXT EXTENDS FIELD
	// ================================

	Textfield.prototype = $.extend({}, $.fn.field.Constructor.prototype);

	Textfield.prototype.constructor = Textfield;

	Textfield.prototype.initEvents = function () { };

	Textfield.prototype.getValue = function () {
		return this.$element.val();
	};

	Textfield.prototype.setValue = function (value) {
		this.$element.val(value);
	}

	Textfield.prototype.getDefaults = function () {
		return Textfield.DEFAULTS;
	};

	Textfield.prototype.getOptions = function (options) {
		var textfieldOptions = this.parseAttribute(JSEA.Constants.ATTR_TEXTFIELD_OPTIONS);

		options = $.extend(true, {}, this.getDefaults(), this.$super().getOptions(options), textfieldOptions, options);

		return options;
	};

	// FIELD.TEXT PLUGIN DEFINITION
	// ==============================

	function Plugin(option) {
		var self = this;

		// FIELD.TEXT PUBLIC METHOD EXTENDS FIELD
		// ========================================

		this.extend($.fn.field.prototype);

		return this.each(function () {
			var $this   = $(this);
			var plugin  = $this.data('jsea.plugin');
			var data    = $this.data('jsea.field.text');
			var options = typeof option == 'object' && option;

			if (!plugin) $this.data('jsea.plugin', self);

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.field.text', (data = new Textfield(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	// FIELD.TEXT REUSE METHOD EXTENDS FIELD
	// =======================================

	Plugin.prototype = $.extend({}, $.fn.field.prototype);

	Plugin.prototype.constructor = Plugin;

	var old = $.fn.textfield;

	$.fn.textfield             = Plugin;
	$.fn.textfield.Constructor = Textfield;

	// FIELD.TEXT NO CONFLICT
	// ========================

	$.fn.textfield.noConflict = function () {
		$.fn.textfield = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Date-field element
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 * @dependence: jQuery: jquery.datetimepicker_2.4.5.full.js
 */
+function ($) {
	'use strict';

	// FIELD.DATE PUBLIC CLASS DEFINITION
	// ====================================
	
	var Datefield = function (element, options) {
		this.init('field.date', element, options);
	};

	Datefield.VERSION = '1.0.0';

	Datefield.DEFAULTS = $.extend({}, $.fn.textfield.Constructor.DEFAULTS, {
		hasTrigger : true,
		holidayPickable : true,
		xdsoft     : {
			layInit  : true,
			timepicker : false,
			step     : 5
		}
	});

	// NOTE: FIELD.DATE EXTENDS FIELD.TEXT
	// =====================================

	Datefield.prototype = $.extend({}, $.fn.textfield.Constructor.prototype);

	Datefield.prototype.constructor = Datefield;

	Datefield.prototype.initField = function () {
		// init xdsoft calendar picker.
		this.$datetimepicker = this.$element.datetimepicker(this.options.xdsoft);
	};

	Datefield.prototype.initTrigger = function () {
		this.$last   = this.$trigger;
		this.$tippor = this.$trigger;
		this.$trigger.addClass('calendar');
		this.$trigger.addClass(!this.options.xdsoft.timepicker ? 'date' : 'datetime');
	};

	Datefield.prototype.initEvents = function () {
		// bind xdsoft open event for icon button of this date field.
		var $this = this;
		this.$trigger.on('click.jsea', function () {
			if ($this.isDisabled()) return false;
			$this.$datetimepicker.trigger('open.xdsoft');
			return false;
		});
	};

	Datefield.prototype.destroy = function () {
		if (this.$datetimepicker) {
			this.$datetimepicker.datetimepicker('destroy');
		}
		this.$datetimepicker = null;
		this.destroy0();
	};

	Datefield.prototype.getDefaults = function () {
		return Datefield.DEFAULTS;
	};

	Datefield.prototype.getOptions = function (options) {
		var datefieldOptions = this.parseAttribute(JSEA.Constants.ATTR_DATEFIELD_OPTIONS);
		
		options = $.extend(true, {}, this.getDefaults(), datefieldOptions, options);
		
		//bind holiday check related event handlers
		var $this = this;
		options.xdsoft.beforeShowDay = function () {
			return Datefield.ifHoliday.apply($this, arguments);
		};
		options.xdsoft.onShow = function () {
			Datefield.showCalendar.apply(null, arguments);
		};
		options.xdsoft.onChangeMonth = function () {
			Datefield.changeMonth.apply(null, arguments);
		};
		// and i18n message
		options.xdsoft.i18n = {en: {
				months: 
					[JSEA.localizeMessage('calendar.month.1'), JSEA.localizeMessage('calendar.month.2'), JSEA.localizeMessage('calendar.month.3'),
					JSEA.localizeMessage('calendar.month.4'), JSEA.localizeMessage('calendar.month.5'), JSEA.localizeMessage('calendar.month.6'),
					JSEA.localizeMessage('calendar.month.7'), JSEA.localizeMessage('calendar.month.8'), JSEA.localizeMessage('calendar.month.9'),
					JSEA.localizeMessage('calendar.month.10'), JSEA.localizeMessage('calendar.month.11'), JSEA.localizeMessage('calendar.month.12')],
				dayOfWeekShort: 
					[JSEA.localizeMessage('calendar.day.sun'), JSEA.localizeMessage('calendar.day.mon'), JSEA.localizeMessage('calendar.day.tue'),
					JSEA.localizeMessage('calendar.day.wed'), JSEA.localizeMessage('calendar.day.thu'), JSEA.localizeMessage('calendar.day.fri'),
					JSEA.localizeMessage('calendar.day.sat')],
				dayOfWeek: 
					[JSEA.localizeMessage('calendar.day.sunday'), JSEA.localizeMessage('calendar.day.monday'), JSEA.localizeMessage('calendar.day.tuesday'),
					JSEA.localizeMessage('calendar.day.wednesday'), JSEA.localizeMessage('calendar.day.thursday'), JSEA.localizeMessage('calendar.day.friday'),
					JSEA.localizeMessage('calendar.day.saturday')]
			}
		};
		
		//append datetime select event to xdsoft options.
		if (typeof options.onPick != undefined && options.onPick != null) {
			if (options.xdsoft.timepciker === true) {
				options.xdsoft = $.extend(options.xdsoft, {onSelectTime: options.onPick});
			} else {
				options.xdsoft = $.extend(options.xdsoft, {onSelectDate: options.onPick});
			}
		}
		
		return options;
	};

	Datefield.yearHolidays = {};

	/**
	 * Functions which will be checked will xdsoft calendar show each day. 
	 * we used this functionality to implement holiday checking.
	 * @param currentTime
	 */
	Datefield.ifHoliday = function (currentTime) {
		var thisDatefield = this;
		var year = Dates.format(currentTime, 'year');
		var date = Dates.format(currentTime, 'date');
		var holidays = Datefield.yearHolidays[year];
		if (holidays) {
			var index = $.inArray(date, holidays);
			if (index >= 0) {
				if (thisDatefield.options.holidayPickable) {
					return [true, 'holiday'];
				} else {
					return [false, 'holiday'];
				}
			}
		}
		return null;
	};

	/**
	 * obtain holidays in current year of this date field
	 * it seems something is wrong with onGenerate (it is invoked even when month changes)
	 * @param currentTime
	 */
	Datefield.showCalendar = function (currentTime) {
		var year = Dates.format(currentTime, 'year');
		Datefield.obtainHolidays(year);
	};

	/**
	 * to be invoked when month changes
	 * instead of changeYear (it cannot be invoked when year changes with prev/next month icon)
	 * @param currentTime
	 */
	Datefield.changeMonth = function (currentTime) {
		var year = Dates.format(currentTime, 'year');
		Datefield.obtainHolidays(year);
	};

	/**
	 * check to see whether the year holidays has already exist in the global array, otherwise to get it from backend.
	 * @param year
	 */
	Datefield.obtainHolidays = function (year) {
		if (Datefield.yearHolidays[year] === undefined) {
			$.ajax({
				url: JSEA.getPageContext().resolveUrl('jsea/holiday/' + year),
				method: 'post',
				dataType: 'json',
				async: false,
				success: function (holidays) {
					for (var i = 0; i < holidays.length; i++) {
						holidays[i] = Dates.format(new Date(holidays[i]), 'date');
					}
					Datefield.yearHolidays[year] = holidays;
				}
			});
		}
	};

	// FIELD.DATE PLUGIN DEFINITION
	// ==============================

	function Plugin(option) {
		var self = this;

		// FIELD.DATE PUBLIC METHOD EXTENDS FIELD.TEXT
		// =============================================

		this.extend($.fn.textfield.prototype);

		return this.each(function () {
			var $this   = $(this);
			var plugin  = $this.data('jsea.plugin');
			var data    = $this.data('jsea.field.date');
			var options = typeof option == 'object' && option;

			if (!plugin) $this.data('jsea.plugin', self);

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.field.date', (data = new Datefield(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.datefield;

	$.fn.datefield             = Plugin;
	$.fn.datefield.Constructor = Datefield;

	// FIELD.DATE NO CONFLICT
	// ========================

	$.fn.datefield.noConflict = function () {
		$.fn.datefield = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Lookup field element
 * 
 * @author Aranjuez
 * @version Oct 01, 2023
 * @since Pyrube-JSEA 1.1
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// FIELD.LOOKUP PUBLIC CLASS DEFINITION
	// ======================================

	var Lookup = function (element, options) {
		this.init('field.lookup', element, options);
	};

	Lookup.VERSION = '1.1.0';

	Lookup.DEFAULTS = $.extend({}, $.fn.textfield.Constructor.DEFAULTS, {
		robustness   : ['url'],
		hasTrigger   : true,
		url          : '',
		urlParams    : null,
		args         : null,
		cascades     : null,
		onChoose     : null
	});

	// NOTE: FIELD.LOOKUP EXTENDS FIELD.TEXT
	// =======================================

	Lookup.prototype = $.extend({}, $.fn.textfield.Constructor.prototype);

	Lookup.prototype.constructor = Lookup;

	Lookup.prototype.initTrigger = function () {
		this.$last   = this.$trigger;
		this.$tippor = this.$trigger;
		this.$trigger.addClass('lookup');
	};

	Lookup.prototype.initEvents = function () {
		// bind lookup open event for icon button of this lookup field.
		var $this = this;
		this.$trigger.on('click', function () {
			if ($this.isDisabled()) return false;
			var url = $this.options.url;
			if (url.indexOf("/") == 0) { url = url.substring(1, url.length); }
			window.Lookup.open({
				url          : url,
				urlParams    : $this.options.urlParams,
				args         : $this.options.args,
				cascades     : $this.options.cascades,
				complete     : $.proxy($this.processData, $this)
			});
			return false;
		});
	};

	Lookup.prototype.processData = function (data) {
		var $context = this.$element.closest('form');
		// data is json {sampleCode:'001',sampleName:'NAME OF 001'}
		// or array of json [{sampleCode:'001',sampleName:'NAME OF 001'},{sampleCode:'002',sampleName:'NAME OF 002'}]
		var array = data;
		if(!$.isArray(array)) array = [data];
		for (var cascade of this.options.cascades) {
			var fieldName = cascade;
			var propName  = cascade;
			if (cascade.indexOf("=") != -1) {
				var fieldProp = cascade.split("=");
				fieldName = fieldProp[0];
				propName  = fieldProp[1];
			}
			var fieldValue = '';
			for (var i = 0; i < array.length; i++) {
				if (i > 0) fieldValue += ',';
				fieldValue += JSEA.Jsons.formatProperty(array[i], propName);
			}
			JSEA.value($context, fieldName, fieldValue);
		}
		var fnChoose = this.options.onChoose;
		if ($.isFunction(fnChoose)) {
			fnChoose.apply(this.$element.data('jsea.plugin'), [data]);
		}
		this.$element.trigger('choose');
	};

	Lookup.prototype.emptyConcrete = function () {
		var $context = this.$element.closest('form');
		for (var cascade of this.options.cascades) {
			var fieldName = cascade;
			if (cascade.indexOf("=") != -1) {
				var fieldProp = cascade.split("=");
				fieldName = fieldProp[0];
			}
			JSEA.value($context, fieldName, '');
		}
	};

	Lookup.prototype.setUrlParams = function (urlParams) {
		this.options.urlParams = urlParams;
	};

	Lookup.prototype.getDefaults = function () {
		return Lookup.DEFAULTS;
	};

	Lookup.prototype.getOptions = function (options) {
		var lookupOptions = this.parseAttribute(JSEA.Constants.ATTR_LOOKUP_OPTIONS);

		options = $.extend(true, {}, this.getDefaults(), lookupOptions, options);

		return options;
	};

	// FIELD.LOOKUP PLUGIN DEFINITION
	// ================================

	function Plugin(option) {
		var self = this;

		// FIELD.LOOKUP PUBLIC METHOD EXTENDS FIELD.TEXT
		// ===============================================

		this.extend($.fn.textfield.prototype);

		// FIELD.LOOKUP PUBLIC METHOD DEFINITION
		// =======================================

		self.setUrlParams = function (urlParams) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.field.lookup');
				data.setUrlParams(urlParams);
			});
		};

		return this.each(function () {
			var $this   = $(this);
			var plugin  = $this.data('jsea.plugin');
			var data    = $this.data('jsea.field.lookup');
			var options = typeof option == 'object' && option;

			if (!plugin) $this.data('jsea.plugin', self);

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.field.lookup', (data = new Lookup(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.lookup;

	$.fn.lookup             = Plugin;
	$.fn.lookup.Constructor = Lookup;


	// FIELD.LOOKUP NO CONFLICT
	// ========================

	$.fn.lookup.noConflict = function () {
		$.fn.lookup = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Upload field element
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// FIELD.UPLOAD PUBLIC CLASS DEFINITION
	// ======================================
	
	var Upload = function (element, options) {
		this.init('field.upload', element, options);
	};

	Upload.VERSION = '1.0.0';

	Upload.DEFAULTS = $.extend({}, $.fn.textfield.Constructor.DEFAULTS, {
		// instant : ajax upload instantly once a file was chosen
		// manual  : ajax upload manually by clicking 'Upload' icon
		// posting : form submit
		mode            : 'posting',
		uploadFile      : 'uploadFile',
		hasTrigger      : true,
		hasTrigger2     : false,
		mimes           : [],
		progressbarId   : null,
		onSuccess       : null
	});

	Upload.ACCEPT_TYPES = {
		doc           : ['application/msword'],
		docx          : ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
		pdf           : ['application/pdf'],
		ppt           : ['application/vnd.ms-powerpoint'],
		pptx          : ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
		xml           : ['application/xml', 'text/xml'],
		xls           : ['application/vnd.ms-excel'],
		xlsx          : ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
		gif           : ['image/gif'],
		jpg           : ['image/jpeg'],
		jpeg          : ['image/jpeg'],
		png           : ['image/png'],
		tif           : ['image/tiff'],
		tiff          : ['image/tiff'],
		csv           : ['text/csv'],
		htm           : ['text/html'],
		html          : ['text/html'],
		txt           : ['text/plain']
	};

	// NOTE: FIELD.UPLOAD EXTENDS FIELD.TEXT
	// =======================================

	Upload.prototype = $.extend({}, $.fn.textfield.Constructor.prototype);

	Upload.prototype.constructor = Upload;

	Upload.prototype.initField = function () {
		this.$wrapper = this.$element.closest('li');
		//init uploadFile and uploadFilePathname.
		this.$input
			= this.$element.clone()
				.removeAttr('id').removeAttr('name')
				.removeAttr(JSEA.Constants.ATTR_CLASS)
				.removeAttr(JSEA.Constants.ATTR_UPLOAD_OPTIONS)
				.removeAttr(JSEA.Constants.ATTR_VALID_TYPE).removeAttr(JSEA.Constants.ATTR_VALID_RULES)
				.removeClass('upload-value')
				.addClass('browser')
				.attr('readonly', true)
				.insertAfter(this.$element);
		this.$uploadFile 
			= $(document.createElement('INPUT'))
				.attr('type', 'file')
				.attr('id', this.options.uploadFile)
				.attr('name', this.options.uploadFile)
				.addClass('uploader')
				.attr('disabled', true)
				.attr('accept', Upload.acceptMimes(this.options.mimes).join(','))
				.insertAfter(this.$element);
		this.$element.hide();
		if (this.options.mode == 'manual') {
			this.options.hasTrigger2 = true;
		}
		// initialize a progress-bar if ajax upload needed
		if (['instant', 'manual'].includes(this.options.mode)) this.initProgressbar();
	};

	Upload.prototype.initTrigger = function () {
		this.$last   = this.$trigger;
		this.$tippor = this.$trigger;
		this.$trigger.addClass('browse');
	};

	Upload.prototype.initTrigger2 = function () {
		this.$last   = this.$trigger2;
		this.$trigger2.addClass('upload');
	};

	Upload.prototype.initEvents = function () {
		var $this = this;
		this.$trigger.on('click.jsea', function () {
			if ($this.isDisabled()) return false;
			// if no file is chosen, make input.file disabled
			var disabled = !!$this.$uploadFile.attr('disabled');
			if (disabled) $this.$uploadFile.removeAttr('disabled');
			$this.$uploadFile.trigger('click');
			if (disabled ) $this.$uploadFile.attr('disabled', true);
		});
		if (this.options.mode == 'manual') {
			this.$trigger2.on('click.jsea', function () {
				if ($this.$element.triggerHandler('upload') !== false) {
					$this.ajaxUpload();
				}
				return false;
			});
		}
		this.$uploadFile.on("change.jsea", function () {
			var fileName = $(this).val().trim();
			(fileName == '') ? $this.$uploadFile.attr('disabled', true) : $this.$uploadFile.removeAttr('disabled');
			fileName = fileName.substring(fileName.lastIndexOf("\\") + 1);
			$this.$input.val(fileName);
			if (['instant', 'manual'].includes($this.options.mode)) {
				$this.$progressbar.progressbar("setValue", 0);
				$this.$progressbar.removeClass('visible');
			}
			if ($this.options.mode == 'instant' && fileName != '') {
				$this.ajaxUpload();
			}
		});
	};

	Upload.prototype.initProgressbar = function () {
		this.$progressbar = $("#" + this.options.progressbarId, this.$wrapper);
		if (this.$progressbar.length == 0) {
			this.$input.parent().css({ position : 'relative' });
			var position = this.$input.position();
			this.$progressbar = $(document.createElement("div")).attr("id",
					this.options.progressbarId).css({
				position : 'absolute',
				'z-index' : 1,
				height : '3px',
				width : this.$element.outerWidth(),
				top : (position.top + this.$input.outerHeight() - 3) + 'px',
				left : position.left + 'px'
			}).insertAfter(this.$element);
		}
		this.$progressbar.progressbar();
		this.$progressbar.progressbar("setValue", 0);
	};

	Upload.prototype.ajaxUpload = function () {
		// check if validation is needed first
		if (this.$input.val() == '') {
			Message.info('message.info.file-not-chosen');
			return;
		}
		var $this = this;
		var obtainProgress = function () {
			$.ajax({
				url : JSEA.getPageContext().resolveUrl('jsea/upload/progress'),
				method : 'POST',
				success : function (data) {
					$this.$progressbar.progressbar("setValue", data);
				}
			});
		};
		var progressTimer = window.setInterval(obtainProgress, 200);
		// send ajax data with common data and more data
		var data = $.extend(true, {}, {
			funcname : this.options.funcname,
			mimes    : this.options.mimes
		}, this.options.more);
		// ajax submit file with a temporary form
		var $form = $('<form action="" method="POST" enctype="multipart/form-data"></form>')
					.css('position', 'absolute')
					.css('top', '-1000px')
					.css('left', '-1000px')
					.appendTo('body');
		var $file = this.$uploadFile.clone(true).appendTo($form);
		$form.ajaxSubmit({
			beforeSubmit : function () {
				if ($this.options.hasTrigger2) $this.$trigger2.waiting();
				else $this.$trigger.waiting();
				$this.$progressbar.addClass('visible');
			},
			url : JSEA.getPageContext().resolveUrl(
					this.options.url || 
					((this.options.basename != null ? this.options.basename + JSEA.Constants.URL_SEPARATOR : '') + this.options.funcname + JSEA.Constants.URL_SEPARATOR + 'upload')),
			dataType : 'json',
			data : data,
			success : function (data, stat, xhr) {
				if (progressTimer) window.clearInterval(progressTimer);
				var fileId = data['id'];
				$this.$element.val(fileId);
				if (data.status == 1) {
					$this.$progressbar.progressbar("setValue", 100);
					$this.$element.trigger('change');
					var fnSuccess = $this.options.onSuccess;
					if ($.isFunction(fnSuccess)) {
						fnSuccess();
					}
					Message.success(data.message);
				} else {
					$this.$progressbar.progressbar("setValue", 0);
					$this.$progressbar.removeClass('visible');
					$this.$uploadFile.val('');
					$this.$input.val('');
					Message.error(data.message);
				}
			},
			error : function (xhr) {
				if (progressTimer) window.clearInterval(progressTimer);
				$this.$progressbar.progressbar("setValue", 0);
				$this.$progressbar.removeClass('visible');
				$this.$uploadFile.val('');
				$this.$input.val('');
			},
			complete : function (xhr, status) { 
				$form.remove();
				if ($this.options.hasTrigger2) $this.$trigger2.waiting('hide');
				else $this.$trigger.waiting('hide');
			}
		});
	};

	Upload.prototype.reset = function () {
		this.$progressbar.progressbar("setValue", 0);
		this.$progressbar.removeClass('visible');
		this.$uploadFile.val('');
		this.$input.val('');
		Message.close();
	};

	Upload.prototype.getValue = function () {
		return this.options.mode == 'posting' ? this.$uploadFile.val() : this.$element.val();
	};

	Upload.prototype.setValue = function (value) {
		this.options.mode == 'posting' ? this.$uploadFile.val(value) : this.$element.val(value);
	}

	Upload.prototype.getPathname = function () {
		return(this.$uploadFile.val());
	};

	Upload.prototype.getDefaults = function () {
		return Upload.DEFAULTS;
	};

	Upload.prototype.getOptions = function (options) {
		var uploadOptions = this.parseAttribute(JSEA.Constants.ATTR_UPLOAD_OPTIONS);
		
		options = $.extend(true, {}, this.getDefaults(), uploadOptions, options);
		
		return options;
	};

	Upload.acceptMimes = function (mimes) {
		var acceptTypes = [];
		for (var i = 0; i < mimes.length; i++) {
			var a = Upload.ACCEPT_TYPES[mimes[i]];
			for (var j = 0; j < a.length; j++) {
				if ($.inArray(a[j], acceptTypes) == -1) acceptTypes.push(a[j]);
			}
		}
		return acceptTypes;
	};

	// FIELD.UPLOAD PLUGIN DEFINITION
	// ================================

	function Plugin(option) {
		var self = this;

		// FIELD.UPLOAD PUBLIC METHOD EXTENDS FIELD.TEXT
		// ===============================================

		self.extend($.fn.textfield.prototype);

		// FIELD.UPLOAD PUBLIC METHOD DEFINITION
		// =======================================

		self.getUploadData = function () {
			var data = '';
			self.each(function () {
				var $this = $(this);
				data  = $this.data('jsea.field.upload');
				return false;
			});
			return data;
		};

		self.ajaxUpload = function () {
			return self.each(function () {
				var $this = $(this);
				var data = $this.data('jsea.field.upload');
				data.ajaxUpload();
			});
		};

		self.getPathname = function () {
			var pathname = '';
			self.each(function () {
				var $this = $(this);
				var data  = $this.data('jsea.field.upload');
				pathname  = data.getPathname();
				return false;
			});
			return pathname;
		};

		self.reset = function () {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.field.upload');
				data.reset();
			});
		};

		return this.each(function () {
			var $this   = $(this);
			var plugin  = $this.data('jsea.plugin');
			var data    = $this.data('jsea.field.upload');
			var options = typeof option == 'object' && option;

			if (!plugin) $this.data('jsea.plugin', self);

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.field.upload', (data = new Upload(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.upload;

	$.fn.upload             = Plugin;
	$.fn.upload.Constructor = Upload;

	// FIELD.UPLOAD NO CONFLICT
	// ==========================

	$.fn.upload.noConflict = function () {
		$.fn.upload = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Select-field element
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// FIELD.SELECT PUBLIC CLASS DEFINITION
	// ======================================

	var Selefield = function (element, options) {
		this.init('field.select', element, options);
	};

	Selefield.VERSION = '1.0.0';

	Selefield.DEFAULTS = $.extend({}, $.fn.textfield.Constructor.DEFAULTS, {
		hasTrigger   : true,
		panelId      : null,
		url          : null,
		depends      : null,
		i18nPrefix   : null,
		nullable     : true,
		readonly     : true,
		optiononly   : true,
		manualonly   : false,
		autocomplete : true,
		caseSensitive : false,
		dropdownItems : null,
		onChange     : function () {}
	});

	// NOTE: FIELD.SELECT EXTENDS FIELD.TEXT
	// =======================================

	Selefield.prototype = $.extend({}, $.fn.textfield.Constructor.prototype);

	Selefield.prototype.constructor = Selefield;
	
	Selefield.prototype.initField = function () {
		this.$element.wrap(document.createElement('DIV'));
		if (this.options.value) this.$element.val(''); // if there is value from back-end, clear input field first
		
		this.expanded = false;
		this.autocompleted = false;
		this.manualTriggering = false;

		this.$wrapper = this.$element.parent().addClass('select-wrapper');
		this.$input   = this.$element.clone()
							.removeAttr('id').removeAttr('name')
							.removeAttr(JSEA.Constants.ATTR_CLASS)
							.removeAttr(JSEA.Constants.ATTR_SELEFIELD_OPTIONS)
							.removeAttr(JSEA.Constants.ATTR_VALID_TYPE).removeAttr(JSEA.Constants.ATTR_VALID_RULES);
		this.$last    = this.$wrapper;
		this.$tippor  = this.$wrapper;
		this.$panel   = (this.options.panelId) 
						? $('#' + this.options.panelId) 
							: $(document.createElement('DIV'))
								.addClass('select-panel')
								.append($(document.createElement('UL'))
										.addClass('select-options'));
		this.$panel.hide().insertAfter(this.$element);
		this.$element
			.after(this.$input)
			.addClass('select-value')
			.hide();
		this.$input
			.addClass('select-text');
		
		if (this.options.url && !this.options.depends) this.load();
		if (!this.options.url) this.rebuild();
		
		if (this.options.readonly) {
			this.$element.attr('readonly', 'readonly');
			this.$input.attr('readonly', 'readonly');
		}
	};
	
	Selefield.prototype.initTrigger = function () {
		this.$trigger.addClass('dropdown').attr('tabindex', '-1').insertAfter(this.$input);
	};

	//event binding
	Selefield.prototype.initEvents = function () {
		var $this = this;
		
		// another field changing event to re-load drop-down items
		if (this.options.depends) {
			$('#' + this.options.depends).on('change.jsea', function () {
				$this.clearDropdownItems();
				$this.setValue('');
				$this.load($(this).val());
			});
		}
		
		// dropdown expanding event
		this.$trigger.on('click.jsea', function () {
			if ($this.isDisabled()) return false;
			if (!$this.expanded) {
				$this.expand();
			} else {
				$this.collapse();
			}
			return false;
		});
		
		if (!this.options.readonly) {
			this.$input.on('blur.jsea', function () {
				if ($this.options.optiononly) {
					var $hover = $this.$panel.find('ul>li.select-option.hover');
					if ($hover.size() != 0) {
						$hover.trigger('click');
					} else {
						var $selected = $this.$panel.find('ul>li.select-option.selected');
						if ($selected.size() != 0) {
							$selected.trigger('click');
						}
					}
				} else {
					var value = $this.$input.val();
					$this.$element.val(value);
				}
			});
		}
		
		// keyup event for autocomplete
		if (!this.options.readonly && this.options.autocomplete) {
			// check if the key arrow-up/arrow-down/enter is pressed
			this.noncursorial = true;
			this.$input.on('keyup.jsea', function () {
				// if the key arrow-up/arrow-down/enter is pressed, event aborts.
				if (!$this.noncursorial) return false;
				$this.autocompleted = true;
				if (!$this.expanded) { $this.expand(); }
				var keyword = $this.$input.val();
				if (keyword == "") {
					$this.$panel.trigger('collapse');
				} else {
					$this.$panel.find('ul>li.select-option').each(function () {
						var $option = $(this);
						var optionText = $option.text();
						$option.removeClass('hover');
						optionText.startsWith(keyword, true) ? $option.show() : $option.hide();
					});
					$this.$panel.find('ul>li.select-option:visible:first').addClass('hover');
				}
			});
			this.$input.on('keydown.jsea', function (event) {
				$this.noncursorial = true;
				if (event.keyCode == 38) {
					// expand this panel first
					if (!$this.expanded) { $this.expand(); }
					// arrow up to move highlight up
					$this.noncursorial = false;
					var $hover = $this.$panel.find('ul>li.select-option.hover');
					if ($hover.size() == 0) {
						$hover = $this.$panel.find('ul>li.select-option:visible:last').addClass('hover');
					}
					var $prev = $hover.prev(':visible');
					if ($prev.size() == 0) {
						$prev = $this.$panel.find('ul>li.select-option:visible:last');
					}
					$hover.removeClass('hover');
					$prev.addClass('hover');
					$prev[0].scrollIntoView(false);
				} else if (event.keyCode == 40) {
					// expand this panel first
					if (!$this.expanded) { $this.expand(); }
					// arrow down to move highlight down
					$this.noncursorial = false;
					var $hover = $this.$panel.find('ul>li.select-option.hover');
					if ($hover.size() == 0) {
						$hover = $this.$panel.find('ul>li.select-option:visible:first').addClass('hover');
					}
					var $next = $hover.next(':visible');
					if ($next.size() == 0) {
						$next = $this.$panel.find('ul>li.select-option:visible:first');
					}
					$hover.removeClass('hover');
					$next.addClass('hover');
					$next[0].scrollIntoView(false);
				} else if (event.keyCode == 13) {
					// enter means to click the highlight
					$this.noncursorial = false;
					var $hover = $this.$panel.find('ul>li.select-option.hover');
					if ($hover.size() != 0) { $hover.trigger('click'); }
				}
				return($this.noncursorial);
			});
		}
		
		// each item select event
		this.$panel
			.on('mousedown.jsea', function () {
				return false;
			})
			.on('click.jsea', function () {
				return false;
			})
			.on('collapse.jsea', function () {
				$this.collapse();
				return false;
			})
			.on('click.jsea touchend.jsea', 'li.select-option', function (e) {
				var $option = $(this);
				var value = $option.attr(JSEA.Constants.ATTR_VALUE);
				$this.manualTriggering = true;
				$this.setValue(value);
				$this.autocompleted = false;
				$this.$panel.trigger('collapse');
				$this.$panel.find('ul>li.select-option.hover').removeClass('hover');
				$this.manualTriggering = false;
				// event stopper
				e.preventDefault && e.preventDefault();
				e.returnValue = false;
				e.stopPropagation && e.stopPropagation();
				e.cancelBubble = false;
				return false;
			});
	};

	Selefield.prototype.load = function (dependsVal) {
		var $this = this;
		var url   = this.options.url;
		if (url == null) return;
		var params;
		(dependsVal !== undefined) ? ((params = {})[this.options.depends] = dependsVal) : (params = null);
		$.ajax({
			url: JSEA.getPageContext().resolveUrl(url, params),
			method: 'POST',
			dataType: "json",
			data: params,
			beforeSend: function () {
				$this.$panel.waiting();
			},
			success: function (data) {
				$this.options.dropdownItems = data;
				$this.rebuild();
				$this.$panel.waiting('hide');
			},
			error: function (xhr) {
				$this.$panel.waiting('hide');
			}
		});
	};
	
	Selefield.prototype.rebuild = function () {
		// to trigger change event if has a value before rebuild
		var originValue = this.options.value;
		if (originValue) this.options.value = null;
		// build static drop-down items
		if (this.options.nullable) {
			this.$panel.find('.select-options')
			.prepend($(document.createElement('LI'))
					.addClass('select-option')
					.attr(JSEA.Constants.ATTR_VALUE, '')
					.html("&nbsp;"));
		}
		if (this.options.dropdownItems) {
			var dropdownItems = this.options.dropdownItems;
			if ($.isArray(dropdownItems)) {
				for (var i = 0; i < dropdownItems.length; i++) {
					if ($.isPlainObject(dropdownItems[i]) && dropdownItems[i].label == '') {
						this.$panel.find('.select-options')
						.append($(document.createElement('LI'))
								.addClass('select-option')
								.attr(JSEA.Constants.ATTR_VALUE, dropdownItems[i].value)
								.html("&nbsp;"));
					} else {
						this.$panel.find('.select-options')
						.append($(document.createElement('LI'))
								.addClass('select-option')
								.attr(JSEA.Constants.ATTR_VALUE, $.isPlainObject(dropdownItems[i]) ? dropdownItems[i].value : dropdownItems[i])
								.text($.isPlainObject(dropdownItems[i]) ? dropdownItems[i].label : dropdownItems[i]));
					} 
				}
			}
		}
		// build option text
		if (this.options.i18nPrefix) {
			var i18nPrefix = this.options.i18nPrefix;
			this.$panel.find('li.select-option').each(function () {
				var $option = $(this);
				var optionValue = $option.attr(JSEA.Constants.ATTR_VALUE);
				if (optionValue && optionValue.length > 0) {
					$option.text(JSEA.localizeMessage(i18nPrefix + JSEA.Constants.I18N_KEY_SEPARATOR + optionValue));
				}
			});
		}
		// set orginal value to make it selected and trigger a change event
		this.setValue(originValue);
	};
	
	Selefield.prototype.expand = function () {
		var $this = this;
		this.$panel.slideDown(100);
		this.$panel.find('li.select-option').show();
		//locate the select option
		var mainContainer = this.$panel.find('ul.select-options');
		var scrollToContainer = mainContainer.find('li.selected');
		if (scrollToContainer.offset()) {
			mainContainer.animate({
				scrollTop : scrollToContainer.offset().top
				- mainContainer.offset().top + mainContainer.scrollTop()
			}, 200);
		}
		this.expanded = true;
		$([document.body, window]).on('mousedown.jsea', function selectfield_collapse() {
			//restore original value if optiononly = true && readonly = false
			if (!$this.options.readonly && $this.options.autocomplete && $this.options.optiononly) {
				if ($this.autocompleted) {				
					$this.autocompleted = false;
					var originalValue = $this.$panel.find('ul>li.select-option.selected').text();
					$this.$input.val(originalValue);
				}
			}
			$this.$panel.trigger('collapse');
			$([document.body, window]).off('mousedown.jsea', selectfield_collapse);
		});
	};

	Selefield.prototype.collapse = function () {
		this.$panel.slideUp(100);
		this.expanded = false;
	};

	Selefield.prototype.getValue = function (value) {
		return this.$element.val();
	};

	Selefield.prototype.setValue = function (value) {
		var $this    = this;
		var oldValue = $this.$element.val();
		var optionMatched = false;
		this.$panel.find('ul>li.select-option').each(function () {
			var $option = $(this);
			var optionValue = $option.attr(JSEA.Constants.ATTR_VALUE);
			var optionText = $option.text().trim();
			
			if (optionValue == value) {
				optionMatched = true;
				$this.$element.val(optionValue);
				$this.$input.val(optionText);
				$option.addClass('selected');
			} else {
				$option.removeClass('selected');
			}
		});
		if (!optionMatched) {
			this.$element.val(value);
			this.$input.val(value);
		}
		if ((!this.options.manualonly || this.manualTriggering) && oldValue != value) {
			var fnChange = $this.options.onChange;
			if ($.isFunction(fnChange)) {
				fnChange.apply($this.$element.data('jsea.plugin'), [value, oldValue]);
			}
			$this.$element.trigger('change');
		}
	};

	Selefield.prototype.getText = function (value) {
		return this.$input.val();
	};

	Selefield.prototype.clearDropdownItems = function () {
		this.$panel.find("ul").empty();
	};

	Selefield.prototype.destroy = function () {
		// destroy input for select text
		if (this.$input) {
			this.$input.off('.jsea');
			this.$input.remove();
		}
		this.$input = null;
		// destroy panel
		this.clearDropdownItems();
		if (this.$panel) {
			this.$panel.off('.jsea');
			this.$panel.remove();
		}
		this.$panel = null;
		
		this.destroy0();
	};

	Selefield.prototype.getDefaults = function () {
		return Selefield.DEFAULTS;
	};

	Selefield.prototype.getOptions = function (options) {
		var selefieldOptions = this.parseAttribute(JSEA.Constants.ATTR_SELEFIELD_OPTIONS);
		
		options = $.extend(true, {}, this.getDefaults(), selefieldOptions, options);
		
		return options;
	};

	// FIELD.SELECT PLUGIN DEFINITION
	// ================================

	function Plugin(option) {
		var self = this;

		// FIELD.SELECT PUBLIC METHOD EXTENDS FIELD.TEXT
		// ===============================================

		self.extend($.fn.textfield.prototype);

		// FIELD.SELECT PUBLIC METHOD DEFINITION
		// =======================================

		self.setDropdownItems = function (dropdownItems) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.field.select');
				data.clearDropdownItems();
				data.setValue('');
				data.options.dropdownItems = dropdownItems;
				data.rebuild();
			});
		};

		/**
		 * @deprecated use setDropdownItems instead
		 */
		self.setOptions = function (dropdownItems) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.field.select');
				data.clearDropdownItems();
				data.setValue('');
				data.options.dropdownItems = dropdownItems;
				data.rebuild();
			});
		};

		return this.each(function () {
			var $this   = $(this);
			var plugin  = $this.data('jsea.plugin');
			var data    = $this.data('jsea.field.select');
			var options = typeof option == 'object' && option;

			if (!plugin) $this.data('jsea.plugin', self);

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.field.select', (data = new Selefield(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.selefield;

	$.fn.selefield             = Plugin;
	$.fn.selefield.Constructor = Selefield;

	// FIELD.SELECT NO CONFLICT
	// ==========================

	$.fn.selefield.noConflict = function () {
		$.fn.selefield = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Falect-field element
 * 
 * @author Aranjuez
 * @version May 11, 2022
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// FIELD.FALECT PUBLIC CLASS DEFINITION
	// ======================================
	
	var Falefield = function (element, options) {
		this.init('field.falect', element, options);
	};

	Falefield.VERSION = '1.0.0';

	Falefield.DEFAULTS = $.extend({}, $.fn.textfield.Constructor.DEFAULTS, {
		hasTrigger   : true,
		hasTrigger2  : true,
		panelId      : null,
		viewportSize : 3,
		tipPlacement : 'autotop',
		url          : null,
		i18nPrefix   : null,
		autoincrement: false,
		readonly     : true,
		optiononly   : true,
		manualonly   : true,
		dragnextItems : undefined,
		onChange     : function () {}
	});

	// NOTE: FIELD.FALECT EXTENDS FIELD.TEXT
	// =======================================

	Falefield.prototype = $.extend({}, $.fn.textfield.Constructor.prototype);

	Falefield.prototype.constructor = Falefield;

	Falefield.prototype.initField = function () {
		this.$element.wrap(document.createElement('DIV'));
		if (this.options.value) this.$element.val(''); // if there is value from back-end, clear input field first
		
		this.manualTriggering = false;
		this.current  = 0;
		
		this.$wrapper = this.$element.parent().addClass('falect-wrapper');
		this.$input   = this.$element.clone()
							.removeAttr('id').removeAttr('name')
							.removeAttr(JSEA.Constants.ATTR_CLASS)
							.removeAttr(JSEA.Constants.ATTR_FALEFIELD_OPTIONS)
							.removeAttr(JSEA.Constants.ATTR_VALID_TYPE).removeAttr(JSEA.Constants.ATTR_VALID_RULES);
		this.$last    = this.$wrapper;
		this.$tippor  = this.$wrapper;
		this.$panel   = (this.options.panelId) 
						? $('#' + this.options.panelId) 
							: $(document.createElement('DIV'))
								.addClass('falect-panel')
								.append($(document.createElement('UL'))
										.addClass('falect-options'));
		this.$panel.hide().insertAfter(this.$element);
		
		this.$options = this.$panel.find('ul.falect-options');
		this.$tipbox  = null;

		this.$element
			.after(this.$input)
			.addClass('falect-value')
			.hide();
		this.$input
			.addClass('falect-text');
		
		if (this.options.url && !this.options.depends) this.load();
		if (!this.options.url) this.rebuild();
		
		if (this.options.readonly) {
			this.$element.attr('readonly', 'readonly');
			this.$input.attr('readonly', 'readonly');
		}
	};

	Falefield.prototype.initTrigger = function () {
		this.$trigger.addClass('dragnext').attr('tabindex', '-1').insertAfter(this.$input);
		if (this.options.autoincrement) this.$trigger.addClass('autoincrement');
	};

	Falefield.prototype.initTrigger2 = function () {
		this.$trigger2.addClass('dragprev').attr('tabindex', '-1').insertAfter(this.$input);
		if (this.options.autoincrement) this.$trigger2.addClass('autoincrement');
		else this.$trigger2.hide();
	};

	//event binding
	Falefield.prototype.initEvents = function () {
		var $this = this;
		
		// another field changing event to re-load drag-next items
		if (this.options.depends) {
			$('#' + this.options.depends).on('change.jsea', function () {
				$this.clearDragnextItems();
				$this.setValue('');
				$this.load($(this).val());
			});
		}

		this.$trigger
			// click event to pick next option	
			.on('click.jsea', function () {
				if ($this.isDisabled()) return false;
				if ($this.options.autoincrement) {
					$this.fireNextOptionClicked();
				} else {
					$this.scrollToNextViewport();
				}
				return false;
			});
		this.$trigger2
			// click event to pick prev option	
			.on('click.jsea', function () {
				if ($this.isDisabled()) return false;
				if ($this.options.autoincrement) {
					$this.firePrevOptionClicked();
				} else {
					$this.scrollToPrevViewport();
				}
				return false;
			});
		// each item select event
		this.$panel
			.on('click.jsea', function () {
				return false;
			})
			.on('click.jsea', 'li.falect-option', function () {
				if ($this.isDisabled()) return false;
				var $option = $(this);
				var value = $option.attr(JSEA.Constants.ATTR_VALUE);
				$this.setValue(value);
				$this.manualTriggering = false;
				return false;
			})
			.on('mouseover.jsea', 'li.falect-option', function () {
				var $option = $(this);
				$this.displayOptionLabel($option);
			});
		
		this.timerScroll = null;
		this.$options
			.on('scroll.jsea', function () {
				$this.$options.find('li.falect-option').each(function (i) {
					var $option = $(this);
					$option.removeClass('scrolled');
				});
				var $option = $this.locateMiddleOption();
				$option.addClass('scrolled');
				$this.displayOptionLabel($option);
				clearTimeout($this.timerScroll);
				$this.timerScroll = setTimeout(function () {
					var scrollLeft = $this.$options.scrollLeft();
					var optionsWidth = $this.$options.width();
					var scrollWidth = $this.$options.prop('scrollWidth');
					if (scrollLeft <= 0) {
						$this.$trigger.show();
						$this.$trigger2.hide();
					} else if (scrollLeft + optionsWidth >= scrollWidth) {
						$this.$trigger.hide();
						$this.$trigger2.show();
					}
				}, 2000);
			});
		if (!this.options.readonly) {
			this.$input.on('blur.jsea', function () {
				var value = $this.$input.val();
				if (value == '') {
					$this.setValue('');
					return false;
				}
				if ($this.options.optiononly) {
					$this.$options.find('.falect-option').each(function () {
						var $option = $(this);
						var optionText = $option.text();
						optionText == value ? $option.trigger('click') : $this.setValue('');
					});
				} else {
					$this.setValue(value);
				}
			});
			// check if the key arrow-up/arrow-down/enter is pressed
			this.noncursorial = true;
			this.$input.on('keydown.jsea', function (event) {
				$this.noncursorial = true;
				if ([37, 38].includes(event.keyCode)) {
					// arrow left/up to move highlight previous
					$this.noncursorial = false;
					var $hover = $this.$panel.find('ul>li.falect-option.hover');
					if ($hover.size() == 0) {
						$hover = $this.$panel.find('ul>li.falect-option:last').addClass('hover');
					}
					var $prev = $hover.prev();
					if ($prev.size() == 0) {
						$prev = $this.$panel.find('ul>li.falect-option:last');
					}
					$hover.removeClass('hover');
					$prev.addClass('hover');
					$prev[0].scrollIntoView(false);
				} else if ([39, 40].includes(event.keyCode)) {
					// arrow right/down to move highlight next
					$this.noncursorial = false;
					var $hover = $this.$panel.find('ul>li.falect-option.hover');
					if ($hover.size() == 0) {
						$hover = $this.$panel.find('ul>li.falect-option:first').addClass('hover');
					}
					var $next = $hover.next();
					if ($next.size() == 0) {
						$next = $this.$panel.find('ul>li.falect-option:first');
					}
					$hover.removeClass('hover');
					$next.addClass('hover');
					$next[0].scrollIntoView(false);
				} else if (event.keyCode == 13) {
					// enter means to click the highlight
					$this.noncursorial = false;
					var $hover = $this.$panel.find('ul>li.falect-option.hover');
					if ($hover.size() != 0) { $hover.trigger('click'); }
				}
				return($this.noncursorial);
			});
		}
	};

	Falefield.prototype.load = function (dependsVal) {
		var $this = this;
		var url   = this.options.url;
		if (url == null) return;
		var params;
		(dependsVal !== undefined) ? ((params = {})[this.options.depends] = dependsVal) : (params = null);
		$.ajax({
			url: JSEA.getPageContext().resolveUrl(url, params),
			method: 'POST',
			dataType: "json",
			data: params,
			beforeSend: function () {
				$this.$trigger.waiting();
			},
			success: function (data) {
				$this.options.dragnextItems = data;
				$this.rebuild();
				$this.$trigger.waiting('hide');
			},
			error: function (xhr) {
				$this.$trigger.waiting('hide');
			}
		});
	};

	Falefield.prototype.rebuild = function () {
		// to trigger change event if has a value before rebuild
		var originValue = this.options.value;
		if (originValue) this.options.value = null;
		if (this.options.autoincrement) {
			this.options.optiononly = false;
			this.$wrapper.addClass('autoincrement');
			this.$element.addClass('autoincrement');
			this.$input.addClass('autoincrement');
		}
		if (!this.options.autoincrement) {
			this.$panel.show();
			// build static drag-next items
			var dragnextItems = this.options.dragnextItems;
			if (dragnextItems != null && dragnextItems.length != 0) {
				for (var i = 0; i < dragnextItems.length; i++) {
					if ($.isPlainObject(dragnextItems[i]) && dragnextItems[i].label == '') {
						this.$panel.find('.falect-options')
						.append($(document.createElement('LI'))
								.addClass('falect-option')
								.attr(JSEA.Constants.ATTR_VALUE, dragnextItems[i].value)
								.html("&nbsp;"));
					} else {
						var optionValue = $.isPlainObject(dragnextItems[i]) ? dragnextItems[i].value : dragnextItems[i];
						var optionLabel = $.isPlainObject(dragnextItems[i]) ? dragnextItems[i].label : dragnextItems[i];
						this.$panel.find('.falect-options')
						.append($(document.createElement('LI'))
									.addClass('falect-option')
									.attr(JSEA.Constants.ATTR_VALUE, optionValue)
									.attr(JSEA.Constants.ATTR_LABEL, optionLabel)
									.text(optionLabel)
							);
					} 
				}
			}
			this.optionWidth = this.$panel.find('ul>li.falect-option').outerWidth();
			this.$options.css('max-width', this.options.viewportSize * this.optionWidth);
		}
		// build option text
		if (this.options.i18nPrefix) {
			var i18nPrefix = this.options.i18nPrefix;
			this.$panel.find('li.falect-option').each(function () {
				var $option = $(this);
				var optionValue = $option.attr(JSEA.Constants.ATTR_VALUE);
				if (optionValue && optionValue.length > 0) {
					var optionLabel = JSEA.localizeMessage(i18nPrefix + JSEA.Constants.I18N_KEY_SEPARATOR + optionValue);
					$option
						.attr(JSEA.Constants.ATTR_LABEL, optionLabel)
						.text(optionLabel);
				}
			});
		}
		// set orginal value to make it selected and trigger a change event
		this.setValue(originValue);
	};

	Falefield.prototype.firePrevOptionClicked = function () {
		var $this = this;
		if (this.options.autoincrement) {
			this.setValue(this.current - 1);
			return;
		}
		if (!this.options.autoincrement) {
			var $prevOption = this.$panel.find('ul>li.falect-option.selected').prev();
			if ($prevOption.size() == 0) {
				$prevOption = this.$panel.find('ul>li.falect-option:last-child');
			}
			if ($prevOption.size() != 0) $prevOption.trigger('click.jsea');
		}
	};

	Falefield.prototype.fireNextOptionClicked = function () {
		var $this = this;
		if (this.options.autoincrement) {
			this.setValue(this.current + 1);
			return;
		}
		if (!this.options.autoincrement) {
			var $nextOption = this.$panel.find('ul>li.falect-option.selected').next();
			if ($nextOption.size() == 0) {
				$nextOption = this.$panel.find('ul>li.falect-option:first-child');
			}
			if ($nextOption.size() != 0) $nextOption.trigger('click.jsea');
		}
	};

	Falefield.prototype.scrollToPrevViewport = function () {
		var $this = this;
		if (this.options.autoincrement) {
			this.setValue(this.current - 1);
			return;
		}
		if (!this.options.autoincrement) {
			var offsetLeft = 0;
			var $options = this.$options.find('li.falect-option');
			var optionCount = $options.size();
			$($options.toArray().reverse()).each(function (i) {
				offsetLeft = $(this).offset().left - $this.$options.offset().left;
				if (offsetLeft <= -$this.optionWidth) {
					return false;
				}
				if ((optionCount - i) <= $this.$options.viewportSize) {
					return false;
				}
			});
			this.$options.animate({
				scrollLeft : offsetLeft - (($this.options.viewportSize - 1) * $this.optionWidth) + $this.$options.scrollLeft()
			}, 200);
		}
	};

	Falefield.prototype.scrollToNextViewport = function () {
		var $this = this;
		if (this.options.autoincrement) {
			this.setValue(this.current + 1);
			return;
		}
		if (!this.options.autoincrement) {
			var offsetLeft = 0;
			var $options = this.$options.find('li.falect-option');
			var optionCount = $options.size();
			$options.each(function (i) {
				offsetLeft = $(this).offset().left - $this.$options.offset().left;
				if (offsetLeft >= $this.options.viewportSize * $this.optionWidth) {
					return false;
				}
				if ((optionCount - i) <= $this.options.viewportSize) {
					return false;
				}
			});
			this.$options.animate({
				scrollLeft : offsetLeft + $this.$options.scrollLeft()
			}, 200);
		}
	};

	Falefield.prototype.locateMiddleOption = function () {
		var $this = this;
		var $option = null;
		var viewportHalfSize = Math.floor($this.options.viewportSize / 2);
		if (!this.options.autoincrement) {
			var offsetLeft = 0;
			var $options = this.$options.find('li.falect-option');
			var optionCount = $options.size();
			$options.each(function (i) {
				var $each = $(this);
				offsetLeft = $each.offset().left - $this.$options.offset().left;
				if (offsetLeft >= viewportHalfSize * $this.optionWidth) {
					$option = $each;
					return false;
				}
				if ((optionCount - i) <= viewportHalfSize) {
					$option = $each;
					return false;
				}
			});
		}
		return $option;
	};

	Falefield.prototype.displayOptionLabel = function ($option) {
		var tooltip = $option.attr(JSEA.Constants.ATTR_LABEL);
		if (this.$tipbox == null) {
			this.$tipbox = Tipbox.info(this.$panel, tooltip, this.options.tipPlacement);
			this.$panel.tipbox('show');
		} else {
			this.$tipbox.setContent(tooltip).show();
		}
		// auto-hide tip
		var $this = this;
		clearTimeout(this.timerDisplay);
		this.timerDisplay = setTimeout(function () {
			$this.$tipbox.hide();
		}, 3200);
	};

	Falefield.prototype.getValue = function (value) {
		return this.$element.val();
	};

	Falefield.prototype.setValue = function (value) {
		var $this    = this;
		var oldValue = $this.$element.val();
		var optionMatched = false;
		this.current = 0;
		if (this.options.autoincrement && value != null && value != '') {
			this.current = parseInt(value);
		}
		if (!this.options.autoincrement) {
			this.$panel.find('ul>li.falect-option').each(function (i) {
				var $option = $(this);
				var optionValue = $option.attr(JSEA.Constants.ATTR_VALUE);
				var optionText = $option.text().trim();
				
				if (optionValue == value) {
					optionMatched = true;
					$this.current = (i + 1);
					$this.$element.val(optionValue);
					$this.$input.val(optionText);
					$option.addClass('selected');
				} else {
					$option.removeClass('selected');
				}
			});
			//locate the selected option
			var viewportHalfSize = Math.floor($this.options.viewportSize / 2);
			var selectedOption = $this.$options.find('li.selected');
			if (selectedOption.offset()) {
				$this.$options.animate({
					scrollLeft : selectedOption.offset().left - ($this.$options.offset().left + viewportHalfSize * $this.optionWidth) + $this.$options.scrollLeft()
				}, 200);
			}
		}
		if (!optionMatched) {
			this.$element.val(value);
			this.$input.val(value);
		}
		if ((!this.options.manualonly || this.manualTriggering) && oldValue != value) {
			var fnChange = $this.options.onChange;
			if (typeof fnChange === 'string') {
				fnChange = Page.Method('elem', fnChange);
			}
			if ($.isFunction(fnChange)) {
				fnChange.apply($this.$element.data('jsea.plugin'), [value, oldValue]);
			}
			$this.$element.trigger('change');
		}
	};

	Falefield.prototype.getText = function (value) {
		return this.$input.val();
	};

	Falefield.prototype.clearDragnextItems = function () {
		this.$panel.find("ul").empty();
	};

	Falefield.prototype.destroy = function () {
		// clear all timers
		clearTimeout(this.timerScroll);
		clearTimeout(this.timerDisplay);
		// destroy input for falect text
		if (this.$input) {
			this.$input.off('.jsea');
			this.$input.remove();
		}
		this.$input = null;
		// destroy options
		if (this.$options) {
			this.$options.off('.jsea');
			this.$options.remove();
		}
		this.$options = null;
		// destroy panel
		this.clearDragnextItems();
		if (this.$panel) {
			this.$panel.off('.jsea');
			this.$panel.remove();
		}
		this.$panel = null;
		
		this.destroy0();
	};

	Falefield.prototype.getDefaults = function () {
		return Falefield.DEFAULTS;
	};

	Falefield.prototype.getOptions = function (options) {
		var falefieldOptions = this.parseAttribute(JSEA.Constants.ATTR_FALEFIELD_OPTIONS);
		
		options = $.extend(true, {}, this.getDefaults(), falefieldOptions, options);
		
		return options;
	};

	// FIELD.FALECT PLUGIN DEFINITION
	// ================================

	function Plugin(option) {
		var self = this;

		// FIELD.FALECT PUBLIC METHOD EXTENDS FIELD.TEXT
		// ===============================================

		self.extend($.fn.textfield.prototype);

		// FIELD.FALECT PUBLIC METHOD DEFINITION
		// =======================================

		self.setDragnextItems = function (dragnextItems) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.field.falect');
				data.clearDropdownItems();
				data.setValue('');
				data.options.dragnextItems = dragnextItems;
				data.rebuild();
			});
		};

		return this.each(function () {
			var $this   = $(this);
			var plugin  = $this.data('jsea.plugin');
			var data    = $this.data('jsea.field.falect');
			var options = typeof option == 'object' && option;

			if (!plugin) $this.data('jsea.plugin', self);

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.field.falect', (data = new Falefield(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.falefield;

	$.fn.falefield             = Plugin;
	$.fn.falefield.Constructor = Falefield;

	// FIELD.FALECT NO CONFLICT
	// ==========================

	$.fn.falefield.noConflict = function () {
		$.fn.falefield = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Captcha field element
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// FIELD.CAPTCHA PUBLIC CLASS DEFINITION
	// =======================================
	
	var Captcha = function (element, options) {
		this.init('field.captcha', element, options);
	};

	Captcha.VERSION = '1.0.0';

	Captcha.DEFAULTS = $.extend({}, $.fn.textfield.Constructor.DEFAULTS, {
		hasTrigger      : true,
		preloading      : false,
		imageId         : null
	});

	// NOTE: FIELD.CAPTCHA EXTENDS FIELD.TEXT
	// ========================================

	Captcha.prototype = $.extend({}, $.fn.textfield.Constructor.prototype);

	Captcha.prototype.constructor = Captcha;

	Captcha.prototype.initField = function () {
		this.$image = $('#' + this.options.imageId);
	};

	Captcha.prototype.initTrigger = function () {
		if (this.options.preloading) {
			this.$trigger.waiting();
			this.$image.attr('src', this.resolveCaptchaUrl());
		}
	};

	Captcha.prototype.initEvents = function () {
		var $this = this;
		if (!this.options.preloading) {
			$this.$element.bind('focus.jsea', function () {
				if (!$this.$image.attr('src')) {
					$this.$trigger.waiting();
					$this.$image.attr('src', $this.resolveCaptchaUrl());
				}
			});
		}
		$this.$trigger.bind('click.jsea', function () {
			$this.$trigger.waiting();
			$this.$image.attr('src', $this.resolveCaptchaUrl());
			return false;
		});
		$this.$image.on('load', function () {
			$this.$trigger.waiting('hide');
		});
	};

	Captcha.prototype.resolveCaptchaUrl = function () {
		return JSEA.getPageContext().resolveUrl('authen/captcha?_ts_=' + new Date().getTime());
	};

	Captcha.prototype.getDefaults = function () {
		return Captcha.DEFAULTS;
	};

	Captcha.prototype.getOptions = function (options) {
		var captchaOptions = this.parseAttribute(JSEA.Constants.ATTR_CAPTCHA_OPTIONS);
		
		options = $.extend(true, {}, this.getDefaults(), captchaOptions, options);
		
		return options;
	};
 
	// FIELD.CAPTCHA PLUGIN DEFINITION
	// =================================

	function Plugin(option) {
		var self = this;

		// FIELD.CAPTCHA PUBLIC METHOD EXTENDS FIELD.TEXT
		// ================================================

		self.extend($.fn.textfield.prototype);

		// FIELD.CAPTCHA PUBLIC METHOD DEFINITION
		// ========================================

		self.reset = function () {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.field.captcha');
				data.reset();
			});
		};

		return this.each(function () {
			var $this   = $(this);
			var plugin  = $this.data('jsea.plugin');
			var data    = $this.data('jsea.field.captcha');
			var options = typeof option == 'object' && option;

			if (!plugin) $this.data('jsea.plugin', self);

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.field.captcha', (data = new Captcha(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.captcha;

	$.fn.captcha             = Plugin;
	$.fn.captcha.Constructor = Captcha;

	// FIELD.CAPTCHA NO CONFLICT
	// ===========================

	$.fn.captcha.noConflict = function () {
		$.fn.captcha = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Field group
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// FIELDS PUBLIC CLASS DEFINITION
	// ================================
	
	var Fields = function (element, options) {
		this.init('fields', element, options);
	};

	Fields.VERSION = '1.0.0';

	Fields.DEFAULTS = $.extend({}, $.fn.field.Constructor.DEFAULTS, {
		group : []
	});

	// NOTE: FIELDS EXTENDS FIELD
	// ============================

	Fields.prototype = $.extend({}, $.fn.field.Constructor.prototype);

	Fields.prototype.constructor = Fields;

	Fields.prototype.setVisible = function (bVisible) {
		var $cell = this.$element.closest('li.element');
		(bVisible) ? $cell.show() : $cell.hide();
	};

	Fields.prototype.setDisabled = function (bDisabled) {
		$.each(this.options.group, function (i, p) {
			p.setDisabled(bDisabled);
		});
	};

	Fields.prototype.getDefaults = function () {
		return Fields.DEFAULTS;
	};

	Fields.prototype.getOptions = function (options) {
		options = $.extend({}, this.getDefaults(), this.$element.data(), options);
		
		return options;
	};

	// FIELDS PLUGIN DEFINITION
	// ==========================

	function Plugin(option) {
		return this.each(function () {
			var $this = $(this);

			var data = $this.data('jsea.fields');
			var options = typeof option == 'object' && option;

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.fields', (data = new Fields(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	// FIELD.TEXT REUSE METHOD EXTENDS FIELD
	// =======================================

	Plugin.prototype = $.extend({}, $.fn.field.prototype);

	Plugin.prototype.constructor = Plugin;

	var old = $.fn.fields;

	$.fn.fields             = Plugin;
	$.fn.fields.Constructor = Fields;

	// FIELDS NO CONFLICT
	// ====================

	$.fn.fields.noConflict = function () {
		$.fn.fields = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Check-boxes group element
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// FIELDS.CHECKBOXES PUBLIC CLASS DEFINITION
	// ===========================================

	var Checkboxes = function (element, options) {
		this.init('fields.checkboxes', element, options);
	};

	Checkboxes.VERSION  = '1.0.0';

	Checkboxes.DEFAULTS = $.extend({}, $.fn.fields.Constructor.DEFAULTS, {
		name : '',
		onCheck : null
	});

	// NOTE: FIELDS.CHECKBOXES EXTENDS FIELDS
	// ========================================

	Checkboxes.prototype = $.extend({}, $.fn.fields.Constructor.prototype);

	Checkboxes.prototype.constructor = Checkboxes;
	
	Checkboxes.prototype.initField = function () {
		var $this = this;
		this.$element.find('*[' + JSEA.Constants.ATTR_CHECKBOX_OPTIONS + ']').each(function (i, item) {
			var $item = $(item);
			$this.options.group[i] = $item.checkbox();
		});
	};

	Checkboxes.prototype.initEvents = function () {
		var $this = this;
		this.$element.on('click.jsea', '.checkbox:not(.disabled)', function () {
			var pCheckbox = $(this).data('jsea.plugin');
			pCheckbox.setChecked(!pCheckbox.isChecked());
			if ($.isFunction($this.options.onCheck)) {
				$this.options.onCheck.apply(pCheckbox, [ $this.getValue() ]);
			}
			$this.$element.trigger('check', [ pCheckbox, $this.getValue() ]);
		});
	};

	Checkboxes.prototype.reset = function () {
		var defaultValues = this.options.value.split(',');
		var checkedItems  = this.$element.find('[jsea-checkbox-options]').filter('.checked');
		if (checkedItems && checkedItems.size() > 0) {
			checkedItems.each(function (index, item) {
				var $this = $(item);
				var $checkbox = $this.data('jsea.field.checkbox').$checkbox;
				$checkbox.removeAttr('checked');
				$checkbox.prop('checked', false);
				$this.removeClass('checked');
			});
		}
		
		this.$element.find('[jsea-checkbox-options]').each(function (index, item) {
			var $this = $(item);
			var itemValue = $this.attr('data-value');
			if ($.inArray(itemValue, defaultValues) >= 0) {
				$this.addClass('checked');
				var $checkbox = $this.data('jsea.field.checkbox').$checkbox;
				$checkbox.attr('checked', 'checked');
				$checkbox.prop('checked', true);
			}
		});
	};

	Checkboxes.prototype.getFieldName = function () {
		return this.options.name;
	};

	Checkboxes.prototype.getFieldValue = function () {
		var values = [];
		var checkedItems  = this.$element.find('[jsea-checkbox-options]').filter('.checked');
		checkedItems.each(function (i, item) {
			var $this = $(item);
			var $checkbox = $this.data('jsea.field.checkbox').$checkbox;
			values.push($checkbox.val());
		});
		return values.join(',');
	};

	Checkboxes.prototype.validatePerform = function () {
		var validInst = this.$element.data('jsea.validator');
		var value = this.getFieldValue();
		if (value != null) {
			value = value.trim();
		}
		if (validInst.value != value) {
			validInst.value = value;
			validInst.perform();
		}
	};

	Checkboxes.prototype.validateEventBind = function () {
		var $this = this;
		this.$element.find('span[jsea-checkbox-options]').bind('click.validate', function () {			
			$this.validatePerform();
		});
	};

	Checkboxes.prototype.getValue = function () {
		var values = [];
		$.each(this.options.group, function (i, pCheckbox) {
			if (pCheckbox.isChecked()) {
				values.push(pCheckbox.val());
			}
		});
		return values;
	};

	Checkboxes.prototype.setValue = function (value) {
		var values = $.isArray(value) ? value : [ value ];
		$.each(this.options.group, function (i, pCheckbox) {
			var chkValue = pCheckbox.val();
			pCheckbox.setChecked($.inArray(chkValue, values) >= 0);
		});
	};

	Checkboxes.prototype.getDefaults = function () {
		return Checkboxes.DEFAULTS;
	};

	Checkboxes.prototype.getOptions = function (options) {
		var checkboxesOptions = this.parseAttribute(JSEA.Constants.ATTR_CHECKBOXES_OPTIONS);
		
		options =  $.extend(true, {}, this.getDefaults(), checkboxesOptions, options);
		
		return options;
	};

	// FIELDS.CHECKBOXES PLUGIN DEFINITION
	// =====================================

	function Plugin(option) {
		var self = this;

		// FIELDS.RADIOS PUBLIC METHOD EXTENDS FIELDS
		// ============================================

		this.extend($.fn.fields.prototype);

		return this.each(function () {
			var $this   = $(this);
			var plugin  = $this.data('jsea.plugin');
			var data    = $this.data('jsea.field.checkboxes');
			var options = typeof option == 'object' && option;

			if (!plugin) $this.data('jsea.plugin', self);

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.fields.checkboxes', (data = new Checkboxes(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.checkboxes;

	$.fn.checkboxes             = Plugin;
	$.fn.checkboxes.Constructor = Checkboxes;

	// CHECKBOXES NO CONFLICT
	// ========================

	$.fn.checkboxes.noConflict = function () {
		$.fn.checkboxes = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Check-box element
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// FIELD.CHECKBOX PUBLIC CLASS DEFINITION
	// ========================================

	var Checkbox = function (element, options) {
		this.init('field.checkbox', element, options);
	};

	Checkbox.VERSION  = '1.0.0';

	Checkbox.DEFAULTS = $.extend({}, $.fn.field.Constructor.DEFAULTS);

	// NOTE: FIELD.CHECKBOX EXTENDS FIELD
	// ====================================

	Checkbox.prototype = $.extend({}, $.fn.field.Constructor.prototype);

	Checkbox.prototype.constructor = Checkbox;

	Checkbox.prototype.initField = function () {
		this.$checkbox = this.$element.parent().find(':checkbox');
		this.$checkbox.hide();
		
		this.$label = this.$element.parent().find('label');
		if (this.$label.length == 0) {
			this.$label = $(document.createElement('LABEL')).appendTo(this.$element.parent());
		}
		if (this.options.i18nPrefix) {
			this.$label.text(JSEA.localizeMessage(this.options.i18nPrefix + '.' + this.getValue()));
		}
	};

	Checkbox.prototype.getValue = function () {
		return this.$element.attr('data-value');
	};

	Checkbox.prototype.isChecked = function () {
		return this.$element.hasClass('checked');
	};

	Checkbox.prototype.setChecked = function (bChecked) {
		if (bChecked) {
			this.$checkbox
				.attr('checked', 'checked')
				.prop('checked', true);
		} else {
			this.$checkbox
				.removeAttr('checked')
				.prop('checked', false);
		}
	};

	Checkbox.prototype.getDefaults = function () {
		return Checkbox.DEFAULTS;
	};

	Checkbox.prototype.getOptions = function (options) {
		var checkboxOptions = this.parseAttribute(JSEA.Constants.ATTR_CHECKBOX_OPTIONS);
		
		options = $.extend(true, {}, this.getDefaults(), checkboxOptions, options);
		
		return options;
	};

	// FIELD.CHECKBOX PLUGIN DEFINITION
	// ==================================

	function Plugin(option) {
		var self = this;

		// FIELD.CHECKBOX PUBLIC METHOD EXTENDS FIELD
		// ============================================

		self.extend($.fn.field.prototype);

		// FIELD.CHECKBOX PUBLIC METHOD DEFINITION
		// =========================================

		self.isChecked = function () {
			var bChecked = false;
			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.field.checkbox');
				bChecked    = data.isChecked();
				return false;
			});
			return bChecked;
		};

		self.setChecked = function (value) {
			if (value) self.addClass('checked');
			else self.removeClass('checked');
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.field.checkbox');
				data.setChecked(value);
			});
		};

		// FIELD.CHECKBOX PUBLIC METHOD DEFINITION
		// =========================================

		return this.each(function () {
			var $this   = $(this);
			var plugin  = $this.data('jsea.plugin');
			var data    = $this.data('jsea.field.checkbox');
			var options = typeof option == 'object' && option;

			if (!plugin) $this.data('jsea.plugin', self);

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.field.checkbox', (data = new Checkbox(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.checkbox;

	$.fn.checkbox             = Plugin;
	$.fn.checkbox.Constructor = Checkbox;

	// CHECKBOX NO CONFLICT
	// ======================

	$.fn.checkbox.noConflict = function () {
		$.fn.checkbox = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Radios group element
 * 
 * @author Aranjuez
 * @version Oct 01, 2023
 * @since Pyrube-JSEA 1.1
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// RADIOS PUBLIC CLASS DEFINITION
	// ================================

	var Radios = function (element, options) {
		this.init('fields.radios', element, options);
	};

	Radios.VERSION  = '1.1.0';

	Radios.DEFAULTS = $.extend({}, $.fn.fields.Constructor.DEFAULTS, {
		name: '',
		onCheck : null
	});

	// NOTE: RADIOS EXTENDS FIELDS
	// =============================

	Radios.prototype = $.extend({}, $.fn.fields.Constructor.prototype);

	Radios.prototype.constructor = Radios;

	Radios.prototype.initField = function () {
		var $this = this;
		this.$element.find('*[' + JSEA.Constants.ATTR_RADIO_OPTIONS + ']').each(function (i, item) {
			var $item = $(item);
			$this.options.group[i] = $item.radio();
		});
	};

	Radios.prototype.initEvents = function () {
		var $this = this;
		this.$element.on('click.jsea', '.radio:not(.disabled)', function () {
			$this.uncheckAll();
			var pRadio = $(this).data('jsea.plugin');
			pRadio.setChecked(true);
			if ($.isFunction($this.options.onCheck)) {
				$this.options.onCheck.apply(pRadio, [ $this.getValue() ]);
			}
			$this.$element.trigger('check', [ pRadio, $this.getValue() ]);
		});
	};

	Radios.prototype.reset = function () {
		var defaultValue = this.options.value;
		
		var checkedItem = this.$element.find('[jsea-radio-options]').filter('.checked');
		if (checkedItem && checkedItem.size() > 0) {
			var $radio = checkedItem.data('jsea.field.radio').$radio;
			$radio.removeAttr('checked');
			$radio.prop('checked', false);
			checkedItem.removeClass('checked');
		}
		
		this.$element.find('[jsea-radio-options]').each(function (index, item) {
			var $this = $(item);
			if ($this.attr('data-value') == defaultValue) {
				$this.addClass('checked');
				var $radio = $this.data('jsea.field.radio').$radio;
				$radio.attr('checked', 'checked');
				$radio.prop('checked', true);
			}
		});
	};

	Radios.prototype.getFieldName = function () {
		return this.options.name;
	};

	Radios.prototype.getFieldValue = function () {	
		var value = '';
		var checkedItem = this.$element.find('[jsea-radio-options]').filter('.checked');
		if (checkedItem && checkedItem.size() > 0) {
			var $radio = checkedItem.data('jsea.field.radio').$radio;
			value = $radio.val();
		}
		return value;
	};

	Radios.prototype.validatePerform = function () {
		var validInst = this.$element.data('jsea.validator');
		var value = this.getFieldValue();
		if (value != null) {
			value = value.trim();
		}
		if (validInst.value != value) {
			validInst.value = value;
			validInst.perform();
		}
	};

	Radios.prototype.validateEventBind = function () {
		var $this = this;
		this.$element.find('span[jsea-radio-options]').bind('click.validate', function () {
			$this.validatePerform();
		});
	};

	Radios.prototype.getValue = function () {
		var value = null;
		$.each(this.options.group, function (i, pRadio) {
			if (pRadio.isChecked()) {
				value = pRadio.val();
				return false;
			}
		});
		return value;
	};

	Radios.prototype.setValue = function (value) {
		$.each(this.options.group, function (i, pRadio) {
			var rdoValue = pRadio.val();
			pRadio.setChecked(rdoValue == value);
		});
	};

	Radios.prototype.uncheckAll = function () {
		$.each(this.options.group, function (i, pRadio) {
			pRadio.setChecked(false);
		});
	};

	Radios.prototype.getDefaults = function () {
		return Radios.DEFAULTS;
	};

	Radios.prototype.getOptions = function (options) {
		var radiosOptions = this.parseAttribute(JSEA.Constants.ATTR_RADIOS_OPTIONS);
		
		options =  $.extend(true, {}, this.getDefaults(), radiosOptions, options);
		
		return options;
	};

	// FIELDS.RADIOS PLUGIN DEFINITION
	// =================================

	function Plugin(option) {
		var self = this;

		// FIELDS.RADIOS PUBLIC METHOD EXTENDS FIELDS
		// ============================================

		this.extend($.fn.fields.prototype);

		return this.each(function () {
			var $this   = $(this);
			var plugin  = $this.data('jsea.plugin');
			var data    = $this.data('jsea.field.radios');
			var options = typeof option == 'object' && option;

			if (!plugin) $this.data('jsea.plugin', self);

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.fields.radios', (data = new Radios(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.radios;

	$.fn.radios             = Plugin;
	$.fn.radios.Constructor = Radios;

	// FIELDS.RADIOS NO CONFLICT
	// ===========================

	$.fn.radios.noConflict = function () {
		$.fn.radios = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Radio element
 * 
 * @author Aranjuez
 * @version Oct 01, 2023
 * @since Pyrube-JSEA 1.1
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// RADIO PUBLIC CLASS DEFINITION
	// ===============================

	var Radio = function (element, options) {
		this.init('field.radio', element, options);
	};

	Radio.VERSION  = '1.1.0';

	Radio.DEFAULTS = $.extend({}, $.fn.field.Constructor.DEFAULTS);

	// NOTE: FIELD.RADIO EXTENDS FIELD
	// =================================

	Radio.prototype = $.extend({}, $.fn.field.Constructor.prototype);

	Radio.prototype.constructor = Radio;

	Radio.prototype.initField = function () {
		var $li = this.$element.parent();
		this.$radio = $li.find(':radio');
		this.$radio.hide();
		// build option text
		var radioValue = this.$radio.val();
		var i18nPrefix = this.options.i18nPrefix;
		if (i18nPrefix) {
			$li.find('label:first').each(function () {
				var $option = $(this);
				if (radioValue && radioValue.length > 0) {
					$option.text(JSEA.localizeMessage(i18nPrefix + JSEA.Constants.I18N_KEY_SEPARATOR + radioValue));
				}
			});
		}
	};
	
	Radio.prototype.getValue = function () {
		return this.$element.attr('data-value');
	};

	Radio.prototype.isChecked = function () {
		return this.$element.hasClass('checked');
	};

	Radio.prototype.setChecked = function (bChecked) {
		if (bChecked) {						
			this.$radio
				.attr('checked', 'checked')
				.prop('checked', true);
		} else {
			this.$radio
				.removeAttr('checked')
				.prop('checked', false);
		}
	};

	Radio.prototype.getDefaults = function () {
		return Radio.DEFAULTS;
	};

	Radio.prototype.getOptions = function (options) {
		var radioOptions = this.parseAttribute(JSEA.Constants.ATTR_RADIO_OPTIONS);
		
		options = $.extend(true, {}, this.getDefaults(), radioOptions, options);
		
		return options;
	};
  
	// RADIO PLUGIN DEFINITION
	// =========================

	function Plugin(option) {
		var self = this;

		// FIELD.RADIO PUBLIC METHOD EXTENDS FIELD
		// =========================================

		self.extend($.fn.field.prototype);

		// FIELD.RADIO PUBLIC METHOD DEFINITION
		// ======================================

		self.isChecked = function () {
			var bChecked = false;
			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.field.radio');
				bChecked    = data.isChecked();
				return false;
			});
			return bChecked;
		};

		self.setChecked = function (value) {
			if (value) self.addClass('checked');
			else self.removeClass('checked');
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.field.radio');
				data.setChecked(value);
			});
		};

		return this.each(function () {
			var $this   = $(this);
			var plugin  = $this.data('jsea.plugin');
			var data    = $this.data('jsea.field.radio');
			var options = typeof option == 'object' && option;

			if (!plugin) $this.data('jsea.plugin', self);

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.field.radio', (data = new Radio(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.radio;

	$.fn.radio             = Plugin;
	$.fn.radio.Constructor = Radio;


	// RADIO NO CONFLICT
	// ===================

	$.fn.radio.noConflict = function () {
		$.fn.radio = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Property field element
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// FIELD.PROPERTY PUBLIC CLASS DEFINITION
	// ========================================

	var Property = function (element, options) {
		this.init('field.property', element, options);
	};

	Property.VERSION = '1.0.0';

	Property.DEFAULTS = $.extend({}, $.fn.field.Constructor.DEFAULTS, {
		type          : 'text',
		i18nPrefix    : null,
		delimiter     : ',',
		updated       : false
	});
	
	Property.DEFAULT_CONVERTERS = {
		text: function (value, options) { },
		charone: function (value, options) {
			if (value == null || value == '') return;
			var code = value;
			if (options.i18nPrefix != null && code != '') code = options.i18nPrefix + JSEA.Constants.I18N_KEY_SEPARATOR + code;
			this.text(JSEA.localizeMessage(code));
		},
		charones: function (value, options) {
			if (value == null || value == '') return;
			var values = value.split(options.delimiter);
			var localized = '';
			for (var i = 0; i < values.length; i++) {
				var code = values[i];
				if (options.i18nPrefix != null && code != '') code = options.i18nPrefix + JSEA.Constants.I18N_KEY_SEPARATOR + code;
				localized += JSEA.localizeMessage(code);
				if (i < values.length - 1) localized += options.delimiter;
			}
			this.text(localized);
		},
		file: function (value, options) {
			if (value == null || value == '') return;
			this.text('');
			LinkBuilder.build({
				name : 'download', 
				href : JSEA.getPageContext().resolveUrl(
						options.url || ((options.basename != null ? options.basename + JSEA.Constants.URL_SEPARATOR : '')
										+ options.funcname + JSEA.Constants.URL_SEPARATOR + 'download' + JSEA.Constants.URL_SEPARATOR + value)) 
			}).appendTo(this);
		},
		icon: function (value, options) {
			if (value == null || value == '') return;
			this.text('');
			this.addClass(value).attr(JSEA.Constants.ATTR_TOOLTIPS, options.i18nPrefix + JSEA.Constants.I18N_KEY_SEPARATOR + value);
			Tipbox.bind(this);
		},
		lines: function (value, options) {
			if (value == null || value == '') return;
			var separator = options.separator ? options.separator : JSEA.Constants.ARRAY_SEPARATOR;
			var values = value.split(separator);
			this.empty();
			for (var i = 0; i < values.length; i++) {
				if (values[i] != '') this.append($(document.createElement('P')).text(values[i]));
			}
		},
		mask: function (value, options) {
			if (value == null || value == '') return;
			if (value.length <= 6) this.addClass('mask');
			else {
				this.empty();
				var prefix = value.slice(0, 3);
				$(document.createElement('SPAN')).text(prefix).appendTo(this);
				var content = value.slice(3, value.length - 3);
				$(document.createElement('SPAN')).text(content).addClass('mask').appendTo(this);
				var suffix = value.slice(value.length - 3, value.length);
				$(document.createElement('SPAN')).text(suffix).appendTo(this);
			}
			this.attr(JSEA.Constants.ATTR_TOOLTIPS, value);
			Tipbox.bind(this);
		},
		rating   : function (value, options) {
			if (value == null) return;
			this.empty();
			var $ratingbar = $(document.createElement("div")).appendTo(this);
			$ratingbar.ratingbar();
			$ratingbar.ratingbar("setValue", value);
		}
	};

	// NOTE: FIELD.PROPERTY EXTENDS FIELD
	// ====================================

	Property.prototype = $.extend({}, $.fn.field.Constructor.prototype);

	Property.prototype.constructor = Property;

	Property.prototype.initField = function () {
		var updated = this.options.updated;
		if (updated) {
			this.$element.closest('li.data').addClass('updated');
		}
		var type = this.options.type;
		if (type) {
			var value     = this.$element.attr(JSEA.Constants.ATTR_VALUE);
			var converter = Property.DEFAULT_CONVERTERS[type];
			if (!converter) converter = Property.DEFAULT_CONVERTERS['text'];
			if ($.isFunction(converter)) {
				converter.apply(this.$element, [value, this.options]);
			}
			this.$element.closest('li.data').addClass(type);
		}
	};

	Property.prototype.getDefaults = function () {
		return Property.DEFAULTS;
	};

	Property.prototype.getOptions = function (options) {
		var propOptions = this.parseAttribute(JSEA.Constants.ATTR_PROPERTY_OPTIONS);
		
		options = $.extend(true, {}, this.getDefaults(), propOptions, options);
		
		return options;
	};

	// FIELD.PROPERTY PLUGIN DEFINITION
	// ==================================

	function Plugin(option) {
		return this.each(function () {
			var $this   = $(this);

			var data    = $this.data('jsea.field.property');
			var options = typeof option == 'object' && option;

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.field.property', (data = new Property(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.property;

	$.fn.property             = Plugin;
	$.fn.property.Constructor = Property;

	// FIELD.PROPERTY NO CONFLICT
	// ============================

	$.fn.property.noConflict = function () {
		$.fn.property = old;
		return this;
	};

} (jQuery);