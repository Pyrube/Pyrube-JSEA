/**
 * @(#) Project: Pyrube JSEA
 * 
 * 
 * Website: http://www.pyrube.com
 * Email: customercare@pyrube.com
 * Copyright Pyrube 2009. All rights reserved.
 */

/**
 * JSEA Array-list object
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 */
+function () {
	'use strict';
	/**
	 * Constructor. 
	 * @param 
	 */ 
	window.ArrayList = function () {
		/**
		 * The size of the ArrayList (the number of elements it contains).
		 *
		 * @serial
		 */
		this.count = 0;
		/**
		 * The array buffer into which the elements of the ArrayList are stored.
		 */
		this.elementData = new Array();
	}
	ArrayList.VERSION = '1.0.0';
	/**
	 * Returns the number of elements in this list.
	 *
	 * @return  the number of elements in this list.
	 */
	ArrayList.prototype.size = function () {
		return this.count;
	};
	/**
	 * Tests if this list has no elements.
	 *
	 * @return true if this list has no elements;
	 *         false otherwise.
	 */
	ArrayList.prototype.isEmpty = function () {
		return this.count == 0;
	};
	/**
	 * Searches for the first occurence of the given argument, testing
	 * for equality using the equals method.
	 *
	 * @param elem an object.
	 * @return the index of the first occurrence of the argument in this
	 *         list; returns -1, if the object is not found.
	 */
	ArrayList.prototype.indexOf = function (elem) {
		if (elem == null) {
			for (var i = 0; i < this.count; i++) {
				if (null == this.elementData[i]) return i;
			}
		} else {
			if (typeof elem.equals == 'function') {
				// if this object 'elem' has equals method, it will be invoked.
				for (var i = 0; i < this.count; i++) {
					if (elem.equals(this.elementData[i]))  return i;
				}
			} else {
				for (var i = 0; i < this.count; i++) {
					if(elem == this.elementData[i]) return i;
				}
			}
		}
		return -1;
	};
	/**
	 * Returns true if this list contains the specified key.
	 *
	 * @param elem element whose presence in this List is to be tested.
	 * @return boolean
	 */
	ArrayList.prototype.contains = function (elem) {
		return this.indexOf(elem) >= 0;
	};
	/**
	 * Returns the element at the specified key in this list.
	 *
	 * @param index int.
	 * @return the element at the specified key in this list.
	 */
	ArrayList.prototype.get = function (index) {
		this.checkRange(index);
		return this.elementData[index];
	};
	/**
	 * Appends the specified element to the end of this list.
	 *
	 * @param elem element to be appended to this list.
	 * @return true (as per the general contract of Collection.add).
	 */
	ArrayList.prototype.add = function (elem) {
		this.elementData[this.count++] = elem;
		return true;
	};
	/**
	 * Inserts the specified element to the specified position of this list.
	 *
	 * @param index specified position where the element to be appended.
	 * @param elem element to be appended to this list.
	 * @return true (as per the general contract of Collection.add).
	 */
	ArrayList.prototype.insert = function (index, elem) {
		if (index == this.count) this.add(elem);
		this.checkRange(index);
		var originCount = this.count;
		for (var i = originCount - 1; i >= index; i--) {
			this.elementData[i + 1] = this.elementData[i];
		}
		this.elementData[index] = elem;
		this.count++;
		return true;
	};
	/**
	 * Removes the element at the specified key in this list.
	 * Shifts any subsequent elements to the left (subtracts one from their
	 * indices).
	 *
	 * @param index int.
	 * @return the element that was removed from the list.
	 */
	ArrayList.prototype.remove = function (index) {
		this.checkRange(index);
		var oldValue = this.get(index);
		this.elementData = this.elementData.slice(0, index)
								.concat(this.elementData.slice(index + 1, this.count));
		this.count--;
		return oldValue;
	};
	/**
	 * Removes all of the elements from this list.  The list will
	 * be empty after this call returns.
	 */
	ArrayList.prototype.clear = function () {
		this.elementData.length = 0;
		this.count = 0;
	};
	/**
	 * Returns a string representation of this arraylist.
	 *
	 * @return a string representation of this arraylist.
	 */
	ArrayList.prototype.toString = function () {
		var buf = JSEA.Constants.ARRAY_TOKEN_START;
		var maxIndex = this.size() - 1;
		for (var i = 0; i <= maxIndex; i++) {
			buf += this.elementData[i].toString();
			if (i < maxIndex) buf += ",";
		}
		buf += JSEA.Constants.ARRAY_TOKEN_END;
		return buf;
	};
	/**
	 * Check if the given index is in range. If not, throw an appropriate
	 * runtime error.
	 */
	ArrayList.prototype.checkRange = function (index) {
		if (index >= this.count || index < 0) {
			throw new Error("Array index " + index + " is out of range: " + this.count);
		}
	};
} ();

/**
 * JSEA Hash-map object
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 */
+function () {
	'use strict';
	/**
	 * Constructor. 
	 * @param 
	 */ 
	function HashMap() {
		/**
		 * The total number of mappings in the hash table.
		 */
		this.count = 0;
		/**
		 * The hash table data.
		 */
		this.tableData = new Array();
	}
	HashMap.VERSION = '1.0.0';
	/**
	 * Returns the number of key-value mappings in this map.
	 *
	 * @return the number of key-value mappings in this map.
	 */
	HashMap.prototype.size = function () {
		return this.count;
	};
	/**
	 * Tests if this list has no elements.
	 *
	 * @return true if this map contains no key-value mappings.
	 */
	HashMap.prototype.isEmpty = function () {
		return this.count == 0;
	};
	/**
	 * Returns true, if this map contains a mapping for the specified
	 * key
	 *
	 * @param key key whose presence in this Map is to be tested.
	 * @return true, if this map contains a mapping for the specified
	 * key
	 */
	HashMap.prototype.containsKey = function (key) {
		var entry = (key == null) 
		? this.findNullKeyEntry()
				: this.findNullKeyEntry(key);
		return(entry != null);
	};
	/**
	 * Returns the value to which this map maps the specified key.  Returns
	 * null if the map contains no mapping for this key.  A return
	 * value of null does not necessarily indicate that the
	 * map contains no mapping for the key; it's also possible that the map
	 * explicitly maps the key to null.  The containsKey
	 * operation may be used to distinguish these two cases.
	 *
	 * @param key key whose associated value is to be returned.
	 * @return the value to which this map maps the specified key.
	 */
	HashMap.prototype.get = function (key) {
		var entry = (key == null) 
		? this.findNullKeyEntry()
				: this.findNullKeyEntry(key);
		return (entry != null) ? entry.value : null;
	};
	/**
	 * Associates the specified value with the specified key in this map.
	 * If the map previously contained a mapping for this key, the old
	 * value is replaced.
	 *
	 * @param key key with which the specified value is to be associated.
	 * @param value value to be associated with the specified key.
	 * @return true (as per the general contract of Collection.add).
	 */
	HashMap.prototype.put = function (key, value) {
		var entry = (key == null) 
					? this.findNullKeyEntry()
							: this.findNullKeyEntry(key);
		if (entry == null) {
			entry = new Object();
			entry.key = key;
			this.tableData[this.count++] = entry;
		}
		var oldValue = entry.value;
		entry.value = value;
		return oldValue;
	};
	/**
	 * Removes the mapping for this key from this map if present.
	 *
	 * @param key key whose mapping is to be removed from the map.
	 * @return previous value associated with specified key, or null
	 *         if there was no mapping for key.  A null return can
	 *         also indicate that the map previously associated null
	 *         with the specified key.
	 */
	HashMap.prototype.remove = function (key) {
		var index = -1;
		var oldValue = null;
		for (var i = 0; i < this.count; i++) {
			if (key == this.tableData[i].key) {
				index = i;
				oldValue = this.tableData[i].value;
				break;
			}
		}
		if (index == -1) {
			return null;
		}
		this.tableData = this.tableData.slice(0, index)
							.concat(this.tableData.slice(index + 1, this.count));
		this.count--;
		return oldValue;
	};
	/**
	 * Removes all mappings from this map.
	 *
	 */
	HashMap.prototype.clear = function () {
		this.tableData.length = 0;
		this.count = 0;
	};
	/**
	 * Returns a set view of the keys contained in this map.
	 *
	 * @return a set view of the keys contained in this map.
	 */
	HashMap.prototype.keySet = function () {
		var keySet = new Array();
		for (var i = 0; i < this.tableData.length; i++)  {
			keySet[i] = this.tableData[i].key;
		}
		return keySet;
	};
	/**
	 * Returns a collection view of the values contained in this map.
	 *
	 * @return a collection view of the values contained in this map.
	 */
	HashMap.prototype.values = function () {
		var values = new Array();
		for (var i = 0; i < this.tableData.length; i++)  {
			values[i] = this.tableData[i].value;
		}
		return values;
	};
	/**
	 * Returns the entry with null-key in this map.
	 *
	 * @return the entry with null-key in this map.
	 */
	HashMap.prototype.findNullKeyEntry = function () {
		for (var i = 0; i < this.tableData.length; i++)  {
			if (null == this.tableData[i].key) return this.tableData[i];
		}
		return null;
	};
	/**
	 * Returns the entry with the specified non-null-key in this map.
	 *
	 * @param key entry key.
	 * @return the entry with the specified non-null-key in this map.
	 */
	HashMap.prototype.findNonNullKeyEntry = function (key) {
		for (var i = 0; i < this.tableData.length; i++)  {
			if (key == this.tableData[i].key) return this.tableData[i];
		}
		return null;
	};
	/**
	 * Returns a string representation of this map.  The string representation
	 * consists of a list of key-value mappings in the order returned by the
	 * map's entrySet view's iterator, enclosed in braces ("{}").
	 * Adjacent mappings are separated by the characters ", "  (comma and space). 
	 * Each key-value mapping is rendered as the key followed by an equals sign
	 * ("=") followed by the associated value.  
	 * Keys and values are converted to strings as by Object.toString().
	 *
	 * @return a String representation of this map.
	 */
	 HashMap.prototype.toString = function () {
		var max = this.size() - 1;
		var buf = "{";
		for (var i = 0; i <= max; i++) {
			var key = this.tableData[i].key;
			buf += (key + "=" + this.get(key).toString());
			if (i < max) buf += ", ";
		}
		buf += "}";
		return buf;
	};
} ();