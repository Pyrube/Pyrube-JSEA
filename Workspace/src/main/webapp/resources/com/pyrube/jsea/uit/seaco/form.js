/**
 * @(#) Project: Pyrube JSEA
 * 
 * 
 * Website: http://www.pyrube.com
 * Email: customercare@pyrube.com
 * Copyright Pyrube 2009. All rights reserved.
 */
/**
 * JSEA Form object

 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 */
JSEA.Form = function () {
	this.deferred = window.Form.defer();
};

JSEA.Form.VERSION  = '1.0.0';

JSEA.Form.prototype.init = function () {
	if ($.isArray(this.deferred)) {
		for (var i = 0; i < this.deferred.length; i++) {
			this.deferred[i]();
		}
	}
};

/**
 * The window.Form object for form utility
 */
window.Form = function (fn) {
	if (!window.Form.inits) window.Form.inits = [];
	window.Form.inits.push(fn);
};

window.Form.VERSION = '1.0.0';

window.Form.inits = null;

window.Form.rules = {
	grid  : {}
};

window.Form.defer = function () {
	if ($.isFunction(window.Form.init)) {
		if (!window.Form.inits) window.Form.inits = [];
		window.Form.inits.splice(0, 0, window.Form.init);
	}
	return window.Form.inits;
};

window.Form.inited = function () {
	window.Form.inits = null;
	delete window.Form.init;
	return true;
};

/**
 * JSEA Base form component
 * The Form object has following data:
 * robustness: the robustness to verify (array)
 * prev      : the previous form
 * next      : the next form
 * funcname  : function name (string)
 * operation : current form operation (string)
 * mode      : default operation mode for the operations below or action mode. (string)
 *             forward for page loading in ajax way; 
 *             popup for simple page loading in a popup;
 *             popdown for very simple page loading in a popdown;
 * operations: the standard default operations of this form (array)
 *           + more operations required in the nested form of this form (array)
 * actions   : the standard supported actions of this form (array)
 *           + more actions required for this form (array)
 * model     : the model object
 * meta      : the meta data of model object. key, type, status, etc
 * keyProp   : the property of primary key (string)
 * statProp  : the property of data status. the default is dataStatus (string)
 * args      : extra arguments. mostly used for Dialog.options.args from dialog
 * nested    : indicate whether this form is nested into/sub-data of main form, or message form. the default is false (boolean)
 * metaless  : indicate whether this form has no meta-data to bind
 * closeable : indicate whether this popped form can close manually. the default is false (boolean)
 * backable  : indicate whether this form can back to its previous form (boolean)
 * instance  : JSEA.Form instance
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// FORM.BASE PUBLIC CLASS EXTENDS ONE
	// ====================================

	class BaseForm extends One { 
		constructor (type, element, options) {
			super(type, element, options);
		};
	}

	BaseForm.VERSION  = '1.0.0';

	BaseForm.DEFAULTS = $.extend({}, One.DEFAULTS, {
		robustness    : null,
		prev          : null, // the previous form
		next          : null, // the next form
		id            : null, // the element id of this form
		url           : null,
		mode          : 'forward',
		model         : null,
		meta          : null,
		infobar       : null,
		basename      : null,
		funcname      : null,
		operation     : null,
		keyProp       : null,
		statProp      : null,
		nested        : false,
		poproxy       : null, // popping proxy
		popped        : false,
		metaless      : false,
		modifiable    : false,
		closeable     : false,
		backable      : false,
		instance      : null,
		operations    : [],
		messages      : null
	});

	BaseForm.Constants = {
		SLIDE_SPEED   : 600
	};

	BaseForm.prototype.init = function (type, element, options) {
		this.$super().init(type, element, options);
		this.type      = type;
		this.$element  = $(element);
		this.options   = this.getOptions(options);
		this.options.id       =  this.options.funcname + (this.options.operation != null ? this.options.operation.capitalize() : '') + 'Form';
		this.options.dataType =  this.options.funcname.toUpperCase();
		this.options.nested   = (this.options.args != null && this.options.args.nested !== undefined) ? this.options.args.nested : this.options.nested;
		this.options.prev    && (this.options.prev.options.next = this); // link onto the previous form

		var $this = this;

		// check if this form is robust
		if (!JSEA.ifRobust.apply(this, [])) return;

		// register this form first
		this.register();

		// initialize the info-bar
		this.initInfobar();

		Tipbox.bind(this.$element);

		// listener for form initializing
		this.$element.on('init.jsea', function () {
			$this.options.instance.init();
			$this.inited = window.Form.inited();
		});
		this.initForm();
		this.options.instance = new JSEA.Form();

		// initialize default events and respective events
		this.bindDefaultEvents();
		this.initEvents();

		// handle messages from back-end
		this.handleMessages();

		// fire the form initialization event at last
		this.fireInitializationEvent();
	};

	BaseForm.prototype.initInfobar = function () { 
		$(document.createElement('DIV')).infobar({
			label     : this.options.infobar,
			funcname  : this.options.funcname,
			operation : this.options.operation,
			model     : this.options.model
		}).prependTo(this.$element);
	}

	BaseForm.prototype.bindDefaultEvents = function () { 
		var $this = this;
		this.$element.on('validatesuccess.jsea', function () {
			var $this = this;
			$('.buttons > .btn.toggleable', $this.$element).removeClass('disabled').attr('disabled', false);
		}).on('validatefailed.jsea', function () {
			$('.buttons > .btn.toggleable', $this.$element).addClass('disabled').attr('disabled', true);
		});

		// trigger click event to backward previously. if no prev form, remove back button.
		if (!this.options.nested && this.options.backable) {
			if (this.options.prev == null)
				$(".buttons > .btn.back", this.$element).button('destroy').empty().remove();
			else 
				$(".buttons > .btn.back", this.$element).on('click.jsea', function () {
					return window.Page.triggerHandler("navigate.jsea", { action : function () { $this.backward(); } });
				});
		}

		// bind the event 'Close' if it is a popped form, and closeable also
		if (this.options.popped && this.options.closeable) {
			var poproxy = this.options.poproxy;
			poproxy.off('close.jsea').on('close.jsea', function () {
				$this.afterMoveout();
			});
			this.$element.on('close.jsea', function () {
				poproxy.close();
			});
			$('.buttons > .btn.close', this.$element).click(function () {
				$this.$element.trigger('close');
			});
		}
	};

	BaseForm.prototype.fireInitializationEvent = function (event) {
		if (this.inited) return false;
		if (this.asyncloadings !== undefined && !this.asyncloadings.isEmpty()) {
			if (event) this.asyncloadings.remove(this.asyncloadings.indexOf(event.source.guid()));
		}
		if (this.asyncloadings == undefined || this.asyncloadings.isEmpty()) {
			// trigger to initialize form
			this.$element.trigger('init');
			return true;
		}
		return false;
	};

	BaseForm.prototype.handleMessages = function () {
		Messages.clear();
		var messages = this.options.messages;
		if (messages != null && messages.length > 0) {
			Messages.clear();
			for (var i = 0; i < messages.length; i++) {
				var message = messages[i];
				Messages.add(message.level, message.code, message.params);
			}
		}
	};

	BaseForm.prototype.addAsyncloadingComponent = function (component) {
		if (this.asyncloadings === undefined) this.asyncloadings = new ArrayList();
		this.asyncloadings.add(component.guid());
	};

	BaseForm.prototype.addOperation = function (operation) {
		var $this = this;
		if (operation.enabled === undefined) {
			operation = $.extend(operation, {enabled: true});
		}
		$this.options.operations[operation.name] = operation;
		if (operation.enabled) $this.bindOperation(operation);
	};

	BaseForm.prototype.bindOperation = function (operation) {
		var $this = this;
		this.$element.on('click.jsea', '.' + operation.name, function () {
			if ($(this).hasClass('disabled')) return false
			operation.trigger = this;
			operation.method($this, operation);
			return false;
		});
	};

	BaseForm.prototype.resolveOperationUrl = function (operation) {
		var name   = operation.name;
		var url    = operation.url;
		var more   = operation.more;
		return url || JSEA.resolveUrl(this.options.basename, this.options.funcname, [more, name]);
	};

	BaseForm.prototype.resolveActionUrl = function (action) {
		var name   = action.name;
		var url    = action.url
		return url || JSEA.resolveUrl(this.options.basename, this.options.funcname, [this.options.operation, name]);
	};

	BaseForm.prototype.execute = function (operation) {
		var $trigger = $(operation.trigger);
		if ($trigger.hasClass("disabled")) return;
		$trigger.addClass("disabled");
		var opname = operation.name;
		var url    = this.resolveOperationUrl(operation);
		var params = {};
		if (operation.inline) {
			params = operation.params;
		}
		var mode = operation.mode;
		if (!mode) mode = this.options.mode;
		this[mode]($trigger, opname, url, params);
	};

	BaseForm.prototype.forward = function ($trigger, opname, url, params) {
		var $this = this;
		var accessUrl = JSEA.getPageContext().resolveUrl(url, params);
		$.ajax({
			url: accessUrl,
			data: params,
			method: 'POST',
			dataType: "html",
			beforeSend: function () {
				$trigger.waiting();
			},
			success: function (data) {
				// next form show
				$this.$element.parent().addClass('sliding-container');
				$this.$element.addClass('sliding-out');
				var $that = $(data).appendTo($this.$element.parent()).addClass('sliding-in');
				var callback = function () {
					setTimeout(function () {
						$this.$element.addClass('hidden');
						$that.addClass('visible');
						setTimeout(function () {
							$this.$element.hide()
								.removeClass('sliding-out')
								.removeClass('hidden');
							$that.removeClass('sliding-in')
								.removeClass('visible');
							$this.$element.parent()
								.removeClass('sliding-container');
							$trigger.waiting('hide');
							// after this form moves out
							$this.afterMoveout();
						}, BaseForm.Constants.SLIDE_SPEED);
					}, 10);
				};
				window.Page.formize($that, $this.forNextForm(accessUrl), callback);
			},
			error: function (xhr) { $trigger.waiting('hide'); }
		});
	};

	BaseForm.prototype.popup = function ($trigger, opname, url, params) {
		var $this = this;
		Dialog.open({
			owner     : this.$element.data('jsea.plugin'),
			url       : url,
			urlParams : params,
			async     : {
				before : function () { $trigger.waiting(); },
				success: function () { $trigger.waiting('hide'); },
				error  : function () { $trigger.waiting('hide'); }
			},
			complete  : function (rowData) {
				$this.refresh();
			}
		});
	};

	BaseForm.prototype.backward = function (saved, target) {
		// not first go in list, redirect to next edit page
		if (false) {
			// after this form moved out
			this.afterMoveout();
			location.href = CONTEXT_PATH + 'blank?target=' + encodeURIComponent(target);
		} else {
			var $this = this;
			var $prev = this.options.prev;
			if ($prev) {
				$this.$element.parent().addClass('sliding-container');
				$this.$element.addClass('sliding-out');
				$prev.$element.addClass('sliding-in').show();
				setTimeout(function () {
					$this.$element.addClass('hidden');
					$prev.$element.addClass('visible');
					setTimeout(function () {
						$this.$element.parent()
							.removeClass('sliding-container');
						$this.$element
							.removeClass('sliding-out')
							.removeClass('hidden');
						$prev.$element
							.removeClass('sliding-in')
							.removeClass('visible');
						// after this form moved out
						$this.afterMoveout();
					}, BaseForm.Constants.SLIDE_SPEED);
				}, 10);
				if (saved) $prev.refresh();
			} else {
				target = target || 'user/home';
				Message.onClose(function () { location.href = JSEA.getPageContext().resolveUrl('user/forward?target=' + encodeURIComponent(target)); });
				// move this form out
				$this.$element.parent().addClass('sliding-container');
				$this.$element.addClass('sliding-out');
				setTimeout(function () {
					$this.$element.addClass('hidden');
					setTimeout(function () {
						$this.$element.parent()
							.removeClass('sliding-container');
						$this.$element
							.removeClass('sliding-out')
							.removeClass('hidden');
						// after this form moved out
						$this.afterMoveout();
					}, BaseForm.Constants.SLIDE_SPEED);
				}, 10);
			}
		}
	};

	BaseForm.prototype.forNextForm = function (nextUrl) {
		return { prev : this, url : nextUrl };
	};

	BaseForm.prototype.isBackable = function () {
		return this.options.backable;
	};

	BaseForm.prototype.resolveNavigation = function (callback) {
		return {
			message: JSEA.localizeMessage("global.confirm.navigate"),
			okAction: callback.action != null ? callback.action : callback,
			cancelAction: null,
			extAction: null
		};
	};

	BaseForm.prototype.bindMeta = function (meta) {
		if (this.options.metaless) return;
		if (meta !== undefined) {
			this.options.meta = meta;
			Page.Toolbar.setData(meta);
		}
	};

	BaseForm.prototype.rebindMeta = function () {
		if (this.options.metaless) return;
		if (this.options.meta != null) {
			Page.Toolbar.setData(this.options.meta);
		}
	};

	BaseForm.prototype.unbindMeta = function () {
		if (this.options.metaless) return;
		if (this.options.meta != null) {
			Page.Toolbar.reset();
		}
	};

	BaseForm.prototype.afterMoveout = function () {
		if (this.options.next != null && this.options.next.isBackable()) return;
		this.release();
	};

	BaseForm.prototype.refresh = function () {
		window.Page.reload(this.$element.data('jsea.plugin'));
	};

	BaseForm.prototype.release = function () {
		// withdraw form first
		this.withdraw();
		// handle meta-data and unlink from the previous form
		// 1. unbind meta
		this.unbindMeta();
		if (this.options.prev != null) {
			// 2. re-bind meta for the previous form then
			this.options.prev.rebindMeta();
			// 3. unlink from the previous form
			this.options.prev.options.next = null;
		}
		// destroy form
		this.destroy();
		// remove form
		this.$element.empty().remove();
	};

	BaseForm.prototype.register = function () {
		if (this.options.nested) return;
		var formEntry = {
			funcname  : this.options.funcname,
			id        : this.options.id,
			url       : this.options.url,
			value     : this.$element.data('jsea.plugin')
		};
		window.Page.triggerHandler('formregistered.jsea', formEntry);
	};

	BaseForm.prototype.withdraw = function () {
		if (this.options.nested) return;
		var formEntry = {
			funcname  : this.options.funcname,
			id        : this.options.id,
			url       : this.options.url,
			value     : this.$element.data('jsea.plugin')
		};
		window.Page.triggerHandler('formwithdrew.jsea', formEntry);
	};

	BaseForm.prototype.destroy = function () {
		this.destroy0();
	};

	BaseForm.prototype.destroy0 = function () {
		this.enabled = false;
		// and then, destroy the JSEA objects in this form
		JSEA.destroy(this.$element);
		// and remove this JSEA form data
		this.$element
			.removeData(this.$element.attr(JSEA.Constants.ATTR_CLASS))
			.removeData('jsea.plugin');
		// destroy One at last
		this.$super().destroy();
	};

	BaseForm.prototype.getFuncname = function () {
		return this.options.funcname;
	};

	BaseForm.prototype.getDefaults = function () {
		return BaseForm.DEFAULTS;
	};

	BaseForm.prototype.getOptions = function (options) {
		var formOptions = this.parseAttribute(JSEA.Constants.ATTR_FORM_OPTIONS);
		var operations  = formOptions.operations;
		if (operations) {
			for (var operation of operations) {
				// make the form operations enabled
				if (typeof(operation) != 'string') operation.enabled = true;
			}
		}
		var actions     = formOptions.actions;
		if (actions) {
			for (var action of actions) {
				// make the form actions enabled
				if (typeof(action) != 'string') action.enabled = true;
			}
		}

		options = $.extend(true, {}, this.getDefaults(), this.$super().getOptions(options), formOptions, options);
		if (operations) options.operations.unshift(operations);
		if (actions)    options.actions.unshift(actions);
		return options;
	};
  
	// FORM.BASE PLUGIN DEFINITION
	// =============================

	function Plugin(option) {
		return this.each(function () {
			var $this = $(this);
			var data  = $this.data('jsea.form');
			var options = typeof option == 'object' && option;

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.form', (data = new BaseForm(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	// FORM.BASE REUSE METHOD DEFINITION
	// ===================================

	Plugin.prototype = $.extend({}, One.Plugin.prototype);

	Plugin.prototype.former = function () {
		var $prev$;
		this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			$prev$      = (data.options.prev != null) ? data.options.prev.$element.data('jsea.plugin') : undefined;
			return false;
		});
		return $prev$;
	};

	Plugin.prototype.funcname = function () {
		var funcname = null;
		this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			funcname    = data.getFuncname();
			return false;
		});
		return funcname;
	};

	Plugin.prototype.url = function (value) {
		if (!arguments.length) {
			this.each(function () {
				var $this   = $(this);
				var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
				value       = data.options.url;
				return false;
			});
			return value;
		} 
		return this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			data.optoins.url = value;
		});
	};

	Plugin.prototype.resolveNextOptions = function (url) {
		var formOptions = null;
		this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			formOptions = data.forNextForm(url);
			return false;
		});
		return formOptions;
	};

	Plugin.prototype.resolveNavigation = function (callback) {
		var navigateInfo = false;
		this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			navigateInfo  = data.resolveNavigation(callback);
			return false;
		});
		return navigateInfo;
	};

	Plugin.prototype.afterMoveout = function () {
		this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			data.afterMoveout();
		});
	};

	Plugin.prototype.release = function () {
		this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			data.release();
		});
	};

	var old = $.fn.baseform;

	$.fn.baseform             = Plugin;
	$.fn.baseform.Constructor = BaseForm;

	// FORM.BASE NO CONFLICT
	// =======================

	$.fn.baseform.noConflict = function () {
		$.fn.baseform = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Simple form component
 * validatable : indicate whether this simple form need validate (boolean)
 * modifiable: indicate whether this detail form need check it is modified when to navigate to another form (boolean)
 * excludeds : you can exclude elements from modification checking (boolean)

 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// FORM.SIMPLE PUBLIC CLASS DEFINITION
	// =====================================

	var SimpleForm = function (element, options) {
		this.init('form.simple', element, options);
	};

	SimpleForm.VERSION  = '1.0.0';

	SimpleForm.DEFAULTS = $.extend({}, $.fn.baseform.Constructor.DEFAULTS, {
		preHandler    : function () { return true; },
		preHandlers   : null,
		postHandler   : function () {},
		postHandlers  : null,
		validatable   : true,
		modifiable    : false,
		excludeds     : null,
	});

	// NOTE: FORM.SIMPLE EXTENDS FORM.BASE
	// =====================================
	
	SimpleForm.prototype = $.extend({}, $.fn.baseform.Constructor.prototype);

	SimpleForm.prototype.constructor = SimpleForm;

	SimpleForm.prototype.initForm = function () {
		var $this = this;
		// render JSEA components
		this.components = JSEA.objectize(this.$element, {
			form : this,
			basename : this.options.basename,
			funcname : this.options.funcname,
			msContainer : Messages
		});

		this.initPrimary();

		// cache form hash if it is a modifiable form
		if (this.options.modifiable) { window.Form(function () { $this.hashCache = $this.hashCode(); }); }
		// initialize the validator component
		if (this.options.validatable) { 
			// activate validation, if it is a validatable form
			this.validators = this.components['validator'];
			// pre-validate
			window.Form(function () { $this.validators.prevalidate(); });
		}

		this.initMeta();
	};

	SimpleForm.prototype.initPrimary = function () {};

	SimpleForm.prototype.initMeta = function () {};

	SimpleForm.prototype.initEvents = function () {
		this.initOperationEvents();
	};

	SimpleForm.prototype.initOperationEvents = function () {
		var $this = this;
		if (!this.options.nested) {
			// activate form operations
			var opnames = [];
			this.operations = [];
			for (var operation of this.options.operations) { // enabled operations for nested form of this form
				var isJson = false;
				var opname = (isJson = (typeof(operation) != 'string')) ? operation.name : operation;
				opnames.push(opname);
				if (isJson && operation.enabled) this.operations.push(operation);
			}
			$('.links > .lnk', this.$element).each(function () {  // link operations
				var $link$ = $(this).data('jsea.plugin');
				$this.operations.push($link$.postOptions());
			});
			for (var operation of this.operations) {
				this.bindOperation(
					$.extend(operation, {
						method: function ($this, _operation) { $this.execute(_operation); }
					})
				);
			}
		}
	};

	SimpleForm.prototype.fireValidationEvent = function (event) {
		var $this = this;
		var fieldname = event.source;
		var cached = (!$this.cached) ? ($this.cached = {}) : $this.cached;
		var oldEvent = cached[fieldname];
		if (oldEvent && oldEvent.result == event.result) {
			return false;
		}
		cached[fieldname] = event;
		var $fields = $this.validators.not('.disabled');
		var valid = true;
		var i = 0;
		for (var name in cached) {
			if (!cached[name].result) {
				valid = false;
				break;
			}
			i++;
		}
		// if all validatable fields are valid, trigger 'validatesuccess' event
		if ($fields.length > i || !valid) this.$element.trigger('validatefailed');
		else this.$element.trigger('validatesuccess');
	};

	SimpleForm.prototype.perform = function (action) {
		//clear error message first
		Messages.clear();
		// pre-handle before perform action
		if (this.options.preHandler && !this.options.preHandler()) return;
		if ($.isPlainObject(this.options.preHandlers)) {
			var actionPreHandler = this.options.preHandlers[action.name];
			if ($.isFunction(actionPreHandler) && !actionPreHandler()) return;
		}
		// check if validation is needed first
		if (this.options.validatable && !this.validators.validate()) return;
		// data for before action
		this.preAction();
		// do action
		var mode = action.mode;
		if (!mode) mode = this.options.mode;
		this[mode](action);
	};

	SimpleForm.prototype.save = function (action) {
		var $this = this;
		var url   = this.resolveActionUrl(action);
		// submit at last
		$this.$element.ajaxSubmit({
			beforeSubmit : function () {
				$this.$element.waiting({fixed : true});
			},
			url: JSEA.getPageContext().resolveUrl(url),
			dataType: action.dataType != null ? action.dataType : "json",
			success: function (data, stat, xhr) {
				$this.postAction(data);
				$this.$element.waiting('hide');
				if ($.isFunction(action.callback)) action.callback(data, xhr);
			},
			error : function (xhr) { $this.$element.waiting('hide'); },
			//this is called after the response or error functions are finished
			complete: function (xhr, status) { }
		});
	};

	/**
	 * extra data handling before action
	 */
	SimpleForm.prototype.preAction  = function () {};
	/**
	 * extra data handling after action success
	 */
	SimpleForm.prototype.postAction = function (data) {};

	SimpleForm.prototype.isModifiable = function () {
		return this.options.modifiable;
	};

	SimpleForm.prototype.isValidatable = function () {
		return this.options.validatable;
	};

	SimpleForm.prototype.ifModified = function () {
		return(this.hashCache != this.hashCode());
	};

	SimpleForm.prototype.hashCode = function () {
		return this.hashCode0();
	};

	SimpleForm.prototype.hashCode0 = function () {
		var excludeds = this.options.excludeds;
		if (!$.isArray(excludeds)) excludeds = [ excludeds ];
		var values = this.$element.map(function () {
			// Can add propHook for "elements" to filter or add form elements
			var elements = jQuery.prop( this, "elements" );
			return elements ? jQuery.makeArray( elements ) : this;
		})
		.filter(function () {
			if (excludeds.length == 0) return true;
			var elemIncluded = true;
			for (var i = 0; i < excludeds.length; i++) {
				if ($(excludeds[i]).find(this).size() > 0) {
					elemIncluded = false;
					break;
				} 
			}
			return elemIncluded;
		}).serialize();
		return MD5(values);
	};

	SimpleForm.prototype.destroy = function () {
		// delete all cached validators
		if (this.options.validatable) {
			if (!!this.cached) {
				for (var name in this.cached) {
					delete this.cached[name];
				}
			}
		}
		this.destroy0();
	};

	SimpleForm.prototype.getDefaults = function () {
		return SimpleForm.DEFAULTS;
	};

	// FORM.SIMPLE PLUGIN DEFINITION
	// ===============================

	function Plugin(option) {
		var self = this;

		// FORM.SIMPLE PUBLIC METHOD EXTENDS FORM.BASE
		// =============================================

		this.extend($.fn.baseform.prototype);

		self.perform = function (action) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.form.simple');
				data.perform(action);
			});
		};

		return this.each(function () {
			var $this = $(this);
			var plugin= $this.data('jsea.plugin');
			var data  = $this.data('jsea.form.simple');
			var options = typeof option == 'object' && option;

			if (!plugin) $this.data('jsea.plugin', self);

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.form.simple', (data = new SimpleForm(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	// FORM.SIMPLE REUSE METHOD EXTENDS FORM.BASE
	// ==========================================

	Plugin.prototype = $.extend({}, $.fn.baseform.prototype);

	Plugin.prototype.constructor = Plugin;

	Plugin.prototype.perform = function (action) {
		return this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			data.perform(action);
		});
	};

	Plugin.prototype.isModifiable = function () {
		var isModifiable = false;
		this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			isModifiable= data.isModifiable();
			return false;
		});
		return isModifiable;
	};

	Plugin.prototype.ifModified = function () {
		var isModified = false;
		this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			isModified  = data.ifModified();
			return false;
		});
		return isModified;
	};

	var old = $.fn.simpleform;

	$.fn.simpleform             = Plugin;
	$.fn.simpleform.Constructor = SimpleForm;

	// SIMPLEFORM NO CONFLICT
	// ========================

	$.fn.simpleform.noConflict = function () {
		$.fn.simpleform = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Grid form component
 * The form object has following data:
 * operation : current form operation. it is 'list' for the grid form (string)
 * operations: the standard default operations of this form (array)
 *     name       : operation name (string)
 *     enabled    : indicate whether this operation is active (boolean)
 *     url        : operation url. it is optional (string)
 *     mode       : operation mode, such as forward, submit, lookup, popup, openup etc (string)
 *     inline     : indicate whether this operation exists each row (boolean)
 *     dors       : indicate whether this operation dependences on row selected (boolean)
 *     trigger    : which element triggers this operation (HTMLElement)
 *     method     : invoked method (function)
 * filterable: indicate whether this grid form is filtered by search criteria. the default is true (boolean)
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// FORM.GRID PUBLIC CLASS DEFINITION
	// ===================================

	var GridForm = function (element, options) {
		this.init('form.grid', element, options);
	};

	GridForm.VERSION  = '1.0.0';

	GridForm.DEFAULTS = $.extend({}, $.fn.baseform.Constructor.DEFAULTS, {
		robustness: ['funcname', 'keyProp', 'statProp'],
		operation: 'list',
		typeProp: null,
		operations: [   { enabled : false, name : 'create', url : null, inline : false, dors : false },
						{ enabled : false, name : 'update', url : null, inline : true,  dors : false },
						{ enabled : false, name : 'delete', url : null, inline : true,  dors : false },
						{ enabled : false, name : 'view',   url : null, inline : true,  dors : false } ],
		filterable: true
	});

	// NOTE: FORM.GRID EXTENDS FORM.BASE
	// ==================================
	
	GridForm.prototype = $.extend({}, $.fn.baseform.Constructor.prototype);

	GridForm.prototype.constructor = GridForm;

	GridForm.prototype.initForm = function () {
		// initialize the grid object
		this.initPrimary();
		// initialize a search-box for this grid form
		if (this.options.filterable) { this.initSearchbox(); }
		// render JSEA components
		JSEA.objectize(this.$element);
	};

	GridForm.prototype.initPrimary = function () {
		var $this  = this;
		this.$grid = this.$element.find('.grid-container')
							.grid({
								funcname: this.options.funcname,
								url: this.buildGridUrl(),
								urlParams: this.moreGridParams(),
								rsProp: this.options.rsProp,
								async: true,
								onLoad: function () { $this.onGridLoad(); },
								onSelect0: function (rowIndex, rowData) { $this.onGridSelect(rowIndex, rowData); }
							});
	};

	GridForm.prototype.initSearchbox = function () {
		var $this = this;
		var funcbar = "<div class='funcbar'>" 
							+ "<div class='buttons'></div>" 
					+ "</div>";
		var fnSuccess = function () {
			var $contentElement = $this.$searchbox.getContentElement();
			$contentElement.append(funcbar).find('.buttons')
			.append(ButtonBuilder.build({
				name   : 'ok',
				method : function () {
					var searchParams = JSEA.serialize($("input, select, textarea", $contentElement));
					$this.$grid.search(searchParams);
					$this.$searchbox.hide();
				}
			}))
			.append(ButtonBuilder.build({
				name   : 'clear',
				//the clearFields method is in the jquery.form.js
				method : function () { $('input, select, textarea', $contentElement).clearFields(true).trigger('change'); }
			}));
		};
		var $button = $(JSEA.Constants.TAG_BUTTON + ".search", $this.$element);
		var url = JSEA.Jsons.parse($button.attr(JSEA.Constants.ATTR_BUTTON_OPTIONS)).url;
		url = $this.resolveSearchUrl(url);
		var funcname = $this.options.funcname;
		var options = {
			title   : JSEA.localizeMessage(funcname + '.infobar.' + funcname + '-search'),
			stylesheet: 'search',
			url     : url,
			async   : {
				success: fnSuccess
			}
		};
		this.$searchbox = $button.dropdown(options);
	};

	GridForm.prototype.resolveSearchUrl = function (url) {
		return this.resolveOperationUrl({ name : 'search', url : url });
	};

	GridForm.prototype.onGridLoad = function () {
		this.unbindMeta();
	};

	GridForm.prototype.onGridSelect = function (rowIndex, rowData) {
		JSEA.ifRobust.apply(this, ['prop', [this.options.keyProp, rowData]]);
		JSEA.ifRobust.apply(this, ['dataType', [rowData]]);
		JSEA.ifRobust.apply(this, ['prop', [this.options.statProp, rowData]]);
		this.bindMeta({
			funcname : this.options.funcname,
			operation: this.options.operation,
			key      : JSEA.Jsons.formatProperty(rowData, this.options.keyProp),
			type     : this.options.typeProp ? JSEA.Jsons.formatProperty(rowData, this.options.typeProp) : this.options.dataType,
			status   : JSEA.Jsons.formatProperty(rowData, this.options.statProp)
		});
	};

	GridForm.prototype.buildGridUrl = function () { 
		return this.resolveOperationUrl({ name: 'list' });
	};

	GridForm.prototype.moreGridParams = function () { 
		return JSEA.serialize($("input, select, textarea", this.$element)); 
	};

	GridForm.prototype.initEvents = function () {
		this.initOperationEvents();
	};

	GridForm.prototype.initOperationEvents = function () {
		var $this = this;
		// activate operations
		var opnames     = [];
		this.operations = this.$grid.getOperations(); // grid operations. array of operations [{name : '', url : '', mode : '' ...}]
		for (var operation of this.operations) {
			opnames.push(operation.name);
			operation.inline = true;
		}
		for (var operation of this.options.operations) { // more operations for nested form of this form
			var isJson = false;
			var opname = (isJson = (typeof(operation) != 'string')) ? operation.name : operation;
			opnames.push(opname);
			if (isJson && operation.enabled) this.operations.push(operation); // 
		}
		$('.buttons > .btn:not(.close,.back)', this.$element).each(function () {  // button operations
			var $button$    = $(this).data('jsea.plugin');
			var postOptions = $button$.postOptions();
			postOptions.inline = false;
			$this.operations.push(postOptions);
		});
		for (var operation of this.operations) {
			if (operation.inline) {
				this.$grid
					.addRowListener(operation.name, 
							function (_operation) {
								_operation.inline = true;
								$this.execute(_operation);
							});
			} else {
				this.bindOperation(
					$.extend(operation, { 
						method: function ($this, _operation) { $this.execute(_operation); }
					})
				);
			}
		}
	};

	GridForm.prototype.bindOperation = function (operation) {
		var $this = this;
		$('.' + operation.name, $this.$element).not('.disabled')
			.bind('click.jsea', function () {
				operation = $.extend(operation, { trigger: this });
				if (operation.dors && !$this.$grid.hasSection()) {
					Message.info('message.info.no-record-selected');
					return false;
				}
				operation.method($this, operation);
				return false;
			});
	};

	GridForm.prototype.moreOperationParams = function () { 
		return JSEA.serialize($("input, select, textarea", this.$element)); 
	};

	GridForm.prototype.execute = function (operation) {
		var $trigger = $(operation.trigger);
		if ($trigger.hasClass("disabled")) return;
		$trigger.addClass("disabled");
		var opname = operation.name;
		var url    = this.resolveOperationUrl(operation);
		var params = {};
		if (operation.inline) {
			params = operation.params;
		} else if (operation.dors) {
			params = this.$grid.getSectionPost();
		}
		params = $.extend(true, {}, params, this.moreOperationParams());
		operation.params = params;
		var mode = operation.mode;
		if (!mode) mode = this.options.mode;
		this[mode]($trigger, opname, url, params);
	};

	GridForm.prototype.lookup = function ($trigger, opname, url, params) {
		var $this = this;
		Lookup.open({
			url       : url,
			urlParams : params,
			args      : $.extend({}, params),
			async     : {
				before : function () { $trigger.waiting(); },
				success: function () { $trigger.waiting('hide'); },
				error  : function () { $trigger.waiting('hide'); }
			},
			complete  : function (rowData) {
				$this.refresh();
			}
		});
	};

	GridForm.prototype.popdown = function ($trigger, opname, url, params) {
		var $this = this;
		var funcname = this.options.funcname;
		Popdown.request({
			trigger   : $trigger,
			title     : JSEA.localizeMessage(funcname + '.infobar.' + funcname + '-' + opname),
			url       : url,
			urlParams : params,
			async     : {
				before : function () { $trigger.waiting(); },
				success: function () { $trigger.waiting('hide'); },
				error  : function () { $trigger.waiting('hide'); }
			},
			complete  : function (rowData) {
				$this.refresh();
			}
		});
	};

	GridForm.prototype.async = function ($trigger, opname, url, params) {
		var $this = this;
		$.ajax({
			url: CONTEXT_PATH + url,
			data: params,
			method: 'POST',
			dataType: "json",
			beforeSend: function () {
				$trigger.waiting();
			},
			success: function (data) {
				$trigger.waiting('hide');
				$this.refresh();
				Message.success($this.options.funcname + ".success." + opname);
			},
			error: function (xhr) {
				$trigger.waiting('hide');
			}
		});
	};

	GridForm.prototype.refresh = function () {
		this.$grid.reload();
	};

	GridForm.prototype.getProperty = function (propName) {
		return $('input[name="' + propName + '"]', this.$element).val();
	};

	GridForm.prototype.destroy = function () {
		if (this.$grid) { this.$grid.grid('destroy'); }
		this.$grid = null;
		if (this.options.filterable) {
			this.$searchbox.dropdown('destroy');
		}
		this.$searchbox = null;
		this.destroy0();
	};

	GridForm.prototype.getDefaults = function () {
		return GridForm.DEFAULTS;
	};
 
	// GRIDFORM PLUGIN DEFINITION
	// ============================

	function Plugin(option) {
		var self = this;

		// FORM.GRID PUBLIC METHOD EXTENDS FORM.BASE
		// ===========================================

		this.extend($.fn.baseform.prototype);

		return this.each(function () {
			var $this = $(this);
			var plugin= $this.data('jsea.plugin');
			var data  = $this.data('jsea.form.grid');
			var options = typeof option == 'object' && option;

			if (!plugin) $this.data('jsea.plugin', self);

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.form.grid', (data = new GridForm(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	// FORM.GRID REUSE METHOD EXTENDS FORM.BASE
	// ==========================================

	Plugin.prototype = $.extend({}, $.fn.baseform.prototype);

	Plugin.prototype.constructor = Plugin;

	var old = $.fn.gridform;

	$.fn.gridform             = Plugin;
	$.fn.gridform.Constructor = GridForm;

	// GRIDFORM NO CONFLICT
	// ======================

	$.fn.gridform.noConflict = function () {
		$.fn.gridform = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Lookup form component
 * The form object has following data:
 * operation : current form operation. it is 'lookup' for the lookup form (string)
 * mode      : default operation mode. (string)
 *             choose for choosing one data and return it back to opener; 
 * operations: default operations (json)
 * returnProps : the properties to return values back to invoker (array)
 * args : arguments of this lookup dialog, which is used as url parameters for the inner grid object (json) 
 * closeable : indicate whether this lookup dialog can close. the default is true (boolean)
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// FORM.LOOKUP PUBLIC CLASS DEFINITION
	// =====================================

	var LookupForm = function (element, options) {
		this.init('form.lookup', element, options);
	};

	LookupForm.VERSION  = '1.0.0';

	LookupForm.DEFAULTS = $.extend({}, $.fn.gridform.Constructor.DEFAULTS, {
		robustness: ['funcname'],
		operation: 'lookup',
		mode: 'choose',
		operations: [{ enabled : true, name : 'select', inline : false, dors : true }],
		args       : null,
		returnProps: null,
		poproxy    : Lookup,
		popped     : true,
		closeable  : true
	});

	// NOTE: FORM.LOOKUP EXTENDS FORM.GRID
	// =====================================
	
	LookupForm.prototype = $.extend({}, $.fn.gridform.Constructor.prototype);

	LookupForm.prototype.constructor = LookupForm;

	LookupForm.prototype.resolveSearchUrl = function (url) {
		return this.resolveOperationUrl({ name : 'search', url : url, more : 'lookup' });
	};

	LookupForm.prototype.buildGridUrl = function () {
		return this.resolveOperationUrl({ name : 'list', more : 'lookup' });
	};

	LookupForm.prototype.moreGridParams = function () {
		return this.options.args;
	};

	LookupForm.prototype.onGridLoad = function () {
		Lookup.reposition();
	};

	LookupForm.prototype.onGridSelect = function (rowIndex, rowData) { };

	LookupForm.prototype.choose = function ($trigger, opname, url, params) {
		var $this = this;
		var sectionData = $this.$grid.getSectionData();
		if(!$.isArray(sectionData)) sectionData = [sectionData];
		var returnProps = $this.options.returnProps;
		var rs = [];
		for (var i = 0; i < sectionData.length; i++) {
			var rowData = sectionData[i];
			var eachData = {};
			for (var j = 0; j < returnProps.length; j++) {
				var propName = returnProps[j];
				eachData[propName] = rowData[propName];
			}
			rs.push(eachData);// eachData is [{sampleCode:'001',sampleName:'NAME OF 001'},{sampleCode:'002',sampleName:'NAME OF 002'}]
		}
		Lookup.finish($this.$grid.isMultiple() ? rs : rs[0]);
	};

	LookupForm.prototype.getDefaults = function () {
		return LookupForm.DEFAULTS;
	};

	// FORM.LOOKUP PLUGIN DEFINITION
	// ===============================

	function Plugin(option) {
		var self = this;

		// FORM.LOOKUP PUBLIC METHOD EXTENDS FORM.GRID
		// =============================================

		this.extend($.fn.gridform.prototype);

		return this.each(function () {
			var $this = $(this);
			var plugin= $this.data('jsea.plugin');
			var data  = $this.data('jsea.form.lookup');
			var options = typeof option == 'object' && option;

			if (!plugin) $this.data('jsea.plugin', self);

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.form.lookup', (data = new LookupForm(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.lookupform;

	$.fn.lookupform             = Plugin;
	$.fn.lookupform.Constructor = LookupForm;

	// FORM.LOOKUP NO CONFLICT
	// =========================

	$.fn.lookupform.noConflict = function () {
		$.fn.lookupform = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Detail form component
 * The form object has following data:
 * mode      : the action mode, default is savexit
 *             savexit for save data and then exit; 
 *             save for just save data; 
 * refProp   : the property for reference to primary key (string)
 * rsnProp   : the property for reason to reject (string)
 * actions   : the standard supported actions of this form (array)
 *           + more actions required for this form (array)
 * resetable : indicate whether this detail form can reset (boolean)
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// FORM.DETAIL PUBLIC CLASS DEFINITION
	// =====================================
	var DetailForm = function (element, options) {
		this.init('form.detail', element, options);
	};

	DetailForm.VERSION  = '1.0.0';

	DetailForm.DEFAULTS = $.extend({}, $.fn.simpleform.Constructor.DEFAULTS, {
		robustness      : ['funcname', 'operation', 'keyProp', 'statProp', 'dataType'],
		mode            : 'savexit',
		refProp         : null,
		rsnProp         : 'comments',
		actions         : ['abort', 'save', 'submit', 'reject', 'approve'],
		more            : null,
		rawUsed         : false,
		resetable       : true,
		backable        : true
	});

	// NOTE: FORM.DETAIL EXTENDS FORM.SIMPLE
	// =======================================
	
	DetailForm.prototype = $.extend({}, $.fn.simpleform.Constructor.prototype);

	DetailForm.prototype.constructor = DetailForm;
	
	DetailForm.prototype.initPrimary = function () {
		var $this    = this;
		// activate row listeners of grids
		$('*[' + JSEA.Constants.ATTR_GRID_OPTIONS + ']', this.$element).each(function () {
			var $grid = $(this).grid({ 
				funcname : $this.options.funcname,
				onLoad   : function () {
					$this.fireInitializationEvent({
						source : this,
						result : true
					});
				}
			});
			var operations = $grid.getOperations(); // grid operations
			for (var i = 0; i < operations.length; i++) {
				var fn = Page.Method('grid', operations[i].name);
				if ($.isFunction(fn)) {
					$grid.addRowListener(operations[i].name, fn);
				}
			}
			$this.addAsyncloadingComponent($grid);
		});
		// stylize buttons
		$('*[' + JSEA.Constants.ATTR_BUTTON_OPTIONS + ']', this.$element).each(function () {
			var $button$ = $(this).data('jsea.plugin');
			$button$.stylize($this.options.model);
		});
	};

	DetailForm.prototype.initMeta = function () {
		if (!this.options.nested) {
			// prepare data information for Toolbar if this form is not nested
			// comments out as below, just bind data onto toolbar, no robust needed for some special forms (e.x. Note)
			/**JSEA.ifRobust.apply(this, ['field', [this.options.keyProp]]);
			JSEA.ifRobust.apply(this, ['field', [this.options.statProp]]); */
			this.bindMeta({
				funcname : this.options.funcname,
				operation: this.options.operation,
				key      : this.getProperty(this.options.keyProp),
				type     : this.options.dataType,
				status   : this.getProperty(this.options.statProp)
			});
		}
	};

	DetailForm.prototype.initEvents = function () {
		var $this = this;
		
		// reset event
		if (!this.options.nested && this.options.resetable) {
			$(".buttons > .btn.reset", this.$element).on('click.jsea', function () {
				var $resetBtn = $(this);
				if ($resetBtn.attr('type') != 'reset') {
					$resetBtn.attr('type', 'reset');
					$resetBtn.trigger('click');
				}
				$this.reset();
			});
		}
		// initialize events of operations
		this.initOperationEvents();
		// initialize events of actions
		this.initActionEvents();
	};

	DetailForm.prototype.initActionEvents = function () {
		var $this = this;
		if (!this.options.nested) {
			// activate form actions
			var actnames = [];
			this.actions = []; // array of actions [{name : '', url : '', mode : '' ...}]
			for (var action of this.options.actions) { // enabled actions for nested form of this form
				var isJson = false;
				var actname = (isJson = (typeof(action) != 'string')) ? action.name : action;
				actnames.push(actname);
				if (isJson && action.enabled) this.actions.push(action); // 
			}
			$('.buttons > .btn:is(.' + actnames.join(',.') + ')', this.$element).each(function () {  // button actions
				var $button$ = $(this).data('jsea.plugin');
				$this.actions.push($button$.postOptions());
			});
			for (var action of this.actions) {
				this.bindAction(
					$.extend(action, {
						method: function ($this, _action) { $this.perform(_action); }
					})
				);
			}
		}
	};

	DetailForm.prototype.bindAction = function (action) {
		var $this = this;
		this.$element.on('click.jsea', JSEA.Constants.TAG_BUTTON + "." + action.name,
			function (evt) {
				var btnOptions = JSEA.Jsons.parse($(this).attr(JSEA.Constants.ATTR_BUTTON_OPTIONS));
				var _action = $.extend(true, {}, action, {
					url     : btnOptions.url,
					trigger : this
				});
				if (btnOptions.yesno) {
					var button = this;
					Yesno.request(JSEA.localizeMessage(btnOptions.yesno), 
							function () { 	
								$this.setProperty($this.options.flagProp, JSEA.Constants.YES);
								if (btnOptions.reason) {
									Reject.request(button, function (comments) { $this.setProperty($this.options.rsnProp, comments); _action.method($this, _action); });
								} else {
									_action.method($this, _action); 
								}
							},
							function () { 	
								$this.setProperty($this.options.flagProp, JSEA.Constants.NO);
								if (btnOptions.reason) {
									Reject.request(button, function (comments) { $this.setProperty($this.options.rsnProp, comments); _action.method($this, _action); });
								} else {
									_action.method($this, _action); 
								}
							}
					);
				} else if (btnOptions.confirm) {
					//refNo is not necessary to check robust when customized confirm[method] function not use refNo
					//JSEA.ifRobust.apply($this, ['field', [$this.options.refProp]]);
					var refNo   = $this.getProperty($this.options.refProp);
					var methods = btnOptions.confirm.split(',').reverse();
					var invoke  = function (method, okCallback) {
						if (Confirm[method]) {
							Confirm[method](refNo, okCallback);
						} else {
							var message = $.isFunction(window[method]) ? window[method]() : method;
							(message != null)
								? Confirm.request(JSEA.localizeMessage(message, refNo), okCallback)
								: okCallback();
						}
					};
					var onConfirm = function () {
						invoke(methods.pop(), function () { 
							(methods.length != 0) ? onConfirm() : _action.method($this, _action);
						});
					};
					onConfirm.apply();
				} else if (btnOptions.reason) {
					JSEA.ifRobust.apply($this, ['field', [$this.options.rsnProp]]);
					Reject.request(this, function (comments) { $this.setProperty($this.options.rsnProp, comments); _action.method($this, _action); });
				} else {
					_action.method($this, _action); 
				}
				if (evt) {
					evt.preventDefault();
					evt.stopPropagation();
				}
			});
	};

	DetailForm.prototype.preAction  = function () {
		var $this = this;
		// check if raw data will be used
		if (this.options.rawUsed) {
			//the serializeJson may be like {sampleName : 'sample001', formats : ['XLS', 'PDF']}
			var data = JSEA.serialize(this.$element);
			this.raw = this.toRawData(data);
		}
		// change grid data to post fields (formatted) then
		$('*[' + JSEA.Constants.ATTR_GRID_OPTIONS + ']', this.$element).each(function () {
			var $grid = $(this).grid();
			$grid.genPostFields(); 
			if ($this.options.rawUsed) {
				$.extend($this.raw, $grid.getData());
			}
		});
	};

	DetailForm.prototype.postAction  = function (data) {
		// reset raw data
		if (this.options.rawUsed) { this.raw = $.extend(this.raw, data); }
	};

	DetailForm.prototype.savexit = function (action) {
		var $this = this;
		$.extend(action, { callback : function (data, xhr) {
			Message.success(action.success || ($this.options.funcname + '.success.' + $this.options.operation + JSEA.Constants.I18N_KEY_SEPARATOR + action.name));
			$this.backward(true, xhr.getResponseHeader('Target-Url'));
		} });
		this.save(action);
	};

	DetailForm.prototype.async = function (action) {
		var $this = this;
		$.extend(action, { callback : function (data, xhr) {
			Message.success(action.success || ($this.options.funcname + '.success.' + $this.options.operation + JSEA.Constants.I18N_KEY_SEPARATOR + action.name));
			if ($.isPlainObject($this.options.postHandlers)) {
				var actionPostHandler = $this.options.postHandlers[action.name];
				if ($.isFunction(actionPostHandler)) actionPostHandler(data, xhr);
			}
		} });
		this.save(action);
	};

	DetailForm.prototype.redirect = function (action) {
		var $this = this;
		$.extend(action, { dataType: 'html', callback : function (data) {
			$this.$element.after(data);
			var $next = $this.$element.next();
			$this.$element.remove();
			$next.detailform({gridform : $this.options.gridform});
		} });
		this.save(action);
	};

	DetailForm.prototype.download = function (action) {
		this.submit(action);
	};

	DetailForm.prototype.openup = function (action) {
		var $this = this;
		var winName = 'target_win_' + ((new Date()).getTime());
		var left = (screen) ? (screen.availWidth - 800) / 2 : 300;
		var top = (screen) ? (screen.availHeight - 600) / 2 : 300;
		var url = this.resolveActionUrl(action);
		$this.$element[0].target = winName;
		window.open("blank.jsp", winName, 'left='
								+ left
								+ ', top='
								+ top
								+ ', menubar=no, toolbar=no, location=no, scrollbars=yes, resizable=yes, width=800, height=600');
		$this.$element.attr('action', JSEA.getPageContext().resolveUrl(url));
		$this.$element.get(0).submit();
	};

	DetailForm.prototype.submit = function (action) {
		var $this = this;
		var url   = this.resolveActionUrl(action);
		$this.$element.attr('action', JSEA.getPageContext().resolveUrl(url));
		$this.$element.get(0).submit();
	};

	DetailForm.prototype.popup = function (action) {
		var $this = this;
		// get data from page element
		var arr   = $this.$element.formToArray();
		var url   = this.resolveActionUrl(action);
		var param = $.param(arr);
		//
		Dialog.open({
			url       : url,
			urlParams : param,
			complete : function (returnData) {
				if ($.isFunction(action.callback)) action.callback(returnData);
			}
		});
	};

	DetailForm.prototype.reset = function () {
		this.$element.find('*[jsea-field-type]').each(function () {
			var $element = $(this);
			var jseaType = $element.attr('jsea-field-type');
			var $fieldInst = $element.data('jsea.' + jseaType);
			$fieldInst.reset();			
		});	
	};

	DetailForm.prototype.getProperty = function (name) {
		return $('input[name="' + name + '"]', this.$element).val();
	};

	DetailForm.prototype.setProperty = function (name, value) {
		$('input[name="' + name + '"]', this.$element).val(value);
	};

	DetailForm.prototype.hashCode = function () {
		// change grid data to post fields (formatted) first
		$('*[' + JSEA.Constants.ATTR_GRID_OPTIONS + ']', this.$element).each(function () {
			var $grid = $(this).grid();
			$grid.genPostFields(); 
		});
		return this.hashCode0();
	};
	
	DetailForm.prototype.getDefaults = function () {
		return DetailForm.DEFAULTS;
	};

	// FORM.DETAIL PLUGIN DEFINITION
	// ===============================

	function Plugin(option) {
		var self = this;

		// FORM.DETAIL PUBLIC METHOD EXTENDS FORM.SIMPLE
		// ===============================================

		this.extend($.fn.simpleform.prototype);

		return this.each(function () {
			var $this = $(this);
			var plugin= $this.data('jsea.plugin');
			var data  = $this.data('jsea.form.detail');
			var options = typeof option == 'object' && option;

			if (!plugin) $this.data('jsea.plugin', self);

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.form.detail', (data = new DetailForm(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	// FORM.DETAIL REUSE METHOD EXTENDS FORM.SIMPLE
	// ==============================================

	Plugin.prototype = $.extend({}, $.fn.simpleform.prototype);

	Plugin.prototype.constructor = Plugin;

	var old = $.fn.detailform;

	$.fn.detailform             = Plugin;
	$.fn.detailform.Constructor = DetailForm;

	// DETAILFORM NO CONFLICT
	// ========================

	$.fn.detailform.noConflict = function () {
		$.fn.detailform = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Popup form component
 * The form object has following data:
 * mode      : the action mode, default is savexit
 *             saveclose for save data and then close this popup
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// FORM.POPUP PUBLIC CLASS DEFINITION
	// ====================================
	var PopupForm = function (element, options) {
		this.init('form.popup', element, options);
	};

	PopupForm.VERSION  = '1.0.0';

	PopupForm.DEFAULTS = $.extend({}, $.fn.detailform.Constructor.DEFAULTS, {
		robustness: [],
		mode: 'saveclose',
		returnProps: null,
		poproxy: null, // popping proxy, Dialog or Popdown.Popbox
		popped: true,
		rawUsed: true,
		modifiable: false,
		backable: false,
		closeable: true
	});

	// NOTE: FORM.POPUP EXTENDS FORM.DETAIL
	// ======================================
	
	PopupForm.prototype = $.extend({}, $.fn.detailform.Constructor.prototype);

	PopupForm.prototype.constructor = PopupForm;
	
	PopupForm.prototype.okay = function (action) {
		this.options.poproxy.finish(this.raw);
	};
	
	PopupForm.prototype.saveclose = function (action) {
		var $this = this;
		$.extend(action, { callback : function () {
			Message.success(action.success || ($this.options.funcname + '.success.' + $this.options.operation + JSEA.Constants.I18N_KEY_SEPARATOR + action.name));
			$this.okay(action);
		} });
		this.save(action);
	};
	
	PopupForm.prototype.toRawData = function (data) {
		var clone = $.extend(true, {}, data);
		var returnProps = this.options.returnProps;
		// use returnProps to parse data from field.
		if ($.isArray(returnProps)) {
			for (var i = 0; i < returnProps.length; i++) {
				var prop = returnProps[i];
				var propName = returnProps[i];
				if (prop.indexOf(JSEA.Constants.PROP_DELIM) > 0) {
					var a = prop.split(JSEA.Constants.PROP_DELIM);
					propName = a[0]; 
				}
				JSEA.Jsons.setProperty(clone, propName, JSEA.Jsons.parseProperty(clone, prop));
			}
		}
		return clone;
	};
	
	PopupForm.prototype.getDefaults = function () {
		return PopupForm.DEFAULTS;
	};
  
	// FORM.POPUP PLUGIN DEFINITION
	// ==============================

	function Plugin(option) {
		var self = this;

		// FORM.POPUP PUBLIC METHOD EXTENDS FORM.DETAIL
		// ==============================================

		this.extend($.fn.detailform.prototype);

		self.validate = function (value) {
			var isValid = true;
			//clear error message first
			Messages.clear();
			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.form.popup');
				if(data.options.validatable && !data.validators.validate()) isValid = false;
			});
			return isValid;
		};
		
		return this.each(function () {
			var $this = $(this);
			var plugin= $this.data('jsea.plugin');
			var data  = $this.data('jsea.form.popup');
			var options = typeof option == 'object' && option;

			if (!plugin) $this.data('jsea.plugin', self);

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.form.popup', (data = new PopupForm(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.popupform;

	$.fn.popupform             = Plugin;
	$.fn.popupform.Constructor = PopupForm;

	// FORM.POPUP NO CONFLICT
	// ========================

	$.fn.popupform.noConflict = function () {
		$.fn.popupform = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Wizard form component
 * 
 * @author Aranjuez
 * @version Oct 01, 2023
 * @since Pyrube-JSEA 1.1
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// FORM.WIZARD PUBLIC CLASS DEFINITION
	// =====================================
	var WizardForm = function (element, options) {
		this.init('form.wizard', element, options);
	};

	WizardForm.VERSION  = '1.1.0';

	WizardForm.DEFAULTS = $.extend({}, $.fn.detailform.Constructor.DEFAULTS, {
		robustness  : ['funcname', 'operation', 'keyProp', 'statProp'],
		current     : 0,
		actions     : [ { enabled : true, name : 'previous', mode : 'previous' }, 
						{ enabled : true, name : 'next',     mode : 'next' }, 
						{ enabled : true, name : 'ok',       mode : 'submit' }],
		metaless    : true,
		validatable : false
	});

	// NOTE: FORM.WIZARS EXTENDS FORM.DETAIL
	// =======================================
	
	WizardForm.prototype = $.extend({}, $.fn.detailform.Constructor.prototype);

	WizardForm.prototype.constructor = WizardForm;

	WizardForm.prototype.initPrimary = function () {
		this.$wizard = this.components['wizard'];
		// move to current step
		this.move(this.$wizard.getStep(this.options.current));
	};

	WizardForm.prototype.move = function (step) {
		this.$wizard.moveStep(step.id);
	};

	WizardForm.prototype.previous = function () {
		var $this = this;
		return window.Page.triggerHandler("navigate.jsea", { 
			action : function () { 
				$this.move($this.$wizard.getStep(--$this.options.current)); 
			}
		});
	};

	WizardForm.prototype.next = function () {
		var $this = this;
		// save the current step first
		this.$wizard.saveStep(function () {
			// then empty it, and move to the next
			$this.$wizard.emptyStep($this.$wizard.getStep($this.options.current).id);
			$this.options.current < ($this.$wizard.getSteps().length - 1) ?
					$this.move($this.$wizard.getStep(++$this.options.current)) :
					$this.summary();
		});
	};
	
	WizardForm.prototype.summary = function () {
		this.perform({
			mode     : 'popup',
			url      : this.options.urls.summary,
			callback : null
		});
	};

	WizardForm.prototype.submit = function (action) {
		var $this = this;
		// submit at last
		this.perform($.extend(true, {}, action, { mode : 'savexit' }));
	};

	WizardForm.prototype.getDefaults = function () {
		return WizardForm.DEFAULTS;
	};

	// FORM.WIZARD PLUGIN DEFINITION
	// ===============================

	function Plugin(option) {
		var self = this;

		// FORM.WIZARD PUBLIC METHOD EXTENDS FORM.DETAIL
		// ===============================================

		this.extend($.fn.detailform.prototype);

		return this.each(function () {
			var $this = $(this);
			var plugin= $this.data('jsea.plugin');
			var data  = $this.data('jsea.form.wizard');
			var options = typeof option == 'object' && option;

			if (!plugin) $this.data('jsea.plugin', self);

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.form.wizard', (data = new WizardForm(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.wizardform;

	$.fn.wizardform             = Plugin;
	$.fn.wizardform.Constructor = WizardForm;

	// FORM.WIZARD NO CONFLICT
	// ========================

	$.fn.wizardform.noConflict = function () {
		$.fn.wizardform = old;
		return this;
	};

} (jQuery);