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
				newTab = tab.id;
			});
			for (var i = 0; i < win.tabs.length; i++) {
				var tab_id = win.tabs[i].id;
				if (tab_id !== newTab) {
					chrome.tabs.remove(tab_id);
				}
			}
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

function PrivateSelected(call) {
	switch (call) {
		case -1:
			var obj = selected;
			if (obj.list.length > 0 && obj.type === 'Window') {
				for (var i = 0; i < obj.list.length; i++) {
					makePrivate(obj.list[i], false);
				}
			}
			break;
		case 0:
			var obj = selected;
			if (obj.list.length > 0 && obj.type === 'Window') {
				for (var i = 0; i < obj.list.length; i++) {
					makePrivate(obj.list[i], true);
				}
			}
			break;
		case 1:
		case 2:
			var bool = true;
			if (call === 2) {
				bool = false;
			}
			chrome.windows.getAll({
				populate: true
			},
			function (wins) {
				var temp = [], win;
				for (var i = 0; i < wins.length; i++) {
					win = wins[i];
					if (bool !== win.incognito) {
						var tabs = [];
						for (var j = 0; j < win.tabs.length; j++) {
							tabs.push(win.tabs[j].url);
						}
						chrome.windows.create({
							url: tabs,
							incognito: bool,
							focused: win.focused,
							left: win.left,
							top: win.top,
							width: win.width,
							height: win.height
						}, function (new_win) {
							chrome.windows.remove(win.id);
						});
					}
				}
			});
			break;
		default: break;
	}
}

function togglePin(call) {
	var bool = true;
	if (call !== 0 && call !== -1) {
		if (call === 2) {
			bool = false;
		}
		chrome.windows.getAll({
			populate: true
		}, function (wins) {
			for (var k = 0; k < wins.length; k++) {
				var win = wins[k];
				//for (var j = win.tabs.length - 1; j > -1; j--) {
				for (var j = 0; j < win.tabs.length; j++) {
					var tab = win.tabs[j];
					chrome.tabs.update(tab.id, {
						pinned: bool
					});
				}
			}
		});
	} else {
		if (call === -1) { bool = false; }
		var obj = selected;
		if (obj.list.length > 0) {
			if (obj.type === 'Tab') {
				for (var j = 0; j < obj.list.length; j++) {
					chrome.tabs.get(obj.list[j], function (tab) {
						if (tab.pinned !== bool) {
							chrome.tabs.update(tab.id, {
								pinned: bool
							});
						}
					});
				}
			} else {
				for (var j = 0; j < obj.list.length; j++) {
					chrome.tabs.query({ windowId: obj.list[j] }, function (tabs) {
						for (var k = 0; k < tabs.length; k++) {
							if (tabs[k].pinned !== bool) {
								chrome.tabs.update(tabs[k].id, {
									pinned: bool
								});
							}
						}
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
			for (var j = 0; j < tab_ids.length; j++) {
				var id = tab_ids[j];
				chrome.tabs.get(id, function (tab) {
					chrome.windows.get(tab.windowId, function (win) {
						if (win.incognito) {
							chrome.windows.create({
								url: tab.url,
								incognito: true
							}, function () {
								chrome.tabs.remove(id);
							});
						} else {
							chrome.windows.create(function (win) {
								chrome.tabs.move(id, {
									windowId: win.id,
									index: -1
								});
								chrome.tabs.remove(win.tabs[0].id);
							});
						}
					});
				});
			}
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
								});
								chrome.tabs.remove(tab);
							});
						} else {
							chrome.tabs.move(tab, {
								windowId: id,
								index: -1
							}, function () {
								loadData();
							});
						}
					});
				}
			});
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
				cloneWin(obj.list[i]);
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

function removeDuplicateLocal(id) {
	chrome.windows.get(id, {
		populate: true
	}, function (win) {
		var tabs = win.tabs;
		for (var l = 0; l < tabs.length; l++) {
			for (var j = 0; j < tabs.length && j !== l; j++) {
				if (tabs[j].url === tabs[l].url) {
					chrome.tabs.remove(tabs[j].id);
				}
			}
		}
	});
}

function cloneWin(id) {
	chrome.windows.get(id, { populate: true }, function (win) {
		var tabs = win.tabs, urls = [];
		for (var j = 0; j < tabs.length; j++) {
			urls.push(tabs[j].url);
		}
		chrome.windows.create({
			url: urls,
			focused: win.focused,
			incognito: win.incognito
		});
	});
}

function makePrivate(id, incognito) {
	chrome.windows.get(id, {
		populate: true
	}, function (old_window) {
		urls = [];
		for (var j = 0; j < old_window.tabs.length; j++) {
			urls.push(old_window.tabs[j].url);
		}
		chrome.windows.create({
			url: urls,
			incognito: incognito
		}, function () {
			chrome.windows.remove(old_window.id);
		});
	});
}

function merge() {
	var obj = selected;
	if (obj.list.length > 1 && obj.type === 'Window') {
		chrome.windows.get(obj.list[0], function (first_window) {
			var id = first_window.id;
			for (var i = 1; i < obj.list.length; i++) {
				chrome.tabs.query({ windowId: obj.list[i] }, function (tabs) {
					for (var j = 0; j < tabs.length; j++) {
						chrome.tabs.move(tabs[j].id, {
							windowId: id,
							index: -1
						});
					}
				});
			}
		});
	} else {
		alert("You must select two or more windows to merge.");
	}
}

/*Context Menu functions*/
function handler(func, obj) {
	var id = parseInt(obj, 10);
	var main_func = func.split('_')[0];
	var type_func = func.split('_')[1];
	getSelected();
	var count = selected.list.length;
	if (count > 0) {//If there are selected items
		var tabs = [], list = selected.list;
		for (var i = 0; i < list.length; i++) {
			tabs.push(list[i]);
		}
		switch (main_func) {
			case 'close':
				closeSelected();
				break;
			case 'create':
				switch (type_func) {
					case 'tab':
						for (var i = 0; i < tabs.length; i++) {
							chrome.tabs.create({ windowId: tabs[i], selected: false });
						}
						break;
					case 'tabLeft':
						for (var i = 0; i < tabs.length; i++) {
							chrome.tabs.get(tabs[i], function (tab) {
								chrome.tabs.create({
									windowId: tab.windowId,
									index: tab.index,
									selected: false
								});
							});
						}
						break;
					case 'tabRight':
						for (var i = 0; i < tabs.length; i++) {
							chrome.tabs.get(tabs[i], function (tab) {
								chrome.tabs.create({
									windowId: tab.windowId,
									index: tab.index + 1,
									selected: false
								});
							});
						}
						break;
					default: break;
				}
				break;
			case 'reload':
				reload();
				break;
			case 'pin':
				togglePin(0);
				break;
			case 'unpin':
				togglePin(-1);
				break;
			case 'private':
				PrivateSelected(0);
				break;
			case 'normal':
				PrivateSelected(-1);
				break;
			case 'clone':
				clone();
				break;
			case 'duplicate':
				removeDuplicate();
				break;
			case 'split':
				splitSelected(false);
				break;
			case 'reopen':
				chrome.history.search({
					text: '',
					maxResults: 1
				}, function (item) {
					chrome.tabs.create({
						url: item[0].url
					});
				});
				break;
			default:
				break;
		}
	} else {//If no selected items
		switch (main_func) {
			case 'close':
				switch (type_func) {
					case 'tab':
						chrome.tabs.remove(id);
						break;
					case 'window':
						chrome.windows.remove(id);
						break;
					case 'tabLeft':
						chrome.tabs.get(id, function (tab) {
							chrome.tabs.query({
								windowId: tab.windowId
							}, function (tabs) {
								for (var i = 0; i < tabs.length; i++) {
									if (tabs[i].index < tab.index) {
										chrome.tabs.remove(tabs[i].id);
									}
								}
							});
						});
						break;
					case 'tabRight':
						chrome.tabs.get(id, function (tab) {
							chrome.tabs.query({
								windowId: tab.windowId
							}, function (tabs) {
								for (var i = 0; i < tabs.length; i++) {
									if (tabs[i].index > tab.index) {
										chrome.tabs.remove(tabs[i].id);
									}
								}
							});
						});
						break;
					default: break;
				}
				break;
			case 'create':
				switch (type_func) {
					case 'tab':
						chrome.tabs.create({ windowId: id, selected: false });
						break;
					case 'window':
						chrome.windows.create();
						break;
					case 'winPrivate':
						chrome.windows.create({
							incognito: true
						});
						break;
					case 'tabLeft':
						chrome.tabs.get(id, function (tab) {
							chrome.tabs.create({
								windowId: tab.windowId,
								index: tab.index,
								selected: false
							});
						});
						break;
					case 'tabRight':
						chrome.tabs.get(id, function (tab) {
							chrome.tabs.create({
								windowId: tab.windowId,
								index: tab.index + 1,
								selected: false
							});
						});
						break;
					default: break;
				}
				break;
			case 'reload':
				if (type_func === 'tab') {
					chrome.tabs.reload(id);
				} else {
					if (confirm('Are you sure you want to reload all tabs in this window?')) {
						chrome.windows.get(id, { populate: true }, function (win) {
							var tabs = win.tabs;
							for (var i = 0; i < tabs.length; i++) {
								chrome.tabs.reload(tabs[i].id);
							}
						});
					}
				}
				break;
			case 'pin':
				if (type_func !== 'win') {
					chrome.tabs.update(id, { pinned: true });
				} else {
					chrome.windows.get(id, { populate: true }, function (win) {
						var tabs = win.tabs;
						for (var i = 0; i < tabs.length; i++) {
							chrome.tabs.update(tabs[i].id, {
								pinned: true
							});
						}
					});
				}
				break;
			case 'unpin':
				if (type_func !== 'win') {
					chrome.tabs.update(id, { pinned: false });
				} else {
					chrome.windows.get(id, { populate: true }, function (win) {
						var tabs = win.tabs;
						for (var i = 0; i < tabs.length; i++) {
							chrome.tabs.update(tabs[i].id, {
								pinned: false
							});
						}
					});
				}
				break;
			case 'private':
				makePrivate(id, true);
				break;
			case 'normal':
				makePrivate(id, false);
				break;
			case 'clone':
				if (type_func === 'tab') {
					chrome.tabs.duplicate(id);
				} else {
					cloneWin(id);
				}
				break;
			case 'duplicate':
				removeDuplicateLocal(id);
				break;
			case 'split':
				chrome.tabs.get(id, function (tab) {
					chrome.windows.get(tab.windowId, function (win) {
						if (win.incognito) {
							chrome.windows.create({
								url: tab.url,
								incognito: true
							}, function () {
								chrome.tabs.remove(id);
							});
						} else {
							chrome.windows.create(function (win) {
								chrome.tabs.move(id, {
									windowId: win.id,
									index: -1
								});
								chrome.tabs.remove(win.tabs[0].id);
							});
						}
					});
				});
				break;
			case 'reopen':
				chrome.history.search({
					text: '',
					maxResults: 1
				}, function (item) {
					chrome.tabs.create({
						url: item[0].url
					});
				});
				break;
			default:
				break;
		}
	}
}

function recentHandler(func, url) {
	switch (func) {
		case 'open_recent':
			chrome.tabs.create({
				url: url
			});
			break;
		case 'delete_recent':
			chrome.history.deleteUrl({
				url: url
			});
			loadRecentClosed();
			break;
		default: break;
	}
}