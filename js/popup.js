'use strict';
window.onload = function () {
	loadData();
	actionEvents();
	//window.setInterval(loadData(), 5000); Need Alarm API
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
			addToList(win.id, 'Window');
			for (var j = 0; j < tabs.length; j++) {
				var tab = tabs[j];
				//log(tab);
				addToList(tab.id, 'Tab', win.id, tab);
			}
		}
		restoreSelected();
	});
}

function addToList(id, type, parent_id, object) {
	//Populate list
	var li = document.createElement('li');
	var h4 = document.createElement('h4');
	h4.id = id;
	h4.type = type;
	$(li).append(h4);
	attachEvents(h4);
	switch (type) {
	case 'Window':
		li.id = id + '_liw';
		$(h4).addClass('window');
		$(h4).html(type);
		var ul = document.createElement('ul');
		$(li).append(ul);
		$('#tab_container').append(li);
		break;
	case 'Tab':
		li.id = id + '_lit';
		$(h4).addClass('tab');
		h4.title = object.url;
		$(h4).html(object.title);
		$('#' + parent_id + '_liw ul').append(li);
		break;
	default:
		break;
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
			autoSplit();
			break;
		case 'btn_Move':
			moveto();
			break;
		case 'btn_Pin': //Done
			togglePin();
			break;
		case 'btn_Pin_all': //Done
			togglePin(true);
			break;
		case 'btn_UnPin_all': //Done
			togglePin(false);
			break;
		case 'btn_Private': //Done
			makePrivate();
			break;
		case 'btn_Private_all': //Done
			makePrivate(true);
			break;
		case 'btn_Normal_all': //Done
			makePrivate(false);
			break;
		case 'btn_close': //Done
			closeSelected();
			break;
		case 'btn_close_all': //Done
			closeSelected(true);
			break;
		case 'btn_newTab': //Done
			createNew('Tab');
			break;
		case 'btn_newWindow': //Done
			createNew('Window');
			break;
		default:
			break;
		}
		loadData();
	});
}

/*Debug code*/
function log(i) {
	console.log(i);
}
