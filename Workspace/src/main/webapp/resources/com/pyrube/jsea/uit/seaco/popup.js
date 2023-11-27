/**
 * @(#) Project: Pyrube JSEA
 * 
 * 
 * Website: http://www.pyrube.com
 * Email: customercare@pyrube.com
 * Copyright Pyrube 2009. All rights reserved.
 */

/**
 * JSEA Tipbox component
 * The Tipbox object has following data:
 * content: content   -- it is the content (string)
 * A sample code to open a tipbox:
 * var options = {
 *       content: "hello world!"
 *}
 *$("#btnButton").tipbox(options);
 *
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 * @dependence: Bootstrap: tooltip.js v3.3.5
 */
+function ($) {
	'use strict';

	// TIPBOX PUBLIC CLASS DEFINITION
	// ===============================
	var Tipbox = function (element, options) {
		this.init('tipbox', element, options);
	};

	if (!$.fn.tooltip) throw new Error('Tipbox requires tooltip.js');

	Tipbox.VERSION = '1.0.0';

	Tipbox.DEFAULTS = $.extend({}, $.fn.tooltip.Constructor.DEFAULTS, {
		content: '',
		trigger: 'hover focus',
		template: '<div class="tipbox" role="tooltip"><div class="tipbox-arrow"></div><div class="tipbox-inner"></div></div>'
	});

	// NOTE: TIPBOX EXTENDS TOOLTIP
	// ==============================
	Tipbox.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype);

	Tipbox.prototype.constructor = Tipbox;

	Tipbox.prototype.getContent = function () {
		var $e = this.$element;
		var o = this.options;

		return $e.attr('data-content') || (typeof o.content == 'function' ? o.content.call($e[0]) : o.content);
	};
	
	Tipbox.prototype.setContent = function () {
		var $tip = this.tip();
		var content = this.buildMessage();

		$tip.find('.tipbox-inner').children().detach().end()[ // we use append for html objects to maintain js events
		this.options.html ? (typeof content == 'string' ? 'html': 'append') : 'text'](content);

		$tip.removeClass('fade top bottom left right in');
	};

	Tipbox.prototype.hasContent = function () {
		return this.getTitle() || this.getContent();
	};
	
	Tipbox.prototype.buildMessage = function () {
		var content = this.getContent();
		return JSEA.localizeMessage(content);
	};

	Tipbox.prototype.getDefaults = function () {
		return Tipbox.DEFAULTS;
	};

	// TIPBOX PLUGIN DEFINITION
	// ==========================
	function Plugin(option) {
		var self = this;
		
		// TIPBOX PUBLIC METHOD DEFINITION
		// =================================
		self.show = function () {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('bs.tipbox');
				data.show();
			});
		};
		
		self.hide = function () {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('bs.tipbox');
				data.hide();
			});
		};
		
		self.setContent = function (content) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('bs.tipbox');
				data.$element.attr('data-content', content);
			});
		};
		
		return this.each(function () {
			var $this = $(this);
			var data = $this.data('bs.tipbox');
			var options = typeof option == 'object' && option;

			if (!data && /destroy|hide|show/.test(option)) return;
			if (!data) $this.data('bs.tipbox', (data = new Tipbox(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.tipbox;

	$.fn.tipbox = Plugin;
	$.fn.tipbox.Constructor = Tipbox;

	// TIPBOX NO CONFLICT
	// ====================
	$.fn.tipbox.noConflict = function () {
		$.fn.tipbox = old;
		return this;
	};

} (jQuery);

/**
 * JSEA Popbox component
 * The Popbox object has following data:
 * title: popboxTitle  -- it is the popbox title.
 * url: popboxUrl   -- it is the URL (string)
 * urlParams: paramValues  -- it is Array of {name: paramName, value: paramValue}.It is optional.
 * A sample code to open a popbox:
 * var options = {
 *       title: "Search",
 *       url: "sample/search",
 *       urlParams: [ { name: "sampleCode", value: "SAMPLE1" },  { name: "sampleType", value: "E" } ]
 * }
 * $("#btnSearch").popbox(options);
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 * @dependence: Bootstrap: tooltip.js v3.3.5
 */
+function ($) {
	'use strict';

	// POPBOX PUBLIC CLASS DEFINITION
	// ===============================
	var Popbox = function (element, options) {
		this.initBox('popbox', element, options);
	};

	if (!$.fn.tooltip) throw new Error('Popbox requires tooltip.js');

	Popbox.VERSION = '1.0.0';

	Popbox.DEFAULTS = $.extend({}, $.fn.tooltip.Constructor.DEFAULTS, {
		timestamp: null,
		stylesheet: null,
		hasContent: false,
		dismissible: true,
		closeOnHide: false,
		placement: 'bottom',
		trigger: 'click',
		url: '',
		html: true,
		cache: true,
		async: {
			before: null, //function ($this, xhr){}
			success: null //function ($this, xhr){}
		},
		template: '<div class="popbox" role="tooltip"><div class="arrow"></div><h3 class="popbox-title"></h3><div class="popbox-content"></div></div>'
	});

	Popbox.BINDERS = {};

	// NOTE: POPBOX EXTENDS TOOLTIP
	// ==============================
	Popbox.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype);

	Popbox.prototype.constructor = Popbox;
	
	Popbox.prototype.initBox = function (type, element, options) {
		this.init(type, element, options);
		this.options.ts = new Date().getTime();
		this.opened     = false;
		
		// make sure the key is unique.
		Popbox.BINDERS[this.$element.attr('id') + '_' + this.options.ts] = this.$element;
		// more stylesheet for this popbox.
		var $tip    = this.tip();
		if (this.options.stylesheet) {
			$tip.addClass(this.options.stylesheet);
		} 
		// initialize events
		this.initEvents();
	};
	
	Popbox.prototype.initEvents = function () {
	};
	
	Popbox.prototype.on = function (evtype, callback) {
		var $tip = this.tip();
		$tip.on(evtype, callback);
		return this;
	};
	
	Popbox.prototype.off = function (evtype) {
		var $tip = this.tip();
		$tip.off(evtype);
		return this;
	};
	
	Popbox.prototype.show = function () {
		if (this.opened) return;
		$.fn.tooltip.Constructor.prototype.show.apply(this);
		this.bindBodyEvents();
		this.opened = true;
	};
	
	Popbox.prototype.hide = function (callback) {
		//if (!this.opened) return;//remove this for surport errormessage.
		$.fn.tooltip.Constructor.prototype.hide.call(this, callback);
		this.opened = false;
	};
	
	Popbox.prototype.toggle = function (e) {
		$.fn.tooltip.Constructor.prototype.toggle.apply(this);
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		} 
	};
	
	Popbox.prototype.finish = function (result) {
		if (this.options.complete) this.options.complete(result);
		this.close();
	};
	
	Popbox.prototype.close = function () {
		var $tip = this.tip();
		$tip.trigger('close');
		this.destroy();
	};
	
	Popbox.prototype.pointerEventToXY = function (e) {
		var out = {
			x: 0,
			y: 0
		};
		if (e.type === 'touchstart' || e.type === 'touchmove' || e.type === 'touchend' || e.type === 'touchcancel') {
			var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
			out.x = touch.pageX;
			out.y = touch.pageY;
		} else if (e.type === 'mousedown' || e.type === 'mouseup' || e.type === 'click') {
			out.x = e.pageX;
			out.y = e.pageY;
		}
		return out;
	};
	
	Popbox.prototype.hideAllPop = function (e) {
		for (var id in Popbox.BINDERS) {
			var pop = Popbox.BINDERS[id].data('bs.' + this.type);
			if(pop && pop.options.dismissible) $.fn.popbox.Constructor.prototype.hide.apply(pop);
		}
		this.unbindBodyEvents();
	};
	
	Popbox.prototype.escapeHandler = function (e) {
		if (e.keyCode === 27) {
			this.hideAllPop();
		}
	};
	
	Popbox.prototype.bodyClickHandler = function (e) {
		var canHide = true;
		for (var id in Popbox.BINDERS) {
			var pop = Popbox.BINDERS[id].data('bs.' + this.type);
			if (pop && pop.opened) {
				var popX1 = pop.tip().offset().left;
				var popY1 = pop.tip().offset().top;
				var popX2 = pop.tip().offset().left + pop.tip().width();
				var popY2 = pop.tip().offset().top + pop.tip().height();
				var pt = this.pointerEventToXY(e);
				var inPop = pt.x >= popX1 && pt.x <= popX2 && pt.y >= popY1 && pt.y <= popY2;
				if (inPop) {
					canHide = false;
					break;
				}
			}
		}
		if (canHide) {
			this.hideAllPop();
		}
	};
	
	Popbox.prototype.bindBodyEvents = function () {
		if (this.options.dismissible && this.options.trigger === 'click') {
			var $document = $(document);
			$document.off('keyup._' + this.type).on('keyup._' + this.type, $.proxy(this.escapeHandler, this));
			$document.off('click._'+ this.type).on('click._'+ this.type, $.proxy(this.bodyClickHandler, this));
			$document.off('touchend._'+ this.type).on('touchend._'+ this.type, $.proxy(this.bodyClickHandler, this));
		}
	};
	
	Popbox.prototype.unbindBodyEvents = function () {
		if (this.options.dismissible && this.options.trigger === 'click') {
			var $document = $(document);
			$document.off('keyup._' + this.type);
			$document.off('click._'+ this.type);
			$document.off('touchend._'+ this.type);
		}
	};
	
	Popbox.prototype.setContent = function (content) {
		//for set async content
		if (this.options.url) {
			this.setAsyncContent(this.options.content);
			return;
		}
		var $tip = this.tip();
		var title = this.getTitle();
		if (!content) content = this.getContent();
		$tip.find('.popbox-title')[this.options.html ? 'html': 'text'](title);
		$tip.find('.popbox-content').children().detach().end()[ // we use append for html objects to maintain js events
		this.options.html ? (typeof content == 'string' ? 'html': 'append') : 'text'](content);

		$tip.removeClass('fade top bottom left right in');

		// IE8 doesn't accept hiding via the `:empty` pseudo selector, we have to do
		// this manually by checking the contents.
		if (!$tip.find('.popbox-title').html()) $tip.find('.popbox-title').hide();
	};
	
	Popbox.prototype.appendContent = function (content, context) {
		var $tip = this.tip();
		var elem = (context) ? context : '.popbox-content';
		$tip.find(elem).append(content);
		this.options.content = $tip.find('.popbox-content').html();	
		this.setPosition();
	};
	
	/**
	 * this medthod is defined in the tooltip.js,we override this method to support the async content,
	 * the tooltip.js code have be change to support the async content.
	 * so when we update the tooltip.js from bootsrap web site, we must change the tooltip.js code again.
	 */
	Popbox.prototype.setAsyncContent = function (content) {
		if(this.options.hasContent && this.options.content) return;
		var $this = this;
		var $tip = $this.tip();
		var title = $this.getTitle();
		$tip.find('.popbox-title')[$this.options.html ? 'html': 'text'](title);
		if (this.xhr) {
			return;
		}
		this.xhr = $.ajax({
			url: JSEA.getPageContext().resolveUrl(this.options.url),
			type: 'POST',
			cache: this.options.cache,
			data: this.options.urlParams,
			beforeSend: function (xhr) {
				if ($this.options.async.before) {
					$this.options.async.before($this, xhr);
				}
				$tip.waiting({position : 'center bottom'});
			},
			success: function (data) {
				$this.options.content = data;
				$tip.find('.popbox-content').children().detach().end()[ // we use append for html objects to maintain js events
				$this.options.html ? (typeof content == 'string' ? 'html': 'append') : 'text'](data);
				$this.setPosition();
				$this.bindBodyEvents();
				$this.opened = true;
				if ($this.options.async.success) {
					$this.options.async.success($this, data);
				}
				// render JSEA components/fields
				var $contentElement = $this.getContentElement();
				var $that = $contentElement.find("form");
				if ($that.length != 0) {
					window.Page.formize($that, {poproxy : $this}, null);
				} else {
					$this.components = JSEA.objectize($contentElement);
					$this.validators = $this.components['validator'];
				}
				
			},
			error: function (xhr) {
				if ($this.options.async.error) {
					$this.options.async.error($this, xhr);
				}
			},
			complete: function () {
				$this.xhr = null;
				$tip.waiting('hide');
			}
		});
		$tip.removeClass('fade top bottom left right in');
		// IE8 doesn't accept hiding via the `:empty` pseudo selector, we have to do
		// this manually by checking the contents.
		if (!$tip.find('.popbox-title').html()) $tip.find('.popbox-title').hide();
	};
	
	Popbox.prototype.setPosition = function () {
		var $tip = this.tip();
		var placement = typeof this.options.placement == 'function' ? this.options.placement.call(this, $tip[0], this.$element[0]) : this.options.placement;

		var autoToken = /\s?auto?\s?/i;
		var autoPlace = autoToken.test(placement);
		if (autoPlace) placement = placement.replace(autoToken, '') || 'top';

		$tip.detach().css({
			top: 0,
			left: 0,
			display: 'block'
		}).addClass(placement); // .data('bs.' + this.type, this); // comments out on Apr 14, 2022 by Aranjuez. please see line 205 in bootstrap.tooltip.js

		this.options.container ? $tip.appendTo(this.options.container) : $tip.insertAfter(this.$element);
		this.$element.trigger('inserted.bs.' + this.type);

		var pos = this.getPosition();
		var actualWidth = $tip[0].offsetWidth;
		var actualHeight = $tip[0].offsetHeight;

		if (autoPlace) {
			var orgPlacement = placement;
			var viewportDim = this.getPosition(this.$viewport);

			placement = placement == 'bottom' && pos.bottom + actualHeight > viewportDim.bottom ? 'top': placement == 'top' && pos.top - actualHeight < viewportDim.top ? 'bottom': placement == 'right' && pos.right + actualWidth > viewportDim.width ? 'left': placement == 'left' && pos.left - actualWidth < viewportDim.left ? 'right': placement;

			$tip.removeClass(orgPlacement).addClass(placement);
		}

		var calculatedOffset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight);

		this.applyPlacement(calculatedOffset, placement);
	};
	
	Popbox.prototype.hasContent = function () {
		if (this.options.url) {
			return true;
		} else {
			return this.getTitle() || this.getContent();
		}
	};

	Popbox.prototype.getContent = function () {
		var $e = this.$element;
		var o = this.options;

		return $e.attr('data-content') || (typeof o.content == 'function' ? o.content.call($e[0]) : o.content);
	};

	Popbox.prototype.emptyContent = function () {
		this.options.content = null;
		// destroy the JSEA objects in this popbox
		JSEA.destroy(this.getContentElement());
		// and then empty it
		this.getContentElement().empty();
	};

	Popbox.prototype.getContentElement = function () {
		var $tip = this.tip();
		return $tip.find('.popbox-content');
	};
	
	Popbox.prototype.getTitle = function () {
		var title;
		var $e = this.$element;
		var o = this.options;

		title = (typeof o.title == 'function' ? o.title.call($e[0]) : o.title)
				|| $e.attr('data-original-title');
		return title;
	};
	
	Popbox.prototype.arrow = function () {
		return (this.$arrow = this.$arrow || this.tip().find('.arrow'));
	};

	Popbox.prototype.destroy = function () { // override this method from Tooltip
		// for Popbox
		this.opened = false;
		this.unbindBodyEvents();
		// delete binder of this popbox
		delete Popbox.BINDERS[this.$element.attr('id') + '_' + this.options.ts];
		// and then, destroy the JSEA objects in this form
		JSEA.destroy(this.getContentElement());
		// end for Popbox

		var $this = this;
		clearTimeout(this.timeout);
		this.hide(function () {
			$this.$element.off('.' + $this.type).removeData('bs.' + $this.type);
			if ($this.$tip) {
				$this.$tip.detach();
			}
			$this.$tip = null;
			$this.$arrow = null;
			$this.$viewport = null;
		});
	}

	Popbox.prototype.getDefaults = function () {
		return Popbox.DEFAULTS;
	};

	// POPBOX PLUGIN DEFINITION
	// =========================
	function Plugin(option) {
		var self = this;

		// POPBOX PUBLIC METHOD DEFINITION
		// =================================
		self.show = function () {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('bs.popbox');
				data.show();
			});
		};
		
		self.hide = function () {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('bs.popbox');
				data.hide();
			});
		};
		
		self.getContentElement = function () {
			var $elem = null;
			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('bs.popbox');
				$elem = data.getContentElement();
				return false;
			});
			return $elem;
		};
		
		self.appendContent = function (content, context) {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('bs.popbox');
				data.appendContent(content, context);
			});
		};
		
		self.emptyContent = function () {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('bs.popbox');
				data.emptyContent();
			});
		};
		
		return this.each(function () {
			var $this = $(this);
			var data = $this.data('bs.popbox');
			var options = typeof option == 'object' && option;

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('bs.popbox', (data = new Popbox(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.popbox;

	$.fn.popbox = Plugin;
	$.fn.popbox.Constructor = Popbox;

	// POPBOX NO CONFLICT
	// ====================
	$.fn.popbox.noConflict = function () {
		$.fn.popbox = old;
		return this;
	};
} (jQuery);

/**
 * JSEA Dropdown component
 * The Dropdown object has following data:
 * title: popboxTitle  -- it is the dropdown title.
 * url: popboxUrl   -- it is the URL (string)
 * urlParams: paramValues  -- it is Array of {name: paramName, value: paramValue}.It is optional.
 * A sample code to open a dropdown:
 * var options = {
 *       title: "Search",
 *       url: "sample/search",
 *       urlParams: [ { name: "sampleCode", value: "SAMPLE1" },  { name: "sampleyType", value: "E" } ]
 *}
 *$("#btnSearch").dropdown(options);
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 * @dependence: Bootstrap: tooltip.js v3.3.5
 * @dependence: JSEA: popup.js v1.0.0
 */
+function ($) {
	'use strict';

	// DROPDOWN PUBLIC CLASS DEFINITION
	// ===============================
	var Dropdown = function (element, options) {
		$(element).append("<span class='dropdown'></span>");
		this.initBox('dropdown', element, options);
	};

	if (!$.fn.tooltip) throw new Error('Dropdown requires tooltip.js');

	Dropdown.VERSION = '1.0.0';

	Dropdown.DEFAULTS = $.extend({}, $.fn.popbox.Constructor.DEFAULTS, {
		hasContent: true
	});

	// NOTE: DROPDOWN EXTENDS POPBOX
	// ================================
	Dropdown.prototype = $.extend({}, $.fn.popbox.Constructor.prototype);

	Dropdown.prototype.constructor = Dropdown;

	Dropdown.prototype.getDefaults = function () {
		return Dropdown.DEFAULTS;
	};
	
	// DROPDOWN PLUGIN DEFINITION
	// =========================
	function Plugin(option) {
		var self = this;

		// GRID PUBLIC METHOD DEFINITION
		// ===============================
		self.show = function () {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('bs.dropdown');
				data.show();
			});
		};
		
		self.hide = function () {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('bs.dropdown');
				data.hide();
			});
		};
		
		self.emptyContent = function () {
			return self.each(function () {
				var $this   = $(this);
				var data    = $this.data('bs.dropdown');
				data.emptyContent();
			});
		};
		
		self.getContentElement = function () {
			var $elem;
			self.each(function () {
				var $this   = $(this);
				var data    = $this.data('bs.dropdown');
				$elem = data.getContentElement();
				return false;
			});
			return $elem;
		};
		
		return this.each(function () {
			var $this = $(this);
			var data = $this.data('bs.dropdown');
			var options = typeof option == 'object' && option;

			if (!data && /destroy|hide/.test(option)) return;
			if (!data) $this.data('bs.dropdown', (data = new Dropdown(this, options)));
			if (typeof option == 'string') data[option]();
		});
	}

	var old = $.fn.dropdown;

	$.fn.dropdown = Plugin;
	$.fn.dropdown.Constructor = Dropdown;

	// DROPDOWN NO CONFLICT
	// ===================
	$.fn.dropdown.noConflict = function () {
		$.fn.dropdown = old;
		return this;
	};
} (jQuery);
/**
 * WEA lookup dialog
 * 
 *  var popupInfo = {
 *       title: "Search",
 *       url: "companySearch.do",
 *       urlParams: [ { name: "bankCode", value: "SITE01" },  { name: "companyType", value: "SELLER" } ],
 *       complete: function (objResult) {
 *            callback(objResult)
 *       }
 *  }
 *  <div id="divWaitingId_1020"></div>
 *  <div id="jsea_dialog_1020" class="jsea_dialog" style="z-index: 1020; left: 409.5px; top: 183px;">
 *   	<div id="jsea_dialog_m_1020" class="jsea_dialog_m">
 *    		<div id="jsea_dialog_m_h_1020" class="jsea_dialog_m_h"><span class="jsea_dialog_m_h_l">Dialog</span><span class="jsea_dialog_m_h_r" title="close" onclick="">X</span></div>
 *    		<div id="jsea_dialog_m_b_s_1020" class="jsea_dialog_m_b_s">
 *      		<div id="jsea_dialog_m_b_1020" class="jsea_dialog_m_b"></div>
 *          </div>
 *		</div>
 *	</div>
 *
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 */
+function ($) {
	'use strict';
	// WICKET PLUGIN DEFINITION
	// =========================
	function Plugin(option) {
		var selfArguments = arguments;
		return this.each(function () {
			var $this = $(this);
			var data = $this.data('jsea.wicket');
			var popupInfo = typeof option == 'object' && option;

			if (!data && /close|apply|finish|getPopupInfo|getPopupZindex/.test(option)) return;
			if (!data) $this.data('jsea.wicket', (data = new Wicket(this, popupInfo)));
			if (typeof option == 'string') data[option](selfArguments[1]);
		});
	}

	var old = $.fn.wicket;

	$.fn.wicket = Plugin;
	$.fn.wicket.Constructor = Wicket;

	// WICKET NO CONFLICT
	// ===================
	$.fn.wicket.noConflict = function () {
		$.fn.wicket = old;
		return this;
	}

} (jQuery);

//WICKET PUBLIC CLASS DEFINITION
// ===============================
var Wicket = function (element, popupInfo) {
	this.type = null;
	this.popupInfo = null;
	this.$element = null;
	this.init('wicket', element, popupInfo);
};

Wicket.VERSION = '1.0.0';

Wicket.DEFAULTS = {
	owner: null, // the form to own (pop-up) this Wicket
	dialogTitle: "Dialog",
	url: '',
	divOverlay: null,
	args: null,
	divPopup: null,
	deferring: false,
	html: null,
	isDrag: false, // not draggable due to minor bug when multi-wickets popped
	cache: true,
	type: 'ajax',
	//the value is iframe or ajax
	async: {
		before: null,
		//function ($this, xhr){}
		success: null //function ($this, xhr){}
	},
	complete: function () {}, // invoked after Wicket completes
	close: function () {}     // invoked after Wicket closes
};
Wicket.popupInfos = new ArrayList();
Wicket.zIndexIncrement = 5;
Wicket.overlayZIndex   = 999;
Wicket.popupLastZIndex = 1000;
Wicket.finish = function (objResult) {
	new Wicket().finish(objResult);
};

Wicket.prototype.init = function (type, element, popupInfo) {
	this.type = type;
	this.$element = $(element);
	this.popupInfo = this.getPopupInfo(popupInfo);
	this.$element.on('click.' + this.type, $.proxy(this.open, this));
};

Wicket.prototype.getDefaults = function () {
	return Wicket.DEFAULTS;
};

Wicket.prototype.getPopupInfo = function (popupInfo) {
	popupInfo = $.extend(true, {}, this.getDefaults(), popupInfo);
	return popupInfo;
};

Wicket.prototype.open = function (option) {
	var popupInfo = 
		//init function has the click event
		(option && 'click' == option.type) 
		? this.popupInfo
		: $.extend(true, {}, this.popupInfo, option);
	popupInfo.owner = popupInfo.owner || window.Page.currentForm();
	var _client_width = document.body.clientWidth;
	var _client_height = document.documentElement.scrollHeight;
	var newOverlayZIndex = Wicket.overlayZIndex + Wicket.zIndexIncrement;
	// for body
	$('body').addClass('with_wicket');
	// for jsea overlay
	var overlayId = 'jsea_overlay_' + newOverlayZIndex;
	$("body").prepend("<div id='" + overlayId + "' class='jsea_overlay'>&nbsp;</div>");
	var _jsea_overlay = $("#jsea_overlay_" + newOverlayZIndex);
	_jsea_overlay.css("z-index", newOverlayZIndex);
	_jsea_overlay.css("width", _client_width + "px");
	_jsea_overlay.css("height", _client_height + "px");
	_jsea_overlay.on('touchmove scroll', function (e) {
		// event stopper
		e.preventDefault && e.preventDefault();
		e.returnValue = false;
		e.stopPropagation && e.stopPropagation();
		e.cancelBubble = false;
		return false;
	});
	popupInfo.divOverlay = _jsea_overlay[0];
	// for jsea dialog
	var newZIndex = Wicket.popupLastZIndex + Wicket.zIndexIncrement;
	if (typeof($("#jsea_dialog_" + newZIndex)) != "undefined") {
		$("#jsea_dialog_" + newZIndex).remove();
	}
	var dialogId = 'jsea_dialog_' + newZIndex;
	$("body").prepend("<div id='" + dialogId + "'></div>");
	var _jsea_dialog = $("#jsea_dialog_" + newZIndex);
	_jsea_dialog.addClass('jsea_dialog');
	_jsea_dialog.addClass('initializing');
	if (popupInfo.stylesheet) _jsea_dialog.addClass(popupInfo.stylesheet);
	_jsea_dialog.css("z-index", newZIndex);
	_jsea_dialog.css("visibility", "hidden");
	//for jsea div waiting.
	var divWaitingId = 'jsea_waiting_' + newZIndex;
	var $divWaiting = $("<div id='" + divWaitingId + "' class='jsea_waiting'></div>");
	$divWaiting.insertBefore(_jsea_dialog);
	popupInfo.divWaiting = $divWaiting;
	popupInfo.divPopup = _jsea_dialog[0];
	popupInfo.zIndex = newZIndex;
	
	// save to popupInfos.
	Wicket.popupInfos.add(popupInfo);
	// for dialog main
	var dialog_m_id = 'jsea_dialog_m_' + newZIndex;
	_jsea_dialog.append("<div id='" + dialog_m_id + "' class='jsea_dialog_m'></div>");
	var _jsea_dialog_m = $("#jsea_dialog_m_" + newZIndex);
	//_jsea_dialog_m.css("width", popupInfo.width + "px");
	// for main header
	var dialog_m_h_id = 'jsea_dialog_m_h_' + newZIndex;
	_jsea_dialog_m.append("<div id='" + dialog_m_h_id + "' class='jsea_dialog_m_h'></div>");
	var _jsea_dialog_m_h = $("#jsea_dialog_m_h_" + newZIndex);
	_jsea_dialog_m_h.append("<span class='jsea_dialog_m_h_l'>" + popupInfo.dialogTitle + "</span>");
	_jsea_dialog_m_h.append("<span class='jsea_dialog_m_h_r' title='" + JSEA.localizeMessage('icon.alt.close') + "' onclick=''>" + "X" + "</span>");
	// for main body
	//first for main body scroll
	var dialog_m_b_s_id = 'jsea_dialog_m_b_s_' + newZIndex;
	_jsea_dialog_m.append("<div id='" + dialog_m_b_s_id + "' class='jsea_dialog_m_b_s'></div>");
	var _jsea_dialog_m_b_s = $("#" + dialog_m_b_s_id);
	//second for main body content.
	var dialog_m_b_id = 'jsea_dialog_m_b_' + newZIndex;
	_jsea_dialog_m_b_s.append("<div id='" + dialog_m_b_id + "' class='jsea_dialog_m_b'></div>");
	var _jsea_dialog_m_b = $("#" + dialog_m_b_id);
	//_jsea_dialog_m_b.css("width", popupInfo.width + "px");
	//_jsea_dialog_m_b.css("height", popupInfo.height + "px");
	if (popupInfo.html) {
		_jsea_dialog_m_b.append(popupInfo.html);
		// initialize popped forms
		var $form = _jsea_dialog_m_b.find("form");
		if ($form.length != 0) {
			var moreOptions = $.extend(true, { 
				args      : popupInfo.args, 
				poproxy   : Dialog,
				popped    : true,
				closeable : true
			}, (popupInfo.owner) ? popupInfo.owner.resolveNextOptions() : null);
			window.Page.formize($form, moreOptions, null);
		}
		// reset popup-box position
		this.setPosition(_jsea_dialog, _jsea_dialog_m, !popupInfo.deferring);
	} else if (popupInfo.url && "iframe" == popupInfo.type) {
		var width = 600;
		var height = 800; (!popupInfo.width) ? width = 600 : width = popupInfo.width; (!popupInfo.height) ? height = 600 : width = popupInfo.height;
		_jsea_dialog_m_b.append("<iframe id='jsea_iframe' src='" + popupInfo.url + "' scrolling='auto' frameborder='0' width='" + width + "' height='" + height + "' />");
		this.setPosition(_jsea_dialog, _jsea_dialog_m, !popupInfo.deferring);
	} else if (popupInfo.url && "ajax" == popupInfo.type) {
		if (this.xhr) { return; }
		var $this = this;
		var accessUrl = JSEA.getPageContext().resolveUrl(popupInfo.url);
		this.xhr = $.ajax({
			url  : accessUrl,
			type : 'POST',
			cache: popupInfo.cache,
			dataType : 'html',
			data : popupInfo.urlParams,
			beforeSend : function (xhr) {
				if (popupInfo.async.before) {
					popupInfo.async.before($this, xhr);
				}
				$divWaiting.waiting({fixed : true});
			},
			success : function (data) {
				_jsea_dialog_m_b.append(data);
				// initialize popped forms
				var $form = _jsea_dialog_m_b.find("form");
				if ($form.length != 0) {
					var moreOptions = $.extend(true, { 
						args      : popupInfo.args, 
						poproxy   : Dialog,
						popped    : true,
						closeable : true
					}, (popupInfo.owner) ? popupInfo.owner.resolveNextOptions(accessUrl) : null);
					window.Page.formize($form, moreOptions, null);
				}
				if (popupInfo.async.success) {
					popupInfo.async.success(data);
				}
				$divWaiting.waiting('hide');
				// reset popup-box position
				$this.setPosition(_jsea_dialog, _jsea_dialog_m, !popupInfo.deferring);
			},
			error : function (xhr) {
				if (popupInfo.async.error) {
					popupInfo.async.error($this, xhr);
				}
				$divWaiting.waiting('hide');
				// stop opening this wicket, and close it
				$this.close();
			},
			complete : function () { $this.xhr = null; }
		});
	}
	if (popupInfo.isDrag) {
		this.draggable().register(_jsea_dialog, _jsea_dialog_m_h);
	}
	Wicket.overlayZIndex   += Wicket.zIndexIncrement
	Wicket.popupLastZIndex += Wicket.zIndexIncrement;;
	// $("#jsea_iframe")[0].focus();
	this.initTargetCloseEvent();
};
// set popupbox position
Wicket.prototype.setPosition = function (dialogObj, mainObj, nowShowing) {
	if (!nowShowing) return;
	if (Page.viewVia('mobile')) {
		var height = mainObj.outerHeight();
		var dialogHeight = dialogObj.outerHeight();
		var windowHight = $(window).height();

		// when open must use dom function to reset the position.
		var newZIndex = this.getPopupZindex();
		if (newZIndex != -1) {
			var _jsea_dialogId = 'jsea_dialog_' + newZIndex;
			document.getElementById(_jsea_dialogId).style.top = windowHight + 'px';
		} else {
			dialogObj.css('top', windowHight + 'px');
		}
		setTimeout(function () {
			dialogObj.removeClass('initializing');
			var _top = dialogHeight <= height ? (windowHight - dialogHeight) : (windowHight - height);
			var cssTop = (_top < 0 ? 0 : _top) + 'px';
			// when open must use dom function to reset the position.
			if (newZIndex != -1) {
				var _jsea_dialogId = 'jsea_dialog_' + newZIndex;
				document.getElementById(_jsea_dialogId).style.top = cssTop;
			} else {
				dialogObj.css('top', cssTop);
			}
		}, 10);
	} else {
		var width = mainObj.outerWidth();
		var _left = ($(window).width() - width) / 2;
		var cssLeft = (_left < 0 ? 0 : _left) + "px";
		var height = mainObj.outerHeight();
		var windowHight = $(window).height();

		dialogObj.removeClass('initializing');
		var _top = (windowHight - height) / 2;
		var cssTop = (_top < 0 ? 0 : _top) + "px";
		// when open must use dom function to reset the position.
		var newZIndex = this.getPopupZindex();
		if (newZIndex != -1) {
			var _jsea_dialogId = 'jsea_dialog_' + newZIndex;
			document.getElementById(_jsea_dialogId).style.left = cssLeft;
			document.getElementById(_jsea_dialogId).style.top = cssTop;
		} else {
			dialogObj.css("left", cssLeft);
			dialogObj.css("top", cssTop);
		}
	}
	dialogObj.css("visibility", "visible");
};
// reset popupbox position, call this when the dialog cotent is dynamic produce.
Wicket.prototype.reposition = function () {
	var popupInfo = this.getCurrentPopupInfo();
	if (popupInfo) {
		var divPopup = popupInfo.divPopup;
		var _jsea_dialog = $(divPopup);
		var _jsea_dialog_m = _jsea_dialog.find('.jsea_dialog_m');
		// reset the position
		this.setPosition(_jsea_dialog, _jsea_dialog_m, true);
	}
};
// get the current Popup info
Wicket.prototype.getCurrentPopupInfo = function () {
	return (Wicket.popupInfos.get(Wicket.popupInfos.size() - 1));
};
Wicket.prototype.initTargetCloseEvent = function () {
	var popupInfo = this.getCurrentPopupInfo();
	var divPopup = popupInfo.divPopup;
	$(divPopup).find('.jsea_dialog_m_h_r').off('click').on('click', $.proxy(this.close, this, null));
};
Wicket.prototype.close = function (popupInfo) {
	if (!popupInfo) popupInfo = this.getCurrentPopupInfo();
	if (popupInfo && popupInfo.close) popupInfo.close();
	$(popupInfo.divPopup).trigger('close.jsea', this);
	var divOverlay = popupInfo.divOverlay;
	if (divOverlay) $(divOverlay).remove();
	var $divWaiting = popupInfo.divWaiting;
	if ($divWaiting) $divWaiting.remove();
	var divPopup = this.prepareClose(popupInfo);
	if (divPopup) $(divPopup).remove();
	// for body
	if (Wicket.popupInfos.size() == 0) $('body').removeClass('with_wicket');
};
Wicket.prototype.apply = function (objResult) {
	var popupInfo = this.getCurrentPopupInfo();
	if (popupInfo && popupInfo.complete) popupInfo.complete(objResult);
};
Wicket.prototype.finish = function (objResult) {
	var popupInfo = this.getCurrentPopupInfo();
	this.apply(objResult);
	this.close(popupInfo);
};
Wicket.prototype.prepareClose = function (popupInfo) {
	var divPopup = popupInfo.divPopup;
	var index    = Wicket.popupInfos.indexOf(popupInfo);
	Wicket.popupInfos.remove(index);
	return (divPopup);
};
Wicket.prototype.getPopupZindex = function () {
	var popupInfo = this.getCurrentPopupInfo();
	if(!popupInfo) return -1;
	return popupInfo.zIndex;
};
Wicket.prototype.draggable = function () {
	var _clientWidth;
	var _clientHeight;
	var _controlObj;
	var _dragObj;
	var _flag = false;
	var _dragObjCurrentLocation;
	var _mouseLastLocation;
	var getElementDocument = function (element) {
		return element.ownerDocument || element.document;
	};
	var dragMouseDownHandler = function (evt) {
		if (_dragObj) {
			$(_dragObj).addClass('dragging');
			evt = evt || window.event;
			_clientWidth = document.body.clientWidth;
			_clientHeight = document.documentElement.scrollHeight;
			$("#jsea_dialog_m_b_1").css("display", "");
			_flag = true;
			_dragObjCurrentLocation = {
				x: $(_dragObj).offset().left,
				y: $(_dragObj).offset().top
			};
			_mouseLastLocation = {
				x: evt.screenX,
				y: evt.screenY
			};
			$(document).bind("mousemove", dragMouseMoveHandler);
			$(document).bind("mouseup", dragMouseUpHandler);
			if (evt.preventDefault) {
				evt.preventDefault();
			} else {
				evt.returnValue = false;
			}
		}
	};
	var dragMouseMoveHandler = function (evt) {
		if (_flag) {
			evt = evt || window.event;
			var _mouseCurrentLocation = {
				x: evt.screenX,
				y: evt.screenY
			};
			_dragObjCurrentLocation.x = _dragObjCurrentLocation.x + (_mouseCurrentLocation.x - _mouseLastLocation.x);
			_dragObjCurrentLocation.y = _dragObjCurrentLocation.y + (_mouseCurrentLocation.y - _mouseLastLocation.y);
			if (_dragObjCurrentLocation.y < 0) {
				_dragObjCurrentLocation.y = 0;
			}
			_mouseLastLocation = _mouseCurrentLocation;
			$(_dragObj).css("left", _dragObjCurrentLocation.x + "px");
			$(_dragObj).css("top", _dragObjCurrentLocation.y + "px");
			if (evt.preventDefault) {
				evt.preventDefault();
			} else {
				evt.returnValue = false;
			}
		}
	};
	var dragMouseUpHandler = function (evt) {
		if (_flag) {
			evt = evt || window.event;
			$("#jsea_dialog_m_b_1").css("display", "none");
			cleanMouseHandlers();
			_flag = false;
			$(_dragObj).removeClass('dragging');
		}
	};
	var cleanMouseHandlers = function () {
		if (_controlObj) {
			$(_controlObj.document).unbind("mousemove");
			$(_controlObj.document).unbind("mouseup");
		}
	};
	return {
		register: function (dragObj, controlObj) {
			_dragObj = dragObj;
			_controlObj = controlObj;
			$(_controlObj).bind("mousedown", dragMouseDownHandler);
			return true;
		}
	};
};

/**
 * @Override
 * @param evtype
 * @returns {Wicket}
 */
Wicket.prototype.off = function (evtype) {
	var popupInfo = this.getCurrentPopupInfo();
	$(popupInfo.divPopup).off(evtype);
	return this;
};

/**
 * @Override
 * @param evtype
 * @param callback
 * @returns {Wicket}
 */
Wicket.prototype.on = function (evtype, callback) {
	var popupInfo = this.getCurrentPopupInfo();
	$(popupInfo.divPopup).on(evtype, callback);
	return this;
};

/**
 * JSEA Tipbox object
 * The Tipbox object has following methods:
 * bind(oCtxElem)  :  bind tooltips in the given context element
 *     @param oCtxElem. which context element to bind tooltips (HTMLElement)
 *
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 * @dependence: Bootstrap: tooltip.js v3.3.5
 * @dependence: JSEA: popup.js v1.0.0
 */
var Tipbox = new Object();

Tipbox.VERSION = '1.0.0';

Tipbox.bind = function (oCtxElem, more) {
	if (!oCtxElem) oCtxElem = $(document);
	$('*[' + JSEA.Constants.ATTR_TOOLTIPS + ']', oCtxElem).each(function (i) {
		var $elem   = $(this);
		var tooltip = $elem.attr(JSEA.Constants.ATTR_TOOLTIPS);
		$elem.tipbox($.extend({ content: tooltip }, more));
	});
};

Tipbox.info = function ($elem, msg, placement) {
	if (placement === undefined) placement = 'top';
	return $elem.tipbox({
			trigger: 'manual',
			content: msg,
			placement: placement,
			template: '<div class="tipbox" role="tooltip"><div class="tipbox-arrow info"></div><div class="tipbox-inner info"></div></div>'
		});
};
Tipbox.error = function ($elem, msg, placement) {
	if (placement === undefined) placement = 'top';
	return $elem.tipbox({
			trigger: 'manual',
			content: msg,
			placement: placement,
			template: '<div class="tipbox" role="tooltip"><div class="tipbox-arrow error"></div><div class="tipbox-inner error"></div></div>'
		});
};

/**
 * JSEA Pop-down object
 * The Pop-down object has following methods:
 * request(options)  :  request options for pop-down
 *     @param trigger    to trigger (HTMLELement)
 *     @param title      for pop-down (String)
 *     @param url        to request (String)
 *     @param urlParams  for url    (JSON)
 *     @param complete   to invoke when done saving (Function)
 *
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 * @dependence: Bootstrap: tooltip.js v3.3.5
 * @dependence: JSEA: popup.js v1.0.0
 */
var Popdown = new Object();

Popdown.VERSION = '1.0.0';

Popdown.request = function (options) {
	var trigger = options.trigger;
	delete options.trigger;
	options = $.extend(true, {stylesheet : 'popdown', dismissible : false}, options)
	this.$popbox = $(trigger).popbox(options);
	this.$popbox.show();
};

/**
 * JSEA Reject object
 * The Reject object has following methods:
 * request(okCallback)  :  request reason to reject
 *     @param button. to trigger (HTMLELement)
 *     @param okCallback. to be invoked while OK button is clicked (function)
 *
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 * @dependence: Bootstrap: tooltip.js v3.3.5
 * @dependence: JSEA: popup.js v1.0.0
 */
var Reject = new Object();

Reject.VERSION = '1.0.0';

Reject.request = function (button, okCallback) {
	var $this = this;
	var divFuncbar = '<div class="funcbar">' 
						+ '<div class="buttons"></div>' 
					+ '</div>';
	var fnSuccess = function () {
		var $contentElement = $this.$popbox.getContentElement();
		$contentElement.append(divFuncbar).find('.buttons')
		.append(ButtonBuilder.build({
			name   : 'reject',
			method : function () {
				var comments = $contentElement.find('textarea').val();
				if (comments) {
					okCallback(comments);
					$this.$popbox.hide();
				}
			}
		}))
		.append(ButtonBuilder.build({
			name   : 'cancel',
			method : function () {
				$this.$popbox.hide();
			}
		}));
	};
	var options = {
		placement: 'autotop',
		title: JSEA.localizeMessage('global.title.reason'),
		stylesheet: 'reject',
		url: 'jsea/comments',
		async: {
			success: fnSuccess
		}
	};
	this.$popbox = $(button).popbox(options);
	this.$popbox.show();
};

/**
 * JSEA Confirm object
 * The Confirm object has following methods:
 * request(message, okCallback, cancelCallback) :  request to confirm proceed
 *     @param message. confirm message (string)
 *     @param okCallback. to be invoked while OK button is clicked (function)
 *     @param cancelCallback. to be invoked while Cancel button is clicked (function)
 * abort(refNo, okCallback)  :  confirm to abort data operation
 *     @param refNo. reference number to primary key (string)
 *     @param okCallback. to be invoked while OK button is clicked (function)
 * abortCreated(refNo, okCallback)  :  confirm to abort data to be created
 *     @param refNo. reference number to primary key (string)
 *     @param okCallback. to be invoked while OK button is clicked (function)
 * abortUpdated(refNo, okCallback)  :  confirm to abort data to be updated
 *     @param refNo. reference number to primary key (string)
 *     @param okCallback. to be invoked while OK button is clicked (function)
 * abortDeleted(refNo, okCallback)  :  confirm to abort data to be deleted
 *     @param refNo. reference number to primary key (string)
 *     @param okCallback. to be invoked while OK button is clicked (function)
 * delete(refNo, okCallback)  :  confirm to delete data
 *     @param refNo. reference number to primary key (string)
 *     @param okCallback. to be invoked while OK button is clicked (function)
 *
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 * @dependence: Bootstrap: tooltip.js v3.3.5
 * @dependence: JSEA: popup.js v1.0.0
 */
var Confirm = new Wicket(null, {deferring : true});

Confirm.VERSION = '1.0.0';

Confirm.request = function (message, okCallback, cancelCallback, extAction) {
	var template = "<div class='message-container'>" +
						"<div class='message-area'>" +
							"<li class='message'><span class='confirm'></span><label>" + message + "</label></li>" +
						"</div>" +
						"<div class='funcbar'>" +
							"<div class='buttons'></div>" +
						"</div>" +
					"</div>";
	var popupInfo = {
		dialogTitle: JSEA.localizeMessage('global.title.confirm'),
		stylesheet: 'confirm',
		html: template,
		complete: function (objResult) {
			if (objResult == 1) {
				if (this.okFunc) this.okFunc();
			} else if (objResult == 0) {
				if (this.cancelFunc) this.cancelFunc();
			} else if (objResult == 2) {
				if (this.extFunc) this.extFunc();
			}
		},
		okFunc: okCallback,
		cancelFunc: cancelCallback,
		extFunc: extAction != null ? extAction.callback : null
	};
	Confirm.open(popupInfo);
	var popupInfo = Confirm.getCurrentPopupInfo();
	var divPopup = popupInfo.divPopup;
	$(divPopup).find('.buttons')
			.append(ButtonBuilder.build({
				name : 'ok',
				method : function () { Confirm.finish(1); }
			}))
			.append(ButtonBuilder.build({
				name : 'cancel',
				method : function () { Confirm.finish(0); }
			}));
	if (extAction != null) {
		$(divPopup).find('.buttons').append(ButtonBuilder.build({
			name : extAction.name,
			method : function () { Confirm.finish(2); }
		})); 
	}
	Confirm.reposition();
};

Confirm['abort'] = function (refNo, okCallback) {
	Confirm.request(JSEA.localizeMessage('global.confirm.abort', refNo), okCallback);
};
Confirm['abortCreated'] = function (refNo, okCallback) {
	Confirm.request(JSEA.localizeMessage('global.confirm.abort-created', refNo), okCallback);
};
Confirm['abortUpdated'] = function (refNo, okCallback) {
	Confirm.request(JSEA.localizeMessage('global.confirm.abort-updated', refNo), okCallback);
};
Confirm['abortDeleted'] = function (refNo, okCallback) {
	Confirm.request(JSEA.localizeMessage('global.confirm.abort-deleted', refNo), okCallback);
};
Confirm['delete'] = function (refNo, okCallback) {
	Confirm.request(JSEA.localizeMessage('global.confirm.delete', refNo), okCallback);
};
Confirm['navigate'] = function (okCallback) {
	Confirm.request(JSEA.localizeMessage('global.confirm.navigate'), okCallback);
};

/**
 * JSEA Yesno object
 * The Yesno object has following methods:
 * request(message, yesCallback, noCallback, closeCallback)  :  request to confirm/cancel proceed
 *     @param message. confirm message (string)
 *     @param yesCallback. to be invoked while Yes button is clicked (function)
 *     @param noCallback. to be invoked while No button is clicked (function)
 *     @param closeCallback. to be invoked while Close button is clicked (function)
 *
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 * @dependence: Bootstrap: tooltip.js v3.3.5
 * @dependence: JSEA: popup.js v1.0.0
 */
var Yesno = new Wicket(null, {deferring : true});

Yesno.VERSION = '1.0.0';

Yesno.request = function (message, yesCallback, noCallback, closeCallback) {
	var template = "<div class='message-container'>" +
						"<div class='message-area'>" +
							"<li class='message'><span class='Yesno'></span><label>" + message + "</label></li>" +
						"</div>" +
						"<div class='funcbar'>" +
							"<div class='buttons'></div>" +
						"</div>" +
					"</div>";
	var popupInfo = {
		dialogTitle: JSEA.localizeMessage('global.title.yesno'),
		stylesheet: 'yesno',
		html: template,
		complete: function (objResult) {
			if (objResult == 1) {
				if (this.yesFunc) this.yesFunc();
			} else if (objResult == 0) {
				if (this.noFunc) this.noFunc();
			} else if (objResult == -1) {
				if (this.closeFunc) this.closeFunc();
			}
		},
		yesFunc: yesCallback,
		noFunc: noCallback,
		closeFunc: closeCallback
	};
	Yesno.open(popupInfo);
	var popupInfo = Yesno.getCurrentPopupInfo();
	var divPopup = popupInfo.divPopup;
	$(divPopup).find('.buttons')
			.append(ButtonBuilder.build({
				name : 'yes',
				method : function () { Yesno.finish(1); }
			}))
			.append(ButtonBuilder.build({
				name : 'no',
				method : function () { Yesno.finish(0); }
			}))
			.append(ButtonBuilder.build({
				name : 'close',
				method : function () { Yesno.finish(-1); }
			}));
	Yesno.reposition();
};

/**
 * JSEA Lookup object
 *
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 * @dependence: Bootstrap: tooltip.js v3.3.5
 * @dependence: JSEA: popup.js v1.0.0
 */
var Lookup = new Wicket(null, {deferring : true});
/**
 * extends Wicket Object
 */
Lookup.prototype = Wicket.prototype;

Lookup.VERSION = '1.0.0';

/**
 * JSEA Dialog object
 *
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 * @dependence: Bootstrap: tooltip.js v3.3.5
 * @dependence: JSEA: popup.js v1.0.0
 */
var Dialog = new Wicket();
/**
 * extends Wicket Object
 */
Dialog.prototype = Wicket.prototype;

Dialog.VERSION = '1.0.0';