'use strict';
var prev_type = 'undefined', selected = {
	'type': 'undefined',
	'list': []
}, activeMove = false;

function focusTab(id, type) {
	if (type === 'Tab') {
		chrome.tabs.update(parseInt(id, 10), {
			selected: true
		});
	} else {
		chrome.windows.update(parseInt(id, 10), {
			focused: true
		});
	}
}

function getSelected() {
	deSelect();
	$('.selected').each(function (i, item) {
		selected.list.push(id);
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

function createNew(type, p) {
	var obj = selected;
	if (type === 'Tab') {
		if (obj.type === 'Window') {
			for (var i = 0; i < obj.list.length; i++) {
				chrome.tabs.create({
					windowId: obj.list[i],
					selected: false
				});
			}
		} else {
			chrome.windows.getCurrent(function (win) {
				chrome.tabs.create({
					windowId: win.id,
					selected: false
				});
			});
		}
	} else {
		chrome.windows.create({
			focused: false,
			incognito: p
		});
	}
}

function closeSelected(all) {
	var obj;
	if (all === true) {
		var currentWin,
		newTab;
		chrome.windows.getCurrent({
			populate: true
		}, function (win) {
			currentWin = win.id;
			chrome.tabs.create({
				windowId: win.id,
				selected: false
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

function makePrivate(call) {
	switch (call) {
		case 0:
			var obj = selected;
			if (obj.list.length > 0 && obj.type === 'Window') {
				for (var i = 0; i < obj.list.length; i++) {
					chrome.windows.get(obj.list[i], {
						populate: true
					}, function (old_window) {
						var incognito = true;
						if (old_window.incognito) {
							incognito = false;
						}
						chrome.windows.create({
							incognito: incognito
						}, function (new_window) {
							for (var j = 0; j < old_window.tabs.length; j++) {
								chrome.tabs.create({
									windowId: new_window.id,
									url: old_window.tabs[j].url,
									pinned: old_window.tabs[j].pinned,
									selected: old_window.tabs[j].selected
								});
							}
							chrome.tabs.remove(new_window.tabs[0].id);
							chrome.windows.remove(old_window.id);
						});

					});
				}
			}
			break;
		case 1:
		case 2:
			var bool = true;
			if (call === 2) {
				bool = false
			}
			chrome.windows.getAll({
				populate: true
			},
			function (wins) {
				var temp = [], win;
				for (var i = 0; i < wins.length; i++) {
					temp.push(wins[i]);
					if (bool !== wins[i].incognito) {
						win = temp.pop();
						chrome.windows.create({
							incognito: bool,
							focused: win.focused,
							left: win.left,
							top: win.top,
							width: win.width,
							height: win.height
						}, function (new_win) {
							var tabs = [];
							for (var j = 0; j < win.tabs.length; j++) {
								tabs.push(win.tabs[j]);
								var old_tab = tabs.pop();
								chrome.tabs.create({
									windowId: new_win.id,
									url: old_tab.url,
									pinned: old_tab.pinned,
									selected: old_tab.selected
								});
							}
							chrome.tabs.remove(new_win.tabs[0].id);
							chrome.windows.remove(win.id);
						});
					}
				}
			})
			break;
		default: break;
	}
}

function togglePin(call) {
	if (call !== 0) {
		var bool = true;
		if (call === 2) {
			bool = false
		};
		chrome.windows.getAll({
			populate: true
		}, function (wins) {
			for (var k = 0; k < wins.length; k++) {
				var win = wins[k];
				for (var j = 0; j < win.tabs.length; j++) {
					var tab = win.tabs[j];
					chrome.tabs.update(tab.id, {
						pinned: bool
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
							pinned: pin
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
	if (id) {
		id = parseInt(id, 10);
	}
	if (tab_ids.length > 0 && obj.type === 'Tab') {
		if (!parent) {
			chrome.windows.create({}, function (new_window) {
				for (var j = 0; j < tab_ids.length; j++) {
					chrome.tabs.move(tab_ids[j], {
						windowId: new_window.id,
						index: -1
					});
				}
			})
		} else {
			var old_win_id, temp = [], tab;
			chrome.windows.get(id, function (new_win) {
				for (var i = 0; i < tab_ids.length; i++) {
					old_win_id = parseInt($('#' + tab_ids[i]).parent().parent().parent().attr('id').split('_')[0], 10);
					temp.push(tab_ids[i]);
					chrome.windows.get(old_win_id, function (old_win) {
						tab = temp.pop();
						if (new_win.incognito || old_win.incognito) {
							chrome.tabs.get(tab, function (old_tab) {
								chrome.tabs.create({
									windowId: new_win.id,
									url: old_tab.url
								})
								chrome.tabs.remove(tab);
							})
						} else {
							chrome.tabs.move(tab, {
								windowId: id,
								index: -1
							}, function () {
								loadData();
							})
						}
					})
				}
			})
		}
	}
}

function moveto() {
	activeMove = true;
	alert("Please select target Window");
}

function reload(bool) {
	if (bool) {
		chrome.windows.getAll({
			populate: true
		}, function (wins) {
			for (var k = 0; k < wins.length; k++) {
				var win = wins[k];
				for (var j = 0; j < win.tabs.length; j++) {
					var tab = win.tabs[j];
					chrome.tabs.reload(tab.id);
				}
			}
		});
	} else {
		var obj = selected;
		if (obj.list.length > 0) {
			var arr = obj.list;
			if (obj.type === 'Tab') {
				for (var i = 0; i < arr.length; i++) {
					chrome.tabs.reload(arr[i]);
				}
			} else {
				for (var i = 0; i < arr.length; i++) {
					chrome.windows.get(arr[i], {
						populate: true
					}, function (win) {
						for (var j = 0; j < win.tabs.length; j++) {
							var tab = win.tabs[j];
							chrome.tabs.reload(tab.id);
						}
					});
				}
			}
		}
	}
}

function clone() {
	var obj = selected;
	if (obj.list.length > 0) {
		if (obj.type === 'Window') {
			for (var i = 0; i < obj.list.length; i++) {
				chrome.windows.get(obj.list[i], {
					populate: true
				}, function (old_win) {
					chrome.windows.create({
						focused: old_win.focused,
						incognito: old_win.incognito
					}, function (new_win) {
						var old_tabs = old_win.tabs;
						for (var j = 0; j < old_tabs.length; j++) {
							chrome.tabs.create({
								windowId: new_win.id,
								url: old_tabs[j].url,
								selected: false
							});
							//chrome.tabs.duplicate(old_tabs[j].id);
						}
						chrome.tabs.remove(new_win.tabs[0].id);
					});
				});
			}
		} else {
			var tab_ids = obj.list;
			for (var i = 0; i < tab_ids.length; i++) {
				chrome.tabs.duplicate(tab_ids[i]);
			}
		}
	}
}

function removeDuplicate() {
	chrome.windows.getAll({
		populate: true
	}, function (wins) {
		for (var k = 0; k < wins.length; k++) {
			var tabs = wins[k].tabs;
			for (var l = 0; l < tabs.length; l++) {
				for (var j = 0; j < tabs.length && j !== l; j++) {
					if (tabs[j].url === tabs[l].url) {
						chrome.tabs.remove(tabs[j].id);
					}
				}
			}
		}
	});
}