/* jshint esversion: 8 */

$(function () {

	let styleSheets = [];
	let bhlSheets = "bhl";

	var bhlMinDetect;
	var bhlDetect;

	//BHL Stylesheets
	styleSheets = [
		"./css/normalize.css",
		"./css/black-highlighter.css"
	];

	//Async Wait Function
	function wait(ms) {
		return new Promise(r => setTimeout(r, ms));
	}

	//Convert branch language code to wiki name
	function getLanguageWiki(name) {
		switch (name) {
			case "int":
				return "scp-int";
			case "en":
				return "scp-wiki";
			case "ru":
				return "scp-ru";
			case "ko":
				return "scpko";
			case "cn":
				return "scp-wiki-cn";
			case "fr":
				return "fondationscp";
			case "pl":
				return "scp-pl";
			case "es":
				return "lafundacionscp";
			case "th":
				return "scp-th";
			case "jp":
				return "scp-jp";
			case "de":
				return "scp-wiki-de";
			case "it":
				return "fondazionescp";
			case "ua":
				return "scp-ukrainian";
			case "pt":
				return "scp-pt-br";
			case "zh-tr":
				return "scp-zh-tr";
			default:
				return null;
		}
	}

	//Polyfill for DOMParser
	(function (DOMParser) {
		"use strict";

		var DOMParser_proto = DOMParser.prototype,
			real_parseFromString = DOMParser_proto.parseFromString;

		// Firefox/Opera/IE throw errors on unsupported types
		try {
			// WebKit returns null on unsupported types
			if ((new DOMParser).parseFromString("", "text/html")) {
				// text/html parsing is natively supported
				return;
			}
		} catch (ex) {}

		DOMParser_proto.parseFromString = function (markup, type) {
			if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
				var
					doc = document.implementation.createHTMLDocument("");
				if (markup.toLowerCase().indexOf("<!doctype") > -1) {
					doc.documentElement.innerHTML = markup;
				} else {
					doc.body.innerHTML = markup;
				}
				return doc;
			} else {
				return real_parseFromString.apply(this, arguments);
			}
		};
	}(DOMParser));

	//Create Random String for forced Cache Refresh
	let randomString = (length) => {
		let result = '';
		let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		let charactersLength = characters.length;
		for (let i = 0; i < length; i++) {
			result += characters.charAt(Math.floor(Math.random() *
				charactersLength));
		}
		return result;
	}

	//Function to inject stylesheets
	let changeStyleSheet = async (cssFile, cssId) => {
		let cssIdSelect = "#" + cssId;
		if ($(cssIdSelect) && cssFile.length == 1) {
			$(cssIdSelect).href = cssFile;
		} else {
			for (let i = 0; i < cssFile.length; i++) {
				let link = document.createElement("link");
				link.href = cssFile[i];
				link.rel = "stylesheet";
				link.id = cssId;
				document.getElementsByTagName("head")[0].appendChild(link);
			}
		}
	};

	//Extract parameters into a map
	let urlParams;
	if (URLSearchParams !== undefined) {
		let urlSearchParams = new URLSearchParams(window.location.search);
		urlParams = Object.fromEntries(urlSearchParams.entries());
	} else {
		urlParams = {};
		let urlSearchParts = window.location.search.split("&");
		for (let i = 0; i < urlSearchParts.length; i++) {
			let urlParameter = urlSearchParts[i].split("=");
			let urlParameterName = urlParameter[0];
			let urlParameterValue = urlParameter[1];

			urlParams[urlParameterName] = decodeURIComponent(urlParameterValue);
		}
	}

	//Get parameters
	let page = urlParams.url || "scp-001";
	let siteName = urlParams.site || "en";

	//Get wiki slug
	let siteURL = getLanguageWiki(siteName);
	if (siteURL === null) {
		//Fallback, use the parameter as the actual wiki slug
		siteURL = siteName;
	}

	//Use codetabs.com to pull source of page & Apply to local page
	let getNewElems = async () => {
		$.ajax({
			url: `https://api.codetabs.com/v1/proxy/?quest=https://${siteURL}.wikidot.com/${page}?${randomString(5)}`,
			type: 'GET',
			success: function (data) {
				let href = `href=\"https://${siteURL}.wikidot.com/`;
				let src = `src=\"https://${siteURL}.wikidot.com/`;
				let dp = new DOMParser();
				let doc = dp.parseFromString(data
					.replace(/(href="\/)/g, href)
					.replace(/(src="\/)/g, src)
					.replace(/(http:\/\/)/g, "https://"),
					"text/html");
				let newHeadContents = doc.getElementsByTagName("head")[0].innerHTML;
				let newHead = doc.getElementsByTagName("head")[0];
				let newBody = doc.getElementsByTagName("body")[0];
				bhlMinDetect = String(newHeadContents).indexOf("black-highlighter.min.css");
				bhlDetect = String(newHeadContents).indexOf("black-highlighter.css");
				let iframesReplace = document.getElementsByTagName("iframe");
				document.getElementsByTagName("head")[0].appendChild(newHead).after("\n");
				document.getElementsByTagName("body")[0].appendChild(newBody);

				$(iframesReplace).each(function (idx, el) {
					el.src = `https://api.codetabs.com/v1/proxy/?quest=${el.src}`
				});
				return bhlMinDetect, bhlDetect;
			}
		});
	};

	//Reapply remotely pulled scripts & links to page to make sure they are run
	let refreshScripts = async () => {
		try {
			let scripts = document.querySelectorAll("head > head > script");
			let links = document.querySelectorAll("head > head > link");
			let bScripts = document.querySelectorAll("body > body script");
			let lTime = 500;
			let sTime = 500;
			let bTime = 2000;
			$(links).each(function (idx, el) {
				setTimeout(function () {
					let link = document.createElement("link");
					let lHref = links[idx].getAttribute("href");
					let lRel = links[idx].getAttribute("rel");
					let lTyp = links[idx].getAttribute("type");
					if (lTyp) {
						link.type = lTyp;
					}
					if (lHref) {
						link.href = `${lHref}?${randomString(5)}`;
					}
					if (lRel) {
						link.rel = lRel;
					}
					document.getElementsByTagName("head")[0].prepend(link);
				}, lTime)
				lTime += 500;
			});
			$(scripts).each(function (idx, el) {
				setTimeout(function () {
					let script = document.createElement("script");
					let pSrc = scripts[idx].getAttribute("src");
					let pTyp = scripts[idx].getAttribute("type");
					let pTxt = scripts[idx].innerHTML;
					if (pTyp) {
						script.type = pTyp;
						if (pSrc) {
							script.src = `${pSrc}?${randomString(5)}`;
							document.getElementsByTagName("head")[0].prepend(script);
						}
						if (pTxt) {
							script.innerHTML = pTxt;
							document.getElementsByTagName("head")[0].prepend(script);
						}
					}
				}, sTime)
				sTime += 500;
			});
			$(bScripts).each(function (idx, el) {
				setTimeout(function () {
					let script = document.createElement("script");
					let bSrc = bScripts[idx].getAttribute("src");
					let bTyp = bScripts[idx].getAttribute("type");
					let bTxt = bScripts[idx].innerHTML;
					if (bTyp) {
						script.type = bTyp;
						if (bSrc) {
							script.src = `${bSrc}?${randomString(5)}`;
							document.getElementsByTagName("body")[0].prepend(script);
						}
						if (bTxt) {
							script.innerHTML = bTxt;
							document.getElementsByTagName("body")[0].prepend(script);
						}
					}
				}, bTime)
				bTime += 500;
			});
		} catch (e) {
			console.log(e);
		}
	};

	let finalInit = async () => {
		await getNewElems();
		await wait(1000);
		await refreshScripts().then(() => {
			if (bhlDetect == -1 && bhlMinDetect == -1 ) {
				changeStyleSheet(styleSheets,bhlSheets);
			}
		});
	};

	finalInit();
});
