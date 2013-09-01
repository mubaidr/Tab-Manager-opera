'use strict';
window.onload = function () {
	loadData();
	actionEvents();
	tooltipEvents();
};

function loadData() {
	chrome.windows.getAll({
		populate : true
	}, function (windows) {
		$('#tab_container').html('');
		for (var i = 0; i < windows.length; i++) {
			//log(windows[i]);
			var win = windows[i];
			var tabs = win.tabs;
			addToList(win, 'Window');
			for (var j = 0; j < tabs.length; j++) {
				var tab = tabs[j];
				//log(tab);
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

function showStatus(object, type, parent_id) {
	var item = $('#' + object.id);
	if (type === 'Window') {
		if (object.incognito) {
			item.css({
				'background-image' : 'url(../img/window.png), url(../img/private.png)'
			});
		} else {
			item.css({
				'background-image' : 'url(../img/window.png)'
			})
		}
	} else {
		if (object.pinned) {
			if (object.url !== 'opera://startpage/') {
				item.css({
					'background-image' : 'url(' + object.favIconUrl + '), url(../img/pin.png)'
				})
			} else {
				item.css({
					'background-image' : 'url(../img/tab.png), url(../img/pin.png)'
				})
			}
		} else {
			if (object.url !== 'opera://startpage/') {
				if (object.url.split(':')[0] === 'opera') {
					item.css({
						'background-image' : 'url(../img/opera.png)'
					})
				} else {
					item.css({
						'background-image' : 'url(' + object.favIconUrl + ')'
					})
				}
			} else {
				item.css({
					'background-image' : 'url(../img/tab.png)'
				})
			}
		}

	}
	item.css({
		'background-position' : '2px center, right center',
		'background-repeat' : 'no-repeat',
		'background-size' : '14px 14px'
	});
	if (object.focused || object.selected) {
		item.addClass('focused');
	}
}

function attachEvents(item) {
	//Enable selection
	$(item).on('click', function () {
		var tab = event.target;
		if (!activeMove) {
			if (tab.type !== prev_type) {
				prev_type = tab.type;
				//Unselect all previous and select new
				$('h4').removeClass('selected');
			}
			$(tab).toggleClass('selected');
		} else {
			if (tab.type === 'Window') {
				splitSelected(true, tab.id)
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
		case 'btn_AutoSplit':
			autoSplitTabs();
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
			makePrivate(1);
			break;
		case 'btn_Normal_all': //Done
			makePrivate(2);
			break;
		case 'btn_close': //Done
			closeSelected();
			break;
		case 'btn_close_all': //Done
			closeSelected(true);
			break;
		case 'btn_reload': //Done
			reload();
			break;
		case 'btn_reload_all': //Done
			reload(true);
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
		loadData();
	});
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
}

/*Debug code*/
function log(i) {
	console.log(i);
}
