/**
 * @(#) Project: Pyrube JSEA
 * 
 * 
 * Website: http://www.pyrube.com
 * Email: customercare@pyrube.com
 * Copyright Pyrube 2009. All rights reserved.
 */

/**
 * Extensions for system <code>Array</code>, <code>Date</code>, <code>String</code>.
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 */

/**
 * returns a new array to match with regular expression
 * @param reg RegExp. 
 * @since Oct 12, 2010
 */
Array.prototype.extract = function (reg) {
	if (this.length == 0) return(this);
	var that = [];
	for (var i = 0; i < this.length; i++) {
		if (reg.test(this[i])) that[that.length] = this[i];
	}
	return(that);
};

/**
 * returns a new array to remove duplicated elements
 * @since Oct 12, 2010
 */
Array.prototype.unique = function () {
	var that = [];
	for (var i = 0; i < this.length; i++) {
		if ($.inArray(this[i], that) == -1) {
			that.push(this[i]);
		}
	}
	return(that);
};

/**
 * serialize an array of Form elements or a set of key-value pairs
 * into a query string
 * @since Aug 31, 2014
 */
Array.prototype.toQueryString = function () {
	if (this.length == 0) return("");
	var that = [];
	for (var i = 0; i < this.length; i++) {
		that[that.length] = encodeURIComponent(this[i].name) + "=" + encodeURIComponent(this[i].value);
	}
	// return the resulting serialization
	return that.join("&").replace(/%20/g, "+");
};


/**
 * returns a copy of this Date
 * @since Sep 22, 2014
 */
Date.prototype.clone = function () {
	return(new Date(this.getTime()));
};

/**
 * adds the specified (signed) amount of time to the given time field.
 * For example:  new Date().add('M', -5)
 *				 new Date().add('y', 3)
 * @param type
 * @param interval  
 * @return date
 * @since Mar 10, 2022
 */
Date.prototype.add = function (type, interval) {
	if (!type || !interval) return date;
	interval = parseInt(interval);
	if (type == 'y') {
		this.setFullYear(this.getFullYear() + interval);
	} else if (type == 'M') {
		this.setMonth(this.getMonth() + interval);
	} else if (type == 'd') {
		this.setDate(this.getDate() + interval);
	} else if (type == 'h') {
		this.setHours(this.getHours() + interval);
	} else if (type == 'm') {
		this.setMinutes(this.getMinutes() + interval);
	} else if (type == 's') {
		this.setSeconds(this.getSeconds() + interval);
	}
	return this;
}

/**
 * compares two Dates for ordering
 * @param another the <code>Date</code> to be compared
 * @return the value <code>0</code> if the argument Date is equal to
 *         this Date; a value <code>-1</code> if this Date is before 
 *         the Date argument; and a value <code>1</code> if this Date
 *         is after the Date argument
 * @since Sep 23, 2014
 * @throws message.error.null-argument
 * @throws message.error.prototype-not-matched
 */
Date.prototype.compareTo = function (anotherDate) {
	if (anotherDate == null) throw new Error(JSEA.localizeMessage("message.error.null-argument", 'anotherDate'));
	if (!(anotherDate instanceof Date)) throw new Error(JSEA.localizeMessage("message.error.prototype-not-matched", ['anotherDate', this.constructor.name]));
	var thisTime = this.getTime();
	var anotherTime = anotherDate.getTime();
	return(thisTime < anotherTime ? -1 : (thisTime == anotherTime ? 0 : 1));
};

/**
 * tests if this Date is before the specified Date.
 * @param when the <code>Date</code>
 * @return the value <code>true</code> if and only if the instant of time
 *         represented by this <code>Date</code> object is strictly earlier
 *         than the instant represented by <code>when</code>.
 *         the value <code>false</code>, otherwise.
 * @since Sep 23, 2014
 * @throws message.error.null-argument
 * @throws message.error.prototype-not-matched
 */
Date.prototype.before = function (when) {
	if (when == null) throw new Error(JSEA.localizeMessage("message.error.null-argument", 'when'));
	if (!(when instanceof Date)) throw new Error(JSEA.localizeMessage("message.error.prototype-not-matched", ['when', this.constructor.name]));
	return(this.getTime() < when.getTime());
};

/**
 * tests if this Date is after the specified Date.
 * @param when the <code>Date</code>
 * @return the value <code>true</code> if and only if the instant of time
 *         represented by this <code>Date</code> object is strictly later
 *         than the instant represented by <code>when</code>.
 *         the value <code>false</code>, otherwise.
 * @since Sep 23, 2014
 * @throws message.error.null-argument
 * @throws message.error.prototype-not-matched
 */
Date.prototype.after = function (when) {
	if (when == null) throw new Error(JSEA.localizeMessage("message.error.null-argument", 'when'));
	if (!(when instanceof Date)) throw new Error(JSEA.localizeMessage("message.error.prototype-not-matched", ['when', this.constructor.name]));
	return(this.getTime() > when.getTime());
};

/**
 * compares two Dates for equality
 * @param when the <code>Date</code> to compare with
 * @return the value <code>true</code> if and only if the argument is not
 *         <code>null</code> and is a <code>Date</code> object that represents
 *         the same point in time, to the millisecond, as this object.
 *         the value <code>false</code>, otherwise.
 * @since Sep 23, 2014
 */
Date.prototype.equals = function (when) {
	return(when instanceof Date && this.getTime() == when.getTime());
};

/**
 * compares two Dates for equality
 * @param when the <code>Date</code> to compare with
 * @return the value <code>true</code> if and only if the argument is not
 *         <code>null</code> and is a <code>Date</code> object that represents
 *         the same point in date, to the date, as this object.
 *         the value <code>false</code>, otherwise.
 * @since Sep 23, 2014
 */
Date.prototype.equalsIgnoreTime = function (when) {
	if (!(when instanceof Date)) return false;
	var thisClone = this.clone();
	var whenClone = when.clone();
	thisClone.setHours(0, 0, 0, 0);
	whenClone.setHours(0, 0, 0, 0);
	return(thisClone.getTime() == whenClone.getTime());
};

/**
 * HTML escapes the string for characters that are sensitive to
 * HTML interpreters, returning the string with these characters replaced
 * by the corresponding character entities.
 * @since Sep 15, 2013
 */
String.prototype.htmlEscape = function () {
	return(this.split("&").join("&amp;")
				.split("<").join("&lt;")
				.split(">").join("&gt;")
				.split("\"").join("&quot;")
				.split("'").join("&#39;"));
};

/**
 * returns a copy of the string, with leading and trailing whitespace
 * omitted.
 * @since Oct 12, 2010
 */
String.prototype.trim = function () {
	return this.replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, "");
};

/**
 * returns a copy of the string, with initial caps
 * @since Dec 11, 2015
 */
String.prototype.capitalize = function () {
	return this.charAt(0).toUpperCase() + this.substring(1, this.length);
};

/**
 * return an array of string wrapped with delim_start and delim_end
 * @since Dec 11, 2015
 */
String.prototype.delimit = function (delim_start, delim_end) {
	var iPos1 = -1;
	if (this.length == 0 || (iPos1 = this.indexOf(delim_start)) < 0) return(null);
	var a = [];
	while (iPos1 >= 0) {
		// try to filter the parameter
		var iPos2 = this.indexOf(delim_end, iPos1 + delim_start.length);
		if (iPos2 > 0) {
			// end is found
			var tmp = this.substring(iPos1 + delim_start.length, iPos2);
			a.push(tmp);
			// replace
			iPos2 = iPos1 + tmp.length;
			iPos1 = this.indexOf(delim_start, iPos2);
		} else {
			// no end, then exit
			iPos1 = -1;
		}
	}
	return(a);
};

/**
 * Compares the specified string to this String to determine if the
 * specified string is a prefix.
 * @param prefix
 * @param ignoreCase, ignoring upper/lower case, default is false
 * @since Jan 25, 2016
 */
String.prototype.startsWith = function (prefix, ignoreCase) {
	if (ignoreCase === undefined) ignoreCase = false;
	if (prefix.length > this.length) return false;
	if (prefix == null || prefix == "" || this.length == 0) {
		return true;
	}
	var substr = this.substr(0, prefix.length);
	return (!ignoreCase) ? substr == prefix : substr.toLowerCase() == prefix.toLowerCase();
};

/**
 * Compares the specified string to this String to determine if the
 * specified string is a suffix.
 * @param suffix
 * @param ignoreCase, ignoring upper/lower case, default is false
 * @since Jan 25, 2016
 */
String.prototype.endsWith = function (suffix, ignoreCase) {
	if (ignoreCase === undefined) ignoreCase = false;
	if (suffix.length > this.length) return false;
	if (suffix == null || suffix == "" || this.length == 0) {
		return true;
	}
	var substr = this.substr(this.length - suffix.length, this.length);
	return (!ignoreCase) ? substr == suffix : substr.toLowerCase() == suffix.toLowerCase();
};

/**
 * Left-pad a String with a specified String.
 * @param size the size to pad to
 * @param pad the String to pad with, null or empty treated as single space
 * @since Jan 25, 2016
 */
String.prototype.leftPad = function (size, pad) {
	if (pad == null || pad == '') { pad = ' '; }
	var padLen = pad.length;
	var thisLen = this.length;
	var pads = size - thisLen;
	if (pads <= 0) {
		return this; // returns original String when possible
	}
	if (pads == padLen) {
		return pad.concat(this);
	} else if (pads < padLen) {
		return pad.substring(0, pads).concat(this);
	} else {
		var padding = [];
		var padChars = pad.split('');
		for (var i = 0; i < pads; i++) {
			padding[i] = padChars[i % padLen];
		}
		return padding.join('').concat(this);
	}
};
