/**
 * @(#) Project: Pyrube JSEA
 * 
 * 
 * Website: http://www.pyrube.com
 * Email: customercare@pyrube.com
 * Copyright Pyrube 2009. All rights reserved.
 */

/**
 * JSEA I18n bundle
 * The Bundle object has following data:
 * localeCode    locale code (string)
 * i18nMessages  18n messages (json)
 * The Bundle object has following methods:
 * load(i18Messages)        : if param is null, it will load messages from back-end
 * getMessage(code, param)  : return localized message
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 */
var Bundle = function (localeCode) {
	this.localeCode = localeCode;
	this.i18nMessages = null;
};

Bundle.VERSION = '1.0.0';

Bundle.localeBundles = {};

Bundle.getBundle = function (localeCode) {
	var bundle = Bundle.localeBundles[localeCode];
	if (bundle == null) {
		bundle = new Bundle(localeCode);
		Bundle.localeBundles[localeCode] = bundle;
	}
	return bundle;
};

Bundle.prototype.load = function (i18nMessages) {
	if (i18nMessages == null) {
		// to-do load i18nMessages from back-end
	} else {
		this.i18nMessages = i18nMessages;
	}
};

Bundle.prototype.getMessage = function (code, param) {
	var conent = this.i18nMessages[code] !== undefined ? this.i18nMessages[code] : code;
	if (param == null) return conent;
	var params = null;
	if ($.isArray(param)) {
		params = param;
	} else {
		params = [];
		params.push(param);
	}
	var reg = null;
	for (var i = 0; i < params.length; i++) {
		reg = new RegExp("\\{" + i + "\\}", "g");
		conent = conent.replace(reg, params[i]);
	}
	return conent;
};