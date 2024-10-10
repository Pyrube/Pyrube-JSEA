/**
 * @(#) Project: Pyrube JSEA
 * 
 * 
 * Website: http://www.pyrube.com
 * Email: customercare@pyrube.com
 * Copyright Pyrube 2009. All rights reserved.
 */

/**
 * JSEA Element as base class
 * The Element object has following data:
 * stylization  :
 *     inactive   : make this element inactive by some rules
 *     hidden     : make this element hidden by some rules
 *     invisible  : make this element invisible by some rules
 *     gone       : make this element gone by some rules
 * 
 * @author Aranjuez
 * @version Oct 01, 2023
 * @since Pyrube-JSEA 1.1
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// ELEMENT PUBLIC CLASS EXTENDS ONE
	// ==================================

	class Element extends One { 
		constructor (type, element, options) {
			super(type, element, options);
		};
	}

	Element.VERSION  = '1.1.0';

	Element.DEFAULTS = $.extend(true, {}, One.DEFAULTS, {
		id           : undefined,
		name         : undefined,
		stylization  : {
			inactive    : null,
			hidden      : null,
			invisible   : null,
			gone        : null,
		}
	});

	Element.prototype.init = function (type, element, options) {
		this.$super().init(type, element, options);
		this.type      = type;
		this.$element  = $(element);
		this.options   = this.getOptions(options);

		// initialize this element
		this.initElement();
		// resolve the 0-event of this field
		this.resolveEvent0('click');
		// initialize default/concrete events of this element
		this.initDefaultEvents();
		//this.initEvents();
	};

	Element.prototype.initDefaultEvents = function () {
		// bind the 0-event of this element if any
		this.bindEvent0();
	};

	Element.prototype.stylize = function (entity) {
		for (var styleName in this.options.stylization) {
			var rulers = this.options.stylization[styleName];
			if (!$.isArray(rulers) && $.isFunction(rulers)) { rulers = [rulers]; }
			if (!$.isArray(rulers)) continue;
			for (var ruler of rulers) {
				if ($.isFunction(ruler) && ruler.apply(null, [entity])) {
					// if any ruler is true
					Page.Method('style', styleName).apply(this.$element.data('jsea.plugin'), null);
				}
			}
		}
	};

	Element.prototype.destroy = function () {
		this.destroy0();
	};

	Element.prototype.destroy0 = function () {
		this.$element.off()
			.removeData(this.$element.attr(JSEA.Constants.ATTR_CLASS))
			.removeData('jsea.plugin');
		// destroy One at last
		this.$super().destroy();
	};

	Element.prototype.getDefaults = function () {
		return Element.DEFAULTS;
	};

	Element.prototype.getOptions = function (options) {
		options = $.extend({}, this.getDefaults(), this.$element.data(), options);
		
		return options;
	};

	// ELEMENT PLUGIN DEFINITION
	// ===========================

	function Plugin(option) {

		return this.each(function () { });
	}

	// FIELD REUSE METHOD DEFINITION
	// ===============================

	Plugin.prototype = $.extend({}, One.Plugin.prototype);

	Plugin.prototype.options = function () {
		var options = {};
		this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			options     = data.options;
			return false;
		});
		return options;
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
		});
	};

	Plugin.prototype.addClass = function (value) {
		return this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			data.$element.addClass(value);
		});
	};

	Plugin.prototype.removeClass = function (value) {
		return this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			data.$element.removeClass(value);
		});
	};

	Plugin.prototype.stylize = function (entity) {
		return this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			data.stylize(entity);
		});
	};

	Plugin.prototype.destroy = function () {
		return this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			data.destroy();
		});
	};

	var old = $.fn.element;

	$.fn.element             = Plugin;
	$.fn.element.Constructor = Element;

	// ELEMENT NO CONFLICT
	// ===================

	$.fn.element.noConflict = function () {
		$.fn.element = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Button element
 * The Button object has following data:
 * name. button name (string)
 * method. click to invoke (function)
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// BUTTON PUBLIC CLASS DEFINITION
	// ================================

	var Button = function (element, options) {
		this.init('button', element, options);
	};

	Button.VERSION  = '1.0.0';

	Button.DEFAULTS = $.extend({}, $.fn.element.Constructor.DEFAULTS, {
		type        : 'button',
		dors        : false,
		toggleable  : false
	});

	// NOTE: BUTTON EXTENDS ELEMENT
	// ==============================

	Button.prototype = $.extend({}, $.fn.element.Constructor.prototype);

	Button.prototype.constructor = Button;

	Button.prototype.initElement = function () {
		this.$element
			.attr('id', 'btn' + this.options.name.capitalize())
			.attr('name', 'btn' + this.options.name.capitalize())
			.attr('type', this.options.type);
		
		if (!this.$element.hasClass('btn')) {
			this.$element.addClass('btn')
				.addClass(this.options.name)
				.attr('title', JSEA.localizeMessage('button.alt.' + this.options.name))
				.append($(document.createElement('SPAN'))
						.addClass(this.options.name))
				.append($(document.createElement('EM'))
						.text(JSEA.localizeMessage('button.text.' + this.options.name)));
		}
	};

	Button.prototype.afterMethodResolved = function (event0) {
		event0.confirm = this.options.confirm || undefined;
	};

	Button.prototype.getDefaults = function () {
		return Button.DEFAULTS;
	};

	Button.prototype.getOptions = function (options) {
		var buttonOptions = this.parseAttribute(JSEA.Constants.ATTR_BUTTON_OPTIONS);

		options = $.extend(true, {}, this.getDefaults(), this.$super().getOptions(options), buttonOptions, options);

		return options;
	};

	// BUTTON PLUGIN DEFINITION
	// ==========================

	function Plugin(option) {
		var self = this;

		// BUTTON PUBLIC METHOD EXTENDS ELEMENT
		// ========================================

		this.extend($.fn.element.prototype);

		// BUTTON PUBLIC METHOD DEFINITION
		// =================================

		self.postOptions = function () {
			var postOptions = {};
			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.button');
				postOptions = {
					name     : data.options.name,
					url      : data.options.url,
					mode     : data.options.mode,
					dors     : data.options.dors,
					success  : data.options.success,
					callback : data.options.callback
				}
				return false;
			});
			return postOptions;
		};

		return this.each(function () {
			var $this   = $(this);
			var plugin  = $this.data('jsea.plugin');
			var data    = $this.data('jsea.button');
			var options = typeof option == 'object' && option;

			if (!plugin) $this.data('jsea.plugin', self);

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.button', (data = new Button(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.button;

	$.fn.button             = Plugin;
	$.fn.button.Constructor = Button;


	// BUTTON NO CONFLICT
	// ====================

	$.fn.button.noConflict = function () {
		$.fn.button = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Button builder
 * The ButtonBuilder object has following methods:
 * build  :  returns new Button instance
 *     @param options
 *            name. button name (string)
 *            method. click to invoke (function)
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 */
var ButtonBuilder = {
	VERSION       : '1.0.0',
	build         : function (options) {
		return $(document.createElement(JSEA.Constants.TAG_BUTTON)).button(options);
	}
};

/**
 * JSEA Icon element
 * The Icon object has following data:
 * name. icon name (string)
 * tooltips. icon tooltips (string)
 * method. click to invoke (function)
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// ICON PUBLIC CLASS DEFINITION
	// ==============================

	var Icon = function (element, options) {
		this.init('icon', element, options);
	};

	Icon.VERSION  = '1.0.0';

	Icon.DEFAULTS = $.extend({}, $.fn.element.Constructor.DEFAULTS, {
		title     : null,
		tooltips  : null
	});

	// NOTE: ICON EXTENDS ELEMENT
	// ============================

	Icon.prototype = $.extend({}, $.fn.element.Constructor.prototype);

	Icon.prototype.constructor = Icon;

	Icon.prototype.initElement = function () {
		this.$element
			.attr('id', this.options.name)
			.attr('name', this.options.name)
			.attr('href', 'javascript:void(0);')
			.attr('tabindex', '-1')
			.addClass(this.options.name);
		if (this.options.title) {
			this.$element.attr('title', JSEA.localizeMessage(this.options.title));
		}
		if (this.options.tooltips) {
			this.$element.attr(JSEA.Constants.ATTR_TOOLTIPS, this.options.tooltips);
		}
	};

	Icon.prototype.getDefaults = function () {
		return Icon.DEFAULTS;
	};

	Icon.prototype.getOptions = function (options) {

		options = $.extend(true, {}, this.getDefaults(), this.$super().getOptions(options), this.$element.data(), options);
	
		return options;
	};
  
	// ICON PLUGIN DEFINITION
	// ========================

	function Plugin(option) {
		var self = this;

		// ICON PUBLIC METHOD EXTENDS ELEMENT
		// ====================================

		this.extend($.fn.element.prototype);
	
		return this.each(function () {
			var $this   = $(this);
			var plugin  = $this.data('jsea.plugin');
			var data    = $this.data('jsea.icon');
			var options = typeof option == 'object' && option;

			if (!plugin) $this.data('jsea.plugin', self);

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.icon', (data = new Icon(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.button;

	$.fn.icon             = Plugin;
	$.fn.icon.Constructor = Icon;


	// ICON NO CONFLICT
	// ==================

	$.fn.icon.noConflict = function () {
		$.fn.icon = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Icon builder
 * The IconBuilder object has following methods:
 * build  :  returns new Icon instance
 *     @param options
 *            name. icon name (string)
 *            tooltips. icon tooltips (string)
 *            method. click to invoke (function)
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 */
var IconBuilder = {
	VERSION     : '1.0.0',
	build       : function (options) {
		return $(document.createElement(JSEA.Constants.TAG_ICON)).icon(options);
	}
};

/**
 * JSEA Link element
 * The Link object has following data:
 * name. button name (string)
 * method. click to invoke (function)
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// LINK PUBLIC CLASS DEFINITION
	// ==============================

	var Link = function (element, options) {
		this.init('link', element, options);
	};

	Link.VERSION  = '1.0.0';

	Link.DEFAULTS = $.extend({}, $.fn.element.Constructor.DEFAULTS, {
		type        : 'link',
		icon        : null,  // class name for link icon
		text        : null,  // link text
		href        : null,
		dors        : false,
		toggleable  : false
	});

	// NOTE: ICON EXTENDS ELEMENT
	// ============================

	Link.prototype = $.extend({}, $.fn.element.Constructor.prototype);

	Link.prototype.constructor = Link;

	Link.prototype.initElement = function (type, element, options) {
		this.$element
			.attr('id', this.options.id || 'lnk' + this.options.name.capitalize())
			.attr('name', this.options.id || 'lnk' + this.options.name.capitalize())
			.attr('href', this.options.href || 'javascript:void(0);');
		if (!this.$element.hasClass('lnk')) {
			this.$element.addClass('lnk')
				.addClass(this.options.icon)
				.addClass(this.options.name)
				.attr('title', (this.options.name) ? JSEA.localizeMessage('link.alt.' + this.options.name) : '')
				.append($(document.createElement('SPAN'))
						.addClass(this.options.icon || this.options.name))
				.append($(document.createElement('EM'))
						.text(JSEA.localizeMessage(this.options.text || 'link.text.' + this.options.name)));
		}
		// initialize concrete link element
		this.initLink();
	};

	Link.prototype.initLink = function () { };

	Link.prototype.getDefaults = function () {
		return Link.DEFAULTS;
	};

	Link.prototype.getOptions = function (options) {
		var linkOptions = this.parseAttribute(JSEA.Constants.ATTR_LINK_OPTIONS);

		options = $.extend(true, {}, this.getDefaults(), this.$super().getOptions(options), linkOptions, options);

		return options;
	};

	// LINK PLUGIN DEFINITION
	// ========================

	function Plugin(option) {
		var self = this;

		// LINK PUBLIC METHOD EXTENDS ELEMENT
		// ====================================

		this.extend($.fn.element.prototype);

		self.postOptions = function () {
			var postOptions = {};
			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.link');
				postOptions = {
					name     : data.options.name,
					url      : data.options.url,
					mode     : data.options.mode
				}
				return false;
			});
			return postOptions;
		};

		return this.each(function () {
			var $this   = $(this);
			var plugin  = $this.data('jsea.plugin');
			var data    = $this.data('jsea.link');
			var options = typeof option == 'object' && option;
			
			if (!plugin) $this.data('jsea.plugin', self);

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.link', (data = new Link(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	// LINK REUSE METHOD EXTENDS ELEMENT
	// ===================================

	Plugin.prototype = $.extend({}, $.fn.element.prototype);

	Plugin.prototype.postOptions = function () {
		var postOptions = {};
		this.each(function () {
			var $this   = $(this);
			var data    = $this.data($this.attr(JSEA.Constants.ATTR_CLASS));
			postOptions = {
				name     : data.options.name,
				url      : data.options.url,
				mode     : data.options.mode
			}
			return false;
		});
		return postOptions;
	};

	var old = $.fn.link;

	$.fn.link             = Plugin;
	$.fn.link.Constructor = Link;


	// LINK NO CONFLICT
	// ==================

	$.fn.link.noConflict = function () {
		$.fn.link = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Link builder
 * The LinkBuilder object has following methods:
 * build  :  returns new Link instance
 *     @param options
 *            name. icon name (string)
 *            href. link href (string)
 *            method. click to invoke (function)
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 */
var LinkBuilder = {
	VERSION     : '1.0.0',
	build       : function (options) {
		return $(document.createElement(JSEA.Constants.TAG_LINK)).link(options);
	}
};


/**
 * JSEA On-off element extends Link element
 * The On-off object has following data:
 * name. onoff name (string)
 * method. click to invoke (function)
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// LINK.ONOFF PUBLIC CLASS DEFINITION
	// ====================================

	var Onoff = function (element, options) {
		this.init('link.onoff', element, options);
	};

	Onoff.VERSION  = '1.0.0';

	Onoff.DEFAULTS = $.extend({}, $.fn.link.Constructor.DEFAULTS, {
		icon       : 'onoff',
		name       : 'toggle',
		on         : true,
		method     : function () { this.toggle(); },
		onToggle   : null
	});

	// NOTE: LINK.ONOFF EXTENDS ELEMENT
	// ==================================

	Onoff.prototype = $.extend({}, $.fn.link.Constructor.prototype);

	Onoff.prototype.constructor = Onoff;

	Onoff.prototype.initLink = function () {
		this.$element.addClass(this.options.on ? 'on' : 'off');
	};

	Onoff.prototype.toggle = function (on) {
		if (on === undefined) on = !this.options.on;
		(this.options.on = on) 
			? this.$element.removeClass('off').addClass('on')
			: this.$element.removeClass('on').addClass('off');
		var fnToggle = this.options.onToggle;
		if ($.isFunction(fnToggle)) {
			fnToggle.apply(this.$element.data('jsea.plugin'), [on]);
		}
		this.$element.trigger('toggle');
	};

	Onoff.prototype.isOn = function () {
		return this.options.on;
	};

	Onoff.prototype.getDefaults = function () {
		return Onoff.DEFAULTS;
	};

	// LINK.ONOFF PLUGIN DEFINITION
	// ==============================

	function Plugin(option) {
		var self = this;

		// LINK.ONOFF PUBLIC METHOD EXTENDS LINK
		// ==========================================

		this.extend($.fn.element.prototype);

		self.toggle = function (on) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.link.onoff');
				data.toggle(on);
			});
		};

		return this.each(function () {
			var $this   = $(this);
			var plugin  = $this.data('jsea.plugin');
			var data    = $this.data('jsea.link.onoff');
			var options = typeof option == 'object' && option;

			if (!plugin) $this.data('jsea.plugin', self);

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.link.onoff', (data = new Onoff(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.link;

	$.fn.onoff             = Plugin;
	$.fn.onoff.Constructor = Onoff;


	// LINK.ONOFF NO CONFLICT
	// ========================

	$.fn.onoff.noConflict = function () {
		$.fn.onoff = old;
		return this;
	};

} (jQuery);
