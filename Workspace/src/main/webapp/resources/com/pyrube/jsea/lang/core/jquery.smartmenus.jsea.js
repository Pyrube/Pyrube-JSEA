/**
 * JSEA Implementation based on SmartMenus jQuery Plugin - v0.9.7 
 * - Dec 2, 2015
 * @dependence: SmartMenus: jquery.smartmenus.js v0.9.7
 */
var INIT_MENUBAR = function() {
	var $menus = $('ul.menus', $('#appMenubar'));
	/**
	 * paint an array of menu items into container
	 */
	function paintMenuItems($container, menuItems) {
		for (var i = 0; i < menuItems.length; i++) {
			var menuItem = menuItems[i];
			if (menuItem.group) {
				$('<li class="' + menuItem.icon + '"><a id="' + menuItem.id + '" href="javascript:void(0);"><span />' + JSEA.localizeMessage(menuItem.label) + '</a><ul menu-id="' + menuItem.id + '"></ul></li>').appendTo($container);
			} else {
				var linkUrl = "";
				if (menuItem.action) {
					linkUrl = menuItem.action;
					if (menuItem.queryString) linkUrl += "?" + menuItem.queryString;
				} else if (menuItem.href) {
					linkUrl = menuItem.href;
				}
				$('<li class="' + menuItem.icon + '"><a id="' + menuItem.id + '" url="' + linkUrl + '" mode="' + menuItem.mode + '" href="javascript:void(0);"><span />' + JSEA.localizeMessage(menuItem.label) + '</a></li>').appendTo($container);
			}
		}
	}

	// initialize css class for .menus
	$menus.addClass('sm').addClass('sm-vertical').addClass('sm-simple');
	
	// initialize first level menu items and mark the current menu item
	$.ajax({
		url : JSEA.getPageContext().resolveUrl('user/menu'),
		type : 'get',
		dataType : 'json',
		success : function(menuItems) {
			paintMenuItems($menus, menuItems);
			$menus.smartmenus({ hideOnClick : false, showOnClick : true, markCurrentItem : true });
			$menus.on('click.jsea', 'a:not(.has-submenu)', function() {
				var id   = $(this).attr('id');
				var url  = $(this).attr('url');
				var mode = $(this).attr('mode');
				return window.Page.triggerHandler("navigate.jsea", 
						{ action : function () {
									window.Page.perform({url : url, mode : mode});
									$menus.find('.current').removeClass('current');
									$menus.smartmenus("itemActivate", $("a#" + id).addClass('current'));
									if (Page.viewVia('mobile')) $('.anchor', $('.app-anchor')).triggerHandler('click');
								}
						}
					);
			});
		}
	});
	
	$menus.bind('beforefirstshow.smapi', function(e, ulEle) {
		var $container = $(ulEle);
		if ($container.find(">li").size() == 0 ) {
			var self = $container.closest('ul.sm').data('smartmenus');
			$.ajax({
				url : JSEA.getPageContext().resolveUrl('user/menu/children/' + $container.attr('menu-id')),
				type : 'get',
				dataType : "json",
				success : function(menuItems) {
					paintMenuItems($container, menuItems);
					$container.find('ul').each(function() {
						self.menuInit($(this));
					});
				}
			});
		}
		return true;
	});
};