/**************************************************************************************************/
/*  Create Date: 2006-01-26                                                                       */
/*  Last Change: 2008-06-13                                                                       */
/*  Author:      Sebastian Zartner                                                                */
/*  Version:     1.1.5.5                                                                          */
/**************************************************************************************************/



// Create RExT class, if it doesn't exist yet
if(!RExT)
  var RExT = {};



RExT.preferencesObserver = {
  oPreferences: Components.classes['@mozilla.org/preferences-service;1']
                          .getService(Components.interfaces.nsIPrefService)
                          .getBranch('extensions.rext.'),

  register: function() {
    this.oPreferences.QueryInterface(Components.interfaces.nsIPrefBranch2);
    this.oPreferences.addObserver('',this,false);
  },

  unregister: function() {
    if(!this.oPreferences)
      return;
    this.oPreferences.removeObserver('',this);
  },

  observe: function(oSubject,oTopic,sData) {
    if(oTopic != 'nsPref:changed')
      return;

    // alert(sData);

    switch(sData) {
      case 'highlightBackgroundColor':
      case 'highlightTextColor':
      case 'displayLineBreaks':
      case 'displaySpaces':
      case 'displayTabs':
      case 'highlightSpecialChars':
      case 'specialCharsBackgroundColor':
        RExT.main.test();
        break;

      case 'updateWhileWriting':
        var oUpdateWhileWriting = document.getElementById('updateWhileWriting');
        oUpdateWhileWriting.checked = this.oPreferences.getBoolPref(sData);
        RExT.main.toggleUpdateWhileWriting();
        break;

      case 'autoCloseBrackets':
        var oRegExp = document.getElementById('regExp');
        if(this.oPreferences.getBoolPref(sData))
          oRegExp.addEventListener('keyup',RExT.main.closeBrackets,false);
        else
          oRegExp.removeEventListener('keyup',RExT.main.closeBrackets,false);
        break;

      default:
        // DO NOTHING
    }
  }
};



RExT.savedRegExpsObserver = {
  // Triggers on assertion to the RDF data source
  onAssert:           function(oDataSource,oSource,oPredicate,oTarget) {
    if(!document)
      return;

    var oSavedRegExps = document.getElementById('savedRegExps');

    oSavedRegExps.disabled = false;
    for(var i=0; i<oSavedRegExps.childNodes.length; i++)
      oSavedRegExps.childNodes[i].addEventListener('command',RExT.main.insertSavedRegExp,false);
  },

  // Triggers on unassertion of the RDF data source
  onUnassert:         function(oDataSource,oSource,oPredicate,oTarget) {
    if(typeof(Components) == 'undefined')
      return;

    var oRDFService               = Components.classes["@mozilla.org/rdf/rdf-service;1"]
                                              .getService(Components.interfaces.nsIRDFService);
    var oRDFSavedRegExpsContainer = Components.classes['@mozilla.org/rdf/container;1'].getService()
                                              .QueryInterface(Components.interfaces.nsIRDFContainer);
    var oRDFContainerUtils        = Components.classes["@mozilla.org/rdf/container-utils;1"]
                                              .getService(Components.interfaces.nsIRDFContainerUtils);
    var oRDFSavedRegExps          = oRDFService.GetResource('http://sebastianzartner.de/savedRegExps#');
    var bSavedRegExpsExist        = false;

    oRDFSavedRegExpsContainer.Init(oDataSource,oRDFSavedRegExps);

    bSavedRegExpsExist       = oRDFSavedRegExpsContainer.GetElements().hasMoreElements();
    document.getElementById('savedRegExps').disabled = !bSavedRegExpsExist;
  },
  onChange:           function(oDataSource,oSource,oPredicate,oOldTarget,oNewTarget) {},
  onMove:             function(oDataSource,oOldSource,oNewSource,oPredicate,oTarget) {},
  onBeginUpdateBatch: function(oDataSource) {},
  onEndUpdateBatch:   function(oDataSource) {}
};



RExT.main = {
  oPreferences:    Components.classes['@mozilla.org/preferences-service;1']
                             .getService(Components.interfaces.nsIPrefService)
                             .getBranch('extensions.rext.'),
  sErrorMsg:       '',
  sRegExp:         '',
  iSelectionStart: 0,
  bReplace:        false,
  sReplacement:    '',
  bCaseSensitive:  false,
  bGlobal:         false,
  bMultiline:      false,
  sSearchText:     '',
  aResults:        new Array(),
  iDuration:       0,



  // Initialises the main dialog
  init: function() {
    RExT.savedRegExps.init();

    var oRegExp                = document.getElementById('regExp');
    var oSaveRegExp            = document.getElementById('saveRegExp');
    var oCaseSensitive         = document.getElementById('caseSensitive');
    var oGlobal                = document.getElementById('global');
    var oMultiline             = document.getElementById('multiline');
    var oReplace               = document.getElementById('replace');
    var oReplacement           = document.getElementById('replacement');
    var oSearchText            = document.getElementById('searchText');
    var oSavedRegExps          = document.getElementById('savedRegExps');
    var oUpdateWhileWriting    = document.getElementById('updateWhileWriting');
    var oTest                  = document.getElementById('test');
    var oCopyRegExpToClipboard = document.getElementById('copyRegExpToClipboard');
    var oClose                 = document.getElementById('close');
    var bUpdateWhileWriting    = RExT.main.oPreferences.getBoolPref('updateWhileWriting');
    var bAutoCloseBrackets     = RExT.main.oPreferences.getBoolPref('autoCloseBrackets');

    RExT.main.initTooltips();

    oGlobal.checked                 = true;
    oMultiline.checked              = true;
    oSaveRegExp.disabled            = true;
    oReplacement.disabled           = true;
    oCopyRegExpToClipboard.disabled = true;
    oTest.disabled                  = true;

    RExT.main.setGlobal(oGlobal.checked);
    RExT.main.setMultiline(oMultiline.checked);
    oSavedRegExps.datasources = RExT.savedRegExps.getSavedRegExpsFilePathURL();

    oRegExp.addEventListener('keydown',function(oEvent) { RExT.main.filterKeys(oEvent); },true);
    oRegExp.addEventListener('keyup',function(oEvent) { RExT.main.filterKeys(oEvent); },true);
    oRegExp.addEventListener('keyup',function() { RExT.main.setRegExp(oRegExp.value); },false);
    oRegExp.addEventListener('keyup',RExT.main.toggleCopyRegExpToClipboardActivation,false);
    oRegExp.addEventListener('keyup',RExT.main.toggleSaveRegExpActivation,false);
    oCaseSensitive.addEventListener('click',function() { RExT.main.setCaseSensitive(oCaseSensitive.checked); },false);
    oGlobal.addEventListener('click',function(){ RExT.main.setGlobal(oGlobal.checked); },false);
    oMultiline.addEventListener('click',function() { RExT.main.setMultiline(oMultiline.checked); },false);
    oReplace.addEventListener('click',function() { RExT.main.setReplace(oReplace.checked); },false);
    oReplace.addEventListener('click',RExT.main.toggleReplacementActivation,false);
    oReplacement.addEventListener('keyup',function() { RExT.main.setReplacement(oReplacement.value); },false);
    oSearchText.addEventListener('keyup',function() { RExT.main.setSearchText(oSearchText.value); },false);

    if(bUpdateWhileWriting) {
      oRegExp.addEventListener('keyup',RExT.main.test,false);
      oCaseSensitive.addEventListener('click',RExT.main.test,false);
      oGlobal.addEventListener('click',RExT.main.test,false);
      oMultiline.addEventListener('click',RExT.main.test,false);
      oReplace.addEventListener('click',RExT.main.test,false);
      oReplacement.addEventListener('keyup',RExT.main.test,false);
      oSearchText.addEventListener('keyup',RExT.main.test,false);
      oUpdateWhileWriting.checked = true;
    } else
      oRegExp.addEventListener('keyup',RExT.main.toggleTestActivation,false);

    if(bAutoCloseBrackets)
      oRegExp.addEventListener('keyup',RExT.main.closeBrackets,false);

    if(RExT.savedRegExps.getSavedRegExps().length > 0) {
      for(var i=0; i < oSavedRegExps.childNodes.length; i++)
        oSavedRegExps.childNodes[i].addEventListener('command',RExT.main.insertSavedRegExp,false);
    } else
      oSavedRegExps.disabled = true;
    oUpdateWhileWriting.addEventListener('click',RExT.main.toggleUpdateWhileWriting,false);
    oClose.addEventListener('click',function() { close(); },false);

    RExT.preferencesObserver.register();
    RExT.savedRegExps.oDataSource.AddObserver(RExT.savedRegExpsObserver);

    RExT.main.test();

    oRegExp.focus();
  },



  // Closing the main dialog
  close: function() {
    RExT.preferencesObserver.unregister();
  },



  // Initialises the tooltips
  initTooltips: function() {
    var aTooltips = [document.getElementById('tooltipCaseSensitive'),
                     document.getElementById('tooltipGlobal'),
                     document.getElementById('tooltipMultiline'),
                     document.getElementById('tooltipReplacement')];

    for(var iTooltipIndex=0; iTooltipIndex<aTooltips.length; iTooltipIndex++) {
      var oComputedStyle = getComputedStyle(aTooltips[iTooltipIndex],null);
      var iTotalHeight   = aTooltips[iTooltipIndex].firstChild.boxObject.height;

      iTotalHeight += parseFloat(oComputedStyle.getPropertyValue("border-top-width"))
                    + parseFloat(oComputedStyle.getPropertyValue("border-bottom-width"))
                    + parseFloat(oComputedStyle.getPropertyValue("padding-top"))
                    + parseFloat(oComputedStyle.getPropertyValue("padding-bottom"));
      aTooltips[iTooltipIndex].minHeight = iTotalHeight; 
    }
  },



  // Toggles the activation of the save button
  toggleSaveRegExpActivation: function() {
    var oSaveRegExp = document.getElementById('saveRegExp');

    oSaveRegExp.disabled = (RExT.main.sRegExp.length == 0);
    if(RExT.main.sRegExp.length > 0)
      oSaveRegExp.addEventListener('click',RExT.main.saveRegExp,false);
    else
      oSaveRegExp.removeEventListener('click',RExT.main.saveRegExp,false);
  },



  // Toggles the activation of the replacement text box
  toggleReplacementActivation: function() {
    document.getElementById('replacement').disabled = !document.getElementById('replace').checked;
  },



  // Toggles the activation of the test button
  toggleTestActivation: function() {
    var oTest = document.getElementById('test');

    oTest.disabled = (RExT.main.sRegExp.length == 0);
    if(RExT.main.sRegExp.length > 0)
      oTest.addEventListener('click',RExT.main.test,false);
    else
      oTest.removeEventListener('click',RExT.main.test,false);
  },



  // Toggles the activation of the copy button
  toggleCopyRegExpToClipboardActivation: function() {
    var oCopyRegExpToClipboard = document.getElementById('copyRegExpToClipboard');

    oCopyRegExpToClipboard.disabled = (RExT.main.sRegExp.length == 0);
    if(RExT.main.sRegExp.length > 0)
      oCopyRegExpToClipboard.addEventListener('click',RExT.main.copyRegExpToClipboard,false);
    else
      oCopyRegExpToClipboard.removeEventListener('click',RExT.main.copyRegExpToClipboard,false);
  },



  // Toggles the update while writing option
  toggleUpdateWhileWriting: function() {
    var bUpdateWhileWriting = document.getElementById('updateWhileWriting').checked;
    var oRegExp             = document.getElementById('regExp');
    var oSaveRegExp         = document.getElementById('saveRegExp');
    var oCaseSensitive      = document.getElementById('caseSensitive');
    var oGlobal             = document.getElementById('global');
    var oMultiline          = document.getElementById('multiline');
    var oReplace            = document.getElementById('replace');
    var oReplacement        = document.getElementById('replacement');
    var oSearchText         = document.getElementById('searchText');
    var oTest               = document.getElementById('test');

    RExT.main.oPreferences.setBoolPref('updateWhileWriting',bUpdateWhileWriting);

    RExT.main.toggleTestActivation();
    if(bUpdateWhileWriting) {
      oRegExp.addEventListener('keyup',RExT.main.test,false);
      oCaseSensitive.addEventListener('click',RExT.main.test,false);
      oGlobal.addEventListener('click',RExT.main.test,false);
      oMultiline.addEventListener('click',RExT.main.test,false);
      oReplace.addEventListener('click',RExT.main.test,false);
      oReplacement.addEventListener('keyup',RExT.main.test,false);
      oSearchText.addEventListener('keyup',RExT.main.test,false);
      oRegExp.removeEventListener('keyup',RExT.main.toggleTestActivation,false);
      RExT.main.test();
    } else {
      oRegExp.removeEventListener('keyup',RExT.main.test,false);
      oCaseSensitive.removeEventListener('click',RExT.main.test,false);
      oGlobal.removeEventListener('click',RExT.main.test,false);
      oMultiline.removeEventListener('click',RExT.main.test,false);
      oReplace.removeEventListener('click',RExT.main.test,false);
      oReplacement.removeEventListener('keyup',RExT.main.test,false);
      oSearchText.removeEventListener('keyup',RExT.main.test,false);
      oRegExp.addEventListener('keyup',RExT.main.toggleTestActivation,false);
    }

    oTest.disabled = bUpdateWhileWriting;
  },



  // Sets the regular expression
  setRegExp: function(sRegExp) {
    RExT.main.sRegExp = (sRegExp ? sRegExp : '');
  },



  // Sets the replace option
  setReplace: function(bReplace) {
    RExT.main.bReplace = bReplace;
  },



  // Sets the replacement
  setReplacement: function(sReplacement) {
    RExT.main.sReplacement = sReplacement;
  },



  // Sets the case sensitivity
  setCaseSensitive: function(bCaseSensitive) {
    RExT.main.bCaseSensitive = bCaseSensitive;
  },



  // Sets the global flag
  setGlobal: function(bGlobal) {
    RExT.main.bGlobal = bGlobal;
  },



  // Sets the multiline flag
  setMultiline: function(bMultiline) {
    RExT.main.bMultiline = bMultiline;
  },



  // Sets the search text
  setSearchText: function(sSearchText) {
    RExT.main.sSearchText = sSearchText;
  },



  // Sets the results array
  setResults: function(aResults) {
    RExT.main.aResults = aResults;
  },



  // Sets the duration
  setDuration: function(iDuration) {
    RExT.main.iDuration = iDuration;
  },



  // Filters the pressed keys on the keyboard to avoid unnecessary testing
  filterKeys: function(oEvent) {
    switch(oEvent.keyCode) {
      case 13:  // Carriage return
        var bUpdateWhileWriting = RExT.main.oPreferences.getBoolPref('updateWhileWriting');
        oEvent.preventDefault();
        if(!bUpdateWhileWriting)
          RExT.main.test();
      case 16:  // Shift
      case 17:  // Ctrl
      case 18:  // Alt
      case 19:  // Pause/Break
      case 20:  // Caps lock
      case 27:  // Escape
      case 33:  // Page up
      case 34:  // Page down
      case 35:  // End
      case 36:  // Home
      case 37:  // Arrow left
      case 38:  // Arrow up
      case 39:  // Arrow right
      case 40:  // Arrow down
      case 112: // F1
      case 113: // F2
      case 114: // F3
      case 115: // F4
      case 116: // F5
      case 117: // F6
      case 118: // F7
      case 119: // F8
      case 120: // F9
      case 121: // F10
      case 122: // F11
      case 123: // F12
      case 144: // Num lock
      case 145: // Scroll lock
        oEvent.stopPropagation();
        break;

      default:
        // DO NOTHING
    }
  },



  // Closes the brackets when an opening bracket is written
  closeBrackets: function() {
    var oRegExp          = document.getElementById('regExp');
    var sRegExp          = RExT.main.sRegExp;
    var iCursorPos       = oRegExp.selectionStart;
    var sLeadingPart     = sRegExp.substring(0,iCursorPos);
    var sRearPart        = sRegExp.substring(iCursorPos,sRegExp.length);
    var sCharacter       = sLeadingPart.charAt(sLeadingPart.length-1);
    var sOpeningBracket  = '';
    var sClosingBracket  = '';
    var iBracketsBalance = 0;

    switch(sCharacter) {
      case '(':
        sOpeningBracket = '(';
        sClosingBracket = ')';
        break;

      case '[':
        sOpeningBracket = '[';
        sClosingBracket = ']';
        break;

      case '{':
        sOpeningBracket = '{';
        sClosingBracket = '}';
        break;

      default:
        return false; // Character isn't a bracket
    }

    for(var i=0; i<sRegExp.length;i++) {
      if(sRegExp.charAt(i) == sOpeningBracket)
        iBracketsBalance++;
      else if(sRegExp.charAt(i) == sClosingBracket)
        iBracketsBalance--;
    }

    oRegExp.value = sLeadingPart+(iBracketsBalance > 0 ? sClosingBracket : '')+sRearPart;

    oRegExp.selectionStart = oRegExp.selectionEnd = iCursorPos;

    return true;
  },



  // Tests the regular expression
  test: function() {
    RExT.main.displaySearchResult(RExT.main.matchRegExp());
    RExT.main.updateStatusBar();
  },



  // Adds the flags to the regular expression before testing it
  prepareRegExp: function(sRegExp) {
    var sPreparedRegExp = '/'+sRegExp+'/';

    if(!RExT.main.bCaseSensitive)
      sPreparedRegExp += 'i';

    if(RExT.main.bGlobal)
      sPreparedRegExp += 'g';

    if(RExT.main.bMultiline)
      sPreparedRegExp += 'm';

    return sPreparedRegExp;
  },



  // Matches the regular expression to the search text and returns the results
  matchRegExp: function() {
    var oSlashRegExp = /[^\\]\//;
    var oRegExp      = null;
    var bValidRegExp = true;
    var oResult      = null;
    var sMatches     = '';
    var aResults     = new Array();

    RExT.main.sError = '';
    if(RExT.main.sRegExp != '') {
      // Find unescaped slashes
      if(oSlashRegExp.exec(RExT.main.sRegExp))
        RExT.main.sError = RExT.getLocaleString('noRegExp');
      else {
        try {
          oRegExp = eval(RExT.main.prepareRegExp(RExT.main.sRegExp));
        } catch(oError) { RExT.main.sError = RExT.getLocaleString('noRegExp'); }
      }
    }

    if(oRegExp != null) {
      var iResultIndex = 0;

      // Save start time for time measurement
      iStartTime = new Date().getTime();

      // Search for regular expression
      while((oResult = oRegExp.exec(RExT.main.sSearchText)) != null) {
        if(oResult[0] == '')
          break;

        var aResult = new Array(new Array(oResult.index,oResult[0].length));
        var iOffset = 0;
        for(var i=1; oResult[i]; i++) {
          iOffset = oResult[0].indexOf(oResult[i],iOffset);
          aResult.push(new Array(oResult.index+iOffset,oResult[i].length));
        }
        aResults.push(aResult);

        if(oRegExp.lastIndex == 0)
          break;

        iResultIndex++;
      }

      // Save end time for time measurement
      iEndTime = new Date().getTime();

      RExT.main.setDuration(iEndTime-iStartTime);
    }

    RExT.main.setResults(aResults);

    return aResults;
  },



  // Displays the search result
  displaySearchResult: function(aResults) {
    var aDisplayResults      = aResults;
    var oResults             = document.getElementById('results').contentDocument;
    var oResultsContainer    = oResults.getElementsByTagName('p')[0];
    var oParagraph           = null;
    var iStartIndex          = 0;
    var iLength              = 0;
    var sText                = '';
    var sHighlightStyle      = 'background-color:'+RExT.main.oPreferences.getCharPref('highlightBackgroundColor')+';'+
                               'color:'+RExT.main.oPreferences.getCharPref('highlightTextColor')+';';
    var sReplacement         = '';
    var oNewResultsContainer = oResults.createElement(oResultsContainer.nodeName);
    var oAttributeNode       = null;

    // Add all attributes of the old results container to the new one
    for(var iAttributeIndex=0; iAttributeIndex<oResultsContainer.attributes.length; iAttributeIndex++) {
      oAttributeNode = oResultsContainer.attributes[iAttributeIndex];

      oNewResultsContainer.setAttribute(oAttributeNode.nodeName,oAttributeNode.nodeValue);
    }

    if(RExT.main.sError != '') {
      oNewResultsContainer.className = 'error';
      oNewResultsContainer.appendChild(oResults.createTextNode(RExT.main.sError));
      oResultsContainer.parentNode.replaceChild(oNewResultsContainer,oResultsContainer);
    } else
      oNewResultsContainer.className = 'normal';

    if(RExT.main.sError == '') {
      if(aDisplayResults.length > 0) {
        // Add first text element to results
        iStartIndex = 0;
        iLength     = aDisplayResults[0][0][0];
        sText       = RExT.main.sSearchText.substr(iStartIndex,iLength);
        oNewResultsContainer.appendChild(oResults.createTextNode(sText));

        for(var i=0; i<aDisplayResults.length; i++) {
          // Create highlighted element
          iStartIndex = aDisplayResults[i][0][0];
          iLength     = aDisplayResults[i][0][1];

          sText       = (RExT.main.bReplace ? RExT.main.getReplacementText(RExT.main.sReplacement,aDisplayResults[i]) : RExT.main.sSearchText.substr(iStartIndex,iLength));

          oRegExpHighlight     = oResults.createElement('span');
          oRegExpHighlight.setAttribute('style',sHighlightStyle);
          oRegExpHighlight.appendChild(oResults.createTextNode(sText));

          // Add highlighted element to results
          oNewResultsContainer.appendChild(oRegExpHighlight);

          // Add text element to results
          if(aDisplayResults[i+1]) {
            iStartIndex = aDisplayResults[i][0][0]+aDisplayResults[i][0][1];
            iLength     = aDisplayResults[i+1][0][0]-(aDisplayResults[i][0][0]+aDisplayResults[i][0][1]);
            sText       = RExT.main.sSearchText.substr(iStartIndex,iLength);
            oNewResultsContainer.appendChild(oResults.createTextNode(sText));
          }
        }

        // Add last text element to results
        iStartIndex = aDisplayResults[aDisplayResults.length-1][0][0]+aDisplayResults[aDisplayResults.length-1][0][1];
        iLength     = RExT.main.sSearchText.length-(aDisplayResults[aDisplayResults.length-1][0][0]+aDisplayResults[aDisplayResults.length-1][0][1]);
        sText       = RExT.main.sSearchText.substr(iStartIndex,iLength);
        oNewResultsContainer.appendChild(oResults.createTextNode(sText));
      } else
        oNewResultsContainer.appendChild(oResults.createTextNode(RExT.main.sSearchText));

      oNewResultsContainer = RExT.main.replaceSpecialChars(oNewResultsContainer);
      oNewResultsContainer = RExT.main.nlToBr(oNewResultsContainer);
      oResultsContainer.parentNode.replaceChild(oNewResultsContainer,oResultsContainer);
    }

    return;
  },




  // Duplicates an HTML element inside the result document
  duplicateElement: function(oElement,iDepth) {
    var oResults    = document.getElementById('results').contentDocument;
    var oNewElement = oResults.createElement(oElement.nodeName);

    // Add all attributes of the current element to the new one
    for(var iAttributeIndex=0; iAttributeIndex<oElement.attributes.length; iAttributeIndex++) {
      oAttributeNode = oElement.attributes[iAttributeIndex];

      oNewElement.setAttribute(oAttributeNode.nodeName,oAttributeNode.nodeValue);
    }

    for(var iChildIndex=0; iChildIndex<oElement.childNodes.length; iChildIndex++) {
      switch(oElement.childNodes[iChildIndex].nodeType) {
        case Node.ELEMENT_NODE:
          oNewElement.appendChild(duplicateElement(oElement.childNodes[iChildIndex]));
          break;

        case Node.TEXT_NODE:
          var oNewElementText = oResults.createTextNode(oElement.childNodes[iChildIndex].nodeValue);
          oNewElement.appendChild(oNewElementText);
          break;

        default:
          oNewElement.appendChild(oElement.childNodes[iChildIndex]);
      }
    }

    return oNewElement;
  },



  // Returns the special characters
  getSpecialChars: function() {
    var bDisplayLineBreaks = RExT.main.oPreferences.getBoolPref('displayLineBreaks');
    var bDisplaySpaces     = RExT.main.oPreferences.getBoolPref('displaySpaces');
    var bDisplayTabs       = RExT.main.oPreferences.getBoolPref('displayTabs');
    var aSpecialChars      = new Array();

    if(bDisplayLineBreaks)
      aSpecialChars.push({ sChar:'\\n', sReplacement:'\u00b6\n' });
    if(bDisplaySpaces)
      aSpecialChars.push({ sChar:' ', sReplacement:'\u00b7' });
    if(bDisplayTabs)
      aSpecialChars.push({ sChar:'\\t', sReplacement:'\u2192' });

    return aSpecialChars;
  },



  // Replaces special characters by displayable characters
  replaceSpecialChars: function(oElement, bWithoutHighlighting) {
    var bHighlightSpecialChars = RExT.main.oPreferences.getBoolPref('highlightSpecialChars') && !bWithoutHighlighting;
    var oResults               = document.getElementById('results').contentDocument;
    var oNewElement            = oResults.createElement(oElement.nodeName);
    var aSpecialChars          = RExT.main.getSpecialChars();
    var sSpecialCharsRegExp    = '';
    var oSpecialCharRegExp     = null;

    if(aSpecialChars.length == 0)
      return oElement;

    for(var iSpecialCharIndex=0; iSpecialCharIndex<aSpecialChars.length; iSpecialCharIndex++) {
      sSpecialCharsRegExp += aSpecialChars[iSpecialCharIndex].sChar;
      if(iSpecialCharIndex < aSpecialChars.length-1)
        sSpecialCharsRegExp += '|';
    }
    oSpecialCharRegExp = eval('/'+sSpecialCharsRegExp+'/g');

    for(var iAttributeIndex=0; iAttributeIndex<oElement.attributes.length; iAttributeIndex++) {
      oAttributeNode = oElement.attributes[iAttributeIndex];

      oNewElement.setAttribute(oAttributeNode.nodeName,oAttributeNode.nodeValue);
    }

    for(var iChildIndex=0; iChildIndex<oElement.childNodes.length; iChildIndex++) {
      switch(oElement.childNodes[iChildIndex].nodeType) {
        case Node.ELEMENT_NODE:
          oNewElement.appendChild(RExT.main.replaceSpecialChars(oElement.childNodes[iChildIndex],true));
          break;

        case Node.TEXT_NODE:
          var oSpecialRegExpResults = null;
          var sNodeText             = oElement.childNodes[iChildIndex].nodeValue;
          var iStartPosition        = 0;

          if(bHighlightSpecialChars) {
            while((oSpecialCharRegExpResults = oSpecialCharRegExp.exec(sNodeText)) != null) {
              var sReplacement      = '';
              var oNewElementText   = oResults.createTextNode(sNodeText.substring(iStartPosition,oSpecialCharRegExpResults.index));

              // Text before special character
              oNewElement.appendChild(oNewElementText);

              for(var iSpecialCharIndex=0; iSpecialCharIndex<aSpecialChars.length; iSpecialCharIndex++) {
                if(eval('\''+aSpecialChars[iSpecialCharIndex].sChar+'\'') == sNodeText.charAt(oSpecialCharRegExpResults.index))
                  sReplacement = aSpecialChars[iSpecialCharIndex].sReplacement;
              }

              var oElementHighlight = oResults.createElement('span');

              oElementHighlight.setAttribute('style','background-color:'+RExT.main.oPreferences.getCharPref('specialCharsBackgroundColor'));
              oElementHighlight.appendChild(oResults.createTextNode(sReplacement));
              oNewElement.appendChild(oElementHighlight);

              iStartPosition = oSpecialCharRegExpResults.index + oSpecialCharRegExpResults[0].length;
            }
            oNewElementText = oResults.createTextNode(sNodeText.substring(iStartPosition,sNodeText.length));
            oNewElement.appendChild(oNewElementText);
          } else {
            var sDisplayString = sNodeText;
            for(var iSpecialCharIndex=0; iSpecialCharIndex<aSpecialChars.length; iSpecialCharIndex++)
              sDisplayString = sDisplayString.replace(eval('/'+aSpecialChars[iSpecialCharIndex].sChar+'/g'),aSpecialChars[iSpecialCharIndex].sReplacement);

            oNewElement.appendChild(oResults.createTextNode(sDisplayString));
          }
          break;

        default:
          oNewElement.appendChild(RExT.main.duplicateElement(oElement.childNodes[iChildIndex]));
      }
    }

    return oNewElement;
  },



  // Replaces the newlines by HTML BR tags
  nlToBr: function(oElement) {
    var oResults    = document.getElementById('results').contentDocument;
    var oNewElement = oResults.createElement(oElement.nodeName);

    for(var iAttributeIndex=0; iAttributeIndex<oElement.attributes.length; iAttributeIndex++) {
      oAttributeNode = oElement.attributes[iAttributeIndex];

      oNewElement.setAttribute(oAttributeNode.nodeName,oAttributeNode.nodeValue);
    }

    for(var iChildIndex=0; iChildIndex<oElement.childNodes.length; iChildIndex++) {
      switch(oElement.childNodes[iChildIndex].nodeType) {
        case Node.ELEMENT_NODE:
          oNewElement.appendChild(RExT.main.nlToBr(oElement.childNodes[iChildIndex]));
          break;

        case Node.TEXT_NODE:
          var oNLRegExp        = /\n/g;
          var oNLRegExpResults = null;
          var sNodeText        = oElement.childNodes[iChildIndex].nodeValue;
          var oNewElementText  = null;
          var oBreak           = null;
          var iStartPosition   = 0;

          while((oNLRegExpResults = oNLRegExp.exec(sNodeText)) != null) {
            oNewElementText = oResults.createTextNode(sNodeText.substring(iStartPosition,oNLRegExpResults.index));
            oNewElement.appendChild(oNewElementText);

            oBreak = oResults.createElement('br');
            oNewElement.appendChild(oBreak);

            iStartPosition = oNLRegExpResults.index + oNLRegExpResults[0].length - 1;
          }
          oNewElementText = oResults.createTextNode(sNodeText.substring(iStartPosition,sNodeText.length));
          oNewElement.appendChild(oNewElementText);
          break;

        default:
          oNewElement.appendChild(oElement.childNodes[iChildIndex]);
      }
    }

    return oNewElement;
  },



  // Returns the replacement text including back references
  getReplacementText: function(sReplacementText,aResult) {
    var sParsedReplacementText = sReplacementText;
    var oRegExp                = null;
    var oRegExpResults         = null;
    var sBackReference         = '';

    for(var iBackReferenceRIndex=0; iBackReferenceRIndex<aResult.length; iBackReferenceRIndex++) {
      oRegExp        = eval('/\\$'+iBackReferenceRIndex+'/');
      sBackReference = RExT.main.sSearchText.substr(aResult[iBackReferenceRIndex][0],aResult[iBackReferenceRIndex][1]);
      sParsedReplacementText = sParsedReplacementText.replace(oRegExp,sBackReference);
    }
    oRegExp = eval('/\\$[0-9]/');
    sParsedReplacementText = sParsedReplacementText.replace(oRegExp,'');

    return sParsedReplacementText;
  },



  // Updates the duration and matches display
  updateStatusBar: function() {
    var oDuration     = document.getElementById('duration');
    var oMatches      = document.getElementById('matches');
    var bResultsExist = (RExT.main.sRegExp != '' && RExT.main.sSearchText != '');

    oDuration.label = RExT.getLocaleString('duration')+': '+(bResultsExist ? RExT.getLocaleString('ms',[RExT.main.iDuration]) : '-');
    oMatches.label  = RExT.getLocaleString('matches')+': '+(bResultsExist ? RExT.main.aResults.length : '-');
  },



  // Opens the dialog for saving the current regular expression
  saveRegExp: function() {
    var oNewRegExp = new RExT.regExp('',
                                     document.getElementById('regExp').value,
                                     (document.getElementById('caseSensitive').checked ? 'i' : '')+
                                     (document.getElementById('global').checked ? 'g' : '')+
                                     (document.getElementById('multiline').checked ? 'm' : ''),
                                     document.getElementById('replace').checked ? document.getElementById('replacement').value : null);

    window.openDialog('chrome://rext/content/editSavedRegExp.xul','','chrome',oNewRegExp);
  },



  // Inserts a saved regular expression
  insertSavedRegExp: function() {
    var sSavedRegExpName    = document.getElementById('savedRegExps').value;
    var oSavedRegExp        = RExT.savedRegExps.getSavedRegExp(sSavedRegExpName);
    var oRegExp             = document.getElementById('regExp');
    var oCaseSensitive      = document.getElementById('caseSensitive');
    var oGlobal             = document.getElementById('global');
    var oMultiline          = document.getElementById('multiline');
    var oReplace            = document.getElementById('replace');
    var oReplacement        = document.getElementById('replacement');
    var bUpdateWhileWriting = RExT.main.oPreferences.getBoolPref('updateWhileWriting');

    if(RExT.main.sRegExp == '' ||
       (RExT.main.sRegExp != '' && oSavedRegExp.sExpression != RExT.main.sRegExp &&
        confirm(RExT.getLocaleString('regExpReplaceQuestion')))) {
      oRegExp.value          = oSavedRegExp.sExpression;
      RExT.main.setRegExp(oRegExp.value);
      RExT.main.toggleSaveRegExpActivation();
      oCaseSensitive.checked = oSavedRegExp.bCaseSensitive;
      RExT.main.setCaseSensitive(oCaseSensitive.checked);
      oGlobal.checked        = oSavedRegExp.bGlobal;
      RExT.main.setGlobal(oGlobal.checked);
      oMultiline.checked     = oSavedRegExp.bMultiline;
      RExT.main.setMultiline(oMultiline.checked);
      oReplace.checked       = (oSavedRegExp.sReplacement != null ? true : false);
      RExT.main.setReplace(oReplace.checked);
      oReplacement.value     = (oSavedRegExp.sReplacement != null ? oSavedRegExp.sReplacement : '');
      RExT.main.setReplacement(oReplacement.value);
      RExT.main.toggleReplacementActivation();
      if(!bUpdateWhileWriting)
        RExT.main.toggleTestActivation();
      RExT.main.toggleCopyRegExpToClipboardActivation();
      RExT.main.test();
    }
  },



  // Copies the current regular expression to the clipboard
  copyRegExpToClipboard: function() {
    RExT.copyToClipboard(RExT.main.prepareRegExp(RExT.main.sRegExp));
  }
};



// Add event listener for initialising the main dialog
window.addEventListener('load',RExT.main.init,false);
window.addEventListener('unload',RExT.main.close,false);