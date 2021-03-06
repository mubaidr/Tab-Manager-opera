chrome.tabs.onRemoved.addListener(function () {
	sendMessage();
});
chrome.tabs.onMoved.addListener(function () {
	sendMessage();
});
chrome.tabs.onUpdated.addListener(function () {
	sendMessage();
});
chrome.tabs.onCreated.addListener(function () {
	sendMessage();
});
chrome.windows.onCreated.addListener(function () {
	sendMessage();
});
chrome.windows.onRemoved.addListener(function () {
	sendMessage();
});
chrome.runtime.onInstalled.addListener(function () {
	chrome.browserAction.setBadgeBackgroundColor({
		color: [0, 114, 198, 255]
	});
	setText();
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.type === 'lock') {
		//Insert onbefore window unload function to tab
		var script = 'window.onbeforeunload = function(){return "You locked this tab."};';
		chrome.tabs.executeScript(request.tabId, {code: script});
	}
});

function sendMessage() {
	var views = chrome.extension.getViews({
		type: 'popup'
	});
	if (views.length > 0) {
		chrome.runtime.sendMessage({
			type: 'reload'
		});
	}
	setText();
}

function setText() {
	chrome.windows.getAll(function (wins) {
		chrome.tabs.query({}, function (tabs) {
			chrome.browserAction.setBadgeText({
				text: tabs.length.toString()
			});
			chrome.browserAction.setTitle({
				title: 'Windows: ' + wins.length + ' | Tabs: ' + tabs.length.toString()
			});
		});
	});
}
chrome.browserAction.setBadgeBackgroundColor({
	color: [0, 114, 198, 255]
});
setText();