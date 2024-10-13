/**
 * @(#) Project: Pyrube JSEA
 * 
 * 
 * Website: http://www.pyrube.com
 * Email: customercare@pyrube.com
 * Copyright Pyrube 2009. All rights reserved.
 */

/**
 * JSEA Noter utility
 * 
 * @author Aranjuez
 * @version Dec 01, 2009
 * @since Pyrube-JSEA 1.0
 * @dependence: jQuery: jquery.js v1.11.3
 * @dependence: Bootstrap: tooltip.js v3.3.5
 * @dependence: JSEA: popup.js v1.0.0
 */
var Noter = {};

Noter.VERSION  = '1.0.0';

/**
 * Noter opened or not
 */
Noter.opened = false;

/**
 * check whether this function(/operation) is active for Noter
 */
Noter.ifActive = function (data) {
	var noteable = Page.DataRule(data.operation + JSEA.Constants.PATH_SEPARATOR + 'noteable');
	if (noteable === undefined) { noteable = Page.DataRule('noteable'); }
	 return(noteable === true);
};

/**
 * open the notes-pad to view notes, or leave a note
 */
Noter.open = function (data) {
	if (Noter.opened === true) return;
	Noter.opened = true;
	var params = {
		dataType  : data.type,
		dataId    : data.key,
		dataStatus: data.status
	};
	var criteria = params;
	Lookup.open({
		url       : 'jsea/noter',
		urlParams : params,
		args      : criteria,
		async     : {
			success : function () { Noter.scrollToLast(); }
		},
		close     : function () {
			Noter.opened = false;
		}
	});
};

/**
 * after a note left, append it to notes-pad grid
 */
Noter.append = function (data) {
	$('#notesContainer').grid().addRow(data);
	$('#noteContent', $('#frmNote')).val('').focus();
	Noter.scrollToLast();
};

/**
 * scroll to last
 */
Noter.scrollToLast = function () {
	$('#notesContainer').scrollTop($('#notesContainer')[0].scrollHeight);
};

/**
 * register a tool named notepad into Toolbar
 */
$(function () {
	window.Page.toolize({
		name     : 'notepad',
		manager  : Noter,
		event    : Noter.open,
		dataListening: true,
		disabled : true
	});
});