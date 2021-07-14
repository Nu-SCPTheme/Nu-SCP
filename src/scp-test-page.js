/* jshint esversion: 8 */
$(function() {
	let styleSheets = [];
	const bhlSheets = "bhl";

	//Test Relative URLs
	fetch("../src/css/black-highlighter.css").then(function(resp) {
		if (resp.status == 200) {
			styleSheets = [
				"../src/css/normalize.css",
				"../src/css/black-highlighter.css"
			];
		} else {
			styleSheets = [
				"./css/normalize.css",
				"./css/black-highlighter.css"
			];
		}
	});

	//Polyfill for DOMParser
	(function (DOMParser) {
		"use strict";

		var
			DOMParser_proto = DOMParser.prototype,
			real_parseFromString = DOMParser_proto.parseFromString;

		// Firefox/Opera/IE throw errors on unsupported types
		try {
			// WebKit returns null on unsupported types
			if ((new DOMParser).parseFromString("", "text/html")) {
				// text/html parsing is natively supported
				return;
			}
		} catch (ex) {
			// Ignore the error
		}

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
	const randomString = (length) => {
		let result = "";
		const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		const charactersLength = characters.length;
		for ( let i = 0; i < length; i++ ) {
			result += characters.charAt(Math.floor(Math.random() * 
			charactersLength));
		}
		return result;
	};

	//Function to inject stylesheets
	const changeStyleSheet = (cssFile, cssId) => {
		const cssIdSelect = "#" + cssId;
		if ($(cssIdSelect) && cssFile.length == 1) {
			$(cssIdSelect).href = cssFile;
		} else {
			for (let i = 0; i < cssFile.length; i++) {
				const link = document.createElement("link");
				link.href = cssFile[i];
				link.rel = "stylesheet";
				link.id = cssId;
				document.getElementsByTagName("head")[0].appendChild(link);
			}
		}
	};

	//Function to pull ?url= parameter
	const getUrlParameter = (sParam) => {
		var sPageURL = window.location.search.substring(1),
			sURLVariables = sPageURL.split("&"),
			sParameterName,
			i;

		for (i = 0; i < sURLVariables.length; i++) {
			sParameterName = sURLVariables[i].split("=");

			if (sParameterName[0] === sParam) {
				return typeof sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
			}
		}
		return false;
	};

	//Use codetabs.com to pull source of page & Apply to local page
	const scpwikiurl = getUrlParameter("url");
	const getNewElems = async () => {	
		$.ajax({
			url:`https://api.codetabs.com/v1/proxy/?quest=https://scp-wiki.wikidot.com/${scpwikiurl}?${randomString(5)}`,
			type:"GET",
			success: function(data){							
				const href = "href=\"https://scp-wiki.wikidot.com/";
				const src = "src=\"https://scp-wiki.wikidot.com/";
				const doc = new DOMParser().parseFromString(
					data
						.replace(/(href="\/)/g, `${href}?${randomString(5)}`)
						.replace(/(src="\/)/g, `${src}?${randomString(5)}`)
						.replace(/(http:\/\/)/g, "https://"),
					"text/html"
				);
				const newHeadContents = doc.getElementsByTagName("head")[0].innerHTML;
				const newHead = doc.getElementsByTagName("head")[0];
				const newBody = doc.getElementsByTagName("body")[0];
				const bhlMinDetect = String(newHeadContents).indexOf("black-highlighter.min.css");
				const bhlDetect = String(newHeadContents).indexOf("black-highlighter.css");
				const iframesReplace = document.getElementsByTagName("iframe");
				document.getElementsByTagName("head")[0].appendChild(newHead).after("\n");
				document.getElementsByTagName("body")[0].appendChild(newBody);					
				if (bhlDetect == -1 && bhlMinDetect == -1 ) {
					changeStyleSheet(styleSheets,bhlSheets);				
				}		
				$(iframesReplace).each(function(idx,el){
					el.src = `https://api.codetabs.com/v1/proxy/?quest=${el.src}`;
				});
			}
		});
	};

	//Reapply remotely pulled scripts & links to page to make sure they are run
	const refreshScripts = async () => {
		try {
			const scripts = document.querySelectorAll("head > head > script");
			const links = document.querySelectorAll("head > head > link");
			const bScripts = document.querySelectorAll("body > body script");
			$(links).each(function(_, el){
				const link = document.createElement("link");
				const lHref = el.getAttribute("href");
				const lRel = el.getAttribute("rel");
				const lTyp = el.getAttribute("type");
				if (lTyp) {
					link.type = lTyp;
				}
				if (lHref) {
					link.href = `${lHref}?${randomString(5)}`;
				}
				if (lRel) {
					link.rel = lRel;					
				}
				document.getElementsByTagName("head")[0].appendChild(link);
			});			
			$(scripts).each(function(_, el){
				const script = document.createElement("script");
				const pSrc = el.getAttribute("src");
				const pTyp = el.getAttribute("type");
				const pTxt = el.innerHTML;
				if (pTyp) {
					script.type = pTyp;
					if (pSrc) {
						script.src = `${pSrc}?${randomString(5)}`;
						document.getElementsByTagName("head")[0].appendChild(script);
					}
					if (pTxt) {
						script.innerHTML = pTxt;
						document.getElementsByTagName("head")[0].appendChild(script);
					}			
				}	
			});
			$(bScripts).each(function(_, el){
				const script = document.createElement("script");
				const bSrc = el.getAttribute("src");
				const bTyp = el.getAttribute("type");
				const bTxt = el.innerHTML;
				if (bTyp) {
					script.type = bTyp;
					if (bSrc) {
						script.src = `${bSrc}?${randomString(5)}`;
						document.getElementsByTagName("body")[0].appendChild(script);
					}
					if (bTxt) {
						script.innerHTML = bTxt;
						document.getElementsByTagName("body")[0].appendChild(script);
					}			
				}	
			});
		} catch(e) {
			console.log(e);
		}
	};	

	getNewElems();
	setTimeout(function(){ refreshScripts(); }, 1000);
});