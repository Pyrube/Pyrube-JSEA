/**
 * JSEA Validator component
 * The validator object has following options:
 * basename  : base name (string)
 * funcname  : function name (string)
 * property  : HTML text field name (string) 
 * msContainer: message set container for form validation (object)
 *       Tipbox for element tooltips
 *       Messages for messages box in Toolbar
 * i18nPrefix: i18n prefix for respective error message ([funcname].error.[property]), instead of default message (string)
 * @example
 * <input id="valid" type="text" jsea-valid-type='nulm' />
 * <input id="res" type="text" jsea-valid-type='nulm' jsea-valid-rules="{required:true, minLength:3, equalTo:'#valid'}" />
 * <input type="text" jsea-valid-type='email' jsea-valid-rules="{minLength:10, maxLength:30}"/>
 * <input type="text" jsea-valid-type='amount' jsea-valid-rules="{required:true, restriction:[AMOUNT_FIELD.maxLen, AMOUNT_FIELD.decLen], format:'money2'}"/>
 * <input type="text" jsea-valid-type='date' jsea-valid-rules="{required:true, format:'date'}"/>
 * $("input").validator();
 * $("input").validator({validType:'nulm', validRules:"{required:true, restriction:[AMOUNT_FIELD.maxLen, AMOUNT_FIELD.decLen]}"});
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 * @dependence: jQuery: jquery.alphanum.js, 
 * @dependence: Pyrube-JSEA: popup.js (tipbox plugin)
 */
(function ($) {
	'use strict';

	// VALIDATOR PUBLIC CLASS DEFINITION
	// ===================================
	var Validator = function (element, options) {
		this.type        = null;
		this.options     = null;
		this.$element    = null;
		this.tip         = null;
		this.init('validator', element, options);
	};

	Validator.VERSION = '1.0.0';
	
	Validator.DEFAULTS = {
		basename    : '',
		funcname    : '',
		property    : '',
		msContainer : Tipbox,
		i18nPrefix  : ''
	};
	
	Validator.Constants = {
		WHEN_EDIT       : 'E',
		WHEN_SUBMIT     : 'S',
		WHEN_BOTH       : 'B',
		STAT_INITIAL    : -1,
		STAT_PENDING    : -2,
		STAT_FAILED     :  0,
		STAT_OK         :  1
	};
	
	// validation settings:
	//     @events an array. event to trigger validation
	//     @when a string. E for user editing, S for form submitting and B as default for both
	Validator.SETTINGS = {
		nonnullCols : {
			when    : Validator.Constants.WHEN_SUBMIT,
			events  : ['rowchange']
		},
		unique    : {
			when    : Validator.Constants.WHEN_BOTH,
			events  : ['rowchange']
		},
		remote    : {
			when    : Validator.Constants.WHEN_EDIT,
			events  : ['blur']
		},
		required    : {
			when    : Validator.Constants.WHEN_BOTH,
			events  : ['focus', 'keyup', 'blur', 'change', 'choose', 'pull']
		},
		mimes     : {
			when    : Validator.Constants.WHEN_BOTH,
			events  : ['upload']
		}
	};
	
	// default error messages if validation failed
	Validator.ERROR_MESSAGES = {
		amount    : 'message.error.amount-format-invalid',
		date      : 'message.error.date-format-invalid',
		email     : 'message.error.email-invalid',
		url       : 'message.error.url-invalid',
		required  : 'message.error.field-empty',
		length    : 'message.error.length-invalid',
		minLength : 'message.error.length-too-short',
		maxLength : 'message.error.length-too-large',
		equalTo   : 'message.error.value-different',
		minValue  : 'message.error.value-too-little',
		maxValue  : 'message.error.value-too-great',
		unique    : 'message.error.value-duplicate',
		remote    : 'message.error.remote-pending',
		mimes     : 'message.error.mimes-invalid',
		nonnullCols : 'message.error.notnull-constraint-failed',
		uniqueIndex : 'message.error.unique-constraint-violated'
	};
	
	// restrictions
	Validator.RESTRICTIONS = {
		nul: //0 - 9; a - z; A - Z; _;
			function ($element) {
				$element.alphanum({
					allow: '_',
					allowSpace: false,
					allowOtherCharSets: false
				});
			},
		nulm: //0 - 9; a - z; A - Z; -; _;
			function ($element) {
				$element.alphanum({
					allow: '-_',
					allowSpace: false,
					allowOtherCharSets: false,
				});
			},
		nulms: // 0 - 9; a - z; A - Z; -; _; ' ';
			function ($element) {
				$element.alphanum({
					allow: '-_',
					allowOtherCharSets: false
				});
			},
		nulmad: //0 - 9; a - z; A - Z; -; _; .; @;
			function ($element) {
				$element.alphanum({
					allow: '-_.@',
					allowSpace: false,
					allowOtherCharSets: false
				});
			},
		nl: //0 - 9; a - z; A - Z;
			function ($element) {
				$element.alphanum({
					allowSpace: false,
					allowOtherCharSets: false
				});
			},
		nlmc: // 0 - 9; a - z; A - Z; ,; -;
			function ($element) {
				$element.alphanum({
					allow: ',-',
					allowSpace: false,
					allowOtherCharSets: false
				});
			},
		letter: // a - z;A - Z
			function ($element) {
				$element.alpha({
					allowSpace: false,
					allowOtherCharSets: false
				});
			},
		int: //0-9;-;
			function ($element) {
				$element.numeric({
					allowMinus: true,
					allowDecSep: false
				});
			},
		float: //type float number.
			function ($element) {
				$element.numeric({
					allowMinus: false,
					allowDecSep: true
				});
			},
		number: //0-9;
			function ($element) {
				$element.numeric({
					allowMinus: false,
					allowDecSep: false
				});
			},
		classpath: // a - z; A - Z; .;
			function ($element) {
				$element.alpha({
					allow: '.',
					allowSpace: false,
					allowOtherCharSets: false
				});
			},
		amount:
			function ($element, params) {
				if (params) {
					$element.numeric({
						maxDigits: params[0],
						maxDecimalPlaces: params[1]
					});
				}
			},
		telephone: //0-9;
			function ($element) {
				$element.numeric({
					allowMinus: false,
					allowDecSep: false
				});
			},
		mobile: //0-9;
			function ($element) {
				$element.numeric({
					allowMinus: false,
					allowDecSep: false
				});
			}
	};
	
	// validation types
	Validator.VALID_TYPES = {
		nul: { },
		nulm: { },
		nulms: { },
		nulmad: { },
		nl: { },
		nlmc: { },
		letter: { },
		int: { },
		float: { },
		number: { },
		classpath: { },
		amount: {
			format : 'money2'
		},
		telephone: { },
		mobile: { },
		date: {
			format : 'date'
		},
		email: {
			email: true
		},
		url: {
			url: true
		}
	};
	
	Validator.buildRuleParams = function (rules, name) {
		var params = rules[name];
		if (!$.isArray(params)) { params = [ params ]; }
		return(params);
	};

	Validator.prototype.init = function (type, element, options) {
		this.type      = type;
		this.$element  = $(element);
		this.$field    = this.$element.data('jsea.plugin') ? this.$element.data('jsea.plugin') : this.$element;
		this.options   = this.getOptions(options);
		
		this.$field.addClass("validate");
		
		// initialize valid rules
		this.initValidRules();
		// bind restriction
		this.bindRestriction();
		// bind events to trigger validation
		this.bindEvents();
	};

	Validator.prototype.initValidRules = function () {
		this.options.validRules 
			= $.extend({}, Validator.VALID_TYPES[this.options.validType] || {}, this.options.validRules);
		var validRules = this.options.validRules;
		if (validRules) {
			this.options.validStats = {};
			for (var ruleName in validRules) {
				this.options.validStats[ruleName] = Validator.Constants.STAT_INITIAL;
			}
		}
	};

	Validator.prototype.bindRestriction = function () {
		var validType  = this.options.validType;
		var validRules = this.options.validRules;
		var params = Validator.buildRuleParams(validRules, 'restriction');
		if ($.isFunction(Validator.RESTRICTIONS[validType])) {
			Validator.RESTRICTIONS[validType].apply(null, [this.$element, params]);
		}
	};
	
	Validator.prototype.bindEvents = function () {
		var $this = this;
		var fieldInst = $this.getJseaFieldInst();
		if (fieldInst != null) {
			fieldInst.validateEventBind();
		} else {
			$this.$element
				.unbind(".validate")
				.bind("focus.validate keyup.validate blur.validate change.validate choose.validate pull.validate rowchange.validate upload.validate",
					function (event, data) {
						$this.value = undefined;
						return (function () {
							if ($this.value != $this.$field.val()) {
								$this.value = $this.$field.val();
								return $this.perform(event.type);
							}
							return true;
						}) ();
					});
		}
	};
	
	Validator.prototype.prevalidate = function () {
		var $this = this;
		
		if (!!$this.$field.attr("disabled")) { return true; }
		
		var elemValid  = true;
		var ruleValid  = true;
		var needValid  = true;
		var validType  = $this.options.validType;
		var validRules = $this.options.validRules;
		if (validRules) {
			for (var ruleName in validRules) {
				ruleValid = ($this.options.validStats[ruleName] == Validator.Constants.STAT_OK);
				if (ruleValid) continue;
				else needValid   = ($this.options.validStats[ruleName] == Validator.Constants.STAT_INITIAL) 
								|| ($this.options.validStats[ruleName] == Validator.Constants.STAT_FAILED);
				if (needValid) {
					var ruler;
					if (!$.isFunction(validRules[ruleName])) {
						ruler = Page.Rule('valid')[(ruleName == 'format') ? validType : ruleName];
					} else {
						ruler = validRules[ruleName];
					}
					ruleValid = !($.isFunction(ruler) && !$this.executeRule(ruler, ruleName));
					if (!ruleValid) {
						elemValid = false;
					}
				}
			}
		}
		if (this.options.form && this.options.form.isValidatable()) {
			this.options.form.fireValidationEvent({source : this.getFieldName(), result : elemValid});
		}
		return elemValid;
	};
	
	Validator.prototype.perform = function (evtype) {
		var $this = this;
		
		// reset the class and tip if have the tip before validate
		$this.reset();

		if (!!$this.$field.attr("disabled")) { return true; }

		var elemValid  = true;
		var validType = $this.options.validType;
		var validRules = $this.options.validRules;
		if (validRules) {
			for (var ruleName in validRules) {
				if (Validator.SETTINGS[ruleName]) {
					if (Validator.SETTINGS[ruleName].when == Validator.Constants.WHEN_SUBMIT) continue;
					if ($.inArray(evtype, Validator.SETTINGS[ruleName].events) == -1) continue;
				}
				var ruler;
				if (!$.isFunction(validRules[ruleName])) {
					ruler = Page.Rule('valid')[(ruleName == 'format') ? validType : ruleName];
				} else {
					ruler = validRules[ruleName];
				}
				$this.options.validStats[ruleName] = Validator.Constants.STAT_PENDING;
				if ($.isFunction(ruler) && !$this.executeRule(ruler, ruleName)) {
					$this.error(ruleName);
					elemValid = false; 
					break;
				} else {
					$this.success(ruleName);
				}
			}
		}
		return elemValid;
	};
	
	Validator.prototype.validate = function () {
		var $this = this;
		
		// reset the class and tip if have the tip before validate
		$this.$field.removeClass("error");
		$this.hideTip();
		
		if (!!$this.$field.attr("disabled")) { return true; }
		
		var elemValid  = true;
		var ruleValid  = true;
		var needValid  = true;
		var validType  = $this.options.validType;
		var validRules = $this.options.validRules;
		if (validRules) {
			for (var ruleName in validRules) {
				ruleValid = ($this.options.validStats[ruleName] == Validator.Constants.STAT_OK);
				if (ruleValid) continue;
				else needValid   = ($this.options.validStats[ruleName] == Validator.Constants.STAT_INITIAL) 
								|| ($this.options.validStats[ruleName] == Validator.Constants.STAT_FAILED);
				if (Validator.SETTINGS[ruleName]) {
					if (Validator.SETTINGS[ruleName].when == Validator.Constants.WHEN_EDIT) needValid = false;
				}
				if (needValid) {
					var ruler;
					if (!$.isFunction(validRules[ruleName])) {
						ruler = Page.Rule('valid')[(ruleName == 'format') ? validType : ruleName];
					} else {
						ruler = validRules[ruleName];
					}
					ruleValid = !($.isFunction(ruler) && !$this.executeRule(ruler, ruleName));
					if (!ruleValid) {
						elemValid = false;
						$this.$field.addClass("error");
						if ($this.options.msContainer === Tipbox) {
							$this.tip = $this.buildMessage(ruleName, true);
							$this.showTip();
						} else {
							$this.options.msContainer.error($this.buildMessage(ruleName, false)).bind($this.getFieldName());
						}
					}
				}
			}
		}
		return elemValid;
	};
	
	Validator.prototype.getJseaFieldInst = function () {
		var jseaType = this.$element.attr('jsea-field-type');
		if (typeof jseaType != 'undefined' && jseaType != null && jseaType.length > 0) {
			var fieldInst = this.$element.data('jsea.' + jseaType);
			return fieldInst;
		}
		return null;
	};
	
	Validator.prototype.getFieldName = function () {
		var fieldName = null;
		var fieldInst = this.getJseaFieldInst();
		if (fieldInst != null) {
			fieldName = fieldInst.getFieldName();
		} else {
			fieldName = this.$element.attr("name");
		}
		return fieldName;
	};
	
	Validator.prototype.executeRule = function (ruler, ruleName) {
		var $this  = this;
		var value  = null;
		var fieldInst = $this.getJseaFieldInst();
		if (fieldInst != null) {
			value = fieldInst.getFieldValue();
		} else {
			value  = $this.$field.val();
		}
		var params = Validator.buildRuleParams($this.options.validRules, ruleName);
		return (ruler.apply($this, [value, params]));
	};
	
	Validator.prototype.buildMessage = function (ruleName, bDefault) {
		var $this  = this;
		var params = Validator.buildRuleParams($this.options.validRules, ruleName);
		var messageCode;
		if (bDefault) messageCode = Validator.ERROR_MESSAGES[(ruleName == 'format') ? $this.options.validType : ruleName];
		if (messageCode == undefined) messageCode = $this.options.i18nPrefix + '.' + ruleName;
		return JSEA.localizeMessage(messageCode, params);
	};
	
	Validator.prototype.showTip = function () {
		if ($.isFunction(this.$field.failure)) {
			this.$field.failure(this.tip);
		} else {
			Tipbox.error(this.$field, this.tip);
			this.$field.tipbox('show');
		}
	};
	
	Validator.prototype.hideTip = function () {
		if ($.isFunction(this.$field.rollback)) {
			this.$field.rollback();
		} else {
			this.$field.tipbox('destroy');
		}
	};
	
	Validator.prototype.setRequired = function (bRequired) {
		this.$field.setRequired(bRequired);
	};
	
	Validator.prototype.setStat = function (ruleName, stat) {
		this.options.validStats[ruleName] = stat;
	};
	
	Validator.prototype.error = function (ruleName, messageName) {
		if (messageName === undefined) messageName = ruleName;
		this.reset(ruleName);
		this.options.validStats[ruleName] = Validator.Constants.STAT_FAILED;
		this.$field.addClass("error");
		this.tip = this.buildMessage(messageName, true);
		this.showTip();
		if (this.options.form && this.options.form.isValidatable()) {
			this.options.form.fireValidationEvent({source : this.getFieldName(), result : false});
		}
	};
	
	Validator.prototype.success = function (ruleName, messageName, presented) {
		if (messageName === undefined) messageName = ruleName;
		this.reset(ruleName);
		this.options.validStats[ruleName] = Validator.Constants.STAT_OK;
		if (presented === true) this.$field.addClass("success");
		if (this.options.form && this.options.form.isValidatable()) {
			this.options.form.fireValidationEvent({source : this.getFieldName(), result : true});
		}
	};
	
	Validator.prototype.reset = function (ruleName) {
		this.options.validStats[ruleName] = Validator.Constants.STAT_INITIAL;
		this.$field.removeClass("success");
		this.$field.removeClass("error");
		this.hideTip();
	};
	
	Validator.prototype.destroy = function () {
		this.reset();
		this.$element.off(".validate").removeData('jsea.' + this.type);
		this.$field.removeClass("validate");
		this.$field = null;
	};
	
	Validator.prototype.resolveOptions = function () {
		var $element = this.$element;
		var property = this.getFieldName();
		return {
			property   : property,
			validType  : ($element.attr(JSEA.Constants.ATTR_VALID_TYPE) || undefined),
			validRules : (JSEA.Jsons.parse($element.attr(JSEA.Constants.ATTR_VALID_RULES)) || undefined)
		};
	};

	Validator.prototype.getDefaults = function () {
		return Validator.DEFAULTS;
	};
	
	Validator.prototype.getOptions = function (options) {
		options = $.extend({}, this.getDefaults(), this.resolveOptions(), options);
		
		if (!options.i18nPrefix) options.i18nPrefix = options.funcname + '.error.' + options.property;
			
		return options;
	};
	
	// VALIDATOR PLUGIN DEFINITION
	// =============================
	
	function Plugin(option) {
		var self = this;

		// VALIDATOR PUBLIC METHOD DEFINITION
		// ====================================
		
		self.prevalidate = function () {
			var isValid = true;

			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.validator');
				if(!data.prevalidate()) isValid = false;
			});
			
			return isValid;
		};
		
		self.perform = function (evtype) {
			var isValid = true;

			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.validator');
				if(!data.perform(evtype)) isValid = false;
			});
			
			return isValid;
		};
		
		self.validate = function () {
			var isValid = true;

			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.validator');
				if(!data.validate()) isValid = false;
			});
			
			return isValid;
		};
		
		self.reset = function () {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.validator');
				data.reset();
			});
		};
		
		self.rule = function (name, value) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.validator');
				data.options.validRules[name] = value;
			});
		};
		
		self.required = function (value) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.validator');
				data.options.validRules['required'] = value;
				data.setRequired(value);
				data.reset('required');
			});
		};
		
		self.destroy = function () {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.validator');
				data.destroy();
			});
		};
		
		return this.each(function () {
			var $this = $(this);
			var data = $this.data('jsea.validator');
			var options = typeof option == 'object' && option;

			if (!data && /destroy|validate/.test(option)) return;
			if (!data) $this.data('jsea.validator', (data = new Validator(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.validator;

	$.fn.validator             = Plugin;
	$.fn.validator.Constructor = Validator;
	
	// VALIDATOR NO CONFLICT
	// =======================
	
	$.fn.validator.noConflict = function () {
		$.fn.validator = old;
		return this;
	};
}) (jQuery);