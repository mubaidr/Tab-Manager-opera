/*
TO DO
Version 1:
-Icons for Extension, buttons and tabs/windows.
-Use right click to focus selected tab/window (disallow default right click action)
-Auto Split based on Domain names
-!Memory leak and other performance improvements
-Status icons for tabs/windows
-Add keyboard shortcuts
Version 2:
-Tab seearch filter
-Nick names for Windows/Tabs
-Make windows/tabs persistant
 */
'use strict';
var prev_type = 'undefined', selected = {
	'type' : 'undefined',
	'list' : []
}, activeMove = false;

function focusTab(target) {}

function getSelected() {
	deSelect();
	$('.selected').each(function (i, item) {
		selected.list.push(parseInt(item.id, 10));
	});
}

function restoreSelected() {
	var obj = selected;
	if (obj.list.length !== 0) {
		for (var i = 0; i < obj.list.length; i++) {
			$('#' + obj.list[i]).addClass('selected');
		}
	}
}

function deSelect(reset) {
	if (reset !== true) {
		selected.type = prev_type;
	} else {
		prev_type = 'undefined';
		selected.type = 'undefined';
	}
	selected.list.length = 0;
}

function createNew(type) {
	var obj = selected;
	if (type === 'Tab') {
		if (obj.type === 'Window') {
			for (var i = 0; i < obj.list.length; i++) {
				chrome.tabs.create({
					'windowId' : obj.list[i],
					'selected' : false
				});
			}
		} else {
			chrome.windows.getCurrent(function (win) {
				chrome.tabs.create({
					'windowId' : win.id,
					'selected' : false
				});
			});
		}
	} else {
		chrome.windows.create({
			'focused' : false
		});
	}
}

function closeSelected(all) {
	var obj;
	if (all === true) {
		var currentWin,
		newTab;
		chrome.windows.getCurrent({
			'populate' : true
		}, function (win) {
			currentWin = win.id;
			chrome.tabs.create({
				'windowId' : win.id,
				'selected' : false
			}, function (tab) {
				newTab = tab.id
			});
			for (var i = 0; i < win.tabs.length; i++) {
				var tab_id = win.tabs[i].id;
				if (tab_id !== newTab) {
					chrome.tabs.remove(tab_id);
				}
			};
		});
		chrome.windows.getAll(function (wins) {
			for (var i = 0; i < wins.length; i++) {
				if (currentWin !== wins[i].id) {
					chrome.windows.remove(wins[i].id);
				}
			}
		});
	} else {
		obj = selected;
		if (obj.list.length !== 0) {
			if (obj.type === 'Tab') {
				chrome.tabs.remove(obj.list);
			} else {
				$(obj.list).each(function (i, item) {
					chrome.windows.remove(item);
				});
			}
		}
	}
	deSelect(true);
}

function makePrivate(all) {
	/*Merge the two code snippets using only obj for windows array*/
	if (typeof(all) !== 'undefined') {
		chrome.windows.getAll({
			populate : true
		}, function (wins) {
			for (var k = 0; k < wins.length; k++) {
				chrome.windows.create({
					'incognito' : all
				}, function (new_window) {
					for (var j = 0; j < wins[k].tabs.length; j++) {
						chrome.tabs.create({
							'windowId' : new_window.id,
							'url' : wins[k].tabs[j].url
						});
					}
					chrome.tabs.remove(new_window.tabs[0].id);
				});
				chrome.windows.remove(wins[k].id);
			}
		});
	} else {
		var obj = selected;
		if (obj.list.length > 0) {
			if (obj.type === 'Window') {
				for (var i = 0; i < obj.list.length; i++) {
					var incognito = true;
					chrome.windows.get(obj.list[0], {
						populate : true
					}, function (old_window) {
						if (old_window.incognito === true) {
							incognito = false;
						} else {
							incognito = true;
						}
						chrome.windows.create({
							'incognito' : incognito
						}, function (new_window) {
							for (var j = 0; j < old_window.tabs.length; j++) {
								chrome.tabs.create({
									'windowId' : new_window.id,
									'url' : old_window.tabs[j].url
								});
							}
							chrome.tabs.remove(new_window.tabs[0].id);
							chrome.windows.remove(old_window.id);
						});
					});
				}
			}
		}
	}
}

function togglePin(all) {
	if (typeof(all) !== 'undefined') {
		log(all);
		chrome.windows.getAll({
			populate : true
		}, function (wins) {
			for (var k = 0; k < wins.length; k++) {
				for (var j = 0; j < wins[k].tabs.length; j++) {
					chrome.tabs.update({
						'pinned' : all
					});
				}
			}
		});
	} else {
		var obj = selected;
		if (obj.list.length > 0) {
			if (obj.type === 'Tab') {
				for (var j = 0; j < obj.list.length; j++) {
					var pin = true;
					chrome.tabs.get(obj.list[j], function (tab) {
						if (tab.pinned === true) {
							pin = false;
						} else {
							pin = true;
						}
						chrome.tabs.update(tab.id, {
							'pinned' : pin
						});
					});
				}
			}
		}
	}
}

function splitSelected(parent, id) {
	var obj = selected;
	var tab_ids = obj.list;
	if (tab_ids.length > 0 && obj.type === 'Tab') {
		if (!parent) {
			chrome.windows.create({}, function (new_window) {
				for (var j = 0; j < tab_ids.length; j++) {
					chrome.tabs.move(tab_ids[j], {
						'windowId' : new_window.id,
						'index' : -1
					});
				}
			})
		} else {
			for (var j = 0; j < tab_ids.length; j++) {
				chrome.tabs.move(tab_ids[j], {
					'windowId' : parseInt(id, 10),
					'index' : -1
				});
			}
		}
	}
	loadData();
}

function moveto(){
	activeMove = true;
	alert("Please select target Window");
}

/*
function autoSplitTabs(){
handleClick();
var domainList = new Array();
for (f = 0; f < count.length; f++){
var matches = count[f].url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
var domain = matches && matches[1];
if(domain){
domain = domain.substring(domain.indexOf(".")+1);
domainList.push([domain,count[f]]);
}
}
domainList.sort();
var tabGrps = new Array();
for (w = 0; w < domainList.length; w++){
if (w == 0){tabGrps.push(domainList[w][1]);}
else if(domainList[w][0] == domainList[w-1][0]){
tabGrps.push(domainList[w][1]);
}else{
var win = opera.extension.windows.create(tabGrps);
tabGrps = [];
tabGrps.push(domainList[w][1]);
}

}
};

function tabFocus(tabToFocus){
handleClick();
for (i = 0; i < count.length; i++){
if(count[i].id ==  tabToFocus){
count[i].focus();
break;
}
}
}
*/
