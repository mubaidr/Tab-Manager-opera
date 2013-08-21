var UIItemProperties = {
  disabled: false,
  title: "Tab Splitter",
  icon: "icon_18.png",
  popup: {
		href: "popup.html",
		width: 600,
		height: 615
	}
};

// Create the button and add it to the toolbar.
var button = opera.contexts.toolbar.createItem( UIItemProperties );  
opera.contexts.toolbar.addItem(button);

button.addEventListener('click', handleClick, false);
var count = "";
function handleClick() {
  // Get the last focused window
  var win = opera.extension.windows.getLastFocused();
  
  // Get all tabs in the window
  var groups = win.tabs.getAll();
  
  count = groups;
  //opera.postError('num '+count.length);

}

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

function autoGroupTab(){
	handleClick();
	ungroupTab();
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
				if (tabGrps.length > 1){
					var win = opera.extension.tabGroups.create(tabGrps);
					win.update({collapsed: true});
				}
				tabGrps = [];
				tabGrps.push(domainList[w][1]);
			}
			
		}
		if (tabGrps.length > 1){
			var win = opera.extension.tabGroups.create(tabGrps);
			win.update({collapsed: true});
		}
};

opera.extension.onmessage = function(event) {
	if (event.data == "auto"){
		autoSplitTabs();		
	}
};

function splitTabs(tablist){
	handleClick();
	var tabtosplit = new Array();
	var tabid = tablist;
	for (i = 0; i < count.length; i++){
		for (x = 0; x < tabid.length ; x++){
		  if(count[i].id ==  tabid[x]){
			  tabtosplit.push(count[i]);
			  continue;
		  }
		}
	}
	if(tabtosplit.length > 0){
		var win = opera.extension.windows.create(tabtosplit);
	}
}

function groupSelTabs(tablist){
	handleClick();
	var tabtogrp = new Array();
	var tabid = tablist;
	for (i = 0; i < count.length; i++){
		for (x = 0; x < tabid.length ; x++){
		  if(count[i].id ==  tabid[x]){
			  tabtogrp.push(count[i]);
			  continue;
		  }
		}
	}
	if(tabtogrp.length > 0){
		ungroupSelTab(tabtogrp);
		var win = opera.extension.tabGroups.create(tabtogrp, {collapsed: true}, tabtogrp[0]);
		//win.update({collapsed: true});
	}
}

function closeSelTabs(tablist){
	handleClick();
	var tabtogrp = new Array();
	var tabid = tablist;
	for (i = 0; i < count.length; i++){
		for (x = 0; x < tabid.length ; x++){
		  if(count[i].id ==  tabid[x]){
			if(count[i].locked){
				count[i].update({locked: false});
			}
			tabtogrp.push(count[i]);
			continue;
		  }
		}
	}
	if(tabtogrp.length == 1){
		tabtogrp.push(opera.extension.tabs.create());
	}
	var closegrp = opera.extension.tabGroups.create(tabtogrp);
	closegrp.close();
}

function pinSelTabs(tablist){
	handleClick();
	var tabtogrp = new Array();
	var tabid = tablist;
	for (i = 0; i < count.length; i++){
		for (x = 0; x < tabid.length ; x++){
		  if(count[i].id ==  tabid[x]){
			count[i].update({locked: true});
			continue;
		  }
		}
	}
}

function unpinSelTab(tablist){
	handleClick();
	var tabtogrp = new Array();
	var tabid = tablist;
	for (i = 0; i < count.length; i++){
		for (x = 0; x < tabid.length ; x++){
		  if(count[i].id ==  tabid[x]){
			count[i].update({locked: false});
			continue;
		  }
		}
	}
}

function ungroupTab(){
	handleClick();
	var win = opera.extension.windows.getLastFocused();
	var tabinwin = win.tabs.getAll();
	for (i = 0; i < tabinwin.length; i++){
		if (tabinwin[i].tabGroup){
			win.insert(tabinwin[i], tabinwin[i].tabGroup);
		}
	}
}

function ungroupSelTabs(tablist){
	handleClick();
	var tabtogrp = new Array();
	var tabid = tablist;
	for (i = 0; i < count.length; i++){
		for (x = 0; x < tabid.length ; x++){
		  if(count[i].id ==  tabid[x]){
			  tabtogrp.push(count[i]);
			  continue;
		  }
		}
	}
	if(tabtogrp.length > 0){
		ungroupSelTab(tabtogrp);
	}
}

function ungroupSelTab(tablist){
	handleClick();
	var tabtogrp = new Array();
	var win = opera.extension.windows.getLastFocused();
	var tabid = tablist;
	for (i = 0; i < tablist.length; i++){
		win.insert(tablist[i], tablist[i].tabGroup);
		continue;
	}
}

function unpinTab(){
	handleClick();
	var win = opera.extension.windows.getLastFocused();
	var tabinwin = win.tabs.getAll();
	for (i = 0; i < tabinwin.length; i++){
		tabinwin[i].update({locked: false});
	}
}

function privateSelTabs(tablist){
	handleClick();
	var tabtogrp = new Array();
	var tabid = tablist;
	for (i = 0; i < count.length; i++){
		for (x = 0; x < tabid.length ; x++){
		  if(count[i].id ==  tabid[x]){
			var tabProps = {
			  url: count[i].url,
			  private: true
			};
			var tab = opera.extension.tabs.create(tabProps);
			continue;
		  }
		}
	}
	closeSelTabs(tablist);
	handleClick();
}

function tabFocus(tabToFocus){
	handleClick();
	for (i = 0; i < count.length; i++){
	  if(count[i].id ==  tabToFocus){
		  count[i].focus();
		  break;
	  }
	}
}