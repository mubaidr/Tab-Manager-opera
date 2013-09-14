'use strict';
window.onload = function () {
	loadData();
	actionEvents();
	tooltipEvents();
	$.contextMenu({
		// define which elements trigger this menu
		selector: "h4",
		// define the elements of the menu
		items: {
			foo: { name: "Foo", callback: function (key, opt) { alert("Foo!"); } },
			bar: { name: "Bar", callback: function (key, opt) { alert("Bar!") } }
		}
		// there's more, have a look at the demos and docs...
	});
};

function menuAction() {
	
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.type === 'reload') { loadData() };
});

function loadData() {
	chrome.windows.getAll({
		populate: true
	}, function (windows) {
		$('#tab_container').html('');
		for (var i = 0; i < windows.length; i++) {
			var win = windows[i];
			var tabs = win.tabs;
			addToList(win, 'Window');
			for (var j = 0; j < tabs.length; j++) {
				var tab = tabs[j];
				addToList(tab, 'Tab', win.id);
			}
		}
		restoreSelected();
	});
}

function addToList(object, type, parent_id) {
	//Populate list
	var li = document.createElement('li');
	var h4 = document.createElement('h4');
	h4.id = object.id;
	h4.type = type;
	$(li).append(h4);
	attachEvents(h4);
	switch (type) {
		case 'Window':
			li.id = object.id + '_liw';
			$(h4).addClass('window');
			$(h4).html(type);
			var ul = document.createElement('ul');
			$(li).append(ul);
			$('#tab_container').append(li);
			break;
		case 'Tab':
			li.id = object.id + '_lit';
			$(h4).addClass('tab');
			h4.title = object.url;
			$(h4).html(object.title);
			$('#' + parent_id + '_liw ul').append(li);
			break;
		default:
			break;
	}
	showStatus(object, type, parent_id);
}

function addToRecentList(object) {
	//Populate Recent Tabs list
	var li = document.createElement('li');
	var h4 = document.createElement('h4');
	h4.title = object.url;
	if (object.title !== '') {
		h4.innerHTML = object.title;
	} else {
		h4.innerHTML = 'Untitled';
	}	
	$(li).append(h4);
	$('#tab_container_recent').append(li);
	$(h4).dblclick(function () {
		var tab_url = this.title;
		chrome.tabs.create({
			url: tab_url
		});
	});
}

function showStatus(object, type, parent_id) {
	var item = $('#' + object.id);
	if (type === 'Window') {
		if (object.incognito) {
			item.css({
				'background-image': 'url(../img/window.png), url(../img/private.png)'
			});
		} else {
			item.css({
				'background-image': 'url(../img/window.png)'
			})
		}
	} else {
		if (object.pinned) {
			if (object.url !== 'opera://startpage/') {
				item.css({
					'background-image': 'url(' + object.favIconUrl + '), url(../img/pin.png)'
				})
			} else {
				item.css({
					'background-image': 'url(../img/tab.png), url(../img/pin.png)'
				})
			}
		} else {
			if (object.url !== 'opera://startpage/') {
				if (object.url.split(':')[0] === 'opera') {
					item.css({
						'background-image': 'url(../img/opera.png)'
					})
				} else {
					item.css({
						'background-image': 'url(' + object.favIconUrl + ')'
					})
				}
			} else {
				item.css({
					'background-image': 'url(../img/tab.png)'
				})
			}
		}

	}
	item.css({
		'background-position': '2px center, right center',
		'background-repeat': 'no-repeat',
		'background-size': '14px 14px'
	});
	if (object.focused || object.selected) {
		item.addClass('focused');
	}
}

function attachEvents(item) {
	$(item).on('click', function () {
		var tab = event.target;
		if (!activeMove) {
			if (tab.type !== prev_type) {
				prev_type = tab.type;
				$('h4').removeClass('selected');
			}
			$(tab).toggleClass('selected');
		} else {
			if (tab.type === 'Window') {
				splitSelected(true, tab.id);
				activeMove = false;
			} else {
				alert("Please select Window.");
			}
		}
	});
	$(item).dblclick(function () {
		focusTab(item.id, item.type)
	});
}

function actionEvents() {
	$('#action_container button').on('click', function () {
		getSelected();
		activeMove = false;
		var id = event.target.id;
		switch (id) {
			case 'btn_split':
				splitSelected(false); //Done
				break;
			case 'btn_Move': //Done
				moveto();
				break;
			case 'btn_Pin': //Done
				togglePin(0);
				break;
			case 'btn_Pin_all': //Done
				togglePin(1);
				break;
			case 'btn_UnPin_all': //Done
				togglePin(2);
				break;
			case 'btn_Private': //Done
				makePrivate(0);
				break;
			case 'btn_Private_all': //Done
				if (confirm('Are you sure you want to make all Windows Private?')) {
					makePrivate(1);
				}
				break;
			case 'btn_Normal_all': //Done
				if (confirm('Are you sure you want to make all Windows Normal?')) {
					makePrivate(2);
				}
				break;
			case 'btn_close': //Done
				closeSelected();
				break;
			case 'btn_close_all': //Done
				if (confirm('Are you sure you want to close all tabs?')) {
					closeSelected(true);
				}
				break;
			case 'btn_reload': //Done
				reload();
				break;
			case 'btn_reload_all': //Done
				if (confirm('Are you sure you want to reload all tabs?')) {
					reload(true);
				}
				break;
			case 'btn_newTab': //Done
				createNew('Tab');
				break;
			case 'btn_newWindow': //Done
				createNew('Window', false);
				break;
			case 'btn_newPrivateWindow': //Done
				createNew('Window', true);
				break;
			case 'btn_clone': //Done
				clone();
				break;
			case 'btn_duplicate': //Done
				removeDuplicate();
				break;
			default:
				break;
		}
	});
	$('.subheading button').on('click', function (e) {
		switch (e.target.id) {
			case 'btn_all':
				showCurrentTabs(true);
				break;
			case 'btn_recent':
				showCurrentTabs(false);
				break;
			case 'btn_selected':
				break;
			case 'btn_allActions':
				break;
			default:
				break;
		}
	});
}

function showCurrentTabs(check) {
	if (check) {
		$('.column.right').show();
		$('#scroll_container').parent().css({
			width: '70%'
		});
		$('#tab_container').show();
		$('#tab_container_recent').hide();
		$('#info').html("Welcome to Easy Tab Manager!");
	} else {
		$('.column.right').hide();
		$('#scroll_container').parent().css({
			width: '100%'
		});
		$('#tab_container').hide();
		$('#tab_container_recent').show();
		$('#info').html("Double click to restore a tab.");
		loadRecentClosed();
	}
}

function loadRecentClosed() {	
	chrome.history.search({
		text: ''
	}, function (items) {
		for (var i = 0; i < items.length; i++) {
			addToRecentList(items[i]);
		}
	})
}

function tooltipEvents() {
	$('#action_container button').on('mouseover', function () {
		$('#info').html($(this).attr('title'));
		$(this).attr('title', '');
	});
	$('#action_container button').on('mouseleave', function () {
		$(this).attr('title', $('#info').html());
		$('#info').html('Welcome to Easy Tab Manager!');
	});
	$('.link a').on('mouseover', function () {
		$('#info').html($(this).attr('title'));
		$(this).attr('title', '');
	});
	$('.link a').on('mouseleave', function () {
		$(this).attr('title', $('#info').html());
		$('#info').html('Welcome to Easy Tab Manager!');
	});
	$('.link a').on('click', function () {
		chrome.tabs.create({
			url: '../html/help.html'
		});
	});
}