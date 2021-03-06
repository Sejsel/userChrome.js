// ==UserScript==
// @name				Extension Options Menu.uc.js
// @description		拡張の設定ダイアログを開くボタンを追加
// @note			作成にあたりExtension Options Menu (https://addons.mozilla.org/ja/firefox/addon/extension-options-menu)とucjs_optionsmenu_0.8.uc.jsを参考にさせてもらいました
// @include				chrome://browser/content/browser.xul
// @author			hiyoko
// @version			2.9.2  ALT + 右クリックで拡張のIDなどをコピーできるようにした(コピー対象はhttps://developer.mozilla.org/en-US/docs/Addons/Add-on_Manager/Addonの"Optional properties"の項を参考に自分で弄ってください)
//				ツールチップのアップデート日時表示をやめた
//				微修正
// ==/UserScript==
var EOM = {
// -----config-----
	TOOLBAR:			"toolbar-menubar",	// Toolbar, auf der der Button erscheinen soll
	TARGET_BUTTON:		"null",			// ID eines Elementes, neben dem der Button erscheinen soll, "null" bedeutet die letzte Toolbar-Position
	SHOW_VERSION:		true,			// true = Versionsnummer,  false = Aus
	SHOW_ALL:			true,			// true = Alle Addons anzeigen,  false = Nur die mit Einstellungen	
	SHOW_userDisabled:	true,			// true = Deaktivierte Addons anzeigen,  false = Aus
	SHOW_appDisabled:	false,		    // true = Inkompatible Addons anzeigen,  false = Aus
	SHOW_RESTART:		true,			// true = Menüpunkt "Neustart" anzeigen,  false = Aus
	AUTO_RESTART:		false,			// true = Automatischer Neustart beim De -/ Aktivieren der Addons,  false = Aus
	OPEN_FOLDER:		true,			// true = Öffnen des Installationsordner im Profil,  false = Aus
	ICON_URL:			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjbQg61aAAACkUlEQVQ4T43T60tTYRwH8HMQ9QQJRSBJ50xU8BL1QpJMsbxNc162edxcYlAoZdkFh6gZurF5WV6nc7M/oBdBb7q9DSPEVBDbZtN0c5tzNymolwXht2eDhVO0Dnx4Hn6/5/me8xx4KOqQR2rcYfjpIC81BpXiqWBnxUSgpWQ0kHrY+gN1xdOdu/XTQfDGIMSGAET6AMpG/TbhiD/uv0LqTYF7cmPgN2/wQzzhh2jMB+Gwz1I65I3/Z8A1o5eRTXqP85M+pVTv260Z86JieNtcMridXNjnZvI1Lia31xV7IIgf99AKg/e1wrAN+YQHtXoPJKNbqBrewlWdG6UDLlzRupCv3sTFns3vFx47SqJCFHoPoyAb5eNb4MlGyYgb1UNuiHQulPW7UKRx4rJqE5d6HMjpdiC7066mRFpHvFTnbCHuSJ84E+rIJumQExKdEzVE5YAT5RoHCnvsyO3aQHb7Os63rSHrwRoy76+qqErNBi/ut4PYrdFsKCWDDoj77CjvXUdu+yqyWleQcsuK5GYrBE0WcE0Wm6DZmsk1W7VEI1XRu6YUqb6gUh22W9BhQ8ZtCwQ3PoEjQuM+psi5SSBNCR/Zusq7bSju+IyMpmWwjUvgrh+hcWks6scVKs0tBQ/NSG5YBKtYNHOKRRxt4WUogKufTwmh8lqXU9MaFlY42UcLJ5tnOfk8yPwov0j/LfGNUIe/huXnYrm6uTiOn2UI7GEjcxMxTrwifu7rq6KOw0o+MAT2SI8sYGtnaVJ/s68fFUCfONd2jK2e+cFWv0dY1bu+mPiTocsTmyR8kU56X//2wmtmuiMvoMkkdEkEp3K0N08XPZsKScwzdNB0zFlSz0pIaxBG6mQ0JBU/1yXmm878AbFQoHrb98HyAAAAAElFTkSuQmCC",
				//"chrome://mozapps/skin/extensions/extensionGeneric.png",
				//"chrome://mozapps/skin/extensions/extensionGeneric-16.png",
// -----config-----

	init: function() {
		if (location != "chrome://browser/content/browser.xul") return;

			var btn = document.createElement("toolbarbutton");
			btn.setAttribute("id", "eom-button");
			btn.setAttribute("type", "menu");
			btn.setAttribute("onclick", "if (event.button === 2) {event.preventDefault(); BrowserOpenAddonsMgr('addons://list/extension');}");
			btn.setAttribute("class", "toolbarbutton-1 eom-toolbarbutton-1");
			btn.style.listStyleImage = "url("+this.ICON_URL+")";
			var ToolBar = document.getElementById(this.TOOLBAR);
			var Target_btn = this.TARGET_BUTTON;
			var Target = null;
			if (Target_btn != null)
			Target = document.getElementById(Target_btn);
			ToolBar.insertBefore(btn, Target);
			var cPopup = btn.appendChild(document.createElement("menupopup"));
			cPopup.id = "eom-button-popup";
			cPopup.setAttribute("onpopupshowing", "return EOM.populateMenu(event);");
			cPopup.setAttribute("onclick", "event.preventDefault(); event.stopPropagation();");
	},

	populateMenu: function(e) {
		var menu = e.target;
		var i, j, eAddons, Item, name, version, date, date2, btncode, MenuIconURL, dir, fileOrDir, nsLocalFile, addonDir, uri, protSvc, added, MenuItems;
		var that = this;

		while (menu.childNodes.length)
			menu.removeChild(menu.firstChild);

		var Addons;
		AddonManager.getAddonsByTypes(["extension"], function(addonlist) {
			Addons = addonlist;
		});

		var thread = Cc['@mozilla.org/thread-manager;1'].getService().mainThread;
			while (Addons == void(0)) {
				thread.processNextEvent(true);
			}

		for (i = 0; i < Addons.length; i++) {
			eAddons = Addons[i];
			name = eAddons.name;
			version = eAddons.version;

			if ((!eAddons.appDisabled || (eAddons.appDisabled && that.SHOW_appDisabled)) && ((eAddons.isActive && eAddons.optionsURL) || ((eAddons.userDisabled && that.SHOW_userDisabled) || (!eAddons.userDisabled && that.SHOW_ALL) || (eAddons.appDisabled && that.SHOW_appDisabled)))) {
				Item = document.createElement("menuitem");
				Item.setAttribute("label", that.SHOW_VERSION ? name+"  "+"["+version+"]" : name);
				date = new Date(eAddons.updateDate);
				date2 = ("0"+date.getDate()).substr(-2)+"."+("0"+(date.getMonth()+1)).substr(-2)+"."+date.getFullYear();				
				Item.setAttribute("tooltiptext", "ID:                  "+eAddons.id+"\n"+"Größe:             "+Math.floor(eAddons.size/1024)+"KB"+"\n"+"Update:           "+date2+"\n"+"Beschreibung:  "+eAddons.description);
				Item.setAttribute("class", "menuitem-iconic");
				MenuIconURL = eAddons.iconURL || that.ICON_URL;
				Item.setAttribute("style", "list-style-image: url("+MenuIconURL+")");
				(function(eAddons) {Item.addEventListener("click", function(event) {
					btncode = event.button;
					switch (btncode) {
					case 0:
						// 拡張の設定画面を開く
						if (!event.ctrlKey && eAddons.optionsURL) {
							eAddons.optionsType == 2 ? window.BrowserOpenAddonsMgr('addons://detail/'+encodeURIComponent(eAddons.id)+('/preferences')) : openDialog(eAddons.optionsURL, eAddons.name, 'chrome,titlebar,toolbar,resizable,scrollbars,centerscreen,dialog=no,modal=no');
						}
						// 拡張のフォルダを開く
						else if (event.ctrlKey && that.OPEN_FOLDER) {
							dir = Services.dirsvc.get("ProfD", Ci.nsIFile);
							dir.append("extensions");
							dir.append(eAddons.id);
							fileOrDir = dir.path + (dir.exists() ? "" : ".xpi");
							nsLocalFile = Components.Constructor("@mozilla.org/file/local;1","nsILocalFile","initWithPath");
							try {
								(new nsLocalFile(fileOrDir)).reveal();
							} catch(ex) {
							addonDir = /.xpi$/.test(fileOrDir) ? dir.parent : dir;
							try {
								if (addonDir.exists())
									addonDir.launch();
							} catch(ex) {
							uri = Services.io.newFileURI(addonDir);
							protSvc = Cc["@mozilla.org/uriloader/external-protocol-service;1"].
								getService(Ci.nsIExternalProtocolService);
								protSvc.loadUrl(uri);
							}
							}
						}
					break;
					case 1:
						// 拡張のウェブページを開く
						if (eAddons.homepageURL) {
							try {
								gBrowser.addTab(eAddons.homepageURL);
							} catch(e) {
								Cc["@mozilla.org/messenger;1"].createInstance(Ci.nsIMessenger).launchExternalURL(eAddons.homepageURL);
							}
						}
					break;
					case 2:
						// 拡張の有効/無効を切り替え
						if (!event.ctrlKey && !event.altKey) {
							AddonManager.getAddonByID(eAddons.id, function(addon) {
								addon.userDisabled = !addon.userDisabled;
								if (addon.operationsRequiringRestart && that.AUTO_RESTART)
									Application.restart();
							});
						}
						// 拡張のアンインストール
						else if (event.ctrlKey && !event.altKey) {
							AddonManager.getAddonByID(eAddons.id, function(addon) {
								addon.uninstall();
							});
						}
						// いろいろコピー
						else if(!event.ctrlKey && event.altKey){
							clipboard = Cc['@mozilla.org/widget/clipboardhelper;1'].getService(Ci.nsIClipboardHelper);
								clipboard.copyString("id:  "+eAddons.id +"\n"+ "iconURL:  "+eAddons.iconURL);
						}
					break;
					}
				}, false)})(eAddons);

						if (!eAddons.optionsURL)
							Item.setAttribute("disabled", true);
						if (!eAddons.isActive)
							Item.setAttribute("EOMisDisabled", true);

				added = false;
				MenuItems = menu.childNodes.length;
				for (j = 0; j < MenuItems; j++) {
					if (name.toLowerCase() < menu.childNodes.item(j).getAttribute("label").toLowerCase()) {
						menu.insertBefore(Item, menu.childNodes.item(j));
						added=true;
						break;
					}
				}
					if (!added) menu.appendChild(Item);
			}
		}

		if (that.SHOW_RESTART) {
			menu.appendChild(document.createElement("menuseparator"));
			Item = document.createElement("menuitem");
			Item.setAttribute("label", "Neustart");
			Item.setAttribute("class", "menuitem-iconic");
			Item.addEventListener("command", function() { Application.restart() }, false); // userChromejs.restartApp()
			Item.setAttribute("style", "list-style-image: url(chrome://browser/skin/Toolbar.png); -moz-image-region: rect(0px, 324px, 18px, 306px)");
			menu.appendChild(Item);
		}
	},
};
EOM.init();