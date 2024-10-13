/**
 * @(#) Project: Pyrube JSEA
 * 
 * 
 * Website: http://www.pyrube.com
 * Email: customercare@pyrube.com
 * Copyright Pyrube 2009. All rights reserved.
 */
/**
 * JSEA Messagebar component
 *
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 */
+(function($) {
	'use strict';

	// MESSAGEBAR PUBLIC CLASS DEFINITION
	// ====================================

	var Messagebar = function (element, options) {
		this.init('messagebar', element, options);
	};

	Messagebar.VERSION = '1.0.0';

	Messagebar.DEFAULTS = { };

	Messagebar.prototype.init = function (type, element, options) {
		this.type     = type;
		this.$element = $(element);
		this.options  = this.getOptions(options);
		this.build();
	};
	/**
	 * <div class='message-container'>
	 * <div class="message-area">
	 * 	<ul><li class="message level">
	 * 		<span class="level info"></span><label id='msgContent' class='level'>message test info</label><a href='javascript:void(0);' class='close'>x</a>
	 * 	</li></ul>
	 * </div>
	 * </div>
	 */
	Messagebar.prototype.build = function () {
		var $this = this;
		var $messageContainer = $("<div class='message-container'>");
		var $messageArea = $("<div class='message-area'>");
		var $li = $(document.createElement("LI")).addClass("message level")
				.append(IconBuilder.build({
					name  : 'close',
					event : function () { $this.close(); }
				}).append("X"))
				.append("<span class='level'></span>")
				.append("<label id='msgContent' class='level'></label>");
		var $ul = $(document.createElement("UL")).append($li);
		$messageArea.append($ul);
		$messageContainer.append($messageArea);
		this.$element.append($messageContainer);
	};

	Messagebar.prototype.repaint = function (message) {
		if (this.lastLevel) this.$element.find('.level').removeClass(this.lastLevel);
		this.$element.find('.level').addClass(this.lastLevel = message.level);
		this.$element.find('#msgContent').text(JSEA.localizeMessage(message.code, message.param));
	};

	Messagebar.prototype.show = function (message) {
		this.repaint(message);
		this.$element.addClass("show");
		if (['success', 'info'].includes(message.level)) {
			var $this = this;
			setTimeout(function () { $this.close(); }, 4800);
		}
	};

	Messagebar.prototype.close = function () {
		this.$element.removeClass("show");
		this.$element.trigger("close.jsea");
		this.$element.off("close.jsea");
	};

	Messagebar.prototype.destroy = function () {
		this.close();
		this.$element.removeData("jsea.messagebar");
		this.$element.empty();
	};

	Messagebar.prototype.getDefaults = function () {
		return Messagebar.DEFAULTS;
	};

	Messagebar.prototype.getOptions = function (options) {
		options = $.extend({}, this.getDefaults(), options);
		return options;
	};

	// MESSAGE PLUGIN DEFINITION
	// ===========================
	function Plugin(option) {
		var self = this;
		self.show = function (message) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.messagebar');
				data.show(message);
			});
		};
		self.close = function () {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.messagebar');
				data.close();
			});
		};
		self.registerCloseEvent = function (fn) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.messagebar');
				data.$element.on('close.jsea', fn);
			});
		};
		return this.each(function() {
			var $this = $(this);
			var data = $this.data('jsea.messagebar');
			var options = typeof option == 'object' && option;
			if (!data && /show|close|destroy/.test(option)) return;
			if (!data) $this.data('jsea.messagebar', (data = new Messagebar(this, options)));
			if (typeof option == 'string') data[option]();
			
		});
	}

	var old = $.fn.messagebar;

	$.fn.messagebar             = Plugin;
	$.fn.messagebar.Constructor = Messagebar;

	// MESSAGEBAR NO CONFLICT
	// ========================
	$.fn.messagebar.noConflict = function () {
		$.fn.messagebar = old;
		return this;
	};
}) (jQuery);

/**
 * JSEA Message
 * The Message utility has following methods:
 * show(level, msgCode, param)  :  show message
 *     @param level. message level (string)
 *     @param msgCode. i18n message code (string)
 *     @param param. i18n message parameter (string or array)
 * info(msgCode, param)  :  show message on info level
 *     @param msgCode. i18n message code (string)
 *     @param param. i18n message parameter (string or array)
 * debug(msgCode, param)  :  show message on debug level
 *     @param msgCode. i18n message code (string)
 *     @param param. i18n message parameter (string or array)
 * warn(msgCode, param)  :  show message on warn level
 *     @param msgCode. i18n message code (string)
 *     @param param. i18n message parameter (string or array)
 * error(msgCode, param)  :  show message on error level
 *     @param msgCode. i18n message code (string)
 *     @param param. i18n message parameter (string or array)
 * fatal(msgCode, param)  :  show message on fatal level
 *     @param msgCode. i18n message code (string)
 *     @param param. i18n message parameter (string or array)
 * success(msgCode, param)  :  show success message
 *     @param msgCode. i18n message code (string)
 *     @param param. i18n message parameter (string or array)
 *
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 */
var Message = {
	VERSION : '1.0.0',
	/**
	 * message shows up
	 * @param level String. the message level
	 * @param msgCode String. the message code
	 * @param param
	 */
	show    : function (level, msgCode, param) {
		var message = {
			level: level,
			code: msgCode,
			param: param
		};
		Page.Messagebar.show(message);
	},
	info    : function (msgCode, param) { this.show('info',    msgCode, param); },
	debug   : function (msgCode, param) { this.show('debug',   msgCode, param); },
	warn    : function (msgCode, param) { this.show('warn',    msgCode, param); },
	error   : function (msgCode, param) { this.show('error',   msgCode, param); },
	fatal   : function (msgCode, param) { this.show('fatal',   msgCode, param); },
	success : function (msgCode, param) { this.show('success', msgCode, param); },
	onClose : function (fn) { Page.Messagebar.registerCloseEvent(fn); },
	close   : function (  ) { Page.Messagebar.close(); }
};

/**
 * JSEA Messages-box component
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: JSEA: popup.js (popbox plugin)
 */
+(function($) {
	'use strict';

	// MESSAGESBOX PUBLIC CLASS DEFINITION
	// =====================================
	var Messagesbox = function (element, options) {
		this.init('messagesbox', element, options);
	};

	Messagesbox.VERSION = '1.0.0';

	Messagesbox.DEFAULTS = { };

	Messagesbox.prototype.init = function (type, element, options) {
		this.type      = type;
		this.$element  = $(element);
		this.options   = this.getOptions(options);
		this.messages = null;
	};

	Messagesbox.prototype.add = function (msgLevel, msgCode, param) {
		if (!msgLevel) msgLevel = "info";
		var message = {
			level   : msgLevel,
			code    : msgCode,
			content : JSEA.localizeMessage(msgCode, param)
		};
		
		if (this.messages == null) {
			this.messages = [];
			var messagesBody = "<div class='messages-container'>"
								+ "<div class='messages-area'>"
									+ "<ul class='messages'></ul>"
								+ "</div></div>";
			this.$popbox = this.$element.popbox({
				hasContent : false,
				dismissible: true,
				trigger    : 'click',
				content    : messagesBody,
				html       : true
			});
			//bind event
			this.$popbox.getContentElement().on("click", "a[class='fieldFocus']", function () {
				var propName = $(this).attr("fid");
				$("*[name='" + propName + "']").focus();
			});
		}
		this.show();
		this.message = message;
		this.addMessageBodyContent();
		this.messages[this.messages.length] = message;
		this.showTotal();
	};

	Messagesbox.prototype.show = function () {
		this.$element.popbox('show');
	};

	Messagesbox.prototype.addMessageBodyContent = function () {
		this.$li = $("<li class='message'></li>");
		var	html = "<div>"
					+ "<span class='" + this.message.level + "'></span><label>" + this.message.content + "</label>"
				+ "</div>";
		this.$li.append($(html));
		this.$popbox.appendContent(this.$li, 'ul.messages');
	};

	Messagesbox.prototype.showTotal = function () {
		if (this.$element.find("span").length == 0) {
			this.$element.append("<span class='num'></span>");
		}
		this.$element.find("span").text(this.size());
	}

	Messagesbox.prototype.bind = function (propName) {
		if (propName) {
			this.$li.remove();
			this.$li = $("<li class='message'></li>");
			var html = "<span class='" + this.message.level + "'></span><label>" + this.message.content + "</label>";
			var $a = $("<a fid='" + propName + "' class='fieldFocus' href='javascript:void(0);'></a>");
			$a.append($(html));
			this.$li.append($a);
			this.$popbox.appendContent(this.$li, 'ul.messages');
		}
	};

	Messagesbox.prototype.size = function (message) {
		if (this.messages == null) return 0;
		return (this.messages.length);
	};

	Messagesbox.prototype.clear = function () {
		this.destroy();
		this.messages = null;
		this.message = null;
		//clear the error number span tag.
		if(this.$element.find("span")) this.$element.find("span").remove();
	};

	Messagesbox.prototype.getMessages = function () {
		return (this.messages);
	};

	Messagesbox.prototype.destroy = function () {
		if (this.messages != null) {
			this.$popbox.getContentElement().off('click', "a[class='fieldFocus']");
		}
		this.$popbox = null;
		this.$element.popbox("destroy");
	};

	Messagesbox.prototype.getDefaults = function () {
		return Messagesbox.DEFAULTS;
	};

	Messagesbox.prototype.getOptions = function (options) {
		options = $.extend({}, this.getDefaults(), options);
		return options;
	};

	// MESSAGESBOX PLUGIN DEFINITION
	// ===============================
	function Plugin(option) {
		var self = this;

		// MESSAGESBOX PUBLIC METHOD DEFINITION
		// ======================================
		self.add = function (level, msgCode, param) {
			return self.each(function() {
				var $this = $(this);
				var data = $this.data('jsea.messagesbox');
				data.add(level, msgCode, param);
			});
		};

		self.bind = function (property) {
			return self.each(function() {
				var $this = $(this);
				var data = $this.data('jsea.messagesbox');
				data.bind(property);
			});
		};

		self.clear = function () {
			return self.each(function() {
				var $this = $(this);
				var data = $this.data('jsea.messagesbox');
				data.clear();
			});
		};

		self.show = function () {
			return self.each(function() {
				var $this = $(this);
				var data = $this.data('jsea.messagesbox');
				data.show();
			});
		};

		return this.each(function () {
			var $this = $(this);
			var data = $this.data('jsea.messagesbox');
			var options = typeof option == 'object' && option;
	
			if (!data && /destroy/.test(option)) return;
			if (!data) $this.data('jsea.messagesbox', (data = new Messagesbox(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.messagesbox;

	$.fn.messagesbox = Plugin;
	$.fn.messagesbox.Constructor = Messagesbox;

	// MESSAGESBOX NO CONFLICT
	// =========================
	$.fn.messagesbox.noConflict = function () {
		$.fn.messagesbox = old;
		return this;
	};
})(jQuery);

/**
 * JSEA Messages
 * The Messages utility has following methods:
 * add(level, msgCode, param)  :  add a message into Messages
 *     @param level. message level (string)
 *     @param msgCode. i18n message code (string)
 *     @param param. i18n message parameter (string or array)
 * info(msgCode, param)  :  add a message on info level
 *     @param msgCode. i18n message code (string)
 *     @param param. i18n message parameter (string or array)
 * debug(msgCode, param)  :  add a message on debug level
 *     @param msgCode. i18n message code (string)
 *     @param param. i18n message parameter (string or array)
 * warn(msgCode, param)  :  add a message on warn level
 *     @param msgCode. i18n message code (string)
 *     @param param. i18n message parameter (string or array)
 * error(msgCode, param)  :  add a message on error level
 *     @param msgCode. i18n message code (string)
 *     @param param. i18n message parameter (string or array)
 * fatal(msgCode, param)  :  add a message on fatal level
 *     @param msgCode. i18n message code (string)
 *     @param param. i18n message parameter (string or array)
 *
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 */
var Messages = {
	VERSION : '1.0.0',
	add   : function (level, msgCode, param) {
		return $("a[class='messages']", Page.Toolbar).messagesbox().add(level, msgCode, param);
	},
	info  : function (msgCode, param) { return this.add("info",  msgCode, param); },
	debug : function (msgCode, param) { return this.add("debug", msgCode, param); },
	warn  : function (msgCode, param) { return this.add("warn",  msgCode, param); },
	error : function (msgCode, param) { return this.add("error", msgCode, param); },
	fatal : function (msgCode, param) { return this.add("fatal", msgCode, param); },
	clear : function () {
		$("a[class='messages']", Page.Toolbar).messagesbox().clear();
	},
	hasMessage : function () {
		return $("a[class='messages']", Page.Toolbar).messagesbox().size() > 0;
	}
};
/**
 * JSEA Info-bar component
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// INFOBAR PUBLIC CLASS DEFINITION
	// =================================

	var Infobar = function (element, options) {
		this.init('infobar', element, options);
	};

	Infobar.VERSION  = '1.0.0';

	Infobar.DEFAULTS = {
		label        : null,
		funcname     : '',
		operation    : '',
		model        : null,
		pkLabel      : null,
		pkValue      : null
	};
	
	Infobar.prototype.init = function (type, element, options) {
		this.type      = type;
		this.$element  = $(element);
		this.options   = this.getOptions(options);
		
		this.$element
			.addClass('infobar')
			.append($(document.createElement('UL'))
				.append($(document.createElement('LI')).addClass('info'))
			);
		
		if (this.options.label == null || this.options.label.startsWith('?')) {
			this.options.label = this.options.funcname + ".infobar." 
									+ this.options.funcname + '-' + this.options.operation + (this.options.label || '');
		}
		
		this.determine();
	};
	
	Infobar.prototype.determine = function () {
		var label = this.options.label;
		if (label == 'false') {
			this.destroy();
			this.$element.empty().remove();
			return;
		}
		if (label.indexOf('?') < 0) {
			this.i18nkey = label;
			this.i18nparams = null;
		} else {
			var strMsgKey = label.split('?')[0];
			var strMsgParams = JSEA.substitute(label.split('?')[1], this.options.model);
			var msgParams = strMsgParams.split(',');
			this.i18nparams = msgParams.filter(function (param) {
				return (param !== undefined && param !== null && param !== '');
			});
			this.i18nkey = strMsgKey + (this.i18nparams.length == 0 ? '' : this.i18nparams.length);
		}
		
		this.$element.find('.info').text(JSEA.localizeMessage(this.i18nkey, this.i18nparams));
	},
	
	Infobar.prototype.destroy = function () {
		this.$element.removeData('jsea.infobar');
	};
	
	Infobar.prototype.getDefaults = function () {
		return Infobar.DEFAULTS;
	};

	Infobar.prototype.getOptions = function (options) {
		options = $.extend({}, this.getDefaults(), this.$element.data(), options);
		
		return options;
	};
  
	// INFOBAR PLUGIN DEFINITION
	// ===========================

	function Plugin(option) {
		var self = this;

		// INFOBAR PUBLIC METHOD DEFINITION
		// ==================================
		
		return this.each(function () {
			var $this   = $(this);
			
			var data    = $this.data('jsea.infobar');
			var options = typeof option == 'object' && option;

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.infobar', (data = new Infobar(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.infobar;

	$.fn.infobar             = Plugin;
	$.fn.infobar.Constructor = Infobar;


	// INFOBAR NO CONFLICT
	// =====================

	$.fn.infobar.noConflict = function () {
		$.fn.infobar = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Nav-bar component
 * 
 * @author Aranjuez
 * @version Oct 01, 2023
 * @since Pyrube-JSEA 1.1
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';
	// NAVBAR PUBLIC CLASS DEFINITION
	// ================================

	var Navbar = function (element, options) {
		this.init('navbar', element, options);
	};

	Navbar.VERSION  = '1.1.0';

	Navbar.DEFAULTS = {
		type : 'APP'
	};

	Navbar.Constants = {
		OBJATTR_NAV_OPTIONS : 'jsea-nav-options'
	}

	Navbar.prototype.init = function (type, element, options) {
		this.pluginType = type;
		this.$element   = $(element);
		this.options    = this.getOptions(options);
		this.navs       = {};
		this.$navbarArea = this.$element.find("ul");

		this.$element.addClass('navbar');
		// initialize events
		this.initEvents();
		// load nav-items
		this.load();
	};

	Navbar.prototype.initEvents = function () {
		var $this = this;
		this.$navbarArea.on('click', 'A:not(.disabled)', function () {
			var $trigger = $(this);
			return $this.fireNavClicked($trigger);
		});
	};

	Navbar.prototype.load = function () {
		var $this = this;
		// initialize first level nav-items and mark the current nav-item
		$.ajax({
			url : JSEA.getPageContext().resolveUrl('user/nav/nav_' + this.options.type),
			type : 'get',
			dataType : 'json',
			success : function(navItems) {
				for (var navItem of navItems) {
					$this.append(navItem);
				}
				$this.$navbarArea.addClass('_' + navItems.length);
			}
		});
	};

	Navbar.prototype.append = function (navOptions) {
		// trigger nav event via this.initEvents
		navOptions = $.extend(navOptions, { event : null });
		var lnkOptions = {
			id   : navOptions.id,
			name : navOptions.name,
			icon : navOptions.icon,
			text : navOptions.label
		}
		var $nav = LinkBuilder.build(lnkOptions);
		var $navWrapper = $(document.createElement('LI'));
		$navWrapper.addClass(navOptions.name);
		this.$navbarArea.append($navWrapper.append($nav));
		$nav.data(Navbar.Constants.OBJATTR_NAV_OPTIONS, navOptions);
		this.navs[navOptions.name] = $nav;
	};

	Navbar.prototype.fireNavClicked = function ($trigger) {
		var $this      = this;
		var navOptions = $trigger.data(Navbar.Constants.OBJATTR_NAV_OPTIONS);
		return window.Page.triggerHandler("navigate.jsea",  { action : function () {
				window.Page.perform({url : navOptions.action, mode : navOptions.mode});
				$this.$navbarArea.find('.current').removeClass('current');
			}
		});
	};
	
	Navbar.prototype.getDefaults = function () {
		return Navbar.DEFAULTS;
	};

	Navbar.prototype.getOptions = function (options) {
		var navbarOptions = JSEA.Jsons.parse(this.$element.attr(JSEA.Constants.ATTR_NAVBAR_OPTIONS));

		options = $.extend(true, {}, this.getDefaults(), navbarOptions, options);

		return options;
	};

	// NAVBAR PLUGIN DEFINITION
	// ==========================

	function Plugin(option) {
		return this.each(function () {
			var $this   = $(this);

			var data    = $this.data('jsea.navbar');
			var options = typeof option == 'object' && option;

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.navbar', (data = new Navbar(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.navbar;

	$.fn.navbar             = Plugin;
	$.fn.navbar.Constructor = Navbar;


	// NAVBAR NO CONFLICT
	// ====================

	$.fn.navbar.noConflict = function () {
		$.fn.navbar = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Tool-bar component
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';
	// TOOLBAR PUBLIC CLASS DEFINITION
	// =================================

	var Toolbar = function (element, options) {
		this.init('toolbar', element, options);
	};

	Toolbar.VERSION  = '1.0.0';

	Toolbar.DEFAULTS = {
		DEFAULT_TOOLS  : [ {
			name     : 'messages',
			dataListening: false,
			disabled : false
		}, {
			name     : 'hide',
			event    : function () { this.showOrHide(); },
			dataListening: false,
			disabled : false
		} ]
	};

	Toolbar.Constants = {
		OBJATTR_META_DATA       : 'jsea-meta-data',
		OBJATTR_TOOL_OPTIONS    : 'jsea-tool-options'
	}

	Toolbar.prototype.init = function (type, element, options) {
		this.pluginType = type;
		this.$element   = $(element);
		this.options    = this.getOptions(options);
		this.listeners  = {};
		this.tools      = {};
		this.toolWrappers = {};
		this.$toolbarArea = this.$element.find("ul");

		this.$element.addClass('toolbar');
		// initialize default tools
		this.initDefaultTools();
		// initialize events
		this.initEvents();
		// locate hide tool
		this.locateHideTool();
	};
	
	Toolbar.prototype.initDefaultTools = function () {
		var defaultTools = this.options.DEFAULT_TOOLS;
		for (var i = 0; i < defaultTools.length; i++) {
			this.add(defaultTools[i]);
		}
	};
	
	Toolbar.prototype.initEvents = function () {
		var $this = this;
		this.$toolbarArea.on('click', 'A:not(.disabled)', function () {
			var $trigger = $(this);
			$this.fireToolClicked($trigger);
		});
	};
	
	Toolbar.prototype.locateHideTool = function () {
		this.$hideToolWrapper = this.toolWrappers['hide'];
		this.$hideToolWrapper.addClass('collapse');
	};
	
	Toolbar.prototype.showOrHide = function () {
		if (this.$element.hasClass('collapsed')) {
			// show the toolbar
			this.$element.removeClass('collapsed');
			this.$hideToolWrapper.removeClass('expand').addClass('collapse');
		} else {
			// hide the toolbar
			this.$element.addClass('collapsed');
			this.$hideToolWrapper.removeClass('collapse').addClass('expand');
		}
	};
	
	Toolbar.prototype.reset = function () {
		Messages.clear();
		this.clearData();
	};
	
	Toolbar.prototype.add = function (toolOptions) {
		// trigger tool event via this.initEvents, instead of IconBuilder.build 
		var iconOptions = $.extend({}, toolOptions, { event : null });
		var $tool = IconBuilder.build(iconOptions);
		if (toolOptions.dataListening) this.addDataListener(toolOptions.name);
		var $toolWrapper = $(document.createElement('LI'));
		$toolWrapper.addClass(toolOptions.name);
		if (this.contains(toolOptions.name)) {
			var _$toolWrapper = this.toolWrappers[toolOptions.name];
			_$toolWrapper.replaceWith($toolWrapper.append($tool));
			$toolWrapper = _$toolWrapper;
		} else {
			if (this.$hideToolWrapper) $toolWrapper.append($tool).insertBefore(this.$hideToolWrapper);
			else this.$toolbarArea.append($toolWrapper.append($tool));
		}
		$tool.data(Toolbar.Constants.OBJATTR_TOOL_OPTIONS, toolOptions);
		this.tools[toolOptions.name] = $tool;
		this.toolWrappers[toolOptions.name] = $toolWrapper;
		if (toolOptions.disabled) { this.disable(toolOptions.name); }
	};
	
	Toolbar.prototype.remove = function (toolName) {
		this.toolWrappers[toolName].remove();
	};
	
	Toolbar.prototype.get = function (toolName) {
		return this.tools[toolName];
	};
	
	Toolbar.prototype.contains = function (toolName) {
		return(!(!this.tools[toolName]));
	};
	
	Toolbar.prototype.setData = function (data) {
		var old = this.getData();
		this.$element.data(Toolbar.Constants.OBJATTR_META_DATA, $.extend({}, data));
		if (data.key !== old.key) this.fireDataChanged(old, data);
	};
	
	Toolbar.prototype.getData = function () {
		return $.extend({}, this.$element.data(Toolbar.Constants.OBJATTR_META_DATA));
	};
	
	Toolbar.prototype.clearData = function () {
		this.$element.removeData(Toolbar.Constants.OBJATTR_META_DATA);
		this.fireDataRemoved();
	};
	
	Toolbar.prototype.initialize = function (toolName) {
		var $tool = this.get(toolName);
		var toolOptions = $tool.data(Toolbar.Constants.OBJATTR_TOOL_OPTIONS);
		if (toolOptions.disabled) this.disable(toolName);
		else this.enable(toolName);
	}
	
	Toolbar.prototype.enable = function (toolName) {
		this.get(toolName).removeClass('disabled').removeAttr('disabled');
		this.toolWrappers[toolName].removeClass('disabled');
	};
	
	Toolbar.prototype.disable = function (toolName) {
		this.get(toolName).addClass('disabled').attr('disabled', 'disabled');
		this.toolWrappers[toolName].addClass('disabled');
	};
	
	Toolbar.prototype.addDataListener = function (toolName) {
		this.listeners[toolName] = {};
	};
	
	Toolbar.prototype.fireDataChanged = function (old, data) {
		for (var toolName in this.listeners) {
			var $tool = this.get(toolName);
			var toolOptions = $tool.data(Toolbar.Constants.OBJATTR_TOOL_OPTIONS);
			if (toolOptions.manager != null && !toolOptions.manager.ifActive(data)) {
				this.disable(toolName);
			} else this.enable(toolName);
		}
	};
	
	Toolbar.prototype.fireDataRemoved = function () {
		for (var toolName in this.listeners) {
			this.disable(toolName);
		}
	};
	
	Toolbar.prototype.fireToolClicked = function ($trigger) {
		var toolOptions = $trigger.data(Toolbar.Constants.OBJATTR_TOOL_OPTIONS);
		if(toolOptions && $.isFunction(toolOptions.event)) toolOptions.event.apply(this, [this.getData()]);
	};
	
	Toolbar.prototype.getDefaults = function () {
		return Toolbar.DEFAULTS;
	};

	Toolbar.prototype.getOptions = function (options) {
		options = $.extend(true, {}, this.getDefaults(), options);
		
		return options;
	};
  
	// TOOLBAR PLUGIN DEFINITION
	// ===========================

	function Plugin(option) {
		var self = this;

		// TOOLBAR PUBLIC METHOD DEFINITION
		// ==================================
		self.reset = function () {
			return self.each(function () {
				var $this = $(this);
				var data  = $this.data('jsea.toolbar');
				data.reset();
			});
		};
		self.add = function (toolOptions) {
			return self.each(function () {
				var $this = $(this);
				var data  = $this.data('jsea.toolbar');
				data.add(toolOptions);
			});
		};
		self.remove = function (toolName) {
			return self.each(function () {
				var $this = $(this);
				var data  = $this.data('jsea.toolbar');
				data.remove(toolName);
			});
		};
		self.setData = function (key, type, status) {
			return self.each(function () {
				var $this = $(this);
				var data  = $this.data('jsea.toolbar');
				data.setData(key, type, status);
			});
		};
		self.getData = function () {
			var d = {};
			self.each(function () {
				var $this = $(this);
				var data  = $this.data('jsea.toolbar');
				d         = data.getData();
				return false;
			});
			return d;
		};
		self.clearData = function () {
			return self.each(function () {
				var $this = $(this);
				var data  = $this.data('jsea.toolbar');
				data.clearData();
			});
		};
		self.enable = function (toolName) {
			return self.each(function () {
				var $this = $(this);
				var data  = $this.data('jsea.toolbar');
				data.enable(toolName);
			});
		};
		self.disable = function (toolName) {
			return self.each(function () {
				var $this = $(this);
				var data  = $this.data('jsea.toolbar');
				data.disable(toolName);
			});
		};
		self.contains = function (toolName) {
			var b = false;
			self.each(function () {
				var $this = $(this);
				var data  = $this.data('jsea.toolbar');
				b         = data.contains(toolName);
				return false;
			});
			return b;
		};
		
		return this.each(function () {
			var $this   = $(this);
			
			var data    = $this.data('jsea.toolbar');
			var options = typeof option == 'object' && option;

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.toolbar', (data = new Toolbar(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.toolbar;

	$.fn.toolbar             = Plugin;
	$.fn.toolbar.Constructor = Toolbar;


	// TOOLBAR NO CONFLICT
	// =====================

	$.fn.toolbar.noConflict = function () {
		$.fn.toolbar = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Progress-bar component
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// PROGRESSBAR PUBLIC CLASS DEFINITION
	// =================================

	var Progressbar = function (element, options) {
		this.init('progressbar', element, options);
	};

	Progressbar.VERSION  = '1.0.0';

	Progressbar.DEFAULTS = {
		width     : 'auto',
		height    : 3,
		value     : 0,	// percentage value
		hasText   : false,
		text      : '{value}%',
		onChange  : function (newValue, oldValue){}
	};

	Progressbar.prototype.init = function (type, element, options) {
		this.type      = type;
		this.$element  = $(element);
		this.options   = this.getOptions(options);
		
		this.$element
			.addClass('progressbar');
		this.$element.html('<div class="progressbar-text"></div><div class="progressbar-value"></div>');
	};
	Progressbar.prototype.getValue = function () {
		return this.options.value;
	};
	Progressbar.prototype.setValue = function (value) {
		var that = this;
		if (value < 0)
			value = 0;
		if (value > 100)
			value = 100;
		var opts = that.options;
		var text = opts.text.replace(/{value}/, value);
		var oldValue = opts.value;
		opts.value = value;
		this.$element.find('div.progressbar-value').width(value + '%');
		if (opts.hasText) this.$element.find('div.progressbar-text').html(text);
		if (oldValue != value) {
			opts.onChange.call(this, value, oldValue);
		}
	};
	Progressbar.prototype.getDefaults = function () {
		return Progressbar.DEFAULTS;
	};

	Progressbar.prototype.getOptions = function (options) {
		options = $.extend({}, this.getDefaults(), options);
		
		return options;
	};
  
	// PROGRESSBAR PLUGIN DEFINITION
	// ===========================

	function Plugin(option) {
		var self = this;

		// PROGRESSBAR PUBLIC METHOD DEFINITION
		// ==================================
		var selfArguments = arguments;
		return this.each(function () {
			var $this   = $(this);
			
			var data    = $this.data('jsea.progressbar');
			var options = typeof option == 'object' && option;

			if (!data && /getValue|setValue/.test(option)) return;
			if (!data) $this.data('jsea.progressbar', (data = new Progressbar(this, options)));
			if (typeof option == 'string') data[option](selfArguments[1]);
		});
	}

	var old = $.fn.progressbar;

	$.fn.progressbar             = Plugin;
	$.fn.progressbar.Constructor = Progressbar;


	// PROGRESSBAR NO CONFLICT
	// =====================

	$.fn.progressbar.noConflict = function () {
		$.fn.progressbar = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Page-bar component
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// PAGEBAR PUBLIC CLASS DEFINITION
	// =================================

	var Pagebar = function (element, options) {
		this.init('pagebar', element, options);
	};

	Pagebar.VERSION  = '1.0.0';

	Pagebar.DEFAULTS = {
		current : 1,
		size    : 10,
		total   : 1,
		grid    : null
	};

	Pagebar.prototype.init = function (type, element, options) {
		this.type      = type;
		this.$element  = $(element);
		this.options   = this.getOptions(options);
		
		this.$element
			.addClass('pagebar')
			.append($(document.createElement('DIV'))
				.addClass('pages')
		);
		
		// build pagebar
		this.build();
		
		// locate base elements and handlers
		this.locate0();
		// locate respective ones in the concrete components
		this.locate();
		
		// register handlers
		this.register();
		
		// repaint pagebar based on page info
		this.repaint();
	};
	
	Pagebar.prototype.locate0 = function () {
		var $this = this;
		this.triggers = {
			size  : this.$element.find('.size'),
			first : this.$element.find('.first'),
			prev  : this.$element.find('.prev'),
			next  : this.$element.find('.next'),
			last  : this.$element.find('.last'),
			go    : this.$element.find('.go')
		};
		this.handlers = {
			size  : function (value)   { return { num : 1, size : value }; },
			first : function (trigger) { return { num : 1, size : $this.options.size }; },
			prev  : function (trigger) { return { num : $this.options.current - 1, size : $this.options.size }; },
			next  : function (trigger) { return { num : $this.options.current + 1, size : $this.options.size }; },
			last  : function (trigger) { return { num : $this.options.total, size : $this.options.size }; },
			go    : function (trigger) { return null; }
		};
	};
	
	Pagebar.prototype.register = function () {
		var $this = this;
		this.$element.on('click.jsea', 'A:not(.disabled)', function () {
			var name = $(this).attr('name');
			var info = $this.handlers[name](this);
			if (info != null) $this.options.grid.turnTo(info);
		});
	};
	
	Pagebar.prototype.destroy = function () {
		this.$element.find('.size').selefield('destroy');
		this.$element.off('click.jsea', 'A:not(.disabled)')
			.removeData('jsea.pagebar');
	};
	
	Pagebar.prototype.getDefaults = function () {
		return Pagebar.DEFAULTS;
	};

	Pagebar.prototype.getOptions = function (options) {
		options = $.extend({}, this.getDefaults(), this.$element.data(), options);
		
		return options;
	};
  
	// PAGEBAR PLUGIN DEFINITION
	// ===========================

	function Plugin(option) {
		var self = this;

		// PAGEBAR PUBLIC METHOD DEFINITION
		// ==================================
		
		return this.each(function () {
			var $this   = $(this);
			
			var data    = $this.data('jsea.pagebar');
			var options = typeof option == 'object' && option;

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.pagebar', (data = new Pagebar(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.pagebar;

	$.fn.pagebar             = Plugin;
	$.fn.pagebar.Constructor = Pagebar;


	// PAGEBAR NO CONFLICT
	// =====================

	$.fn.pagebar.noConflict = function () {
		$.fn.pagebar = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Page-bar factory
 * The PagebarFactory object has following methods:
 * newInstance(type)  :  returns new Pagebar instance based on type
 *     @param options
 *            type. prene for <<First<Prev Next>Last>>, more for Load More and folio for 1...3, 4, 5...n (string)
 *            size. init page size
 *            grid. data grid (object)
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
var PagebarFactory = new Object();

PagebarFactory.VERSION = '1.0.0';

PagebarFactory.newInstance = function (options) {
	return $(document.createElement('DIV'))[options.type + 'Pagebar'](options);
};

/**
 * JSEA Page-bar implementation - Prene (Prev-Next) component
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// PAGEBAR.PRENE PUBLIC CLASS DEFINITION
	// =======================================
	
	var PrenePagebar = function (element, options) {
		this.init('pagebar.prene', element, options);
	};

	if (!$.fn.pagebar) throw new Error('PrenePagebar requires components.js');

	PrenePagebar.VERSION = '1.0.0';

	PrenePagebar.DEFAULTS = $.extend({}, $.fn.pagebar.Constructor.DEFAULTS);

	// NOTE: PAGEBAR.PRENE EXTENDS PAGEBAR
	// =====================================
	
	PrenePagebar.prototype = $.extend({}, $.fn.pagebar.Constructor.prototype);

	PrenePagebar.prototype.constructor = PrenePagebar;
	
	PrenePagebar.prototype.build = function () {
		var $this = this;
		this.$element.find('.pages').addClass('prene')
			.append($(document.createElement('LABEL')).text(JSEA.localizeMessage('global.label.page-size')))
			.append($('<input type="text" jsea-select-options="" />').attr('name', 'size').val(this.options.size).addClass('size'))
			.append($(document.createElement('LABEL')).addClass('total'))
			.append($(document.createElement('A')).attr('name', 'prev').attr('href', 'javascript:void(0);').addClass('prev'))
			.append($(document.createElement('A')).attr('name', 'next').attr('href', 'javascript:void(0);').addClass('next'))
			.append($(document.createElement('A')).attr('name', 'first').attr('href', 'javascript:void(0);').addClass('first'))
			.append($(document.createElement('A')).attr('name', 'last').attr('href', 'javascript:void(0);').addClass('last'))
			.append($('<input type="text" jsea-valid-type="number" jsea-valid-rules="{required:true,minValue:1}" />').addClass('num'))
			.append($(document.createElement('A')).attr('name', 'go').attr('href', 'javascript:void(0);').addClass('go'));
		this.$element.find('.size').selefield({
			value : this.options.size,
			nullable : false,
			manualonly : true,
			dropdownItems : [10, 20, 50, 100],
			onChange : function (value) {
				$this.options.grid.turnTo($this.handlers.size(value));
			}
		});
	};

	PrenePagebar.prototype.locate = function () {
		var $this = this;
		this.handlers.go = function () { 
			return ($this.$element.find('.num').validator().perform('pull')) 
				? { num : $this.$element.find('.num').val(), size : $this.options.size } 
				: null; 
		}
	};

	PrenePagebar.prototype.repaint = function () {
		this.$element.find('A').removeClass('disabled').attr('disabled', false);
		this.$element.find('.total').text(this.options.current + '/' + this.options.total);
		if (this.options.current <= 1) {
			this.triggers.prev.addClass('disabled').attr('disabled', true);
			this.triggers.first.addClass('disabled').attr('disabled', true);
		}
		if (this.options.current >= this.options.total) {
			this.triggers.next.addClass('disabled').attr('disabled', true);
			this.triggers.last.addClass('disabled').attr('disabled', true);
		}
		this.$element
			.find('.num')
				.validator()
				.reset()
				.rule('maxValue', this.options.total)
				.val('');
	};

	PrenePagebar.prototype.getDefaults = function () {
		return PrenePagebar.DEFAULTS;
	};

	// PAGEBAR.PRENE PLUGIN DEFINITION
	// =================================
	
	function Plugin(option) {
		var self = this;

		// PAGEBAR.PRENE PUBLIC METHOD DEFINITION
		// ========================================
		
		self.repaint = function (pageInfo) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.pagebar');
				data.options.current = pageInfo.num;
				data.options.size    = pageInfo.size;
				data.options.total   = pageInfo.total;
				data.repaint();
			});
		};
		
		return this.each(function () {
			var $this = $(this);
			
			var data = $this.data('jsea.pagebar');
			var options = typeof option == 'object' && option;

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.pagebar', (data = new PrenePagebar(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.prenePagebar;

	$.fn.prenePagebar             = Plugin;
	$.fn.prenePagebar.Constructor = PrenePagebar;

	// PAGEBAR.PRENE NO CONFLICT
	// ===========================
	
	$.fn.prenePagebar.noConflict = function () {
		$.fn.prenePagebar = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Page-bar implementation - Folio component
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// PAGEBAR.FOLIO PUBLIC CLASS DEFINITION
	// =======================================
	
	var FolioPagebar = function (element, options) {
		this.init('pagebar.folio', element, options);
	};

	if (!$.fn.pagebar) throw new Error('FolioPagebar requires components.js');

	FolioPagebar.VERSION = '1.0.0';

	FolioPagebar.DEFAULTS = $.extend({}, $.fn.pagebar.Constructor.DEFAULTS, {
		first    : 1,
		capacity : 8,
		offset   : 3,
		index    : 0
	});

	// NOTE: PAGEBAR.FOLIO EXTENDS PAGEBAR
	// =====================================
	
	FolioPagebar.prototype = $.extend({}, $.fn.pagebar.Constructor.prototype);

	FolioPagebar.prototype.constructor = FolioPagebar;
	
	FolioPagebar.prototype.build = function () {
		this.$element.find('.pages').addClass('folio')
			.append($(document.createElement('A')).attr('name', 'first').attr('href', 'javascript:void(0);').addClass('first').text(this.options.first))
			.append($(document.createElement('DIV')).addClass('showcase'))
			.append($(document.createElement('A')).attr('name', 'last').attr('href', 'javascript:void(0);').addClass('last').text(this.options.total));
	};

	FolioPagebar.prototype.locate = function () {
		var $this = this;
		this.handlers.go = function (trigger) { 
			var $trigger = $(trigger);
			var index = $trigger.attr('index') - 0;
			return ({ num : index, size : $this.options.size });
		}
	};

	FolioPagebar.prototype.repaint = function () {
		var $pages = this.$element.find('.pages');
		var $showcase = $pages.find('.showcase').empty();
		this.$element.find('A').removeClass('disabled').attr('disabled', false);
		if (this.options.current <= 1) {
			this.triggers.first.addClass('disabled').attr('disabled', true);
		}
		var first = this.options.first + 1;
		var last  = this.options.total - 1;
		this.options.index = ((this.options.current - this.options.offset) > (first - 1)) ? this.options.current - this.options.offset : first;
		this.options.index = ((last - this.options.index) > (this.options.capacity - 1)) ? this.options.index : (last - (this.options.capacity - 1));
		this.options.index = (this.options.index > (first - 1)) ? this.options.index : first;
		if (this.options.index > first) {
			$showcase.append($(document.createElement('SPAN')).text('......'))
		}
		for (var i = 0; i < this.options.capacity; i ++, this.options.index ++) {
			if (this.options.index > last) break;
			if (this.options.current == this.options.index) {
				$showcase.append($(document.createElement('A')).attr('name', 'go').attr('href', 'javascript:void(0);').attr('index', this.options.index).attr('disabled', true).addClass('disabled').addClass('go').text(this.options.index));
			} else {
				$showcase.append($(document.createElement('A')).attr('name', 'go').attr('href', 'javascript:void(0);').attr('index', this.options.index).addClass('go').text(this.options.index));
			}
		}
		this.options.index--; // end of loop, index doesnot need ++
		if (this.options.index < last) {
			$showcase.append($(document.createElement('SPAN')).text('......'))
		}
		this.triggers.last.text(this.options.total);
		if (this.options.total > 1 ) { this.triggers.last.show(); }
		else { this.triggers.last.hide(); }
		if (this.options.current >= this.options.total) {
			this.triggers.last.addClass('disabled').attr('disabled', true);
		}
		this.$element
			.find('.num')
				.validator()
				.reset()
				.rule('maxValue', this.options.total)
				.val('');
	};

	FolioPagebar.prototype.getDefaults = function () {
		return FolioPagebar.DEFAULTS;
	};

	// PAGEBAR.FOLIO PLUGIN DEFINITION
	// =================================
	
	function Plugin(option) {
		var self = this;

		// PAGEBAR.FOLIO PUBLIC METHOD DEFINITION
		// ========================================
		
		self.repaint = function (pageInfo) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.pagebar');
				data.options.current = pageInfo.num;
				data.options.size    = pageInfo.size;
				data.options.total   = pageInfo.total;
				data.repaint();
			});
		};
		
		return this.each(function () {
			var $this = $(this);
			
			var data = $this.data('jsea.pagebar');
			var options = typeof option == 'object' && option;

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.pagebar', (data = new FolioPagebar(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.folioPagebar;

	$.fn.folioPagebar             = Plugin;
	$.fn.folioPagebar.Constructor = FolioPagebar;

	// PAGEBAR.FOLIO NO CONFLICT
	// ===========================
	
	$.fn.folioPagebar.noConflict = function () {
		$.fn.folioPagebar = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Percentage component
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// PERCENTAGE PUBLIC CLASS DEFINITION
	// ====================================

	var Percentage = function (element, options) {
		this.init('percentage', element, options);
	};

	Percentage.VERSION  = '1.0.0';

	Percentage.DEFAULTS = {
		type      : 'BAR',
		value     : 0, // original value: 0 - 1
		scale     : 0
	};

	Percentage.prototype.init = function (type, element, options) {
		this.type      = type;
		this.$element  = $(element);
		this.options   = this.getOptions(options);

		// initialize this Percentage
		this.initComponent();
	};

	Percentage.prototype.initComponent = function () {
		this.$element
			.addClass('percentage')
			.html('<div class="percentage-value"></div><div class="percentage-text"></div>');
		this.render(this.options.value);
	};

	Percentage.prototype.render = function (value) {
		if (value < 0) value = 0;
		if (value > 1) value = 1;
		var percent = Numbers.format.percent(value, this.options.scale);
		this.$element.find('div.percentage-value').width(percent);
		this.$element.find('div.percentage-text').html(percent);
	};

	Percentage.prototype.getValue = function () {
		return this.options.value;
	};

	Percentage.prototype.setValue = function (value) {
		this.options.value = value;
		this.render(value);
	};

	Percentage.prototype.getDefaults = function () {
		return Percentage.DEFAULTS;
	};

	Percentage.prototype.getOptions = function (options) {
		options = $.extend({}, this.getDefaults(), options);
		
		return options;
	};
  
	// PERCENTAGE PLUGIN DEFINITION
	// ==============================

	function Plugin(option) {
		var self = this;

		// PERCENTAGE PUBLIC METHOD DEFINITION
		// =====================================

		return this.each(function () {
			var $this   = $(this);
			var plugin  = $this.data('jsea.plugin');
			var data    = $this.data('jsea.ratingbar');
			var options = typeof option == 'object' && option;

			if (!plugin) $this.data('jsea.plugin', self);

			if (!data && /getValue|setValue/.test(option)) return;
			if (!data) $this.data('jsea.percentage', (data = new Percentage(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.percentage;

	$.fn.percentage             = Plugin;
	$.fn.percentage.Constructor = Percentage;


	// PERCENTAGE NO CONFLICT
	// ========================

	$.fn.percentage.noConflict = function () {
		$.fn.percentage = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Rating-bar component
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// RATINGBAR PUBLIC CLASS DEFINITION
	// ===================================

	var Ratingbar = function (element, options) {
		this.init('ratingbar', element, options);
	};

	Ratingbar.VERSION  = '1.0.0';

	Ratingbar.DEFAULTS = {
		type      : 'percent',
		ratable   : false,
		value     : 0, // original value: 0 - 1
		level     : 1,
		levels    : [1, 2, 3, 4, 5], // 5 levels: 1 - very low; 2 - low; 3 - medium; 4 - high; 5 - very high
		dividers  : [20, 40, 60, 80, 100],
		hasText   : true,
		text      : '{value}%',
		onChange  : function (newValue, oldValue) {}
	};

	Ratingbar.prototype.init = function (type, element, options) {
		this.type      = type;
		this.$element  = $(element);
		this.options   = this.getOptions(options);

		// initialize this Rating-bar
		this.initComponent();
		// initialize events of this Rating-bar
		this.initEvents();
	};

	Ratingbar.prototype.initComponent = function () {
		this.$element
			.addClass('ratingbar level')
			.html('<div class="ratingbar-value"></div><div class="ratingbar-text"></div>');
		var value = this.standardizeValue(this.options.value);
		var level = this.render(value);
		this.options.value = value;
		this.options.level = level;
	};

	Ratingbar.prototype.initEvents = function () {
		var $this = this;
		if (this.options.ratable) {
			this.value    = 0;  // the real-time value while rating
			this.$element.on('mouseenter.jsea touchstart.jsea', function (evt) {
				evt = evt || window.event;
				$this.$element.addClass('rating');
				// event stopper
				evt.preventDefault && evt.preventDefault();
				evt.returnValue = false;
				evt.stopPropagation && evt.stopPropagation();
				evt.cancelBubble = false;
				return false;
			}).on('mousemove.jsea touchmove.jsea', function (evt) {
				evt = evt || window.event;
				var offsetX    = (evt.offsetX !== undefined) ? evt.offsetX : (evt.originalEvent.changedTouches[0].pageX - $this.$element[0].getBoundingClientRect().left);
				var innerWidth = $this.$element.innerWidth();
				$this.value    = this.standardizeValue(Decimal.valueOf(offsetX).divides(innerWidth));
				$this.render($this.value);
				// event stopper
				evt.preventDefault && evt.preventDefault();
				evt.returnValue = false;
				evt.stopPropagation && evt.stopPropagation();
				evt.cancelBubble = false;
				return false;
			}).on('click.jsea touchend.jsea', function (evt) {
				evt = evt || window.event;
				$this.setValue($this.value);
				// event stopper
				evt.preventDefault && evt.preventDefault();
				evt.returnValue = false;
				evt.stopPropagation && evt.stopPropagation();
				evt.cancelBubble = false;
				return false;
			}).on('mouseleave.jsea', function (evt) {
				evt = evt || window.event;
				$this.$element.removeClass('rating');
				$this.render($this.options.value);
				// event stopper
				evt.preventDefault && evt.preventDefault();
				evt.returnValue = false;
				evt.stopPropagation && evt.stopPropagation();
				evt.cancelBubble = false;
				return false;
			});
		}
	};

	Ratingbar.prototype.render = function (value) {
		var level = this.options.level;
		if ('percent' == this.options.type) {
			if (value < 0) value = 0;
			if (value > 1) value = 1;
			value = Decimal.valueOf(value).multiplies(100).toNumber();
		}
		for (var i = 0; i < this.options.dividers.length; i++) {
			this.$element.removeClass('_' + this.options.levels[i]);
		}
		for (var i = 0; i < this.options.dividers.length; i++) {
			if (value <= this.options.dividers[i]) {
				level = this.options.levels[i];
				this.$element.addClass('_' + level);
				break;
			}
		}
		this.$element.find('div.ratingbar-value').width(value + '%');
		if (this.options.hasText) {
			var text = this.options.text.replace(/{value}/, value);
			this.$element.find('div.ratingbar-text').html(text);
		}
		return level;
	};

	Ratingbar.prototype.standardizeValue = function (value) {
		return Decimal.valueOf(value).round(2).toNumber();
	};

	Ratingbar.prototype.getValue = function () {
		return this.options.value;
	};

	Ratingbar.prototype.setValue = function (value) {
		var oldValue = this.options.value;
		var level    = this.render(value);
		if (oldValue != value) {
			this.options.level = level;
			this.options.value = value;
			var fnChange = this.options.onChange;
			if ($.isFunction(fnChange)) {
				fnChange.apply(this.$element.data('jsea.plugin'), [value, oldValue]);
			}
			this.$element.trigger('change');
		}
	};

	Ratingbar.prototype.getDefaults = function () {
		return Ratingbar.DEFAULTS;
	};

	Ratingbar.prototype.getOptions = function (options) {
		options = $.extend({}, this.getDefaults(), options);
		
		return options;
	};
  
	// RATINGBAR PLUGIN DEFINITION
	// =============================

	function Plugin(option) {
		var self = this;

		// RATINGBAR PUBLIC METHOD DEFINITION
		// ====================================
		var selfArguments = arguments;
		return this.each(function () {
			var $this   = $(this);
			var plugin  = $this.data('jsea.plugin');
			var data    = $this.data('jsea.ratingbar');
			var options = typeof option == 'object' && option;

			if (!plugin) $this.data('jsea.plugin', self);

			if (!data && /getValue|setValue/.test(option)) return;
			if (!data) $this.data('jsea.ratingbar', (data = new Ratingbar(this, options)));
			if (typeof option == 'string') data[option](selfArguments[1]);
		});
	}

	var old = $.fn.ratingbar;

	$.fn.ratingbar             = Plugin;
	$.fn.ratingbar.Constructor = Ratingbar;


	// RATINGBAR NO CONFLICT
	// =======================

	$.fn.ratingbar.noConflict = function () {
		$.fn.ratingbar = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Tabs component
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 * @dependence: jQuery Plugin: jquery.responsiveTabs_1.3.6
 */
+function($) {
	'use strict';

	if (!$.fn.responsiveTabs) throw new Error('Tabs requires jquery.responsiveTabs_1.3.6.js');
	
	// TABS PUBLIC CLASS DEFINITION
	// ===============================
	
	var Tabs = function (element, options) {
		this.$element = $(element);
		this.options  = this.getOptions(options);
		this.$core    = this.$element.responsiveTabs({
			acitve    : this.options.current,
			activate  : this.options.onActivate,
			deactivate: this.options.onDeactivate
		});
		this.initAjaxPage();
	};
	
	Tabs.VERSION = '1.0.0';
	
	Tabs.DEFAULTS = $.extend({}, {
		current   : 0,
		onActivate  : function () {},
		onDeactivate: function () {}
	});
	
	Tabs.prototype.initAjaxPage = function () {
		var that = this;
		var $element = this.$element;
		var $ul = this.$element.children('ul');
		var funcname = this.options.funcname;
		$('li', $ul).each(function () {
			var $tab = $(this);
			that.tabOptions = (JSEA.Jsons.parse($tab.attr(JSEA.Constants.ATTR_TAB_OPTIONS)) || {});
			var url = that.tabOptions.url;
			if(url) {
				var $anchor = $('a', $tab);
				var panelSelector = $anchor.attr('href');
				var $panel = $(panelSelector, $element);
				if (url.indexOf("/") == 0) {
					url = url.substring(1, url.length);
				}
				$.ajax({
					url : CONTEXT_PATH + funcname + "/" + url,
					method: 'POST',
					dataType: "html",
					beforeSend : function () {
						$panel.waiting({fixed: true});
					},
					success : function (data) {
						$panel.html(data);
						$panel.waiting('hide');
					}, 
					error : function () {
						$panel.waiting('hide');
					}
				});
			}
		});
	};
	
	Tabs.prototype.destroy = function () {
		if (this.$core) {
			this.$core.responsiveTabs('destroy');
		}
		this.$core = null;
		this.$element.removeData('jsea.tabs');
	};
	
	Tabs.prototype.getDefaults = function () {
		return Tabs.DEFAULTS;
	};
	
	Tabs.prototype.getOptions = function (options) {
		var tabsOptions = JSEA.Jsons.parse(this.$element.attr(JSEA.Constants.ATTR_TABS_OPTIONS));
		
		options = $.extend(true, {}, this.getDefaults(), tabsOptions, options);
		
		var $this = this;
		options.activate = function (evt, oTab) {
			oTab.ref = oTab.panel.attr('id');
			$this.options.onActivate(evt, oTab);
		};
		
		return options;
	};

	// TABS PLUGIN DEFINITION
	// ========================
	function Plugin(option) {
		return this.each(function () {
			var $this = $(this);
			var data = $this.data('jsea.tabs');
			var options = typeof option == 'object' && option;

			if (!data && /destroy/.test(option)) return;
			if (!data) $this.data('jsea.tabs', (data = new Tabs(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.tabs;

	$.fn.tabs             = Plugin;
	$.fn.tabs.Constructor = Tabs;

	// TABS NO CONFLICT
	// ===================
	$.fn.tabs.noConflict = function () {
		$.fn.tabs = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Wizard component
 * 
 * @author Aranjuez
 * @version Oct 01, 2023
 * @since Pyrube-JSEA 1.1
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function($) {
	'use strict';

	// WIZARD PUBLIC CLASS DEFINITION
	// ================================
	var Wizard = function (element, options) {
		this.$element = $(element);
		this.options  = this.getOptions(options);
		this.init();
	};
	
	Wizard.VERSION = '1.1.0';
	
	Wizard.DEFAULTS = {
		current : null,
		steps   : [],
		step    : {
			id    : null,
			url   : null
		}
	};
	
	Wizard.prototype.init = function () {
		var $this = this;
		this.$element.find('.steps li').each(function () {
			var step = JSEA.Jsons.parse($(this).attr(JSEA.Constants.ATTR_STEP_OPTIONS));
			$this.options.steps.push(step);
		});
		this.$element.find('.steps').addClass('_' + this.options.steps.length);
	};
	
	Wizard.prototype.moveStep = function (stepId) {
		var $this = this;
		// ajax get current step body
		var index = this.indexOf(stepId);
		var step  = this.options.steps[index];
		$.ajax({
			url : JSEA.getPageContext().resolveUrl(step.url),
			beforeSend: function () { $this.$element.waiting({ fixed : true }); },
			success : function (data) {
				$this.$element.find('div.step-body').hide();
				$this.$element.find('div#' + stepId).html('').append(data).show();
				// initialize the form of the step moved to
				$this.$form = $this.$element.find('div#' + stepId).find("form");
				if ($this.$form.length != 0) {
					window.Page.formize($this.$form, { nested : true }, null);
				}
				$this.options.current = stepId;
				$this.repaint();
				$this.$element.waiting('hide');
			},
			error : function (xhr) { $this.$element.waiting('hide'); }
		});
	};

	Wizard.prototype.getStep = function (index) {
		return this.options.steps[index];
	};

	Wizard.prototype.saveStep = function (fnSuccess) {
		var $nextTrigger = this.$element.find('div#' + this.options.current).find(JSEA.Constants.TAG_BUTTON + '.next');
		this.$form.data('jsea.plugin').perform({
			mode     : 'save',
			url      : JSEA.Jsons.parse($nextTrigger.attr(JSEA.Constants.ATTR_BUTTON_OPTIONS)).url,
			callback : fnSuccess
		});
	};

	Wizard.prototype.emptyStep = function () {
		this.$form.data('jsea.plugin').afterMoveout();
		this.$element.find('div#' + this.options.current).html('');
		this.$form = null;
	};

	Wizard.prototype.repaint = function () {
		var $this   = this;
		var stepped = true;
		this.$element.find('.steps li').each(function () {
			var $step = $(this);
			$step.removeClass('stepping').removeClass('just').removeClass('stepped');
			var step = JSEA.Jsons.parse($step.attr(JSEA.Constants.ATTR_STEP_OPTIONS));
			if ($this.options.current == step.id) {
				$step.addClass('stepping');
				$step.prev().addClass('just');
				stepped = false;
			} else if (stepped) {
				$step.addClass('stepped');
			}
		});
	};

	Wizard.prototype.indexOf = function (stepId) {
		for (var i = 0; i < this.options.steps.length; i++) {
			var step = this.options.steps[i];
			if (stepId == step.id) return i;
		}
		return -1;
	};

	Wizard.prototype.destroy = function () {
		this.$element.removeData('jsea.wizard');
	};

	Wizard.prototype.getDefaults = function () {
		return Wizard.DEFAULTS;
	};

	Wizard.prototype.getOptions = function (options) {
		var wizardOptions = JSEA.Jsons.parse(this.$element.attr(JSEA.Constants.ATTR_WIZARD_OPTIONS));
		options = $.extend(true, {}, this.getDefaults(), wizardOptions, options);
		return options;
	};

	// WIZARD PLUGIN DEFINITION
	// ==========================
	function Plugin(option) {
		var self = this;

		// WIZARD PUBLIC METHOD DEFINITION
		// =================================
		
		self.moveStep = function (stepId, page) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.wizard');
				data.moveStep(stepId, page);
			});
		};
		
		self.emptyStep = function (stepId) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.wizard');
				data.emptyStep(stepId);
			});
		};
		
		self.getStep = function (index) {
			var stepId = null;

			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.wizard');
				stepId      = data.getStep(index);
				return false;
			});
			
			return stepId;
		};
		
		self.getSteps = function () {
			var steps = null;

			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.wizard');
				steps       = data.options.steps;
				return false;
			});
			
			return steps;
		};
		
		self.saveStep = function (fnSuccess) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('jsea.wizard');
				data.saveStep(fnSuccess);
			});
		};
		
		return this.each(function() {
			var $this = $(this);
			var data = $this.data('jsea.wizard');
			var options = typeof option == 'object' && option;

			if (!data && /destroy/.test(option)) return;
			if (!data) $this.data('jsea.wizard', (data = new Wizard(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.wizard;

	$.fn.wizard	            = Plugin;
	$.fn.wizard.Constructor = Wizard;

	// WIZARD NO CONFLICT
	// ====================
	$.fn.wizard.noConflict = function () {
		$.fn.wizard = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Waiting component
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// WAITING PUBLIC CLASS DEFINITION
	// =================================

	var Waiting = function (element, options) {
		this.init('waiting', element, options);
	};

	Waiting.VERSION  = '1.0.0';

	/**
	 *  waitingClass : the plugin defalut class
		position : value can be 'center', 'top', 'right', 'bottom', 'left', 'center bottom' or 'top left' etc. it is the loading.gif position in the '$indicator' element.
	 	overlay : true means it will add overlay div, the defalut is true
	 	fixed : true means the $container position is relative the browser windows, the defalut is false.
	 	when you want the loding.gif in the center of the windows you can set the fiexd : true.
	 */
	Waiting.DEFAULTS = {
		waitingClass : 'waiting',
		position     : 'center',
		overlay      : true,
		fixed        : false
	};

	Waiting.prototype.init = function (type, element, options) {
		this.type = type;
		this.$element = $(element);
		this.options = this.getOptions(options);
		this.$container = $('<div class="waiting-container hidden" />');
		this.$indicator = $('<div class="waiting-indicator" />').appendTo(
				this.$container);

		if (this.options.overlay) {
			//for waiting overlay
			this.$overlay = $('<div class="waiting-overlay"/>');
			this.$element.after(this.$overlay);
		}

		if (this.options.overlay && this.options.position !== 'custom') {
			this.$indicator.addClass(this.options.position);
		}

		if (this.options.fixed) {
			this.$container.addClass('fixed');
		}
		
		this.show();
	};

	Waiting.prototype.show = function () {
		if (!this.options.fixed) {
			this.$element.addClass(this.options.waitingClass);
		}
		this.$container.appendTo(this.$element).removeClass('hidden');
	};

	Waiting.prototype.hide = function () {
		this.$container.addClass('hidden');
		this.$container.detach();
		this.$element.removeClass(this.options.waitingClass);
		this.$element.removeClass('disabled');
		this.$overlay.remove();
		this.$element.removeData('jsea.waiting');
	};
	
	Waiting.prototype.getDefaults = function () {
		return Waiting.DEFAULTS;
	};

	Waiting.prototype.getOptions = function (options) {
		options = $.extend({}, this.getDefaults(), options);
		
		return options;
	};
  
	// WAITING PLUGIN DEFINITION
	// ===========================

	function Plugin(option) {
		var self = this;

		// WAITING PUBLIC METHOD DEFINITION
		// ==================================
		
		return this.each(function () {
			var $this   = $(this);
			
			var data    = $this.data('jsea.waiting');
			var options = typeof option == 'object' && option;

			if (!data && /show|hide/.test(option)) return;
			if (!data) $this.data('jsea.waiting', (data = new Waiting(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.waiting;

	$.fn.waiting             = Plugin;
	$.fn.waiting.Constructor = Waiting;


	// WAITING NO CONFLICT
	// =====================

	$.fn.waiting.noConflict = function () {
		$.fn.waiting = old;
		return this;
	};

}(jQuery);

/**
 * JSEA Loading component
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// LOADING PUBLIC CLASS DEFINITION
	// =================================

	var Loading = function (element, options) {
		this.init('loading', element, options);
	};

	Loading.VERSION  = '1.0.0';

	Loading.DEFAULTS = {
		url      : null
	};
	
	Loading.prototype.init = function (type, element, options) {
		this.type      = type;
		this.$element  = $(element);
		this.options   = this.getOptions(options);
		
		this.perform();
	};
	
	Loading.prototype.perform = function () {
		var $this = this;
		$.ajax({
			url: JSEA.getPageContext().resolveUrl(this.options.url),
			data: null,
			method: 'POST',
			dataType: "html",
			beforeSend: function () {
				$this.$element.waiting();
			},
			success: function (data) {
				var $that = $(data).appendTo($this.$element);
				for (var i = 0; i < $that.length; i++) {
					var elem = $that[i];
					if ("FORM" == elem.tagName) {
						$(elem)[$(elem).attr(JSEA.Constants.ATTR_FORM_TYPE) + 'form']();
					}
				}
				$this.$element.waiting('hide');
			},
			error: function () {
				$this.$element.waiting('hide');
			}
		});
	};
	
	Loading.prototype.getDefaults = function () {
		return Loading.DEFAULTS;
	};

	Loading.prototype.getOptions = function (options) {
		var loadingOptions = JSEA.Jsons.parse(this.$element.attr(JSEA.Constants.ATTR_LOADING_OPTIONS));
		
		options = $.extend({}, this.getDefaults(), loadingOptions, options);
		
		return options;
	};
  
	// LOADING PLUGIN DEFINITION
	// ===========================

	function Plugin(option) {
		var self = this;

		// LOADING PUBLIC METHOD DEFINITION
		// ==================================
		
		return this.each(function () {
			var $this   = $(this);
			
			var data    = $this.data('jsea.loading');
			var options = typeof option == 'object' && option;

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.loading', (data = new Loading(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.loading;

	$.fn.loading             = Plugin;
	$.fn.loading.Constructor = Loading;


	// LOADING NO CONFLICT
	// =====================

	$.fn.loading.noConflict = function () {
		$.fn.loading = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Scrolling component
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// SCROLLING PUBLIC CLASS DEFINITION
	// ===================================

	var Scrolling = function (element, options) {
		this.init('scrolling', element, options);
	};

	Scrolling.VERSION  = '1.0.0';

	Scrolling.DEFAULTS = {
		content  : 'image',
		vertical : false,
		items    : null,
		interval : 5000
	};
	
	Scrolling.prototype.init = function (type, element, options) {
		this.type      = type;
		this.$element  = $(element);
		this.options   = this.getOptions(options);
		
		this.$element.addClass('scrolling-container');
		
		// build scrolling container
		this.build();
	};
	
	Scrolling.prototype.build = function () {
		var $this = this;
		var $area = $(document.createElement('UL')).addClass('items').appendTo(this.$element);
		if ('image' == this.options.content) {
			this.options.loaded = [];
			for (var i = 0; i < this.options.items.length; i++) {
				this.options.loaded[i] = false;
				$area.append(
					$(document.createElement('LI')).append(
						$(document.createElement('DIV')).addClass('img')
							.css('background-image', 'url(' + JSEA.getPageContext().resolveUrl(this.options.items[i]) + ')')
							.append(
									$(document.createElement('IMG')).attr('index', i)
																	.attr('src', JSEA.getPageContext().resolveUrl(this.options.items[i])))));
			}
			this.$element.find('img').on('load', function () {
				$this.options.loaded[$(this).attr('index')] = true;
				if ($this.allLoaded()) $this.afterBuild();
			});
		}
		
		var $indexArea = $(document.createElement('OL')).appendTo(this.$element);;
		for (var i = 0; i < this.options.items.length; i++) {
			$indexArea.append(
				$(document.createElement('LI')).append(
					$(document.createElement('P')).attr('name', 'index')
													.attr('index', i)
													.addClass('index')));
		}
		this.$element.append($(document.createElement('P')).attr('name', 'prev')
															.addClass('prev'))
					.append($(document.createElement('P')).attr('name', 'next')
															.addClass('next'));
	};
	
	Scrolling.prototype.allLoaded = function () {
		for (var i in this.options.loaded) {
			if (!this.options.loaded[i]) return false;
		}
		return true;
	};
	
	Scrolling.prototype.afterBuild = function () {
		var $this = this;
		var $area = this.$element.find('.items');
		// then init scrolling parameters
		this.options.step = (this.options.vertical) ? this.$element.find('img')[0].offsetHeight : this.$element.find('img')[0].offsetWidth;
		$area.css((this.options.vertical ? 'height' : 'width'), this.options.items.length * this.options.step + 'px');
		$area.find('li').css((this.options.vertical ? 'height' : 'width'), this.options.step + 'px');
		this.options.lastOffset = 0;
		this.options.current = 0;
		this.options.total = this.options.items.length;
		this.options.timer = setInterval(function () { $this.scrollToNext(); }, this.options.interval);
		this.options.speed = 0;
		this.options.scrollingTimer = null;
		
		// locate elements and handlers
		this.locate();
		
		// register handlers
		this.register();
		
		// highlight the current index
		this.highlightIndex(this.options.current);
	};
	
	Scrolling.prototype.locate = function () {
		var $this = this;
		this.triggers = {
			prev  : this.$element.find('.prev'),
			next  : this.$element.find('.next'),
			index : this.$element.find('.index')
		};
		this.handlers = {
			prev  : function () { return { index : $this.options.current - 1, prevOrNext : 'prev' }; },
			next  : function () { return { index : $this.options.current + 1, prevOrNext : 'next' }; },
			index : function () { return { prevOrNext : 'index' }; }
		};
	};
	
	Scrolling.prototype.register = function () {
		var $this = this;
		this.$element.on('click', 'P:not(.disabled)',  function () {
			var name = $(this).attr('name');
			var target = $this.handlers[name]();
			if (target.prevOrNext == 'index') {
				target.index = $(this).attr('index');
			}
			$this.scrollTo(target);
		});
		this.$element.on('mouseover', function () {
			if ($this.options.timer) {
				clearInterval($this.options.timer);
				$this.options.timer = null;
			}
		}).on('mouseout', function () {
			if (!$this.options.timer) {
				$this.options.timer = setInterval(function () { $this.scrollToNext(); }, $this.options.interval);
			}
		});
	};
	
	Scrolling.prototype.highlightIndex = function (index) {
		var $indexes = this.$element.find('.index').removeClass('current');
		$($indexes[index]).addClass('current');
	};
	
	Scrolling.prototype.scrollToNext = function () {
		var target = {
			index : this.options.current + 1,
			prevOrNext : 'next'
		};
		this.scrollTo(target);
	};
	
	Scrolling.prototype.scrollTo = function (target) {
		var $this = this;
		var prevOrNext = target.prevOrNext;
		var index = ('prev' == prevOrNext) 
			? (target.index < 0 ? this.options.total - 1 : target.index) 
			: ('next' == prevOrNext 
				? (target.index >= this.options.total ? 0 : target.index) 
				: target.index);
		this.highlightIndex(index);
		if (this.options.scrollingTimer) {
			clearInterval(this.options.scrollingTimer);
			this.options.scrollingTimer = null;
			this.afterScroll(prevOrNext, this.options.lastOffset);
		}
		var itemOffset = index - this.options.current;
		var posTarget = 0;
		if ('next' == prevOrNext) {
			posTarget = - this.options.step;
			itemOffset = 1;
		} else if ('prev' == prevOrNext) {
			posTarget = 0;
			this.beforeScroll(prevOrNext, 1);
			itemOffset = 1;
		} else {
			if (itemOffset < 0) {
				posTarget = 0;
				this.beforeScroll(prevOrNext, Math.abs(itemOffset));
			} else {
				posTarget = - itemOffset * this.options.step;
			}
		}
		
		this.options.current = index;
		this.options.lastOffset = itemOffset;
		this.options.scrollingTimer = setInterval(function () { $this.beScrolling(posTarget, itemOffset, prevOrNext); }, 5)
	};
	
	Scrolling.prototype.beforeScroll = function (prevOrNext, itemOffset) {
		var $area = this.$element.find('.items');
		for (var i = 0; i < itemOffset; i++) {
			var first = $area.find('li')[0];
			var last  = $area.find('li')[this.options.total - 1];
			$area[0].insertBefore(last, first);
		}
		$area.css((this.options.vertical ? 'top' : 'left'), - itemOffset * this.options.step) + 'px';
		this.options.speed = - itemOffset * this.options.step;
	};
	
	Scrolling.prototype.afterScroll = function (prevOrNext, itemOffset) {
		if (itemOffset > 0 && 'prev' != prevOrNext) {
			var $area = this.$element.find('.items');
			for (var i = 0; i < itemOffset; i++) {
				var first = $area.find('li')[0];
				$area[0].appendChild(first);
			}
			$area.css((this.options.vertical ? 'top' : 'left'), '0px');
			this.options.speed = 0;
		}
	};
	
	Scrolling.prototype.beScrolling = function (posTarget, itemOffset, prevOrNext) {
		var $area = this.$element.find('.items');
		$area.css((this.options.vertical ? 'top' : 'left'), this.options.speed + 'px');
		this.options.speed += (posTarget - (this.options.vertical ? $area[0].offsetTop : $area[0].offsetLeft)) / 30;
		if (Math.abs(posTarget - (this.options.vertical ? $area[0].offsetTop : $area[0].offsetLeft)) === 0) {
			$area.css((this.options.vertical ? 'top' : 'left'), posTarget + 'px');
			clearInterval(this.options.scrollingTimer);
			this.options.scrollingTimer = null;
			if (posTarget) {
				this.afterScroll(prevOrNext, itemOffset);
			}
		}
	};
	
	Scrolling.prototype.getDefaults = function () {
		return Scrolling.DEFAULTS;
	};

	Scrolling.prototype.getOptions = function (options) {
		var scrollingOptions = JSEA.Jsons.parse(this.$element.attr(JSEA.Constants.ATTR_SCROLLING_OPTIONS));
		
		options = $.extend({}, this.getDefaults(), scrollingOptions, options);
		
		return options;
	};
  
	// SCROLLING PLUGIN DEFINITION
	// =============================

	function Plugin(option) {
		var self = this;

		// SCROLLING PUBLIC METHOD DEFINITION
		// ====================================
		
		return this.each(function () {
			var $this   = $(this);
			
			var data    = $this.data('jsea.scrolling');
			var options = typeof option == 'object' && option;

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.scrolling', (data = new Scrolling(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.scrolling;

	$.fn.scrolling             = Plugin;
	$.fn.scrolling.Constructor = Scrolling;


	// SCROLLING NO CONFLICT
	// =======================

	$.fn.scrolling.noConflict = function () {
		$.fn.scrolling = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Chart component
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 */
+function ($) {
	'use strict';

	// CHART PUBLIC CLASS DEFINITION
	// ===============================

	var Chart = function (element, options) {
		this.init('chart', element, options);
	};

	Chart.VERSION  = '1.0.0';

	Chart.DEFAULTS = {
		url     : null,
		title   : null,
		type    : 'BAR',
		padding : 5,
		xmlns   : 'http://www.w3.org/2000/svg',
		base    : { x : 0, y : 0},
		dataset : [{
			label  : null, // legend label. it is an i18n key.
			format : null,
			ccy    : null, // currency code. string
			data   : []
		}],
		xaxis   : {
			name       : null, // unit name/name of axis. it is an i18n key. show it at the end if any
			ticks      : null, // an array of ticks. it could be i18n keys
			label      : null, // axis label. it is an i18n key. tick will be a parameter of its if any
			format     : null
		},
		yaxis   : {
			name       : null, // unit name/name of axis. it is an i18n key. show it at the end if any
			ticks      : null,
			format     : null,
			ccy        : null, // currency code. string
			unit       : null, // tick unit. it could be an i18n key.
			base       : 0,
			tickval    : 0,
			end        : 0,
			max        : 0
		},
		legend  : {
			position   : 'top',
			width      : 16,
			spacing    : 12,
			padding    : 20
		}
	};

	Chart.prototype.init = function (type, element, options) {
		this.type      = type;
		this.$element  = $(element);
		this.options   = this.getOptions(options);
		
		this.initComponent();
	};

	Chart.prototype.initComponent = function () {
		this.$canvas = $(document.createElement('SVG'))
							.attr('xmlns', this.options.xmlns)
							.appendTo(this.$element);
		this.$element.addClass('chart-container');
		// load chart data
		this.load();
	};
	
	Chart.prototype.load = function () {
		var $this = this;
		$.ajax({
			url: JSEA.getPageContext().resolveUrl(this.options.url),
			type: 'get',
			dataType: "json",
			beforeSend: function () {
				$this.$element.waiting();
			},
			success: function (chart) {
				$this.options.dataset = chart.dataset;
				$this.options.xaxis   = chart.xaxis || $this.options.xaxis;
				$this.options.yaxis   = chart.yaxis || $this.options.yaxis;
				$this.options.title   = chart.title;
				$this.drawComponent();
				$this.$element.waiting('hide');
			},
			error: function () {
				$this.$element.waiting('hide');
			}
		});
	};

	Chart.prototype.initDefaultEvents = function () {
		this.$element.off('.jsea').on('mouseenter.jsea', '.tip-owner, .tooltip', function (evt) {
			evt       = evt || window.event;
			var $this = $(this);
			var $text = $this.parent().find('.tooltip');
			var clz   = $text.attr('class') || '';
			if ((' ' + clz + ' ').indexOf(' hidden ') >= 0) {
				$text.attr('class', clz.split(' ').filter(item => { return item != 'hidden'; }).join(' '));
			}
			// event stopper
			evt.preventDefault && evt.preventDefault();
			evt.returnValue = false;
			evt.stopPropagation && evt.stopPropagation();
			evt.cancelBubble = false;
			return false;
		}).on('mouseleave.jsea', '.tip-owner, .tooltip', function (evt) {
			evt       = evt || window.event;
			var $this = $(this);
			var $text = $this.parent().find('.tooltip');
			var clz   = $text.attr('class') || '';
			if ((' ' + clz + ' ').indexOf(' hidden ') < 0) {
				$text.attr('class', clz + ' hidden');
			}
			// event stopper
			evt.preventDefault && evt.preventDefault();
			evt.returnValue = false;
			evt.stopPropagation && evt.stopPropagation();
			evt.cancelBubble = false;
			return false;
		});
	};

	Chart.prototype.drawComponent = function () {
		this.painter = new this[this.options.type.toLowerCase().capitalize() + 'Painter'](this.$canvas, this.options);
		this.$canvas = this.painter.draw();
		// draw SVG with innerHTML
		this.$element.empty()
			.html(this.$canvas.prop("outerHTML"));

		Tipbox.bind(this.$element);
		// initialize default events
		this.initDefaultEvents();
	};

	// CHART.PAINTER INNER CLASS DEFINITION
	// ======================================

	Chart.prototype.Painter = function ($canvas, chart) { };

	Chart.prototype.Painter.prototype.constructor = Chart.prototype.Painter;

	Chart.prototype.Painter.prototype.init = function ($canvas, chart) {
		this.$canvas = $canvas;
		this.chart   = chart;
		this.width   = this.$canvas.innerWidth();
		this.height  = this.$canvas.innerHeight();
	};

	Chart.prototype.Painter.prototype.draw = function () {
		// calculate first
		this.calculate()
		// draw the chart then
		this.drawXaxis();
		this.drawYaxis();
		this.drawBox();
		this.drawLegend();
		this.drawTitle();
		return this.$canvas;
	};

	Chart.prototype.Painter.prototype.calculate  = null;
	Chart.prototype.Painter.prototype.drawXaxis  = null;
	Chart.prototype.Painter.prototype.drawYaxis  = null;
	Chart.prototype.Painter.prototype.drawBox    = null;

	Chart.prototype.Painter.prototype.drawLegend = function () {
		var $legend = $(document.createElement('G'))
							.addClass('legend')
							.addClass(this.chart.legend.position)
							.appendTo(this.$canvas);
		var dataset = this.chart.dataset;
		for (var i = 0; i < dataset.length; i++) {
			var $pair = $(document.createElement('G')).appendTo($legend);
			var $bar  = $(document.createElement('RECT'))
							.attr('x', (this.chart.legend.width + this.chart.legend.spacing) * i)
							.attr('y', - this.chart.legend.padding)
							.addClass('bar')
							.addClass('_' + (i + 1))
							.appendTo($pair);
			$(document.createElement('TEXT'))
							.attr('x', (this.chart.legend.width + this.chart.legend.spacing) * i)
							.attr('y', - this.chart.legend.padding)
							.addClass('label')
							.addClass('_' + (i + 1))
							.text(JSEA.localizeMessage(dataset[i].label))
							.appendTo($pair);
		}
		return $legend;
	};

	Chart.prototype.Painter.prototype.drawTitle = function () {
		var $title = $(document.createElement('G'))
							.addClass('title')
							.appendTo(this.$canvas);
		$(document.createElement('TEXT'))
							.attr('x', '50%')
							.attr('y', '110%')
							.text(JSEA.localizeMessage(this.chart.title))
							.appendTo($title);
		return $title;
	};

	// CHART.PAINTER.BAR EXTENDS CHART.PAINTER
	// =========================================

	Chart.prototype.BarPainter = function ($canvas, chart) {
		this.init($canvas, chart);
	};

	Chart.prototype.BarPainter.prototype = $.extend({}, Chart.prototype.Painter.prototype);

	Chart.prototype.BarPainter.prototype.constructor = Chart.prototype.BarPainter;

	Chart.prototype.BarPainter.prototype.calculate = function () {
		var all = [];
		for (var i = 0; i < this.chart.dataset.length; i++) {
			all = all.concat(this.chart.dataset[i].data);
		}
		this.chart.yaxis.max      = Math.max.apply(null, all);
		this.chart.yaxis.end      =  this.chart.yaxis.base;
		this.chart.yaxis.ticks    = [this.chart.yaxis.end];
		while (this.chart.yaxis.end < this.chart.yaxis.max) {
			this.chart.yaxis.end += this.chart.yaxis.tickval;
			this.chart.yaxis.ticks.push(this.chart.yaxis.end);
		}
	};

	Chart.prototype.BarPainter.prototype.drawXaxis = function () {
		var $xaxis = $(document.createElement('G'))
							.addClass('xaxis')
							.appendTo(this.$canvas);
		// base tick
		$(document.createElement('G'))
			.append($(document.createElement('LINE'))
							.attr('x1', this.chart.base.x)
							.attr('x2', this.chart.base.x)
							.attr('y1', this.chart.base.y)
							.attr('y2', this.height))
			.appendTo($xaxis);
		var ticks = this.chart.xaxis.ticks;
		var label = this.chart.xaxis.label;
		this.chart.xaxis.ticklen = Decimal.valueOf(this.width).divides(ticks.length).toNumber();
		for (var i = 0; i < ticks.length; i++) {
			$(document.createElement('G'))
				.append($(document.createElement('LINE'))
							.attr('x1', this.chart.xaxis.ticklen * (i + 1))
							.attr('x2', this.chart.xaxis.ticklen * (i + 1))
							.attr('y1', this.height)
							.attr('y2', this.height + this.chart.padding))
				.append($(document.createElement('TEXT'))
							.text((label) ? JSEA.localizeMessage(label, ticks[i]) : JSEA.localizeMessage(ticks[i]))
							.attr('x', this.chart.xaxis.ticklen * (i + 1))
							.attr('y', this.height))
				.appendTo($xaxis);
		}
		return $xaxis;
	}

	Chart.prototype.BarPainter.prototype.drawYaxis = function () {
		var $yaxis = $(document.createElement('G'))
							.addClass('yaxis')
							.appendTo(this.$canvas);
		var ticks  = this.chart.yaxis.ticks.reverse();
		var format = this.chart.yaxis.format;
		var ccy    = this.chart.yaxis.ccy;
		var unit   = this.chart.yaxis.unit;
		this.chart.yaxis.ticklen = Decimal.valueOf(this.height).divides(ticks.length - 1).toNumber();
		for (var i = 0; i < ticks.length; i++) {
			$(document.createElement('G'))
				.append($(document.createElement('TEXT'))
							.text((format) ? JSEA.Constants.FORMATTERS[format](ticks[i], (ccy || unit || undefined)) : ticks[i])
							.attr('x', - this.chart.padding)
							.attr('y', this.chart.yaxis.ticklen * i))
				.append($(document.createElement('LINE'))
							.attr('x1', this.chart.base.x)
							.attr('x2', this.width)
							.attr('y1', this.chart.yaxis.ticklen * i)
							.attr('y2', this.chart.yaxis.ticklen * i))
				.appendTo($yaxis);
		}
		return $yaxis;
	};

	Chart.prototype.BarPainter.prototype.drawBox = function () {
		var $box    = $(document.createElement('G'))
							.addClass('box')
							.appendTo(this.$canvas);
		var dataset = this.chart.dataset;
		var barL    = this.locateFirstBar();
		for (var i = 0; i < dataset.length; i++) {
			var $bars = $(document.createElement('G')).appendTo($box);
			for (var j = 0; j < dataset[i].data.length; j++) {
				// ((value - base) / (end - base)) * height
				var barH = Decimal.valueOf(dataset[i].data[j] - this.chart.yaxis.base)
									.divides(this.chart.yaxis.end - this.chart.yaxis.base).multiplies(this.height).toNumber();
				var barS = barL.s + this.chart.xaxis.ticklen * j + barL.w * i;
				var format = dataset[i].format;
				var ccy    = dataset[i].ccy;
				var value  = dataset[i].data[j];
				$(document.createElement('G'))
					.append($(document.createElement('RECT'))
							.attr('x', barS)
							.attr('y', this.height - barH)
							.attr('rx', 8)
							.attr('width', barL.w)
							.attr('height', barH)
							.attr(JSEA.Constants.ATTR_TOOLTIPS, value)
							.addClass('tip-owner')
							.addClass('bar')
							.addClass('_' + (i + 1)))
					.append($(document.createElement('TEXT'))
							.attr('x', barS + barL.w / 2)
							.attr('y', this.height - barH)
							.addClass('tooltip')
							.addClass('hidden')
							.text((format) ? JSEA.Constants.FORMATTERS[format](value, (ccy || undefined)) : value))
					.appendTo($bars);
			}
		}
		return $box;
	};

	Chart.prototype.BarPainter.prototype.locateFirstBar = function () {
		var dataset = this.chart.dataset;
		var percent = 0.1;
		switch (dataset.length) {
			case 1: percent = 0.5;  break;
			case 2: percent = 0.3;  break;
			case 3: percent = 0.25; break;
			case 4: percent = 0.2;  break;
			case 5: percent = 0.15; break;
		}
		var xTicklen = this.chart.xaxis.ticklen;
		var w = Decimal.valueOf(xTicklen).multiplies(percent).toNumber();
		var s = Decimal.valueOf(xTicklen).subtracts(Decimal.valueOf(w).multiplies(dataset.length).toNumber()).divides(2).toNumber();
		return { w : w, s : s };
	};

	// CHART.PAINTER.LINE EXTENDS CHART.PAINTER.BAR
	// ==============================================

	Chart.prototype.LinePainter = function ($canvas, chart) {
		this.init($canvas, chart);
	};

	Chart.prototype.LinePainter.prototype = $.extend({}, Chart.prototype.BarPainter.prototype);

	Chart.prototype.LinePainter.prototype.constructor = Chart.prototype.LinePainter;

	Chart.prototype.LinePainter.prototype.drawBox = function () {
		var $box    = $(document.createElement('G'))
							.addClass('box')
							.appendTo(this.$canvas);
		var dataset = this.chart.dataset;
		var dotL    = this.locateFirstDot();
		for (var i = 0; i < dataset.length; i++) {
			var $dots = $(document.createElement('G')).appendTo($box);
			var points = [];
			var $line = $(document.createElement('POLYLINE'))
							.addClass('tip-owner')
							.addClass('line')
							.addClass('_' + (i + 1))
							.appendTo($dots);
			for (var j = 0; j < dataset[i].data.length; j++) {
				// ((value - base) / (end - base)) * height
				var dotCy = Decimal.valueOf(dataset[i].data[j] - this.chart.yaxis.base)
									.divides(this.chart.yaxis.end - this.chart.yaxis.base).multiplies(this.height).toNumber();
				var dotCx = dotL.cx + Decimal.valueOf(this.chart.xaxis.ticklen).multiplies(j).toNumber();
				var format = dataset[i].format;
				var ccy    = dataset[i].ccy;
				var value  = dataset[i].data[j];
				$(document.createElement('G'))
					.append($(document.createElement('CIRCLE'))
							.attr('cx', dotCx)
							.attr('cy', this.height - dotCy)
							.attr('r', dotL.r)
							.attr(JSEA.Constants.ATTR_TOOLTIPS, value)
							.addClass('tip-owner')
							.addClass('dot')
							.addClass('_' + (i + 1)))
					.append($(document.createElement('TEXT'))
							.attr('x', dotCx)
							.attr('y', this.height - dotCy)
							.addClass('tooltip')
							.addClass('hidden')
							.text((format) ? JSEA.Constants.FORMATTERS[format](value, (ccy || undefined)) : value))
					.appendTo($dots);
				points.push(dotCx + ',' + (this.height - dotCy));
			}
			$line.attr('points', points.join(' '))
		}
		return $box;
	};

	Chart.prototype.LinePainter.prototype.locateFirstDot = function () {
		var dataset = this.chart.dataset;
		var percent = 0.05;
		var xTicklen = this.chart.xaxis.ticklen;
		var r  = Decimal.valueOf(xTicklen).multiplies(percent).toNumber();
		var cx = Decimal.valueOf(xTicklen).divides(2).toNumber();
		return { r : r, cx : cx };
	};

	// CHART.PAINTER.PIE EXTENDS CHART.PAINTER
	// =========================================

	Chart.prototype.PiePainter = function ($canvas, chart) {
		this.init($canvas, chart);
	};

	Chart.prototype.PiePainter.prototype = $.extend({}, Chart.prototype.Painter.prototype);

	Chart.prototype.PiePainter.prototype.constructor = Chart.prototype.PiePainter;

	Chart.prototype.PiePainter.prototype.calculate = function () {
		// the base point - center of circle
		this.chart.base = {
			x : this.width / 2,
			y : this.height / 2
		};
		this.radius   = Math.min(this.chart.base.x, this.chart.base.y) * 0.8;
		// sub-totals
		var subtotals = [];
		var dataset   = this.chart.dataset;
		for (var i = 0; i < dataset.length; i++) {
			for (var j = 0; j < dataset[i].data.length; j++) {
				subtotals[j] = subtotals[j] || 0;
				subtotals[j] += dataset[i].data[j];
			}
		}
		this.chart.xaxis.subtotals = subtotals;
	};

	Chart.prototype.PiePainter.prototype.drawXaxis = function () { return null; };

	Chart.prototype.PiePainter.prototype.drawYaxis = function () { return null; };

	Chart.prototype.PiePainter.prototype.drawBox = function () {
		var $box    = $(document.createElement('G'))
							.addClass('box')
							.appendTo(this.$canvas);
		var dataset = this.chart.dataset;
		var subtotals = this.chart.xaxis.subtotals;
		var ringW   = Decimal.valueOf(this.radius).divides(subtotals.length).toNumber();
		for (var j = 0; j < subtotals.length; j++) {
			var $ring  = $(document.createElement('G')).appendTo($box);
			var angle0 = 0;
			for (var i = 0; i < dataset.length; i++) {
				var angle = 360 * dataset[i].data[j] / subtotals[j];
				var piece = this.locatePath(this.radius - ringW * j, angle0, angle0 + angle);
				angle0   += angle;
				var format = dataset[i].format;
				var ccy    = dataset[i].ccy;
				var value  = dataset[i].data[j];
				$(document.createElement('G'))
					.append($(document.createElement('PATH'))
							.attr('d', piece.d.join(' '))
							.attr(JSEA.Constants.ATTR_TOOLTIPS, value)
							.addClass('tip-owner')
							.addClass('pie')
							.addClass('_' + (i + 1)))
					.append($(document.createElement('TEXT'))
							.attr('x', piece.x)
							.attr('y', piece.y)
							.addClass('tooltip')
							.addClass('hidden')
							.text((format) ? JSEA.Constants.FORMATTERS[format](value, (ccy || undefined)) : value))
					.appendTo($ring);
			}
			Tipbox.bind($ring);
		}
		return $box;
	};

	Chart.prototype.PiePainter.prototype.locatePath = function (radius, angle0, angle1) {
		var d  = [];
		var bx = this.chart.base.x,
			by = this.chart.base.y;
		var dist0 = this.calcAngleDist(angle0);
		var { x : x1, y : y1 } = { 
				x : bx + radius * Math.sin(dist0),
				y : by - radius * Math.cos(dist0)
			};
		d.push(`M ${bx} ${by} L ${x1} ${y1}`);
		var dist1 = this.calcAngleDist(angle1);
		var { x : x2, y : y2 } = { 
				x : bx + radius * Math.sin(dist1),
				y : by - radius * Math.cos(dist1)
			};
		d.push(`A ${radius} ${radius} 0 ${angle1 - angle0 > 180 ? 1 : 0} 1 ${x2} ${y2}`);
		d.push('Z');
		var dist = this.calcAngleDist(angle0 + (angle1 - angle0) / 2);
		return {
			d : d,
			x : bx + radius * Math.sin(dist),
			y : by - radius * Math.cos(dist)
		};
	};

	Chart.prototype.PiePainter.prototype.calcAngleDist = function (angle) {
		return Decimal.valueOf(angle).multiplies(Math.PI).divides(180).toNumber();
		//return angle * Math.PI / 180;
	};

	Chart.prototype.getDefaults = function () {
		return Chart.DEFAULTS;
	};

	Chart.prototype.getOptions = function (options) {
		var chartOptions = JSEA.Jsons.parse(this.$element.attr(JSEA.Constants.ATTR_CHART_OPTIONS));
		
		options = $.extend({}, this.getDefaults(), chartOptions, options);
		
		return options;
	};
  
	// CHART PLUGIN DEFINITION
	// =========================

	function Plugin(option) {
		var self = this;

		// CHART PUBLIC METHOD DEFINITION
		// ================================
		
		return this.each(function () {
			var $this   = $(this);
			
			var data    = $this.data('jsea.chart');
			var options = typeof option == 'object' && option;

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('jsea.chart', (data = new Chart(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.chart;

	$.fn.chart             = Plugin;
	$.fn.chart.Constructor = Chart;


	// CHART NO CONFLICT
	// ===================

	$.fn.chart.noConflict = function () {
		$.fn.chart = old;
		return this;
	};

} (jQuery);