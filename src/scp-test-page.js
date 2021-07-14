/* jshint esversion: 8 */
$(function() {
	let styleSheets = [];
	let bhlSheets = "bhl";

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
	let randomString = (length) => {
		let result = "";
		let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		let charactersLength = characters.length;
		for ( let i = 0; i < length; i++ ) {
			result += characters.charAt(Math.floor(Math.random() * 
			charactersLength));
		}
		return result;
	};

	//Function to inject stylesheets
	let changeStyleSheet = (cssFile, cssId) => {
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

	//Function to pull ?url= parameter
	let getUrlParameter = (sParam) => {
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
	let scpwikiurl = getUrlParameter("url");
	let getNewElems = async () => {	
		$.ajax({
			url:`https://api.codetabs.com/v1/proxy/?quest=https://scp-wiki.wikidot.com/${scpwikiurl}?${randomString(5)}`,
			type:"GET",
			success: function(data){							
				let href = "href=\"https://scp-wiki.wikidot.com/";
				let src = "src=\"https://scp-wiki.wikidot.com/";
				let dp = new DOMParser();
				let doc = dp.parseFromString(data
					.replace(/(href="\/)/g, `${href}?${randomString(5)}`)
					.replace(/(src="\/)/g, `${src}?${randomString(5)}`)
					.replace(/(http:\/\/)/g, "https://"), 
					"text/html");			
				let newHeadContents = doc.getElementsByTagName("head")[0].innerHTML;
				let newHead = doc.getElementsByTagName("head")[0];
				let newBody = doc.getElementsByTagName("body")[0];
				let bhlMinDetect = String(newHeadContents).indexOf("black-highlighter.min.css");
				let bhlDetect = String(newHeadContents).indexOf("black-highlighter.css");
				let iframesReplace = document.getElementsByTagName("iframe");
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
	let refreshScripts = async () => {
		try {
			let scripts = document.querySelectorAll("head > head > script");
			let links = document.querySelectorAll("head > head > link");
			let bScripts = document.querySelectorAll("body > body script");
			let lTime = 500;
			let sTime = 500;
			let bTime = 2000;
			$(links).each(function(_, el){
				setTimeout( function(){
					let link = document.createElement("link");
					let lHref = el.getAttribute("href");
					let lRel = el.getAttribute("rel");
					let lTyp = el.getAttribute("type");
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
				}, lTime);
				lTime += 500;
			});			
			$(scripts).each(function(_, el){
				setTimeout( function(){
					let script = document.createElement("script");
					let pSrc = el.getAttribute("src");
					let pTyp = el.getAttribute("type");
					let pTxt = el.innerHTML;
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
				}, sTime);
				sTime += 500;		
			});
			$(bScripts).each(function(_, el){
				setTimeout( function(){
					let script = document.createElement("script");
					let bSrc = el.getAttribute("src");
					let bTyp = el.getAttribute("type");
					let bTxt = el.innerHTML;
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
				}, bTime);
				bTime += 500;		
			});
		} catch(e) {
			console.log(e);
		}
	};	

	getNewElems();
	setTimeout(function(){ refreshScripts(); }, 1000);
});