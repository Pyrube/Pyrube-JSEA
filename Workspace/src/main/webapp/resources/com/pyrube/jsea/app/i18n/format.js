/**
 * @(#) Project: Pyrube JSEA
 * 
 * 
 * Website: http://www.pyrube.com
 * Email: customercare@pyrube.com
 * Copyright Pyrube 2009. All rights reserved.
 */

/**
 * <code>Format</code> is an abstract base class for formatting locale-sensitive
 * information such as dates and numbers.
 * It has following data:
 *   localeCode    locale code (string)
 *   pattern       format pattern
 * It has following methods:
 *   parse(string)     : return an object of a given string with pattern
 *   format(object)    : return localized date/number with pattern
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 */
+function () {
	'use strict';

	var Format = function (localeCode, pattern) {
		this.localeCode = localeCode;
		this.pattern = pattern;
	};

	Format.VERSION = '1.0.0';

	/**
	 * locale formats: 
	 * {key = locale code, value = {key = format name, value = Format}}
	 */
	Format.localeFormats = {};

	Format.formatOf = function (localeCode, nameOrPattern, Constructor) {
		var formats = Format.localeFormats[localeCode];
		if (formats == null) {
			Format.localeFormats[localeCode] = {};
			formats = Format.localeFormats[localeCode];
		}
		
		var format = formats[nameOrPattern];
		if (format == null) {
			var pattern = JSEA.Constants.FORMATS[nameOrPattern];
			if (pattern == null) pattern = nameOrPattern;
			format = new Constructor(localeCode, pattern);
			formats[pattern] = format;
		}
		return format;
	}
	
	/**
	 * return a <code>DateFormat</code>
	 * @param localeCode the locale code
	 * @param nameOrPattern the pre-defined format name or pattern
	 * @returns
	 */
	Format.dateFormatOf = function (localeCode, nameOrPattern) {
		return Format.formatOf(localeCode, nameOrPattern, DateFormat);
	};
	
	/**
	 * return a <code>NumberFormat</code>
	 * @param localeCode the locale code
	 * @param nameOrPattern the pre-defined format name or pattern
	 * @returns
	 */
	Format.numberFormatOf = function (localeCode, nameOrPattern) {
		return Format.formatOf(localeCode, nameOrPattern, NumberFormat);
	};
	
	/**
	 * Date utilities
	 * 
	 * @author Aranjuez
	 * @version Dec 01, 2009
	 * @since Pyrube-JSEA 1.0
	 */
	window.Dates =  {
			VERSION : "2.0"
	};
	
	/**
	 * parses a string to produce a <code>Date</code>.
	 * @param string
	 * @param nameOrPattern the pre-defined format name or pattern
	 */
	Dates.parse = function (string, nameOrPattern) {
		var localeCode = JSEA.getPageContext().getLocale();
		var format = Format.dateFormatOf(localeCode, nameOrPattern);
		return format.parse(string);
	};
	
	/**
	 * formats the given <code>Date</code> into a date/time string
	 * @param date
	 * @param nameOrPattern the pre-defined format name or pattern
	 */
	Dates.format = function (date, nameOrPattern) {
		var localeCode = JSEA.getPageContext().getLocale();
		var format = Format.dateFormatOf(localeCode, nameOrPattern);
		return format.format(date);
	};

	/**
	 * returns a <code>Date</code> of now
	 * @return Date
	 */
	Dates.now = function () { return new Date(); };
	
	/**
	 * <code>DateFormat</code> is a concrete class for formatting and
	 * parsing dates in a locale-sensitive manner. It allows for formatting
	 * (date &rarr; text), parsing (text &rarr; date), and normalization.
	 * 
	 * @author Aranjuez
	 * @version Dec 01, 2009
	 * @since Pyrube-JSEA 1.0
	 */
	var DateFormat = function (localeCode, pattern) {
		Format.call(this, localeCode, pattern)
	};
	var tmp = null;
	DateFormat.prototype = (tmp = function (proto) { var func = function () {}; func.prototype = proto; return new func();} (Format.prototype));
	tmp.constructor = DateFormat;
	
	/**
	 * parses a string to produce a <code>Date</code>.
	 * @param string
	 * @returns Date
	 */
	DateFormat.prototype.parse = function (string) {
		if (!string) return null;
		//check the value is 0 - 9.
		this.isInteger = function (val) {
			for (var i=0; i < val.length; i++) {
				if ("1234567890".indexOf(val.charAt(i)) == -1) { 
					return false; 
				}
			}
			return true;
		};
		//Gets the token from minlength to maxlength.
		this.getInt = function (str, i, minlength, maxlength) {
			for (var x = maxlength; x >= minlength; x--) {
				var token = str.substring(i, i+x);
				if (token.length < minlength) { 
					return null; 
				}
				if (this.isInteger(token)) { 
					return token; 
				}
			}
			return null;
		};
		var i_val = 0;
		var i_format = 0;
		var c = "";
		var token = "";
		var token2 = "";
		var x,y;
		var year = new Date().getFullYear();
		var month = 1;
		var date = 1;
		var hh = 0;
		var mm = 0;
		var ss = 0;
		var ampm = "";
		while (i_format < this.pattern.length) {
			c = this.pattern.charAt(i_format);
			token = "";
			while ((this.pattern.charAt(i_format) == c) && (i_format < this.pattern.length)) {
				token += this.pattern.charAt(i_format++);
			}
			if (token == "yyyy" || token == "yy" || token == "y") {
				if (token == "yyyy") { 
					x = 4; y = 4; 
				}
				if (token == "yy") { 
					x = 2; y = 2; 
				}
				if (token == "y") { 
					x = 2; y = 4; 
				}
				year = this.getInt(string, i_val, x, y);
				if (year == null) return null; 
				i_val += year.length;
			} else if (token == "MM" || token == "M") {
				month = this.getInt(string, i_val, token.length, 2);
				if (month == null || month < 1 || month > 12) return null;
				i_val += month.length;
			} else if (token == "dd" || token == "d") {
				date = this.getInt(string, i_val, token.length, 2);
				if (date == null || (date < 1) || (date > 31)) return null;
				i_val += date.length;
			} else if (token == "hh" || token == "h") {
				hh = this.getInt(string, i_val, token.length, 2);
				if (hh == null || (hh < 1) || (hh > 12)) return null;
				i_val += hh.length;
			} else if (token == "HH" || token == "H") {
				hh = this.getInt(string, i_val, token.length, 2);
				if (hh == null || (hh < 0) || (hh > 23)) return null;
				i_val += hh.length;
			} else if (token == "mm" || token == "m") {
				mm = this.getInt(string, i_val, token.length, 2);
				if (mm == null || (mm < 0) || (mm > 59)) return null;
				i_val += mm.length;
			} else if (token == "ss" || token == "s") {
				ss = this.getInt(string, i_val, token.length, 2);
				if (ss == null || (ss < 0) || (ss > 59)) return null;
				i_val += ss.length;
			} else if (token == "a") {
				if (string.substring(i_val, i_val+2).toLowerCase() == "am") {
					ampm = "AM";
				} else if (string.substring(i_val, i_val+2).toLowerCase() == "pm") {
					ampm = "PM";
				} else {
					return null;
				}
				i_val += 2;
			} else {
				if (string.substring(i_val, i_val + token.length) != token) {
					return null;
				} else {
					i_val += token.length;
				}
			}
		}
		// validate data 
		if (i_val != string.length) return null; 
		// validate month
		if (month == 2) {
			if (((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0)) {
				if (date > 29) return null; 
			} else { 
				if (date > 28) return null; 
			}
		}
		if ((month == 4) || (month == 6) || (month == 9) || (month == 11)) {
			if (date > 30) return null; 
		}
		// set ampm
		if (hh < 12 && ampm == "PM") {
			hh = hh - 0 + 12; 
		} else if (hh > 11 && ampm == "AM") { 
			hh -= 12; 
		}
		return new Date(year, month-1, date, hh, mm, ss);
	};
	
	/**
	 * formats the given <code>Date</code> into a date/time string
	 * @param date
	 * @returns {String}
	 */
	DateFormat.prototype.format = function (date) {
		// convert from json date string to date object first
		if (date && (typeof date == 'string' || typeof date == 'number')) date = new Date(date);
		if (!date || typeof date != 'object') return null;
		var string = "";
		var i_format = 0;
		var c = "";
		var token = "";
		var y = date.getFullYear() + "";
		var M = (date.getMonth() + 1);
		var d = date.getDate();
		var E = date.getDay();
		var H = date.getHours();
		var m = date.getMinutes();
		var s = date.getSeconds();
		var value = {};
		value["y"] = "" + y;
		value["yyyy"] = y;
		value["yy"] = y.substring(2,4);
		value["M"] = M;
		value["MM"] = (M + "").leftPad(2, "0");
		value["d"] = d;
		value["dd"] = (d + "").leftPad(2, "0");
		value["H"] = H;
		value["HH"] = (H + "").leftPad(2, "0");
		if (H == 0) {
			value["h"] = 12;
		} else if (H > 12) {
			value["h"] = H - 12;
		} else {
			value["h"] = H;
		}
		value["hh"] = (value["h"] + "").leftPad(2, "0");
		if (H > 11) { 
			value["a"] = "PM"; 
		} else { 
			value["a"] = "AM"; 
		}
		value["m"] = m;
		value["mm"] = (m + "").leftPad(2, "0");
		value["s"] = s;
		value["ss"] = (s + "").leftPad(2, "0");
		while (i_format < this.pattern.length) {
			c = this.pattern.charAt(i_format);
			token = "";
			while ((this.pattern.charAt(i_format) == c) && (i_format < this.pattern.length)) {
				token += this.pattern.charAt(i_format++);
			}
			if (typeof(value[token]) != "undefined") { 
				string = string + value[token]; 
			} else { 
				string = string + token; 
			}
		}
		return string;
		
	};
	
	/**
	 * Number utilities
	 * 
	 * @author Aranjuez
	 * @version Dec 01, 2009
	 * @since Pyrube-JSEA 1.0
	 */
	window.Numbers =  {
			VERSION : "2.0"
	};
	
	/**
	 * parses a string to produce a <code>Number</code>.
	 * @param string
	 * @param nameOrPattern the pre-defined format name or pattern
	 */
	Numbers.parse = function (string, nameOrPattern) {
		var localeCode = JSEA.getPageContext().getLocale();
		var format = Format.numberFormatOf(localeCode, nameOrPattern);
		return format.parse(string);
	};
	
	/**
	 * formats the given <code>Number</code> into a number string
	 * @param number
	 * @param nameOrPattern the pre-defined format name or pattern
	 */
	Numbers.format = function (number, nameOrPattern) {
		var localeCode = JSEA.getPageContext().getLocale();
		var format = Format.numberFormatOf(localeCode, nameOrPattern);
		return format.format(number);
	};
	
	/**
	 * formats the given <code>Number</code> into a money string
	 * @param number
	 * @param ccyCode the currency code
	 */
	Numbers.formatMoney = function (number, ccyCode) {
		var localeCode = JSEA.getPageContext().getLocale();
		var formatName = Numbers.resolveCurrencyFormat(ccyCode);
		var format = Format.numberFormatOf(localeCode, formatName);
		return format.format(number);
	};
	
	/**
	 * ungroup the amount of a given <code>Amountfield</code>
	 * @param field the HTML element
	 * @param ccyCode the currency code
	 */
	Numbers.ungroupField = function (field, ccyCode) {
		if (field == null) return null;
		var localeCode = JSEA.getPageContext().getLocale();
		var formatName = Numbers.resolveCurrencyFormat(ccyCode);
		var format = Format.numberFormatOf(localeCode, formatName);
		var $field = $(field);
		var string = format.ungroup($field.val());
		$field.val(string);
		$field.select();
		return $field.val();
	};
	
	/**
	 * group the amount of a given <code>Amountfield</code>
	 * @param field the HTML element
	 * @param ccyCode the currency code
	 */
	Numbers.groupField = function (field, ccyCode) {
		if (field == null) return null;
		var localeCode = JSEA.getPageContext().getLocale();
		var formatName = Numbers.resolveCurrencyFormat(ccyCode);
		var format = Format.numberFormatOf(localeCode, formatName);
		var $field = $(field);
		var number = format.parse($field.val());
		$field.val(format.format(number));
		return $field.val();
	};
	
	/**
	 * resolve currency format
	 * @param ccyCode the currency code. e.g. CNY, USD
	 */
	Numbers.resolveCurrencyFormat = function (ccyCode) {
		var scale = Numbers.getCurrencyScale(ccyCode);
		return "money" + scale;
	};
	
	/**
	 * return currency scale
	 * @param ccyCode the currency code. e.g. CNY, USD
	 */
	Numbers.getCurrencyScale = function (ccyCode) {
		return (JSEA.Constants.CURRENCIES[ccyCode]) ? JSEA.Constants.CURRENCIES[ccyCode].scale : 2;
	};
	
	/**
	 * <code>NumberFormat</code> is the concret class for all number
	 * formats. This class provides the methods for formatting and parsing
	 * numbers.
	 * 
	 * @author Aranjuez
	 * @version Dec 01, 2009
	 * @since Pyrube-JSEA 1.0
	 */
	var NumberFormat = function (localeCode, pattern) {
		Format.call(this, localeCode, pattern)
	};
	NumberFormat.prototype = (tmp = function (proto) { var func = function () {}; func.prototype = proto; return new func();} (Format.prototype));
	tmp.constructor = NumberFormat;
	/**
	 * removes the group separator from a given string.
	 * just for internal use
	 * @param string
	 * @returns {String}
	 */
	NumberFormat.prototype.ungroup = function (string) {
		if ( typeof(string) == "number" ) return string + "";
		if (string == null || string == "" || string == undefined) return "0";
		string = string + "";
		string = string.replace(eval("/\\" + JSEA.Constants.FORMATS.groupSeparator + "/g"), "");
		return string;
	};
	
	/**
	 * standardize a string in number format. e.g. '123456,78' to '123456.78'
	 * just for internal use
	 * @param string
	 * @returns
	 */
	NumberFormat.prototype.standardize = function (string) {
		if ( typeof(string) == "number" ) return string + "";
		if (string == null || string == "" || string == undefined) return "0";
		string = string.replace(eval("/\\" + JSEA.Constants.FORMATS.decimalSeparator + "/g"), ".");
		if (string) {
			while(string.charAt(0) == '0' && string.length > 1 && string.charAt(1) != '.') {
				string = string.substring(1);
			}
		}
		return string;
	};
	
	/**
	 * localize a string in from number format to localized format
	 * @param string
	 * @returns {String}
	 */
	NumberFormat.prototype.localize = function (string) {
		string = string + "";
		string = string.replace(/\,/g, "#");
		string = string.replace(/\./g, JSEA.Constants.FORMATS.decimalSeparator);
		string = string.replace(/\#/g, JSEA.Constants.FORMATS.groupSeparator);
		return string;
	};
	
	/**
	 * parses a string to produce a <code>Number</code>.
	 * @param string
	 * @return Number
	 */
	NumberFormat.prototype.parse = function (string) {
		try {
			if (string === true) return Number(true);
			if (string === false) return Number(false);
			if (typeof string == "number") return Number(string);
			if (string instanceof Date) return Number(string);
			string = this.standardize(this.ungroup(string));
			return isNaN(string) ? Number.NaN : Number(string);
		} catch (e) {
			return Number.NaN;
		}
	};
	
	/**
	 * formats the given <code>Number</code> into a number string
	 * @param number
	 * @returns {String}
	 */
	NumberFormat.prototype.format = function (number) {
		var decArray;
		var fmtArray;
		if (number) {
			decArray = String(number).split(".");
		} else {
			decArray = ['0'];
		}
		if (this.pattern) {
			fmtArray = this.pattern.split(".");
		} else {
			fmtArray = [''];
		}
		var string = "";
		var flag = false; 
		var decStr = decArray[0];
		var fmtStr = fmtArray[0];
		var len = decStr.length - 1;
		for (var i = fmtStr.length - 1; i >= 0 ; i--) {
			switch(fmtStr.substr(i, 1)) {
			case '#':
				if (len >= 0) string = decStr.substr(len--, 1) + string;
				break;
			case '0':
				if (len >= 0) string = decStr.substr(len--, 1) + string;
				else string = '0' + string;
				break;
			case ',' :
				flag = true;
				string = ',' + string;
				break;
			}
		}
		if (len >= 0) {
			if (flag) {
				var length = decStr.length;
				for ( ; len >= 0; len--) {
					string = decStr.substr(len, 1) + string;
					if (len > 0 && ((length-len) % 3) == 0) string = "," + string;
				}
			}
			else string = decStr.substr(0, len + 1) + string;
		}
		string += ".";
		decStr = decArray.length > 1 ? decArray[1] : '';
		fmtStr = fmtArray.length > 1 ? fmtArray[1] : '';
		len = 0;
		for (var i = 0; i < fmtStr.length; i++) {
			switch (fmtStr.substr(i, 1)) {
			case '#':
				if (len < decStr.length) string += decStr.substr(len++, 1);
				break;
			case '0':
				if (len < decStr.length) string += decStr.substr(len++, 1);
				else string += '0';
				break;
			}
		}
		var sign = "";
		if (string.charAt(0) == "-" || string.charAt(0) == "+" ) {
			sign = string.charAt(0);
			string = string.substring(1);
		}
		return this.localize(sign + string.replace(/^\,/, "").replace(/\.$/, ""));
	};

} ();


/**
 * override empty formatters
 */ 
$.extend(JSEA.Constants.FORMATTERS, 
	{
		amount         : Numbers.formatMoney,
		money          : Numbers.formatMoney,
		date           : Dates.format,
		timestamp      : Dates.format,
		longTimestampZ : Dates.format
	});

/**
 * override empty parsers
 */ 
$.extend(JSEA.Constants.PARSERS, 
	{
		amount         : Numbers.parse,
		money          : Numbers.parse,
		date           : Dates.parse,
		timestamp      : Dates.parse,
		longTimestampZ : Dates.parse
	});